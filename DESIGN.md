# DESIGN SYSTEM & FRONTEND SPECIFICATIONS
**Sistem Manajemen Idle Equipment — PT Pupuk Sriwidjaja Palembang**

> **Perhatian untuk Seluruh AI Agent & Developer:**
> File ini adalah **Single Source of Truth** untuk seluruh tampilan UI/UX, tata letak Data Table, skema warna, komponen modal, drawer, dan aksi di seluruh role (Admin, Rendal Pemeliharaan, Inspeksi Teknik, Manajer Rendal, Unit Kerja Operasi).
> 
> **Wajib dipatuhi dan diterapkan secara 100% konsisten.** Tidak diperbolehkan membuat variasi warna, padding, atau struktur tabel tersendiri.

---

## 🎨 1. Identitas Visual & Sistem Warna (Brand Color System)

- **Warna Utama (Primary Navy Blue)**: `#0A356A`
  - Digunakan untuk Header Banner, Primary Button, Navbar/Sidebar active state, dan top-border aksen KPI.
- **Warna Primary Hover**: `#0556B3`
- **Background Utama Aplikasi**: `bg-slate-50` / `#F8FAFC`
- **Surface Cards & Panels**: `bg-white border border-slate-200/80 shadow-sm`
- **Border Radius**:
  - `rounded-2xl` untuk Card Container, Panel Utama, Modal, & Drawer.
  - `rounded-xl` untuk Sub-panel, Button, Dropdown, & Input text.
  - `rounded-lg` untuk Table headers & Badges.

---

## 📊 2. Spesifikasi Standar Data Table (100% Konsisten di Semua Role)

Seluruh tabel data di semua role (`admin/equipment`, `rendal/idle`, `rendal/perbaikan-alat`, `inspeksi/validasi`, `manajer/persetujuan-validasi`, `manajer/peminjaman`, `unit-kerja/idle`) **WAJIB** menggunakan struktur berikut:

### A. Header Tabel (`<thead>`)
```tsx
<tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
  <th className="px-5 py-3.5">Kode Aset</th>
  <th className="px-5 py-3.5">Nama Peralatan</th>
  <th className="px-5 py-3.5">Plant</th>
  <th className="px-5 py-3.5">Lokasi Penyimpanan</th>
  <th className="px-5 py-3.5">Status Aset</th>
  <th className="px-5 py-3.5 text-center w-[120px]">Actions</th>
</tr>
```

### B. Baris Tabel (`<tbody> <tr>`)
```tsx
<tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
  <td className="px-5 py-4 font-mono font-bold text-slate-900">{item.equipment_code}</td>
  <td className="px-5 py-4 font-semibold text-slate-900 max-w-[220px] truncate">{item.name}</td>
  <td className="px-5 py-4 text-slate-700 font-medium">{item.plant}</td>
  <td className="px-5 py-4 text-slate-600 font-medium">{item.storage_location}</td>
  <td className="px-5 py-4">{getStatusBadge(item.status)}</td>
  <td className="px-5 py-4 text-center whitespace-nowrap">
    {/* Kolom Actions */}
  </td>
</tr>
```

---

## 🛠️ 3. Spesifikasi Kolom Actions & Aturan Ikon Eagle Eye (`Eye`)

1. **ATURAN IKON EAGLE EYE (`Eye`)**:
   - **Ikon `Eye` (Eagle Eye) HANYA BOLEH DIGUNAKAN pada halaman Administrator (`/admin/equipment`).**
   - **DILARANG MENAMPILKAN IKON `Eye` (Eagle Eye) pada tabel di role operasional lain** (*Rendal Pemeliharaan, Inspeksi Teknik, Manajer Rendal, Unit Kerja Operasi*).
   - Untuk role operasional seperti Manajer Rendal, gunakan tombol aksi berupa teks/badge seperti **"Tinjau"** atau **"Verifikasi"**.

2. **Template Kolom Actions untuk Administrator (`/admin/equipment`)**:
```tsx
<td className="px-5 py-4 text-center whitespace-nowrap">
  <div className="flex items-center justify-center gap-1">
    {/* Eagle Eye (Khusus Admin) */}
    <Tooltip content="Detail Eagle Eye">
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDetail(item); }}
        className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
      >
        <Eye className="w-4 h-4" />
      </Button>
    </Tooltip>

    {/* Edit (Khusus Admin) */}
    <Tooltip content="Edit">
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(item); }}
        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        <Pencil className="w-4 h-4" />
      </Button>
    </Tooltip>

    {/* Delete (Khusus Admin) */}
    <Tooltip content="Hapus">
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(item); }}
        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </Tooltip>
  </div>
</td>
```

---

## 🏷️ 4. Palet Warna Status Badges Terstandarisasi

Gunakan helper `getStatusBadge()` dengan skema warna konsisten di seluruh aplikasi:

```tsx
const getStatusBadge = (statusName?: string) => {
  const s = (statusName || "REGISTERED").toUpperCase();

  // 1. Validated / Ready to Use / Active (Biru Emerald / Blue)
  if (s.includes("VALIDAT") || s.includes("READY") || s.includes("ACTIVE")) {
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
        Validated
      </span>
    );
  }

  // 2. Maintenance / Perbaikan (Oranye / Amber)
  if (s.includes("MAINT") || s.includes("PERBAIKAN")) {
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
        Maintenance
      </span>
    );
  }

  // 3. Idle / Cadangan (Ungu / Slate)
  if (s.includes("IDLE")) {
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
        Idle
      </span>
    );
  }

  // 4. Waiting Approval / Pending / Review (Kuning / Yellow)
  if (s.includes("PENDING") || s.includes("REVIEW") || s.includes("WAIT")) {
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-yellow-50 text-yellow-800 border border-yellow-200 inline-flex items-center gap-1">
        Waiting Approval
      </span>
    );
  }

  // 5. Disposed / Rejected / Scrap (Merah / Rose)
  if (s.includes("DISPOS") || s.includes("REJECT") || s.includes("SCRAP")) {
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
        Disposed
      </span>
    );
  }

  // Default Fallback
  return (
    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
      {statusName || "Registered"}
    </span>
  );
};
```

---

## 📌 5. Spesifikasi Header Banner & Card Summary KPI

### A. Header Banner Ringkas
```tsx
<div className="bg-[#0A356A] rounded-2xl px-6 py-4 text-[#FFFFFF] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-blue-900/30">
  <div>
    <h1 className="text-xl font-bold tracking-tight">Judul Halaman</h1>
    <p className="text-blue-200/90 text-xs mt-0.5 font-medium">Sub-deskripsi halaman</p>
  </div>
  <div className="flex items-center gap-2.5 shrink-0">
    {/* Action buttons */}
  </div>
</div>
```

### B. Summary KPI Cards (4 Cards Grid)
- **Top Border Uniform**: Seluruh 4 card menggunakan top border biru navy yang sama (`border-t-4 border-t-[#0A356A]`).
- **Diferensiasi Warna Icon Box**:
  1. Total Asset: Icon box Biru (`bg-blue-50 text-[#0A356A] border-blue-100`)
  2. Asset Idle: Icon box Ungu (`bg-purple-50 text-purple-600 border-purple-100`)
  3. Maintenance: Icon box Oranye (`bg-amber-50 text-amber-600 border-amber-100`)
  4. Disposal Pending: Icon box Merah (`bg-rose-50 text-rose-600 border-rose-100`)

---

## 📝 6. Spesifikasi Form Edit & Modal Dialog (`EditEquipmentDialog.tsx`)

1. **Mekanisme Reusable Tunggal**: Seluruh role WAJIB memanggil `<EditEquipmentDialog />`.
2. **Instant Prefill (< 1ms)**: Modal terbuka instan dari prop data baris tanpa *blocking spinner screen*.
3. **Pencegahan Page Reload**:
   - Seluruh `<button>` non-submit WAJIB menyertakan `type="button"`.
   - Form submit WAJIB menangkap `onSubmit={(e) => { e.preventDefault(); handleSave(); }}`.
4. **Pencegahan `[object Object]`**: Seluruh nilai objek (misal `storage_location: { id: 2, name: "Gudang P-IIIB" }`) diekstrak menggunakan helper `extractStringValue()`.

---

### 🛡️ Aturan Penjagaan untuk AI Agent (Agent Enforcement Rules)
1. **Dilarang** menampilkan ikon `Eye` (Eagle Eye) di tabel non-admin.
2. **Dilarang** mengganti warna header tabel dari `bg-slate-50 border-b border-slate-200`.
3. **Dilarang** membuat tombol Edit/Delete dalam bentuk tombol teks besar di tabel.
4. **Dilarang** memicu `location.reload()` atau `window.location.href` pada proses Simpan/Edit (gunakan state update + `fetchData()`).
5. **Dilarang** menggunakan warna top border yang berbeda-beda pada summary card (gunakan `border-t-[#0A356A]`).
