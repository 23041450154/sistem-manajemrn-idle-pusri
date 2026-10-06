import Link from "next/link";

// Halaman 403: sesi SSO valid tapi user tidak terdaftar / tidak punya akses.
// Terminal state (bukan redirect balik) untuk mencegah loop login<->SSO.
// Tombol Logout -> /logout (hapus cookie + logout SSO backchannel).
export default function ForbiddenPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#0b1a30] px-6 text-center font-sans">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-white/10 bg-slate-900/70 px-8 py-12 shadow-2xl backdrop-blur">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-red-500/15 text-red-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m4.9 4.9 14.2 14.2" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Akses Ditolak</h1>
          <p className="text-sm text-gray-300">
            Akun Anda belum terdaftar atau tidak memiliki akses ke aplikasi
            Manajemen Idle Equipment. Hubungi Admin IT bila ini keliru.
          </p>
        </div>

        <Link
          href="/logout"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#1d5bd6] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1749a8]"
        >
          Keluar (Logout)
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
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
        </Link>
      </div>
    </main>
  );
}
