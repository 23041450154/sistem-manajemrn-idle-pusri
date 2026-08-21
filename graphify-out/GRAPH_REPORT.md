# Graph Report - fe  (2026-08-21)

## Corpus Check
- 134 files · ~280,535 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 760 nodes · 1223 edges · 80 communities (58 shown, 22 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `be003dd1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ManajemenInspeksi.tsx
- auth.ts
- open-in-terminal/main.js
- dependencies
- compilerOptions
- devDependencies
- shared.tsx
- claude-code-ide/main.js
- RendalDashboard.tsx
- ActionMenu.tsx
- master.ts
- DESIGN.md — Idle Equipment Console
- Detail Informasi Aset Drawer
- Frontend Next.js Architecture
- Dashboard Inspeksi Teknik Interface
- Dashboard Rendal View UI
- Dashboard Unit Kerja Overview UI
- Dashboard Inspeksi UI Layout
- Data Hasil Inspeksi Form Component
- Registrasi Idle Equipment Form UI
- Pusat Data Aset Dashboard
- Asset Detail Information Modal UI
- Detail Informasi Aset Side Panel
- Mobile Login Screen UI Reference
- Inspection Validation Table UI
- generate-pdf.js
- disposals/route.ts
- InspeksiDashboard.tsx
- Celest Ruyi Boom Mic IEM Cable Product Image
- Authentication and Authorization System
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- Background Left Panel Image
- PUSRI Palembang Brand & Corporate Identity
- PUSRI Logo Asset
- components.json
- approve/page.tsx
- getObjectTypes
- Inspection Photo Attachment (Pixel Art Anime Avatar)
- 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab
- File Document Icon
- Globe Icon SVG
- Application Icon
- PUSRI Palembang Logo
- PUSRI Palembang Logo Background
- Next.js Logo SVG
- Vercel Logo
- Window Icon SVG
- api.ts
- getDisposals
- register-equipment/page.tsx
- PRODUCT.md
- open-in-terminal/manifest.json
- check-equipment-form.mjs
- getEquipments
- ui-layouts-mcp
- check-repair-payload.mjs
- claude-code-ide/manifest.json
- pemeliharaan/dashboard/page.tsx
- DetailEquipmentDialog.tsx
- check-inspection-validation-mapping.mjs
- validasi/page.tsx
- inspeksi-berkala/page.tsx
- DeleteConfirmDialog.tsx
- check-scrap-reason.mjs

## God Nodes (most connected - your core abstractions)
1. `getEquipments()` - 51 edges
2. `getCurrentUserAction()` - 27 edges
3. `normalizeRole()` - 21 edges
4. `getObjectTypes()` - 18 edges
5. `getApprovals()` - 16 edges
6. `getAttachmentsByEquipmentId()` - 16 edges
7. `compilerOptions` - 16 edges
8. `OpenInTerminalPlugin` - 15 edges
9. `getDisposals()` - 15 edges
10. `getInspections()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Laporan Inspeksi P101 Document` --conceptually_related_to--> `Sistem Manajemen Idle Equipment PUSRI`  [INFERRED]
  public/laporan_inspeksi_P101.pdf → Dokumentasi Aplikasi.md
- `Next.js Getting Started Guide` --semantically_similar_to--> `Frontend Next.js Architecture`  [INFERRED] [semantically similar]
  README.md → Dokumentasi Aplikasi.md
- `str()` --indirect_call--> `v()`  [INFERRED]
  src/app/(authenticated-routes)/unit-kerja/dashboard/page.tsx → .obsidian/plugins/claude-code-ide/main.js
- `PemeliharaanDashboardPage()` --indirect_call--> `eq()`  [INFERRED]
  src/app/(authenticated-routes)/pemeliharaan/dashboard/page.tsx → scripts/check-inspection-schedule.mjs
- `UnitKerjaDashboard()` --references--> `react`  [EXTRACTED]
  src/components/Dashboards/UnitKerjaDashboard.tsx → package.json

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pusri Idle Equipment System Architecture** — dokumentasi_aplikasi_sistem_manajemen_idle_equipment, dokumentasi_aplikasi_frontend_architecture, dokumentasi_aplikasi_backend_architecture [EXTRACTED 1.00]
- **Technical Inspection UI Form Flow** — public_formulir_inspeksi_pt_pusri_detail_aset_card, public_formulir_inspeksi_pt_pusri_data_hasil_inspeksi_form, public_formulir_inspeksi_pt_pusri_upload_foto_kondisi [EXTRACTED 1.00]
- **Registrasi Idle Equipment Form Structure** — public_registrasi_idle_equipment___pt_pusri_informasi_peralatan, public_registrasi_idle_equipment___pt_pusri_detail_lokasi, public_registrasi_idle_equipment___pt_pusri_alasan_idle, public_registrasi_idle_equipment___pt_pusri_upload_foto [EXTRACTED 1.00]
- **Rendal Dashboard UI Components** — public_dashboard_rendal_kpi_cards, public_dashboard_rendal_trend_chart, public_dashboard_rendal_status_distribution_chart, public_dashboard_rendal_upcoming_inspections_table, public_dashboard_rendal_recent_activity_feed [EXTRACTED 1.00]
- **Alur Manajemen Inspeksi Aset Idle** — public_dashboard_inspeksi_jadwal_inspeksi_stats, public_dashboard_inspeksi_daftar_inspeksi_table, public_dashboard_inspeksi_jadwalkan_inspeksi_action [EXTRACTED 1.00]
- **Dashboard Unit Kerja Operational Monitoring View** — public_dashboard_unit_kerja_kpi_summary_cards, public_dashboard_unit_kerja_status_pemanfaatan_chart, public_dashboard_unit_kerja_distribusi_lokasi_chart, public_dashboard_unit_kerja_recent_requests_table, public_dashboard_unit_kerja_maintenance_schedule_panel [EXTRACTED 1.00]
- **Dashboard Inspeksi Overview Layout** — public_dashboardinspeksi_ui, public_dashboardinspeksi_asset_health_index, public_dashboardinspeksi_status_chart, public_dashboardinspeksi_high_priority_log, public_dashboardinspeksi_active_critical_findings, public_dashboardinspeksi_upcoming_schedule [EXTRACTED 1.00]
- **Pusat Data Aset Management UI Components** — public_image_pusat_data_aset, public_image_asset_request_table, public_image_asset_filter_bar [EXTRACTED 1.00]
- **Technical Inspection Validation Asset Detail Flow** — public_refrensi_detail_informasi_aset_validasi_inspeksi_teknik_page, public_refrensi_detail_informasi_aset_detail_spesifikasi_alat, public_refrensi_detail_informasi_aset_lampiran_gambar_dokumen [EXTRACTED 1.00]
- **Authentication Methods on Mobile Login Screen** — public_refrensi_image_login_screen, public_refrensi_image_npp_login, public_refrensi_image_sso_authentication [EXTRACTED 1.00]
- **Asset Management Review UI Components** — public_refrensi_image1_asset_detail_modal, public_refrensi_image1_control_valve_v202, public_refrensi_image1_asset_review_workflow, public_refrensi_image1_asset_attachments [EXTRACTED 1.00]
- **Asset Validation and Approval UI Flow** — public_refrensi_image2_pusat_data_aset_table, public_refrensi_image2_detail_informasi_aset_drawer, public_refrensi_image2_konfirmasi_persetujuan_aset_modal [EXTRACTED 1.00]
- **Asset Validation and Revision Workflow** — public_refrensi_image3_pusat_data_aset_dashboard, public_refrensi_image3_detail_informasi_aset_panel, public_refrensi_image3_minta_revisi_validasi_modal [INFERRED 0.85]
- **Inspection Validation Management System UI Workflow** — public_validasiinspeksi_ui_table, public_validasiinspeksi_asset_status_flow, public_validasiinspeksi_approval_status_flow, public_validasiinspeksi_validation_actions [EXTRACTED 1.00]

## Communities (80 total, 22 thin omitted)

### Community 0 - "ManajemenInspeksi.tsx"
Cohesion: 0.17
Nodes (15): getAttachmentsByEquipmentId(), uploadEquipmentAttachment(), uploadEquipmentAttachmentBase64(), validateEquipment(), GET(), ApprovalState, Asset, AssetState (+7 more)

### Community 1 - "auth.ts"
Cohesion: 0.09
Nodes (37): cookieConfig(), getCurrentUserAction(), login(), loginAction(), logoutAction(), initialState, LoginForm(), LogoutPage() (+29 more)

### Community 2 - "open-in-terminal/main.js"
Cohesion: 0.10
Nodes (28): __awaiter(), buildDefaultTerminalAppSetting(), buildLaunchCommand(), buildMacLaunch(), buildUnixLaunch(), buildWindowsLaunch(), DEFAULT_SETTINGS, defaultTerminalApp() (+20 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (35): @base-ui/react, class-variance-authority, clsx, lucide-react, next, nextjs-toploader, dependencies, @base-ui/react (+27 more)

### Community 4 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 5 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+17 more)

### Community 6 - "shared.tsx"
Cohesion: 0.13
Nodes (20): Gallery(), KatalogDetailPage(), EquipmentCard(), KatalogClient(), uniq(), KatalogPage(), metadata, flat (+12 more)

### Community 7 - "claude-code-ide/main.js"
Cohesion: 0.16
Nodes (17): b(), broadcastSelection(), D(), E(), I(), L(), N(), onload() (+9 more)

### Community 8 - "RendalDashboard.tsx"
Cohesion: 0.25
Nodes (6): ChartSection(), RendalDashboard(), RecentActivities(), StatCard(), StatCardProps, UpcomingInspections()

### Community 9 - "ActionMenu.tsx"
Cohesion: 0.10
Nodes (21): geistMono, geistSans, metadata, plexMono, plexSans, RootLayout(), ActionMenu(), ActionMenuProps (+13 more)

### Community 10 - "master.ts"
Cohesion: 0.23
Nodes (14): authHeaders(), createMasterItem(), deleteMasterItem(), fail(), getMasterItems(), MasterItem, resolve(), Result (+6 more)

### Community 11 - "DESIGN.md — Idle Equipment Console"
Cohesion: 0.14
Nodes (13): Accessibility, Brand, Color System, Component Patterns, DESIGN.md — Idle Equipment Console, Elevation, Grid, Image Style (+5 more)

### Community 12 - "Detail Informasi Aset Drawer"
Cohesion: 0.31
Nodes (9): Detail Spesifikasi Alat Section, Lampiran Gambar dan Dokumen Section, Validasi Inspeksi Teknik Page, Detail Informasi Aset Drawer, Asset Approval Changes Status to IDLE, image2.png UI Reference, Konfirmasi Persetujuan Aset Modal, Pusat Data Aset Table View (+1 more)

### Community 13 - "Frontend Next.js Architecture"
Cohesion: 0.29
Nodes (7): Next.js Breaking Changes Rules, Agents MD Reference, Backend Go Gin Architecture, Frontend Next.js Architecture, Sistem Manajemen Idle Equipment PUSRI, Laporan Inspeksi P101 Document, Next.js Getting Started Guide

### Community 14 - "Dashboard Inspeksi Teknik Interface"
Cohesion: 0.38
Nodes (7): Tabel Daftar Inspeksi Teknik, Filter dan Pencarian Inspeksi, Statistik Jadwal Inspeksi, Penjadwalan Inspeksi Baru, Panduan Inspeksi dan SOP, Status Kesehatan Aset Idle, Dashboard Inspeksi Teknik Interface

### Community 15 - "Dashboard Rendal View UI"
Cohesion: 0.33
Nodes (7): Dashboard Rendal View UI, Equipment Summary KPI Cards, Recent Activity Log Feed, Rendal Role Dashboard Layout Rationale, Equipment Status Distribution Donut Chart, Equipment Registration Trend Chart, Upcoming Inspections Table

### Community 16 - "Dashboard Unit Kerja Overview UI"
Cohesion: 0.40
Nodes (6): Dashboard Unit Kerja Overview UI, Distribusi Aset per Lokasi Bar Chart, Asset KPI Summary Cards, Jadwal Maintenance Unit Panel, Permintaan Terbaru Table Widget, Status Pemanfaatan Aset Donut Chart

### Community 17 - "Dashboard Inspeksi UI Layout"
Cohesion: 0.33
Nodes (6): Temuan Kritikal Aktif Widget, Asset Health Index (AHI) KPI Card, Log Inspeksi Prioritas Tinggi Table, Status Inspeksi Berdasarkan Unit Pabrik Bar Chart, Dashboard Inspeksi UI Layout, Jadwal Mendatang Timeline Widget

### Community 18 - "Data Hasil Inspeksi Form Component"
Cohesion: 0.40
Nodes (6): Data Hasil Inspeksi Form Component, Detail Aset Component, Formulir Inspeksi Teknik UI, Idle Asset Technical Inspection Workflow, Riwayat Inspeksi Terakhir Component, Upload Foto Kondisi Component

### Community 19 - "Registrasi Idle Equipment Form UI"
Cohesion: 0.40
Nodes (5): Alasan Idle Options, Detail Lokasi Section, Informasi Peralatan Section, Registrasi Idle Equipment Form UI, Upload Foto Peralatan Component

### Community 20 - "Pusat Data Aset Dashboard"
Cohesion: 0.50
Nodes (4): Asset Filter Bar, Asset Request Table, Mock Role Switcher, Pusat Data Aset Dashboard

### Community 21 - "Asset Detail Information Modal UI"
Cohesion: 0.67
Nodes (4): Asset Documentation and Photo Attachments, Asset Detail Information Modal UI, Asset Review and Approval Workflow, Control Valve V-202 Urea Asset (VLV-202-UR3)

### Community 22 - "Detail Informasi Aset Side Panel"
Cohesion: 0.50
Nodes (4): Detail Informasi Aset Side Panel, Lampiran Gambar dan Dokumen Section, Minta Revisi Validasi Modal Dialog, Pusat Data Aset Dashboard

### Community 23 - "Mobile Login Screen UI Reference"
Cohesion: 0.67
Nodes (4): Mobile Login Screen UI Reference, NPP Employee ID Login Form, PT Pupuk Sriwidjaja Idle Equipment Management System, SSO Authentication Option

### Community 24 - "Inspection Validation Table UI"
Cohesion: 0.67
Nodes (4): Approval Workflow (Menunggu Review, Sedang Direview, Disetujui, Perlu Revisi), Asset Status Flow (Registered, Validated, Idle, Rejected), Inspection Validation Table UI, Inspection Validation Actions (Validasi, Ubah Validasi, Detail Info, Revisi Validasi)

### Community 25 - "generate-pdf.js"
Cohesion: 0.50
Nodes (3): doc, fs, PDFDocument

### Community 28 - "Celest Ruyi Boom Mic IEM Cable Product Image"
Cohesion: 0.67
Nodes (3): Celest Ruyi Boom Mic IEM Cable Product Image, Detachable Boom Microphone Attachment, 2-Pin IEM Upgrade Cable

### Community 40 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 42 - "approve/page.tsx"
Cohesion: 0.25
Nodes (10): getPlants(), reviewApproval(), startReviewApproval(), APPROVAL_STATUS_LABEL, CONDITION_RESULT, formatRupiah(), Lookup, ManajerApprovePage() (+2 more)

### Community 43 - "getObjectTypes"
Cohesion: 0.15
Nodes (13): createReuseRequest(), getObjectTypes(), ApprovalState, AssetState, Equipment, RendalIdlePage(), DaftarAsetPage(), EquipmentItem (+5 more)

### Community 48 - "1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab"
Cohesion: 0.17
Nodes (11): 1. Pemetaan Peran Pengguna (User Roles) & Tanggung Jawab, 2. Alur Status & Siklus Hidup Aset (Asset Lifecycle), 3. Penyesuaian Formulir & Aturan Teknis Sistem, A. Parameter Informasi Aset (Pendaftaran Alat), A. Rendal Pemeliharaan (Planner & Coordinator), B. Form Inspeksi & Penomoran Pemeriksaan, B. Inspeksi Teknik - Instek (Validator & Auditor), C. Logika Validasi Kondisi & Kelayakan Aset (+3 more)

### Community 57 - "api.ts"
Cohesion: 0.15
Nodes (7): updateReuseRequestStatus(), ManajerPeminjamanPage(), ReuseRequest, ReuseRequestApi, ApprovalKind, disposalDisplayStatus, reuseDisplayStatus

### Community 58 - "getDisposals"
Cohesion: 0.09
Nodes (26): absoluteFileUrl(), approveDisposal(), createDisposalRequest(), DisposalItemDTO, getDisposalMethods(), getDisposals(), getInspections(), getValidations() (+18 more)

### Community 59 - "register-equipment/page.tsx"
Cohesion: 0.23
Nodes (10): createEquipment(), getEquipmentById(), getFunctionalLocations(), getStorageLocations(), updateEquipment(), MODULES, RegisterEquipmentPage(), EditEquipmentDialog() (+2 more)

### Community 60 - "PRODUCT.md"
Cohesion: 0.17
Nodes (10): Anti-references, Brand voice, Constraints, Key messages, Missing facts, Primary job-to-be-done, Target audience, User-provided facts (+2 more)

### Community 61 - "open-in-terminal/manifest.json"
Cohesion: 0.20
Nodes (9): author, authorUrl, description, fundingUrl, id, isDesktopOnly, minAppVersion, name (+1 more)

### Community 62 - "check-equipment-form.mjs"
Cohesion: 0.25
Nodes (7): api, appended, body, createFn, optional, page, required

### Community 63 - "getEquipments"
Cohesion: 0.17
Nodes (15): approveRevalidationEquipment(), createInspection(), deleteEquipment(), getApprovals(), getEquipments(), submitInspectionData(), EquipmentManagementPage(), InspeksiDashboardPage() (+7 more)

### Community 64 - "ui-layouts-mcp"
Cohesion: 0.40
Nodes (4): npx, 21st, ui-layouts-mcp, @ui-layouts/mcp

### Community 67 - "check-repair-payload.mjs"
Cohesion: 0.22
Nodes (8): api, body, fn, modal, page, pages, required, tabel

### Community 68 - "claude-code-ide/manifest.json"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 69 - "pemeliharaan/dashboard/page.tsx"
Cohesion: 0.11
Nodes (21): eq(), completeEquipmentRepair(), findLatestInspectionId(), getEquipmentRepairs(), Equipment, PemeliharaanDashboardPage(), relativeTime(), Repair (+13 more)

### Community 75 - "validasi/page.tsx"
Cohesion: 0.21
Nodes (12): createRevalidation(), getApprovalById(), getConditions(), getRequireActions(), resubmitApproval(), ApprovalState, Asset, AssetState (+4 more)

### Community 76 - "inspeksi-berkala/page.tsx"
Cohesion: 0.19
Nodes (11): NOW, Equipment, InspectionItem, InspeksiAntreanPage(), EquipmentLike, InspectionLike, inspectionQueue(), LastInspection (+3 more)

## Knowledge Gaps
- **290 isolated node(s):** `21st`, `npx`, `@ui-layouts/mcp`, `id`, `name` (+285 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getEquipments()` connect `getEquipments` to `ManajemenInspeksi.tsx`, `auth.ts`, `dependencies`, `pemeliharaan/dashboard/page.tsx`, `shared.tsx`, `RendalDashboard.tsx`, `approve/page.tsx`, `validasi/page.tsx`, `inspeksi-berkala/page.tsx`, `getObjectTypes`, `api.ts`, `getDisposals`, `register-equipment/page.tsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `21st`, `npx`, `@ui-layouts/mcp` to the rest of the system?**
  _290 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08646616541353383 - nodes in this community are weakly interconnected._
- **Should `open-in-terminal/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09565217391304348 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.052564102564102565 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._