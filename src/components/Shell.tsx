"use client";
import { LogoutButton } from "@/components/LogoutButton";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, TrainFront, MapPin, ChartNoAxesCombined, CalendarRange, ShieldCheck } from "lucide-react";

const navigation = [
  {label:"Overview",href:"/overview",Icon:LayoutDashboard},
  {label:"Operators",href:"/operators",Icon:TrainFront},
  {label:"Stations",href:"/stations",Icon:MapPin},
  {label:"Trends",href:"/trends",Icon:ChartNoAxesCombined},
  {label:"Railway periods",href:"/periods",Icon:CalendarRange},
  {label:"Data quality",href:"/data-quality",Icon:ShieldCheck},
];
const storageKey = "trax:09f2:report-filters";
type FilterContext = { start?: string; end?: string; operator?: string };
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const operators = new Set(["ALL","NT","TPE","GC","LNER"]);
function valid(ctx: FilterContext): FilterContext {
  const result: FilterContext = {};
  if(ctx.start && datePattern.test(ctx.start)) result.start=ctx.start;
  if(ctx.end && datePattern.test(ctx.end)) result.end=ctx.end;
  if(ctx.operator && operators.has(ctx.operator)) result.operator=ctx.operator;
  return result;
}
function currentContext(): FilterContext {
  const q = new URLSearchParams(window.location.search);
  return valid({start:q.get("start")??undefined,end:q.get("end")??undefined,operator:q.get("operator")??undefined});
}
function linkFor(href:string, filters:FilterContext):string {
  if(href==="/data-quality")return href;
  const q = new URLSearchParams();
  if(href!=="/periods"){
    if(filters.start)q.set("start",filters.start);
    if(filters.end)q.set("end",filters.end);
  }
  if(filters.operator)q.set("operator",filters.operator);
  return q.size?`${href}?${q.toString()}`:href;
}
export function Shell({children}:{children:React.ReactNode}) {
  const pathname=usePathname();
  const searchParams=useSearchParams();
  const [filters,setFilters]=useState<FilterContext>({});
  useEffect(()=>{
    // Read session-only preferences on each route change. Report pages remain
    // authoritative: a filter is persisted only after it appears in the URL.
    const page=currentContext();
    let stored:FilterContext={};
    try {stored=valid(JSON.parse(sessionStorage.getItem(storageKey)??"{}") as FilterContext);}catch{ /* ignore stale storage */ }
    const merged=valid({...stored,...page});
    setFilters(merged);
    try {sessionStorage.setItem(storageKey,JSON.stringify(merged));}catch{ /* storage disabled */ }
  },[pathname,searchParams]);
  const selection=[filters.start&&filters.end?`${filters.start} to ${filters.end}`:null,filters.operator&&filters.operator!=="ALL"?filters.operator:null].filter(Boolean).join(" · ");
  return <div className="shell">
    <a href="#main" className="trax-skip-link">Skip to reporting content</a>
    <aside className="sidebar" aria-label="TRAX navigation">
      <div className="brand"><div className="brandmark">T</div><div><strong>TRAX</strong><small>TRAIN REPORTING & ANALYTICS</small></div></div>
      <div className="navlabel">WORKSPACE</div>
      <nav className="nav" aria-label="Reporting sections">{navigation.map(({label,href,Icon})=><Link key={href} href={linkFor(href,filters)} className={`navlink${pathname===href?" active":""}`} aria-current={pathname===href?"page":undefined}><Icon size={18} aria-hidden="true" />{label}</Link>)}</nav>
      <LogoutButton/><div className="asidefoot">TVL-RUG Digital Services<br/>TVL-RUG · Member reporting</div>
    </aside>
    <div className="main"><header className="topbar"><div><div className="topbrand">Historical Rail Intelligence</div>{selection&&<div className="trax-context" title="Filters retained when changing reporting sections">Reporting selection: {selection}</div>}</div><b>MEMBERS ONLY</b></header><main id="main" className="content" tabIndex={-1}>{children}</main></div>
  </div>;
}
