# Graph Report - C:\projek\projek (3)\front-end  (2026-07-31)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 474 nodes · 699 edges · 60 communities (43 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dc77a74c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- getCurrentUserAction
- open-in-terminal/main.js
- dependencies
- compilerOptions
- devDependencies
- components.json
- claude-code-ide/main.js
- validasi/page.tsx
- api.ts
- getEquipments
- app/layout.tsx
- open-in-terminal/manifest.json
- approve/page.tsx
- claude-code-ide/manifest.json
- StatCard.tsx
- Frontend Next.js Architecture
- Dashboard Inspeksi Teknik Interface
- Dashboard Rendal View UI
- Dashboard Unit Kerja Overview UI
- Dashboard Inspeksi UI Layout
- Data Hasil Inspeksi Form Component
- Detail Informasi Aset Drawer
- getAttachmentsByEquipmentId
- Registrasi Idle Equipment Form UI
- Pusat Data Aset Dashboard
- Detail Informasi Aset Side Drawer
- Asset Detail Information Modal UI
- Detail Informasi Aset Side Panel
- Mobile Login Screen UI Reference
- Inspection Validation Table UI
- generate-pdf.js
- submitInspectionData
- InspeksiDashboard.tsx
- Celest Ruyi Boom Mic IEM Cable Product Image
- Authentication and Authorization System
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- Background Left Panel Image
- PUSRI Palembang Brand & Corporate Identity
- PUSRI Logo Asset
- Inspection Photo Attachment (Pixel Art Anime Avatar)
- File Document Icon
- Globe Icon SVG
- Application Icon
- PUSRI Palembang Logo
- PUSRI Palembang Logo Background
- Next.js Logo SVG
- Vercel Logo
- Window Icon SVG

## God Nodes (most connected - your core abstractions)
1. `getCurrentUserAction()` - 29 edges
2. `normalizeRole()` - 23 edges
3. `getEquipments()` - 22 edges
4. `compilerOptions` - 16 edges
5. `OpenInTerminalPlugin` - 15 edges
6. `getObjectTypes()` - 11 edges
7. `onload()` - 9 edges
8. `__awaiter()` - 9 edges
9. `ManajerApprovePage()` - 9 edges
10. `homePathForRole()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Laporan Inspeksi P101 Document` --conceptually_related_to--> `Sistem Manajemen Idle Equipment PUSRI`  [INFERRED]
  public/laporan_inspeksi_P101.pdf → Dokumentasi Aplikasi.md
- `Next.js Getting Started Guide` --semantically_similar_to--> `Frontend Next.js Architecture`  [INFERRED] [semantically similar]
  README.md → Dokumentasi Aplikasi.md
- `UnitKerjaDashboard()` --references--> `react`  [EXTRACTED]
  src/components/Dashboards/UnitKerjaDashboard.tsx → package.json
- `Agents MD Reference` --references--> `Next.js Breaking Changes Rules`  [EXTRACTED]
  CLAUDE.md → AGENTS.md
- `Frontend Next.js Architecture` --references--> `Next.js Breaking Changes Rules`  [EXTRACTED]
  Dokumentasi Aplikasi.md → AGENTS.md

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
- **Technical Inspection Validation Asset Detail Flow** — public_refrensi_detail_informasi_aset_validasi_inspeksi_teknik_page, public_refrensi_detail_informasi_aset_detail_informasi_aset_drawer, public_refrensi_detail_informasi_aset_detail_spesifikasi_alat, public_refrensi_detail_informasi_aset_lampiran_gambar_dokumen [EXTRACTED 1.00]
- **Authentication Methods on Mobile Login Screen** — public_refrensi_image_login_screen, public_refrensi_image_npp_login, public_refrensi_image_sso_authentication [EXTRACTED 1.00]
- **Asset Management Review UI Components** — public_refrensi_image1_asset_detail_modal, public_refrensi_image1_control_valve_v202, public_refrensi_image1_asset_review_workflow, public_refrensi_image1_asset_attachments [EXTRACTED 1.00]
- **Asset Validation and Approval UI Flow** — public_refrensi_image2_pusat_data_aset_table, public_refrensi_image2_detail_informasi_aset_drawer, public_refrensi_image2_konfirmasi_persetujuan_aset_modal [EXTRACTED 1.00]
- **Asset Validation and Revision Workflow** — public_refrensi_image3_pusat_data_aset_dashboard, public_refrensi_image3_detail_informasi_aset_panel, public_refrensi_image3_minta_revisi_validasi_modal [INFERRED 0.85]
- **Inspection Validation Management System UI Workflow** — public_validasiinspeksi_ui_table, public_validasiinspeksi_asset_status_flow, public_validasiinspeksi_approval_status_flow, public_validasiinspeksi_validation_actions [EXTRACTED 1.00]

## Communities (60 total, 17 thin omitted)

### Community 0 - "getCurrentUserAction"
Cohesion: 0.08
Nodes (38): cookieConfig(), getCurrentUserAction(), login(), loginAction(), logoutAction(), initialState, LoginForm(), AdminLayout() (+30 more)

### Community 1 - "open-in-terminal/main.js"
Cohesion: 0.10
Nodes (28): __awaiter(), buildDefaultTerminalAppSetting(), buildLaunchCommand(), buildMacLaunch(), buildUnixLaunch(), buildWindowsLaunch(), DEFAULT_SETTINGS, defaultTerminalApp() (+20 more)

### Community 2 - "dependencies"
Cohesion: 0.07
Nodes (28): @base-ui/react, class-variance-authority, clsx, lucide-react, next, nextjs-toploader, dependencies, @base-ui/react (+20 more)

### Community 3 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 4 - "devDependencies"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+17 more)

### Community 5 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 6 - "claude-code-ide/main.js"
Cohesion: 0.18
Nodes (16): b(), broadcastSelection(), D(), E(), I(), L(), N(), onload() (+8 more)

### Community 7 - "validasi/page.tsx"
Cohesion: 0.15
Nodes (15): getApprovals(), getObjectTypes(), validateEquipment(), ApprovalState, Asset, AssetState, ManajemenInspeksi(), ApprovalState (+7 more)

### Community 8 - "api.ts"
Cohesion: 0.16
Nodes (8): createEquipment(), createObjectType(), deleteObjectType(), getAreas(), getStorageLocations(), uploadEquipmentAttachment(), MasterDataPage(), RegisterEquipmentPage()

### Community 9 - "getEquipments"
Cohesion: 0.22
Nodes (9): deleteEquipment(), getEquipments(), EquipmentManagementPage(), Equipment, InspeksiAntreanPage(), ChartSection(), RendalDashboard(), RecentActivities() (+1 more)

### Community 10 - "app/layout.tsx"
Cohesion: 0.27
Nodes (8): geistMono, geistSans, inter, metadata, RootLayout(), Button(), buttonVariants, cn()

### Community 11 - "open-in-terminal/manifest.json"
Cohesion: 0.20
Nodes (9): author, authorUrl, description, fundingUrl, id, isDesktopOnly, minAppVersion, name (+1 more)

### Community 12 - "approve/page.tsx"
Cohesion: 0.31
Nodes (8): getApprovalById(), getInspections(), reviewApproval(), startReviewApproval(), Inspection, InspeksiDashboard(), ManajerApprovePage(), RequestAsset

### Community 13 - "claude-code-ide/manifest.json"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 14 - "StatCard.tsx"
Cohesion: 0.33
Nodes (6): fetchDashboardData(), InspeksiDashboardPage(), fetchDashboardData(), ManajerDashboardPage(), StatCard(), StatCardProps

### Community 15 - "Frontend Next.js Architecture"
Cohesion: 0.29
Nodes (7): Next.js Breaking Changes Rules, Agents MD Reference, Backend Go Gin Architecture, Frontend Next.js Architecture, Sistem Manajemen Idle Equipment PUSRI, Laporan Inspeksi P101 Document, Next.js Getting Started Guide

### Community 16 - "Dashboard Inspeksi Teknik Interface"
Cohesion: 0.38
Nodes (7): Tabel Daftar Inspeksi Teknik, Filter dan Pencarian Inspeksi, Statistik Jadwal Inspeksi, Penjadwalan Inspeksi Baru, Panduan Inspeksi dan SOP, Status Kesehatan Aset Idle, Dashboard Inspeksi Teknik Interface

### Community 17 - "Dashboard Rendal View UI"
Cohesion: 0.33
Nodes (7): Dashboard Rendal View UI, Equipment Summary KPI Cards, Recent Activity Log Feed, Rendal Role Dashboard Layout Rationale, Equipment Status Distribution Donut Chart, Equipment Registration Trend Chart, Upcoming Inspections Table

### Community 18 - "Dashboard Unit Kerja Overview UI"
Cohesion: 0.40
Nodes (6): Dashboard Unit Kerja Overview UI, Distribusi Aset per Lokasi Bar Chart, Asset KPI Summary Cards, Jadwal Maintenance Unit Panel, Permintaan Terbaru Table Widget, Status Pemanfaatan Aset Donut Chart

### Community 19 - "Dashboard Inspeksi UI Layout"
Cohesion: 0.33
Nodes (6): Temuan Kritikal Aktif Widget, Asset Health Index (AHI) KPI Card, Log Inspeksi Prioritas Tinggi Table, Status Inspeksi Berdasarkan Unit Pabrik Bar Chart, Dashboard Inspeksi UI Layout, Jadwal Mendatang Timeline Widget

### Community 20 - "Data Hasil Inspeksi Form Component"
Cohesion: 0.40
Nodes (6): Data Hasil Inspeksi Form Component, Detail Aset Component, Formulir Inspeksi Teknik UI, Idle Asset Technical Inspection Workflow, Riwayat Inspeksi Terakhir Component, Upload Foto Kondisi Component

### Community 21 - "Detail Informasi Aset Drawer"
Cohesion: 0.47
Nodes (6): Detail Informasi Aset Drawer, Asset Approval Changes Status to IDLE, image2.png UI Reference, Konfirmasi Persetujuan Aset Modal, Pusat Data Aset Table View, Technical Review and Approval Workflow

### Community 22 - "getAttachmentsByEquipmentId"
Cohesion: 0.47
Nodes (5): completeEquipmentMaintenance(), getAttachmentsByEquipmentId(), INITIAL_MAINTENANCE_SAMPLES, MaintenanceEquipment, PerbaikanAlatPage()

### Community 23 - "Registrasi Idle Equipment Form UI"
Cohesion: 0.40
Nodes (5): Alasan Idle Options, Detail Lokasi Section, Informasi Peralatan Section, Registrasi Idle Equipment Form UI, Upload Foto Peralatan Component

### Community 24 - "Pusat Data Aset Dashboard"
Cohesion: 0.50
Nodes (4): Asset Filter Bar, Asset Request Table, Mock Role Switcher, Pusat Data Aset Dashboard

### Community 25 - "Detail Informasi Aset Side Drawer"
Cohesion: 0.67
Nodes (4): Detail Informasi Aset Side Drawer, Detail Spesifikasi Alat Section, Lampiran Gambar dan Dokumen Section, Validasi Inspeksi Teknik Page

### Community 26 - "Asset Detail Information Modal UI"
Cohesion: 0.67
Nodes (4): Asset Documentation and Photo Attachments, Asset Detail Information Modal UI, Asset Review and Approval Workflow, Control Valve V-202 Urea Asset (VLV-202-UR3)

### Community 27 - "Detail Informasi Aset Side Panel"
Cohesion: 0.50
Nodes (4): Detail Informasi Aset Side Panel, Lampiran Gambar dan Dokumen Section, Minta Revisi Validasi Modal Dialog, Pusat Data Aset Dashboard

### Community 28 - "Mobile Login Screen UI Reference"
Cohesion: 0.67
Nodes (4): Mobile Login Screen UI Reference, NPP Employee ID Login Form, PT Pupuk Sriwidjaja Idle Equipment Management System, SSO Authentication Option

### Community 29 - "Inspection Validation Table UI"
Cohesion: 0.67
Nodes (4): Approval Workflow (Menunggu Review, Sedang Direview, Disetujui, Perlu Revisi), Asset Status Flow (Registered, Validated, Idle, Rejected), Inspection Validation Table UI, Inspection Validation Actions (Validasi, Ubah Validasi, Detail Info, Revisi Validasi)

### Community 30 - "generate-pdf.js"
Cohesion: 0.50
Nodes (3): doc, fs, PDFDocument

### Community 31 - "submitInspectionData"
Cohesion: 0.67
Nodes (3): createInspection(), submitInspectionData(), FormInspeksiPage()

### Community 34 - "Celest Ruyi Boom Mic IEM Cable Product Image"
Cohesion: 0.67
Nodes (3): Celest Ruyi Boom Mic IEM Cable Product Image, Detachable Boom Microphone Attachment, 2-Pin IEM Upgrade Cable

## Knowledge Gaps
- **180 isolated node(s):** `id`, `name`, `version`, `minAppVersion`, `description` (+175 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `id`, `name`, `version` to the rest of the system?**
  _180 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `getCurrentUserAction` be split into smaller, more focused modules?**
  _Cohesion score 0.0847457627118644 - nodes in this community are weakly interconnected._
- **Should `open-in-terminal/main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09565217391304348 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._