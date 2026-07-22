import { getCurrentUserAction } from "@/action/auth";
import { normalizeRole } from "@/lib/roles";
import { forbidden } from "next/navigation";
import React from "react";

export default async function RegisterEquipmentLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCurrentUserAction();

  // Proteksi role (Route Guard): Hanya RENDAL_PEMELIHARAAN (dan ADMIN) yang boleh mengakses halaman ini
  const role = normalizeRole(user?.role);
  if (role !== "ADMIN" && role !== "RENDAL_PEMELIHARAAN") {
    // Return 403 Forbidden otomatis jika bukan Staf Rendal
    forbidden();
  }

  return <>{children}</>;
}
