import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeRole, homePathForRole } from "./lib/roles";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/auth"];

// NextResponse.redirect TIDAK basePath-aware (beda dgn redirect() dari
// next/navigation). pathname di middleware sudah di-strip basePath, jadi
// tujuan redirect harus di-prefix manual.
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

function clearAuthCookiesOnResponse(res: NextResponse): NextResponse {
  for (const name of ["token", "user", "access_token", "refresh_token"]) {
    // delete harus pakai path "/" agar match cookie asli
    res.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return res;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const userCookie = request.cookies.get("user")?.value;

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );

  // Redirect ke login jika tidak ada token dan bukan public path
  if (!token && !isPublicPath) {
    const loginUrl = new URL(`${BASE_PATH}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Jika ada token tapi di public path (seperti /login)
  if (token && isPublicPath) {
    if (!userCookie) {
      // Callback SSO hanya membuat token; halaman root mengambil user lewat /auth/me.
      return NextResponse.redirect(new URL(BASE_PATH || "/", request.url));
    }

    try {
      const user = JSON.parse(userCookie);
      const role = normalizeRole(user?.role);
      const homeUrl = homePathForRole(role);
      return NextResponse.redirect(
        new URL(`${BASE_PATH}${homeUrl}`, request.url),
      );
    } catch {
      return clearAuthCookiesOnResponse(NextResponse.next());
    }
  }

  // Cek RBAC untuk protected path
  if (token && userCookie && !isPublicPath) {
    try {
      const user = JSON.parse(userCookie);
      const role = normalizeRole(user?.role);

      // Redirect dari halaman root / ke dashboard role masing-masing
      if (pathname === "/") {
        return NextResponse.redirect(
          new URL(`${BASE_PATH}${homePathForRole(role)}`, request.url),
        );
      }

      // Cek perlindungan path berdasarkan role secara eksplisit
      let isAllowed = true;

      if (pathname.startsWith("/admin") && role !== "ADMIN") {
        isAllowed = false;
      } else if (
        pathname.startsWith("/rendal") &&
        role !== "RENDAL_PEMELIHARAAN"
      ) {
        isAllowed = false;
      } else if (
        pathname.startsWith("/pemeliharaan") &&
        role !== "PEMELIHARAAN_LAPANGAN"
      ) {
        isAllowed = false;
      } else if (
        pathname.startsWith("/inspeksi") &&
        role !== "INSPEKSI_TEKNIK"
      ) {
        isAllowed = false;
      } else if (pathname.startsWith("/manajer") && role !== "MANAJER_RENDAL") {
        isAllowed = false;
      } else if (
        pathname.startsWith("/unit-kerja") &&
        role !== "UNIT_KERJA_OPERASI"
      ) {
        isAllowed = false;
      }

      if (!isAllowed) {
        return NextResponse.redirect(
          new URL(`${BASE_PATH}${homePathForRole(role)}`, request.url),
        );
      }
    } catch {
      // JSON cookie user rusak → hapus semua cookie auth, paksa login
      const loginUrl = new URL(`${BASE_PATH}/login`, request.url);
      return clearAuthCookiesOnResponse(NextResponse.redirect(loginUrl));
    }
  }

  // Tanpa userCookie, layout tetap memvalidasi token dan mengambil user via /auth/me.

  return NextResponse.next();
}

export const config = {
  matcher: [
    // "/" eksplisit: tanpa ini, akar basePath (pathname ter-strip = "/")
    // tidak kena regex di bawah dan middleware dilewati.
    "/",
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.webp$|.*\\.jpg$|.*\\.jpeg$).*)",
  ],
};
