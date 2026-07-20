# Sistem Manajemen Idle Equipment PUSRI

Aplikasi manajemen aset/peralatan yang tidak terpakai (idle equipment) untuk PT Pupuk Sriwidjaja (PUSRI). Mengelola siklus hidup peralatan idle: deklarasi idle, inspeksi, permintaan penggunaan kembali (reuse), penghapusan (disposal), dan alur persetujuan (approval).

## Arsitektur

Aplikasi terdiri dari dua bagian yang terpisah:

- **Frontend** — Next.js 16 (App Router) + React 19 + TypeScript, styling dengan Tailwind CSS 4 dan CSS Modules.
- **Backend** — Go (Gin) + GORM, database PostgreSQL. Ada di folder `backend-idle/` (repo git terpisah).

Frontend berjalan di port `3000`, backend di port `8081`.

## Tech Stack

### Frontend (`src/`)
| Paket | Kegunaan |
|-------|----------|
| `next` 16.2.10 | Framework (App Router, Server Actions) |
| `react` / `react-dom` 19.2.4 | UI |
| `lucide-react` | Ikon |
| `recharts` | Grafik dashboard |
| `nextjs-toploader` | Loading bar antar halaman |
| `tailwindcss` 4 | Styling |

> Catatan: `AGENTS.md` memperingatkan versi Next.js ini punya breaking changes — cek `node_modules/next/dist/docs/` sebelum menulis kode Next.

### Backend (`backend-idle/`)
| Paket | Kegunaan |
|-------|----------|
| `gin-gonic/gin` | HTTP framework |
| `gorm.io/gorm` + `driver/postgres` | ORM + PostgreSQL |
| `golang-jwt/jwt/v5` | Token JWT |
| `golang.org/x/crypto/bcrypt` | Hash password |
| `go-playground/validator/v10` | Validasi input |
| `joho/godotenv` | Baca `.env` |

## Autentikasi

- Login pakai **NPP** (nomor pegawai) + password, bukan email.
- Backend memverifikasi NPP+password, lalu mengeluarkan **JWT** (HS256, kedaluwarsa 24 jam, secret dari `JWT_SECRET`).
- Frontend memakai **Server Actions** (`src/action/auth.ts`) untuk login. Token & data user disimpan di **cookie httpOnly** (`secure`, `sameSite=lax`, maxAge 30 menit).
- **Proteksi rute** lewat `src/proxy.ts` (middleware): rute selain `/login` dan `/forgot-password` diarahkan ke `/login` jika tidak ada token; user yang sudah login diarahkan keluar dari halaman publik.

## Peran / Role

Login menentukan dashboard dan menu sidebar berdasarkan role:

- **ADMIN (Rendal)** — akses penuh: Peralatan, Idle Equipment, Inspeksi, Permintaan, Persetujuan, Laporan, plus menu Administrasi (Master Data, Pengguna, Pengaturan). Melihat `RendalDashboard`.
- **USER (Unit Kerja)** — Idle Equipment, Permintaan, Laporan. Melihat `UnitKerjaDashboard`.
- **INSPECTOR** — Manajemen Inspeksi, Jadwal Inspeksi, Laporan (tidak bisa registrasi peralatan).
- **APPROVER** — role ada di data seed untuk alur persetujuan.

Akun seed (semua password `password123`):

| Nama | NPP | Role |
|------|-----|------|
| Admin Pusri | 100001 | ADMIN |
| Budi Santoso | 100002 | USER |
| Siti Rahayu | 100003 | USER |
| Ahmad Fauzi | 100004 | APPROVER |
| Dewi Lestari | 100005 | INSPECTOR |

## Struktur Frontend

```
src/
├── action/auth.ts              # Server Actions: login, logout, getCurrentUser
├── proxy.ts                    # Middleware proteksi rute
├── types/Auth.ts               # Tipe User, LoginRequest, LoginResponse
├── app/
│   ├── (auth)/login/           # Halaman & form login
│   └── (authenticated-routes)/ # Rute terproteksi
│       ├── layout.tsx          # Sidebar + Header, redirect jika belum login
│       └── dashboard/
│           ├── page.tsx        # Pilih dashboard sesuai role
│           ├── register/       # Form registrasi peralatan idle
│           └── inspeksi/        # Manajemen & form inspeksi
└── components/
    ├── Dashboards/             # RendalDashboard, UnitKerjaDashboard, InspeksiDashboard
    ├── Sidebar.tsx             # Navigasi per-role
    ├── Header.tsx
    ├── StatCard.tsx            # Kartu statistik
    ├── ChartSection.tsx        # Grafik (recharts)
    ├── UpcomingInspections.tsx
    └── RecentActivities.tsx
```

## Model Data (Backend)

Entitas utama:

- **Equipment** — data peralatan: kode, nama, plant, vendor, tahun, nilai (original/book/estimasi reuse), status, kondisi, lokasi penyimpanan, tanggal idle.
- **IdleDeclaration** — pernyataan peralatan menjadi idle (alasan, kondisi, status preservasi, lokasi).
- **EquipmentInspection** — hasil inspeksi (kondisi mekanikal/elektrikal, estimasi biaya refurbish, tindakan yang diperlukan).
- **ReuseRequest** — permintaan penggunaan kembali (proyek, plant, biaya, estimasi cost avoidance).
- **DisposalRequest** — permintaan penghapusan (metode disposal, nilai scrap).
- **ApprovalRequest** + **ApprovalStep** — alur persetujuan berjenjang (mis. Kepala Seksi → Manager Teknik → GM Operasi).
- **EquipmentAttachment** — lampiran/dokumen polimorfik (reference_table + reference_id).

Tabel master (lookup): **Status**, **Condition**, **ObjectType**, **StorageLocation**, **IdleReason**, **RequireAction**, **DisposalMethod**.

Status peralatan: Aktif, Idle, Dalam Perbaikan, Digunakan Kembali, Disposed.

## API Backend

Rute yang tersedia saat ini (`main.go`):

- `GET /hello` — health check.
- `POST /login` — autentikasi, mengembalikan `{ token, user }`.

Migrasi & seeding dijalankan lewat GORM `AutoMigrate` saat start; seeding manual dengan `go run . seed`.

## Cara Menjalankan

**Frontend:**
```bash
npm install
npm run dev        # http://localhost:3000
```

**Backend:**
```bash
cd backend-idle
go run . seed      # isi data awal (sekali)
go run .           # jalankan server di :8081
```

Butuh file `.env`:
- Root: `API_URL` (URL backend untuk fetch dari server action).
- `backend-idle/.env`: `DATABASE_URL` (PostgreSQL) dan `JWT_SECRET`.

## Catatan & Status Pengembangan

- Form **Registrasi Peralatan** dan **Import Data** saat ini masih **simulasi** (pakai `setTimeout` + `alert`), belum terhubung ke backend.
- Angka pada dashboard (`RendalDashboard`) masih **hardcoded**, belum ambil data nyata.
- Backend baru mengekspos endpoint login; endpoint CRUD untuk equipment/inspeksi/approval belum ada.
- Komentar di `ApprovalRequest` menandai pertanyaan desain: apakah `current_step`/`approval_status` sebaiknya dipisah ke tabel sendiri.
