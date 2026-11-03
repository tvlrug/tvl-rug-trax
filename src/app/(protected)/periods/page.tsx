import {periods,report,add,pct,fmt,OPS,styleInput} from '@/lib/trax-reporting';
import type {Filters,Period,Service} from '@/lib/trax-reporting';
import {Intro,Notice,ReportError,tableStyle,td,pointDelta,subtle} from '@/components/TraxReportUI';
export const dynamic='force-dynamic';
const id=(p:Period)=>`${p.railway_year}|${p.period_number}`;
const threshold=(rows:Service[],n:'tt3'|'tt5'|'tt15')=>{const d=add(rows,`measured_${n}` as keyof Service);return d>0?100*add(rows,`within_${n}` as keyof Service)/d:null;};
export default async function Periods({searchParams}:{searchParams:Promise<Filters>}){
 const q=await searchParams;let list:Period[]=[];let error='';try{list=await periods()}catch(e){error=e instanceof Error?e.message:String(e)};
 const a=list.find(p=>id(p)===q.a)??list[1]??list[0],b=list.find(p=>id(p)===q.b)??list[0]??list[1];
 const op=q.operator&&OPS.includes(q.operator as typeof OPS[number])?q.operator:'ALL',ops=op==='ALL'?[...OPS]:[op];
 const read=async(p:Period|undefined)=>{if(!p)return null;const start=p.start_date<'2025-09-20'?'2025-09-20':p.start_date;const yesterday=new Date();yesterday.setUTCHours(0,0,0,0);yesterday.setUTCDate(yesterday.getUTCDate()-1);const end=p.end_date>yesterday.toISOString().slice(0,10)?yesterday.toISOString().slice(0,10):p.end_date;if(start>end)return null;return {start,end,partial:start!==p.start_date||end!==p.end_date,data:await report(start,end,ops)};};
 let left:Awaited<ReturnType<typeof read>>=null,right:Awaited<ReturnType<typeof read>>=null;
 if(!error&&a&&b)try{[left,right]=await Promise.all([read(a),read(b)])}catch(e){error=e instanceof Error?e.message:String(e)};
 const rowsA=left?.data.services??[],rowsB=right?.data.services??[];
 const countFields=[{label:'Recorded services',field:'recorded_services'},{label:'Full cancellations',field:'full_cancellations'},{label:'Part cancellations',field:'part_cancellations'}] as const;
 return <><Intro title="Railway periods" subtitle="Compare two published reporting periods, including changes and measured-service denominators."/>
 <form method="get" action="/periods" style={{display:'flex',gap:14,flexWrap:'wrap',alignItems:'end'}}><label style={{display:'grid',gap:7}}>Period A<select name="a" style={styleInput} defaultValue={a?id(a):''}>{list.map(p=><option key={id(p)} value={id(p)}>{p.period_label} ({p.start_date} to {p.end_date})</option>)}</select></label><label style={{display:'grid',gap:7}}>Period B<select name="b" style={styleInput} defaultValue={b?id(b):''}>{list.map(p=><option key={id(p)} value={id(p)}>{p.period_label} ({p.start_date} to {p.end_date})</option>)}</select></label><label style={{display:'grid',gap:7}}>Operator<select name="operator" style={styleInput} defaultValue={op}><option value="ALL">All operators</option>{OPS.map(o=><option value={o} key={o}>{o}</option>)}</select></label><button className="loginbutton" type="submit">Compare periods</button></form>
 {error?<ReportError message={`Cannot read reporting periods: ${error}`}/>:!left||!right||!a||!b?<ReportError message="No published records available for one or both selected periods."/>:<>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14,marginTop:22}}>{([{p:a,x:left},{p:b,x:right}]).map(({p,x},i)=><section key={i} className="card"><h2>{p.period_label}</h2><p style={subtle}>{x.start} to {x.end}{x.partial?' · Partial period':''}</p><Notice ok={x.data.ok} verified={x.data.verified} unverified={x.data.unverified} actual={x.data.coverage.length} expected={x.data.expected}/></section>)}</div>
 {left.data.ok&&right.data.ok&&<><h2 style={{marginTop:26}}>Period-on-period comparison</h2><div style={{overflowX:'auto'}}><table style={tableStyle}><thead><tr>{['Metric',a.period_label,b.period_label,'Change (B − A)'].map(x=><th key={x} style={td}>{x}</th>)}</tr></thead><tbody>
 {countFields.slice(0,1).map(x=>{const av=add(rowsA,x.field),bv=add(rowsB,x.field);return <tr key={x.label}><td style={td}>{x.label}</td><td style={td}>{fmt(av)}</td><td style={td}>{fmt(bv)}</td><td style={td}>{bv-av>=0?'+':''}{fmt(bv-av)}</td></tr>})}
 {(['tt3','tt5','tt15'] as const).map(n=>{const av=threshold(rowsA,n),bv=threshold(rowsB,n);return <tr key={n}><td style={td}>{n.toUpperCase()}</td><td style={td}>{av===null?'—':av.toFixed(1)+'%'}</td><td style={td}>{bv===null?'—':bv.toFixed(1)+'%'}</td><td style={td}>{pointDelta(av,bv)}</td></tr>})}
 <tr><td style={td}>Measured TT3 denominator</td><td style={td}>{fmt(add(rowsA,'measured_tt3'))}</td><td style={td}>{fmt(add(rowsB,'measured_tt3'))}</td><td style={td}>—</td></tr>
 {countFields.slice(1).map(x=>{const av=add(rowsA,x.field),bv=add(rowsB,x.field);return <tr key={x.label}><td style={td}>{x.label}</td><td style={td}>{fmt(av)}</td><td style={td}>{fmt(bv)}</td><td style={td}>{bv-av>=0?'+':''}{fmt(bv-av)}</td></tr>})}
 </tbody></table></div><p style={subtle}>Percentage changes are percentage points, not relative percent changes. Counts are absolute, not rates. A partial period cannot be compared directly with a complete period without adjusting for coverage. All results remain provisional unless independently source-verified.</p></>}
 </>}
 </>;
}
