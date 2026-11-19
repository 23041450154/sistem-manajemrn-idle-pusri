// Self-check untuk 3 task ClickUp teratas (Database Idle Equipment):
//   1. DEV-16738: Standardisasi Global Layout Modal & Tabel Responsif (Anti-Terpotong 1366x768)
//   2. DEV-16737: Modal Konfirmasi Audit & Standardisasi Tombol "Setujui Usulan Scrap"
//   3. DEV-16711: Input Tanggal Pemeriksaan Fisik pada Form Inspeksi Berkala
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const read = (p) => readFileSync(p, "utf8");

// ============================================================================
// 1. DEV-16711: Input Tanggal Pemeriksaan Fisik pada Form Inspeksi Berkala
// ============================================================================
const utilsSrc = read("src/lib/utils.ts");
assert.ok(utilsSrc.includes("export function todayLocalDate"), "todayLocalDate harus tersedia di src/lib/utils.ts");
assert.ok(utilsSrc.includes("export function formatIsoDate"), "formatIsoDate harus tersedia di src/lib/utils.ts");
assert.ok(utilsSrc.includes('timeZone: "Asia/Jakarta"'), "formatIsoDate/todayLocalDate wajib memakai zona waktu Asia/Jakarta");

const formInspeksiSrc = read(
  "src/app/(authenticated-routes)/inspeksi/inspeksi-berkala/formInspeksi/form-inspeksi-client.tsx",
);
assert.ok(
  formInspeksiSrc.includes("Tanggal Pemeriksaan Fisik"),
  "Form Inspeksi Berkala wajib menampilkan label 'Tanggal Pemeriksaan Fisik'",
);
assert.ok(
  formInspeksiSrc.includes('type="date"') && formInspeksiSrc.includes("max={todayStr}"),
  "Input tanggal wajib bertipe date dan memblokir tanggal masa depan (max={todayStr})",
);
assert.ok(
  formInspeksiSrc.includes('formData.append("inspection_date", tanggalPemeriksaan)'),
  "Submit FormData wajib menyertakan field inspection_date",
);

const berkalaPageSrc = read(
  "src/app/(authenticated-routes)/inspeksi/inspeksi-berkala/page.tsx",
);
assert.ok(
  berkalaPageSrc.includes("ins.inspection_date || ins.inspected_at"),
  "Halaman Inspeksi Berkala wajib memprioritaskan ins.inspection_date",
);

const berkalaClientSrc = read(
  "src/app/(authenticated-routes)/inspeksi/inspeksi-berkala/inspeksi-berkala-client.tsx",
);
assert.ok(
  berkalaClientSrc.includes("formatIsoDate(row.inspection_date)") &&
    berkalaClientSrc.includes("formatIsoDate(detailRow.inspection_date)"),
  "Tabel Riwayat & Modal Detail Inspeksi Berkala wajib menampilkan formatIsoDate(inspection_date)",
);

// ============================================================================
// 2. DEV-16737: Modal Konfirmasi Audit & Tombol "Setujui Usulan Scrap"
// ============================================================================
const manajerScrapSrc = read(
  "src/app/(authenticated-routes)/manajer/scrap/scrap-client.tsx",
);
assert.ok(
  manajerScrapSrc.includes("Setujui Usulan Scrap"),
  "Tombol persetujuan di /manajer/scrap wajib bertuliskan 'Setujui Usulan Scrap'",
);
assert.ok(
  !/>\s*Setujui Scrap\s*</.test(manajerScrapSrc),
  "Teks lama 'Setujui Scrap' tidak boleh muncul lagi pada tombol persetujuan",
);
assert.ok(
  manajerScrapSrc.includes('title="Konfirmasi Persetujuan Usulan Scrap"'),
  "ConfirmDialog wajib berjudul 'Konfirmasi Persetujuan Usulan Scrap'",
);
assert.ok(
  manajerScrapSrc.includes(
    "Apakah Anda yakin menyetujui dokumen usulan scrap untuk peralatan",
  ) &&
    manajerScrapSrc.includes(
      "Tindakan ini akan meneruskan berkas usulan ke tahap administrasi penghapusan aset resmi perusahaan.",
    ),
  "ConfirmDialog wajib memuat kalimat peringatan audit resmi sesuai AC 2",
);
assert.ok(
  manajerScrapSrc.includes('cancelLabel="Kembali / Periksa Ulang"'),
  "Tombol batal pada ConfirmDialog wajib bertuliskan 'Kembali / Periksa Ulang'",
);
assert.ok(
  manajerScrapSrc.includes('confirmLabel="Ya, Setujui Usulan"'),
  "Tombol konfirmasi pada ConfirmDialog wajib bertuliskan 'Ya, Setujui Usulan'",
);
assert.ok(
  manajerScrapSrc.includes(" telah disetujui.") &&
    manajerScrapSrc.includes("Berhasil! Usulan scrap untuk peralatan "),
  "Toast pasca-eksekusi wajib menampilkan pesan sesuai AC 3",
);
assert.ok(
  manajerScrapSrc.includes('changeTab("history")'),
  "Pasca-persetujuan wajib memindahkan tab ke Riwayat Keputusan",
);

// ============================================================================
// 3. DEV-16738: Standardisasi Global Modal (max-h-[85vh]) & Tabel (overflow-x-auto)
// ============================================================================
// Pastikan tidak ada modal dialog yang masih memakai max-h-[90vh] atau max-h-[92vh]
const modal90Matches = execSync(
  "grep -rn 'max-h-\\[9[0-9]vh\\]' --include='*.tsx' src/ || true",
  { encoding: "utf8" },
).trim();
assert.equal(
  modal90Matches,
  "",
  `Masih ada modal dengan max-h-[90vh+]:\n${modal90Matches}`,
);

const modalFiles = [
  "src/components/ConfirmDialog.tsx",
  "src/components/DeleteConfirmDialog.tsx",
  "src/components/MasterDataTable.tsx",
  "src/app/(authenticated-routes)/admin/users/page.tsx",
  "src/app/(authenticated-routes)/inspeksi/inspeksi-berkala/inspeksi-berkala-client.tsx",
  "src/app/(authenticated-routes)/inspeksi/validasi/validasi-client.tsx",
  "src/app/(authenticated-routes)/inspeksi/validasi-ulang/validasi-ulang-client.tsx",
  "src/app/(authenticated-routes)/manajer/approve/approve-client.tsx",
  "src/app/(authenticated-routes)/manajer/pemakaian/pemakaian-client.tsx",
  "src/app/(authenticated-routes)/manajer/scrap/scrap-client.tsx",
  "src/app/(authenticated-routes)/pemeliharaan/perbaikan-alat/perbaikan-alat-client.tsx",
  "src/app/(authenticated-routes)/rendal/idle/idle-client.tsx",
  "src/app/(authenticated-routes)/rendal/perbaikan/perbaikan-client.tsx",
  "src/app/(authenticated-routes)/rendal/scrap/page.tsx",
  "src/app/(authenticated-routes)/rendal/validasi-ulang/validasi-ulang-client.tsx",
  "src/app/(authenticated-routes)/unit-kerja/daftar-aset/daftar-aset-client.tsx",
  "src/app/(authenticated-routes)/unit-kerja/idle/idle-client.tsx",
  "src/app/(authenticated-routes)/unit-kerja/katalog/[id]/request-modal-button.tsx",
  "src/app/(authenticated-routes)/unit-kerja/konfirmasi-pemasangan/konfirmasi-pemasangan-client.tsx",
  "src/app/(authenticated-routes)/unit-kerja/usulan-idle/usulan-idle-client.tsx",
];

for (const file of modalFiles) {
  const src = read(file);
  assert.ok(
    src.includes("max-h-[85vh]"),
    `${file} wajib memakai batas tinggi modal max-h-[85vh]`,
  );
  assert.ok(
    src.includes("shrink-0"),
    `${file} wajib mengunci header/footer modal dengan shrink-0`,
  );
  assert.ok(
    src.includes("overflow-y-auto"),
    `${file} wajib menyediakan internal scroll overflow-y-auto pada body modal`,
  );
}

console.log(
  `check-sprint6-top3-tasks.mjs OK — DEV-16711, DEV-16737, dan DEV-16738 (${modalFiles.length} file modal) tervalidasi.`,
);
