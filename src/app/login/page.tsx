import { redirect } from "next/navigation";
import { currentApprovedUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
export const dynamic="force-dynamic";
export default async function LoginPage() {
 const user=await currentApprovedUser();
 if (user) redirect("/overview");
 return <div className="loginpage"><div className="loginbox">
  <div className="loginbrand"><span className="brandmark">T</span><div><strong>TRAX</strong><small>TRAIN REPORTING & ANALYTICS EXPLORER</small></div></div>
  <p className="eyebrow">TVL-RUG Digital Services / Secure access</p><h1 className="title">Sign in to TRAX</h1>
  <p className="subtitle">Secure access to historical railway intelligence for approved members.</p>
  <LoginForm/><p className="loginfooter">Access is restricted to authorised TRAX members. No public registration.</p>
 </div></div>;
}
