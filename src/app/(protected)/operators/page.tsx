import {windowFor,report,OPS,add,pct,fmt} from '@/lib/trax-reporting';
import type {Filters,Service} from '@/lib/trax-reporting';
import {Intro,FiltersForm,Notice,Metrics,ReportError,HorizontalBar,percentValue,tableStyle,td,subtle} from '@/components/TraxReportUI';
export const dynamic='force-dynamic';
const names: Record<string,string>={NT:'Northern',TPE:'TransPennine Express',GC:'Grand Central',LNER:'LNER'};
export default async function Operators({searchParams}:{searchParams:Promise<Filters>}){
 const q=await searchParams,w=windowFor(q);let r:Awaited<ReturnType<typeof report>>|null=null;let error='';
 if(w.valid)try{r=await report(w.start,w.end,w.ops)}catch(e){error=e instanceof Error?e.message:String(e)};
 const comparisons=w.ops.map(op=>{const rows=(r?.services??[]).filter(x=>x.operator_code===op);const cov=(r?.coverage??[]).filter(x=>x.operator_code===op);return {op,rows,cov,measured:add(rows,'measured_tt3'),within:add(rows,'within_tt3')};});
 return <><Intro title="Operators" subtitle="Compare reportable services, measured punctuality and cancellation counts by train operator."/><FiltersForm path="/operators" q={q} {...w}/>
 {!w.valid?<ReportError message="Choose a valid date range of up to 31 days."/>:error?<ReportError message={`Cannot read operator performance: ${error}`}/>:r&&<><Notice ok={r.ok} verified={r.verified} unverified={r.unverified} actual={r.coverage.length} expected={r.expected}/>{r.ok&&<>
 <Metrics rows={r.services}/><h2 style={{marginTop:26}}>TT3 operator comparison</h2><section className="card"><p style={subtle}>Each bar uses measured services as its denominator. No measurement is shown as —, not 0%.</p>{comparisons.map(x=><HorizontalBar key={x.op} label={`${x.op} · ${names[x.op]}`} percent={percentValue(x.within,x.measured)} detail={`${fmt(x.within)} of ${fmt(x.measured)} measured services`}/>)}</section>
 <h2 style={{marginTop:26}}>Operator breakdown</h2><div style={{overflowX:'auto'}}><table style={tableStyle}><thead><tr>{['Operator','Services','TT3','TT3 measured','TT5','TT15','Full canc.','Part canc.','Assurance'].map(x=><th key={x} style={td}>{x}</th>)}</tr></thead><tbody>{comparisons.map(({op,rows,cov,measured,within})=><tr key={op}><td style={td}><strong>{names[op]} ({op})</strong></td><td style={td}>{fmt(add(rows,'recorded_services'))}</td><td style={td}>{pct(within,measured)}</td><td style={td}>{fmt(measured)}</td><td style={td}>{pct(add(rows,'within_tt5'),add(rows,'measured_tt5'))}</td><td style={td}>{pct(add(rows,'within_tt15'),add(rows,'measured_tt15'))}</td><td style={td}>{fmt(add(rows,'full_cancellations'))}</td><td style={td}>{fmt(add(rows,'part_cancellations'))}</td><td style={td}>{cov.length>0&&cov.every(x=>x.overall_coverage_status==='VERIFIED')?'Verified':'Provisional'}</td></tr>)}</tbody></table></div>
 <p style={subtle}>TT3/TT5/TT15 use summed within-threshold counts divided by summed measured services. Cancellation counts are not percentages. Provisional data is not independent assurance of complete RTT capture.</p>
 </>}</>}
 </>;
}
