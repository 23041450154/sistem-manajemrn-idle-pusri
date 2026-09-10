# Graph Report - sistem-manajemrn-idle-pusri  (2026-09-09)

## Corpus Check

- 153 files · ~290,303 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 779 nodes · 1622 edges · 64 communities (49 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `2de10504`
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
- buttonVariants
- master.ts
- Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI
- package.json
- check-user-management.mjs
- inspeksi-berkala/page.tsx
- DESIGN.md — Idle Equipment Console
- users.ts
- Sistem Manajemen Idle Equipment PUSRI
- action/api.ts
- 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab
- PRODUCT.md
- ConfirmDialog.tsx
- tw-animate-css
- register-equipment-client.tsx
- getEquipments
- open-in-terminal/manifest.json
- validasi-client.tsx
- claude-code-ide/manifest.json
- check-repair-payload.mjs
- rendal/scrap/page.tsx
- check-equipment-form.mjs
- AnalogTimePicker.tsx
- claude-code-ide/main.js
- ui-layouts-mcp
- check-scrap-reason.mjs
- Sistem Manajemen Idle Equipment PUSRI
- generate-pdf.js
- This is NOT the Next.js you know
- approve-client.tsx
- peminjaman/page.tsx
- DeleteConfirmDialog.tsx
- scrap-client.tsx
- eslint.config.mjs
- postcss.config.mjs
- check-inspection-validation-mapping.mjs
- SearchableSelect.tsx
- getDisposals
- next.config.ts
- utils.ts
- lucide-react
- pdfkit
- recharts
- shadcn
- clsx

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

- `PemeliharaanDashboardPage()` --indirect_call--> `eq()`  [INFERRED]
  src/app/(authenticated-routes)/pemeliharaan/dashboard/page.tsx → scripts/check-inspection-schedule.mjs
- `getPageWindow()` --indirect_call--> `p()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/riwayat-permintaan/riwayat-permintaan-client.tsx → .obsidian/plugins/claude-code-ide/main.js
- `str()` --indirect_call--> `v()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/dashboard/page.tsx → .obsidian/plugins/claude-code-ide/main.js
- `createReuseRequest()` --references--> `apiUrl`  [EXTRACTED]
  src/action/api.ts → next.config.ts
- `getDisposalMethods()` --references--> `apiUrl`  [EXTRACTED]
  src/action/api.ts → next.config.ts

## Import Cycles

- None detected.

## Communities (64 total, 15 thin omitted)

### Community 0 - "equipment-status.ts"

Cohesion: 0.06
Nodes (50): createReuseRequest(), getAttachmentsByEquipmentId(), EquipmentManagementPage(), EquipmentRow, nameOf(), plantOf(), InspeksiDashboardClient(), formatRupiah() (+42 more)

### Community 1 - "auth.ts"

Cohesion: 0.13
Nodes (27): cookieConfig(), getCurrentUserAction(), login(), loginAction(), ssoCallbackAction(), CallbackContent(), initialState, LoginForm() (+19 more)

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
Nodes (15): @base-ui/react, class-variance-authority, next, nextjs-toploader, dependencies, @base-ui/react, class-variance-authority, next (+7 more)

### Community 6 - "devDependencies"

Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 7 - "components.json"

Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 8 - "buttonVariants"

Cohesion: 0.09
Nodes (27): Error(), Equipment, PemeliharaanDashboardPage(), relativeTime(), STAGE_OWNER, STATUS_COLOR, PerbaikanAlatPage(), EMPTY_HINT (+19 more)

### Community 9 - "master.ts"

Cohesion: 0.23
Nodes (14): authHeaders(), createMasterItem(), deleteMasterItem(), fail(), getMasterItems(), MasterItem, resolve(), Result (+6 more)

### Community 10 - "Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI"

Cohesion: 0.22
Nodes (8): Aturan main (dari user, jangan dilanggar), Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI, Konteks project (fakta penting), Konvensi yang sudah dibangun — WAJIB dipertahankan, SISA KERJA 1 — 6a-2: Konversi RSC halaman inbox besar, SISA KERJA 2 — 24 `<img>` modal preview foto, SISA KERJA 3 — Backend Go (`~/Documents/pusri`, repo terpisah), Verifikasi wajib tiap akhir langkah

### Community 11 - "package.json"

Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 12 - "check-user-management.mjs"

Cohesion: 0.50
Nodes (3): actions, page, sidebar

### Community 13 - "inspeksi-berkala/page.tsx"

Cohesion: 0.16
Nodes (13): eq(), NOW, Equipment, InspectionItem, InspeksiBerkalaClientProps, InspeksiAntreanPage(), EquipmentLike, InspectionLike (+5 more)

### Community 14 - "DESIGN.md — Idle Equipment Console"

Cohesion: 0.14
Nodes (13): Accessibility, Brand, Color System, Component Patterns, DESIGN.md — Idle Equipment Console, Elevation, Grid, Image Style (+5 more)

### Community 15 - "users.ts"

Cohesion: 0.19
Nodes (16): authHeaders(), createUser(), deleteUser(), failure(), getUsers(), ListResult, Result, updateUser() (+8 more)

### Community 16 - "Sistem Manajemen Idle Equipment PUSRI"

Cohesion: 0.15
Nodes (12): API Backend, Arsitektur, Autentikasi, Backend (`backend-idle/`), Cara Menjalankan, Catatan & Status Pengembangan, Frontend (`src/`), Model Data (Backend) (+4 more)

### Community 17 - "action/api.ts"

Cohesion: 0.27
Nodes (12): apiUrl, approveRevalidationEquipment(), completeEquipmentRepair(), createEquipment(), deleteEquipment(), EquipmentCodeRow, findLatestInspectionId(), reviseDisposalRequest() (+4 more)

### Community 18 - "1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab"

Cohesion: 0.17
Nodes (11): 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab, 2. Alur Status & Siklus Hidup Aset (Asset Lifecycle), 3. Penyesuaian Formulir & Aturan Teknis Sistem, A. Parameter Informasi Aset (Pendaftaran Alat), A. Rendal Pemeliharaan (Planner & Coordinator), B. Form Inspeksi & Penomoran Pemeriksaan, B. Inspeksi Teknik - Instek (Validator & Auditor), C. Logika Validasi Kondisi & Kelayakan Aset (+3 more)

### Community 19 - "PRODUCT.md"

Cohesion: 0.17
Nodes (10): Anti-references, Brand voice, Constraints, Key messages, Missing facts, Primary job-to-be-done, Target audience, User-provided facts (+2 more)

### Community 20 - "ConfirmDialog.tsx"

Cohesion: 0.21
Nodes (8): submitInspectionData(), FormInspeksiClient(), KatalogItemMinimal, RequestModalButton(), ConfirmDialog(), ConfirmDialogProps, Tone, TONE_STYLES

### Community 22 - "register-equipment-client.tsx"

Cohesion: 0.15
Nodes (11): getEquipmentCodes(), getFunctionalLocations(), getStorageLocations(), RegisterEquipmentPage(), EMPTY_FORM, MasterEquipmentCode, MasterOption, RegisterInitialData (+3 more)

### Community 23 - "getEquipments"

Cohesion: 0.07
Nodes (49): createRevalidation(), getApprovals(), getConditions(), getEquipmentRepairs(), getEquipments(), getFinancialMonthlyTrend(), getFinancialSummary(), getObjectTypes() (+41 more)

### Community 24 - "open-in-terminal/manifest.json"

Cohesion: 0.20
Nodes (9): author, authorUrl, description, fundingUrl, id, isDesktopOnly, minAppVersion, name (+1 more)

### Community 25 - "validasi-client.tsx"

Cohesion: 0.33
Nodes (9): flattenEquipmentCode(), getApprovalById(), getInspections(), resubmitApproval(), updateValidation(), validateEquipment(), ApprovalState, AssetState (+1 more)

### Community 26 - "claude-code-ide/manifest.json"

Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 27 - "check-repair-payload.mjs"

Cohesion: 0.22
Nodes (8): api, body, fn, modal, page, pages, required, tabel

### Community 28 - "rendal/scrap/page.tsx"

Cohesion: 0.22
Nodes (14): createDisposalRequest(), getDisposalMethods(), getValidations(), uploadAttachment(), DisposalItem, DisposalMethod, Equipment, Inspection (+6 more)

### Community 29 - "check-equipment-form.mjs"

Cohesion: 0.25
Nodes (7): api, appended, body, createFn, optional, page, required

### Community 31 - "claude-code-ide/main.js"

Cohesion: 0.16
Nodes (17): b(), broadcastSelection(), D(), E(), I(), L(), N(), onload() (+9 more)

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

Cohesion: 0.29
Nodes (9): getEquipmentById(), reviewApproval(), startReviewApproval(), APPROVAL_STATUS_LABEL, CONDITION_RESULT, formatRupiah(), Lookup, ManajerApproveClient() (+1 more)

### Community 39 - "peminjaman/page.tsx"

Cohesion: 0.29
Nodes (7): ManajerPeminjamanPage(), ManajerPeminjamanClient(), ReuseRequest, ReuseRequestApi, ApprovalKind, disposalDisplayStatus, reuseDisplayStatus

### Community 41 - "scrap-client.tsx"

Cohesion: 0.39
Nodes (7): approveDisposal(), DisposalItemDTO, DisposalItem, ManajerDisposalClient(), DisposalItem, ManajerScrapClient(), formatDate()

### Community 56 - "getDisposals"

Cohesion: 0.47
Nodes (4): absoluteFileUrl(), getDisposals(), ManajerDisposalPage(), ManajerScrapPage()

### Community 58 - "utils.ts"

Cohesion: 0.12
Nodes (22): logoutAction(), LogoutPage(), AuthenticatedLayout(), actionTypeConfig, AuditLogEntry, RendalLaporanClient(), geistMono, geistSans (+14 more)

## Knowledge Gaps

- **267 isolated node(s):** `21st`, `npx`, `@ui-layouts/mcp`, `id`, `name` (+262 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:*

- **Why does `UnitKerjaDashboard()` connect `equipment-status.ts` to `dependencies`?**
  *High betweenness centrality (0.082) - this node is a cross-community bridge.*
- **Why does `dependencies` connect `dependencies` to `package.json`, `tw-animate-css`, `lucide-react`, `pdfkit`, `recharts`, `shadcn`, `clsx`?**
  *High betweenness centrality (0.081) - this node is a cross-community bridge.*
- **Why does `react` connect `dependencies` to `equipment-status.ts`?**
  *High betweenness centrality (0.081) - this node is a cross-community bridge.*
- **What connects `21st`, `npx`, `@ui-layouts/mcp` to the rest of the system?**
  *267 weakly-connected nodes found - possible documentation gaps or missing edges.*
- **Should `equipment-status.ts` be split into smaller, more focused modules?**
  *Cohesion score 0.058385093167701865 - nodes in this community are weakly interconnected.*
- **Should `auth.ts` be split into smaller, more focused modules?**
  *Cohesion score 0.12790697674418605 - nodes in this community are weakly interconnected.*
- **Should `open-in-terminal/main.js` be split into smaller, more focused modules?**
  *Cohesion score 0.09565217391304348 - nodes in this community are weakly interconnected.*
