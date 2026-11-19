# Graph Report - sistem-manajemrn-idle-pusri  (2026-09-25)

## Corpus Check
- 161 files · ~452,976 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 819 nodes · 1660 edges · 60 communities (44 shown, 16 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8830540`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- buttonVariants
- auth.ts
- open-in-terminal/main.js
- shared.tsx
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
- react
- getEquipments
- open-in-terminal/manifest.json
- next
- claude-code-ide/manifest.json
- check-repair-payload.mjs
- rendal/validasi-ulang/validasi-ulang-client.tsx
- check-equipment-form.mjs
- AnalogTimePicker.tsx
- claude-code-ide/main.js
- ui-layouts-mcp
- check-scrap-reason.mjs
- Sistem Manajemen Idle Equipment PUSRI
- generate-pdf.js
- This is NOT the Next.js you know
- tailwind-merge
- action/api.ts
- DeleteConfirmDialog.tsx
- perbaikan-alat-client.tsx
- eslint.config.mjs
- postcss.config.mjs
- check-inspection-validation-mapping.mjs
- SearchableSelect.tsx
- check-auth-clear.mjs
- NotificationDropdown.tsx
- clear/route.ts
- class-variance-authority

## God Nodes (most connected - your core abstractions)
1. `getEquipments()` - 58 edges
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
- `str()` --indirect_call--> `v()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/dashboard/page.tsx → .obsidian/plugins/claude-code-ide/main.js
- `PemeliharaanDashboardPage()` --indirect_call--> `eq()`  [INFERRED]
  src/app/(authenticated-routes)/pemeliharaan/dashboard/page.tsx → scripts/check-inspection-schedule.mjs
- `getPageWindow()` --indirect_call--> `p()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/riwayat-permintaan/riwayat-permintaan-client.tsx → .obsidian/plugins/claude-code-ide/main.js
- `completeEquipmentRepair()` --references--> `apiUrl`  [EXTRACTED]
  src/action/api.ts → next.config.ts
- `createReuseRequest()` --references--> `apiUrl`  [EXTRACTED]
  src/action/api.ts → next.config.ts

## Import Cycles
- None detected.

## Communities (60 total, 16 thin omitted)

### Community 0 - "buttonVariants"
Cohesion: 0.09
Nodes (26): getFinancialMonthlyTrend(), getFinancialSummary(), Error(), InspeksiDashboardClient(), formatRupiah(), ManajerDashboardClient(), ManajerDashboardClientProps, ManajerDashboardPage() (+18 more)

### Community 1 - "auth.ts"
Cohesion: 0.08
Nodes (40): cookieConfig(), getCurrentUserAction(), login(), loginAction(), logoutAction(), ssoCallbackAction(), CallbackContent(), initialState (+32 more)

### Community 2 - "open-in-terminal/main.js"
Cohesion: 0.10
Nodes (28): __awaiter(), buildDefaultTerminalAppSetting(), buildLaunchCommand(), buildMacLaunch(), buildUnixLaunch(), buildWindowsLaunch(), DEFAULT_SETTINGS, defaultTerminalApp() (+20 more)

### Community 3 - "shared.tsx"
Cohesion: 0.08
Nodes (35): createReuseRequest(), EquipmentManagementPage(), EquipmentRow, nameOf(), plantOf(), StatusBadge(), RendalDashboardClient(), RendalDashboardClientProps (+27 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): @base-ui/react, clsx, lucide-react, nextjs-toploader, dependencies, @base-ui/react, clsx, lucide-react (+9 more)

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
Cohesion: 0.10
Nodes (32): deleteEquipment(), authHeaders(), createMasterItem(), deleteMasterItem(), fail(), getMasterItems(), MasterItem, resolve() (+24 more)

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

### Community 22 - "react"
Cohesion: 0.67
Nodes (3): react, react, UnitKerjaDashboard()

### Community 23 - "getEquipments"
Cohesion: 0.06
Nodes (63): createRevalidation(), getConditions(), getEquipments(), getFunctionalLocations(), getObjectTypes(), getPlants(), getRequireActions(), getReuseRequests() (+55 more)

### Community 24 - "open-in-terminal/manifest.json"
Cohesion: 0.20
Nodes (9): author, authorUrl, description, fundingUrl, id, isDesktopOnly, minAppVersion, name (+1 more)

### Community 26 - "claude-code-ide/manifest.json"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 27 - "check-repair-payload.mjs"
Cohesion: 0.22
Nodes (8): api, body, fn, modal, page, pages, required, tabel

### Community 28 - "rendal/validasi-ulang/validasi-ulang-client.tsx"
Cohesion: 0.14
Nodes (13): apiUrl, basePath, nextConfig, approveRevalidationEquipment(), updateReuseRequestStatus(), ManajerPeminjamanPage(), ManajerPeminjamanClient(), ReuseRequest (+5 more)

### Community 29 - "check-equipment-form.mjs"
Cohesion: 0.25
Nodes (7): api, appended, body, createFn, optional, page, required

### Community 31 - "claude-code-ide/main.js"
Cohesion: 0.18
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

### Community 39 - "action/api.ts"
Cohesion: 0.05
Nodes (64): absoluteFileUrl(), createDisposalRequest(), createEquipment(), EquipmentCodeRow, flattenEquipmentCode(), getApprovalById(), getApprovals(), getAttachmentsByEquipmentId() (+56 more)

### Community 41 - "perbaikan-alat-client.tsx"
Cohesion: 0.26
Nodes (11): completeEquipmentRepair(), findLatestInspectionId(), PerbaikanAlatPage(), EMPTY_HINT, extractPhotoUrls(), MaintenanceEquipment, PerbaikanAlatClient(), rupiah() (+3 more)

### Community 57 - "NotificationDropdown.tsx"
Cohesion: 0.09
Nodes (26): approveDisposal(), DisposalItemDTO, getEquipmentRepairs(), DisposalItem, ManajerDisposalClient(), DisposalItem, ManajerScrapClient(), actionTypeConfig (+18 more)

## Knowledge Gaps
- **282 isolated node(s):** `21st`, `npx`, `@ui-layouts/mcp`, `id`, `name` (+277 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UnitKerjaDashboard()` connect `react` to `buttonVariants`, `getEquipments`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `dependencies`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `tailwind-merge`, `package.json`, `tw-animate-css`, `react`, `next`, `class-variance-authority`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `21st`, `npx`, `@ui-layouts/mcp` to the rest of the system?**
  _282 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `buttonVariants` be split into smaller, more focused modules?**
  _Cohesion score 0.08771929824561403 - nodes in this community are weakly interconnected._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08499743983614952 - nodes in this community are weakly interconnected._
- **Should `open-in-terminal/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09565217391304348 - nodes in this community are weakly interconnected._