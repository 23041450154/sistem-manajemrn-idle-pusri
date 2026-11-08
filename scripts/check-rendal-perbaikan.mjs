import assert from "node:assert/strict";
import fs from "node:fs";

console.log("=== CHECK RENDAL PERBAIKAN ===");

// 1. Check sidebar configuration
const sidebarContent = fs.readFileSync("src/components/Sidebar.tsx", "utf-8");
assert.ok(
	sidebarContent.includes('href: "/rendal/perbaikan"'),
	"Sidebar harus memuat link /rendal/perbaikan",
);
assert.ok(
	sidebarContent.includes('name: "Perbaikan"'),
	"Sidebar harus memuat menu bernama 'Perbaikan'",
);
assert.ok(
	sidebarContent.includes("Wrench"),
	"Sidebar harus menggunakan icon Wrench",
);
console.log("✓ AC-01: Sidebar menu Perbaikan terkonfigurasi dengan benar");

// 2. Check route files
assert.ok(
	fs.existsSync("src/app/(authenticated-routes)/rendal/perbaikan/page.tsx"),
	"File page.tsx untuk /rendal/perbaikan harus ada",
);
assert.ok(
	fs.existsSync("src/app/(authenticated-routes)/rendal/perbaikan/perbaikan-client.tsx"),
	"File perbaikan-client.tsx harus ada",
);
console.log("✓ AC-02: Route files page.tsx & perbaikan-client.tsx tersedia");

// 3. Check client component features
const clientContent = fs.readFileSync(
	"src/app/(authenticated-routes)/rendal/perbaikan/perbaikan-client.tsx",
	"utf-8",
);

// Tab Navigation check (matches validasi inspeksi)
assert.ok(clientContent.includes("Antrean Perbaikan"), "Memiliki Tab Antrean Perbaikan");
assert.ok(clientContent.includes("Riwayat Perbaikan & Biaya"), "Memiliki Tab Riwayat Perbaikan & Biaya");
console.log("✓ AC-03: Tab Antrean & Riwayat terimplementasi serupa validasi inspeksi");

// Table & Column check
assert.ok(clientContent.includes("Nama Alat"), "Tabel memiliki kolom Nama Alat");
assert.ok(clientContent.includes("Kode Alat"), "Tabel memiliki kolom Kode Alat");
assert.ok(clientContent.includes("Pelaksana"), "Tabel memiliki kolom Pelaksana");
assert.ok(clientContent.includes("Estimasi Biaya"), "Tabel memiliki kolom Estimasi Biaya");
assert.ok(clientContent.includes("Biaya Riil (Refurbish)"), "Tabel memiliki kolom Biaya Riil");
assert.ok(clientContent.includes("Status"), "Tabel memiliki kolom Status");
assert.ok(clientContent.includes("Aksi"), "Tabel memiliki kolom Aksi");
console.log("✓ AC-04: Kolom-kolom tabel sesuai standar validasi inspeksi");

// Action Post check
assert.ok(clientContent.includes("handleOpenAssignModal"), "Memiliki handler modal penugasan");
assert.ok(clientContent.includes("handleSubmitAssign"), "Memiliki aksi POST penugasan perbaikan");
assert.ok(clientContent.includes("assignEquipmentRepair"), "Memanggil API assignEquipmentRepair");
assert.ok(clientContent.includes("Formulir Penugasan Perbaikan"), "Memiliki modal form penugasan perbaikan");
console.log("✓ AC-05: Aksi POST penugasan perbaikan (US-06) aktif di menu Perbaikan");

// Filters & Search check
assert.ok(clientContent.includes("pelaksanaFilter"), "Memiliki filter pelaksana");
assert.ok(clientContent.includes("plantFilter"), "Memiliki filter plant");
assert.ok(clientContent.includes("searchInput"), "Memiliki fitur pencarian");
console.log("✓ AC-06: Filter pelaksana, plant, dan search aktif");

// Modal detail check
assert.ok(clientContent.includes("selectedDetail"), "Memiliki state modal detail");
assert.ok(clientContent.includes("Komparasi Nilai & Anggaran"), "Modal memuat komparasi nilai & anggaran");
assert.ok(clientContent.includes("Informasi Pelaksana"), "Modal memuat detail pelaksana");
assert.ok(clientContent.includes("Lingkup Pekerjaan / Scope of Work"), "Modal memuat SOW pekerjaan");
assert.ok(!clientContent.includes("<span>Ubah</span>"), "Di riwayat tidak boleh ada tombol Ubah");
console.log("✓ AC-07: Modal detail rincian biaya & SOW terimplementasi, tanpa tombol Ubah di riwayat");

console.log("\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY!");
