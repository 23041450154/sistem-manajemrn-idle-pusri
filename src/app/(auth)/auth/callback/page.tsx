"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ssoCallbackAction } from "@/action/auth";

function CallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  // Guard message diturunkan saat render pertama, bukan via setState di efek.
  const [message, setMessage] = useState(() =>
    params.get("code") && process.env.NEXT_PUBLIC_CLIENT_ID
      ? "Menyelesaikan login SSO..."
      : "Callback SSO tidak lengkap. Kode atau client ID belum tersedia.",
  );

  useEffect(() => {
    const code = params.get("code");
    const uid = params.get("uid");
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;

    if (!code || !clientId) {
      return;
    }

    ssoCallbackAction(code, clientId, uid)
      .then((res) => {
        if (!res.status) {
          setMessage(res.message || "SSO gagal.");
          return;
        }
        router.replace(res.redirectUrl || "/");
      })
      .catch((error: Error) => setMessage(error.message));
  }, [params, router]);

  return (
    <main className="min-h-screen grid place-items-center p-6 text-sm text-gray-700">
      {message}
    </main>
  );
}

export default function SsoCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen grid place-items-center p-6 text-sm text-gray-700">
          Memuat callback SSO...
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
