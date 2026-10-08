import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cookie hanya bisa dihapus di Route Handler atau Server Action, tidak saat
// render. Jadi page/layout cukup redirect ke sini: cookie dibersihkan, user
// dikirim ke /login. Tanpa ini, token kedaluwarsa bikin loop /login <-> dashboard.
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
const AUTH_COOKIES = ["token", "user", "access_token", "refresh_token"];

export function GET(request: NextRequest) {
  const res = NextResponse.redirect(
    new URL(`${BASE_PATH}/login`, request.url),
    303,
  );
  for (const name of AUTH_COOKIES) {
    res.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return res;
}
