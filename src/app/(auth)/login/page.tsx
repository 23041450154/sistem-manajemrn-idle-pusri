"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserAction } from "@/action/auth";
import { homePathForRole } from "@/lib/roles";
import { ssoLoginUrl } from "@/lib/sso";

// Form login NPP/password DIHAPUS -> aplikasi SSO-only.
// /login = pintu masuk: sudah login -> home role; 403 -> /forbidden;
// selain itu -> langsung ke SSO (NEXA). Cek sesi dari browser.
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    void (async () => {
      const r = await getCurrentUserAction();
      if (!alive) return;
      if (r.forbidden) return router.replace("/forbidden");
      if (r.status && r.user) return router.replace(homePathForRole(r.user.role));
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
        Mengarahkan ke SSO...
      </div>
    </main>
  );
}
