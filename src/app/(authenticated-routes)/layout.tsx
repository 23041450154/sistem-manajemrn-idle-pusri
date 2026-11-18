"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { SidebarProvider } from "@/components/SidebarProvider";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { UnauthorizedView } from "@/components/UnauthorizedView";
import { normalizeRole, requiredRoleForPath } from "@/lib/roles";
import React from "react";

// Guard + shell aplikasi. AuthProvider (client) memvalidasi sesi ke BE dari
// browser; Shell hanya dirender saat user sudah valid (non-null).
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Shell>{children}</Shell>
    </AuthProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  // AuthProvider menjamin user non-null di sini.
  const role = user!.role;
  const currentRole = normalizeRole(role);
  const requiredRole = requiredRoleForPath(pathname);

  if (requiredRole && currentRole !== requiredRole) {
    return (
      <UnauthorizedView currentRole={currentRole} requiredRole={requiredRole} />
    );
  }

  return (
    <SidebarProvider>
      <div className="app-shell" data-app-shell>
        <Sidebar role={role} />
        <div className="app-main-column" data-app-main-column>
          <Header user={user!} />
          <main className="app-main-area" data-app-main-area>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
