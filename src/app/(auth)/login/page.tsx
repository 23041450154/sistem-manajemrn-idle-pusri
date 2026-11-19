"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserAction } from "@/action/auth";
import { homePathForRole } from "@/lib/roles";
import { ssoLoginUrl } from "@/lib/sso";

// /login = pintu masuk SSO-only. Sudah punya sesi -> home role; selain itu
// lempar ke gateway SSO. Tidak ada form lokal: autentikasi sepenuhnya urusan SSO.
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    void (async () => {
      const r = await getCurrentUserAction();
      if (!alive) return;
      if (r.forbidden) return router.replace("/forbidden");
      if (r.status && r.user) return router.replace(homePathForRole(r.user.role));
      // Next router.replace SUDAH basePath-aware — jangan dibungkus withBasePath.
      const sso = ssoLoginUrl();
      if (sso) return window.location.replace(sso);
      router.replace("/error?type=config");
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <main className="grid min-h-dvh place-items-center bg-[#0b1a30] text-sm text-gray-300">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        Mengarahkan ke SSO...
      </div>
    </main>
  );
}
