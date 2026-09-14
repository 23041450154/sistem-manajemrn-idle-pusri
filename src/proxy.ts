import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16: file middleware bernama proxy.ts, fungsinya `proxy`.

// Cookie sesi utama = access_token (SSO) atau token (login NPP/password).
const AUTH_COOKIES = ["access_token", "token"];

// Path publik yang boleh diakses tanpa sesi.
const PUBLIC_PATHS = ["/login", "/forgot-password"];

// NextResponse.redirect TIDAK basePath-aware (beda dgn redirect() dari
// next/navigation). pathname di proxy sudah di-strip basePath, jadi tujuan
// redirect harus di-prefix manual.
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession = AUTH_COOKIES.some((name) =>
    Boolean(request.cookies.get(name)?.value),
  );

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );

  // Tanpa sesi & bukan path publik -> ke login.
  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL(`${BASE_PATH}/login`, request.url));
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
    "/",
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.webp$|.*\\.jpg$|.*\\.jpeg$).*)",
  ],
};
