import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mappings = [
	"src/app/(authenticated-routes)/inspeksi/validasi/page.tsx",
	"src/app/(authenticated-routes)/inspeksi/revisi-validasi/page.tsx",
	"src/components/ManajemenInspeksi.tsx",
	"src/app/(authenticated-routes)/rendal/disposal/page.tsx",
	"src/app/(authenticated-routes)/rendal/scrap/page.tsx",
	"src/app/(authenticated-routes)/rendal/idle/page.tsx",
	"src/app/(authenticated-routes)/rendal/register-equipment/page.tsx",
	"src/app/(authenticated-routes)/unit-kerja/katalog/shared.tsx",
];

for (const path of mappings) {
	const source = readFileSync(path, "utf8");
	assert.ok(
		!source.match(
			/(?:area|funcLoc): item\.func_loc \|\||funcLoc: found\.func_loc \|\||funcLoc: str\(raw\.func_loc\)/,
		),
		`${path} passes func_loc relation object without extracting name`,
	);
}

console.log("OK: all known func_loc consumers normalize relation objects");
