"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // --- ALTERNATIF SEMENTARA (MOCK LOGIN) ---
      let userRole = "";

      // Karena menggunakan NIK, kita gunakan teks NIK untuk dummy
      if (nik === "rendal" && password === "123") {
        userRole = "admin_rendal";
      } else if (nik === "inspeksi" && password === "123") {
        userRole = "inspeksi";
      } else if (nik === "unit" && password === "123") {
        userRole = "unit_kerja";
      } else {
        alert("Login gagal! Coba NIK: admin / inspeksi / unit dengan password '123'");
        setIsLoading(false);
        return;
      }

      const dummyPayload = { role: userRole };
      const base64Payload = btoa(JSON.stringify(dummyPayload));
      const fakeToken = `dummyHeader.${base64Payload}.dummySignature`;

      document.cookie = `session_token=${fakeToken}; path=/; max-age=86400; Secure; SameSite=Lax`;

      const payload = decodeJWT(fakeToken);
      
      if (!payload || !payload.role) {
        alert("Gagal membaca token JWT dummy. Payload: " + JSON.stringify(payload));
        setIsLoading(false);
        return;
      }

      // Karena rute /dashboard sekarang mendeteksi role secara otomatis,
      // kita arahkan semua user yang berhasil login ke /dashboard
      router.push("/dashboard");

    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <div className={styles.logoContainer}>
          <Image
            src="/images (2) 1.png"
            alt="Logo PUSRI"
            width={150}
            height={150}
            priority
            style={{ objectFit: 'contain' }}
          />
        </div>
        <h1 className={styles.leftPanelTitle}>
          Selamat Datang Di<br />
          Manajemen Idle Equipment<br />
          PT PUPUK SRIWIDJAJA PALEMBANG 
        </h1>

        <div className={styles.infoBox}>
          <h3 className={styles.infoBoxTitle}>Aplikasi Manejemen Idle Equipment</h3>
          <p className={styles.infoBoxText}>
            Aplikasi Manajemen Idle Equipment adalah platform terpusat untuk memonitor, mengelola, dan mengoptimalkan penggunaan peralatan yang sedang tidak beroperasi. Melalui sistem ini, perusahaan dapat meningkatkan efisiensi alokasi aset dan mengurangi biaya pemeliharaan yang tidak perlu.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          <div className={styles.header}>
            <h2 className={styles.title}>Selamat Datang</h2>
            <p className={styles.subtitle}>Silakan masuk menggunakan akun Anda atau menggunakan SSO.</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="nik">
                Nomor Pokok Pegawai (NPP)
              </label>
              <div className={styles.inputWrapper}>
                {/* ID Card Icon */}
                <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <circle cx="8.5" cy="10.5" r="2.5"></circle>
                  <path d="M4 18v-1.5c0-1.9 2-3.5 4.5-3.5h0c2.5 0 4.5 1.6 4.5 3.5V18"></path>
                  <path d="M16 10h4"></path>
                  <path d="M16 14h4"></path>
                </svg>
                <input
                  id="nik"
                  type="text"
                  className={styles.input}
                  placeholder="Masukan NPP"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <div className={styles.inputWrapper}>
                {/* Lock Icon */}
                <svg className={styles.inputIcon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={togglePasswordVisibility}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    // Eye Off Icon
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    // Eye Icon
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className={styles.formActions}>
              <label className={styles.rememberMe}>
                <input type="checkbox" className={styles.checkbox} />
                <span className={styles.rememberText}>Ingat Saya</span>
              </label>
              <a href="#" className={styles.forgotPassword}>
                Lupa Password?
              </a>
            </div>

            <button type="submit" className={styles.submitButton} disabled={nik.length < 4 || isLoading}>
              {isLoading ? "MEMPROSES..." : "MASUK"}
              {/* Log In Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
            </button>
          </form>

          <div className={styles.divider}>ATAU</div>
          <button type="button" className={styles.ssoButton} onClick={() => alert("login dengan sso sedang dalam pengembangan. terimakasyi")}>
            {/* Shield/Security Icon for SSO */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Masuk dengan SSO
          </button>

          <div className={styles.helpText}>
            Kesulitan mengakses akun? <a href="#" className={styles.helpLink}>Hubungi Admin IT</a>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.supportInfo}>
            <span>&copy; DEPARTEMEN TI</span>
          </div>
          <div>
            Versi Aplikasi 1.0 Build 1.0 
          </div>
        </div>
      </div>
    </div>
  );
}
