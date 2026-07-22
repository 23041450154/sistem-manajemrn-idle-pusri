import { getCurrentUserAction } from "@/action/auth";
import { normalizeRole } from "@/lib/roles";
import { forbidden } from "next/navigation";
import React from "react";

export default async function ManajerLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCurrentUserAction();
  const role = normalizeRole(user?.role);
  if (role !== "ADMIN" && role !== "MANAJER_RENDAL") {
    forbidden();
  }
  return <>{children}</>;
}
