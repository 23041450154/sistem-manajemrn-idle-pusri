"use client";

import React from "react";
import { RoleGuard } from "@/components/RoleGuard";

export default function RendalLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRole="RENDAL_PEMELIHARAAN">{children}</RoleGuard>;
}
