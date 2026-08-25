# Graph Report - sistem-manajemrn-idle-pusri  (2026-08-26)

## Corpus Check
- 148 files · ~277,566 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 737 nodes · 1445 edges · 57 communities (50 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `490af278`
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
- riwayat-permintaan-client.tsx
- master.ts
- Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI
- approve-client.tsx
- statusName
- inspection-schedule.ts
- DESIGN.md — Idle Equipment Console
- apiUrl
- Sistem Manajemen Idle Equipment PUSRI
- peminjaman/page.tsx
- 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab
- PRODUCT.md
- revalidateApp
- revisi-validasi/page.tsx
- equipment-status.ts
- rendal/disposal/page.tsx
- open-in-terminal/manifest.json
- getObjectTypes
- claude-code-ide/manifest.json
- check-repair-payload.mjs
- ConfirmDialog.tsx
- check-equipment-form.mjs
- validasi-client.tsx
- claude-code-ide/main.js
- ui-layouts-mcp
- check-scrap-reason.mjs
- README.md
- generate-pdf.js
- This is NOT the Next.js you know
- getEquipments
- admin/equipment/page.tsx
- DeleteConfirmDialog.tsx
- action/api.ts
- eslint.config.mjs
- postcss.config.mjs
- check-inspection-validation-mapping.mjs
- SearchableSelect.tsx
- validasi/page.tsx
- rendal/validasi-ulang/page.tsx

## God Nodes (most connected - your core abstractions)
1. `getEquipments()` - 50 edges
2. `statusName()` - 29 edges
3. `getCurrentUserAction()` - 27 edges
4. `normalizeRole()` - 23 edges
5. `homePathForRole()` - 23 edges
6. `buttonVariants` - 22 edges
7. `revalidateApp()` - 21 edges
8. `getDisposals()` - 17 edges
9. `getObjectTypes()` - 17 edges
10. `getApprovals()` - 16 edges

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

## Communities (57 total, 7 thin omitted)

### Community 0 - "buttonVariants"
Cohesion: 0.07
Nodes (37): Error(), ManajerDashboardPage(), Equipment, PemeliharaanDashboardPage(), relativeTime(), Repair, STAGE_OWNER, STATUS_COLOR (+29 more)

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
Cohesion: 0.07
Nodes (28): @base-ui/react, class-variance-authority, clsx, lucide-react, next, nextjs-toploader, dependencies, @base-ui/react (+20 more)

### Community 6 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+17 more)

### Community 7 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 8 - "riwayat-permintaan-client.tsx"
Cohesion: 0.10
Nodes (23): approveDisposal(), DisposalItemDTO, DisposalItem, ManajerDisposalClient(), DisposalItem, ManajerScrapClient(), actionTypeConfig, AuditLogEntry (+15 more)

### Community 9 - "master.ts"
Cohesion: 0.21
Nodes (14): authHeaders(), createMasterItem(), deleteMasterItem(), fail(), getMasterItems(), MasterItem, resolve(), Result (+6 more)

### Community 10 - "Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI"
Cohesion: 0.22
Nodes (8): Aturan main (dari user, jangan dilanggar), Handoff — Lanjutan Audit & Cleanup Frontend Idle PUSRI, Konteks project (fakta penting), Konvensi yang sudah dibangun — WAJIB dipertahankan, SISA KERJA 1 — 6a-2: Konversi RSC halaman inbox besar, SISA KERJA 2 — 24 `<img>` modal preview foto, SISA KERJA 3 — Backend Go (`~/Documents/pusri`, repo terpisah), Verifikasi wajib tiap akhir langkah

### Community 11 - "approve-client.tsx"
Cohesion: 0.19
Nodes (17): getAttachmentsByEquipmentId(), getEquipmentById(), reviewApproval(), startReviewApproval(), APPROVAL_STATUS_LABEL, CONDITION_RESULT, formatRupiah(), Lookup (+9 more)

### Community 12 - "statusName"
Cohesion: 0.24
Nodes (9): getPlants(), InspeksiDashboardClient(), INCLUDED_STATUSES, ValidasiUlangPage(), RevalidasiItem, RequestAsset, APPROVAL_STATUS_LABEL, ManajerApprovePage() (+1 more)

### Community 13 - "inspection-schedule.ts"
Cohesion: 0.17
Nodes (12): eq(), NOW, Equipment, InspectionItem, InspeksiAntreanPage(), EquipmentLike, InspectionLike, inspectionQueue() (+4 more)

### Community 14 - "DESIGN.md — Idle Equipment Console"
Cohesion: 0.14
Nodes (13): Accessibility, Brand, Color System, Component Patterns, DESIGN.md — Idle Equipment Console, Elevation, Grid, Image Style (+5 more)

### Community 15 - "apiUrl"
Cohesion: 0.25
Nodes (6): apiUrl, nextConfig, createReuseRequest(), getEquipmentRepairs(), KatalogItemMinimal, RequestModalButton()

### Community 16 - "Sistem Manajemen Idle Equipment PUSRI"
Cohesion: 0.15
Nodes (12): API Backend, Arsitektur, Autentikasi, Backend (`backend-idle/`), Cara Menjalankan, Catatan & Status Pengembangan, Frontend (`src/`), Model Data (Backend) (+4 more)

### Community 17 - "peminjaman/page.tsx"
Cohesion: 0.39
Nodes (6): updateReuseRequestStatus(), ManajerPeminjamanPage(), ManajerPeminjamanClient(), ReuseRequest, ReuseRequestApi, reuseDisplayStatus

### Community 18 - "1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab"
Cohesion: 0.17
Nodes (11): 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab, 2. Alur Status & Siklus Hidup Aset (Asset Lifecycle), 3. Penyesuaian Formulir & Aturan Teknis Sistem, A. Parameter Informasi Aset (Pendaftaran Alat), A. Rendal Pemeliharaan (Planner & Coordinator), B. Form Inspeksi & Penomoran Pemeriksaan, B. Inspeksi Teknik - Instek (Validator & Auditor), C. Logika Validasi Kondisi & Kelayakan Aset (+3 more)

### Community 19 - "PRODUCT.md"
Cohesion: 0.17
Nodes (10): Anti-references, Brand voice, Constraints, Key messages, Missing facts, Primary job-to-be-done, Target audience, User-provided facts (+2 more)

### Community 20 - "revalidateApp"
Cohesion: 0.16
Nodes (12): createEquipment(), getEquipmentCodes(), updateEquipment(), uploadAttachment(), RevisiValidasiClient(), EMPTY_FORM, MasterOption, RegisterEquipmentClient() (+4 more)

### Community 21 - "revisi-validasi/page.tsx"
Cohesion: 0.21
Nodes (10): getConditions(), ASSET_STATES, assetState(), RevisiValidasiPage(), ApprovalState, Asset, AssetState, AnalogTimePicker() (+2 more)

### Community 22 - "equipment-status.ts"
Cohesion: 0.20
Nodes (12): AssetState, Equipment, RendalIdleClient(), toPhotoUrl(), assetState(), RendalIdlePage(), ALIASES, EQUIPMENT_STATUS (+4 more)

### Community 23 - "rendal/disposal/page.tsx"
Cohesion: 0.20
Nodes (12): createDisposalRequest(), getDisposalMethods(), DisposalItem, DisposalMethod, Equipment, Inspection, VerifikasiDisposalPage(), DisposalItem (+4 more)

### Community 24 - "open-in-terminal/manifest.json"
Cohesion: 0.20
Nodes (9): author, authorUrl, description, fundingUrl, id, isDesktopOnly, minAppVersion, name (+1 more)

### Community 25 - "getObjectTypes"
Cohesion: 0.39
Nodes (7): getFunctionalLocations(), getObjectTypes(), getStorageLocations(), AdminDashboardPage(), MODULES, RegisterEquipmentPage(), RegisterInitialData

### Community 26 - "claude-code-ide/manifest.json"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 27 - "check-repair-payload.mjs"
Cohesion: 0.22
Nodes (8): api, body, fn, modal, page, pages, required, tabel

### Community 28 - "ConfirmDialog.tsx"
Cohesion: 0.22
Nodes (8): createRevalidation(), submitInspectionData(), FormInspeksiClient(), InspeksiValidasiUlangClient(), ConfirmDialog(), ConfirmDialogProps, Tone, TONE_STYLES

### Community 29 - "check-equipment-form.mjs"
Cohesion: 0.25
Nodes (7): api, appended, body, createFn, optional, page, required

### Community 30 - "validasi-client.tsx"
Cohesion: 0.29
Nodes (12): flattenEquipmentCode(), getApprovalById(), getApprovals(), getInspections(), getValidations(), resubmitApproval(), validateEquipment(), ApprovalState (+4 more)

### Community 31 - "claude-code-ide/main.js"
Cohesion: 0.18
Nodes (16): b(), broadcastSelection(), D(), E(), I(), L(), N(), onload() (+8 more)

### Community 32 - "ui-layouts-mcp"
Cohesion: 0.40
Nodes (4): npx, 21st, ui-layouts-mcp, @ui-layouts/mcp

### Community 35 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 36 - "generate-pdf.js"
Cohesion: 0.50
Nodes (3): doc, fs, PDFDocument

### Community 38 - "getEquipments"
Cohesion: 0.16
Nodes (13): getEquipments(), getReuseRequests(), InspeksiDashboardPage(), EquipmentItem, DaftarAsetPage(), VISIBLE_STATUSES, ApiRow, EquipmentItem (+5 more)

### Community 39 - "admin/equipment/page.tsx"
Cohesion: 0.53
Nodes (5): deleteEquipment(), EquipmentManagementPage(), EquipmentRow, nameOf(), plantOf()

### Community 41 - "action/api.ts"
Cohesion: 0.27
Nodes (8): absoluteFileUrl(), completeEquipmentRepair(), findLatestInspectionId(), getDisposals(), ManajerDisposalPage(), ManajerScrapPage(), ApprovalKind, disposalDisplayStatus

### Community 56 - "validasi/page.tsx"
Cohesion: 0.29
Nodes (8): getRequireActions(), FormInspeksiPage(), ASSET_STATES, assetState(), normalizeLegacyStatus(), STATUS_BY_ID, ValidasiPage(), Asset

### Community 59 - "rendal/validasi-ulang/page.tsx"
Cohesion: 0.47
Nodes (4): approveRevalidationEquipment(), RendalValidasiUlangPage(), RendalValidasiUlangClient(), ValidasiUlangItem

## Knowledge Gaps
- **253 isolated node(s):** `21st`, `npx`, `@ui-layouts/mcp`, `id`, `name` (+248 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UnitKerjaDashboard()` connect `dependencies` to `buttonVariants`, `getEquipments`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `21st`, `npx`, `@ui-layouts/mcp` to the rest of the system?**
  _253 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `buttonVariants` be split into smaller, more focused modules?**
  _Cohesion score 0.06568832983927324 - nodes in this community are weakly interconnected._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08579234972677596 - nodes in this community are weakly interconnected._
- **Should `open-in-terminal/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09565217391304348 - nodes in this community are weakly interconnected._
- **Should `shared.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12873563218390804 - nodes in this community are weakly interconnected._