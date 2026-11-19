import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relPath) => fs.readFileSync(path.join(root, relPath), "utf8");
const exists = (relPath) => fs.existsSync(path.join(root, relPath));

// 1. Verifikasi rute /rendal/daftar-equipment & detail [id] memakai komponen Unit Kerja (Tabel + Katalog)
assert.ok(
  exists("src/app/(authenticated-routes)/rendal/daftar-equipment/page.tsx"),
  "rendal/daftar-equipment/page.tsx harus tersedia",
);
assert.ok(
  exists("src/app/(authenticated-routes)/rendal/daftar-equipment/[id]/page.tsx"),
  "rendal/daftar-equipment/[id]/page.tsx harus tersedia",
);

const rendalPage = read(
  "src/app/(authenticated-routes)/rendal/daftar-equipment/page.tsx",
);
assert.match(rendalPage, /DaftarEquipmentView/);
assert.match(rendalPage, /catalogDetailBasePath="\/rendal\/daftar-equipment"/);
assert.match(rendalPage, /canRequestReuse=\{false\}/);

const rendalDetailPage = read(
  "src/app/(authenticated-routes)/rendal/daftar-equipment/[id]/page.tsx",
);
assert.match(rendalDetailPage, /KatalogDetailView/);
assert.match(rendalDetailPage, /backHref="\/rendal\/daftar-equipment"/);
assert.match(rendalDetailPage, /canRequestReuse=\{false\}/);

const daftarAsetClient = read(
  "src/app/(authenticated-routes)/unit-kerja/daftar-aset/daftar-aset-client.tsx",
);
assert.match(daftarAsetClient, /Daftar Tabel/);
assert.match(daftarAsetClient, /Katalog/);
assert.match(daftarAsetClient, /detailBasePath=\{catalogDetailBasePath\}/);

// 2. Verifikasi Sidebar: Rendal mengarah ke /rendal/daftar-equipment & tidak ada link lintas role
const sidebar = read("src/components/Sidebar.tsx");
assert.match(sidebar, /href:\s*"\/rendal\/daftar-equipment"/);
assert.doesNotMatch(sidebar, /href:\s*"\/unit-kerja\/katalog"/);

// 3. Verifikasi seluruh 6 layout role wajib memakai RoleGuard single-role tanpa silent redirect
const expectedRoleLayouts = [
  ["src/app/(authenticated-routes)/admin/layout.tsx", "ADMIN"],
  ["src/app/(authenticated-routes)/rendal/layout.tsx", "RENDAL_PEMELIHARAAN"],
  [
    "src/app/(authenticated-routes)/pemeliharaan/layout.tsx",
    "PEMELIHARAAN_LAPANGAN",
  ],
  ["src/app/(authenticated-routes)/inspeksi/layout.tsx", "INSPEKSI_TEKNIK"],
  ["src/app/(authenticated-routes)/manajer/layout.tsx", "MANAJER_RENDAL"],
  ["src/app/(authenticated-routes)/unit-kerja/layout.tsx", "UNIT_KERJA_OPERASI"],
];

for (const [layoutPath, roleName] of expectedRoleLayouts) {
  const src = read(layoutPath);
  assert.match(
    src,
    new RegExp(`allowedRole="${roleName}"`),
    `${layoutPath} harus mengunci akses ke ${roleName}`,
  );
  assert.doesNotMatch(
    src,
    /homePathForRole/,
    `${layoutPath} tidak boleh me-redirect diam-diam ke dashboard`,
  );
}

const unitKerjaLayout = read(
  "src/app/(authenticated-routes)/unit-kerja/layout.tsx",
);
assert.doesNotMatch(
  unitKerjaLayout,
  /RENDAL_PEMELIHARAAN/,
  "unit-kerja/layout.tsx tidak boleh lagi membuka akses ke RENDAL_PEMELIHARAAN",
);

// 4. Verifikasi RoleGuard, UnauthorizedView, dan proxy.ts mengembalikan 401 Unauthorized
const roleGuard = read("src/components/RoleGuard.tsx");
assert.match(roleGuard, /UnauthorizedView/);

const unauthorizedView = read("src/components/UnauthorizedView.tsx");
assert.match(unauthorizedView, /401 UNAUTHORIZED/);

const proxySrc = read("src/proxy.ts");
assert.match(proxySrc, /"\/unauthorized"/);
assert.match(proxySrc, /requiredRoleForPath/);
assert.match(proxySrc, /status:\s*401/);

assert.ok(
  exists("src/app/unauthorized/page.tsx") && exists("src/app/unauthorized.tsx"),
  "Halaman unauthorized harus tersedia",
);

console.log(
  "PASS: /rendal/daftar-equipment (tabel + katalog) dan RBAC 401 Unauthorized tervalidasi.",
);
