/* Self-check: node --experimental-strip-types src/app/(authenticated-routes)/unit-kerja/katalog/shared.check.ts
   Covers the one piece of non-trivial logic here: the API payload normaliser. */
import assert from "node:assert/strict";
import { normalizeEquipment, toState, formatRupiah } from "./shared";

const nested = normalizeEquipment({
  id: 7,
  equipment_code: "EQ-007",
  name: "Pompa Sentrifugal",
  plant: { name: "PUSRI-IIB", description: "Pabrik IIB" },
  object_type: { name: "Pompa" },
  status: { name: "READY_TO_USE" },
  condition: { name: "BAIK" },
  storage_location: { name: "Gudang A", plant: { name: "PUSRI-IIB" } },
  estimated_reuse_value: 1500000,
  book_value: 0,
  year: 2015,
  attachments: [
    { file_url: "/uploads/a.jpg" },
    { file_url: "/uploads/spec.pdf" },
  ],
});

assert.equal(nested.plant, "PUSRI-IIB");
assert.equal(nested.objectType, "Pompa");
assert.equal(nested.state, "ready");
assert.equal(nested.storageLocation, "Gudang A");
assert.deepEqual(nested.images, ["/uploads/a.jpg"], "non-image attachments filtered out");
assert.equal(nested.bookValue, 0, "0 is a real value, not missing");
assert.equal(nested.year, 2015);

// Legacy flat payload still parses.
const flat = normalizeEquipment({
  id: 1,
  plant: "PUSRI-III",
  status_name: "REGISTERED",
  condition_name: "",
});
assert.equal(flat.plant, "PUSRI-III");
assert.equal(flat.state, "registered");
assert.equal(flat.condition, "Belum dinilai");
assert.equal(flat.images.length, 0);

assert.equal(toState("DISPOSAL", "BAIK"), "disposal", "disposal wins over condition");
assert.equal(toState(undefined, "PERBAIKAN"), "repair");
assert.equal(formatRupiah(undefined), "Belum dinilai");
assert.match(formatRupiah(1500000), /1\.500\.000/);

console.log("shared.check.ts OK");
