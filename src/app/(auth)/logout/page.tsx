"use client";

import { logoutAction } from "@/action/auth";
import { withBasePath } from "@/lib/utils";
import { useEffect, useRef } from "react";

// Ziti tunnel bisa mati; jangan biarkan user stuck di DNS error page Keycloak.
const SSO_PROBE_TIMEOUT_MS = 3000;

export default function LogoutPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      // 1. Cookie lokal dihapus server-side dulu — sesi app pasti berakhir.
      try {
        const ssoLogoutUrl = await logoutAction();
        if (ssoLogoutUrl) {
          await fetch(ssoLogoutUrl, {
            credentials: "include",
            signal: AbortSignal.timeout(SSO_PROBE_TIMEOUT_MS),
          }).catch(() => {});
        }
      } catch (error) {
        console.error("Gagal logout SSO:", error);
      }

      const oidcBaseUrl = process.env.NEXT_PUBLIC_SSO_OIDC_BASE_URL?.replace(
        /\/$/,
        "",
      );
      const realm = process.env.NEXT_PUBLIC_SSO_REALM;
      const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
      if (!oidcBaseUrl || !realm || !clientId) {
        window.location.replace(withBasePath("/login"));
        return;
      }

      // 2. Probe Keycloak reachable? Tanpa tunnel Ziti, accounts.pusri.dev
      // tidak resolve. Kalau begitu, skip SSO end-session: cookie lokal sudah
      // bersih, langsung ke login. Sesi Keycloak akan mati sendiri saat
      // idle/expiry — dan user juga tidak bisa reach Keycloak tanpa tunnel.
      const issuerUrl = `${oidcBaseUrl}/realms/${encodeURIComponent(realm)}`;
      try {
        await fetch(issuerUrl, {
          mode: "no-cors",
          signal: AbortSignal.timeout(SSO_PROBE_TIMEOUT_MS),
        });
      } catch {
        window.location.replace(withBasePath("/login"));
        return;
      }

      // 3. Keycloak reachable — logout penuh sesi SSO juga.
      // Cookie gateway dan sesi Keycloak berbeda; browser harus logout dari keduanya.
      const keycloakLogoutUrl = new URL(
        `${issuerUrl}/protocol/openid-connect/logout`,
      );
      keycloakLogoutUrl.searchParams.set("client_id", clientId);
      keycloakLogoutUrl.searchParams.set(
        "post_logout_redirect_uri",
        `${window.location.origin}${withBasePath("/login")}`,
      );
      window.location.replace(keycloakLogoutUrl.toString());
    })();
  }, []);

  return (
    <main className="min-h-screen grid place-items-center p-6 text-sm text-gray-700">
      Mengakhiri sesi...
    </main>
  );
}
