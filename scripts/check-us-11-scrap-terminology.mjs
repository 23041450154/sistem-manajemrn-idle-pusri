import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
	mapScrapMethodName,
	scrapStatusBadge,
	scrapStatusLabel,
	disposalDisplayStatus,
} from "../src/lib/approvals.ts";
import {
	statusText,
	statusBadgeStyle,
} from "../src/lib/equipment-status.ts";

console.log("--- Menjalankan Verifikasi US-11-FE: Terminologi Baku Scrap & Hibah ---");

// =========================================================================
// AC-02 & AC-05: Pemetaan Metode Scrap Resmi BUMN & Kompatibilitas Data ID
// =========================================================================
console.log("1. Verifikasi AC-02 & AC-05 (Dropdown Metode Scrap & Hibah)...");

// Verifikasi kata 'Donasi' atau ID 3 dipetakan ke 'Hibah (Institusi Pendidikan / Lembaga)'
assert.equal(
	mapScrapMethodName("Donasi", 3),
	"Hibah (Institusi Pendidikan / Lembaga)",
	"Donasi dengan ID 3 harus dipetakan ke 'Hibah (Institusi Pendidikan / Lembaga)'",
);
assert.equal(
	mapScrapMethodName("donasi"),
	"Hibah (Institusi Pendidikan / Lembaga)",
	"Lowercase donasi harus dipetakan ke 'Hibah (Institusi Pendidikan / Lembaga)'",
);
assert.equal(
	mapScrapMethodName("Hibah", 3),
	"Hibah (Institusi Pendidikan / Lembaga)",
	"Hibah harus dipetakan ke 'Hibah (Institusi Pendidikan / Lembaga)'",
);

// Verifikasi metode lainnya
assert.equal(
	mapScrapMethodName("Lelang", 2),
	"Penjualan Scrap / Lelang",
	"Lelang/Scrap ID 2 harus dipetakan ke 'Penjualan Scrap / Lelang'",
);
assert.equal(
	mapScrapMethodName("Pemusnahan", 1),
	"Pemusnahan Fisik",
	"Pemusnahan ID 1 harus dipetakan ke 'Pemusnahan Fisik'",
);
assert.equal(
	mapScrapMethodName("Trade-In", 4),
	"Tukar Tambah (Trade-In)",
	"Trade-In ID 4 harus dipetakan ke 'Tukar Tambah (Trade-In)'",
);

// Jika ada teks lama 'Disposal', harus dipetakan ke 'Penjualan Scrap / Lelang'
assert.equal(
	mapScrapMethodName("Disposal"),
	"Penjualan Scrap / Lelang",
	"Teks 'Disposal' harus diganti dengan 'Penjualan Scrap / Lelang'",
);
assert.equal(
	mapScrapMethodName("Disposal Aset"),
	"Penjualan Scrap / Lelang",
	"Teks 'Disposal Aset' harus dipetakan ke 'Penjualan Scrap / Lelang'",
);

console.log("   ✓ AC-02 & AC-05 lulus: Opsi metode Hibah dan Scrap terpetakan dengan benar dan kompatibel");

// =========================================================================
// AC-04: Tampilan Badge Status Scrap
// =========================================================================
console.log("2. Verifikasi AC-04 (Tampilan Responsif & Badge)...");

// Badge Hijau: Disetujui Scrap
const approvedBadge = scrapStatusBadge("APPROVED");
assert.equal(approvedBadge.label, "Disetujui Scrap");
assert.match(approvedBadge.style, /bg-\[#DCFCE7\]/, "Badge Disetujui Scrap harus berwarna hijau");

const disposedBadge = scrapStatusBadge("DISPOSED");
assert.equal(disposedBadge.label, "Disetujui Scrap");
assert.match(disposedBadge.style, /bg-\[#DCFCE7\]/, "Badge Disposed harus berwarna hijau");

// Badge Kuning: Menunggu Review Scrap
const pendingBadge = scrapStatusBadge("PENDING");
assert.equal(pendingBadge.label, "Menunggu Review Scrap");
assert.match(pendingBadge.style, /bg-\[#FEF3C7\]/, "Badge Menunggu Review Scrap harus berwarna kuning/amber");

const inReviewBadge = scrapStatusBadge("IN_REVIEW");
assert.equal(inReviewBadge.label, "Menunggu Review Scrap");
assert.match(inReviewBadge.style, /bg-\[#FEF3C7\]/);

// Badge Merah: Ditolak Scrap
const rejectedBadge = scrapStatusBadge("REJECTED");
assert.equal(rejectedBadge.label, "Ditolak Scrap");
assert.match(rejectedBadge.style, /bg-\[#FEE2E2\]/, "Badge Ditolak Scrap harus berwarna merah");

// Badge Ungu: Perlu Revisi Scrap
const revisionBadge = scrapStatusBadge("REVISION_REQUIRED");
assert.equal(revisionBadge.label, "Perlu Revisi Scrap");
assert.match(revisionBadge.style, /bg-\[#F3E8FF\]/, "Badge Perlu Revisi Scrap harus berwarna ungu");

// Status label checks
assert.equal(scrapStatusLabel("APPROVED"), "Disetujui Scrap");
assert.equal(scrapStatusLabel("PENDING"), "Menunggu Review Scrap");
assert.equal(scrapStatusLabel("REJECTED"), "Ditolak Scrap");
assert.equal(scrapStatusLabel("REVISION_REQUIRED"), "Perlu Revisi Scrap");

// Status asset kanonik: DISPOSAL_RECOMMENDED -> SCRAP RECOMMENDED
assert.equal(statusText("DISPOSAL_RECOMMENDED"), "SCRAP RECOMMENDED");
assert.equal(statusText("SCRAP_RECOMMENDED"), "SCRAP RECOMMENDED");
assert.match(statusBadgeStyle("DISPOSAL_RECOMMENDED"), /bg-\[#FEF3C7\]/);

console.log("   ✓ AC-04 lulus: Format badge status scrap sesuai standar warna & teks");

// =========================================================================
// AC-01: Pembersihan Kata Disposal pada UI Label, Sidebar, Header, Tombol
// =========================================================================
console.log("3. Verifikasi AC-01 (Pembersihan Kata Disposal di UI)...");

// Sidebar
const sidebarContent = fs.readFileSync(path.resolve("src/components/Sidebar.tsx"), "utf-8");
assert.ok(sidebarContent.includes('name: "Permintaan Scrap"') && sidebarContent.includes('href: "/rendal/scrap"'), "Sidebar Rendal harus memiliki menu 'Permintaan Scrap'");
assert.ok(sidebarContent.includes('name: "Persetujuan Scrap"') && sidebarContent.includes('href: "/manajer/scrap"'), "Sidebar Manajer harus memiliki menu 'Persetujuan Scrap'");
assert.ok(!sidebarContent.includes('name: "Permintaan Disposal"'), "Tidak boleh ada menu 'Permintaan Disposal'");
assert.ok(!sidebarContent.includes('name: "Persetujuan Disposal"'), "Tidak boleh ada menu 'Persetujuan Disposal'");

// Rendal Scrap Page
const rendalScrapPage = fs.readFileSync(path.resolve("src/app/(authenticated-routes)/rendal/scrap/page.tsx"), "utf-8");
assert.ok(rendalScrapPage.includes("Permintaan Scrap"), "Header halaman Rendal Scrap harus menggunakan 'Permintaan Scrap'");
assert.ok(rendalScrapPage.includes("Ajukan Scrap"), "Tombol aksi Rendal Scrap harus menggunakan 'Ajukan Scrap'");
assert.ok(rendalScrapPage.includes("Penjualan Scrap / Lelang"), "Dropdown Rendal Scrap harus memuat 'Penjualan Scrap / Lelang'");
assert.ok(rendalScrapPage.includes("Hibah (Institusi Pendidikan / Lembaga)"), "Dropdown Rendal Scrap harus memuat 'Hibah'");
assert.ok(rendalScrapPage.includes("Pemusnahan Fisik"), "Dropdown Rendal Scrap harus memuat 'Pemusnahan Fisik'");
assert.ok(rendalScrapPage.includes("Tukar Tambah (Trade-In)"), "Dropdown Rendal Scrap harus memuat 'Tukar Tambah (Trade-In)'");

// Manajer Scrap Client
const manajerScrapClient = fs.readFileSync(path.resolve("src/app/(authenticated-routes)/manajer/scrap/scrap-client.tsx"), "utf-8");
assert.ok(manajerScrapClient.includes("Persetujuan Scrap Aset"), "Header halaman Manajer Scrap harus menggunakan 'Persetujuan Scrap Aset'");
assert.ok(manajerScrapClient.includes("Taksiran Nilai Scrap"), "Tabel header Manajer Scrap harus menggunakan 'Taksiran Nilai Scrap'");
assert.ok(manajerScrapClient.includes("Setujui Scrap"), "Tombol Manajer Scrap harus menggunakan 'Setujui Scrap'");
assert.ok(manajerScrapClient.includes("Tolak Pengajuan Scrap"), "Tombol penolakan harus menggunakan 'Tolak Pengajuan Scrap'");

// Rendal Laporan
const laporanClient = fs.readFileSync(path.resolve("src/app/(authenticated-routes)/rendal/laporan/laporan-client.tsx"), "utf-8");
assert.ok(!laporanClient.includes('<option value="Disposal">Disposal</option>'), "Filter laporan tidak boleh menampilkan opsi 'Disposal'");
assert.ok(laporanClient.includes('<option value="Scrap">Scrap</option>'), "Filter laporan harus menampilkan opsi 'Scrap'");

console.log("   ✓ AC-01 lulus: Tidak ada UI label 'Disposal' di sidebar, tabel header, tombol");

// =========================================================================
// AC-03: Konsistensi Modal Dialog dan Peringatan Scrap
// =========================================================================
console.log("4. Verifikasi AC-03 (Konsistensi Modal Dialog)...");

// Modal di Rendal Scrap
assert.ok(rendalScrapPage.includes("Modal Pengajuan Scrap"), "Judul modal pengajuan harus 'Modal Pengajuan Scrap'");
assert.ok(rendalScrapPage.includes("Modal Revisi Pengajuan Scrap"), "Judul modal revisi harus 'Modal Revisi Pengajuan Scrap'");
assert.ok(rendalScrapPage.includes("Detail Usulan Scrap"), "Judul modal detail harus 'Detail Usulan Scrap'");
assert.ok(rendalScrapPage.includes("Kirim Usulan Scrap?"), "Konfirmasi dialog harus bertuliskan 'Kirim Usulan Scrap?'");

// Modal di Manajer Scrap
assert.ok(manajerScrapClient.includes("Modal Konfirmasi Persetujuan Scrap"), "Modal approve harus bertuliskan 'Modal Konfirmasi Persetujuan Scrap'");
assert.ok(manajerScrapClient.includes("Modal Konfirmasi Penolakan Scrap"), "Modal reject harus bertuliskan 'Modal Konfirmasi Penolakan Scrap'");
assert.ok(manajerScrapClient.includes("Detail Peninjauan Usulan Scrap Aset"), "Modal detail harus bertuliskan 'Detail Peninjauan Usulan Scrap Aset'");

console.log("   ✓ AC-03 lulus: Semua judul modal dan konfirmasi konsisten menggunakan istilah Scrap");

console.log("\n Semua kriteria penerimaan (AC-01 hingga AC-05) US-11-FE berhasil diverifikasi!");
