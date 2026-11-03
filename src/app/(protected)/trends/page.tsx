import {windowFor,report,add,pct,fmt} from '@/lib/trax-reporting';
import type {Filters,Service} from '@/lib/trax-reporting';
import {Intro,FiltersForm,Notice,ReportError,tableStyle,td,subtle} from '@/components/TraxReportUI';
export const dynamic='force-dynamic';
const palette:Record<string,string>={NT:'#e43b49',TPE:'#66b1ff',GC:'#e5b55f',LNER:'#81d5bb'};
export default async function Trends({searchParams}:{searchParams:Promise<Filters>}){
 const q=await searchParams,w=windowFor(q);let r:Awaited<ReturnType<typeof report>>|null=null;let error='';
 if(w.valid)try{r=await report(w.start,w.end,w.ops)}catch(e){error=e instanceof Error?e.message:String(e)};
 const days:string[]=[];if(w.valid)for(let t=Date.parse(w.start);t<=Date.parse(w.end);t+=86400000)days.push(new Date(t).toISOString().slice(0,10));
 const byDay=new Map<string,Service[]>();for(const s of r?.services??[])byDay.set(s.operating_date,[...(byDay.get(s.operating_date)??[]),s]);
 const line=(op:string)=>days.map((day,i)=>{const rows=(byDay.get(day)??[]).filter(s=>s.operator_code===op);const measured=add(rows,'measured_tt3');return measured?{x:55+i*890/Math.max(1,days.length-1),y:220-1.8*100*add(rows,'within_tt3')/measured,day,measured}:null});
 const allLines=w.operator==='ALL'?w.ops:[''+w.operator];
 return <><Intro title="Trends" subtitle="Daily measured-service punctuality over time, with separate operator lines and sample sizes."/><FiltersForm path="/trends" q={q} {...w}/>
 {!w.valid?<ReportError message="Choose a valid date range up to 31 days."/>:error?<ReportError message={`Cannot read trends: ${error}`}/>:r&&<><Notice ok={r.ok} verified={r.verified} unverified={r.unverified} expected={r.expected} actual={r.coverage.length}/>{r.ok&&<>
 <h2 style={{marginTop:26}}>TT3 over time</h2><section className="card"><div style={{display:'flex',gap:20,flexWrap:'wrap',marginBottom:10}}>{allLines.map(op=><span key={op} style={{color:palette[op]??'#fff',fontSize:13}}>● {op}</span>)}</div>
 <div style={{overflowX:'auto'}}><svg viewBox="0 0 990 265" style={{width:'100%',minWidth:450,height:'auto'}} role="img" aria-label="Daily TT3 punctuality as separate operator trend lines; exact values and measured denominators are in the table below">
 {[0,25,50,75,100].map(v=><g key={v}><line x1="55" x2="945" y1={220-v*1.8} y2={220-v*1.8} stroke="#344255" strokeWidth="1"/><text x="46" y={224-v*1.8} fill="#b4c5d8" fontSize="12" textAnchor="end">{v}%</text></g>)}
 {allLines.map(op=>{const points=line(op),segments:typeof points[]=[];let current:typeof points=[];for(const point of points){if(point)current.push(point);else if(current.length){segments.push(current);current=[];}}if(current.length)segments.push(current);return <g key={op}>{segments.map((segment,i)=><polyline key={i} fill="none" stroke={palette[op]??'#fff'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={segment.map(p=>`${p!.x},${p!.y}`).join(' ')}/>)}{points.filter(p=>p!==null).map(p=><circle key={p!.day} cx={p!.x} cy={p!.y} r="3.6" fill={palette[op]??'#fff'}/>)}</g>})}
 {days.filter((_,i)=>i===0||i===days.length-1||i%Math.max(1,Math.ceil(days.length/6))===0).map(day=><text key={day} x={55+days.indexOf(day)*890/Math.max(1,days.length-1)} y="245" fontSize="12" fill="#b4c5d8" textAnchor="middle">{day.slice(5)}</text>)}
 </svg></div><p style={subtle}>Gaps indicate no measured TT3 observations; they are not plotted as zero punctuality. Daily denominators appear below.</p></section>
 <h2 style={{marginTop:25}}>Daily detail</h2><div style={{overflowX:'auto'}}><table style={tableStyle}><thead><tr>{['Date','Operator','Services','Measured TT3','TT3','TT5','TT15','Full canc.','Part canc.'].map(x=><th key={x} style={td}>{x}</th>)}</tr></thead><tbody>{days.flatMap(day=>w.ops.map(op=>{const rows=(byDay.get(day)??[]).filter(x=>x.operator_code===op);return <tr key={`${day}:${op}`}><td style={td}>{day}</td><td style={td}>{op}</td><td style={td}>{fmt(add(rows,'recorded_services'))}</td><td style={td}>{fmt(add(rows,'measured_tt3'))}</td><td style={td}>{pct(add(rows,'within_tt3'),add(rows,'measured_tt3'))}</td><td style={td}>{pct(add(rows,'within_tt5'),add(rows,'measured_tt5'))}</td><td style={td}>{pct(add(rows,'within_tt15'),add(rows,'measured_tt15'))}</td><td style={td}>{fmt(add(rows,'full_cancellations'))}</td><td style={td}>{fmt(add(rows,'part_cancellations'))}</td></tr>}))}</tbody></table></div>
 <p style={subtle}>Each percentage is within-threshold services divided by measured services for that operator/day. The four lines are independent, not a pooled operator average. Results remain provisional until source assurance is completed.</p>
 </>}</>}
 </>;
}
