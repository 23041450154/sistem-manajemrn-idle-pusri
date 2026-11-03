"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { homePathForRole } from "@/lib/roles";
import { ssoLoginUrl } from "@/lib/sso";
import { withBasePath } from "@/lib/utils";
import type { User } from "@/types/Auth";

/**
 * Form login NPP/password — HANYA untuk development lokal
 * (NEXT_PUBLIC_LOGIN_FORM=true; backend juga harus LOGIN_PASSWORD_MODE di-set).
 * Backend memasang cookie sesi HttpOnly lewat rewrite /idle/air, jadi setelah
 * submit cukup refresh state sesi.
 * Produksi: SSO-only, form ini tidak di-render (env tidak di-bake saat build).
 */
export default function LoginForm() {
  const router = useRouter();
  const [npp, setNpp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch(`${withBasePath("/air")}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ npp: npp.trim(), password }),
      });
      const raw = await res.json().catch(() => null);
      if (!res.ok) {
        setError(raw?.message || raw?.error || `Login gagal (HTTP ${res.status})`);
        setPending(false);
        return;
      }
      const user = raw?.data?.user as User | undefined;
      // Cookie HttpOnly sudah terpasang oleh backend -> langsung ke home role.
      // Next router.replace SUDAH basePath-aware — jangan dibungkus withBasePath
      // (dobel prefix -> /idle/idle/...).
      router.replace(homePathForRole(user?.role ?? ""));
    } catch {
      setError("Tidak bisa menghubungi backend lokal (localhost:8080).");
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full">
      {error && (
        <div
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-500"
          role="alert"
        >
          {error}
        </div>
      )}
      <div className="mb-5">
        <label
          className="mb-2 block text-sm font-medium text-gray-600"
          htmlFor="npp"
        >
          Nomor Pokok Pegawai (NPP)
        </label>
        <input
          id="npp"
          name="npp"
          type="text"
          autoComplete="username"
          className="w-full rounded-md border border-gray-300 py-3 px-4 text-sm text-gray-900 outline-none focus:border-[#0A356A] focus:ring-2 focus:ring-[#0A356A]/10"
          placeholder="Masukan NPP"
          value={npp}
          onChange={(e) => setNpp(e.target.value)}
          disabled={pending}
        />
        <p className="mt-1.5 text-[11px] text-gray-400">
          Dev: seed 100001–100006, password{" "}
          <code className="font-mono">password123</code>
        </p>
      </div>
      <div className="mb-6">
        <label
          className="mb-2 block text-sm font-medium text-gray-600"
          htmlFor="password"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="w-full rounded-md border border-gray-300 py-3 pr-12 pl-4 text-sm text-gray-900 outline-none focus:border-[#0A356A] focus:ring-2 focus:ring-[#0A356A]/10"
            placeholder="Masukan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-[#0A356A]"
            tabIndex={-1}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending || !npp.trim() || !password}
        className="w-full rounded-md bg-[#0A356A] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0556B3] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Memproses..." : "Masuk"}
      </button>
      <button
        type="button"
        onClick={() => {
          const sso = ssoLoginUrl();
          if (sso) window.location.replace(sso);
        }}
        className="mt-3 w-full rounded-md border border-gray-300 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
      >
        Masuk dengan SSO Pusri
      </button>
    </form>
  );
}
