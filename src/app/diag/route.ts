import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL, API_URL_PUBLIC, API_URL_INTERNAL } from "@/config/api";
import { BASE_PATH } from "@/lib/base-path";

// Uji satu base URL: fetch {base}/api/auth/me, laporkan status / error koneksi.
async function probeBase(
  base: string,
  token: string | null,
): Promise<Record<string, unknown>> {
  const url = `${base.replace(/\/$/, "")}/api/auth/me`;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: token
        ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
        : { Accept: "application/json" },
      cache: "no-store",
    });
    const body = await res.text();
    return {
      base,
      ok: res.ok,
      status: res.status,
      ms: Date.now() - started,
      bodySnippet: body.slice(0, 200),
    };
  } catch (e) {
    return {
      base,
      error: String(e),
      cause: e instanceof Error && e.cause ? String(e.cause) : undefined,
      ms: Date.now() - started,
    };
  }
}

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

  // Dump ENV: key non-rahasia di-print apa adanya; sisanya HANYA status
  // ada/enggak + panjang (jangan pernah bocorkan nilai rahasia).
  const SAFE_KEYS = [
    "NODE_ENV",
    "NEXT_PUBLIC_API_URL",
    "API_URL",
    "API_URL_INTERNAL",
    "NEXT_PUBLIC_API_SSO",
    "NEXT_PUBLIC_CLIENT_ID",
    "NEXT_PUBLIC_BASE_URL",
    "NEXT_PUBLIC_SSO_OIDC_BASE_URL",
    "NEXT_PUBLIC_SSO_REALM",
    "SERVER_ACTIONS_ALLOWED_ORIGINS",
    "PORT",
    "HOSTNAME",
  ];
  const SECRET_KEYS = ["JWT_SECRET", "SSO_CLIENT_SECRET"];
  const env: Record<string, unknown> = {};
  for (const k of SAFE_KEYS) env[k] = process.env[k] ?? null;
  for (const k of SECRET_KEYS) {
    const v = process.env[k];
    env[k] = v ? { present: true, length: v.length } : { present: false };
  }

  const result: Record<string, unknown> = {
    apiUrl: API_URL,
    apiUrlPublic: API_URL_PUBLIC,
    apiUrlInternal: API_URL_INTERNAL,
    basePath: BASE_PATH,
    node: process.version,
    env,
    tokenSource: headerToken ? "header" : cookieToken ? "cookie" : "none",
    tokenCookie: cookieToken
      ? { present: true, length: cookieToken.length }
      : { present: false },
    meUrl: `${API_URL}/api/auth/me`,
  };

  // Uji default (API_URL yang dipakai server action).
  result.meFetch = await probeBase(API_URL, token);

  // Uji kandidat internal via ?probe=urlA,urlB (buat nemu Service BE k8s).
  // Contoh: ?probe=http://idle-backend:8080,http://idle-backend:3000
  const probeParam = req.nextUrl.searchParams.get("probe");
  if (probeParam) {
    const bases = probeParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);
    result.probes = await Promise.all(bases.map((b) => probeBase(b, token)));
  }

  return NextResponse.json(result);
}
