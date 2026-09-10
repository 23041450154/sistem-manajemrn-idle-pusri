# Logo Sistem Idle Equipment — PUSRI

Konsep: **Aset idle kembali bernilai.**

Logo ini menggambarkan pengelolaan peralatan industri yang sedang tidak digunakan agar kondisinya terpantau, kelayakannya diperiksa, dan potensi pemanfaatannya dapat dioptimalkan. Aset yang memenuhi persyaratan dapat kembali mendukung operasional, sehingga perusahaan dapat mengurangi kebutuhan pembelian peralatan pengganti.

## Filosofi bentuk

| Elemen | Makna dalam konsep logo aplikasi |
| --- | --- |
| Roda gigi | Peralatan industri, pemeliharaan, dan keterhubungan kerja unit kerja, inspeksi, pemeliharaan, serta pengelola aset. |
| Monogram IE | Identitas **Idle Equipment**. Bentuk blok yang kokoh menyerupai komponen mesin dan mencerminkan data aset yang disusun secara teratur. |
| Panah melingkar | Alur evaluasi, perbaikan, dan penggunaan kembali; aset yang semula idle dapat kembali produktif setelah dinyatakan layak. |
| Bingkai bawah berbentuk U | Pengelolaan dan penjagaan nilai aset. Bentuk U juga memberi hubungan visual dengan identitas Pusri, yang menggunakan bentuk U sebagai simbol urea. |
| Tulisan PUSRI | Menegaskan hubungan aplikasi dengan PT Pupuk Sriwidjaja Palembang. |

## Unsur Pusri

Identitas resmi Pusri menggunakan kuning dan biru benhur serta bentuk U yang bermakna urea. Konsep aplikasi mengambil inspirasi dari pasangan warna dan bentuk tersebut, lalu menyesuaikannya dengan biru yang sudah digunakan aplikasi. Sumber: [Identitas Perusahaan — Pusri](https://pusri.co.id/id/about/identity-company).

Filosofi roda gigi, monogram IE, panah, dan nilai aset di atas merupakan usulan khusus untuk logo aplikasi ini. Kode warna berikut adalah palet acuan desain aplikasi, bukan klaim kode warna resmi perusahaan.

## Palet acuan

| Warna | Kode | Peran dan makna yang diusulkan |
| --- | --- | --- |
| Biru tua | `#0A356A` | Warna merek utama yang sudah ada di aplikasi; ketelitian, kepercayaan, dan pengelolaan aset yang tertib. |
| Biru | `#0556B3` | Warna interaksi yang sudah ada di aplikasi; teknologi, keterhubungan data, dan identitas IE. |
| Kuning | `#F4C542` | Aksen panah yang terinspirasi Pusri; potensi nilai ekonomi dan semangat mengaktifkan kembali aset. |
| Putih | `#FFFFFF` | Latar yang disarankan agar logo terlihat jelas. |

PNG hasil generasi memiliki variasi rona; kode di atas menjadi acuan warna untuk penyelarasan lebih lanjut. Kuning digunakan sebagai aksen logo. Warna status operasional aplikasi tetap mengikuti `DESIGN.md`, termasuk hijau untuk kondisi siap digunakan.

## File dan penggunaan

- **Logo utama:** [sistem-idle-pusri-logo-v1.png](../../public/branding/sistem-idle-pusri-logo-v1.png) — logo horizontal dengan nama aplikasi dan PUSRI, untuk area yang cukup lebar seperti halaman masuk, header, dan dokumen.
- **Ikon:** [sistem-idle-pusri-icon-v1.png](../../public/branding/sistem-idle-pusri-icon-v1.png) — simbol tanpa tulisan untuk ruang yang terbatas.
- Kedua file berupa PNG dengan kanal alpha transparan. Gunakan pada latar putih atau terang. Logo biru memerlukan bidang terang bila ditempatkan di sidebar biru tua.
- Jaga rasio asli. Sisakan ruang kosong di sekelilingnya sekitar sepersepuluh lebar simbol. Jangan memampatkan logo horizontal menjadi ikon persegi.
- Untuk ikon sangat kecil seperti favicon 16–32 px, cek keterbacaan saat integrasi; detail monogram dapat memerlukan penyederhanaan.
- Teks alternatif logo utama: “Sistem Idle Equipment Pusri”.
- PNG di atas disiapkan untuk integrasi berikutnya; komponen aplikasi belum diubah. Logo juga telah dibuat ulang langsung melalui Canva dan disimpan pada [desain asli pengguna](https://www.canva.com/design/DAHUubACnXc/Ub7-gyuQ3_Bn-5d5FIu71g/edit). Versi Canva memakai bingkai U bergigi, monogram IE, dan panah kuning dengan teks nama aplikasi serta PUSRI; bentuknya berbeda dari PNG hasil imagegen di folder proyek.

## Narasi filosofi siap pakai

> Logo Sistem Idle Equipment Pusri memadukan roda gigi, monogram IE, dan panah melingkar sebagai simbol pengelolaan peralatan industri yang berkesinambungan. Roda gigi mewakili aset dan pemeliharaan, monogram IE menegaskan identitas sistem, sedangkan panah melingkar menggambarkan upaya mengembalikan aset yang layak ke penggunaan produktif. Biru menampilkan ketelitian dan kepercayaan, sementara kuning menyimbolkan potensi nilai aset sekaligus menghadirkan hubungan visual dengan identitas Pusri. Keseluruhan logo membawa gagasan “Aset idle kembali bernilai”.

## Catatan produksi dan prompt

Dibuat menggunakan tool **imagegen bawaan**, tanpa CLI/API fallback. Logo utama menggunakan hasil generasi pertama yang memiliki alpha transparan. Ikon diturunkan dari logo tersebut. Percobaan refinement yang menghasilkan latar berpola tidak dipilih.

### Prompt logo utama

```text
Use case: logo-brand
Asset type: final horizontal logo lockup for an Indonesian internal industrial asset management web application, supplied as a high-resolution transparent PNG for later integration.
Primary request: Create a polished original logo for "SISTEM IDLE EQUIPMENT" at PUSRI. The app manages registration, technical inspection, maintenance, reuse and disposal of idle industrial equipment, with cost avoidance by reusing serviceable assets.
Composition: a single horizontal logo, generous yet tight practical clearspace, wide approximately 3:1 canvas. One strong compact emblem on the left, a beautifully aligned typographic lockup on the right. No presentation board, no mockup, no extra copies.
Emblem design: one coherent bold geometric industrial symbol: a simplified mechanical cog/open U-like frame in deep navy, integrated with a single flowing return arrow in yellow that completes the upper/right part of the frame. A minimal geometric equipment block / E-like negative space at its center. Prioritize a memorable solid silhouette and generous negative space so the emblem works at 32px. The U-like structure subtly references urea and Pusri; the circular return suggests idle assets returning to productive use. Only a few broad cog notches, no intricate teeth, no tiny parts.
Palette: exact flat navy #0A356A as dominant, exact blue #0556B3 as a restrained optional secondary, and exact warm yellow #F4C542 as the small but distinctive arrow accent. These hues match the existing app's navy sidebar and blue controls; yellow is a proposed brand accent inspired by Pusri's blue/yellow corporate identity. No green, cyan, purple or orange. No gradients.
Typography: precise, calm industrial humanist sans, comparable to IBM Plex Sans, impeccable optical kerning. To right of emblem, first small line "SISTEM", second large bold line "IDLE EQUIPMENT", third smaller but clearly legible line "PUSRI". All text navy #0A356A. Exact words, no other text. PUSRI must remain clear and prominent enough to identify the organization.
Style: exceptional corporate identity design, flat clean vector-like shapes, crisp edges, balanced geometry, contemporary and understated. Not a generic clip-art assembly.
Background: actual transparent alpha background including empty spaces within emblem, no visible checkerboard baked into pixels, no white rectangle.
Avoid: recreating or warping the official Pusri coat of arms, literal rice stalks, leaves, bolts, wrench clipart, play/pause buttons, tiny micro-details, shadows, bevels, embossing, texture, photographs, borders, captions, watermark. Deliver only ONE complete finished logo.
```

### Prompt ikon

Referensi: logo utama terpilih.

```text
Extract ONLY the emblem on the left of this supplied logo into a square standalone app icon PNG with a transparent background. Remove all wording on the right. Preserve the emblem precisely: navy U-shaped cog, blue IE industrial equipment monogram inside, warm yellow clockwise return arrow across the top. Center emblem on square canvas occupying 82% of its width, leave 9% padding on each side, keep full arrow and every cog tooth visible. Clean solid flat vector-style colors: navy #0A356A, blue #0556B3, yellow #F4C542. Smooth antialiased contours. Remove speckles and texture. Deliver transparent background with real alpha, no backdrop, no pattern. One icon only, no text, no board.
```
