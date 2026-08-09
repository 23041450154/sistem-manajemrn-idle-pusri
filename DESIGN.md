# Design Spec — Table Card Component

> Spesifikasi desain untuk komponen tabel card yang digunakan di halaman Inspeksi Teknik (Validasi Kelayakan, Validasi Ulang, Perbaikan Alat, Riwayat Perbaikan).

---

## 1. Card Container

Seluruh tabel, toolbar, dan pagination berada dalam **satu card utuh** — bukan terpisah.

```html
<div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4">
  <!-- Toolbar -->
  <!-- Table -->
  <!-- Pagination -->
</div>
```

| Properti | Value |
|----------|-------|
| Background | `bg-white` |
| Border | `border border-gray-200` |
| Radius | `rounded-xl` |
| Shadow | `shadow-sm` |
| Overflow | `overflow-hidden` |
| Scroll margin | `scroll-mt-4` |

### Page Container (Wrapper)

Wrapper luar yang membungkus seluruh halaman — **tanpa padding horizontal**, lebar mengikuti sidebar content area.

```html
<div class="max-w-7xl mx-auto pt-2 pb-8">
  <!-- Header -->
  <!-- Banner -->
  <!-- Card (toolbar + table + pagination) -->
</div>
```

| Properti | Value |
|----------|-------|
| Max width | `max-w-7xl` |
| Centering | `mx-auto` |
| Padding top | `pt-2` |
| Padding bottom | `pb-8` |
| Padding horizontal | **none** (jangan tambahkan `px-4` / `sm:px-6` / `lg:px-8`) |

> [!IMPORTANT]
> Jangan tambahkan padding horizontal (`px-*`) pada container utama. Padding sudah diatur oleh layout/sidebar. Penambahan `px-*` menyebabkan lebar card tabel tidak konsisten antar halaman.

---

## 2. Toolbar / Filter Bar

Toolbar berada **di dalam card**, dipisah dari tabel dengan `border-b`.

```html
<div class="p-3 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
  <!-- Search group (kiri) -->
  <!-- Filter group (kanan) -->
</div>
```

### 2.1 Search Input

```html
<div class="relative flex-1 lg:w-72">
  <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  <input
    type="text"
    placeholder="Cari kode atau nama alat..."
    class="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg
           focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]
           outline-none transition-all placeholder:text-gray-400"
  />
</div>
```

### 2.2 Search Button

```html
<button class="px-3 py-1.5 bg-[#0A356A] text-white text-[13px] font-medium rounded-lg
               hover:bg-[#062854] transition-colors whitespace-nowrap shadow-sm">
  Cari
</button>
```

### 2.3 Filter Dropdowns

```html
<select class="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg
               focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]
               outline-none text-gray-700 min-w-[120px] cursor-pointer">
  <option value="">Semua Plant</option>
  <!-- options -->
</select>
```

### 2.4 Reset Button

Text-only dengan icon, **bukan** button dengan border.

```html
<button class="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium
               text-gray-500 hover:text-gray-800 hover:bg-gray-100
               rounded-lg transition-colors whitespace-nowrap">
  <RefreshCw class="w-3.5 h-3.5" />
  Reset
</button>
```

### 2.5 Divider

Pemisah vertikal antara filter dan reset:

```html
<div class="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>
```

---

## 3. Table

### 3.1 Table Header (`<thead>`)

```html
<thead class="bg-gray-50/95 backdrop-blur-sm">
  <tr class="border-b border-gray-300">
    <th class="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider
               text-center w-12 whitespace-nowrap">
      No
    </th>
    <!-- kolom lain: text-left -->
  </tr>
</thead>
```

| Properti | Value |
|----------|-------|
| Background | `bg-gray-50/95 backdrop-blur-sm` |
| Border bottom | `border-b border-gray-300` |
| Font | `text-[14px] font-bold text-gray-600 uppercase tracking-wider` |
| Padding | `px-3 py-3` |
| No column | `text-center w-12` |
| Other columns | `text-left whitespace-nowrap` |

### 3.2 Table Body (`<tbody>`)

```html
<tbody class="bg-white">
  <tr class="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30
             transition-colors group">
    <td class="px-3 py-3 text-[15px] text-gray-500 font-medium text-center">
      {rowNum}
    </td>
    <td class="px-3 py-3 text-[15px] font-semibold text-gray-800 text-left">
      <span class="leading-tight line-clamp-2 block text-left">{namaAlat}</span>
    </td>
    <!-- kolom lain -->
  </tr>
</tbody>
```

| Properti | Value |
|----------|-------|
| Row border | `border-b border-gray-200 last:border-b-0` |
| Row hover | `hover:bg-blue-50/30 transition-colors group` |
| Cell font | `text-[15px]` |
| Cell padding | `px-3 py-3` |
| Group effect | Action button opacity `opacity-90 group-hover:opacity-100` |

### 3.3 Loading State

```html
<tr>
  <td colSpan={9} class="px-5 py-12 text-center text-gray-500">
    <div class="flex flex-col items-center">
      <Loader2 class="w-5 h-5 text-[#0A356A] animate-spin mb-2" />
      <p class="text-[13px] font-medium">Memuat data...</p>
    </div>
  </td>
</tr>
```

### 3.4 Empty State

```html
<tr>
  <td colSpan={9} class="px-5 py-12 text-center text-gray-500">
    <div class="flex flex-col items-center">
      <AlertCircle class="w-6 h-6 text-gray-300 mb-2" />
      <p class="text-[13px] font-medium text-gray-900">Tidak Ada Data</p>
      <p class="text-[11px] text-gray-500 mt-1">Deskripsi empty state...</p>
    </div>
  </td>
</tr>
```

### 3.5 Badge (Kondisi/Status)

```html
<span class="inline-block px-2 py-0.5 rounded text-[11px] font-bold
             bg-emerald-50 text-emerald-700 border border-emerald-200">
  BAGUS
</span>
```

| Kondisi | Background | Text |
|---------|-----------|------|
| Baik/BAGUS | `bg-emerald-50 border-emerald-200` | `text-emerald-700` |
| Rusak Ringan/Sedang | `bg-amber-50 border-amber-200` | `text-amber-700` |
| Tidak diketahui | `bg-gray-50 border-gray-200` | `text-gray-400` |

---

## 4. Pagination

Pagination berada **di dalam card**, dipisah dengan `border-t`.

```html
<div class="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
  <!-- Info count (kiri) -->
  <span class="text-[11px] font-medium text-gray-500">
    Menampilkan 1 - 10 dari 25 data (10 baris/halaman)
  </span>

  <!-- Page buttons (kanan) -->
  <div class="flex items-center gap-1.5">
    <!-- Prev -->
    <button class="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white
                   border border-gray-200 rounded-md
                   disabled:opacity-40 disabled:cursor-not-allowed
                   hover:bg-gray-50 transition-colors">
      Prev
    </button>

    <!-- Page numbers -->
    <div class="flex items-center gap-1">
      <button class="w-6 h-6 rounded-md text-[11px] font-bold flex items-center
                     justify-center transition-colors bg-[#0A356A] text-white">
        1
      </button>
      <button class="w-6 h-6 rounded-md text-[11px] font-bold flex items-center
                     justify-center transition-colors text-gray-600 hover:bg-gray-100">
        2
      </button>
    </div>

    <!-- Next -->
    <button class="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white
                   border border-gray-200 rounded-md
                   disabled:opacity-40 disabled:cursor-not-allowed
                   hover:bg-gray-50 transition-colors">
      Next
    </button>
  </div>
</div>
```

| Element | Active | Inactive |
|---------|--------|----------|
| Page button | `bg-[#0A356A] text-white` | `text-gray-600 hover:bg-gray-100` |
| Prev/Next | `hover:bg-gray-50` | `disabled:opacity-40 disabled:cursor-not-allowed` |

---

## 5. Toast Notification

Mengambang di pojok kanan atas, **bukan** alert hijau/merah.

```html
<div class="fixed top-6 right-6 z-[70] bg-gray-900 text-white px-5 py-3
            rounded-lg shadow-xl flex items-center gap-3
            animate-in fade-in slide-in-from-top-4 duration-300">
  <CheckCircle2 class="w-4 h-4 text-emerald-400" />  <!-- or XCircle text-red-400 -->
  <span class="text-[13px] font-medium">{message}</span>
  <button class="text-gray-400 hover:text-white ml-2">
    <X class="w-3.5 h-3.5" />
  </button>
</div>
```

| Properti | Value |
|----------|-------|
| Position | `fixed top-6 right-6 z-[70]` |
| Background | `bg-gray-900 text-white` |
| Radius | `rounded-lg` |
| Shadow | `shadow-xl` |
| Animation | `animate-in fade-in slide-in-from-top-4 duration-300` |
| Success icon | `CheckCircle2 text-emerald-400` |
| Error icon | `XCircle text-red-400` |
| Close button | `text-gray-400 hover:text-white` |

---

## 6. Notification Banner

Banner info dengan dot animasi, muncul **di atas** card.

```html
<div class="mb-4 flex items-center justify-between bg-blue-50 border border-blue-100
            rounded-lg px-4 py-2.5 animate-in fade-in slide-in-from-top-2">
  <div class="flex items-center gap-3">
    <span class="flex h-2.5 w-2.5 relative">
      <span class="animate-ping absolute inline-flex h-full w-full
                   rounded-full bg-blue-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
    </span>
    <span class="text-[13px] text-blue-800 font-medium">
      Terdapat <strong class="font-bold">5 aset</strong> yang membutuhkan tindakan.
    </span>
  </div>
</div>
```

---

## 7. Modal

### 7.1 Overlay

```html
<div class="fixed inset-0 z-[100] flex items-center justify-center p-4
            bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
  <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden
              border border-gray-100 flex flex-col max-h-[90vh]
              animate-in zoom-in-95 duration-200">
    <!-- Header, Body, Footer -->
  </div>
</div>
```

### 7.2 Modal Header

Gradient biru dengan icon di kiri dan tombol close di kanan.

```html
<div class="flex items-center justify-between px-6 py-4 border-b border-gray-200
            bg-gradient-to-r from-[#0A356A] to-[#0556B3]">
  <div class="flex items-center gap-3">
    <div class="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
      <Icon class="w-5 h-5 text-white" />
    </div>
    <div>
      <h2 class="text-base font-bold text-white">Title</h2>
      <p class="text-xs text-blue-100">Subtitle</p>
    </div>
  </div>
  <button class="text-white/70 hover:text-white p-1.5 rounded-lg
                  hover:bg-white/10 transition-colors">
    <X class="w-5 h-5" />
  </button>
</div>
```

### 7.3 Modal Body

```html
<div class="px-6 py-5 space-y-4 overflow-y-auto flex-1">
  <!-- Info box -->
  <div class="bg-gray-50 rounded-lg p-3 border border-gray-200
              grid grid-cols-2 gap-2 text-xs">
    <!-- key-value pairs -->
  </div>

  <!-- Form fields -->
  <div>
    <label class="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
      Label <span class="text-red-500">*</span>
    </label>
    <input class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                  bg-gray-50 focus:bg-white focus:border-[#0A356A]
                  focus:ring-1 focus:ring-[#0A356A] outline-none transition-all" />
  </div>
</div>
```

### 7.4 Modal Footer

```html
<div class="px-6 py-4 border-t border-gray-200 bg-gray-50
            flex justify-end gap-3">
  <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white
                 border border-gray-300 rounded-lg hover:bg-gray-50
                 transition-colors disabled:opacity-50">
    Batal
  </button>
  <button class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white
                 bg-[#0A356A] hover:bg-[#0556B3] rounded-lg transition-colors
                 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
    <Save class="w-4 h-4" />
    Simpan
  </button>
</div>
```

---

## 8. Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#0A356A` | Button, active page, kode alat text, focus ring |
| Primary hover | `#0556B3` | Button hover (modal) |
| Primary dark | `#062854` | Button hover (toolbar) |
| Row hover | `blue-50/30` | Table row hover |
| Header bg | `gray-50/95` | Table header with blur |
| Border | `gray-200` | Card, table row, form fields |
| Border strong | `gray-300` | Table header bottom, prev/next button |
| Text primary | `gray-800` | Cell text |
| Text secondary | `gray-600` | Muted cell text |
| Text muted | `gray-500` | Row number, info text |
| Toast bg | `gray-900` | Toast notification |

---

## 9. Typography Scale

| Element | Size |
|---------|------|
| Page title (h1) | `text-xl font-bold` |
| Table header (th) | `text-[14px] font-bold uppercase tracking-wider` |
| Table cell (td) | `text-[15px]` |
| Badge | `text-[11px] font-bold` |
| Toolbar input | `text-[13px]` |
| Toolbar button | `text-[13px]` |
| Pagination text | `text-[11px]` |
| Pagination button | `text-[11px] font-semibold` |
| Toast text | `text-[13px]` |
| Banner text | `text-[13px]` |
| Modal title | `text-base font-bold` |
| Modal subtitle | `text-xs` |
| Modal label | `text-xs font-bold uppercase tracking-wider` |
| Modal input | `text-sm` |
| Empty state title | `text-[13px] font-medium` |
| Empty state desc | `text-[11px]` |

---

## 10. Files Using This Pattern

| File | Status |
|------|--------|
| [validasi/page.tsx](file:///C:/projek/fe/src/app/(authenticated-routes)/inspeksi/validasi/page.tsx) | ✅ Reference (source of truth) |
| [validasi-ulang/page.tsx](file:///C:/projek/fe/src/app/(authenticated-routes)/inspeksi/validasi-ulang/page.tsx) | ✅ Aligned |
| [inspeksi-berkala/page.tsx](file:///C:/projek/fe/src/app/(authenticated-routes)/inspeksi/inspeksi-berkala/page.tsx) | ✅ Aligned |
| [perbaikan-alat/page.tsx](file:///C:/projek/fe/src/app/(authenticated-routes)/pemeliharaan/perbaikan-alat/page.tsx) | ✅ Aligned |
| [riwayat-perbaikan/page.tsx](file:///C:/projek/fe/src/app/(authenticated-routes)/pemeliharaan/riwayat-perbaikan/page.tsx) | ✅ Aligned |
| [rendal/idle/page.tsx](file:///C:/projek/fe/src/app/(authenticated-routes)/rendal/idle/page.tsx) | ✅ Aligned |
| [rendal/disposal/page.tsx](file:///C:/projek/fe/src/app/(authenticated-routes)/rendal/disposal/page.tsx) | ✅ Aligned |
| [rendal/laporan/page.tsx](file:///C:/projek/fe/src/app/(authenticated-routes)/rendal/laporan/page.tsx) | ✅ Aligned |
| [rendal/validasi-ulang/page.tsx](file:///C:/projek/fe/src/app/(authenticated-routes)/rendal/validasi-ulang/page.tsx) | ✅ Aligned |
