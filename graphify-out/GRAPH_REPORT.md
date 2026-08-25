# Graph Report - sistem-manajemrn-idle-pusri  (2026-08-25)

## Corpus Check
- 141 files · ~278,410 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 711 nodes · 1404 edges · 55 communities (43 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `22949b14`
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
- master.ts
- Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI
- approve-client.tsx
- buttonVariants
- inspeksi-berkala/page.tsx
- DESIGN.md — Idle Equipment Console
- next.config.ts
- Sistem Manajemen Idle Equipment PUSRI
- action/api.ts
- 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab
- PRODUCT.md
- validasi/page.tsx
- rendal/disposal/page.tsx
- riwayat-permintaan-client.tsx
- statusName
- open-in-terminal/manifest.json
- getEquipments
- claude-code-ide/manifest.json
- check-repair-payload.mjs
- package.json
- check-equipment-form.mjs
- daftar-aset/page.tsx
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
- class-variance-authority
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
- `str()` --indirect_call--> `v()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/dashboard/page.tsx → .obsidian/plugins/claude-code-ide/main.js
- `PemeliharaanDashboardPage()` --indirect_call--> `eq()`  [INFERRED]
  src/app/(authenticated-routes)/pemeliharaan/dashboard/page.tsx → scripts/check-inspection-schedule.mjs
- `getPageWindow()` --indirect_call--> `p()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/riwayat-permintaan/riwayat-permintaan-client.tsx → .obsidian/plugins/claude-code-ide/main.js
- `approveRevalidationEquipment()` --references--> `apiUrl`  [EXTRACTED]
  src/action/api.ts → next.config.ts
- `completeEquipmentRepair()` --references--> `apiUrl`  [EXTRACTED]
  src/action/api.ts → next.config.ts

## Import Cycles
- None detected.

## Communities (55 total, 12 thin omitted)

### Community 0 - "equipment-status.ts"
Cohesion: 0.21
Nodes (11): AssetState, Equipment, RendalIdleClient(), assetState(), RendalIdlePage(), ALIASES, EQUIPMENT_STATUS, REPAIR_FLOW (+3 more)

### Community 1 - "auth.ts"
Cohesion: 0.09
Nodes (39): cookieConfig(), getCurrentUserAction(), login(), loginAction(), logoutAction(), ssoCallbackAction(), CallbackContent(), initialState (+31 more)

### Community 2 - "open-in-terminal/main.js"
Cohesion: 0.10
Nodes (28): __awaiter(), buildDefaultTerminalAppSetting(), buildLaunchCommand(), buildMacLaunch(), buildUnixLaunch(), buildWindowsLaunch(), DEFAULT_SETTINGS, defaultTerminalApp() (+20 more)

### Community 3 - "shared.tsx"
Cohesion: 0.13
Nodes (19): KatalogDetailPage(), EquipmentCard(), KatalogClient(), uniq(), KatalogPage(), metadata, flat, nested (+11 more)

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

### Community 8 - "claude-code-ide/main.js"
Cohesion: 0.18
Nodes (16): b(), broadcastSelection(), D(), E(), I(), L(), N(), onload() (+8 more)

### Community 9 - "master.ts"
Cohesion: 0.21
Nodes (14): authHeaders(), createMasterItem(), deleteMasterItem(), fail(), getMasterItems(), MasterItem, resolve(), Result (+6 more)

### Community 10 - "Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI"
Cohesion: 0.22
Nodes (8): Aturan main (dari user, jangan dilanggar), Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI, Konteks project (fakta penting), Konvensi yang sudah dibangun — WAJIB dipertahankan, SISA KERJA 1 — 6a-2: Konversi RSC halaman inbox besar, SISA KERJA 2 — 24 `<img>` modal preview foto, SISA KERJA 3 — Backend Go (`~/Documents/pusri`, repo terpisah), Verifikasi wajib tiap akhir langkah

### Community 11 - "approve-client.tsx"
Cohesion: 0.18
Nodes (18): deleteEquipment(), getApprovalById(), getAttachmentsByEquipmentId(), getEquipmentById(), getValidations(), EquipmentManagementPage(), EquipmentRow, nameOf() (+10 more)

### Community 12 - "buttonVariants"
Cohesion: 0.06
Nodes (42): react, react, getEquipmentRepairs(), Error(), ManajerDashboardPage(), Equipment, PemeliharaanDashboardPage(), relativeTime() (+34 more)

### Community 13 - "inspeksi-berkala/page.tsx"
Cohesion: 0.17
Nodes (12): eq(), NOW, Equipment, InspectionItem, InspeksiAntreanPage(), EquipmentLike, InspectionLike, inspectionQueue() (+4 more)

### Community 14 - "DESIGN.md — Idle Equipment Console"
Cohesion: 0.14
Nodes (13): Accessibility, Brand, Color System, Component Patterns, DESIGN.md — Idle Equipment Console, Elevation, Grid, Image Style (+5 more)

### Community 16 - "Sistem Manajemen Idle Equipment PUSRI"
Cohesion: 0.15
Nodes (12): API Backend, Arsitektur, Autentikasi, Backend (`backend-idle/`), Cara Menjalankan, Catatan & Status Pengembangan, Frontend (`src/`), Model Data (Backend) (+4 more)

### Community 17 - "action/api.ts"
Cohesion: 0.06
Nodes (46): absoluteFileUrl(), approveRevalidationEquipment(), completeEquipmentRepair(), createEquipment(), createRevalidation(), findLatestInspectionId(), getDisposals(), getFunctionalLocations() (+38 more)

### Community 18 - "1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab"
Cohesion: 0.17
Nodes (11): 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab, 2. Alur Status & Siklus Hidup Aset (Asset Lifecycle), 3. Penyesuaian Formulir & Aturan Teknis Sistem, A. Parameter Informasi Aset (Pendaftaran Alat), A. Rendal Pemeliharaan (Planner & Coordinator), B. Form Inspeksi & Penomoran Pemeriksaan, B. Inspeksi Teknik - Instek (Validator & Auditor), C. Logika Validasi Kondisi & Kelayakan Aset (+3 more)

### Community 19 - "PRODUCT.md"
Cohesion: 0.17
Nodes (10): Anti-references, Brand voice, Constraints, Key messages, Missing facts, Primary job-to-be-done, Target audience, User-provided facts (+2 more)

### Community 20 - "validasi/page.tsx"
Cohesion: 0.17
Nodes (20): getApprovals(), getConditions(), getObjectTypes(), validateEquipment(), ApprovalState, Asset, AssetState, RevisiValidasiPage() (+12 more)

### Community 21 - "rendal/disposal/page.tsx"
Cohesion: 0.18
Nodes (15): apiUrl, createDisposalRequest(), getDisposalMethods(), getInspections(), DisposalItem, DisposalMethod, Equipment, Inspection (+7 more)

### Community 22 - "riwayat-permintaan-client.tsx"
Cohesion: 0.09
Nodes (25): approveDisposal(), DisposalItemDTO, DisposalItem, ManajerDisposalClient(), DisposalItem, ManajerScrapClient(), actionTypeConfig, AuditLogEntry (+17 more)

### Community 23 - "statusName"
Cohesion: 0.21
Nodes (11): getReuseRequests(), InspeksiDashboardClient(), ApiRow, EquipmentItem, ReuseRequestItem, str(), UnitKerjaDashboardPage(), EquipmentItem (+3 more)

### Community 24 - "open-in-terminal/manifest.json"
Cohesion: 0.20
Nodes (9): author, authorUrl, description, fundingUrl, id, isDesktopOnly, minAppVersion, name (+1 more)

### Community 25 - "getEquipments"
Cohesion: 0.31
Nodes (6): getEquipments(), InspeksiDashboardPage(), RequestAsset, APPROVAL_STATUS_LABEL, ManajerApprovePage(), RendalValidasiUlangPage()

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

### Community 30 - "daftar-aset/page.tsx"
Cohesion: 0.43
Nodes (4): createReuseRequest(), DaftarAsetPage(), EquipmentItem, VISIBLE_STATUSES

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
- **254 isolated node(s):** `21st`, `npx`, `@ui-layouts/mcp`, `id`, `name` (+249 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `pdfkit`, `shadcn`, `tw-animate-css`, `buttonVariants`, `class-variance-authority`, `package.json`, `clsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `react` connect `buttonVariants` to `dependencies`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **What connects `21st`, `npx`, `@ui-layouts/mcp` to the rest of the system?**
  _254 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08579234972677596 - nodes in this community are weakly interconnected._
- **Should `open-in-terminal/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09565217391304348 - nodes in this community are weakly interconnected._
- **Should `shared.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12873563218390804 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._