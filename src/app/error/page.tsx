"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ssoLoginUrl } from "@/lib/sso";

const MESSAGES: Record<string, { title: string; desc: string }> = {
  expired: {
    title: "Sesi Berakhir",
    desc: "Sesi Anda telah berakhir. Mengarahkan kembali ke login SSO...",
  },
  sso: {
    title: "Login SSO Gagal",
    desc: "Anda berhasil login di SSO, tetapi sesi aplikasi tidak dapat dibuat. Silakan coba lagi atau hubungi Admin IT.",
  },
  server: {
    title: "Server Bermasalah",
    desc: "Terjadi kendala pada server. Silakan coba beberapa saat lagi.",
  },
  config: {
    title: "SSO Belum Dikonfigurasi",
    desc: "Konfigurasi SSO belum lengkap. Hubungi Admin IT.",
  },
  default: {
    title: "Terjadi Kesalahan",
    desc: "Maaf, terjadi kesalahan yang tidak diketahui.",
  },
};

function ErrorContent() {
  const params = useSearchParams();
  const type = params.get("type") ?? "default";
  const info = MESSAGES[type] ?? MESSAGES.default;
  const url = ssoLoginUrl();
  const counting = type === "expired" && !!url;

  // Auto-redirect ke SSO HANYA SEKALI per tab. Tanpa penjaga ini, sesi yang
  // gagal dibuat membuat siklus: /auth/me 401 -> error?expired -> SSO ->
  // callback -> 401 ... tak berujung. Penanda disimpan di sessionStorage.
  useEffect(() => {
    if (!counting || !url) return;
    let alreadyTried = false;
    try {
      alreadyTried = sessionStorage.getItem("ssoAutoRetry") === "1";
      sessionStorage.setItem("ssoAutoRetry", "1");
    } catch {
      // storage diblokir -> jangan auto-redirect (lebih aman daripada loop)
      alreadyTried = true;
    }
    if (alreadyTried) return;
    const t = setTimeout(() => window.location.replace(url), 2500);
    return () => clearTimeout(t);
  }, [counting, url]);

  const goLogin = () => {
    // Percobaan manual: reset penanda supaya auto-retry bisa dipakai lagi nanti.
    try {
      sessionStorage.removeItem("ssoAutoRetry");
    } catch {}
    if (url) window.location.replace(url);
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-[#0b1a30] px-6 text-center font-sans">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-white/10 bg-slate-900/70 px-8 py-12 shadow-2xl backdrop-blur">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-amber-500/15 text-amber-400">
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
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" x2="12" y1="9" y2="13" />
            <line x1="12" x2="12.01" y1="17" y2="17" />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">{info.title}</h1>
          <p className="text-sm text-gray-300">{info.desc}</p>
        </div>
        <button
          type="button"
          onClick={goLogin}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#1d5bd6] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1749a8]"
        >
          {counting ? "Mengarahkan ke login..." : "Masuk dengan SSO"}
        </button>
      </div>
    </main>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen grid place-items-center p-6 text-sm text-gray-400">
          Memuat...
        </main>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
