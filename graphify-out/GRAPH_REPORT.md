# Graph Report - projek  (2026-11-11)

## Corpus Check
- 176 files · ~298,728 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .stackdump 5, .example 1, (none) 1)

## Summary
- 915 nodes · 2204 edges · 67 communities (35 shown, 32 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3260c6bb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- buttonVariants
- ref_react
- shared.tsx
- ref_react
- compilerOptions
- dependencies
- devDependencies
- components.json
- check-us-11-scrap-terminology.mjs
- users.ts
- Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI
- package.json
- check-user-management.mjs
- Logo Sistem Idle Equipment — PUSRI
- DESIGN.md — Idle Equipment Console
- Sistem Manajemen Idle Equipment PUSRI
- 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab
- PRODUCT.md
- permissions.ts
- tw-animate-css
- usulan-idle-client.tsx
- rendal/idle/page.tsx
- ref_node_assert
- check-auth-clear.mjs
- check-repair-payload.mjs
- check-us-13-supporting-documents.mjs
- check-us-06-repair-assignment.mjs
- check-equipment-form.mjs
- AnalogTimePicker.tsx
- action/api.ts
- ui-layouts-mcp
- check-scrap-reason.mjs
- Sistem Manajemen Idle Equipment PUSRI
- generate-pdf.js
- This is NOT the Next.js you know
- check-photo-url.mjs
- clear/route.ts
- DeleteConfirmDialog.tsx
- laporan/page.tsx
- eslint.config.mjs
- postcss.config.mjs
- check-inspection-validation-mapping.mjs
- SearchableSelect.tsx
- perbaikan-alat-client.tsx
- UnitKerjaDashboard
- next.config.ts
- next
- tailwind-merge
- check-file-url.mjs
- check-table-overflow.mjs
- clsx
- API_URL_INTERNAL
- API_URL_PUBLIC
- getEquipments

## God Nodes (most connected - your core abstractions)
1. `getEquipments()` - 61 edges
2. `statusName()` - 48 edges
3. `fetch()` - 46 edges
4. `useAuth()` - 33 edges
5. `revalidateApp()` - 30 edges
6. `getObjectTypes()` - 26 edges
7. `getApprovals()` - 23 edges
8. `normalizeRole()` - 23 edges
9. `ConfirmDialog()` - 23 edges
10. `getPlants()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `UnitKerjaDashboard()` --references--> `react`  [EXTRACTED]
  src/components/Dashboards/UnitKerjaDashboard.tsx → package.json
- `ManajerApproveClient()` --calls--> `statusBadgeStyle()`  [EXTRACTED]
  src/app/(authenticated-routes)/manajer/approve/approve-client.tsx → src/lib/equipment-status.ts
- `ManajerApproveClient()` --calls--> `statusText()`  [EXTRACTED]
  src/app/(authenticated-routes)/manajer/approve/approve-client.tsx → src/lib/equipment-status.ts
- `ManajerApprovePage()` --calls--> `ManajerApproveClient()`  [EXTRACTED]
  src/app/(authenticated-routes)/manajer/approve/page.tsx → src/app/(authenticated-routes)/manajer/approve/approve-client.tsx
- `ManajerApprovePage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(authenticated-routes)/manajer/approve/page.tsx → src/components/AuthProvider.tsx

## Import Cycles
- None detected.

## Communities (67 total, 32 thin omitted)

### Community 0 - "buttonVariants"
Cohesion: 0.07
Nodes (34): getFinancialMonthlyTrend(), getFinancialSummary(), Error(), formatRupiah(), ManajerDashboardClient(), ManajerDashboardClientProps, ManajerDashboardPage(), EquipmentItem (+26 more)

### Community 1 - "ref_react"
Cohesion: 0.07
Nodes (52): CurrentUserResult, getCurrentUserAction(), logoutAction(), LoginForm(), LoginPage(), LogoutPage(), AdminLayout(), InspeksiLayout() (+44 more)

### Community 2 - "shared.tsx"
Cohesion: 0.13
Nodes (24): Gallery(), Equipment, KatalogDetailPage(), Row(), EquipmentCard(), KatalogClient(), Select(), uniq() (+16 more)

### Community 3 - "ref_react"
Cohesion: 0.05
Nodes (64): createReuseRequest(), getReuseRequests(), EquipmentManagementPage(), EquipmentRow, locationOf(), nameOf(), plantOf(), InspeksiDashboardClient() (+56 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): @base-ui/react, class-variance-authority, lucide-react, nextjs-toploader, dependencies, @base-ui/react, class-variance-authority, lucide-react (+9 more)

### Community 6 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 7 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 8 - "check-us-11-scrap-terminology.mjs"
Cohesion: 0.17
Nodes (10): approvedBadge, disposedBadge, inReviewBadge, laporanClient, manajerScrapClient, pendingBadge, rejectedBadge, rendalScrapPage (+2 more)

### Community 9 - "users.ts"
Cohesion: 0.10
Nodes (33): createMasterItem(), deleteMasterItem(), fail(), getMasterItems(), MasterItem, resolve(), Result, updateMasterItem() (+25 more)

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
Cohesion: 0.10
Nodes (31): getFunctionalLocations(), SapEquipmentRow, searchSapEquipment(), RegisterEquipmentPage(), EMPTY_FORM, MasterEquipmentCode, MasterOption, RegisterEquipmentClient() (+23 more)

### Community 23 - "rendal/idle/page.tsx"
Cohesion: 0.17
Nodes (22): AssetState, Equipment, assetState(), RendalIdlePage(), formatStorageLocation(), RendalPerbaikanPage(), formatDate(), PerbaikanItem (+14 more)

### Community 24 - "ref_node_assert"
Cohesion: 0.22
Nodes (6): clientContent, sidebarContent, apiSrc, clientSrc, installHelper, pageSrc

### Community 26 - "check-repair-payload.mjs"
Cohesion: 0.20
Nodes (9): api, body, fn, modal, page, pages, pageSrc, required (+1 more)

### Community 27 - "check-us-13-supporting-documents.mjs"
Cohesion: 0.13
Nodes (14): badRes, bigRes, daftarAsetSrc, docHelperSrc, fakeBadFile, fakeBigFile, idleSrc, manajerClientSrc (+6 more)

### Community 28 - "check-us-06-repair-assignment.mjs"
Cohesion: 0.25
Nodes (7): apiSrc, idleClientSrc, pemeliharaanSrc, perbaikanSrc, repairHelper, sidebarSrc, statusSrc

### Community 29 - "check-equipment-form.mjs"
Cohesion: 0.25
Nodes (7): api, appended, body, createFn, optional, page, required

### Community 31 - "action/api.ts"
Cohesion: 0.07
Nodes (67): absoluteFileUrl(), API_URL, approveDisposal(), approveRevalidationEquipment(), assignEquipmentRepair(), AssignRepairPayload, completeEquipmentRepair(), confirmEquipmentInstallation() (+59 more)

### Community 32 - "ui-layouts-mcp"
Cohesion: 0.40
Nodes (4): npx, 21st, ui-layouts-mcp, @ui-layouts/mcp

### Community 35 - "Sistem Manajemen Idle Equipment PUSRI"
Cohesion: 0.22
Nodes (8): Fitur, Lisensi, Menjalankan Secara Lokal, Peran Pengguna (Role), Prasyarat, Sistem Manajemen Idle Equipment PUSRI, Skrip, Struktur Direktori

### Community 36 - "generate-pdf.js"
Cohesion: 0.50
Nodes (3): doc, fs, PDFDocument

### Community 41 - "laporan/page.tsx"
Cohesion: 0.43
Nodes (6): actionTypeConfig, AuditLogEntry, RendalLaporanClient(), buildAuditLogs(), RendalLaporanPage(), formatDateTime()

### Community 55 - "perbaikan-alat-client.tsx"
Cohesion: 0.07
Nodes (34): NOW, FormInspeksiClient(), Equipment, InspectionItem, InspeksiBerkalaClient(), InspeksiBerkalaClientProps, ALLOWED_EXTENSIONS, DOC_EXTENSIONS (+26 more)

### Community 56 - "UnitKerjaDashboard"
Cohesion: 0.67
Nodes (3): react, react, UnitKerjaDashboard()

### Community 57 - "next.config.ts"
Cohesion: 0.33
Nodes (4): allowedOrigins, apiUrl, basePath, nextConfig

### Community 68 - "getEquipments"
Cohesion: 0.07
Nodes (54): getApprovals(), getConditions(), getEquipments(), getObjectTypes(), getPlants(), getRequireActions(), getStorageLocations(), AdminDashboardPage() (+46 more)

## Knowledge Gaps
- **35 isolated node(s):** `tw-animate-css`, `npx`, `@ui-layouts/mcp`, `dom`, `dom.iterable` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 410 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UnitKerjaDashboard()` connect `UnitKerjaDashboard` to `buttonVariants`, `getEquipments`, `action/api.ts`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `tw-animate-css`, `npx`, `@ui-layouts/mcp` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `buttonVariants` be split into smaller, more focused modules?**
  _Cohesion score 0.0663265306122449 - nodes in this community are weakly interconnected._
- **Why does `react` connect `UnitKerjaDashboard` to `dependencies`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `ref_react` be split into smaller, more focused modules?**
  _Cohesion score 0.06925624811803674 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`, `tw-animate-css`, `UnitKerjaDashboard`, `next`, `tailwind-merge`, `clsx`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `shared.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._