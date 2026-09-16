import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAction } from "@/action/auth";
import { homePathForRole } from "@/lib/roles";
import { withBasePath } from "@/lib/utils";

// Path "/":
// - SUDAH login  -> lempar ke home sesuai role (mis. UNIT_KERJA_OPERASI ->
//   /unit-kerja/dashboard). Ini tujuan redirect setelah login SSO (backend
//   mengarahkan ke FRONTEND_URL = "/").
// - BELUM login  -> landing publik (bukti build ter-deploy) + tombol ke login.
export default async function Home() {
  const { token, user, forbidden } = await getCurrentUserAction();
  if (forbidden) {
    redirect("/forbidden");
  }
  if (token && user) {
    redirect(homePathForRole(user.role));
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#0b1a30] px-6 text-center font-sans">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-white/10 bg-slate-900/70 px-8 py-12 shadow-2xl backdrop-blur">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withBasePath("/logo-white-hd.png")}
          alt="Logo PUSRI"
          width={96}
          height={96}
          className="object-contain opacity-95"
        />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">
            Manajemen Idle Equipment
          </h1>
          <p className="text-sm text-gray-300">
            PT Pupuk Sriwidjaja Palembang
          </p>
        </div>

        <div className="rounded-md bg-emerald-500/15 px-4 py-2 text-xs font-medium text-emerald-300">
          ✓ Halaman utama publik aktif — build terbaru ter-deploy
        </div>

        <Link
          href="/login"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#1d5bd6] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1749a8]"
        >
          Masuk ke Aplikasi
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>

        <p className="text-[11px] text-gray-500">
          Versi Aplikasi 1.0 · Build check
        </p>
      </div>
    </main>
  );
}
