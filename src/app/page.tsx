import { getCurrentUserAction } from "@/action/auth";
import { redirect } from "next/navigation";



export default async function Home() {
  const { token, user } = await getCurrentUserAction();

  if(token && user) {
    redirect("/dashboard");
  }
  redirect("/login");

}
