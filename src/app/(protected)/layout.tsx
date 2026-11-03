import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { currentApprovedUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function ProtectedLayout({children}:{children:React.ReactNode}) {
 const authorized = await currentApprovedUser();
 if (!authorized) redirect("/login");
 return <Shell>{children}</Shell>;
}
