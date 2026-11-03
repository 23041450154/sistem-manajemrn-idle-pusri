"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserAction } from "@/action/auth";
import { homePathForRole } from "@/lib/roles";
import { ssoLoginUrl } from "@/lib/sso";
import { withBasePath } from "@/lib/utils";
import LoginForm from "./LoginForm";

// NEXT_PUBLIC_LOGIN_FORM di-bake saat BUILD (docs Next.js: static-env.ts
// meng-inline semua NEXT_PUBLIC_* ke bundle). Build prod tanpa env ini ->
// false -> form tidak dirender dan /login tetap SSO-only. Dev lokal cukup
// set NEXT_PUBLIC_LOGIN_FORM=true di .env (baca runtime `next dev`).
const LOGIN_FORM = process.env.NEXT_PUBLIC_LOGIN_FORM === "true";

// /login = pintu masuk: sudah login -> home role; 403 -> /forbidden;
// LOGIN_FORM=true (dev) -> tampilkan form NPP/password; selain itu -> SSO.
export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const r = await getCurrentUserAction();
      if (!alive) return;
      if (r.forbidden) return router.replace("/forbidden");
      if (r.status && r.user) {
        // Next router.replace SUDAH basePath-aware — jangan dibungkus withBasePath
        // (dobel prefix -> /idle/idle/...).
        return router.replace(homePathForRole(r.user.role));
      }
      // Belum ada sesi. Mode dev -> tampilkan form; prod -> langsung SSO.
      setChecking(false);
      if (!LOGIN_FORM) {
        const sso = ssoLoginUrl();
        if (sso) window.location.replace(sso);
        else router.replace("/error?type=config");
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  if (LOGIN_FORM && !checking) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#0b1a30] px-4">
        <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo statis, hindari image optimizer */}
          <img
            src={withBasePath("/logo-white-hd.png")}
            alt="Logo PUSRI"
            width={72}
            height={72}
            className="mx-auto mb-2 object-contain"
          />
          <h1 className="mb-1 text-center text-lg font-bold text-gray-900">
            Manajemen Idle Equipment
          </h1>
          <p className="mb-6 text-center text-xs text-gray-500">
            Login pengembangan lokal (NPP/password)
          </p>
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#0b1a30] text-sm text-gray-300">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        Mengarahkan ke SSO...
      </div>
    </main>
  );
}
