import { getCurrentUserAction } from "@/action/auth";
import { homePathForRole } from "@/lib/roles";
import { LOGIN_URL } from "@/config/api";
import { redirect } from "next/navigation";

export default async function Home() {
  const { token, user } = await getCurrentUserAction();

  if (token && user) {
    redirect(homePathForRole(user.role));
  }
  redirect(LOGIN_URL);
}
