"use client";

import React from "react";
import { RoleGuard } from "@/components/RoleGuard";

export default function ManajerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRole="MANAJER_RENDAL">{children}</RoleGuard>;
}
