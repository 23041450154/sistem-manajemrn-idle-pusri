// Self-check tanpa server:
//   node scripts/check-table-overflow.mjs
//
// Bug yang dijaga: tabel lebar (9-10 kolom) di dalam <div> yang memakai
// "overflow-x-hidden" pada breakpoint lg. Tabel jadi lebih lebar dari
// wadahnya, overflow disembunyikan, dan kolom terakhir (tempat tombol aksi)
// terpotong tanpa cara menjangkaunya. Terbukti di 4 halaman:
//   perbaikan-alat   min-content 1143px  terpotong di bawah ~1450px
//   validasi-ulang   min-content  989px  terpotong di bawah ~1293px
//   daftar-aset      min-content  927px  terpotong di bawah ~1231px
//   inspeksi-berkala min-content  755px  terpotong di bawah ~1024px
//
// Aturan: kalau sebuah file punya <table>, wadah overflow-nya TIDAK boleh
// menyembunyikan overflow pada breakpoint apa pun. Scroll horizontal selalu
// lebih baik daripada konten yang tidak bisa dijangkau.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

let files;
try {
  files = execSync("grep -rl '<table' --include='*.tsx' src/", { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);
} catch (error) {
  // grep keluar dengan status 1 kalau tidak ada yang cocok.
  assert.fail(`gagal mencari file tabel: ${error.message}`);
}

assert.ok(files.length > 0, "tidak ada file <table> yang ditemukan — pola grep berubah?");

const offenders = [];
for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    // Lewati komentar JSX/JS: komentar yang menyebut kelas terlarang (mis.
    // catatan "tanpa lg:overflow-x-hidden") bukan pelanggaran.
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
    // Hanya baris atribut kelas yang nyata.
    if (!/className=/.test(line)) return;
    if (!/overflow-x-(hidden|clip)/.test(line)) return;
    if (!/(lg|md|xl|2xl):overflow-x-(hidden|clip)/.test(line)) return;
    offenders.push(`${file}:${i + 1}  ${line.trim()}`);
  });
}

assert.equal(
  offenders.length,
  0,
  `Wadah tabel menyembunyikan overflow di layar lebar, sehingga kolom aksi bisa terpotong:\n${offenders.join("\n")}`,
);

console.log(`check-table-overflow.mjs OK — ${files.length} file tabel, tidak ada overflow tersembunyi.`);
