"use client";

import React from "react";
import { RoleGuard } from "@/components/RoleGuard";

export default function UnitKerjaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRole="UNIT_KERJA_OPERASI">{children}</RoleGuard>;
}
