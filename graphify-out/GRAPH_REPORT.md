# Graph Report - projek  (2026-11-19)

## Corpus Check
- 190 files · ~307,271 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .stackdump 5, .example 1, (none) 1)

## Summary
- 1008 nodes · 2570 edges · 57 communities (48 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `733de338`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lucide-react
- AuthProvider.tsx
- shared.tsx
- getReuseRequests
- compilerOptions
- dependencies
- package.json
- components.json
- (authenticated-routes)/layout.tsx
- users.ts
- check-us-11-scrap-terminology.mjs
- package.json
- check-user-management.mjs
- Logo Sistem Idle Equipment — PUSRI
- DESIGN.md — Idle Equipment Console
- build-philosophy-side.py
- Sistem Manajemen Idle Equipment PUSRI
- react
- 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab
- PRODUCT.md
- permissions.ts
- roles.ts
- usulan-idle-client.tsx
- perbaikan-alat-client.tsx
- equipment-status.ts
- check-rbac-and-rendal-daftar-equipment.mjs
- check-qa-6-on-progress.mjs
- check-us-13-supporting-documents.mjs
- buttonVariants
- check-equipment-form.mjs
- check-repair-payload.mjs
- action/api.ts
- ui-layouts-mcp
- ref_node_assert
- check-sprint6-top3-tasks.mjs
- Sistem Manajemen Idle Equipment PUSRI
- generate-pdf.js
- This is NOT the Next.js you know
- manajer/dashboard/page.tsx
- next
- check-us-06-repair-assignment.mjs
- check-us-10-installation-confirmation.mjs
- eslint.config.mjs
- app/layout.tsx
- statusBadgeStyle
- postcss.config.mjs
- ref_node_fs
- @base-ui/react
- logout/page.tsx
- AnalogTimePicker.tsx
- SearchableSelect.tsx
- Anti-Slop Audit 001 (2026-11-18)
- DeleteConfirmDialog.tsx
- inspeksi-berkala-client.tsx
- getEquipments

## God Nodes (most connected - your core abstractions)
1. `react` - 88 edges
2. `getEquipments()` - 66 edges
3. `lucide-react` - 57 edges
4. `next` - 57 edges
5. `statusName()` - 52 edges
6. `fetch()` - 46 edges
7. `revalidateApp()` - 33 edges
8. `ConfirmDialog()` - 27 edges
9. `getObjectTypes()` - 26 edges
10. `useAuth()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `SISA KERJA 1 — 6a-2: Konversi RSC halaman inbox besar` --references--> `revalidateApp()`  [INFERRED]
  HANDOFF-REVISI.md → src/lib/revalidate.ts
- `Konvensi yang sudah dibangun — WAJIB dipertahankan` --references--> `statusGroup()`  [INFERRED]
  HANDOFF-REVISI.md → src/lib/equipment-status.ts
- `Konvensi yang sudah dibangun — WAJIB dipertahankan` --references--> `revalidateApp()`  [INFERRED]
  HANDOFF-REVISI.md → src/lib/revalidate.ts
- `Konvensi yang sudah dibangun — WAJIB dipertahankan` --references--> `scrapDisplayStatus()`  [INFERRED]
  HANDOFF-REVISI.md → src/lib/approvals.ts
- `Konvensi yang sudah dibangun — WAJIB dipertahankan` --references--> `reuseDisplayStatus()`  [INFERRED]
  HANDOFF-REVISI.md → src/lib/approvals.ts

## Import Cycles
- None detected.

## Communities (57 total, 9 thin omitted)

### Community 0 - "lucide-react"
Cohesion: 0.14
Nodes (18): lucide-react, recharts, getReuseRequests(), ChartSection(), Equipment, RendalDashboard(), ApiRow, UnitKerjaDashboard() (+10 more)

### Community 1 - "AuthProvider.tsx"
Cohesion: 0.21
Nodes (14): CurrentUserResult, getCurrentUserAction(), LoginPage(), ErrorContent(), ErrorPage(), MESSAGES, Home(), AuthContext (+6 more)

### Community 2 - "shared.tsx"
Cohesion: 0.12
Nodes (26): RendalDaftarEquipmentDetailPage(), Gallery(), Equipment, KatalogDetailView(), Row(), KatalogDetailPage(), EquipmentCard(), KatalogClient() (+18 more)

### Community 3 - "getReuseRequests"
Cohesion: 0.08
Nodes (48): ManajerPemakaianClient(), ManajerPemakaianContent(), ReuseRequest, ReuseRequestApi, RendalDaftarEquipmentPage(), DaftarAsetClient(), DaftarAsetContent(), EquipmentItem (+40 more)

### Community 4 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, lucide-react@^1.24.0, next@16.2.10, react@19.2.4, react-dom@19.2.4, recharts@^3.9.2 (+9 more)

### Community 6 - "package.json"
Cohesion: 0.16
Nodes (16): devDependencies, tailwindcss@^4, @tailwindcss/postcss@^4, @types/node@^20, @types/react@^19, @types/react-dom@^19, typescript@^5, name (+8 more)

### Community 7 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 8 - "(authenticated-routes)/layout.tsx"
Cohesion: 0.20
Nodes (15): AuthenticatedLayout(), Shell(), Header(), HeaderUser, formatRelativeTime(), NotificationDropdown(), NotificationItem, Sidebar() (+7 more)

### Community 9 - "users.ts"
Cohesion: 0.09
Nodes (35): createMasterItem(), deleteMasterItem(), fail(), getMasterItems(), MasterItem, resolve(), Result, updateMasterItem() (+27 more)

### Community 10 - "check-us-11-scrap-terminology.mjs"
Cohesion: 0.07
Nodes (33): Aturan main (dari user, jangan dilanggar), Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI, Konteks project (fakta penting), Konvensi yang sudah dibangun — WAJIB dipertahankan, SISA KERJA 1 — 6a-2: Konversi RSC halaman inbox besar, SISA KERJA 2 — 24 `<img>` modal preview foto, SISA KERJA 3 — Backend Go (`~/Documents/pusri`, repo terpisah), Verifikasi wajib tiap akhir langkah (+25 more)

### Community 11 - "package.json"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

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

### Community 17 - "react"
Cohesion: 0.20
Nodes (9): react, AdminLayout(), InspeksiLayout(), ManajerLayout(), PemeliharaanLayout(), RendalLayout(), RegisterEquipmentLayout(), UnitKerjaLayout() (+1 more)

### Community 18 - "1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab"
Cohesion: 0.17
Nodes (11): 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab, 2. Alur Status & Siklus Hidup Aset (Asset Lifecycle), 3. Penyesuaian Formulir & Aturan Teknis Sistem, A. Parameter Informasi Aset (Pendaftaran Alat), A. Rendal Pemeliharaan (Planner & Coordinator), B. Form Inspeksi & Penomoran, B. Inspeksi Teknik - Instek (Validator & Auditor), C. Logika Validasi Kondisi & Kelayakan Aset (+3 more)

### Community 19 - "PRODUCT.md"
Cohesion: 0.17
Nodes (10): Anti-references, Brand voice, Constraints, Key messages, Missing facts, Primary job-to-be-done, Target audience, User-provided facts (+2 more)

### Community 20 - "permissions.ts"
Cohesion: 0.40
Nodes (3): Permission, PERMS, ROLE_PERMISSIONS

### Community 21 - "roles.ts"
Cohesion: 0.17
Nodes (16): UnauthorizedPage(), UnauthorizedBoundary(), UnauthorizedView(), DEFAULT_ROLE, isValidRole(), labelForRole(), requiredRoleForPath(), ROLE_HOME (+8 more)

### Community 22 - "usulan-idle-client.tsx"
Cohesion: 0.08
Nodes (38): getFunctionalLocations(), SapEquipmentRow, searchSapEquipment(), PreviewConfirmPage(), RegisterEquipmentPage(), EMPTY_FORM, MasterEquipmentCode, MasterOption (+30 more)

### Community 23 - "perbaikan-alat-client.tsx"
Cohesion: 0.12
Nodes (22): Equipment, PemeliharaanDashboardPage(), relativeTime(), STAGE_OWNER, STATUS_COLOR, PerbaikanAlatPage(), ALLOWED_EXTENSIONS, DOC_EXTENSIONS (+14 more)

### Community 24 - "equipment-status.ts"
Cohesion: 0.21
Nodes (20): RendalDashboardClient(), RendalDashboardClientProps, AssetState, RendalIdleClient(), RendalIdleClientProps, toPhotoUrl(), ALIASES, EquipmentStatus (+12 more)

### Community 25 - "check-rbac-and-rendal-daftar-equipment.mjs"
Cohesion: 0.14
Nodes (10): daftarAsetClient, expectedRoleLayouts, proxySrc, rendalDetailPage, rendalPage, roleGuard, root, sidebar (+2 more)

### Community 26 - "check-qa-6-on-progress.mjs"
Cohesion: 0.14
Nodes (11): apiTs, formInspeksi, inspeksiBerkalaClient, inspeksiValidasiUlang, manajerApprovePage, pemakaianClient, registerClient, root (+3 more)

### Community 27 - "check-us-13-supporting-documents.mjs"
Cohesion: 0.13
Nodes (14): badRes, bigRes, daftarAsetSrc, docHelperSrc, fakeBadFile, fakeBigFile, idleSrc, manajerClientSrc (+6 more)

### Community 28 - "buttonVariants"
Cohesion: 0.18
Nodes (11): Error(), EquipmentItem, ReuseRequestItem, UnitKerjaDashboardContent(), ApiRow, EquipmentItem, ReuseRequestItem, NotFound() (+3 more)

### Community 29 - "check-equipment-form.mjs"
Cohesion: 0.25
Nodes (7): api, appended, body, createFn, optional, page, required

### Community 30 - "check-repair-payload.mjs"
Cohesion: 0.20
Nodes (9): api, body, fn, modal, page, pages, pageSrc, required (+1 more)

### Community 31 - "action/api.ts"
Cohesion: 0.06
Nodes (80): absoluteFileUrl(), API_URL, approveRevalidationEquipment(), approveScrap(), assignEquipmentRepair(), AssignRepairPayload, completeEquipmentRepair(), confirmEquipmentInstallation() (+72 more)

### Community 32 - "ui-layouts-mcp"
Cohesion: 0.40
Nodes (4): npx, 21st, ui-layouts-mcp, @ui-layouts/mcp

### Community 33 - "ref_node_assert"
Cohesion: 0.12
Nodes (7): AUTH_COOKIES, cleared, payload, API, PAGES, ins, val

### Community 34 - "check-sprint6-top3-tasks.mjs"
Cohesion: 0.17
Nodes (8): berkalaClientSrc, berkalaPageSrc, formInspeksiSrc, manajerScrapSrc, modal90Matches, modalFiles, utilsSrc, offenders

### Community 35 - "Sistem Manajemen Idle Equipment PUSRI"
Cohesion: 0.22
Nodes (8): Fitur, Lisensi, Menjalankan Secara Lokal, Peran Pengguna (Role), Prasyarat, Sistem Manajemen Idle Equipment PUSRI, Skrip, Struktur Direktori

### Community 36 - "generate-pdf.js"
Cohesion: 0.29
Nodes (5): pdfkit@^0.19.1, pdfkit, doc, fs, PDFDocument

### Community 38 - "manajer/dashboard/page.tsx"
Cohesion: 0.43
Nodes (6): getFinancialMonthlyTrend(), getFinancialSummary(), formatRupiah(), ManajerDashboardClient(), ManajerDashboardClientProps, ManajerDashboardPage()

### Community 39 - "next"
Cohesion: 0.05
Nodes (36): allowedOrigins, apiUrl, basePath, nextConfig, next, getRequireActions(), AUTH_COOKIES, BASE_PATH (+28 more)

### Community 40 - "check-us-06-repair-assignment.mjs"
Cohesion: 0.25
Nodes (7): apiSrc, idleClientSrc, pemeliharaanSrc, perbaikanSrc, repairHelper, sidebarSrc, statusSrc

### Community 41 - "check-us-10-installation-confirmation.mjs"
Cohesion: 0.40
Nodes (4): apiSrc, clientSrc, installHelper, pageSrc

### Community 42 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.2.10, eslint, eslint-config-next

### Community 43 - "app/layout.tsx"
Cohesion: 0.25
Nodes (6): geistMono, geistSans, metadata, plexMono, plexSans, RootLayout()

### Community 44 - "statusBadgeStyle"
Cohesion: 0.48
Nodes (6): EquipmentManagementPage(), EquipmentRow, locationOf(), nameOf(), plantOf(), statusBadgeStyle()

### Community 46 - "ref_node_fs"
Cohesion: 0.17
Nodes (7): mappings, berkalaForm, inspeksiDashboard, syncedTargets, validasiClient, clientContent, sidebarContent

### Community 47 - "@base-ui/react"
Cohesion: 0.33
Nodes (4): @base-ui/react@^1.6.0, nextjs-toploader@^3.9.17, @base-ui/react, nextjs-toploader

### Community 48 - "logout/page.tsx"
Cohesion: 0.67
Nodes (3): logoutAction(), LogoutPage(), apiBase()

### Community 55 - "inspeksi-berkala-client.tsx"
Cohesion: 0.21
Nodes (8): NOW, EquipmentLike, InspectionLike, inspectionQueue(), LastInspection, latestInspectionByEquipment(), StatusLike, statusName()

### Community 68 - "getEquipments"
Cohesion: 0.09
Nodes (48): getConditions(), getEquipments(), getObjectTypes(), getPlants(), getStorageLocations(), AdminDashboardPage(), MODULES, RecentEquipment (+40 more)

## Knowledge Gaps
- **2 isolated node(s):** `npx`, `@ui-layouts/mcp`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 410 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `lucide-react`, `AuthProvider.tsx`, `shared.tsx`, `getReuseRequests`, `dependencies`, `package.json`, `(authenticated-routes)/layout.tsx`, `users.ts`, `check-us-11-scrap-terminology.mjs`, `roles.ts`, `usulan-idle-client.tsx`, `perbaikan-alat-client.tsx`, `equipment-status.ts`, `buttonVariants`, `action/api.ts`, `manajer/dashboard/page.tsx`, `next`, `statusBadgeStyle`, `logout/page.tsx`, `AnalogTimePicker.tsx`, `SearchableSelect.tsx`, `getEquipments`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **What connects `npx`, `@ui-layouts/mcp` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.14245014245014245 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `lucide-react`, `AuthProvider.tsx`, `shared.tsx`, `getReuseRequests`, `getEquipments`, `dependencies`, `package.json`, `manajer/dashboard/page.tsx`, `(authenticated-routes)/layout.tsx`, `users.ts`, `check-us-11-scrap-terminology.mjs`, `app/layout.tsx`, `roles.ts`, `usulan-idle-client.tsx`, `perbaikan-alat-client.tsx`, `equipment-status.ts`, `buttonVariants`, `action/api.ts`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Should `shared.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `shared.tsx`, `getReuseRequests`, `dependencies`, `package.json`, `(authenticated-routes)/layout.tsx`, `users.ts`, `check-us-11-scrap-terminology.mjs`, `react`, `roles.ts`, `usulan-idle-client.tsx`, `perbaikan-alat-client.tsx`, `equipment-status.ts`, `buttonVariants`, `action/api.ts`, `manajer/dashboard/page.tsx`, `next`, `statusBadgeStyle`, `AnalogTimePicker.tsx`, `SearchableSelect.tsx`, `DeleteConfirmDialog.tsx`, `getEquipments`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Should `getReuseRequests` be split into smaller, more focused modules?**
  _Cohesion score 0.07615018508725542 - nodes in this community are weakly interconnected._