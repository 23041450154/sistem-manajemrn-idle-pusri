import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL } from "@/config/api";
import { BASE_PATH } from "@/lib/base-path";

// ENDPOINT DIAGNOSTIK SEMENTARA (hapus setelah root cause SSO dev ketemu).
// Tujuan: dari DALAM container FE (server-side), laporkan:
//  - API_URL yang ke-bake (deteksi hairpin: FE nembak URL publik sendiri)
//  - cookie "token" kebaca server-side atau tidak
//  - hasil fetch server->BE ke {API_URL}/api/auth/me (status / error koneksi)
// AMAN: tidak membocorkan nilai token (hanya panjang); di-gate DIAG_KEY.
// Token untuk uji hairpin dikirim via header "x-diag-token" (bukan query,
// supaya tidak masuk access log), atau diambil dari cookie bila ada.
export const dynamic = "force-dynamic";

const DIAG_KEY = "idle-diag-2026";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== DIAG_KEY) {
    return new NextResponse("not found", { status: 404 });
  }

  const jar = await cookies();
  const cookieToken = jar.get("token")?.value ?? null;
  const headerToken = req.headers.get("x-diag-token");
  const token = headerToken || cookieToken;

  const meUrl = `${API_URL}/api/auth/me`;
  const result: Record<string, unknown> = {
    apiUrl: API_URL,
    basePath: BASE_PATH,
    node: process.version,
    tokenSource: headerToken ? "header" : cookieToken ? "cookie" : "none",
    tokenCookie: cookieToken
      ? { present: true, length: cookieToken.length }
      : { present: false },
    meUrl,
  };

  const started = Date.now();
  try {
    const res = await fetch(meUrl, {
      headers: token
        ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
        : { Accept: "application/json" },
      cache: "no-store",
    });
    const body = await res.text();
    result.meFetch = {
      ok: res.ok,
      status: res.status,
      ms: Date.now() - started,
      bodySnippet: body.slice(0, 300),
    };
  } catch (e) {
    result.meFetch = {
      error: String(e),
      cause: e instanceof Error && e.cause ? String(e.cause) : undefined,
      ms: Date.now() - started,
    };
  }

  return NextResponse.json(result);
}
