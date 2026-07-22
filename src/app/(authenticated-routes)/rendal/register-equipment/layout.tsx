import { getCurrentUserAction } from "@/action/auth";
import { normalizeRole, homePathForRole } from "@/lib/roles";
import { redirect } from "next/navigation";
import React from "react";

export default async function RegisterEquipmentLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCurrentUserAction();

  // Proteksi role (Route Guard): Hanya RENDAL_PEMELIHARAAN (dan ADMIN) yang boleh mengakses halaman ini
  const role = normalizeRole(user?.role);
  if (role !== "ADMIN" && role !== "RENDAL_PEMELIHARAAN") {
    // Redirect otomatis ke dashboard masing-masing jika bukan Staf Rendal
    redirect(homePathForRole(user?.role));
  }

  return <>{children}</>;
}
