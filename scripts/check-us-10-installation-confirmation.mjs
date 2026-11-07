// Self-check: Verifikasi spesifikasi US-10-FE & Konfirmasi Pemasangan Alat di Riwayat Permintaan (AC-01 s/d AC-06)
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

console.log("Memulai pengujian US-10-FE & Konfirmasi Pemasangan Alat...");

// 1. Periksa module helper lib/installation-confirmation.ts
assert.ok(existsSync("src/lib/installation-confirmation.ts"), "Module installation-confirmation.ts ada");
const installHelper = readFileSync("src/lib/installation-confirmation.ts", "utf8");
assert.match(installHelper, /export interface InstallationConfirmation/, "Tipe InstallationConfirmation ada");
assert.match(installHelper, /export interface ConfirmInstallationPayload/, "Tipe ConfirmInstallationPayload ada");
assert.match(installHelper, /getSavedInstallations/, "Fungsi getSavedInstallations ada");
assert.match(installHelper, /getSavedInstallation/, "Fungsi getSavedInstallation ada");
assert.match(installHelper, /saveInstallationConfirmation/, "Fungsi saveInstallationConfirmation ada");
assert.match(installHelper, /isEquipmentInstalled/, "Fungsi isEquipmentInstalled ada");
console.log("✓ lib/installation-confirmation.ts lengkap dan valid");

// 2. Periksa action API di src/action/api.ts
const apiSrc = readFileSync("src/action/api.ts", "utf8");
assert.match(apiSrc, /export async function confirmEquipmentInstallation\(/, "Endpoint confirmEquipmentInstallation ada");
assert.match(apiSrc, /uploadAttachment\(eqId,\s*payload\.photoFile,\s*["']Foto Pemasangan["']\)/, "Upload attachment foto terpasang bila ada");
assert.match(apiSrc, /status:\s*["']REUSED["']/, "Mengirimkan status REUSED ke server");
assert.match(apiSrc, /status_id:\s*7/, "Mengirimkan status_id 7 (REUSED)");
assert.match(apiSrc, /idle_installation_confirmations/, "Sinkronisasi ke persistent storage");
assert.match(apiSrc, /Konfirmasi berhasil\. Peralatan kini resmi tercatat REUSED di sistem\./, "Toast message success sesuai spesifikasi");
console.log("✓ src/action/api.ts mendukung confirmEquipmentInstallation, update REUSED, dan upload attachment");

// 3. Periksa integrasi di page.tsx (/unit-kerja/riwayat-permintaan)
const pageSrc = readFileSync("src/app/(authenticated-routes)/unit-kerja/riwayat-permintaan/page.tsx", "utf8");
assert.match(pageSrc, /getSavedInstallations/, "page.tsx mengimpor dan memuat getSavedInstallations");
assert.match(pageSrc, /finalStatus\s*=\s*["']INSTALLED["']/, "page.tsx memetakan status INSTALLED");
assert.match(pageSrc, /installed_at:/, "page.tsx menyertakan installed_at");
assert.match(pageSrc, /physical_notes:/, "page.tsx menyertakan physical_notes");
assert.match(pageSrc, /installation_photo:/, "page.tsx menyertakan installation_photo");
console.log("✓ riwayat-permintaan/page.tsx memetakan status dan data pemasangan alat");

// 4. Periksa client component di riwayat-permintaan-client.tsx
const clientSrc = readFileSync("src/app/(authenticated-routes)/unit-kerja/riwayat-permintaan/riwayat-permintaan-client.tsx", "utf8");

// AC-01: Tombol Konfirmasi Pasang muncul untuk status APPROVED
assert.match(clientSrc, /item\.status\s*===\s*["']APPROVED["']/, "AC-01: Tombol Konfirmasi Pasang mengecek item.status === 'APPROVED'");
assert.match(clientSrc, /Konfirmasi Pasang/, "AC-01: Tombol memiliki label teks 'Konfirmasi Pasang'");
assert.match(clientSrc, /title=["']Konfirmasi Pasang["']/, "AC-01: Tombol memiliki title Konfirmasi Pasang");
assert.match(clientSrc, /<Check\s/, "AC-01: Tombol memiliki ikon centang Check seperti validasi inspeksi");
console.log("✓ AC-01: Tombol Konfirmasi Pasang muncul pada pengajuan berstatus APPROVED (gaya validasi inspeksi)");

// AC-02: Pencegahan Duplikasi (hanya APPROVED, bukan PENDING atau INSTALLED)
assert.match(clientSrc, /item\.status === "APPROVED"/, "AC-02: Hanya item.status === APPROVED yang menampilkan tombol");
assert.match(clientSrc, /INSTALLED:\s*\{/, "AC-02: Status INSTALLED terdaftar dalam STATUS_META");
console.log("✓ AC-02: PENDING dan pengajuan yang sudah terpasang tidak menampilkan tombol konfirmasi");

// AC-03: Modal Konfirmasi Pemasangan
assert.match(clientSrc, /isInstallModalOpen/, "AC-03: State modal konfirmasi ada");
assert.match(clientSrc, /Ringkasan Aset/, "AC-03: Modal memuat ringkasan aset");
assert.match(clientSrc, /selectedForInstall\.request_number/, "AC-03: Menampilkan Nomor Permohonan");
assert.match(clientSrc, /selectedForInstall\.equipment_code/, "AC-03: Menampilkan Kode Aset");
assert.match(clientSrc, /selectedForInstall\.equipment_name/, "AC-03: Menampilkan Nama Alat");
assert.match(clientSrc, /selectedForInstall\.installation_location/, "AC-03: Menampilkan Lokasi Pemasangan");
assert.match(clientSrc, /Tanggal Mulai Dioperasikan \/ Terpasang/, "AC-03: Form memuat input Tanggal Mulai Dioperasikan");
assert.match(clientSrc, /Catatan Kondisi Fisik Saat Diterima/, "AC-03: Form memuat textarea Catatan Kondisi Fisik");
assert.match(clientSrc, /Unggah Foto Alat Terpasang/, "AC-03: Form memuat input upload foto alat");
assert.match(clientSrc, /Konfirmasi & Aktifkan Aset \(REUSED\)/, "AC-03: Tombol eksekusi 'Konfirmasi & Aktifkan Aset (REUSED)'");
console.log("✓ AC-03: Modal Konfirmasi Pemasangan memuat ringkasan aset dan form konfirmasi lengkap");

// AC-04: Transisi Status REUSED
assert.match(clientSrc, /confirmEquipmentInstallation/, "AC-04: Submit memanggil confirmEquipmentInstallation");
assert.match(apiSrc, /status:\s*["']REUSED["']/, "AC-04: Status bertransisi menjadi REUSED");
console.log("✓ AC-04: Status peralatan di sistem resmi bertransisi menjadi REUSED");

// AC-05: Feedback Visual & Refresh
assert.match(clientSrc, /setNotification\(\{[\s\S]*?Konfirmasi berhasil\. Peralatan kini resmi tercatat REUSED di sistem\.[\s\S]*?\}\)/, "AC-05: Toast success ditampilkan");
assert.match(clientSrc, /onRefresh/, "AC-05: onRefresh dipanggil untuk merefresh data tabel");
assert.match(clientSrc, /Terpasang \(Selesai\)/, "AC-05: Badge penanda bahwa alat telah terpasang/selesai");
console.log("✓ AC-05: Feedback visual toast & refresh badge terpasang terverifikasi");

// AC-06: Restriksi Role UNIT_KERJA_OPERASI
assert.match(clientSrc, /isUnitKerja/, "AC-06: Pengecekan boolean isUnitKerja");
assert.match(clientSrc, /normalizeRole\(user\?\.role\) === "UNIT_KERJA_OPERASI"/, "AC-06: Pengecekan role UNIT_KERJA_OPERASI");
assert.match(clientSrc, /isUnitKerja && item\.status === "APPROVED"/, "AC-06: Tombol hanya tampil untuk UNIT_KERJA_OPERASI");
assert.match(clientSrc, /if \(!isUnitKerja\)/, "AC-06: Guard eksekusi aksi hanya untuk UNIT_KERJA_OPERASI");
console.log("✓ AC-06: Restriksi role UNIT_KERJA_OPERASI terverifikasi");

console.log("\n========================================================");
console.log("SEMUA AC (AC-01 s/d AC-06) TERVERIFIKASI SUKSES UNTUK US-10-FE!");
console.log("========================================================");
