// Self-check: resolusi "Hasil Inspeksi" + "Alasan Scrap" dari data validasi/inspeksi.
// Mirror dari logika useMemo di rendal/scrap & rendal/disposal page.tsx.
// Jalankan: node scripts/check-scrap-reason.mjs
import assert from "node:assert/strict";

const resolveResult = (validation, inspection) => {
	const s = validation || inspection;
	if (!s) return null;
	const condition = s.condition?.name || s.condition_name;
	const action = s.require_action?.name;
	const label =
		s.is_utilizable === false
			? "Tidak Layak"
			: s.is_utilizable === true
				? "Layak"
				: condition || null;
	if (!label) return null;
	return action ? `${label} (${action})` : label;
};

const resolveReason = (validation, inspection) =>
	validation?.followup_recommendation ||
	validation?.notes ||
	inspection?.notes ||
	null;

// 1. Tanpa data apa pun -> null, UI menampilkan placeholder, bukan klaim palsu.
assert.equal(resolveResult(null, null), null);
assert.equal(resolveReason(null, null), null);

// 2. Validasi menang atas inspeksi berkala.
const val = {
	is_utilizable: false,
	require_action: { name: "DISPOSAL" },
	followup_recommendation: "Casing pecah, perbaikan tidak ekonomis",
	notes: "catatan validasi",
};
const ins = { is_utilizable: true, notes: "catatan inspeksi" };
assert.equal(resolveResult(val, ins), "Tidak Layak (DISPOSAL)");
assert.equal(resolveReason(val, ins), "Casing pecah, perbaikan tidak ekonomis");

// 3. Validasi tanpa rekomendasi -> jatuh ke notes validasi, lalu notes inspeksi.
assert.equal(resolveReason({ notes: "hanya notes" }, ins), "hanya notes");
assert.equal(resolveReason({}, ins), "catatan inspeksi");

// 4. is_utilizable absen -> pakai nama kondisi; tanpa require_action tidak ada tanda kurung.
assert.equal(
	resolveResult({ condition: { name: "RUSAK_BERAT" } }, null),
	"RUSAK_BERAT",
);

// 5. Layak tidak boleh dilabeli "Tidak Layak" (regresi hardcode lama).
assert.equal(resolveResult({ is_utilizable: true }, null), "Layak");

console.log("ok: scrap/disposal reason resolution");
