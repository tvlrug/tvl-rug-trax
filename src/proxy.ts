import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieWrite = {
 name: string;
 value: string;
 options?: Parameters<NextResponse["cookies"]["set"]>[2];
};
export async function proxy(request:NextRequest) {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if (!url || !key) return NextResponse.next({request}); // Protected server layout fails closed.
 let response=NextResponse.next({request});
 const supabase=createServerClient(url,key,{cookies:{
  getAll(){return request.cookies.getAll()},
  setAll(items: CookieWrite[]){
   items.forEach(({name,value})=>request.cookies.set(name,value));
   response=NextResponse.next({request});
   items.forEach(({name,value,options})=>response.cookies.set(name,value,options));
  }
 }});
 await supabase.auth.getUser(); // Validate/refresh JWT; authorization still checked server-side.
 return response;
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
