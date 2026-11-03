"use client";
import {useActionState} from "react";
import {useFormStatus} from "react-dom";
import {login, type LoginState} from "@/app/actions";
function Submit(){const {pending}=useFormStatus();return <button className="loginbutton" disabled={pending} type="submit">{pending?"Signing in…":"Sign in"}</button>}
export function LoginForm() {
 const [state,action]=useActionState<LoginState,FormData>(login,{error:""});
 return <form action={action} className="loginform">
   <label htmlFor="email">Email address</label><input id="email" name="email" type="email" required autoComplete="username" maxLength={254}/>
   <label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password"/>
   {state.error && <p role="alert" className="loginerror">{state.error}</p>}
   <Submit/>
 </form>;
}
