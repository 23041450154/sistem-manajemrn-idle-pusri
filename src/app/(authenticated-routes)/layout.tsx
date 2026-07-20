import { getCurrentUserAction } from "@/action/auth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import styles from "./dashboard.module.css";
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
    <div className={styles.layout}>
      <Sidebar role={role} />
      <div className={styles.mainContent}>
        <Header user={user} />
        <main className={styles.mainArea}>{children}</main>
      </div>
    </div>
  );
}
