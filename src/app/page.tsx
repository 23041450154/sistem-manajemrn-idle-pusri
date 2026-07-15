import { getCurrentUserAction } from "@/action/auth";
import { redirect } from "next/navigation";



export default async function Home() {
  const { token, user } = await getCurrentUserAction();

  if(token && user) {
    const routes: Record<string, string> = {
      "ADMIN": "/admin",
      "USER": "/user",
    }

    const role = user.role || "USER";
    redirect(routes[role] || "/login");
  }
  redirect("/login");

}
