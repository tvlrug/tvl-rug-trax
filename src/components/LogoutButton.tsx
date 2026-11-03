import { logout } from "@/app/actions";
export function LogoutButton(){return <form action={logout}><button className="logoutbutton" type="submit">Sign out</button></form>}
