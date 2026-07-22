import { getCurrentUserAction } from "@/action/auth";
import { normalizeRole } from "@/lib/roles";
import { forbidden } from "next/navigation";
import React from "react";

export default async function InspeksiLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCurrentUserAction();
  const role = normalizeRole(user?.role);
  if (role !== "ADMIN" && role !== "INSPEKSI_TEKNIK") {
    forbidden();
  }
  return <>{children}</>;
}
