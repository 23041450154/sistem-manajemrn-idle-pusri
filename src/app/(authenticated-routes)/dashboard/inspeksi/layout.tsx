import { getCurrentUserAction } from "@/action/auth";
import { Lock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function InspeksiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getCurrentUserAction();

  // Jika belum login, tendang ke halaman login
  if (!user) {
    redirect("/login");
  }

  // OTORISASI BERBASIS PERAN (ROLE-BASED AUTHORIZATION)
  // Hanya role "INSPECTOR" yang diizinkan untuk memproses halaman ini (menggunakan toUpperCase agar kebal dari tipe penulisan)
  if (user.role.toUpperCase() !== "INSPECTOR") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4 animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 border-8 border-red-100 shadow-sm relative">
          <ShieldAlert className="w-12 h-12 text-red-600" strokeWidth={2} />
          <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-100">
            <Lock className="w-5 h-5 text-gray-700" />
          </div>
        </div>
        
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
          403 Forbidden
        </h1>
        
        <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 max-w-lg mb-8">
          <p className="text-gray-700 leading-relaxed text-sm">
            Maaf, akses ditolak secara sistem. Akun Anda yang saat ini masuk sebagai <strong className="text-red-700">{user.name}</strong> dengan peran <strong className="text-red-700 uppercase">[{user.role}]</strong> tidak memiliki izin (*clearance*) untuk melihat atau mengisi Formulir Inspeksi Teknik.
          </p>
        </div>

        <Link 
          href="/dashboard"
          className="px-8 py-3 bg-[#0A356A] hover:bg-[#0556B3] text-white rounded-xl font-bold shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
        >
          Kembali ke Dashboard Anda
        </Link>
      </div>
    );
  }

  // Jika rolenya benar (INSPEKSI), izinkan halaman formulir dirender
  return <>{children}</>;
}
