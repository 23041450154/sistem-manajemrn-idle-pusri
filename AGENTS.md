<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Rules & Guidelines for All AI Coding Agents
**Project: Sistem Manajemen Idle Equipment — PT Pupuk Sriwidjaja Palembang**

File ini adalah pedoman lengkap dan **instruksi wajib (Mandatory Rules)** bagi seluruh AI Agent (Antigravity, Claude, Codex, Subagents, dll.) yang bekerja di repositori ini.

---

## 🎨 1. Mandat Penggunaan Sistem Desain (`design.md` & `DESIGN.md`)

Seluruh agen AI **WAJIB MEMATUHI** aturan desain di [`design.md`](file:///C:/projek/branch%20baru/design.md) dan [`DESIGN.md`](file:///C:/projek/branch%20baru/DESIGN.md) untuk semua modifikasi komponen UI frontend.

### Aturan Utama Tampilan:
1. **Tiga Ikon Aksi Standar (`Eye`, `Pencil`, `Trash2`)**:
   - **Eagle Eye (`Eye`)**: Selalu digunakan untuk tombol aksi Detail di semua tabel.
   - **Edit (`Pencil`) & Hapus (`Trash2`)**: Ditampilkan khusus untuk role Admin (`{isAdmin && (...)}`) dan disembunyikan untuk role lain.

2. **Konsistensi Data Table & Bebas Scroll Horizontal**:
   - Seluruh tabel WAJIB menggunakan `table-fixed` untuk mencegah scrollbar horizontal.
   - **Header (`<thead>`)**: `bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider px-3 py-3.5`
   - **Body Row (`<tbody> <tr>`)**: `hover:bg-slate-50/80 transition-colors px-3 py-2 text-xs font-medium text-slate-700 h-[48px]`
   - **Kolom Actions**: Selalu berada di paling kanan (`text-center whitespace-nowrap w-[120px]`).

3. **Warna Identitas Brand & Summary KPI Cards**:
   - Brand Primary Navy: `#0A356A`
   - Brand Primary Hover: `#0556B3`
   - Seluruh summary KPI cards menggunakan aksen garis atas yang seragam: `border-t-4 border-t-[#0A356A]`.

4. **Status Badges (Terstandarisasi)**:
   - **Validated / Ready / Active**: `bg-blue-50 text-blue-700 border border-blue-200`
   - **Maintenance / Perbaikan**: `bg-amber-50 text-amber-700 border border-amber-200`
   - **Idle / Cadangan**: `bg-purple-50 text-purple-700 border border-purple-200`
   - **Waiting Approval / Pending**: `bg-yellow-50 text-yellow-800 border border-yellow-200`
   - **Disposed / Rejected**: `bg-rose-50 text-rose-700 border border-rose-200`

---

## 💻 2. Aturan Pengembangan Frontend (Frontend Developer Guidelines)

1. **Batasan Pengubahan Codebase**:
   - Agen berfokus pada sisi Frontend (`src/app`, `src/components`, `src/action`).
   - Dilarang merusak atau mengubah kontrak API backend, skema database, atau business logic backend tanpa instruksi user.

2. **Zero Page Reloads (Tanpa Reload Halaman)**:
   - DILARANG menggunakan `location.reload()`, `window.location.reload()`, atau `window.location.href = ...` saat menyimpan form/data.
   - Pembaruan data tabel WAJIB dilakukan via React state update atau pemanggilan `fetchData()` setelah API request berhasil.

3. **Pengelolaan Form & Event Handler Safety**:
   - Seluruh tombol `<button>` yang bukan merupakan tombol submit form WAJIB memiliki atribut `type="button"`.
   - Handler submit form WAJIB menyertakan `e.preventDefault()` dan `e.stopPropagation()` untuk mencegah pengiriman form default browser.

4. **Penanganan Prefill Form Instan & Pencegahan `[object Object]`**:
   - Modal Edit (`EditEquipmentDialog.tsx`) WAJIB terbuka instan (< 1ms) menggunakan data awal dari prop baris tabel tanpa menutupi input dengan *blocking spinner loading screen*.
   - Data bidang ber-tipe objek (misal: `storage_location: { id: 2, name: "Gudang P-IIIB" }`) WAJIB diekstrak string-nya secara aman via helper `extractStringValue()` agar tidak menampilkan string `[object Object]` pada bidang input atau select.

---

## 🛡️ 3. Aturan Verifikasi & Quality Assurance (QA)

1. **Pemeriksaan TypeScript Wajib**:
   - Setelah melakukan modifikasi struktur komponen atau kode, agen WAJIB menjalankan perintah `npx tsc --noEmit` untuk memastikan **0 error kompilasi (Exit Code 0)**.
2. **Preservasi Dokumentasi Kode**:
   - Pertahankan komentar kode, tipe interface, dan docstring yang ada kecuali jika diminta oleh user.
