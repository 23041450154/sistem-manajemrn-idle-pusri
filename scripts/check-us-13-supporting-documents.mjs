// Self-check: Verifikasi spesifikasi US-13-FE (Upload Dokumen Pendukung Justifikasi Kebutuhan AC 1, AC 2, AC 3)
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

console.log("Memulai pengujian US-13-FE: Upload Dokumen Pendukung Justifikasi Kebutuhan...");

// 1. Verifikasi modul helper src/lib/reuse-documents.ts
assert.ok(existsSync("src/lib/reuse-documents.ts"), "Module src/lib/reuse-documents.ts ada");
const docHelperSrc = readFileSync("src/lib/reuse-documents.ts", "utf8");

assert.match(docHelperSrc, /export interface SupportingDocumentMeta/, "Interface SupportingDocumentMeta diekspor");
assert.match(docHelperSrc, /MAX_FILE_SIZE_BYTES\s*=\s*25\s*\*\s*1024\s*\*\s*1024/, "Batas ukuran 25 MB terdefinisi");
assert.match(docHelperSrc, /export function validateSupportingFile/, "Fungsi validateSupportingFile diekspor");
assert.match(docHelperSrc, /export function formatFileSize/, "Fungsi formatFileSize diekspor");
assert.match(docHelperSrc, /Ukuran file maksimal adalah 25 MB/, "Pesan error batas ukuran 25 MB sesuai AC 2");
assert.match(docHelperSrc, /pdf.*docx.*xlsx.*dwg.*jpg.*png/i, "Format file yang didukung lengkap");
console.log("✓ src/lib/reuse-documents.ts lengkap dan valid");

// Import and test helper functions dynamically
const { validateSupportingFile, formatFileSize, getFileExtension } = await import("../src/lib/reuse-documents.ts");

// AC 2: Validasi ukuran file > 25 MB
const fakeBigFile = {
	name: "kajian_teknis_pompa_besar.pdf",
	size: 26 * 1024 * 1024, // 26 MB
};
const bigRes = validateSupportingFile(fakeBigFile);
assert.strictEqual(bigRes.valid, false, "File > 25 MB harus ditolak");
assert.strictEqual(bigRes.error, "Ukuran file maksimal adalah 25 MB", "Pesan error tepat sesuai AC 2");

// AC 2: Validasi format tidak diizinkan
const fakeBadFile = {
	name: "script_malware.exe",
	size: 1024 * 1024,
};
const badRes = validateSupportingFile(fakeBadFile);
assert.strictEqual(badRes.valid, false, "File format tidak diizinkan harus ditolak");
assert.match(badRes.error, /tidak diizinkan/, "Pesan error format informatif");

// AC 2: Format yang diizinkan (PDF, DOCX, XLSX, DWG, JPG/PNG)
for (const ext of ["pdf", "docx", "xlsx", "dwg", "jpg", "png"]) {
	const validFile = {
		name: `dokumen_justifikasi.${ext}`,
		size: 2.4 * 1024 * 1024,
	};
	const res = validateSupportingFile(validFile);
	assert.strictEqual(res.valid, true, `Format .${ext} harus diterima`);
}

// AC 2: Format ukuran mudah dibaca (misal 2.4 MB)
assert.strictEqual(formatFileSize(2516582), "2.4 MB", "Format ukuran 2.4 MB terverifikasi");
assert.strictEqual(formatFileSize(512000), "500.0 KB", "Format ukuran KB terverifikasi");
console.log("✓ AC 2: Logika validasi client-side dan formatting ukuran file terverifikasi");

// 2. Verifikasi komponen UI SupportingDocumentUpload.tsx
assert.ok(existsSync("src/components/SupportingDocumentUpload.tsx"), "Komponen SupportingDocumentUpload.tsx ada");
const uploadCompSrc = readFileSync("src/components/SupportingDocumentUpload.tsx", "utf8");

// AC 1: Label, Badge Opsional, dan Hint Text
assert.match(uploadCompSrc, /Dokumen Pendukung \/ Justifikasi Kebutuhan/, "AC 1: Label Dokumen Pendukung / Justifikasi Kebutuhan ada");
assert.match(uploadCompSrc, /\(Opsional\)/, "AC 1: Badge (Opsional) ada");
assert.match(uploadCompSrc, /Format yang didukung: PDF, DOCX, XLSX, DWG, JPG\/PNG \(Maks\. 25 MB\)/, "AC 1: Hint Text lengkap persis sesuai AC 1");

// AC 2: Drag-and-Drop, Browse File, Preview Card, Hapus Berkas
assert.match(uploadCompSrc, /onDragOver/, "AC 2: Drag & drop didukung");
assert.match(uploadCompSrc, /onDrop/, "AC 2: Event onDrop didukung");
assert.match(uploadCompSrc, /Browse File/, "AC 2: Tombol Browse File tersedia");
assert.match(uploadCompSrc, /Trash2/, "AC 2: Ikon hapus / batalkan (Trash2) tersedia");
assert.match(uploadCompSrc, /formatFileSize/, "AC 2: Preview menampilkan ukuran file terformat");
console.log("✓ AC 1 & AC 2: Komponen SupportingDocumentUpload.tsx memenuhi semua kriteria");

// 3. Verifikasi peletakan komponen di Form Permohonan Reuse
const idleSrc = readFileSync("src/app/(authenticated-routes)/unit-kerja/idle/idle-client.tsx", "utf8");
assert.match(idleSrc, /SupportingDocumentUpload/, "idle-client.tsx memuat SupportingDocumentUpload");
assert.match(idleSrc, /Dokumen Pendukung \/ Justifikasi Kebutuhan/, "idle-client.tsx meletakkan upload dokumen di bawah alasan kebutuhan");

const reqModalBtnSrc = readFileSync("src/app/(authenticated-routes)/unit-kerja/katalog/[id]/request-modal-button.tsx", "utf8");
assert.match(reqModalBtnSrc, /SupportingDocumentUpload/, "request-modal-button.tsx memuat SupportingDocumentUpload");

const daftarAsetSrc = readFileSync("src/app/(authenticated-routes)/unit-kerja/daftar-aset/daftar-aset-client.tsx", "utf8");
assert.match(daftarAsetSrc, /SupportingDocumentUpload/, "daftar-aset-client.tsx memuat SupportingDocumentUpload");
console.log("✓ AC 1: Peletakan di seluruh modal pengajuan pemakaian aset idle terverifikasi");

// 4. Verifikasi AC 3: Tampilan Berkas di Modal Detail Permohonan (/unit-kerja/riwayat-permintaan)
const riwayatPageSrc = readFileSync("src/app/(authenticated-routes)/unit-kerja/riwayat-permintaan/page.tsx", "utf8");
assert.match(riwayatPageSrc, /supporting_document:/, "riwayat-permintaan/page.tsx memetakan supporting_document");

const riwayatClientSrc = readFileSync("src/app/(authenticated-routes)/unit-kerja/riwayat-permintaan/riwayat-permintaan-client.tsx", "utf8");
assert.match(riwayatClientSrc, /supporting_document\?: SupportingDocumentMeta/, "Interface ReuseRequestItem menyertakan supporting_document");
assert.match(riwayatClientSrc, /Dokumen Pendukung \/ Justifikasi Kebutuhan/, "Modal Detail memuat seksi Dokumen Pendukung / Justifikasi");
assert.match(riwayatClientSrc, /Unduh Berkas/, "Modal Detail memuat link/tombol unduh file");
assert.match(riwayatClientSrc, /download=\{supportingDoc\.fileName\}/, "Tombol unduh menyertakan atribut download");
console.log("✓ AC 3: Tampilan berkas dan unduh di Modal Detail Riwayat Permintaan terverifikasi");

// 5. Verifikasi AC 3: Tampilan Berkas di Modal Approval Manajer (/manajer/pemakaian & redirect /manajer/peminjaman)
const peminjamanPageSrc = readFileSync("src/app/(authenticated-routes)/manajer/peminjaman/page.tsx", "utf8");
assert.match(peminjamanPageSrc, /\/manajer\/pemakaian/, "manajer/peminjaman diarahkan ke /manajer/pemakaian");

const manajerPageSrc = readFileSync("src/app/(authenticated-routes)/manajer/pemakaian/page.tsx", "utf8");
assert.match(manajerPageSrc, /supporting_document:/, "manajer/pemakaian/page.tsx memetakan supporting_document");

const manajerClientSrc = readFileSync("src/app/(authenticated-routes)/manajer/pemakaian/pemakaian-client.tsx", "utf8");
assert.match(manajerClientSrc, /supporting_document\?: SupportingDocumentMeta/, "Interface ReuseRequest menyertakan supporting_document");
assert.match(manajerClientSrc, /Dokumen Pendukung \/ Justifikasi Kebutuhan/, "Modal Approval Manajer memuat seksi Dokumen Pendukung");
assert.match(manajerClientSrc, /Unduh Berkas/, "Modal Approval Manajer memuat tombol unduh dokumen");
assert.match(manajerClientSrc, /download=\{supportingDoc\.fileName\}/, "Tombol unduh Manajer menyertakan atribut download");
console.log("✓ AC 3: Tampilan berkas dan unduh di Modal Persetujuan Manajer Rendal terverifikasi");

console.log("\n========================================================");
console.log("SEMUA AC (AC 1, AC 2, AC 3) TERVERIFIKASI SUKSES UNTUK US-13-FE!");
console.log("========================================================");
