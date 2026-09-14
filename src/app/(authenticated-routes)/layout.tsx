import { getCurrentUserAction } from "@/action/auth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { SidebarProvider } from "@/components/SidebarProvider";
import { redirect } from "next/navigation";
import React from "react";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = await getCurrentUserAction();

  if (!token || !user) {
    redirect("/login");
  }

  // Pass the raw user role directly so Sidebar can check it correctly
  const role = user.role;

  return (
    <SidebarProvider>
      <div className="app-shell" data-app-shell>
        <Sidebar role={role} />
        <div className="app-main-column" data-app-main-column>
          <Header user={user} />
          <main className="app-main-area" data-app-main-area>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
