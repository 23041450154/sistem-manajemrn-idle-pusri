# Graph Report - sistem-manajemrn-idle-pusri  (2026-08-25)

## Corpus Check
- 140 files · ~278,485 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 709 nodes · 1398 edges · 53 communities (41 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `11976666`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- equipment-status.ts
- auth.ts
- open-in-terminal/main.js
- shared.tsx
- compilerOptions
- dependencies
- devDependencies
- components.json
- claude-code-ide/main.js
- revalidateApp
- Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI
- approve-client.tsx
- buttonVariants
- inspeksi-berkala/page.tsx
- DESIGN.md — Idle Equipment Console
- pemeliharaan/dashboard/page.tsx
- Sistem Manajemen Idle Equipment PUSRI
- action/api.ts
- 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab
- PRODUCT.md
- RendalDashboard.tsx
- YearPicker.tsx
- getReuseRequests
- perbaikan-alat-client.tsx
- open-in-terminal/manifest.json
- @base-ui/react
- claude-code-ide/manifest.json
- check-repair-payload.mjs
- package.json
- check-equipment-form.mjs
- clsx
- ui-layouts-mcp
- check-scrap-reason.mjs
- README.md
- generate-pdf.js
- This is NOT the Next.js you know
- pdfkit
- shadcn
- DeleteConfirmDialog.tsx
- tw-animate-css
- eslint.config.mjs
- postcss.config.mjs
- check-inspection-validation-mapping.mjs

## God Nodes (most connected - your core abstractions)
1. `getEquipments()` - 51 edges
2. `getCurrentUserAction()` - 29 edges
3. `statusName()` - 25 edges
4. `normalizeRole()` - 23 edges
5. `homePathForRole()` - 23 edges
6. `buttonVariants` - 22 edges
7. `revalidateApp()` - 21 edges
8. `getObjectTypes()` - 19 edges
9. `getDisposals()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `PemeliharaanDashboardPage()` --indirect_call--> `eq()`  [INFERRED]
  src/app/(authenticated-routes)/pemeliharaan/dashboard/page.tsx → scripts/check-inspection-schedule.mjs
- `getPageWindow()` --indirect_call--> `p()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/riwayat-permintaan/riwayat-permintaan-client.tsx → .obsidian/plugins/claude-code-ide/main.js
- `str()` --indirect_call--> `v()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/dashboard/page.tsx → .obsidian/plugins/claude-code-ide/main.js
- `approveRevalidationEquipment()` --references--> `apiUrl`  [EXTRACTED]
  src/action/api.ts → next.config.ts
- `completeEquipmentRepair()` --references--> `apiUrl`  [EXTRACTED]
  src/action/api.ts → next.config.ts

## Import Cycles
- None detected.

## Communities (53 total, 12 thin omitted)

### Community 0 - "equipment-status.ts"
Cohesion: 0.18
Nodes (9): react, react, ApiRow, UnitKerjaDashboard(), ALIASES, REPAIR_FLOW, STATUS_ALIASES, STATUS_BADGE_STYLE (+1 more)

### Community 1 - "auth.ts"
Cohesion: 0.09
Nodes (39): cookieConfig(), getCurrentUserAction(), login(), loginAction(), logoutAction(), ssoCallbackAction(), CallbackContent(), initialState (+31 more)

### Community 2 - "open-in-terminal/main.js"
Cohesion: 0.10
Nodes (28): __awaiter(), buildDefaultTerminalAppSetting(), buildLaunchCommand(), buildMacLaunch(), buildUnixLaunch(), buildWindowsLaunch(), DEFAULT_SETTINGS, defaultTerminalApp() (+20 more)

### Community 3 - "shared.tsx"
Cohesion: 0.10
Nodes (25): createReuseRequest(), DaftarAsetPage(), EquipmentItem, VISIBLE_STATUSES, KatalogDetailPage(), KatalogItemMinimal, RequestModalButton(), EquipmentCard() (+17 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 5 - "dependencies"
Cohesion: 0.13
Nodes (15): class-variance-authority, lucide-react, next, nextjs-toploader, dependencies, class-variance-authority, lucide-react, next (+7 more)

### Community 6 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 7 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 8 - "claude-code-ide/main.js"
Cohesion: 0.13
Nodes (20): b(), broadcastSelection(), D(), E(), I(), L(), N(), onload() (+12 more)

### Community 9 - "revalidateApp"
Cohesion: 0.20
Nodes (15): authHeaders(), createMasterItem(), deleteMasterItem(), fail(), getMasterItems(), MasterItem, resolve(), Result (+7 more)

### Community 10 - "Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI"
Cohesion: 0.22
Nodes (8): Aturan main (dari user, jangan dilanggar), Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI, Konteks project (fakta penting), Konvensi yang sudah dibangun — WAJIB dipertahankan, SISA KERJA 1 — 6a-2: Konversi RSC halaman inbox besar, SISA KERJA 2 — 24 `<img>` modal preview foto, SISA KERJA 3 — Backend Go (`~/Documents/pusri`, repo terpisah), Verifikasi wajib tiap akhir langkah

### Community 11 - "approve-client.tsx"
Cohesion: 0.11
Nodes (25): deleteEquipment(), getApprovalById(), getEquipmentById(), reviewApproval(), startReviewApproval(), EquipmentManagementPage(), EquipmentRow, nameOf() (+17 more)

### Community 12 - "buttonVariants"
Cohesion: 0.18
Nodes (12): Error(), InspeksiDashboardClient(), ManajerDashboardPage(), RendalDashboard(), EquipmentItem, ReuseRequestItem, UnitKerjaDashboardContent(), NotFound() (+4 more)

### Community 13 - "inspeksi-berkala/page.tsx"
Cohesion: 0.18
Nodes (11): eq(), NOW, Equipment, InspectionItem, EquipmentLike, InspectionLike, inspectionQueue(), LastInspection (+3 more)

### Community 14 - "DESIGN.md — Idle Equipment Console"
Cohesion: 0.14
Nodes (13): Accessibility, Brand, Color System, Component Patterns, DESIGN.md — Idle Equipment Console, Elevation, Grid, Image Style (+5 more)

### Community 15 - "pemeliharaan/dashboard/page.tsx"
Cohesion: 0.15
Nodes (10): apiUrl, nextConfig, getEquipmentRepairs(), Equipment, PemeliharaanDashboardPage(), relativeTime(), Repair, STAGE_OWNER (+2 more)

### Community 16 - "Sistem Manajemen Idle Equipment PUSRI"
Cohesion: 0.15
Nodes (12): API Backend, Arsitektur, Autentikasi, Backend (`backend-idle/`), Cara Menjalankan, Catatan & Status Pengembangan, Frontend (`src/`), Model Data (Backend) (+4 more)

### Community 17 - "action/api.ts"
Cohesion: 0.05
Nodes (80): absoluteFileUrl(), approveRevalidationEquipment(), createDisposalRequest(), createEquipment(), createRevalidation(), getApprovals(), getAttachmentsByEquipmentId(), getConditions() (+72 more)

### Community 18 - "1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab"
Cohesion: 0.17
Nodes (11): 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab, 2. Alur Status & Siklus Hidup Aset (Asset Lifecycle), 3. Penyesuaian Formulir & Aturan Teknis Sistem, A. Parameter Informasi Aset (Pendaftaran Alat), A. Rendal Pemeliharaan (Planner & Coordinator), B. Form Inspeksi & Penomoran Pemeriksaan, B. Inspeksi Teknik - Instek (Validator & Auditor), C. Logika Validasi Kondisi & Kelayakan Aset (+3 more)

### Community 19 - "PRODUCT.md"
Cohesion: 0.17
Nodes (10): Anti-references, Brand voice, Constraints, Key messages, Missing facts, Primary job-to-be-done, Target audience, User-provided facts (+2 more)

### Community 20 - "RendalDashboard.tsx"
Cohesion: 0.20
Nodes (10): ChartSection(), RendalDashboard(), Activity, RecentActivities(), StatCard(), StatCardProps, ApiRow, InspectionRow (+2 more)

### Community 22 - "getReuseRequests"
Cohesion: 0.07
Nodes (31): approveDisposal(), DisposalItemDTO, getReuseRequests(), updateReuseRequestStatus(), DisposalItem, ManajerDisposalClient(), ManajerPeminjamanPage(), ManajerPeminjamanClient() (+23 more)

### Community 23 - "perbaikan-alat-client.tsx"
Cohesion: 0.27
Nodes (10): completeEquipmentRepair(), findLatestInspectionId(), PerbaikanAlatPage(), EMPTY_HINT, MaintenanceEquipment, PerbaikanAlatClient(), rupiah(), TABS (+2 more)

### Community 24 - "open-in-terminal/manifest.json"
Cohesion: 0.20
Nodes (9): author, authorUrl, description, fundingUrl, id, isDesktopOnly, minAppVersion, name (+1 more)

### Community 26 - "claude-code-ide/manifest.json"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 27 - "check-repair-payload.mjs"
Cohesion: 0.22
Nodes (8): api, body, fn, modal, page, pages, required, tabel

### Community 28 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 29 - "check-equipment-form.mjs"
Cohesion: 0.25
Nodes (7): api, appended, body, createFn, optional, page, required

### Community 32 - "ui-layouts-mcp"
Cohesion: 0.40
Nodes (4): npx, 21st, ui-layouts-mcp, @ui-layouts/mcp

### Community 35 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 36 - "generate-pdf.js"
Cohesion: 0.50
Nodes (3): doc, fs, PDFDocument

## Knowledge Gaps
- **256 isolated node(s):** `21st`, `npx`, `@ui-layouts/mcp`, `id`, `name` (+251 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UnitKerjaDashboard()` connect `equipment-status.ts` to `RendalDashboard.tsx`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `equipment-status.ts`, `pdfkit`, `shadcn`, `tw-animate-css`, `@base-ui/react`, `package.json`, `clsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `react` connect `equipment-status.ts` to `dependencies`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **What connects `21st`, `npx`, `@ui-layouts/mcp` to the rest of the system?**
  _256 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08579234972677596 - nodes in this community are weakly interconnected._
- **Should `open-in-terminal/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09565217391304348 - nodes in this community are weakly interconnected._
- **Should `shared.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09615384615384616 - nodes in this community are weakly interconnected._