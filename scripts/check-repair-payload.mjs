// Self-check: payload frontend cocok request.CreateEquipmentRepairRequest (Go).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync("src/action/api.ts", "utf8");
const body = api.slice(
	api.indexOf("export async function completeEquipmentRepair("),
);
const fn = body.slice(0, body.indexOf("\n}\n") + 2);

const required = [
	"equipment_id",
	"equipment_inspection_id",
	"start_at",
	"end_at",
	"actual_cost",
	"preservation_status",
	"work_description",
	"notes",
];
for (const k of required)
	assert.match(fn, new RegExp(`${k}:`), `field hilang: ${k}`);
assert.match(fn, /\/api\/repair/, "harus POST ke /api/repair");
assert.ok(
	!fn.includes("condition_id"),
	"condition_id tidak ada di kontrak repair",
);
assert.ok(
	!fn.includes("maintenance_date"),
	"maintenance_date bukan field kontrak",
);

const page = readFileSync(
	"src/app/(authenticated-routes)/pemeliharaan/perbaikan-alat/page.tsx",
	"utf8",
);
assert.match(
	page,
	/parseInt\(actualCost, 10\) > 0/,
	"actual_cost wajib > 0 (validate gt=0)",
);
assert.match(
	page,
	/preservationStatus === "Preserved" \|\| preservationStatus === "Not Preserved"/,
	"oneof preservation_status",
);
assert.match(page, /endAt >= startAt/, "rentang tanggal harus divalidasi");

console.log("OK: payload perbaikan alat sesuai kontrak backend");

// --- Redesign /pemeliharaan: status alur harus berbasis nama, bukan status_id ---
const pages = [
	"src/app/(authenticated-routes)/pemeliharaan/dashboard/page.tsx",
	"src/app/(authenticated-routes)/pemeliharaan/perbaikan-alat/page.tsx",
];
for (const f of pages) {
	const src = readFileSync(f, "utf8");
	assert.ok(
		!/status_id === \d|status\?\.id === \d/.test(src),
		`${f}: status_id literal kembali muncul (seeder id ≠ urutan alur)`,
	);
	assert.match(
		src,
		/repairFlowStatus/,
		`${f}: harus pakai helper repairFlowStatus`,
	);
}
// th wajib text-[14px] per DESIGN.md §3.1
const tabel = readFileSync(pages[1], "utf8");
assert.ok(
	!tabel.includes("py-2.5 text-[13px] font-bold text-gray-600 uppercase"),
	"th off-spec",
);
console.log(
	"OK: halaman /pemeliharaan pakai status berbasis nama + th sesuai DESIGN.md",
);

// --- Detail equipment di modal perbaikan (redesign) ---
const modal = readFileSync(pages[1], "utf8");
assert.ok(
	!modal.includes("Lengkapi detail realisasi perbaikan"),
	"info box realisasi harus dihapus",
);
// Semua field detail dibaca dari payload GET /api/equipment yang sudah di-Preload backend.
for (const field of [
	"func_loc",
	"vendor",
	"item.year",
	"original_value",
	"book_value",
	"estimated_reuse_value",
	"idle_since",
	"idle_reason",
	"item.notes",
	"item.attachments",
])
	assert.match(modal, new RegExp(field.replace(".", "\\.")), `detail hilang: ${field}`);
// Galeri hanya berkas gambar — lampiran equipment bisa berupa PDF.
assert.match(modal, /IMAGE_FILE\.test\(url\)/, "foto harus difilter ekstensi gambar");
assert.match(modal, /setPreviewImage/, "foto harus bisa diperbesar");
assert.ok(!/rounded-(lg|xl)/.test(modal), "radius off-spec (DESIGN.md: 4px)");
assert.ok(!modal.includes("bg-gradient-to-r"), "gradient dilarang DESIGN.md");
console.log("OK: modal perbaikan menampilkan detail + foto equipment");
