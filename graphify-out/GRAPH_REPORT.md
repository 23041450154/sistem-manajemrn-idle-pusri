# Graph Report - projek  (2026-11-18)

## Corpus Check
- 190 files · ~307,618 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .stackdump 5, .example 1, (none) 1)

## Summary
- 1007 nodes · 2458 edges · 72 communities (42 shown, 30 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2233890c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- perbaikan-alat-client.tsx
- getEquipments
- check-qa-6-on-progress.mjs
- ref_lucide_react
- compilerOptions
- dependencies
- devDependencies
- components.json
- ref_lucide_react
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
- check-qa-fixes-us12-us17.mjs
- equipment-status.ts
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
- shared.tsx
- usulan-idle-client.tsx
- eslint.config.mjs
- buttonVariants
- postcss.config.mjs
- ref_react
- SearchableSelect.tsx
- unit-kerja/dashboard/page.tsx
- Anti-Slop Audit 001 (2026-11-18)
- pemeliharaan/dashboard/page.tsx
- inspection-schedule.ts
- check-rbac-and-rendal-daftar-equipment.mjs
- next.config.ts
- check-file-url.mjs
- class-variance-authority
- clsx
- API_URL_INTERNAL
- API_URL_PUBLIC
- laporan/page.tsx
- rendal/scrap/page.tsx
- pdfkit
- shadcn
- verifikasi-usulan/page.tsx

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
- `Konvensi yang sudah dibangun — WAJIB dipertahankan` --references--> `reuseDisplayStatus()`  [INFERRED]
  HANDOFF-REVISI.md → src/lib/approvals.ts
- `Konvensi yang sudah dibangun — WAJIB dipertahankan` --references--> `formatDate()`  [INFERRED]
  HANDOFF-REVISI.md → src/app/(authenticated-routes)/rendal/perbaikan/perbaikan-client.tsx
- `Konvensi yang sudah dibangun — WAJIB dipertahankan` --references--> `scrapDisplayStatus()`  [INFERRED]
  HANDOFF-REVISI.md → src/lib/approvals.ts
- `Konvensi yang sudah dibangun — WAJIB dipertahankan` --references--> `statusGroup()`  [INFERRED]
  HANDOFF-REVISI.md → src/lib/equipment-status.ts
- `Konvensi yang sudah dibangun — WAJIB dipertahankan` --references--> `statusName()`  [INFERRED]
  HANDOFF-REVISI.md → src/lib/equipment-status.ts

## Import Cycles
- None detected.

## Communities (72 total, 30 thin omitted)

### Community 0 - "perbaikan-alat-client.tsx"
Cohesion: 0.18
Nodes (15): PerbaikanAlatPage(), ALLOWED_EXTENSIONS, DOC_EXTENSIONS, EMPTY_HINT, EquipmentAttachmentItem, extractPhotoUrls(), IMAGE_EXTENSIONS, MaintenanceEquipment (+7 more)

### Community 1 - "getEquipments"
Cohesion: 0.24
Nodes (10): absoluteFileUrl(), getEquipments(), getScraps(), AdminDashboardPage(), MODULES, RecentEquipment, RendalDashboard(), CostAvoidanceSection() (+2 more)

### Community 2 - "check-qa-6-on-progress.mjs"
Cohesion: 0.14
Nodes (11): apiTs, formInspeksi, inspeksiBerkalaClient, inspeksiValidasiUlang, manajerApprovePage, pemakaianClient, registerClient, root (+3 more)

### Community 3 - "ref_lucide_react"
Cohesion: 0.06
Nodes (59): createReuseRequest(), getReuseRequests(), EquipmentManagementPage(), EquipmentRow, locationOf(), nameOf(), plantOf(), ManajerPemakaianPage() (+51 more)

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

### Community 8 - "ref_lucide_react"
Cohesion: 0.26
Nodes (7): getFinancialMonthlyTrend(), getFinancialSummary(), formatRupiah(), ManajerDashboardClient(), ManajerDashboardClientProps, ManajerDashboardPage(), DeleteConfirmDialogProps

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

### Community 22 - "check-qa-fixes-us12-us17.mjs"
Cohesion: 0.40
Nodes (4): berkalaForm, inspeksiDashboard, syncedTargets, validasiClient

### Community 23 - "equipment-status.ts"
Cohesion: 0.07
Nodes (44): Aturan main (dari user, jangan dilanggar), Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI, Konteks project (fakta penting), Konvensi yang sudah dibangun — WAJIB dipertahankan, SISA KERJA 1 — 6a-2: Konversi RSC halaman inbox besar, SISA KERJA 2 — 24 `<img>` modal preview foto, SISA KERJA 3 — Backend Go (`~/Documents/pusri`, repo terpisah), Verifikasi wajib tiap akhir langkah (+36 more)

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
Cohesion: 0.06
Nodes (86): API_URL, approveRevalidationEquipment(), approveScrap(), assignEquipmentRepair(), AssignRepairPayload, completeEquipmentRepair(), confirmEquipmentInstallation(), createEquipment() (+78 more)

### Community 32 - "ui-layouts-mcp"
Cohesion: 0.40
Nodes (4): npx, 21st, ui-layouts-mcp, @ui-layouts/mcp

### Community 35 - "Sistem Manajemen Idle Equipment PUSRI"
Cohesion: 0.22
Nodes (8): Fitur, Lisensi, Menjalankan Secara Lokal, Peran Pengguna (Role), Prasyarat, Sistem Manajemen Idle Equipment PUSRI, Skrip, Struktur Direktori

### Community 36 - "generate-pdf.js"
Cohesion: 0.50
Nodes (3): doc, fs, PDFDocument

### Community 40 - "shared.tsx"
Cohesion: 0.12
Nodes (26): RendalDaftarEquipmentDetailPage(), Gallery(), Equipment, KatalogDetailView(), Row(), KatalogDetailPage(), EquipmentCard(), KatalogClient() (+18 more)

### Community 41 - "usulan-idle-client.tsx"
Cohesion: 0.08
Nodes (37): getFunctionalLocations(), getMyEquipmentProposals(), SapEquipmentRow, searchSapEquipment(), RegisterEquipmentPage(), EMPTY_FORM, MasterEquipmentCode, MasterOption (+29 more)

### Community 43 - "buttonVariants"
Cohesion: 0.20
Nodes (11): Error(), geistMono, geistSans, metadata, plexMono, plexSans, RootLayout(), NotFound() (+3 more)

### Community 46 - "ref_react"
Cohesion: 0.05
Nodes (59): CurrentUserResult, getCurrentUserAction(), logoutAction(), LoginForm(), LoginPage(), LogoutPage(), AdminLayout(), InspeksiLayout() (+51 more)

### Community 55 - "unit-kerja/dashboard/page.tsx"
Cohesion: 0.22
Nodes (7): EquipmentItem, ReuseRequestItem, UnitKerjaDashboardContent(), ApiRow, EquipmentItem, ReuseRequestItem, UnitKerjaDashboardPage()

### Community 57 - "pemeliharaan/dashboard/page.tsx"
Cohesion: 0.28
Nodes (7): Equipment, PemeliharaanDashboardPage(), relativeTime(), STAGE_OWNER, STATUS_COLOR, REPAIR_STATUS_LABEL, repairFlowStatus()

### Community 58 - "inspection-schedule.ts"
Cohesion: 0.21
Nodes (8): NOW, EquipmentLike, InspectionLike, inspectionQueue(), LastInspection, latestInspectionByEquipment(), StatusLike, statusName()

### Community 59 - "check-rbac-and-rendal-daftar-equipment.mjs"
Cohesion: 0.14
Nodes (10): daftarAsetClient, expectedRoleLayouts, proxySrc, rendalDetailPage, rendalPage, roleGuard, root, sidebar (+2 more)

### Community 60 - "next.config.ts"
Cohesion: 0.33
Nodes (4): allowedOrigins, apiUrl, basePath, nextConfig

### Community 67 - "laporan/page.tsx"
Cohesion: 0.39
Nodes (6): actionTypeConfig, AuditLogEntry, RendalLaporanClient(), buildAuditLogs(), RendalLaporanPage(), formatDateTime()

### Community 68 - "rendal/scrap/page.tsx"
Cohesion: 0.07
Nodes (56): approvedBadge, disposedBadge, inReviewBadge, laporanClient, manajerScrapClient, pendingBadge, rejectedBadge, rendalScrapPage (+48 more)

### Community 71 - "verifikasi-usulan/page.tsx"
Cohesion: 0.27
Nodes (10): getEquipmentProposals(), mapProposalRow(), VerifikasiUsulanPage(), INSPECTION_CLUSTERS, ProposalAttachment, ProposalItem, VerifikasiUsulanClient(), basePath() (+2 more)

## Knowledge Gaps
- **35 isolated node(s):** `tw-animate-css`, `react`, `npx`, `@ui-layouts/mcp`, `dom` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 450 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UnitKerjaDashboard()` connect `equipment-status.ts` to `action/api.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `tw-animate-css`, `react`, `npx` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `check-qa-6-on-progress.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `react` connect `equipment-status.ts` to `dependencies`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `ref_lucide_react` be split into smaller, more focused modules?**
  _Cohesion score 0.06421052631578947 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `pdfkit`, `shadcn`, `package.json`, `tw-animate-css`, `equipment-status.ts`, `class-variance-authority`, `clsx`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._