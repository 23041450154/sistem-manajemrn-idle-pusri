import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// 1. US-17-FE: Form Inspeksi Awal & Berkala hanya menampilkan Nomor Notifikasi SAP secara kondisional
//    (wajib saat Scrap/Tidak Layak, opsional saat Repair, tersembunyi saat Layak/Ready)
const berkalaForm = readFileSync(
	"src/app/(authenticated-routes)/inspeksi/inspeksi-berkala/formInspeksi/form-inspeksi-client.tsx",
	"utf8",
);
assert.ok(
	berkalaForm.includes("showSapNotificationField") &&
		berkalaForm.includes('hasilInspeksi === "SCRAP" || hasilInspeksi === "REPAIR"'),
	"Form Inspeksi Berkala wajib menyembunyikan Nomor Notifikasi SAP saat READY",
);

const validasiClient = readFileSync(
	"src/app/(authenticated-routes)/inspeksi/validasi/validasi-client.tsx",
	"utf8",
);
assert.ok(
	validasiClient.includes("showSapField") &&
		validasiClient.includes("isSapRequired") &&
		validasiClient.includes("isSapOptional"),
	"Form Validasi Awal wajib menerapkan visibilitas kondisional Nomor Notifikasi SAP (Scrap wajib, Repair opsional, Ready hide)",
);
assert.ok(
	validasiClient.includes("No. Notifikasi SAP:"),
	"Modal Detail Validasi wajib menampilkan baris No. Notifikasi SAP",
);

// 2. US-12-FE: Dashboard Inspeksi mengganti kartu ke-4 menjadi Perlu Revalidasi Pasca Perbaikan
//    dan menyinkronkan Total = jumlah 3 kartu status di sebelahnya
const inspeksiDashboard = readFileSync(
	"src/app/(authenticated-routes)/inspeksi/dashboard/dashboard-client.tsx",
	"utf8",
);
assert.ok(
	inspeksiDashboard.includes("Perlu Revalidasi Pasca Perbaikan") &&
		!inspeksiDashboard.includes('label: "Perbaikan / Scrap"'),
	"Dashboard Inspeksi wajib mengganti kartu Perbaikan / Scrap menjadi Perlu Revalidasi Pasca Perbaikan",
);
assert.ok(
	inspeksiDashboard.includes(
		"pendingAssets.length + validatedAssetsCount + needRevalidationCount",
	),
	"Total Peralatan di Dashboard Inspeksi wajib sinkron dengan jumlah 3 kartu status di sebelahnya",
);

// 3. US-12-FE: Seluruh halaman tujuan summary cards membaca query param URL (useSearchParams)
const syncedTargets = [
	"src/app/(authenticated-routes)/inspeksi/validasi/validasi-client.tsx",
	"src/app/(authenticated-routes)/inspeksi/validasi-ulang/validasi-ulang-client.tsx",
	"src/app/(authenticated-routes)/pemeliharaan/perbaikan-alat/perbaikan-alat-client.tsx",
	"src/app/(authenticated-routes)/unit-kerja/daftar-aset/daftar-aset-client.tsx",
	"src/app/(authenticated-routes)/unit-kerja/konfirmasi-pemasangan/konfirmasi-pemasangan-client.tsx",
	"src/app/(authenticated-routes)/manajer/approve/approve-client.tsx",
	"src/app/(authenticated-routes)/manajer/pemakaian/pemakaian-client.tsx",
	"src/app/(authenticated-routes)/manajer/scrap/scrap-client.tsx",
];

for (const file of syncedTargets) {
	const src = readFileSync(file, "utf8");
	assert.ok(
		src.includes("useSearchParams"),
		`${file} wajib menyinkronkan filter/tab dengan URL query params`,
	);
}

console.log("OK: US-12-FE & US-17-FE QA assertions passed");
