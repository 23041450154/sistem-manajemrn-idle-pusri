# Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI

> File ini panduan untuk session agent baru. Kerja sebelumnya sudah menyelesaikan
> Batch 1–5, A17, F1, dan 6a-1/6b-parsial. Yang tersisa hanya tiga item di bawah.

## Konteks project (fakta penting)

- **Next.js 16.2.10 + React 19.2.4** — LEBIH BARU dari training data. Untuk semua
  pertanyaan pattern (RSC, caching, file convention, proxy.ts), WAJIB cek context7
  `/vercel/next.js` versi `v16.2.9` lebih dulu. Jangan asumsi dari ingatan.
- Backend Gin terpisah: `~/Documents/pusri` (kontrak API: `routes/routes.go`,
  request DTO: `request/*.go`). Cek dulu sebelum mengira field ada/tidak ada.
- Semua fetch data lewat **server actions** di `src/action/{api,master,auth}.ts`
  dengan cookie httpOnly `token`. Tidak ada fetch client ke backend langsung.
- Formatter hook berjalan otomatis — **selalu re-read file sebelum edit**
  (di sesi terakhir 7 file reformat sendiri).

## Konvensi yang sudah dibangun — WAJIB dipertahankan

| Konvensi | Lokasi |
| ---------- | -------- |
| Base URL backend tunggal | `src/config/api.ts` (`API_URL`) |
| Upload attachment = server action | `uploadAttachment(equipmentId, file, category)` di `src/action/api.ts` |
| Kelompok status aset | `statusGroup()` / `statusName()` dari `src/lib/equipment-status.ts`. **Larangan: magic number `status_id === 1..8`** |
| Invalidasi cache pasca-mutasi | `revalidateApp()` dari `src/lib/revalidate.ts` — WAJIB dipanggil di jalur sukses setiap action mutasi (sudah terpasang di 20 titik) |
| Format tanggal/uang | `formatDate`/`formatDateTime` di `src/lib/utils.ts`; `rupiah` di `lib/equipment-status.ts` |
| Label status approval | `lib/approvals.ts` (`disposalDisplayStatus`, `reuseDisplayStatus`) |
| Styling | **Tailwind saja** — module.css sudah dihapus total |
| Role kanonik | `src/lib/roles.ts` (`RENDAL_PEMELIHARAAN`, `MANAJER_RENDAL`, dst.) — dipakai proxy.ts |

## Aturan main (dari user, jangan dilanggar)

1. **Jangan ubah behavior alur approval yang sudah benar** — cleanup & compliance,
   bukan redesign. Error handling approval sudah diperbaiki di
   `manajer/approve/page.tsx` (`handleMulaiReview` early-return saat gagal) —
   jangan diregresikan.
2. Data dummy tanpa endpoint backend → tandai "butuh endpoint baru di backend-idle",
   jangan dipaksa fetch.
3. Env var baru harus disebut eksplisit, jangan dikira-kira.
4. Selesaikan satu batch → ringkas apa yang diubah dan kenapa.

## Verifikasi wajib tiap akhir langkah

```bash
npx tsc --noEmit
./node_modules/.bin/eslint <file-yang-diedit>
npm run build          # di akhir batch
graphify update .      # graph knowledge wajib sinkron
```

Catatan: wrapper `rtk` kadang menelan output eslint — kalau butuh detail,
pakai `./node_modules/.bin/eslint <path> --format json`.

---

## SISA KERJA 1 — 6a-2: Konversi RSC halaman inbox besar

Pola konversi terbukti (lihat contoh jadi):

| Contoh referensi | Pola |
| ------------------ | ------ |
| `unit-kerja/dashboard/page.tsx` + `dashboard-client.tsx` | Page RSC: fetch + mapping murni di server → pass props ke client yang hanya pegang interaksi; tombol refresh = `router.refresh()` |
| `inspeksi/dashboard/page.tsx` + `dashboard-client.tsx` | Page RSC: fetch + sort → client pegang search/filter; hapus skeleton/loading state |
| `admin/dashboard/page.tsx` | Read-only penuh → RSC murni tanpa client sama sekali |

Urutan eksekusi disarankan (satu role per sesi, mulai dari yang termudah):

1. **pemeliharaan**: `perbaikan-alat/page.tsx` (~1100 baris)
2. **rendal**: `idle` (~1050), `validasi-ulang` (~1010), `laporan` (~700), `register-equipment` (~1020). `scrap` & `disposal` menyusul (ada mutasi → `loadData()` lokal bisa diganti `router.refresh()` karena mutasi server-side sudah `revalidateApp()`)
3. **manajer**: `disposal` (~880), `scrap` (~950), `peminjaman` (~950), `approve` (~1310, paling hati-hati — alur multi-step approval)
4. **unit-kerja**: `riwayat-permintaan` (~945), `idle` (~1690), `daftar-aset` (~1560)
5. **inspeksi** (terbesar, terakhir): `inspeksi-berkala` (~750), `formInspeksi`, `validasi-ulang` (~1060), `revisi-validasi` (~1360), `validasi` (~2245 — pecah dulu komponennya kalau perlu)

Cek ulang jumlah baris dengan `wc -l` — angka di atas geser setelah reformat.

Per-halaman langkahnya:

1. `mv page.tsx dashboard-client.tsx`-style split (atau tulis page RSC baru).
2. Fetch + sort/mapping murni → pindah ke page RSC.
3. State interaksi (search/filter/sort/modal/form) tetap di client.
4. Hapus `isLoading`/skeleton — data tersedia saat render pertama.
5. Mutasi: server action sudah `revalidateApp()`; ganti refetch-lokal manual
   dengan `router.refresh()` bila aman, atau biarkan refetch via action.
6. `npx tsc --noEmit` + eslint file + build.

## SISA KERJA 2 — 24 `<img>` modal preview foto

Lokasi terakhir tercatat (grep ulang `@next/next/no-img-element` untuk posisi kini):
`inspeksi/validasi` ×5, `ManajemenInspeksi` ×4, `unit-kerja/idle` ×3,
`manajer/approve` ×3, `manajer/scrap` ×2, `revisi-validasi` ×2,
`manajer/disposal` ×2, `rendal/idle` ×1, `rendal/register-equipment` ×1,
`formInspeksi` ×1.

Pola konversi: pastikan kontainer `relative` + berukuran jelas → `<Image fill
sizes="...">`; `onError` tetap didukung next/image. Thumbnail ≤64px boleh tetap
`<img>` dengan komentar alasan. RemotePatterns host backend sudah terpasang di
`next.config.ts`.

## SISA KERJA 3 — Backend Go (`~/Documents/pusri`, repo terpisah)

Butuh perubahan backend-idle (komunikasikan ke user, jangan sekaranngan):

1. `DELETE /api/repair/:id` dan `DELETE /api/reuse-request/:id` di
   `routes/routes.go` **tanpa `middleware.RequireRole`** — siapa pun yang login
   bisa hapus. Tambahkan guard sesuai alur (repair: PEMELIHARAAN_LAPANGAN /
   RENDAL; reuse-request: UNIT_KERJA_OPERASI pemiliknya).
2. `GET /admin/audit-log` ADMIN-only — feed aktivitas `RecentActivities` di
   dashboard Rendal masih sintetis (5 equipment terakhir). Butuh endpoint
   activity terbuka untuk RENDAL_PEMELIHARAAN atau endpoint ringkasan baru.
3. Endpoint financial (`/admin/financial/*`) ADMIN-only, belum dipakai frontend —
   potensi sumber data asli untuk CostAvoidanceSection kalau dibuka ke MANAJER.
