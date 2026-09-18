"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserAction } from "@/action/auth";
import { homePathForRole } from "@/lib/roles";
import { ssoLoginUrl } from "@/lib/sso";

// Halaman "/" = TRANSIT (loading sambil cek sesi ke BE dari browser). Alur:
//  - valid                 -> home sesuai role
//  - 403 (tak terdaftar)   -> /forbidden
//  - baru pulang SSO (?sso=1) tapi sesi tetap gagal -> /error?type=sso (STOP loop)
//  - error backend         -> /error?type=server
//  - 401 kadaluarsa        -> /error?type=expired
//  - belum login           -> mulai SSO (SSO-only, form NPP dihapus)
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    void (async () => {
      const backFromSSO =
        new URLSearchParams(window.location.search).get("sso") === "1";
      const r = await getCurrentUserAction();
      if (!alive) return;

      if (r.forbidden) return router.replace("/forbidden");
      if (r.status && r.user) return router.replace(homePathForRole(r.user.role));
      // Baru pulang dari SSO tapi sesi tetap gagal -> STOP (cegah loop).
      if (backFromSSO) return router.replace("/error?type=sso");
      if (r.error) return router.replace("/error?type=server");

      // 401 / belum login / sesi habis -> mulai SSO. (Di SPA cookie HttpOnly
      // tak terbaca JS, jadi "belum login" & "expired" sama-sama 401.)
      const sso = ssoLoginUrl();
      if (sso) window.location.replace(sso);
      else router.replace("/error?type=config");
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <main className="grid min-h-dvh place-items-center bg-[#0b1a30] text-sm text-gray-300">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        Menyiapkan sesi...
      </div>
    </main>
  );
}
