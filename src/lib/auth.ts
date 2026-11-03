import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function currentApprovedUser() {
 const supabase = await createSupabaseServerClient();
 const { data: {user}, error } = await supabase.auth.getUser();
 if (error || !user) return null;
 const {data, error: membershipError} = await supabase.from("trax_members")
  .select("user_id,is_active,access_role").eq("user_id",user.id).eq("is_active",true).maybeSingle();
 if (membershipError || !data) return null;
 return {user,role:data.access_role};
}
