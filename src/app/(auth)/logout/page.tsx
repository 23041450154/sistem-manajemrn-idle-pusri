"use client";

import { logoutAction } from "@/action/auth";
import { useEffect, useRef } from "react";

export default function LogoutPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      try {
        const ssoLogoutUrl = await logoutAction();
        if (ssoLogoutUrl) {
          await fetch(ssoLogoutUrl, { credentials: "include" });
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
        window.location.replace("/login");
        return;
      }

      // Cookie gateway dan sesi Keycloak berbeda; browser harus logout dari keduanya.
      const keycloakLogoutUrl = new URL(
        `${oidcBaseUrl}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/logout`,
      );
      keycloakLogoutUrl.searchParams.set("client_id", clientId);
      keycloakLogoutUrl.searchParams.set(
        "post_logout_redirect_uri",
        `${window.location.origin}/login`,
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
