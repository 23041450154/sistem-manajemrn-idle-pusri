// Self-check: token kedaluwarsa tidak boleh crash saat render, dan cookie auth
// harus benar-benar terhapus. Jalankan dengan dev server hidup:
//   npm run dev
//   node scripts/check-auth-clear.mjs
import assert from "node:assert/strict";

// Script ini jalan di luar Next, jadi .env tidak ikut termuat otomatis.
try {
  process.loadEnvFile(".env");
} catch {
  // Tanpa .env: pakai default di bawah.
}

const ORIGIN = process.env.BASE_URL || "http://localhost:3000";
const PREFIX = process.env.NEXT_PUBLIC_BASE_URL || "";
const AUTH_COOKIES = ["token", "user", "access_token", "refresh_token"];

// path "" = halaman root di dalam basePath, tanpa trailing slash.
async function get(path, cookie) {
  return fetch(`${ORIGIN}${PREFIX}${path}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
    signal: AbortSignal.timeout(20000),
  });
}

// 1. Render dengan token mati harus mengarahkan ke pembersih cookie, bukan error.
const boot = await get("", "token=token-kedaluwarsa");
const bootedBody = boot.status >= 300 ? "" : await boot.text();
const bootTarget = boot.headers.get("location") || bootedBody;
assert.ok(
  !bootedBody.includes("Cookies can only be modified"),
  "render masih mencoba mengubah cookie",
);
assert.match(
  bootTarget,
  /\/api\/auth\/clear/,
  "render harus mengarahkan ke /api/auth/clear",
);

// 2. Route handler menghapus keempat cookie lalu mengirim ke /login.
const clear = await get("/api/auth/clear");
assert.equal(clear.status, 303, `GET /api/auth/clear harus 303, dapat ${clear.status}`);
assert.match(
  clear.headers.get("location") || "",
  /\/login$/,
  "route handler harus redirect ke /login",
);

const cleared = clear.headers
  .getSetCookie()
  .filter((line) => AUTH_COOKIES.some((name) => line.startsWith(`${name}=`)));
assert.equal(
  cleared.length,
  AUTH_COOKIES.length,
  `harus hapus ${AUTH_COOKIES.length} cookie, dapat ${cleared.length}: ${cleared.join(" | ")}`,
);
for (const line of cleared) {
  assert.match(line, /Max-Age=0|Expires=Thu, 01 Jan 1970/i, `cookie belum dihapus: ${line}`);
}

console.log("OK: token kedaluwarsa ke /api/auth/clear, dan cookie auth terhapus.");
