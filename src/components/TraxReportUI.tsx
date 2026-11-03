import type { Filters } from '@/lib/trax-reporting';
import {OPS,fmt,pct,styleInput} from '@/lib/trax-reporting';
import type { Service } from '@/lib/trax-reporting';
export function Intro({title,subtitle}:{title:string;subtitle:string}) {return <><span className="eyebrow">TRAX / 09E · Historical analysis</span><h1 className="title">{title}</h1><p className="subtitle">{subtitle}</p><div className="divider" /></>}
export function FiltersForm({path,q,start,end,operator,station}:{path:string;q:Filters;start:string;end:string;operator:string;station?:boolean}) {return <form method="get" action={path} style={{display:'flex',flexWrap:'wrap',gap:14,alignItems:'end',marginBottom:22}}>
<label style={{display:'grid',gap:7}}>From<input type="date" name="start" defaultValue={start} min="2025-09-20" style={styleInput}/></label><label style={{display:'grid',gap:7}}>To<input type="date" name="end" defaultValue={end} style={styleInput}/></label><label style={{display:'grid',gap:7}}>Operator<select name="operator" defaultValue={operator} style={styleInput}><option value="ALL">All operators</option>{OPS.map(op=><option value={op} key={op}>{op}</option>)}</select></label>
{station&&<label style={{display:'grid',gap:7}}>Station CRS (optional)<input name="station" maxLength={3} defaultValue={q.station??''} placeholder="e.g. RCC" style={styleInput}/></label>}
<button className="loginbutton" type="submit">Apply filters</button></form>}
export function Notice({ok,verified,unverified,expected,actual}:{ok:boolean;verified:boolean;unverified:number;expected:number;actual:number}){return <div className="notice" role="status"><strong>{!ok?'Incomplete / inconsistent published window':verified?'Verified reporting window':'Provisional reporting window — UNVERIFIED'}</strong> · {actual} of {expected} expected operator-days. {!ok?'Aggregates withheld pending correction.':`${unverified} unverified operator-days. These are observed published results; source capture is not independently certified.`}</div>}
export function Metric({name,value,detail}:{name:string;value:string;detail?:string}) {return <section className="card"><p style={{color:'#aabbd0',fontSize:13}}>{name}</p><strong style={{fontSize:27,display:'block',margin:'17px 0 10px'}}>{value}</strong><p>{detail??'Provisional published data'}</p></section>}
export function Metrics({rows}:{rows:Service[]}){return <div className="cardgrid" style={{marginTop:20}}><Metric name="Recorded services" value={fmt(rows.reduce((n,r)=>n+Number(r.recorded_services),0))}/><Metric name="TT3" value={pct(rows.reduce((n,r)=>n+Number(r.within_tt3),0),rows.reduce((n,r)=>n+Number(r.measured_tt3),0))}/><Metric name="TT5" value={pct(rows.reduce((n,r)=>n+Number(r.within_tt5),0),rows.reduce((n,r)=>n+Number(r.measured_tt5),0))}/><Metric name="TT15" value={pct(rows.reduce((n,r)=>n+Number(r.within_tt15),0),rows.reduce((n,r)=>n+Number(r.measured_tt15),0))}/><Metric name="Full cancellations" value={fmt(rows.reduce((n,r)=>n+Number(r.full_cancellations),0))}/><Metric name="Part cancellations" value={fmt(rows.reduce((n,r)=>n+Number(r.part_cancellations),0))}/></div>}
export const tableStyle: React.CSSProperties={width:'100%',borderCollapse:'collapse',fontSize:14,marginTop:18};
export const td: React.CSSProperties={padding:'10px 12px',borderBottom:'1px solid #354354',textAlign:'left'};
export function ReportError({message}:{message:string}){return <div className="notice" role="alert">{message}</div>}

export const subtle: React.CSSProperties = {color:'#aabbd0',fontSize:13};
export function HorizontalBar({label,percent,detail,color='#db3644'}:{label:string;percent:number|null;detail?:string;color?:string}){
 const value=percent===null?null:Math.min(100,Math.max(0,percent));
 return <div style={{display:'grid',gridTemplateColumns:'minmax(85px,145px) 1fr minmax(56px,90px)',gap:12,alignItems:'center',margin:'10px 0'}}>
 <span style={{fontSize:13}}>{label}</span><div role="img" aria-label={`${label}: ${value===null?'no measured observations':value.toFixed(1)+'%'}`} style={{height:13,background:'#293445',borderRadius:7,overflow:'hidden'}}>{value!==null&&<div style={{height:'100%',width:`${value}%`,background:color,borderRadius:7}}/>}</div>
 <span style={{fontSize:13,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{value===null?'—':value.toFixed(1)+'%'}</span>{detail&&<span style={{gridColumn:'2 / -1',...subtle,marginTop:-8}}>{detail}</span>}
 </div>;
}
export const percentValue=(within:number,measured:number)=>measured>0?100*within/measured:null;
export const pointDelta=(x:number|null,y:number|null)=>x===null||y===null?'—':`${y-x>=0?'+':''}${(y-x).toFixed(1)} pp`;
