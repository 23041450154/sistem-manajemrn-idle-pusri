# Sistem Manajemen Idle Equipment PUSRI

Frontend aplikasi pengelolaan peralatan idle PT PUSRI. Dibangun dengan Next.js (App Router), TypeScript, Tailwind CSS v4, dan shadcn/ui.

## Fitur

- **Autentikasi berbasis peran** — 6 role dengan dashboard masing-masing
- **Manajemen peralatan idle** — registrasi, validasi, status peralatan
- **Alur persetujuan** — permintaan, approve, validasi ulang
- **Peminjaman, perbaikan, disposal, dan scrap** peralatan
- **Inspeksi berkala** dan jadwalnya
- **Laporan & dashboard** dengan grafik (Recharts)
- **Ekspor PDF** laporan/riwayat

## Peran Pengguna (Role)

| Role | Halaman Utama |
| --- | --- |
| Administrator | `/admin/dashboard` |
| Rendal Pemeliharaan | `/rendal/dashboard` |
| Pemeliharaan Lapangan | `/pemeliharaan/dashboard` |
| Inspeksi Teknik | `/inspeksi/dashboard` |
| Manajer Rendal | `/manajer/dashboard` |
| Unit Kerja Operasi | `/unit-kerja/dashboard` |

Sumber kebenaran role ada di `src/lib/roles.ts`. Role tidak dikenal otomatis diperlakukan sebagai Unit Kerja Operasi.

## Prasyarat

- Node.js 20+
- npm

## Menjalankan Secara Lokal

1. Buat file `.env` di root project:

   ```env
   API_URL=<url-backend>
   NEXT_PUBLIC_API_URL=<url-backend>
   ```

2. Install dependensi:

   ```bash
   npm install
   ```

3. Jalankan development server:

   ```bash
   npm run dev
   ```

4. Buka [http://localhost:3000](http://localhost:3000).

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | Jalankan ESLint |

## Struktur Direktori

```text
src/
├── app/
│   ├── (auth)/                  # Halaman login (publik)
│   └── (authenticated-routes)/  # Halaman per role
│       ├── admin/
│       ├── inspeksi/
│       ├── manajer/
│       ├── pemeliharaan/
│       ├── rendal/
│       └── unit-kerja/
├── action/    # Server actions & klien API (api.ts, auth.ts, master.ts, users.ts)
├── lib/       # Utilitas, definisi role, konfigurasi
└── components/# Komponen UI (shadcn/ui + komponen aplikasi)
```

## Lisensi

Untuk penggunaan internal PT PUSRI.
