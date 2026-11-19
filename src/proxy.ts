import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BASE_PATH } from "./lib/base-path";
import { isValidRole, requiredRoleForPath, type Role } from "./lib/roles";

// Next.js 16: file middleware bernama proxy.ts, fungsinya `proxy`.

// Cookie sesi utama = access_token (SSO) atau token (login NPP/password).
const AUTH_COOKIES = ["access_token", "token"];

// Path publik yang boleh diakses tanpa sesi.
// /forbidden, /unauthorized & /logout wajib publik agar tidak memicu loop.
const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/forbidden",
  "/unauthorized",
  "/logout",
  "/error",
];

// Decode klaim `role` dari JWT (tanpa memutus alur bila token adalah SSO token
// yang role aplikasinya baru di-resolve lewat /api/auth/me di client).
function extractRoleFromJwt(jwt?: string): Role | null {
  if (!jwt) return null;
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { role?: unknown };
    if (typeof payload?.role === "string" && isValidRole(payload.role)) {
      return payload.role.toUpperCase() as Role;
    }
  } catch {
    return null;
  }
  return null;
}

// NextResponse.redirect TIDAK basePath-aware (beda dgn redirect() dari
// next/navigation), jadi tujuan redirect harus di-prefix BASE_PATH manual.
// BASE_PATH dari satu sumber kebenaran (lib/base-path) agar tidak pernah beda
// dengan basePath di next.config maupun withBasePath().

// PENTING (Next 16): request.nextUrl.pathname di proxy BISA masih mengandung
// basePath (mis. "/idle/login"), tergantung konfigurasi reverse proxy. Kalau
// tidak di-strip, cek PUBLIC_PATHS meleset -> "/idle/login" tidak match
// "/login" -> redirect ke "/idle/login" lagi -> ERR_TOO_MANY_REDIRECTS.
// Normalisasi: buang prefix basePath bila ada (aman bila sudah ter-strip).
function stripBasePath(pathname: string): string {
  if (BASE_PATH && (pathname === BASE_PATH || pathname.startsWith(BASE_PATH + "/"))) {
    return pathname.slice(BASE_PATH.length) || "/";
  }
  return pathname;
}

export function proxy(request: NextRequest) {
  const pathname = stripBasePath(request.nextUrl.pathname);

  const hasSession = AUTH_COOKIES.some((name) =>
    Boolean(request.cookies.get(name)?.value),
  );

  // "/" = landing publik (bukti deploy), boleh diakses tanpa sesi.
  const isPublicPath =
    pathname === "/" ||
    PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(path + "/"),
    );

  // Tanpa sesi & bukan path publik -> ke login.
  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL(`${BASE_PATH}/login`, request.url));
  }

  // RBAC level edge/server: bila JWT membawa role aplikasi yang sah dan user
  // mencoba mengakses prefix rute milik role lain, kembalikan HTTP 401 Unauthorized.
  if (hasSession && !isPublicPath) {
    const requiredRole = requiredRoleForPath(pathname);
    const jwtRole =
      extractRoleFromJwt(request.cookies.get("token")?.value) ??
      extractRoleFromJwt(request.cookies.get("access_token")?.value);

    if (requiredRole && jwtRole && jwtRole !== requiredRole) {
      return NextResponse.rewrite(
        new URL(`${BASE_PATH}/unauthorized`, request.url),
        { status: 401 },
      );
    }
  }

  // CATATAN ANTI-LOOP (penyebab lama ERR_TOO_MANY_REDIRECTS):
  // Versi lama me-redirect user "ber-cookie" dari /login ke "/", lalu "/"
  // (via /auth/me 401) memantul balik ke /login tanpa henti — karena cookie
  // basi tidak bisa dihapus saat render Server Component. Sekarang /login TIDAK
  // memantul; validasi sesi + pembersihan cookie ditangani layout (server
  // action) dan backend /api/logout. Redirect role-home dilakukan page.tsx "/".
  return NextResponse.next();
}

export const config = {
  matcher: [
    // "/" eksplisit: tanpa ini, akar basePath (pathname ter-strip = "/")
    // tidak kena regex di bawah dan proxy dilewati.
    // "air" dikecualikan: rewrite /idle/air/* di next.config me-proxy langsung
    // ke BE — proteksi sesi dilakukan AuthMiddleware di BE (401 per-request),
    // dan endpoint publik SSO (/api/callback) harus bisa dipanggil TANPA sesi.
    "/",
    "/((?!api|air|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.webp$|.*\\.jpg$|.*\\.jpeg$).*)",
  ],
};
