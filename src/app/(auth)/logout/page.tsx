import { logoutAction } from "@/action/auth";

export default async function LogoutPage() {
  // Automatically trigger server-side logout to clear cookies and redirect to /login
  await logoutAction();
  return null;
}
