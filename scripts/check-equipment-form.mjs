// Self-check: field multipart yang dikirim form registrasi harus cocok dengan
// tag `form:` pada request.EquipmentRequest di backend Go.
// Jalankan: node scripts/check-equipment-form.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(
	"src/app/(authenticated-routes)/rendal/register-equipment/page.tsx",
	"utf8",
);

// Field yang wajib ada (validate:"required" di Go) + optional yang kita kirim.
const required = [
	"equipment_code",
	"name",
	"id_object_type",
	"plant",
	"id_idle_reason",
];
const optional = [
	"plant_description",
	"id_storage_location",
	"func_loc",
	"vendor",
	"year",
	"estimated_reuse_value",
	"notes",
	"id_condition",
	"photo",
];

const appended = [...page.matchAll(/fd\.append\("([^"]+)"/g)].map((m) => m[1]);

for (const field of required) {
	assert.ok(appended.includes(field), `field wajib "${field}" tidak dikirim`);
}
for (const field of appended) {
	assert.ok(
		required.includes(field) ||
			optional.includes(field) ||
			field === "book_value" ||
			field === "original_value",
		`field "${field}" tidak dikenal backend (tag form: tidak ada)`,
	);
}

// Jangan set Content-Type manual: boundary multipart harus dibuat fetch.
const api = readFileSync("src/action/api.ts", "utf8");
const createFn = api.slice(
	api.indexOf("export async function createEquipment"),
);
const body = createFn.slice(0, createFn.indexOf("\n}\n"));
assert.ok(
	body.includes("body: formData"),
	"createEquipment harus mengirim FormData",
);
assert.ok(
	!body.includes('"Content-Type"'),
	"createEquipment tidak boleh set Content-Type manual (boundary rusak)",
);

// id_idle_reason harus dari master, bukan hardcode label.
assert.ok(
	page.includes("getIdleReasons"),
	"alasan idle harus di-fetch dari master data",
);
assert.ok(
	!page.includes("conditionLabels"),
	"label alasan idle hardcode masih ada",
);

console.log(
	"OK: kontrak multipart form registrasi equipment cocok dengan backend",
);
