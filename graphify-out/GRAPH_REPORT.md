# Graph Report - sistem-manajemrn-idle-pusri  (2026-09-01)

## Corpus Check

- 153 files · ~284,247 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 762 nodes · 1528 edges · 53 communities (41 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `3e244455`
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
- riwayat-permintaan-client.tsx
- revalidateApp
- Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI
- package.json
- check-user-management.mjs
- inspection-schedule.ts
- DESIGN.md — Idle Equipment Console
- clsx
- Sistem Manajemen Idle Equipment PUSRI
- 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab
- PRODUCT.md
- tw-animate-css
- register-equipment-client.tsx
- getEquipments
- open-in-terminal/manifest.json
- react
- claude-code-ide/manifest.json
- check-repair-payload.mjs
- action/api.ts
- check-equipment-form.mjs
- AnalogTimePicker.tsx
- claude-code-ide/main.js
- ui-layouts-mcp
- check-scrap-reason.mjs
- README.md
- generate-pdf.js
- This is NOT the Next.js you know
- next
- DeleteConfirmDialog.tsx
- tailwind-merge
- eslint.config.mjs
- postcss.config.mjs
- check-inspection-validation-mapping.mjs
- SearchableSelect.tsx

## God Nodes (most connected - your core abstractions)

1. `getEquipments()` - 54 edges
2. `statusName()` - 31 edges
3. `revalidateApp()` - 26 edges
4. `getCurrentUserAction()` - 25 edges
5. `normalizeRole()` - 25 edges
6. `buttonVariants` - 23 edges
7. `homePathForRole()` - 23 edges
8. `getDisposals()` - 21 edges
9. `getApprovals()` - 20 edges
10. `getReuseRequests()` - 18 edges

## Surprising Connections (you probably didn't know these)

- `PemeliharaanDashboardPage()` --indirect_call--> `eq()`  [INFERRED]
  src/app/(authenticated-routes)/pemeliharaan/dashboard/page.tsx → scripts/check-inspection-schedule.mjs
- `getPageWindow()` --indirect_call--> `p()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/riwayat-permintaan/riwayat-permintaan-client.tsx → .obsidian/plugins/claude-code-ide/main.js
- `str()` --indirect_call--> `v()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/dashboard/page.tsx → .obsidian/plugins/claude-code-ide/main.js
- `completeEquipmentRepair()` --references--> `apiUrl`  [EXTRACTED]
  src/action/api.ts → next.config.ts
- `createReuseRequest()` --references--> `apiUrl`  [EXTRACTED]
  src/action/api.ts → next.config.ts

## Import Cycles

- None detected.

## Communities (53 total, 12 thin omitted)

### Community 0 - "equipment-status.ts"

Cohesion: 0.05
Nodes (54): completeEquipmentRepair(), findLatestInspectionId(), EquipmentManagementPage(), EquipmentRow, nameOf(), plantOf(), Error(), InspeksiDashboardClient() (+46 more)

### Community 1 - "auth.ts"

Cohesion: 0.09
Nodes (36): cookieConfig(), getCurrentUserAction(), login(), loginAction(), logoutAction(), ssoCallbackAction(), CallbackContent(), initialState (+28 more)

### Community 2 - "open-in-terminal/main.js"

Cohesion: 0.10
Nodes (28): __awaiter(), buildDefaultTerminalAppSetting(), buildLaunchCommand(), buildMacLaunch(), buildUnixLaunch(), buildWindowsLaunch(), DEFAULT_SETTINGS, defaultTerminalApp() (+20 more)

### Community 3 - "shared.tsx"

Cohesion: 0.11
Nodes (24): createReuseRequest(), DaftarAsetClient(), UnitKerjaIdleClient(), KatalogDetailPage(), KatalogItemMinimal, RequestModalButton(), EquipmentCard(), KatalogClient() (+16 more)

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

### Community 8 - "riwayat-permintaan-client.tsx"

Cohesion: 0.10
Nodes (23): approveDisposal(), DisposalItemDTO, DisposalItem, ManajerDisposalClient(), DisposalItem, ManajerScrapClient(), actionTypeConfig, AuditLogEntry (+15 more)

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

### Community 13 - "inspection-schedule.ts"

Cohesion: 0.17
Nodes (12): eq(), NOW, Equipment, InspectionItem, InspeksiAntreanPage(), EquipmentLike, InspectionLike, inspectionQueue() (+4 more)

### Community 14 - "DESIGN.md — Idle Equipment Console"

Cohesion: 0.14
Nodes (13): Accessibility, Brand, Color System, Component Patterns, DESIGN.md — Idle Equipment Console, Elevation, Grid, Image Style (+5 more)

### Community 16 - "Sistem Manajemen Idle Equipment PUSRI"

Cohesion: 0.15
Nodes (12): API Backend, Arsitektur, Autentikasi, Backend (`backend-idle/`), Cara Menjalankan, Catatan & Status Pengembangan, Frontend (`src/`), Model Data (Backend) (+4 more)

### Community 18 - "1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab"

Cohesion: 0.17
Nodes (11): 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab, 2. Alur Status & Siklus Hidup Aset (Asset Lifecycle), 3. Penyesuaian Formulir & Aturan Teknis Sistem, A. Parameter Informasi Aset (Pendaftaran Alat), A. Rendal Pemeliharaan (Planner & Coordinator), B. Form Inspeksi & Penomoran Pemeriksaan, B. Inspeksi Teknik - Instek (Validator & Auditor), C. Logika Validasi Kondisi & Kelayakan Aset (+3 more)

### Community 19 - "PRODUCT.md"

Cohesion: 0.17
Nodes (10): Anti-references, Brand voice, Constraints, Key messages, Missing facts, Primary job-to-be-done, Target audience, User-provided facts (+2 more)

### Community 22 - "register-equipment-client.tsx"

Cohesion: 0.15
Nodes (11): createEquipment(), updateEquipment(), uploadAttachment(), EMPTY_FORM, MasterEquipmentCode, MasterOption, RegisterEquipmentClient(), RegisterInitialData (+3 more)

### Community 23 - "getEquipments"

Cohesion: 0.07
Nodes (46): getConditions(), getEquipmentCodes(), getEquipmentRepairs(), getEquipments(), getFunctionalLocations(), getObjectTypes(), getRequireActions(), getReuseRequests() (+38 more)

### Community 24 - "open-in-terminal/manifest.json"

Cohesion: 0.20
Nodes (9): author, authorUrl, description, fundingUrl, id, isDesktopOnly, minAppVersion, name (+1 more)

### Community 25 - "react"

Cohesion: 0.67
Nodes (3): react, react, UnitKerjaDashboard()

### Community 26 - "claude-code-ide/manifest.json"

Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 27 - "check-repair-payload.mjs"

Cohesion: 0.22
Nodes (8): api, body, fn, modal, page, pages, required, tabel

### Community 28 - "action/api.ts"

Cohesion: 0.05
Nodes (68): apiUrl, nextConfig, absoluteFileUrl(), approveRevalidationEquipment(), createDisposalRequest(), createRevalidation(), EquipmentCodeRow, flattenEquipmentCode() (+60 more)

### Community 29 - "check-equipment-form.mjs"

Cohesion: 0.25
Nodes (7): api, appended, body, createFn, optional, page, required

### Community 31 - "claude-code-ide/main.js"

Cohesion: 0.16
Nodes (17): b(), broadcastSelection(), D(), E(), I(), L(), N(), onload() (+9 more)

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

- **257 isolated node(s):** `21st`, `npx`, `@ui-layouts/mcp`, `id`, `name` (+252 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:*

- **Why does `UnitKerjaDashboard()` connect `react` to `equipment-status.ts`, `getEquipments`?**
  *High betweenness centrality (0.083) - this node is a cross-community bridge.*
- **Why does `dependencies` connect `dependencies` to `next`, `tailwind-merge`, `package.json`, `clsx`, `tw-animate-css`, `react`?**
  *High betweenness centrality (0.082) - this node is a cross-community bridge.*
- **Why does `react` connect `react` to `dependencies`?**
  *High betweenness centrality (0.082) - this node is a cross-community bridge.*
- **What connects `21st`, `npx`, `@ui-layouts/mcp` to the rest of the system?**
  *257 weakly-connected nodes found - possible documentation gaps or missing edges.*
- **Should `equipment-status.ts` be split into smaller, more focused modules?**
  *Cohesion score 0.053313587560162905 - nodes in this community are weakly interconnected.*
- **Should `auth.ts` be split into smaller, more focused modules?**
  *Cohesion score 0.09134906231094979 - nodes in this community are weakly interconnected.*
- **Should `open-in-terminal/main.js` be split into smaller, more focused modules?**
  *Cohesion score 0.09565217391304348 - nodes in this community are weakly interconnected.*
