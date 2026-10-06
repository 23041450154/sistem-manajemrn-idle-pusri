"use client";

import { useAuth } from "@/components/AuthProvider";
import { homePathForRole, normalizeRole } from "@/lib/roles";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const allowed = normalizeRole(user?.role) === "ADMIN";

  useEffect(() => {
    if (!allowed) router.replace(homePathForRole(user?.role));
  }, [allowed, router, user?.role]);

  if (!allowed) return null;
  return <>{children}</>;
}
