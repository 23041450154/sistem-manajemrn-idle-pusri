# Graph Report - sistem-manajemrn-idle-pusri  (2026-08-24)

## Corpus Check
- 126 files · ~279,357 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 688 nodes · 1267 edges · 43 communities (35 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b039ef79`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- getEquipments
- auth.ts
- open-in-terminal/main.js
- shared.tsx
- compilerOptions
- dependencies
- devDependencies
- components.json
- claude-code-ide/main.js
- master.ts
- ActionMenu.tsx
- inspeksi-berkala/page.tsx
- api.ts
- DESIGN.md — Idle Equipment Console
- Sistem Manajemen Idle Equipment PUSRI
- pemeliharaan/dashboard/page.tsx
- 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab
- PRODUCT.md
- buttonVariants
- open-in-terminal/manifest.json
- claude-code-ide/manifest.json
- check-repair-payload.mjs
- check-equipment-form.mjs
- ui-layouts-mcp
- check-scrap-reason.mjs
- README.md
- generate-pdf.js
- This is NOT the Next.js you know
- InspeksiDashboard.tsx
- DeleteConfirmDialog.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- check-inspection-validation-mapping.mjs

## God Nodes (most connected - your core abstractions)
1. `getEquipments()` - 51 edges
2. `getCurrentUserAction()` - 29 edges
3. `statusName()` - 24 edges
4. `normalizeRole()` - 23 edges
5. `buttonVariants` - 18 edges
6. `statusText()` - 18 edges
7. `statusBadgeStyle()` - 17 edges
8. `getObjectTypes()` - 16 edges
9. `ManajemenInspeksi()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `PemeliharaanDashboardPage()` --indirect_call--> `eq()`  [INFERRED]
  src/app/(authenticated-routes)/pemeliharaan/dashboard/page.tsx → scripts/check-inspection-schedule.mjs
- `getPageWindow()` --indirect_call--> `p()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/riwayat-permintaan/page.tsx → .obsidian/plugins/claude-code-ide/main.js
- `str()` --indirect_call--> `v()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/dashboard/page.tsx → .obsidian/plugins/claude-code-ide/main.js
- `UnitKerjaDashboard()` --references--> `react`  [EXTRACTED]
  src/components/Dashboards/UnitKerjaDashboard.tsx → package.json
- `RequestModalButton()` --calls--> `createReuseRequest()`  [EXTRACTED]
  src/app/(authenticated-routes)/unit-kerja/katalog/[id]/request-modal-button.tsx → src/action/api.ts

## Import Cycles
- None detected.

## Communities (43 total, 8 thin omitted)

### Community 0 - "getEquipments"
Cohesion: 0.07
Nodes (67): approveRevalidationEquipment(), createReuseRequest(), createRevalidation(), deleteEquipment(), getApprovalById(), getApprovals(), getAttachmentsByEquipmentId(), getConditions() (+59 more)

### Community 1 - "auth.ts"
Cohesion: 0.07
Nodes (38): cookieConfig(), login(), loginAction(), logoutAction(), ssoCallbackAction(), CallbackContent(), initialState, LoginForm() (+30 more)

### Community 2 - "open-in-terminal/main.js"
Cohesion: 0.10
Nodes (28): __awaiter(), buildDefaultTerminalAppSetting(), buildLaunchCommand(), buildMacLaunch(), buildUnixLaunch(), buildWindowsLaunch(), DEFAULT_SETTINGS, defaultTerminalApp() (+20 more)

### Community 3 - "shared.tsx"
Cohesion: 0.11
Nodes (22): getEquipmentById(), KatalogDetailPage(), KatalogItemMinimal, RequestModalButton(), EquipmentCard(), KatalogClient(), uniq(), KatalogPage() (+14 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (29): @base-ui/react, class-variance-authority, clsx, lucide-react, next, nextjs-toploader, dependencies, @base-ui/react (+21 more)

### Community 6 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+17 more)

### Community 7 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 8 - "claude-code-ide/main.js"
Cohesion: 0.16
Nodes (17): b(), broadcastSelection(), D(), E(), I(), L(), N(), onload() (+9 more)

### Community 9 - "master.ts"
Cohesion: 0.23
Nodes (14): authHeaders(), createMasterItem(), deleteMasterItem(), fail(), getMasterItems(), MasterItem, resolve(), Result (+6 more)

### Community 10 - "ActionMenu.tsx"
Cohesion: 0.18
Nodes (12): ActionMenu(), ActionMenuProps, CustomActionItem, Tooltip(), TooltipProps, UserContext, UserContextType, useUser() (+4 more)

### Community 11 - "inspeksi-berkala/page.tsx"
Cohesion: 0.17
Nodes (12): eq(), NOW, Equipment, InspectionItem, InspeksiAntreanPage(), EquipmentLike, InspectionLike, inspectionQueue() (+4 more)

### Community 12 - "api.ts"
Cohesion: 0.05
Nodes (46): absoluteFileUrl(), approveDisposal(), createDisposalRequest(), createEquipment(), createInspection(), DisposalItemDTO, getDisposalMethods(), getDisposals() (+38 more)

### Community 14 - "DESIGN.md — Idle Equipment Console"
Cohesion: 0.14
Nodes (13): Accessibility, Brand, Color System, Component Patterns, DESIGN.md — Idle Equipment Console, Elevation, Grid, Image Style (+5 more)

### Community 16 - "Sistem Manajemen Idle Equipment PUSRI"
Cohesion: 0.15
Nodes (12): API Backend, Arsitektur, Autentikasi, Backend (`backend-idle/`), Cara Menjalankan, Catatan & Status Pengembangan, Frontend (`src/`), Model Data (Backend) (+4 more)

### Community 17 - "pemeliharaan/dashboard/page.tsx"
Cohesion: 0.12
Nodes (18): completeEquipmentRepair(), findLatestInspectionId(), getEquipmentRepairs(), Equipment, PemeliharaanDashboardPage(), relativeTime(), Repair, STAGE_OWNER (+10 more)

### Community 18 - "1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab"
Cohesion: 0.17
Nodes (11): 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab, 2. Alur Status & Siklus Hidup Aset (Asset Lifecycle), 3. Penyesuaian Formulir & Aturan Teknis Sistem, A. Parameter Informasi Aset (Pendaftaran Alat), A. Rendal Pemeliharaan (Planner & Coordinator), B. Form Inspeksi & Penomoran Pemeriksaan, B. Inspeksi Teknik - Instek (Validator & Auditor), C. Logika Validasi Kondisi & Kelayakan Aset (+3 more)

### Community 19 - "PRODUCT.md"
Cohesion: 0.17
Nodes (10): Anti-references, Brand voice, Constraints, Key messages, Missing facts, Primary job-to-be-done, Target audience, User-provided facts (+2 more)

### Community 22 - "buttonVariants"
Cohesion: 0.06
Nodes (32): getReuseRequests(), ManajerDashboardPage(), RendalDashboard(), ApiRow, EquipmentItem, ReuseRequestItem, UnitKerjaDashboardPage(), formatDate() (+24 more)

### Community 24 - "open-in-terminal/manifest.json"
Cohesion: 0.20
Nodes (9): author, authorUrl, description, fundingUrl, id, isDesktopOnly, minAppVersion, name (+1 more)

### Community 26 - "claude-code-ide/manifest.json"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 27 - "check-repair-payload.mjs"
Cohesion: 0.22
Nodes (8): api, body, fn, modal, page, pages, required, tabel

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
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getEquipments()` connect `getEquipments` to `auth.ts`, `shared.tsx`, `dependencies`, `inspeksi-berkala/page.tsx`, `api.ts`, `pemeliharaan/dashboard/page.tsx`, `buttonVariants`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **What connects `21st`, `npx`, `@ui-layouts/mcp` to the rest of the system?**
  _256 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `getEquipments` be split into smaller, more focused modules?**
  _Cohesion score 0.07046070460704607 - nodes in this community are weakly interconnected._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07062146892655367 - nodes in this community are weakly interconnected._
- **Should `open-in-terminal/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09565217391304348 - nodes in this community are weakly interconnected._
- **Should `shared.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10873440285204991 - nodes in this community are weakly interconnected._