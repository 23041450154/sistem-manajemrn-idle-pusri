// Self-check: foto equipment harus disajikan lewat /api/proxy-image (token
// dipasang server), bukan URL backend mentah yang butuh token di browser.
// Jalankan dengan dev server + backend hidup:
//   npm run dev
//   node scripts/check-photo-url.mjs
import assert from "node:assert/strict";

try {
  process.loadEnvFile(".env");
} catch {
  // Tanpa .env: pakai default di bawah.
}

const ORIGIN = process.env.BASE_URL || "http://localhost:3000";
const PREFIX = process.env.NEXT_PUBLIC_BASE_URL || "";
const API = (process.env.API_URL || "http://127.0.0.1:8080").replace(/\/+$/, "");
const PASSWORD = process.env.CHECK_PASSWORD || "password123";

// NPP seed per role: tiap halaman hanya boleh dibuka role pemiliknya.
const PAGES = [
  { path: "/rendal/idle", npp: "100002" },
  { path: "/unit-kerja/idle", npp: "100006" },
  { path: "/unit-kerja/katalog", npp: "100006" },
  { path: "/pemeliharaan/perbaikan-alat", npp: "100004" },
  { path: "/inspeksi/inspeksi-berkala", npp: "100003" },
  { path: "/manajer/disposal", npp: "100005" },
  { path: "/manajer/approve", npp: "100005" },
];

async function login(npp) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ npp, password: PASSWORD }),
    signal: AbortSignal.timeout(15000),
  });
  const token = (await res.json())?.data?.token;
  assert.ok(token, `login ${npp} gagal (HTTP ${res.status})`);
  return token;
}

let photosChecked = 0;

for (const { path, npp } of PAGES) {
  const token = await login(npp);
  const page = await fetch(`${ORIGIN}${PREFIX}${path}`, {
    headers: { cookie: `token=${token}` },
    redirect: "manual",
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(page.status, 200, `${path} harus 200, dapat ${page.status}`);
  const html = await page.text();

  // Tidak boleh ada URL backend mentah: browser tidak bisa memasang token.
  assert.ok(
    !html.includes(`${API}/uploads/`),
    `${path} masih mengirim URL backend mentah (${API}/uploads/...) ke browser`,
  );
  assert.ok(
    !/["(\s]\/uploads\//.test(html),
    `${path} masih mengirim path /uploads/ tanpa basePath dan tanpa token`,
  );

  const found = html.match(
    new RegExp(`${PREFIX}/api/proxy-image\\?url=[^"\\\\\\s&]+`, "g"),
  );
  if (!found) {
    console.log(`  ${path}: tidak ada foto di halaman ini`);
    continue;
  }

  const photo = await fetch(`${ORIGIN}${found[0]}`, {
    headers: { cookie: `token=${token}` },
    signal: AbortSignal.timeout(30000),
  });
  assert.ok(photo.ok, `${path}: proxy foto harus 200, dapat ${photo.status}`);
  assert.match(
    photo.headers.get("content-type") || "",
    /^image\//,
    `${path}: proxy harus mengirim gambar`,
  );
  photosChecked += 1;
  console.log(`  ${path}: ${found.length} URL proxy, contoh ${found[0]}`);
}

assert.ok(photosChecked > 0, "tidak ada satu pun URL foto yang bisa diperiksa");
console.log(`OK: ${photosChecked} halaman memakai /api/proxy-image dan gambarnya termuat.`);
