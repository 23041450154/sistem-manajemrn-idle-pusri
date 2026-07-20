import { getCurrentUserAction } from "@/action/auth";
import { normalizeRole } from "@/lib/roles";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import React from "react";

export default async function RegisterLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCurrentUserAction();

  // Gembok: ADMIN & RENDAL_PEMELIHARAAN yang boleh mengakses form registrasi ini
  const role = normalizeRole(user?.role);
  if (role !== "ADMIN" && role !== "RENDAL_PEMELIHARAAN") {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] w-full px-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-full mb-6">
          <AlertTriangle className="w-16 h-16" />
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">403</h1>
        <h2 className="text-2xl font-bold text-gray-800 mt-2">Akses Ditolak (Unauthorized)</h2>
        <p className="text-gray-500 mt-4 text-center max-w-lg leading-relaxed">
          Maaf, role Anda saat ini (<strong>{user?.role || "Unknown"}</strong>) tidak memiliki hak akses (*privilege*) yang cukup untuk membuka halaman Registrasi Equipment.
        </p>
        <Link 
          href="/dashboard" 
          className="mt-8 px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          Kembali ke Dashboard Utama
        </Link>
      </div>
    );
  }

  // Jika rolenya ADMIN, izinkan form registrasi untuk dirender
  return <>{children}</>;
}
