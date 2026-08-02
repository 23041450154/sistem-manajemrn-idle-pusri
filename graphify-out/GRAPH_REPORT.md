# Graph Report - .  (2026-08-02)

## Corpus Check
- 52 files · ~222,740 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 498 nodes · 744 edges · 57 communities (39 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 47
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56

## God Nodes (most connected - your core abstractions)
1. `getCurrentUserAction()` - 26 edges
2. `getEquipments()` - 23 edges
3. `normalizeRole()` - 22 edges
4. `compilerOptions` - 16 edges
5. `OpenInTerminalPlugin` - 15 edges
6. `getObjectTypes()` - 12 edges
7. `getAttachmentsByEquipmentId()` - 11 edges
8. `MasterDataPage()` - 10 edges
9. `onload()` - 9 edges
10. `__awaiter()` - 9 edges

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
- **Technical Inspection Validation Asset Detail Flow** — public_refrensi_detail_informasi_aset_validasi_inspeksi_teknik_page, public_refrensi_detail_informasi_aset_detail_spesifikasi_alat, public_refrensi_detail_informasi_aset_lampiran_gambar_dokumen [EXTRACTED 1.00]
- **Authentication Methods on Mobile Login Screen** — public_refrensi_image_login_screen, public_refrensi_image_npp_login, public_refrensi_image_sso_authentication [EXTRACTED 1.00]
- **Asset Management Review UI Components** — public_refrensi_image1_asset_detail_modal, public_refrensi_image1_control_valve_v202, public_refrensi_image1_asset_review_workflow, public_refrensi_image1_asset_attachments [EXTRACTED 1.00]
- **Asset Validation and Approval UI Flow** — public_refrensi_image2_pusat_data_aset_table, public_refrensi_image2_detail_informasi_aset_drawer, public_refrensi_image2_konfirmasi_persetujuan_aset_modal [EXTRACTED 1.00]
- **Asset Validation and Revision Workflow** — public_refrensi_image3_pusat_data_aset_dashboard, public_refrensi_image3_detail_informasi_aset_panel, public_refrensi_image3_minta_revisi_validasi_modal [INFERRED 0.85]
- **Inspection Validation Management System UI Workflow** — public_validasiinspeksi_ui_table, public_validasiinspeksi_asset_status_flow, public_validasiinspeksi_approval_status_flow, public_validasiinspeksi_validation_actions [EXTRACTED 1.00]

## Communities (57 total, 18 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (49): approveDisposal(), createEquipment(), createInspection(), createObjectType(), createRequireAction(), createStorageLocation(), deleteObjectType(), deleteRequireAction() (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (38): cookieConfig(), getCurrentUserAction(), login(), loginAction(), logoutAction(), initialState, LoginForm(), AdminLayout() (+30 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (28): __awaiter(), buildDefaultTerminalAppSetting(), buildLaunchCommand(), buildMacLaunch(), buildUnixLaunch(), buildWindowsLaunch(), DEFAULT_SETTINGS, defaultTerminalApp() (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (19): completeEquipmentMaintenance(), deleteEquipment(), getEquipments(), EquipmentManagementPage(), fetchDashboardData(), InspeksiDashboardPage(), Equipment, InspeksiAntreanPage() (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (28): @base-ui/react, class-variance-authority, clsx, lucide-react, next, nextjs-toploader, dependencies, @base-ui/react (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (25): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+17 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (16): b(), broadcastSelection(), D(), E(), I(), L(), N(), onload() (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.27
Nodes (8): geistMono, geistSans, inter, metadata, RootLayout(), Button(), buttonVariants, cn()

### Community 10 - "Community 10"
Cohesion: 0.20
Nodes (9): author, authorUrl, description, fundingUrl, id, isDesktopOnly, minAppVersion, name (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 12 - "Community 12"
Cohesion: 0.31
Nodes (9): Detail Spesifikasi Alat Section, Lampiran Gambar dan Dokumen Section, Validasi Inspeksi Teknik Page, Detail Informasi Aset Drawer, Asset Approval Changes Status to IDLE, image2.png UI Reference, Konfirmasi Persetujuan Aset Modal, Pusat Data Aset Table View (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (7): Next.js Breaking Changes Rules, Agents MD Reference, Backend Go Gin Architecture, Frontend Next.js Architecture, Sistem Manajemen Idle Equipment PUSRI, Laporan Inspeksi P101 Document, Next.js Getting Started Guide

### Community 14 - "Community 14"
Cohesion: 0.38
Nodes (7): Tabel Daftar Inspeksi Teknik, Filter dan Pencarian Inspeksi, Statistik Jadwal Inspeksi, Penjadwalan Inspeksi Baru, Panduan Inspeksi dan SOP, Status Kesehatan Aset Idle, Dashboard Inspeksi Teknik Interface

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (7): Dashboard Rendal View UI, Equipment Summary KPI Cards, Recent Activity Log Feed, Rendal Role Dashboard Layout Rationale, Equipment Status Distribution Donut Chart, Equipment Registration Trend Chart, Upcoming Inspections Table

### Community 16 - "Community 16"
Cohesion: 0.40
Nodes (6): Dashboard Unit Kerja Overview UI, Distribusi Aset per Lokasi Bar Chart, Asset KPI Summary Cards, Jadwal Maintenance Unit Panel, Permintaan Terbaru Table Widget, Status Pemanfaatan Aset Donut Chart

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (6): Temuan Kritikal Aktif Widget, Asset Health Index (AHI) KPI Card, Log Inspeksi Prioritas Tinggi Table, Status Inspeksi Berdasarkan Unit Pabrik Bar Chart, Dashboard Inspeksi UI Layout, Jadwal Mendatang Timeline Widget

### Community 18 - "Community 18"
Cohesion: 0.40
Nodes (6): Data Hasil Inspeksi Form Component, Detail Aset Component, Formulir Inspeksi Teknik UI, Idle Asset Technical Inspection Workflow, Riwayat Inspeksi Terakhir Component, Upload Foto Kondisi Component

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (5): Alasan Idle Options, Detail Lokasi Section, Informasi Peralatan Section, Registrasi Idle Equipment Form UI, Upload Foto Peralatan Component

### Community 20 - "Community 20"
Cohesion: 0.50
Nodes (4): Asset Filter Bar, Asset Request Table, Mock Role Switcher, Pusat Data Aset Dashboard

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (4): Asset Documentation and Photo Attachments, Asset Detail Information Modal UI, Asset Review and Approval Workflow, Control Valve V-202 Urea Asset (VLV-202-UR3)

### Community 22 - "Community 22"
Cohesion: 0.50
Nodes (4): Detail Informasi Aset Side Panel, Lampiran Gambar dan Dokumen Section, Minta Revisi Validasi Modal Dialog, Pusat Data Aset Dashboard

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (4): Mobile Login Screen UI Reference, NPP Employee ID Login Form, PT Pupuk Sriwidjaja Idle Equipment Management System, SSO Authentication Option

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (4): Approval Workflow (Menunggu Review, Sedang Direview, Disetujui, Perlu Revisi), Asset Status Flow (Registered, Validated, Idle, Rejected), Inspection Validation Table UI, Inspection Validation Actions (Validasi, Ubah Validasi, Detail Info, Revisi Validasi)

### Community 25 - "Community 25"
Cohesion: 0.50
Nodes (3): doc, fs, PDFDocument

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (3): Celest Ruyi Boom Mic IEM Cable Product Image, Detachable Boom Microphone Attachment, 2-Pin IEM Upgrade Cable

## Knowledge Gaps
- **185 isolated node(s):** `id`, `name`, `version`, `minAppVersion`, `description` (+180 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 4` to `Community 6`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **What connects `id`, `name`, `version` to the rest of the system?**
  _185 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05672926447574335 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08357685563997662 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09565217391304348 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11397849462365592 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._