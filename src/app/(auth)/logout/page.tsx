"use client";

import { logoutAction } from "@/action/auth";
import { withBasePath } from "@/lib/utils";
import { useEffect, useRef } from "react";

export default function LogoutPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      try {
        // Server action: bersihkan cookie lokal, dapat URL backend /api/logout.
        // Navigasi top-level WAJIB supaya cookie SSO (access_token/refresh_token)
        // ikut terkirim ke backend untuk backchannel revoke ke Keycloak.
        const logoutUrl = await logoutAction();
        window.location.replace(logoutUrl);
      } catch (error) {
        console.error("Gagal logout:", error);
        window.location.replace(withBasePath("/login"));
      }
    })();
  }, []);

  return (
    <main className="min-h-screen grid place-items-center p-6 text-sm text-gray-700">
      Mengakhiri sesi...
    </main>
  );
}
