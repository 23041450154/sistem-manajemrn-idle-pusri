import { getCurrentUserAction } from "@/action/auth";
import { homePathForRole, normalizeRole } from "@/lib/roles";
import { redirect } from "next/navigation";
import React from "react";

export default async function InspeksiLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCurrentUserAction();
  const role = normalizeRole(user?.role);
  if (role !== "INSPEKSI_TEKNIK") {
    redirect(homePathForRole(user?.role));
  }
  return <>{children}</>;
}
