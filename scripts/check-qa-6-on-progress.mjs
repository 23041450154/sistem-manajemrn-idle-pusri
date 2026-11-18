import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

// 1. DEV-16738: Modal viewport & scroll rules + table overflow-x-auto across all role modals
const scrapClient = read("src/app/(authenticated-routes)/manajer/scrap/scrap-client.tsx");
assert.match(scrapClient, /max-h-\[85vh\]/);
assert.match(scrapClient, /overflow-y-auto/);
assert.match(scrapClient, /shrink-0/);

const pemakaianClient = read("src/app/(authenticated-routes)/manajer/pemakaian/pemakaian-client.tsx");
assert.match(pemakaianClient, /max-h-\[85vh\]/);
assert.match(pemakaianClient, /flex-col/);
assert.match(pemakaianClient, /overflow-y-auto/);

const verifikasiClient = read("src/app/(authenticated-routes)/rendal/verifikasi-usulan/verifikasi-usulan-client.tsx");
assert.match(verifikasiClient, /max-h-\[85vh\]/);
assert.match(verifikasiClient, /flex-1 min-h-0 overflow-y-auto/);
assert.match(verifikasiClient, /w-full overflow-x-auto/);

// 2. DEV-16737: Setujui Usulan Scrap button + ConfirmDialog audit warning + toast
assert.match(scrapClient, /Setujui Usulan Scrap/);
assert.match(scrapClient, /Konfirmasi Persetujuan Usulan Scrap/);
assert.match(scrapClient, /Ya, Setujui Usulan/);
assert.match(scrapClient, /Kembali \/ Periksa Ulang/);
assert.match(scrapClient, /Usulan scrap untuk peralatan .* telah disetujui/);

// 3. DEV-16733: Verifikasi Usulan UK menu, page, approve/reject endpoints
assert.ok(exists("src/app/(authenticated-routes)/rendal/verifikasi-usulan/page.tsx"));
assert.ok(exists("src/app/(authenticated-routes)/rendal/verifikasi-usulan/verifikasi-usulan-client.tsx"));
const sidebar = read("src/components/Sidebar.tsx");
assert.match(sidebar, /Verifikasi Usulan UK/);
assert.match(sidebar, /\/rendal\/verifikasi-usulan/);
const apiTs = read("src/action/api.ts");
assert.match(apiTs, /\/api\/equipment\/proposals\/\$\{id\}\/verify/);
assert.match(verifikasiClient, /Terima Usulan/);
assert.match(verifikasiClient, /Tolak Usulan/);
assert.match(verifikasiClient, /INSPEKSI_1/);
assert.match(verifikasiClient, /Usulan diterima dan diteruskan ke tim inspeksi\./);

// 4. DEV-16712: Label Manajer Renhar di inspeksi/validasi-ulang + merge getApprovals("validation") & ("revalidation") di manajer/approve
const inspeksiValidasiUlang = read("src/app/(authenticated-routes)/inspeksi/validasi-ulang/validasi-ulang-client.tsx");
assert.match(inspeksiValidasiUlang, /persetujuan Manajer Renhar/);
assert.match(inspeksiValidasiUlang, /diteruskan ke[\s\S]*Manajer Renhar/);
const manajerApprovePage = read("src/app/(authenticated-routes)/manajer/approve/page.tsx");
assert.match(manajerApprovePage, /getApprovals\("validation"\)/);
assert.match(manajerApprovePage, /getApprovals\("revalidation"\)/);

// 5. DEV-16711: Datepicker Tanggal Pemeriksaan Fisik * + future date blocked + inspection_date in FormData + Riwayat displays inspection_date
const formInspeksi = read("src/app/(authenticated-routes)/inspeksi/inspeksi-berkala/formInspeksi/form-inspeksi-client.tsx");
assert.match(formInspeksi, /Tanggal Pemeriksaan Fisik/);
assert.match(formInspeksi, /type="date"/);
assert.match(formInspeksi, /max=\{todayStr\}/);
assert.match(formInspeksi, /formData\.append\("inspection_date",\s*tanggalPemeriksaan\)/);
const inspeksiBerkalaClient = read("src/app/(authenticated-routes)/inspeksi/inspeksi-berkala/inspeksi-berkala-client.tsx");
assert.match(inspeksiBerkalaClient, /row\.inspection_date/);

// 6. DEV-16708: Re-register REUSED equipment_code success message
const registerClient = read("src/app/(authenticated-routes)/rendal/register-equipment/register-equipment-client.tsx");
assert.match(registerClient, /Peralatan berhasil didaftarkan sebagai siklus idle baru\./);

console.log("PASS: Semua 6 task on-progress naufal (DEV-16738, 16737, 16733, 16712, 16711, 16708) tervalidasi QA.");
