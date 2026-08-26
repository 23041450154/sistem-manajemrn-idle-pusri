"use client";

import { loginAction } from "@/action/auth";
import { useState, useActionState, useRef, useEffect } from "react";
import type { LoginResponse } from "@/types/Auth";

const initialState: LoginResponse = {
  status: false,
  message: "",
  token: null,
};

/* Kelas input bersama: fokus brand #0A356A + hack deteksi autofill browser
   (animasi kosong onAutoFillStart/Cancel di globals.css -> onAnimationStart). */
const INPUT_CLS =
  "w-full rounded-md border border-gray-300 py-3 pr-4 pl-11 text-sm text-gray-900 outline-none transition-[border-color,box-shadow] [&::-ms-clear]:hidden [&::-ms-reveal]:hidden [&:-webkit-autofill]:animate-[onAutoFillStart_0s_both] [&:not(:-webkit-autofill)]:animate-[onAutoFillCancel_0s_both] focus:border-[#0A356A] focus:ring-2 focus:ring-[#0A356A]/10";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [npp, setNpp] = useState("");
  const [, setPassword] = useState("");
  const nppRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncValues = () => {
      // Functional update supaya tidak perlu memasukkan npp/password ke deps
      // (React bailout kalau nilai sama), tanpa stale closure.
      if (nppRef.current) {
        const v = nppRef.current.value;
        setNpp((prev) => (v !== prev ? v : prev));
      }
      if (passwordRef.current) {
        const v = passwordRef.current.value;
        setPassword((prev) => (v !== prev ? v : prev));
      }
    };

    const nppEl = nppRef.current;
    const passEl = passwordRef.current;

    if (nppEl) {
      nppEl.addEventListener("input", syncValues);
      nppEl.addEventListener("change", syncValues);
    }
    if (passEl) {
      passEl.addEventListener("input", syncValues);
      passEl.addEventListener("change", syncValues);
    }

    syncValues();
    const rafId = requestAnimationFrame(syncValues);
    const timeouts = [20, 50, 100, 200, 400, 800, 1500].map((ms) =>
      setTimeout(syncValues, ms),
    );

    return () => {
      cancelAnimationFrame(rafId);
      if (nppEl) {
        nppEl.removeEventListener("input", syncValues);
        nppEl.removeEventListener("change", syncValues);
      }
      if (passEl) {
        passEl.removeEventListener("input", syncValues);
        passEl.removeEventListener("change", syncValues);
      }
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Top-level navigation WAJIB: cookie sesi Keycloak SameSite=Lax tidak terkirim via fetch.
  const redirectLogin = () => {
    const ssoUrl = process.env.NEXT_PUBLIC_API_SSO;
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
    if (!ssoUrl || !clientId) {
      alert(
        "SSO belum dikonfigurasi (NEXT_PUBLIC_API_SSO / NEXT_PUBLIC_CLIENT_ID).",
      );
      return;
    }
    window.location.replace(
      `${ssoUrl}/api/login?client_id=${encodeURIComponent(clientId)}`,
    );
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white font-sans animate-in fade-in slide-in-from-bottom-1 duration-500 lg:min-h-screen lg:flex-row">
      {/* Left Panel */}
      <div className="relative flex flex-none flex-col items-center justify-center bg-cover bg-center bg-[#0b1a30] bg-[linear-gradient(rgba(11,26,48,0.48),rgba(15,34,64,0.52)),url('/backgroundLeftPanel.webp')] px-4 pt-6 pb-10 text-center text-white sm:px-6 lg:flex-[1.2] lg:p-12">
        <div className="flex w-full flex-col items-center -translate-y-6 lg:-translate-y-10">
          <div className="mb-2 flex items-center justify-center lg:mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- konsisten dgn halaman lain, hindari image optimizer */}
            <img
              src="/logo-white-hd.png"
              alt="Logo PUSRI"
              width={160}
              height={160}
              className="object-contain opacity-95 [filter:drop-shadow(0_2px_6px_rgba(255,255,255,0.15))_drop-shadow(0_4px_12px_rgba(0,0,0,0.25))]"
            />
          </div>
          <div className="flex max-w-[850px] flex-col items-center [text-shadow:0_2px_4px_rgba(0,0,0,0.4)]">
            <span className="mb-3 text-[1.35rem] font-semibold text-white">
              Selamat Datang di
            </span>
            <h1 className="m-0 mb-4 text-[2.5rem] leading-[1.25] font-bold tracking-[-0.5px] text-white">
              Manajemen Idle Equipment
            </h1>
            <span className="mb-6 text-2xl font-medium text-white/90">
              PT Pupuk Sriwidjaja Palembang
            </span>
          </div>

          {/* Kartu info disembunyikan di layar sempit (≤lg) seperti CSS lama */}
          <div className="hidden rounded-2xl border border-white/[0.12] bg-slate-900/80 px-6 py-[1.1rem] text-center shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-transform duration-300 max-w-[500px] hover:-translate-y-1 lg:block">
            <h3 className="m-0 mb-3 text-lg font-bold tracking-wide text-white">
              Sistem Manajemen Idle Equipment
            </h3>
            <p className="m-0 text-[0.95rem] leading-relaxed text-gray-200">
              Platform terpusat untuk mengelola aset idle secara efisien,
              mendukung proses registrasi, inspeksi, validasi, dan pemeliharaan
              di PT Pupuk Sriwidjaja Palembang.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="relative -mt-[30px] flex w-full flex-col overflow-y-auto rounded-t-3xl bg-white lg:mt-0 lg:min-w-[520px] lg:flex-[0.9] lg:rounded-t-none lg:max-w-[680px]">
        <div className="flex flex-1 flex-col justify-center px-5 py-6 lg:px-16 lg:py-8">
          <div className="mb-6 text-center">
            <h2 className="m-0 mb-2 text-[1.35rem] font-bold text-gray-900 min-[481px]:text-[1.75rem]">
              Selamat Datang
            </h2>
            <p className="m-0 text-sm text-gray-500">
              Silakan masuk menggunakan akun Anda atau menggunakan SSO.
            </p>
          </div>

          <form action={formAction}>
            {state.message && !state.status && (
              <div
                className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-500"
                role="alert"
              >
                {state.message}
              </div>
            )}

            <div className="mb-5">
              <label
                className="mb-2 block text-sm font-medium text-gray-600"
                htmlFor="npp"
              >
                Nomor Pokok Pegawai (NPP)
              </label>
              <div className="relative flex items-center">
                {/* ID Card Icon */}
                <svg
                  className="absolute left-4 h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <circle cx="8.5" cy="10.5" r="2.5"></circle>
                  <path d="M4 18v-1.5c0-1.9 2-3.5 4.5-3.5h0c2.5 0 4.5 1.6 4.5 3.5V18"></path>
                  <path d="M16 10h4"></path>
                  <path d="M16 14h4"></path>
                </svg>
                <input
                  ref={nppRef}
                  id="npp"
                  name="npp"
                  type="text"
                  className={INPUT_CLS}
                  placeholder="Masukan NPP"
                  autoComplete="username"
                  defaultValue=""
                  onChange={(e) => setNpp(e.target.value)}
                  onInput={(e) => setNpp(e.currentTarget.value)}
                  onAnimationStart={(e) => {
                    if (
                      e.animationName.includes("onAutoFillStart") &&
                      nppRef.current
                    ) {
                      setNpp(nppRef.current.value);
                    }
                  }}
                  required
                />
              </div>
            </div>

            <div className="mb-5">
              <label
                className="mb-2 block text-sm font-medium text-gray-600"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative flex items-center">
                {/* Lock Icon */}
                <svg
                  className="absolute left-4 h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={INPUT_CLS}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  defaultValue=""
                  onChange={(e) => setPassword(e.target.value)}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  onAnimationStart={(e) => {
                    if (
                      e.animationName.includes("onAutoFillStart") &&
                      passwordRef.current
                    ) {
                      setPassword(passwordRef.current.value);
                    }
                  }}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 flex cursor-pointer items-center justify-center border-none bg-transparent p-0 text-gray-400 hover:text-gray-600"
                  onClick={togglePasswordVisibility}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    // Eye Off Icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    // Eye Icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-6 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="rememberMe"
                  className="h-4 w-4 cursor-pointer rounded border border-gray-300"
                />
                <span className="text-sm text-gray-600">Ingat Saya</span>
              </label>
              <a
                href="#"
                className="text-sm font-medium text-[#0A356A] no-underline hover:underline"
              >
                Lupa Password?
              </a>
            </div>

            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-none bg-[#0A356A] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#062854] disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-70 max-[480px]:py-4"
              disabled={npp.length < 5 || pending}
            >
              {pending ? "MEMPROSES..." : "MASUK"}
              {/* Log In Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-sm text-gray-500 before:flex-1 before:border-b before:border-gray-200 before:content-[''] after:flex-1 after:border-b after:border-gray-200 after:content-['']">
            ATAU
          </div>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-[background-color,box-shadow] hover:bg-gray-50 max-[480px]:py-4"
            onClick={redirectLogin}
          >
            {/* Shield/Security Icon for SSO */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Masuk dengan SSO
          </button>

          <div className="mt-6 text-center text-xs text-gray-500">
            Kesulitan mengakses akun?{" "}
            <a href="#" className="text-[#0A356A] no-underline hover:underline">
              Hubungi Admin IT
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 text-xs text-gray-500 lg:px-12">
          <div className="flex items-center gap-2">
            <span>&copy; PT Pupuk Sriwidjaja Palembang</span>
          </div>
          <div>Versi Aplikasi 1.0 Build 1.0</div>
        </div>
      </div>
    </div>
  );
}
