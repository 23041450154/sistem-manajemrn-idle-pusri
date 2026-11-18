"use client";

import React from "react";
import { RoleGuard } from "@/components/RoleGuard";

export default function PemeliharaanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRole="PEMELIHARAAN_LAPANGAN">{children}</RoleGuard>;
}
