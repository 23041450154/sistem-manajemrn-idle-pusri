# Graph Report - projek  (2026-11-08)

## Corpus Check
- 175 files · ~297,974 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .stackdump 5, .example 1, (none) 1)

## Summary
- 913 nodes · 2197 edges · 72 communities (38 shown, 34 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5694f588`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- equipment-status.ts
- useAuth
- shared.tsx
- riwayat-permintaan-client.tsx
- compilerOptions
- dependencies
- devDependencies
- components.json
- auth.ts
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
- perbaikan-alat-client.tsx
- validasi-client.tsx
- check-auth-clear.mjs
- NotificationDropdown.tsx
- check-us-13-supporting-documents.mjs
- check-us-11-scrap-terminology.mjs
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
- rendal/scrap/page.tsx
- eslint.config.mjs
- postcss.config.mjs
- check-inspection-validation-mapping.mjs
- SearchableSelect.tsx
- inspeksi-berkala-client.tsx
- withBasePath
- next.config.ts
- class-variance-authority
- pdfkit
- check-file-url.mjs
- check-table-overflow.mjs
- clsx
- API_URL_INTERNAL
- API_URL_PUBLIC
- shadcn
- getEquipments
- ConfirmDialog
- approve-client.tsx
- app/layout.tsx

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
- `Shell()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(authenticated-routes)/layout.tsx → src/components/AuthProvider.tsx
- `UnitKerjaDashboard()` --references--> `react`  [EXTRACTED]
  src/components/Dashboards/UnitKerjaDashboard.tsx → package.json
- `RendalDashboard()` --calls--> `getEquipments()`  [EXTRACTED]
  src/components/Dashboards/RendalDashboard.tsx → src/action/api.ts
- `RendalDashboard()` --calls--> `getInspections()`  [EXTRACTED]
  src/components/Dashboards/RendalDashboard.tsx → src/action/api.ts
- `RendalDashboard()` --calls--> `getObjectTypes()`  [EXTRACTED]
  src/components/Dashboards/RendalDashboard.tsx → src/action/api.ts

## Import Cycles
- None detected.

## Communities (72 total, 34 thin omitted)

### Community 0 - "equipment-status.ts"
Cohesion: 0.08
Nodes (43): react, react, EquipmentManagementPage(), EquipmentRow, locationOf(), nameOf(), plantOf(), InspeksiDashboardClient() (+35 more)

### Community 1 - "useAuth"
Cohesion: 0.28
Nodes (14): AdminLayout(), InspeksiLayout(), ManajerLayout(), PemeliharaanLayout(), RendalLayout(), RegisterEquipmentLayout(), UnitKerjaLayout(), AuthContext (+6 more)

### Community 2 - "shared.tsx"
Cohesion: 0.13
Nodes (24): Gallery(), Equipment, KatalogDetailPage(), Row(), EquipmentCard(), KatalogClient(), Select(), uniq() (+16 more)

### Community 3 - "riwayat-permintaan-client.tsx"
Cohesion: 0.09
Nodes (42): createReuseRequest(), getReuseRequests(), ManajerPemakaianPage(), ManajerPemakaianClient(), ReuseRequest, ReuseRequestApi, DaftarAsetClient(), EquipmentItem (+34 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 5 - "dependencies"
Cohesion: 0.13
Nodes (15): @base-ui/react, lucide-react, next, nextjs-toploader, dependencies, @base-ui/react, lucide-react, next (+7 more)

### Community 6 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 7 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 8 - "auth.ts"
Cohesion: 0.15
Nodes (15): CurrentUserResult, logoutAction(), LogoutPage(), apiBase(), apiJson(), ApiResult, BASE_PATH, AUTH_COOKIES (+7 more)

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
Cohesion: 0.06
Nodes (72): getConditions(), getFunctionalLocations(), getObjectTypes(), getPlants(), getStorageLocations(), SapEquipmentRow, searchSapEquipment(), InspeksiAntreanPage() (+64 more)

### Community 23 - "perbaikan-alat-client.tsx"
Cohesion: 0.13
Nodes (21): Equipment, PemeliharaanDashboardPage(), relativeTime(), STAGE_OWNER, STATUS_COLOR, PerbaikanAlatPage(), ALLOWED_EXTENSIONS, DOC_EXTENSIONS (+13 more)

### Community 24 - "validasi-client.tsx"
Cohesion: 0.21
Nodes (17): getInspections(), resubmitApproval(), updateValidation(), validateEquipment(), InspeksiBerkalaClient(), ApprovalState, AssetState, ManajemenInspeksiClient() (+9 more)

### Community 26 - "NotificationDropdown.tsx"
Cohesion: 0.17
Nodes (12): Shell(), Header(), HeaderUser, formatRelativeTime(), NotificationDropdown(), NotificationItem, Sidebar(), SidebarContext (+4 more)

### Community 27 - "check-us-13-supporting-documents.mjs"
Cohesion: 0.05
Nodes (36): clientContent, sidebarContent, api, body, fn, modal, page, pages (+28 more)

### Community 28 - "check-us-11-scrap-terminology.mjs"
Cohesion: 0.13
Nodes (17): approvedBadge, disposedBadge, inReviewBadge, laporanClient, manajerScrapClient, pendingBadge, rejectedBadge, rendalScrapPage (+9 more)

### Community 29 - "check-equipment-form.mjs"
Cohesion: 0.25
Nodes (7): api, appended, body, createFn, optional, page, required

### Community 31 - "action/api.ts"
Cohesion: 0.20
Nodes (21): API_URL, approveRevalidationEquipment(), assignEquipmentRepair(), AssignRepairPayload, completeEquipmentRepair(), confirmEquipmentInstallation(), createEquipment(), deleteEquipment() (+13 more)

### Community 32 - "ui-layouts-mcp"
Cohesion: 0.40
Nodes (4): npx, 21st, ui-layouts-mcp, @ui-layouts/mcp

### Community 35 - "Sistem Manajemen Idle Equipment PUSRI"
Cohesion: 0.22
Nodes (8): Fitur, Lisensi, Menjalankan Secara Lokal, Peran Pengguna (Role), Prasyarat, Sistem Manajemen Idle Equipment PUSRI, Skrip, Struktur Direktori

### Community 36 - "generate-pdf.js"
Cohesion: 0.50
Nodes (3): doc, fs, PDFDocument

### Community 41 - "rendal/scrap/page.tsx"
Cohesion: 0.20
Nodes (16): approveDisposal(), createDisposalRequest(), DisposalItemDTO, getApprovalById(), getDisposalMethods(), getValidations(), reviseDisposalRequest(), DisposalItem (+8 more)

### Community 55 - "inspeksi-berkala-client.tsx"
Cohesion: 0.18
Nodes (11): NOW, Equipment, InspectionItem, InspeksiBerkalaClientProps, EquipmentLike, InspectionLike, inspectionQueue(), LastInspection (+3 more)

### Community 56 - "withBasePath"
Cohesion: 0.30
Nodes (11): getCurrentUserAction(), LoginForm(), LoginPage(), ErrorContent(), ErrorPage(), MESSAGES, Home(), AuthProvider() (+3 more)

### Community 57 - "next.config.ts"
Cohesion: 0.33
Nodes (4): allowedOrigins, apiUrl, basePath, nextConfig

### Community 68 - "getEquipments"
Cohesion: 0.07
Nodes (39): absoluteFileUrl(), getApprovals(), getDisposals(), getEquipments(), getFinancialMonthlyTrend(), getFinancialSummary(), AdminDashboardPage(), MODULES (+31 more)

### Community 69 - "ConfirmDialog"
Cohesion: 0.22
Nodes (9): createRevalidation(), submitInspectionData(), FormInspeksiClient(), InspeksiValidasiUlangClient(), InspeksiValidasiUlangClientProps, ConfirmDialog(), ConfirmDialogProps, Tone (+1 more)

### Community 70 - "approve-client.tsx"
Cohesion: 0.29
Nodes (10): getAttachmentsByEquipmentId(), getEquipmentById(), reviewApproval(), startReviewApproval(), APPROVAL_STATUS_LABEL, CONDITION_RESULT, formatRupiah(), Lookup (+2 more)

### Community 73 - "app/layout.tsx"
Cohesion: 0.29
Nodes (7): geistMono, geistSans, metadata, plexMono, plexSans, RootLayout(), cn()

## Knowledge Gaps
- **35 isolated node(s):** `react`, `tw-animate-css`, `npx`, `@ui-layouts/mcp`, `dom` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 409 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UnitKerjaDashboard()` connect `equipment-status.ts` to `action/api.ts`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `react`, `tw-animate-css`, `npx` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `equipment-status.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08350168350168351 - nodes in this community are weakly interconnected._
- **Why does `react` connect `equipment-status.ts` to `dependencies`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `shared.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `equipment-status.ts`, `shadcn`, `package.json`, `tw-animate-css`, `class-variance-authority`, `pdfkit`, `clsx`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `riwayat-permintaan-client.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0925589836660617 - nodes in this community are weakly interconnected._