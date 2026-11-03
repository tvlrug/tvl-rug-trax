import type { CSSProperties } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Query = { start?: string; end?: string; operator?: string };
type Coverage = {
  operating_date: string;
  operator_code: string;
  recorded_services: number;
  processing_status: string;
  service_coverage_status: string;
  source_reconciliation_status: string;
  overall_coverage_status: string;
};
type Service = {
  operating_date: string;
  operator_code: string;
  recorded_services: number;
  measured_tt3: number;
  within_tt3: number;
  measured_tt5: number;
  within_tt5: number;
  measured_tt15: number;
  within_tt15: number;
  full_cancellations: number;
  part_cancellations: number;
  total_cancelled: number;
  processing_status: string;
  service_coverage_status: string;
  overall_coverage_status: string;
};

const OPS = ["NT", "TPE", "LNER", "GC"] as const;
const FIRST_DATE = "2025-09-20";
const iso = (d: Date) => d.toISOString().slice(0, 10);
const parseDay = (s: string | undefined): Date | null => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return !Number.isNaN(d.valueOf()) && iso(d) === s ? d : null;
};
const countDays = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
const pct = (num: number, den: number) => den > 0 ? `${(100 * num / den).toFixed(1)}%` : "—";
const number = (n: number) => n.toLocaleString("en-GB");
const sum = (rows: Service[], key: keyof Service) =>
  rows.reduce((a, row) => a + (Number(row[key]) || 0), 0);
const rowKey = (r: { operating_date: string; operator_code: string }) =>
  `${r.operating_date}:${r.operator_code}`;

export default async function Overview({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const latest = new Date();
  latest.setUTCHours(0, 0, 0, 0);
  latest.setUTCDate(latest.getUTCDate() - 1);
  const earliest = new Date(latest);
  earliest.setUTCDate(latest.getUTCDate() - 6);
  const start = parseDay(q.start) ?? earliest;
  const end = parseDay(q.end) ?? latest;
  const operator = q.operator && OPS.includes(q.operator as typeof OPS[number]) ? q.operator : "ALL";
  const invalid = start > end || countDays(start, end) > 31 || end > latest || iso(start) < FIRST_DATE;
  const selectedOperators = operator === "ALL" ? [...OPS] : [operator];

  let coverage: Coverage[] = [];
  let services: Service[] = [];
  let failure: string | null = null;
  if (!invalid) {
    const supabase = await createSupabaseServerClient();
    const [c, s] = await Promise.all([
      supabase.from("trax_coverage_daily")
        .select("operating_date,operator_code,recorded_services,processing_status,service_coverage_status,source_reconciliation_status,overall_coverage_status")
        .gte("operating_date", iso(start)).lte("operating_date", iso(end))
        .in("operator_code", selectedOperators).order("operating_date").order("operator_code").limit(150),
      supabase.from("trax_service_daily")
        .select("operating_date,operator_code,recorded_services,measured_tt3,within_tt3,measured_tt5,within_tt5,measured_tt15,within_tt15,full_cancellations,part_cancellations,total_cancelled,processing_status,service_coverage_status,overall_coverage_status")
        .gte("operating_date", iso(start)).lte("operating_date", iso(end))
        .in("operator_code", selectedOperators).order("operating_date").order("operator_code").limit(150),
    ]);
    if (c.error || s.error) {
      failure = "The published reporting datasets could not be read. No statistics have been calculated.";
    } else {
      coverage = (c.data ?? []) as Coverage[];
      services = (s.data ?? []) as Service[];
    }
  }

  const expected = invalid ? 0 : countDays(start, end) * selectedOperators.length;
  const coverageMap = new Map(coverage.map(c => [rowKey(c), c]));
  const serviceMap = new Map(services.map(s => [rowKey(s), s]));
  const duplicateKeys = new Set<string>();
  for (const rows of [coverage, services]) {
    const seen = new Set<string>();
    for (const r of rows) {
      const key = rowKey(r);
      if (seen.has(key)) duplicateKeys.add(key);
      seen.add(key);
    }
  }

  // Coverage contains one row per operator/day even if no trains operated.
  // Service daily contains a row ONLY when that operator/day has services.
  // Missing zero-service rows are therefore normal, not incomplete reporting.
  const missingService = coverage.filter(c => Number(c.recorded_services) > 0 && !serviceMap.has(rowKey(c)));
  const unexpectedService = services.filter(s => {
    const c = coverageMap.get(rowKey(s));
    return !c || Number(c.recorded_services) === 0;
  });
  const mismatchedService = services.filter(s => {
    const c = coverageMap.get(rowKey(s));
    return c && Number(c.recorded_services) !== Number(s.recorded_services);
  });
  const invalidAmounts = coverage.some(c => !Number.isSafeInteger(Number(c.recorded_services)) || Number(c.recorded_services) < 0) ||
    services.some(s => !Number.isSafeInteger(Number(s.recorded_services)) || Number(s.recorded_services) <= 0);
  const completeShape = coverage.length === expected && coverageMap.size === expected &&
    serviceMap.size === services.length && duplicateKeys.size === 0 &&
    missingService.length === 0 && unexpectedService.length === 0 &&
    mismatchedService.length === 0 && !invalidAmounts;

  const verified = completeShape &&
    coverage.every(c => c.overall_coverage_status === "VERIFIED") &&
    services.every(s => s.overall_coverage_status === "VERIFIED");
  const unverified = coverage.filter(c => c.overall_coverage_status !== "VERIFIED").length;
  const safeToShow = !invalid && !failure && completeShape;
  const data = safeToShow ? services : [];
  const range = `${iso(start)} to ${iso(end)}`;
  const evidenceDetail = verified ? "Verified coverage flag" : "Provisional published data — source coverage UNVERIFIED";
  const card = (label: string, value: string, detail: string) => (
    <section className="card" key={label}>
      <p style={{ color: "#aabbd0", fontSize: 13 }}>{label}</p>
      <strong style={{ fontSize: 29, display: "block", margin: "18px 0 12px" }}>{value}</strong>
      <p>{detail}</p>
    </section>
  );

  return <>
    <span className="eyebrow">TRAX / 09C · Published historical data</span>
    <h1 className="title">Historical overview</h1>
    <p className="subtitle">Recorded railway activity from the secured Supabase publication. Verification status is always shown separately.</p>
    <div className="divider" />
    <form method="get" action="/overview" aria-label="Historical report filters" style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: 14, marginBottom: 23 }}>
      <label style={{ display: "grid", gap: 7 }}>From<input aria-label="From date" name="start" type="date" defaultValue={iso(start)} min={FIRST_DATE} max={iso(latest)} style={inputStyle} /></label>
      <label style={{ display: "grid", gap: 7 }}>To<input aria-label="To date" name="end" type="date" defaultValue={iso(end)} min={FIRST_DATE} max={iso(latest)} style={inputStyle} /></label>
      <label style={{ display: "grid", gap: 7 }}>Operator<select name="operator" defaultValue={operator} style={inputStyle}><option value="ALL">All operators</option>{OPS.map(x => <option key={x} value={x}>{x}</option>)}</select></label>
      <button type="submit" className="loginbutton">Apply filters</button>
    </form>
    {invalid ? <div className="notice" role="alert">Choose a valid date range between 20 September 2025 and yesterday, no longer than 31 days.</div> :
     failure ? <div className="notice" role="alert">{failure}</div> : <>
      <div className="notice" role={safeToShow ? "status" : "alert"}>
        <strong>{!completeShape ? "Incomplete / inconsistent reporting window" : verified ? "Verified reporting window" : "Provisional reporting window — UNVERIFIED"}</strong>
        {` · ${range} · ${coverage.length} of ${expected} expected operator-days found. `}
        {unverified} coverage records are not marked VERIFIED. {completeShape
          ? `Coverage and service rows align (${services.length} operator-days with services; ${coverage.length - services.length} zero-service operator-days). This does not establish complete RTT source capture.`
          : `Reporting consistency check failed: ${missingService.length} missing nonzero service rows, ${unexpectedService.length} unexpected service rows, ${mismatchedService.length} service-count mismatches, ${duplicateKeys.size} duplicate keys. Aggregates are withheld.`}
      </div>
      <div className="cardgrid" style={{ marginTop: 24 }}>
        {card("Recorded services", safeToShow ? number(sum(data, "recorded_services")) : "—", evidenceDetail)}
        {card("TT3 punctuality", safeToShow ? pct(sum(data, "within_tt3"), sum(data, "measured_tt3")) : "—", safeToShow ? `${number(sum(data, "within_tt3"))} / ${number(sum(data, "measured_tt3"))} measured services · ${verified ? "verified" : "provisional"}` : "Unavailable: window incomplete or inconsistent")}
        {card("TT5 punctuality", safeToShow ? pct(sum(data, "within_tt5"), sum(data, "measured_tt5")) : "—", evidenceDetail)}
        {card("TT15 punctuality", safeToShow ? pct(sum(data, "within_tt15"), sum(data, "measured_tt15")) : "—", evidenceDetail)}
        {card("Full cancellations", safeToShow ? number(sum(data, "full_cancellations")) : "—", "Count only; no percentage denominator assumed")}
        {card("Part cancellations", safeToShow ? number(sum(data, "part_cancellations")) : "—", "Count only; no percentage denominator assumed")}
      </div>
      <div className="notice"><strong>Interpretation:</strong> TT3/TT5/TT15 use summed within-threshold service counts divided by summed measured service counts, not an average of daily percentages. Provisional figures are published observations, not independently certified operator performance. RTT source completeness remains separately assessed.</div>
     </>}
  </>;
}

const inputStyle: CSSProperties = {
  background: "#101925", color: "#edf3fa", border: "1px solid #435166",
  borderRadius: 9, padding: "10px 12px", font: "inherit",
};
