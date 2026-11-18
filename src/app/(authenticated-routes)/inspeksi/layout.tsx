"use client";

import React from "react";
import { RoleGuard } from "@/components/RoleGuard";

export default function InspeksiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRole="INSPEKSI_TEKNIK">{children}</RoleGuard>;
}
