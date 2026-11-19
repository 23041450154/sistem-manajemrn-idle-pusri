# Graph Report - sistem-manajemrn-idle-pusri  (2026-09-25)

## Corpus Check
- 164 files · ~453,737 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 828 nodes · 1673 edges · 66 communities (47 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8830540`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- RendalDashboard.tsx
- auth.ts
- open-in-terminal/main.js
- approve-client.tsx
- compilerOptions
- dependencies
- devDependencies
- components.json
- inspection-schedule.ts
- revalidateApp
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
- UnitKerjaDashboard.tsx
- action/api.ts
- open-in-terminal/manifest.json
- equipment-status.ts
- claude-code-ide/manifest.json
- check-repair-payload.mjs
- buttonVariants
- check-equipment-form.mjs
- AnalogTimePicker.tsx
- claude-code-ide/main.js
- ui-layouts-mcp
- check-scrap-reason.mjs
- Sistem Manajemen Idle Equipment PUSRI
- generate-pdf.js
- This is NOT the Next.js you know
- pemeliharaan/dashboard/page.tsx
- register-equipment-client.tsx
- DeleteConfirmDialog.tsx
- perbaikan-alat-client.tsx
- eslint.config.mjs
- postcss.config.mjs
- check-inspection-validation-mapping.mjs
- SearchableSelect.tsx
- check-auth-clear.mjs
- getReuseRequests
- clear/route.ts
- class-variance-authority
- check-photo-url.mjs
- manajer-dashboard-client.tsx
- clsx
- pdfkit
- shadcn
- check-file-url.mjs

## God Nodes (most connected - your core abstractions)
1. `getEquipments()` - 59 edges
2. `statusName()` - 33 edges
3. `revalidateApp()` - 27 edges
4. `getCurrentUserAction()` - 25 edges
5. `normalizeRole()` - 25 edges
6. `getObjectTypes()` - 23 edges
7. `buttonVariants` - 23 edges
8. `homePathForRole()` - 23 edges
9. `getDisposals()` - 21 edges
10. `getApprovals()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `PemeliharaanDashboardPage()` --indirect_call--> `eq()`  [INFERRED]
  src/app/(authenticated-routes)/pemeliharaan/dashboard/page.tsx → scripts/check-inspection-schedule.mjs
- `str()` --indirect_call--> `v()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/dashboard/page.tsx → .obsidian/plugins/claude-code-ide/main.js
- `getPageWindow()` --indirect_call--> `p()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/riwayat-permintaan/riwayat-permintaan-client.tsx → .obsidian/plugins/claude-code-ide/main.js
- `approveRevalidationEquipment()` --references--> `apiUrl`  [EXTRACTED]
  src/action/api.ts → next.config.ts
- `completeEquipmentRepair()` --references--> `apiUrl`  [EXTRACTED]
  src/action/api.ts → next.config.ts

## Import Cycles
- None detected.

## Communities (66 total, 19 thin omitted)

### Community 0 - "RendalDashboard.tsx"
Cohesion: 0.16
Nodes (12): ChartSection(), CostAvoidanceSection(), Equipment, RendalDashboard(), Activity, RecentActivities(), StatCard(), StatCardProps (+4 more)

### Community 1 - "auth.ts"
Cohesion: 0.08
Nodes (40): cookieConfig(), getCurrentUserAction(), login(), loginAction(), logoutAction(), ssoCallbackAction(), CallbackContent(), initialState (+32 more)

### Community 2 - "open-in-terminal/main.js"
Cohesion: 0.10
Nodes (28): __awaiter(), buildDefaultTerminalAppSetting(), buildLaunchCommand(), buildMacLaunch(), buildUnixLaunch(), buildWindowsLaunch(), DEFAULT_SETTINGS, defaultTerminalApp() (+20 more)

### Community 3 - "approve-client.tsx"
Cohesion: 0.06
Nodes (46): createReuseRequest(), getAttachmentsByEquipmentId(), getEquipmentById(), reviewApproval(), startReviewApproval(), EquipmentManagementPage(), EquipmentRow, nameOf() (+38 more)

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

### Community 8 - "inspection-schedule.ts"
Cohesion: 0.15
Nodes (12): eq(), NOW, Equipment, InspectionItem, InspeksiBerkalaClientProps, EquipmentLike, InspectionLike, inspectionQueue() (+4 more)

### Community 9 - "revalidateApp"
Cohesion: 0.06
Nodes (49): approveRevalidationEquipment(), deleteEquipment(), resubmitApproval(), submitInspectionData(), updateValidation(), validateEquipment(), authHeaders(), createMasterItem() (+41 more)

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
Cohesion: 0.13
Nodes (14): Accessibility, Brand, Color System, Component Patterns, DESIGN.md — Idle Equipment Console, Elevation, Grid, Image Style (+6 more)

### Community 16 - "Sistem Manajemen Idle Equipment PUSRI"
Cohesion: 0.15
Nodes (12): API Backend, Arsitektur, Autentikasi, Backend (`backend-idle/`), Cara Menjalankan, Catatan & Status Pengembangan, Frontend (`src/`), Model Data (Backend) (+4 more)

### Community 18 - "1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab"
Cohesion: 0.17
Nodes (11): 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab, 2. Alur Status & Siklus Hidup Aset (Asset Lifecycle), 3. Penyesuaian Formulir & Aturan Teknis Sistem, A. Parameter Informasi Aset (Pendaftaran Alat), A. Rendal Pemeliharaan (Planner & Coordinator), B. Form Inspeksi & Penomoran Pemeriksaan, B. Inspeksi Teknik - Instek (Validator & Auditor), C. Logika Validasi Kondisi & Kelayakan Aset (+3 more)

### Community 19 - "PRODUCT.md"
Cohesion: 0.17
Nodes (10): Anti-references, Brand voice, Constraints, Key messages, Missing facts, Primary job-to-be-done, Target audience, User-provided facts (+2 more)

### Community 20 - "permissions.ts"
Cohesion: 0.40
Nodes (3): Permission, PERMS, ROLE_PERMISSIONS

### Community 22 - "UnitKerjaDashboard.tsx"
Cohesion: 0.40
Nodes (4): react, react, ApiRow, UnitKerjaDashboard()

### Community 23 - "action/api.ts"
Cohesion: 0.07
Nodes (70): createDisposalRequest(), createRevalidation(), EquipmentCodeRow, flattenEquipmentCode(), getApprovals(), getConditions(), getDisposalMethods(), getDisposals() (+62 more)

### Community 24 - "open-in-terminal/manifest.json"
Cohesion: 0.20
Nodes (9): author, authorUrl, description, fundingUrl, id, isDesktopOnly, minAppVersion, name (+1 more)

### Community 25 - "equipment-status.ts"
Cohesion: 0.17
Nodes (14): AssetState, Equipment, RendalIdleClient(), RendalIdleClientProps, toPhotoUrl(), assetState(), ALIASES, EQUIPMENT_STATUS (+6 more)

### Community 26 - "claude-code-ide/manifest.json"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 27 - "check-repair-payload.mjs"
Cohesion: 0.22
Nodes (8): api, body, fn, modal, page, pages, required, tabel

### Community 28 - "buttonVariants"
Cohesion: 0.27
Nodes (8): Error(), InspeksiDashboardClient(), EquipmentItem, ReuseRequestItem, UnitKerjaDashboardContent(), NotFound(), Button(), buttonVariants

### Community 29 - "check-equipment-form.mjs"
Cohesion: 0.25
Nodes (7): api, appended, body, createFn, optional, page, required

### Community 31 - "claude-code-ide/main.js"
Cohesion: 0.17
Nodes (16): b(), broadcastSelection(), D(), E(), I(), L(), N(), onload() (+8 more)

### Community 32 - "ui-layouts-mcp"
Cohesion: 0.40
Nodes (4): npx, 21st, ui-layouts-mcp, @ui-layouts/mcp

### Community 35 - "Sistem Manajemen Idle Equipment PUSRI"
Cohesion: 0.22
Nodes (8): Fitur, Lisensi, Menjalankan Secara Lokal, Peran Pengguna (Role), Prasyarat, Sistem Manajemen Idle Equipment PUSRI, Skrip, Struktur Direktori

### Community 36 - "generate-pdf.js"
Cohesion: 0.50
Nodes (3): doc, fs, PDFDocument

### Community 38 - "pemeliharaan/dashboard/page.tsx"
Cohesion: 0.29
Nodes (6): Equipment, PemeliharaanDashboardPage(), relativeTime(), STAGE_OWNER, STATUS_COLOR, REPAIR_STATUS_LABEL

### Community 39 - "register-equipment-client.tsx"
Cohesion: 0.15
Nodes (10): createEquipment(), updateEquipment(), EMPTY_FORM, MasterEquipmentCode, MasterOption, RegisterEquipmentClient(), RegisterInitialData, AutocompleteInputProps (+2 more)

### Community 41 - "perbaikan-alat-client.tsx"
Cohesion: 0.26
Nodes (11): completeEquipmentRepair(), findLatestInspectionId(), PerbaikanAlatPage(), EMPTY_HINT, extractPhotoUrls(), MaintenanceEquipment, PerbaikanAlatClient(), rupiah() (+3 more)

### Community 57 - "getReuseRequests"
Cohesion: 0.06
Nodes (42): apiUrl, basePath, nextConfig, p(), approveDisposal(), DisposalItemDTO, getApprovalById(), getEquipmentRepairs() (+34 more)

### Community 61 - "manajer-dashboard-client.tsx"
Cohesion: 0.67
Nodes (3): formatRupiah(), ManajerDashboardClient(), ManajerDashboardClientProps

## Knowledge Gaps
- **285 isolated node(s):** `21st`, `npx`, `@ui-layouts/mcp`, `id`, `name` (+280 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UnitKerjaDashboard()` connect `UnitKerjaDashboard.tsx` to `RendalDashboard.tsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `react` connect `UnitKerjaDashboard.tsx` to `dependencies`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `shadcn`, `package.json`, `tw-animate-css`, `UnitKerjaDashboard.tsx`, `class-variance-authority`, `clsx`, `pdfkit`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `21st`, `npx`, `@ui-layouts/mcp` to the rest of the system?**
  _285 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08408249603384453 - nodes in this community are weakly interconnected._
- **Should `open-in-terminal/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09565217391304348 - nodes in this community are weakly interconnected._
- **Should `approve-client.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06398809523809523 - nodes in this community are weakly interconnected._