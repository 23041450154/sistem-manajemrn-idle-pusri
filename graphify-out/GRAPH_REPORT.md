# Graph Report - projek  (2026-11-19)

## Corpus Check
- 191 files · ~308,144 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .stackdump 5, .example 1, (none) 1)

## Summary
- 1014 nodes · 2482 edges · 78 communities (49 shown, 29 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e1e2288f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- getObjectTypes
- rendal/idle/page.tsx
- check-qa-6-on-progress.mjs
- konfirmasi-pemasangan-client.tsx
- compilerOptions
- dependencies
- devDependencies
- components.json
- rendal/scrap/page.tsx
- users.ts
- check-sprint6-top3-tasks.mjs
- package.json
- check-user-management.mjs
- Logo Sistem Idle Equipment — PUSRI
- DESIGN.md — Idle Equipment Console
- Sistem Manajemen Idle Equipment PUSRI
- 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab
- PRODUCT.md
- permissions.ts
- tw-animate-css
- getReuseRequests
- perbaikan-alat-client.tsx
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
- approve-client.tsx
- clear/route.ts
- shared.tsx
- usulan-idle-client.tsx
- eslint.config.mjs
- verifikasi-usulan/page.tsx
- postcss.config.mjs
- ref_react
- SearchableSelect.tsx
- getEquipments
- Anti-Slop Audit 001 (2026-11-18)
- pemeliharaan/dashboard/page.tsx
- ref_lucide_react
- check-rbac-and-rendal-daftar-equipment.mjs
- next.config.ts
- check-file-url.mjs
- inspection-schedule.ts
- clsx
- API_URL_INTERNAL
- API_URL_PUBLIC
- laporan/page.tsx
- equipment-status.ts
- getScraps
- validasi/page.tsx
- check-us-11-scrap-terminology.mjs
- check-qa-fixes-us12-us17.mjs
- check-photo-url.mjs
- Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI
- UnitKerjaDashboard
- next
- tailwind-merge

## God Nodes (most connected - your core abstractions)
1. `getEquipments()` - 64 edges
2. `statusName()` - 52 edges
3. `fetch()` - 47 edges
4. `revalidateApp()` - 31 edges
5. `getObjectTypes()` - 26 edges
6. `ConfirmDialog()` - 26 edges
7. `useAuth()` - 25 edges
8. `getApprovals()` - 23 edges
9. `getPlants()` - 22 edges
10. `buttonVariants` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Konvensi yang sudah dibangun — WAJIB dipertahankan` --references--> `formatDate()`  [INFERRED]
  HANDOFF-REVISI.md → src/app/(authenticated-routes)/rendal/perbaikan/perbaikan-client.tsx
- `Konvensi yang sudah dibangun — WAJIB dipertahankan` --references--> `statusName()`  [INFERRED]
  HANDOFF-REVISI.md → src/lib/equipment-status.ts
- `Konvensi yang sudah dibangun — WAJIB dipertahankan` --references--> `statusGroup()`  [INFERRED]
  HANDOFF-REVISI.md → src/lib/equipment-status.ts
- `Konvensi yang sudah dibangun — WAJIB dipertahankan` --references--> `reuseDisplayStatus()`  [INFERRED]
  HANDOFF-REVISI.md → src/lib/approvals.ts
- `Konvensi yang sudah dibangun — WAJIB dipertahankan` --references--> `scrapDisplayStatus()`  [INFERRED]
  HANDOFF-REVISI.md → src/lib/approvals.ts

## Import Cycles
- None detected.

## Communities (78 total, 29 thin omitted)

### Community 0 - "getObjectTypes"
Cohesion: 0.20
Nodes (21): getConditions(), getFunctionalLocations(), getObjectTypes(), getPlants(), getStorageLocations(), searchSapEquipment(), AdminDashboardPage(), MODULES (+13 more)

### Community 1 - "rendal/idle/page.tsx"
Cohesion: 0.16
Nodes (23): AssetState, Equipment, assetState(), RendalIdlePage(), formatStorageLocation(), RendalPerbaikanPage(), formatDate(), PerbaikanItem (+15 more)

### Community 2 - "check-qa-6-on-progress.mjs"
Cohesion: 0.14
Nodes (11): apiTs, formInspeksi, inspeksiBerkalaClient, inspeksiValidasiUlang, manajerApprovePage, pemakaianClient, registerClient, root (+3 more)

### Community 3 - "konfirmasi-pemasangan-client.tsx"
Cohesion: 0.08
Nodes (51): createReuseRequest(), getAttachmentsByEquipmentId(), EquipmentManagementPage(), EquipmentRow, locationOf(), nameOf(), plantOf(), ManajerPemakaianPage() (+43 more)

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

### Community 8 - "rendal/scrap/page.tsx"
Cohesion: 0.22
Nodes (16): createScrapRequest(), getInspections(), getScrapMethods(), ScrapItemDTO, ManajerScrapPage(), ManajerScrapClient(), ManajerScrapContent(), ScrapItem (+8 more)

### Community 9 - "users.ts"
Cohesion: 0.10
Nodes (34): createMasterItem(), deleteMasterItem(), fail(), getMasterItems(), MasterItem, resolve(), Result, updateMasterItem() (+26 more)

### Community 10 - "check-sprint6-top3-tasks.mjs"
Cohesion: 0.22
Nodes (7): berkalaClientSrc, berkalaPageSrc, formInspeksiSrc, manajerScrapSrc, modal90Matches, modalFiles, utilsSrc

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

### Community 22 - "getReuseRequests"
Cohesion: 0.31
Nodes (5): RendalDaftarEquipmentPage(), DaftarEquipmentView(), DaftarEquipmentViewProps, VISIBLE_STATUSES, DaftarAsetPage()

### Community 23 - "perbaikan-alat-client.tsx"
Cohesion: 0.06
Nodes (43): getFinancialMonthlyTrend(), getFinancialSummary(), Error(), formatRupiah(), ManajerDashboardClient(), ManajerDashboardClientProps, ManajerDashboardPage(), ALLOWED_EXTENSIONS (+35 more)

### Community 24 - "ref_node_assert"
Cohesion: 0.16
Nodes (8): mappings, clientContent, sidebarContent, offenders, apiSrc, clientSrc, installHelper, pageSrc

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
Cohesion: 0.19
Nodes (26): API_URL, approveRevalidationEquipment(), approveScrap(), assignEquipmentRepair(), AssignRepairPayload, completeEquipmentRepair(), confirmEquipmentInstallation(), createEquipment() (+18 more)

### Community 32 - "ui-layouts-mcp"
Cohesion: 0.40
Nodes (4): npx, 21st, ui-layouts-mcp, @ui-layouts/mcp

### Community 35 - "Sistem Manajemen Idle Equipment PUSRI"
Cohesion: 0.22
Nodes (8): Fitur, Lisensi, Menjalankan Secara Lokal, Peran Pengguna (Role), Prasyarat, Sistem Manajemen Idle Equipment PUSRI, Skrip, Struktur Direktori

### Community 36 - "generate-pdf.js"
Cohesion: 0.50
Nodes (3): doc, fs, PDFDocument

### Community 38 - "approve-client.tsx"
Cohesion: 0.19
Nodes (16): flattenEquipmentCode(), getApprovalById(), getEquipmentById(), getValidations(), startReviewApproval(), APPROVAL_STATUS_LABEL, AttachmentGallery(), CONDITION_RESULT (+8 more)

### Community 40 - "shared.tsx"
Cohesion: 0.13
Nodes (23): RendalDaftarEquipmentDetailPage(), Gallery(), Equipment, KatalogDetailView(), Row(), KatalogDetailPage(), EquipmentCard(), KatalogClient() (+15 more)

### Community 41 - "usulan-idle-client.tsx"
Cohesion: 0.11
Nodes (28): SapEquipmentRow, EMPTY_FORM, MasterEquipmentCode, MasterOption, RegisterEquipmentClient(), RegisterInitialData, RupiahField(), toCodeOptions() (+20 more)

### Community 43 - "verifikasi-usulan/page.tsx"
Cohesion: 0.27
Nodes (10): getEquipmentProposals(), mapProposalRow(), VerifikasiUsulanPage(), INSPECTION_CLUSTERS, ProposalAttachment, ProposalItem, VerifikasiUsulanClient(), basePath() (+2 more)

### Community 46 - "ref_react"
Cohesion: 0.06
Nodes (58): CurrentUserResult, getCurrentUserAction(), logoutAction(), LoginForm(), LoginPage(), LogoutPage(), AdminLayout(), InspeksiLayout() (+50 more)

### Community 55 - "getEquipments"
Cohesion: 0.18
Nodes (12): getEquipments(), getReuseRequests(), FormInspeksiPage(), ApiRow, EquipmentItem, ReuseRequestItem, UnitKerjaDashboardPage(), UnitKerjaIdlePage() (+4 more)

### Community 57 - "pemeliharaan/dashboard/page.tsx"
Cohesion: 0.22
Nodes (10): Equipment, PemeliharaanDashboardPage(), relativeTime(), STAGE_OWNER, STATUS_COLOR, PerbaikanAlatPage(), MaintenanceEquipment, REPAIR_STATUS_LABEL (+2 more)

### Community 58 - "ref_lucide_react"
Cohesion: 0.07
Nodes (36): InspeksiDashboardClient(), isFinalStatus(), FormInspeksiClient(), Equipment, InspectionItem, InspeksiBerkalaClient(), InspeksiBerkalaClientProps, InspeksiBerkalaContent() (+28 more)

### Community 59 - "check-rbac-and-rendal-daftar-equipment.mjs"
Cohesion: 0.14
Nodes (10): daftarAsetClient, expectedRoleLayouts, proxySrc, rendalDetailPage, rendalPage, roleGuard, root, sidebar (+2 more)

### Community 60 - "next.config.ts"
Cohesion: 0.33
Nodes (4): allowedOrigins, apiUrl, basePath, nextConfig

### Community 62 - "inspection-schedule.ts"
Cohesion: 0.21
Nodes (8): NOW, EquipmentLike, InspectionLike, inspectionQueue(), LastInspection, latestInspectionByEquipment(), StatusLike, statusName()

### Community 67 - "laporan/page.tsx"
Cohesion: 0.29
Nodes (6): actionTypeConfig, AuditLogEntry, RendalLaporanClient(), buildAuditLogs(), RendalLaporanPage(), formatDateTime()

### Community 68 - "equipment-status.ts"
Cohesion: 0.17
Nodes (22): getApprovals(), InspeksiDashboardPage(), APPROVAL_STATUS_LABEL, ManajerApprovePage(), RendalDashboard(), RendalDashboardClient(), RendalDashboardClientProps, RendalIdleClient() (+14 more)

### Community 69 - "getScraps"
Cohesion: 0.43
Nodes (6): absoluteFileUrl(), getScraps(), CostAvoidanceSection(), fetchData(), Equipment, statusGroup()

### Community 70 - "validasi/page.tsx"
Cohesion: 0.43
Nodes (6): getRequireActions(), ASSET_STATES, assetState(), normalizeLegacyStatus(), STATUS_BY_ID, ValidasiPage()

### Community 71 - "check-us-11-scrap-terminology.mjs"
Cohesion: 0.13
Nodes (18): Konvensi yang sudah dibangun — WAJIB dipertahankan, approvedBadge, disposedBadge, inReviewBadge, laporanClient, manajerScrapClient, pendingBadge, rejectedBadge (+10 more)

### Community 72 - "check-qa-fixes-us12-us17.mjs"
Cohesion: 0.40
Nodes (4): berkalaForm, inspeksiDashboard, syncedTargets, validasiClient

### Community 74 - "Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI"
Cohesion: 0.25
Nodes (7): Aturan main (dari user, jangan dilanggar), Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI, Konteks project (fakta penting), SISA KERJA 1 — 6a-2: Konversi RSC halaman inbox besar, SISA KERJA 2 — 24 `<img>` modal preview foto, SISA KERJA 3 — Backend Go (`~/Documents/pusri`, repo terpisah), Verifikasi wajib tiap akhir langkah

### Community 75 - "UnitKerjaDashboard"
Cohesion: 0.67
Nodes (3): react, react, UnitKerjaDashboard()

## Knowledge Gaps
- **35 isolated node(s):** `tw-animate-css`, `npx`, `@ui-layouts/mcp`, `dom`, `dom.iterable` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 451 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UnitKerjaDashboard()` connect `UnitKerjaDashboard` to `action/api.ts`, `perbaikan-alat-client.tsx`, `getEquipments`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `tw-animate-css`, `npx`, `@ui-layouts/mcp` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `check-qa-6-on-progress.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `react` connect `UnitKerjaDashboard` to `dependencies`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `konfirmasi-pemasangan-client.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08143839238498149 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `UnitKerjaDashboard`, `package.json`, `next`, `tailwind-merge`, `tw-animate-css`, `clsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._