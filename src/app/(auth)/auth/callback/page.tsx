"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function CallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("Menyelesaikan login SSO...");

  useEffect(() => {
    const code = params.get("code");
    const uid = params.get("uid");
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!code || !clientId || !apiUrl) {
      setMessage("Callback SSO tidak lengkap. Kode, client ID, atau API belum tersedia.");
      return;
    }

    const callbackUrl = new URL(`${apiUrl.replace(/\/$/, "")}/api/auth/callback`);
    callbackUrl.searchParams.set("code", code);
    callbackUrl.searchParams.set("clientId", clientId);
    if (uid) callbackUrl.searchParams.set("uid", uid);

    fetch(callbackUrl.toString(), { credentials: "include" })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(body?.message || `SSO gagal (HTTP ${response.status})`);
        }
        router.replace("/");
      })
      .catch((error: Error) => setMessage(error.message));
  }, [params, router]);

  return <main className="min-h-screen grid place-items-center p-6 text-sm text-gray-700">{message}</main>;
}

export default function SsoCallbackPage() {
  return (
    <Suspense fallback={<main className="min-h-screen grid place-items-center p-6 text-sm text-gray-700">Memuat callback SSO...</main>}>
      <CallbackContent />
    </Suspense>
  );
}
