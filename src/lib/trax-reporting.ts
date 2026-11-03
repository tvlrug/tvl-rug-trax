import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Filters = { start?: string; end?: string; operator?: string; station?: string; a?: string; b?: string };
export type Coverage = { operating_date: string; operator_code: string; recorded_services: number; overall_coverage_status: string; service_coverage_status: string; source_reconciliation_status: string };
export type Service = { operating_date: string; operator_code: string; operator_name: string; recorded_services: number; measured_tt3: number; within_tt3: number; measured_tt5: number; within_tt5: number; measured_tt15: number; within_tt15: number; full_cancellations: number; part_cancellations: number; total_cancelled: number; overall_coverage_status: string };
export type Station = { operating_date: string; operator_code: string; station_crs: string; station_name: string; measurement_type: string; scheduled_calls: number; eligible_movements: number; measured_tt3: number; within_tt3: number; measured_tt5: number; within_tt5: number; measured_tt15: number; within_tt15: number; full_cancelled_calls: number; part_cancelled_calls: number; total_cancelled_calls: number; overall_coverage_status: string };
export type Period = { railway_year: string; period_number: number; period_label: string; start_date: string; end_date: string };
export const OPS = ["NT", "TPE", "GC", "LNER"] as const;
export const fmt = (n: number) => n.toLocaleString("en-GB");
export const pct = (n: number, d: number) => d ? `${(100*n/d).toFixed(1)}%` : "—";
export const add = <T,>(r: T[], key: keyof T) => r.reduce((s,x) => s + (Number(x[key]) || 0),0);
export const key = (x: {operating_date:string;operator_code:string}) => `${x.operating_date}:${x.operator_code}`;
const iso = (d: Date) => d.toISOString().slice(0,10);
const parsed = (v?: string) => { if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null; const d=new Date(v+'T00:00:00Z'); return !Number.isNaN(d.getTime()) && iso(d)===v ? d : null; };
export function windowFor(q: Filters, maxDays=31) {
  const yesterday=new Date(); yesterday.setUTCHours(0,0,0,0); yesterday.setUTCDate(yesterday.getUTCDate()-1);
  const defStart=new Date(yesterday); defStart.setUTCDate(defStart.getUTCDate()-6);
  const from=parsed(q.start) ?? defStart, to=parsed(q.end) ?? yesterday;
  const start=iso(from), end=iso(to);
  const days=Math.round((to.getTime()-from.getTime())/86400000)+1;
  const valid=days>0 && days<=maxDays && start>='2025-09-20' && to<=yesterday;
  const op=q.operator && OPS.includes(q.operator as typeof OPS[number])?q.operator:'ALL';
  return {start,end,days,valid,operator:op,ops:op==='ALL'?[...OPS]:[op]};
}
export const styleInput: React.CSSProperties = {background:'#101925',color:'#edf3fa',border:'1px solid #435166',borderRadius:9,padding:'10px 12px',font:'inherit'};
export async function readRows<T>(table: string, fields:string, start:string,end:string,ops:string[], maxRows=10000):Promise<T[]> {
  const db=await createSupabaseServerClient();
  const out:T[]=[];
  for(let offset=0;offset<maxRows;offset+=500) {
    let query=db.from(table).select(fields).gte('operating_date',start).lte('operating_date',end).in('operator_code',ops)
      .order('operating_date').order('operator_code');
    if(table==='trax_station_daily') query=query.order('station_crs').order('measurement_type');
    const {data,error}=await query.range(offset,offset+499);
    if(error) throw new Error(`${table}: ${error.message}`);
    const rows=(data??[]) as unknown as T[]; out.push(...rows);
    if(rows.length<500) return out;
  }
  throw new Error(`Safety limit reached reading ${table}; narrow date window`);
}
export async function report(start:string,end:string,ops:string[],withStations=false) {
  const [coverage,services,stations]=await Promise.all([
    readRows<Coverage>('trax_coverage_daily','operating_date,operator_code,recorded_services,overall_coverage_status,service_coverage_status,source_reconciliation_status',start,end,ops),
    readRows<Service>('trax_service_daily','operating_date,operator_code,operator_name,recorded_services,measured_tt3,within_tt3,measured_tt5,within_tt5,measured_tt15,within_tt15,full_cancellations,part_cancellations,total_cancelled,overall_coverage_status',start,end,ops),
    withStations ? readRows<Station>('trax_station_daily','operating_date,operator_code,station_crs,station_name,measurement_type,scheduled_calls,eligible_movements,measured_tt3,within_tt3,measured_tt5,within_tt5,measured_tt15,within_tt15,full_cancelled_calls,part_cancelled_calls,total_cancelled_calls,overall_coverage_status',start,end,ops):Promise.resolve([])
  ]);
  const days=Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
  const expected=days*ops.length;
  const cm=new Map(coverage.map(c=>[key(c),c]));
  const sm=new Map(services.map(s=>[key(s),s]));
  const shape=coverage.length===expected && cm.size===expected && sm.size===services.length &&
    coverage.every(c=>Number.isSafeInteger(Number(c.recorded_services)) && Number(c.recorded_services)>=0 && (Number(c.recorded_services)===0 || sm.has(key(c)))) &&
    services.every(s=>{const c=cm.get(key(s));return c && Number(s.recorded_services)>0 && Number(c.recorded_services)===Number(s.recorded_services);});
  const stationKeys=new Set(stations.map(s=>[s.operating_date,s.operator_code,s.station_crs,s.measurement_type].join(':')));
  const stationsShape=!withStations || (stationKeys.size===stations.length && stations.every(s=>cm.has(key(s)) && ['ARRIVAL','DEPARTURE'].includes(s.measurement_type)));
  return {coverage,services,stations,ok:shape && stationsShape,expected,verified:coverage.every(c=>c.overall_coverage_status==='VERIFIED') && services.every(s=>s.overall_coverage_status==='VERIFIED'),unverified:coverage.filter(c=>c.overall_coverage_status!=='VERIFIED').length};
}
export async function periods():Promise<Period[]> {
  const db=await createSupabaseServerClient();
  const {data,error}=await db.from('trax_reporting_periods').select('railway_year,period_number,period_label,start_date,end_date').order('start_date',{ascending:false}).limit(200);
  if(error)throw new Error(error.message);
  return (data??[]) as Period[];
}
