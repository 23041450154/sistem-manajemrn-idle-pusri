"use client";

import React from "react";
import { useAuth } from "@/components/AuthProvider";
import { normalizeRole, type Role } from "@/lib/roles";
import { UnauthorizedView } from "@/components/UnauthorizedView";

export function RoleGuard({
  allowedRole,
  children,
}: {
  allowedRole: Role;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const currentRole = normalizeRole(user?.role);

  if (currentRole !== allowedRole) {
    return (
      <UnauthorizedView
        currentRole={currentRole}
        requiredRole={allowedRole}
        embedded
      />
    );
  }

  return <>{children}</>;
}
