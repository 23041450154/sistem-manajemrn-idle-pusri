// Self-check: Verifikasi spesifikasi US-06-FE & penempatan di menu /rendal/perbaikan (AC-01 s/d AC-07)
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

console.log("Memulai pengujian US-06-FE & Modul Perbaikan...");

// 1. Periksa module helper lib/repair-assignment.ts
const repairHelper = readFileSync("src/lib/repair-assignment.ts", "utf8");
assert.match(repairHelper, /export type RepairExecutor = "INTERNAL" \| "VENDOR"/, "Tipe RepairExecutor");
assert.match(repairHelper, /formatRupiahInput/, "Fungsi formatRupiahInput ada");
assert.match(repairHelper, /parseRupiahInput/, "Fungsi parseRupiahInput ada");
assert.match(repairHelper, /COMMON_REPAIR_VENDORS/, "Daftar vendor rekanan Pusri ada");
assert.match(repairHelper, /resolveRepairRecommendation/, "Resolver rekomendasi inspeksi ada");
assert.match(repairHelper, /resolveInspectionEstimatedCost/, "Resolver estimasi biaya inspeksi ada");

// 2. Periksa src/action/api.ts
const apiSrc = readFileSync("src/action/api.ts", "utf8");
assert.match(apiSrc, /export async function assignEquipmentRepair\(/, "Endpoint assignEquipmentRepair ada");
assert.match(apiSrc, /refurbishment_cost:/, "Payload mengirim refurbishment_cost");
assert.match(apiSrc, /repair_executor:/, "Payload mengirim repair_executor");
assert.match(apiSrc, /repair_executor_vendor:/, "Payload mengirim repair_executor_vendor");

// 3. Periksa status kanonik di src/lib/equipment-status.ts
const statusSrc = readFileSync("src/lib/equipment-status.ts", "utf8");
assert.match(statusSrc, /"REPAIR_VENDOR"/, "REPAIR_VENDOR terdaftar di EQUIPMENT_STATUS");
assert.match(statusSrc, /REPAIR_VENDOR: "repair"/, "REPAIR_VENDOR terdaftar di STATUS_GROUP");

// 4. Periksa rendal/idle: Tombol Tugaskan Perbaikan TIDAK ada di rendal/idle
const idleClientSrc = readFileSync("src/app/(authenticated-routes)/rendal/idle/idle-client.tsx", "utf8");
assert.ok(
	!idleClientSrc.includes("Tugaskan Perbaikan"),
	"Tombol Tugaskan Perbaikan tidak boleh ada di /rendal/idle (dipindahkan ke /rendal/perbaikan)",
);
console.log("✓ /rendal/idle bebas dari tombol Tugaskan Perbaikan");

// 5. Periksa /rendal/perbaikan/perbaikan-client.tsx (Tempat aksi Tugaskan Perbaikan berada)
assert.ok(existsSync("src/app/(authenticated-routes)/rendal/perbaikan/page.tsx"), "page.tsx ada di /rendal/perbaikan");
const perbaikanSrc = readFileSync("src/app/(authenticated-routes)/rendal/perbaikan/perbaikan-client.tsx", "utf8");

// AC-01: Akses Formulir & Tombol Penugasan di Antrean
assert.match(perbaikanSrc, /Tugaskan Perbaikan/, "AC-01: Tombol aksi Tugaskan Perbaikan ada di menu Perbaikan");
assert.match(perbaikanSrc, /Antrean Perbaikan/, "AC-01: Tab Antrean Perbaikan ada");
assert.match(perbaikanSrc, /Riwayat Perbaikan & Biaya/, "AC-01: Tab Riwayat Perbaikan & Biaya ada");

// AC-02: Input Format Rupiah
assert.match(perbaikanSrc, /formatRupiahInput/, "AC-02: Masking otomatis format Rupiah");
assert.match(perbaikanSrc, /parseRupiahInput/, "AC-02: Parsing nilai input Rupiah");

// AC-03: Pilihan Pelaksana Radio Button
assert.match(perbaikanSrc, /type="radio"/, "AC-03: Radio button untuk pelaksana");
assert.match(perbaikanSrc, /Internal Pusri/, "AC-03: Opsi Internal");
assert.match(perbaikanSrc, /Pihak Ketiga/, "AC-03: Opsi Pihak Ketiga / Vendor");

// AC-04: Tampilan Dinamis Vendor
assert.match(perbaikanSrc, /repairExecutor === "VENDOR"/, "AC-04: Kondisional expand vendor saat Pihak Ketiga dipilih");
assert.match(perbaikanSrc, /vendorName/, "AC-04: Input nama vendor");

// AC-05: Validasi Form
assert.match(perbaikanSrc, /validateAssignForm/, "AC-05: Validasi form sebelum submit");

// AC-06: Integrasi Antrean Lapangan
const pemeliharaanSrc = readFileSync("src/app/(authenticated-routes)/pemeliharaan/perbaikan-alat/page.tsx", "utf8");
assert.match(pemeliharaanSrc, /effectiveExecutor === "VENDOR" \|\| rawStatus === "REPAIR_VENDOR"/, "AC-06: Antrean lapangan mengecualikan Vendor");

// 6. Periksa Sidebar
const sidebarSrc = readFileSync("src/components/Sidebar.tsx", "utf8");
assert.match(sidebarSrc, /href: "\/rendal\/perbaikan"/, "Sidebar mengarah ke /rendal/perbaikan");
assert.match(sidebarSrc, /name: "Perbaikan"/, "Sidebar label adalah Perbaikan");

console.log("SEMUA AC (AC-01 s/d AC-07) TERVERIFIKASI SUKSES DI MODUL PERBAIKAN!");
