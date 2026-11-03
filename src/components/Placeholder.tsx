import { Construction, Database, LockKeyhole } from "lucide-react";
export function Placeholder({heading,description,phase}:{heading:string;description:string;phase:string}) {return <>
 <span className="eyebrow">TRAX / {phase}</span><h1 className="title">{heading}</h1><p className="subtitle">{description}</p><div className="divider"/>
 <div className="cardgrid"><section className="card"><Construction size={24} color="#f26e6e"/><h3 style={{marginTop:15}}>Reporting section in development</h3><p>This section is not yet live. The secure navigation and page layout are available.</p><span className="tag">Not yet available</span></section>
 <section className="card"><Database size={24} color="#9eafc1"/><h3 style={{marginTop:15}}>No certified results displayed</h3><p>Reporting figures are withheld here until their source data and coverage are verified.</p></section>
 <section className="card"><LockKeyhole size={24} color="#9eafc1"/><h3 style={{marginTop:15}}>Access restricted</h3><p>Only approved TRAX members can access this area. Authentication and server-side authorization are required.</p></section></div>
 <div className="notice"><strong>Data integrity:</strong> TRAX will display reporting statistics only after the relevant publication and coverage checks are in place. The N3 historical correction remains a separate, controlled change.</div>
 </>}
