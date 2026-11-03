import { cookies } from "next/headers";

type CookieWrite = {
 name: string;
 value: string;
 options?: Parameters<(Awaited<ReturnType<typeof cookies>>)["set"]>[2];
};
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
 const store = await cookies();
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if (!url || !key) throw new Error("TRAX Supabase public configuration is missing.");
 return createServerClient(url, key, {
  cookies: {
   getAll() {return store.getAll()},
   setAll(items: CookieWrite[]) {
    try {items.forEach(({name,value,options}) => store.set(name,value,options));}
    catch { /* Server Component read: middleware refreshes session cookies. */ }
   },
  },
 });
}
