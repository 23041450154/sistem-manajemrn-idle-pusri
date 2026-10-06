"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types/Auth";
import { getCurrentUserAction } from "@/action/auth";
import { ssoLoginUrl } from "@/lib/sso";

// Konteks auth SPA. AuthProvider men-fetch user sekali (browser) lalu:
//  - valid    -> sediakan user ke seluruh subtree (useAuth)
//  - forbidden-> /forbidden (tak terdaftar; jangan loop)
//  - expired  -> /error?type=expired (auto ke SSO sekali)
//  - error    -> /error?type=server
//  - no sesi  -> mulai SSO
// Guard ini menggantikan pengecekan server (getCurrentUserAction) di layout.

type AuthState = { user: User | null; loading: boolean };

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

function FullscreenLoader() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#0b1a30] text-sm text-gray-300">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        Memuat sesi...
      </div>
    </main>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let alive = true;
    void (async () => {
      const r = await getCurrentUserAction();
      if (!alive) return;
      if (r.forbidden) {
        router.replace("/forbidden");
        return;
      }
      if (r.error) {
        router.replace("/error?type=server");
        return;
      }
      if (r.status && r.user) {
        setState({ user: r.user, loading: false });
        return;
      }
      // 401 / sesi habis / tak ada sesi -> mulai SSO (top-level, cross-origin).
      const sso = ssoLoginUrl();
      if (sso) window.location.replace(sso);
      else router.replace("/error?type=config");
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  if (state.loading || !state.user) return <FullscreenLoader />;

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
