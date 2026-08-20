import assert from "node:assert/strict";
import { inspectionQueue } from "../src/lib/inspection-schedule.ts";

const DAY = 86_400_000;
const NOW = Date.parse("2026-08-19T00:00:00Z");
const daysAgo = (n) => new Date(NOW - n * DAY).toISOString();

const eq = (id, status) => ({ id, status });

// Hanya READY_TO_USE yang masuk daftar. IDLE tidak ada di database/seeder.go, dan
// CreateInspection menolak status lain ("Equipment tidak siap digunakan").
{
	const out = inspectionQueue(
		[
			eq(1, "READY_TO_USE"),
			eq(2, { name: "READY_TO_USE" }),
			eq(3, "REGISTERED"),
			eq(4, "REPAIR"),
			eq(5, "SCRAP"),
			eq(6, "REUSED"),
			eq(7, "IDLE"),
			eq(8, null),
		],
		[],
	);
	assert.deepEqual(
		out.map((e) => e.id),
		[1, 2],
		"hanya aset READY_TO_USE yang boleh masuk daftar inspeksi",
	);
}

// Belum pernah diinspeksi -> null, supaya UI bisa menandainya "Belum pernah".
{
	const [row] = inspectionQueue([eq(1, "READY_TO_USE")], []);
	assert.equal(row.last_inspection_date, null);
}

// Sudah diinspeksi -> TETAP di daftar, hanya tanggalnya terisi.
// Ini inti keputusannya: interval berbeda per equipment, jadi tidak ada yang
// dibuang otomatis — inspektor yang memutuskan.
{
	const out = inspectionQueue(
		[eq(1, "READY_TO_USE")],
		[{ equipment_id: 1, inspection_date: daysAgo(1) }],
	);
	assert.equal(
		out.length,
		1,
		"aset yang sudah diinspeksi tidak dibuang dari daftar",
	);
	assert.equal(out[0].last_inspection_date, daysAgo(1));
}

// Inspeksi TERBARU yang menang, termasuk lewat relasi equipment.id + fallback created_at.
{
	const [row] = inspectionQueue(
		[eq(3, "READY_TO_USE")],
		[
			{ equipment_id: 3, inspection_date: daysAgo(400) },
			{ equipment: { id: 3 }, created_at: daysAgo(2) },
			{ equipment_id: 3, inspection_date: daysAgo(90) },
		],
	);
	assert.equal(
		row.last_inspection_date,
		daysAgo(2),
		"tanggal terbaru yang dipakai",
	);
}

// Payload rusak tidak melempar dan tidak menghapus aset dari daftar.
{
	const out = inspectionQueue(
		[eq(1, "READY_TO_USE")],
		[
			{ equipment_id: null },
			{ equipment_id: 1, inspection_date: "bukan-tanggal" },
			{},
		],
	);
	assert.equal(out.length, 1);
	assert.equal(
		out[0].last_inspection_date,
		null,
		"tanggal invalid = belum pernah diinspeksi",
	);
}

// Id numerik vs string harus dianggap sama (backend kadang mengirim string).
{
	const [row] = inspectionQueue(
		[eq("7", "READY_TO_USE")],
		[{ equipment_id: 7, inspection_date: daysAgo(5) }],
	);
	assert.equal(row.last_inspection_date, daysAgo(5));
}

console.log(
	"OK: daftar inspeksi = semua READY_TO_USE + tanggal inspeksi terakhir",
);
