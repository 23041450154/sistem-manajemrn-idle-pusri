# Graph Report - sistem-manajemrn-idle-pusri  (2026-11-11)

## Corpus Check
- 183 files · ~483,044 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 986 nodes · 2236 edges · 68 communities (48 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8d966458`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- equipment-status.ts
- ref_react
- shared.tsx
- getReuseRequests
- compilerOptions
- dependencies
- devDependencies
- components.json
- open-in-terminal/main.js
- users.ts
- Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI
- package.json
- check-user-management.mjs
- Logo Sistem Idle Equipment — PUSRI
- DESIGN.md — Idle Equipment Console
- build-philosophy-side.py
- Sistem Manajemen Idle Equipment PUSRI
- build-svg-v2.py
- 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab
- PRODUCT.md
- permissions.ts
- tw-animate-css
- usulan-idle-client.tsx
- perbaikan-alat-client.tsx
- rendal/idle/page.tsx
- check-auth-clear.mjs
- open-in-terminal/manifest.json
- check-us-13-supporting-documents.mjs
- claude-code-ide/main.js
- check-equipment-form.mjs
- check-repair-payload.mjs
- action/api.ts
- ui-layouts-mcp
- check-scrap-reason.mjs
- claude-code-ide/manifest.json
- Sistem Manajemen Idle Equipment PUSRI
- generate-pdf.js
- This is NOT the Next.js you know
- check-photo-url.mjs
- clear/route.ts
- check-us-06-repair-assignment.mjs
- check-us-10-installation-confirmation.mjs
- eslint.config.mjs
- postcss.config.mjs
- ref_node_fs
- lucide-react
- recharts
- inspeksi-berkala-client.tsx
- proxy-image/route.ts
- ref_node_assert
- pdfkit
- check-file-url.mjs
- clsx
- API_URL_INTERNAL
- API_URL_PUBLIC
- shadcn
- getEquipments

## God Nodes (most connected - your core abstractions)
1. `getEquipments()` - 59 edges
2. `statusName()` - 48 edges
3. `fetch()` - 46 edges
4. `useAuth()` - 33 edges
5. `revalidateApp()` - 30 edges
6. `getObjectTypes()` - 26 edges
7. `getApprovals()` - 23 edges
8. `normalizeRole()` - 23 edges
9. `getPlants()` - 22 edges
10. `buttonVariants` - 22 edges

## Surprising Connections (you probably didn't know these)
- `getPageWindow()` --indirect_call--> `p()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/riwayat-permintaan/riwayat-permintaan-client.tsx → .obsidian/plugins/claude-code-ide/main.js
- `str()` --indirect_call--> `v()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/dashboard/page.tsx → .obsidian/plugins/claude-code-ide/main.js
- `PemeliharaanDashboardPage()` --indirect_call--> `eq()`  [INFERRED]
  src/app/(authenticated-routes)/pemeliharaan/dashboard/page.tsx → scripts/check-inspection-schedule.mjs
- `RendalPerbaikanPage()` --indirect_call--> `eq()`  [INFERRED]
  src/app/(authenticated-routes)/rendal/perbaikan/page.tsx → scripts/check-inspection-schedule.mjs
- `N()` --indirect_call--> `r()`  [INFERRED]
  .obsidian/plugins/claude-code-ide/main.js → scripts/check-sso-only.mjs

## Import Cycles
- None detected.

## Communities (68 total, 20 thin omitted)

### Community 0 - "equipment-status.ts"
Cohesion: 0.06
Nodes (41): ref_lucide_react, ref_recharts, InspeksiDashboardClient(), isFinalStatus(), formatRupiah(), ManajerDashboardClient(), ManajerDashboardClientProps, RendalDashboardClient() (+33 more)

### Community 1 - "ref_react"
Cohesion: 0.05
Nodes (60): allowedOrigins, apiUrl, basePath, nextConfig, ref_next, ref_react, CurrentUserResult, getCurrentUserAction() (+52 more)

### Community 2 - "shared.tsx"
Cohesion: 0.12
Nodes (21): Equipment, KatalogDetailPage(), EquipmentCard(), KatalogClient(), uniq(), KatalogItem, KatalogPage(), VISIBLE_STATUSES (+13 more)

### Community 3 - "getReuseRequests"
Cohesion: 0.07
Nodes (49): createReuseRequest(), getReuseRequests(), EquipmentManagementPage(), EquipmentRow, locationOf(), nameOf(), plantOf(), ManajerPemakaianPage() (+41 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 5 - "dependencies"
Cohesion: 0.13
Nodes (15): @base-ui/react, class-variance-authority, next, nextjs-toploader, dependencies, @base-ui/react, class-variance-authority, next (+7 more)

### Community 6 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 7 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 8 - "open-in-terminal/main.js"
Cohesion: 0.10
Nodes (28): __awaiter(), buildDefaultTerminalAppSetting(), buildLaunchCommand(), buildMacLaunch(), buildUnixLaunch(), buildWindowsLaunch(), DEFAULT_SETTINGS, defaultTerminalApp() (+20 more)

### Community 9 - "users.ts"
Cohesion: 0.08
Nodes (37): createMasterItem(), deleteMasterItem(), fail(), getMasterItems(), MasterItem, resolve(), Result, updateMasterItem() (+29 more)

### Community 10 - "Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI"
Cohesion: 0.22
Nodes (8): Aturan main (dari user, jangan dilanggar), Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI, Konteks project (fakta penting), Konvensi yang sudah dibangun — WAJIB dipertahankan, SISA KERJA 1 — 6a-2: Konversi RSC halaman inbox besar, SISA KERJA 2 — 24 `<img>` modal preview foto, SISA KERJA 3 — Backend Go (`~/Documents/pusri`, repo terpisah), Verifikasi wajib tiap akhir langkah

### Community 11 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 12 - "check-user-management.mjs"
Cohesion: 0.50
Nodes (3): actions, page, sidebar

### Community 13 - "Logo Sistem Idle Equipment — PUSRI"
Cohesion: 0.20
Nodes (9): Catatan produksi dan prompt, File dan penggunaan, Filosofi bentuk, Logo Sistem Idle Equipment — PUSRI, Narasi filosofi siap pakai, Palet acuan, Prompt ikon, Prompt logo utama (+1 more)

### Community 14 - "DESIGN.md — Idle Equipment Console"
Cohesion: 0.14
Nodes (13): Accessibility, Brand, Color System, Component Patterns, DESIGN.md — Idle Equipment Console, Elevation, Grid, Image Style (+5 more)

### Community 16 - "Sistem Manajemen Idle Equipment PUSRI"
Cohesion: 0.15
Nodes (12): API Backend, Arsitektur, Autentikasi, Backend (`backend-idle/`), Cara Menjalankan, Catatan & Status Pengembangan, Frontend (`src/`), Model Data (Backend) (+4 more)

### Community 18 - "1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab"
Cohesion: 0.17
Nodes (11): 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab, 2. Alur Status & Siklus Hidup Aset (Asset Lifecycle), 3. Penyesuaian Formulir & Aturan Teknis Sistem, A. Parameter Informasi Aset (Pendaftaran Alat), A. Rendal Pemeliharaan (Planner & Coordinator), B. Form Inspeksi & Penomoran, B. Inspeksi Teknik - Instek (Validator & Auditor), C. Logika Validasi Kondisi & Kelayakan Aset (+3 more)

### Community 19 - "PRODUCT.md"
Cohesion: 0.17
Nodes (10): Anti-references, Brand voice, Constraints, Key messages, Missing facts, Primary job-to-be-done, Target audience, User-provided facts (+2 more)

### Community 20 - "permissions.ts"
Cohesion: 0.40
Nodes (3): Permission, PERMS, ROLE_PERMISSIONS

### Community 22 - "usulan-idle-client.tsx"
Cohesion: 0.06
Nodes (30): SapEquipmentRow, InspeksiValidasiUlangClient(), InspeksiValidasiUlangClientProps, RevalidasiItem, EMPTY_FORM, MasterEquipmentCode, MasterOption, RegisterEquipmentClient() (+22 more)

### Community 23 - "perbaikan-alat-client.tsx"
Cohesion: 0.23
Nodes (12): ALLOWED_EXTENSIONS, DOC_EXTENSIONS, EMPTY_HINT, EquipmentAttachmentItem, extractPhotoUrls(), IMAGE_EXTENSIONS, PerbaikanAlatClient(), rupiah() (+4 more)

### Community 24 - "rendal/idle/page.tsx"
Cohesion: 0.17
Nodes (22): AssetState, Equipment, assetState(), RendalIdlePage(), formatStorageLocation(), RendalPerbaikanPage(), formatDate(), PerbaikanItem (+14 more)

### Community 26 - "open-in-terminal/manifest.json"
Cohesion: 0.20
Nodes (9): author, authorUrl, description, fundingUrl, id, isDesktopOnly, minAppVersion, name (+1 more)

### Community 27 - "check-us-13-supporting-documents.mjs"
Cohesion: 0.13
Nodes (14): badRes, bigRes, daftarAsetSrc, docHelperSrc, fakeBadFile, fakeBigFile, idleSrc, manajerClientSrc (+6 more)

### Community 28 - "claude-code-ide/main.js"
Cohesion: 0.11
Nodes (23): b(), broadcastSelection(), D(), E(), I(), L(), N(), onload() (+15 more)

### Community 29 - "check-equipment-form.mjs"
Cohesion: 0.25
Nodes (7): api, appended, body, createFn, optional, page, required

### Community 30 - "check-repair-payload.mjs"
Cohesion: 0.20
Nodes (9): api, body, fn, modal, page, pages, pageSrc, required (+1 more)

### Community 31 - "action/api.ts"
Cohesion: 0.06
Nodes (75): approvedBadge, disposedBadge, inReviewBadge, laporanClient, manajerScrapClient, pendingBadge, rejectedBadge, rendalScrapPage (+67 more)

### Community 32 - "ui-layouts-mcp"
Cohesion: 0.40
Nodes (4): npx, 21st, ui-layouts-mcp, @ui-layouts/mcp

### Community 34 - "claude-code-ide/manifest.json"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 35 - "Sistem Manajemen Idle Equipment PUSRI"
Cohesion: 0.22
Nodes (8): Fitur, Lisensi, Menjalankan Secara Lokal, Peran Pengguna (Role), Prasyarat, Sistem Manajemen Idle Equipment PUSRI, Skrip, Struktur Direktori

### Community 36 - "generate-pdf.js"
Cohesion: 0.50
Nodes (3): doc, fs, PDFDocument

### Community 40 - "check-us-06-repair-assignment.mjs"
Cohesion: 0.25
Nodes (7): apiSrc, idleClientSrc, pemeliharaanSrc, perbaikanSrc, repairHelper, sidebarSrc, statusSrc

### Community 41 - "check-us-10-installation-confirmation.mjs"
Cohesion: 0.40
Nodes (4): apiSrc, clientSrc, installHelper, pageSrc

### Community 46 - "ref_node_fs"
Cohesion: 0.25
Nodes (5): ref_node_fs, mappings, clientContent, sidebarContent, offenders

### Community 55 - "inspeksi-berkala-client.tsx"
Cohesion: 0.15
Nodes (17): eq(), NOW, InspeksiBerkalaClient(), InspeksiBerkalaClientProps, getEquipmentInspectionCluster(), getInspectionClusterName(), getUserInspectionCluster(), INSPECTION_CLUSTERS (+9 more)

### Community 68 - "getEquipments"
Cohesion: 0.07
Nodes (58): getApprovals(), getConditions(), getEquipments(), getFinancialMonthlyTrend(), getFinancialSummary(), getFunctionalLocations(), getObjectTypes(), getPlants() (+50 more)

## Knowledge Gaps
- **351 isolated node(s):** `21st`, `npx`, `@ui-layouts/mcp`, `id`, `name` (+346 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UnitKerjaDashboard()` connect `equipment-status.ts` to `dependencies`, `action/api.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `react` connect `dependencies` to `equipment-status.ts`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `shadcn`, `package.json`, `lucide-react`, `recharts`, `tw-animate-css`, `pdfkit`, `clsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `21st`, `npx`, `@ui-layouts/mcp` to the rest of the system?**
  _351 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `equipment-status.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06246799795186892 - nodes in this community are weakly interconnected._
- **Should `ref_react` be split into smaller, more focused modules?**
  _Cohesion score 0.05422100205902539 - nodes in this community are weakly interconnected._
- **Should `shared.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11693548387096774 - nodes in this community are weakly interconnected._