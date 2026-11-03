"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = {error:string};
export async function login(_prior:LoginState, formData:FormData):Promise<LoginState> {
 const email = String(formData.get("email") ?? "").trim();
 const password = String(formData.get("password") ?? "");
 if (!email || !password || email.length > 254 || password.length > 1024) return {error:"Enter your email and password."};
 const supabase = await createSupabaseServerClient();
 const {error} = await supabase.auth.signInWithPassword({email,password});
 if (error) return {error:"Sign-in failed. Check your credentials or contact the TRAX administrator."};
 const {data:{user},error:identityError} = await supabase.auth.getUser();
 if (identityError || !user) {await supabase.auth.signOut();return {error:"Unable to validate your session."};}
 const {data:member,error:memberError} = await supabase.from("trax_members")
   .select("is_active").eq("user_id",user.id).eq("is_active",true).maybeSingle();
 if (memberError || !member) {
  await supabase.auth.signOut();
  return {error:"This account has not been approved for TRAX access. Contact your administrator."};
 }
 redirect("/overview");
}
export async function logout() {
 const supabase=await createSupabaseServerClient();
 await supabase.auth.signOut();
 redirect("/login");
}
