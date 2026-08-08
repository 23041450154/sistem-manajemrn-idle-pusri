# DESIGN.md — Rendal Pemeliharaan Console

Authoritative visual system for `src/app/(authenticated-routes)/rendal/`.
Every component in scope implements this. No one-off values.

## Brand

- Name: Sistem Manajemen Idle Equipment — Rendal Pemeliharaan
- Voice: Precise / Technical / Calm
- Anti-patterns: gradient overlay cards, multi-hue KPI rows, uppercase micro-label above every value, `rounded-xl` on data surfaces, shadow on every container

## Color System

Source row: colors.csv row 102, "Inventory & Stock Management" (industrial slate + stock green)

- Primary: `#0A356A` — nav surface, table header text, primary buttons, active state
  - **Documented exception.** Row 102's primary is `#334155`. Brand navy `#0A356A` is already committed across Sidebar, Header, and all four untouched role surfaces. Replacing it would fracture the app. Row 102's slate is used as the structural/neutral layer instead.
- On Primary: `#FFFFFF`
- Primary Hover: `#0556B3` — existing committed brand blue
- Secondary: `#475569` — secondary button text, table meta columns
- On Secondary: `#FFFFFF`
- Accent: `#059669` — the single accent. Success/ready state, positive rupiah values. One role only.
- On Accent: `#FFFFFF`
- Background: `#F8FAFC` — app canvas
- Foreground: `#0F172A` — body text, primary table values
- Card: `#FFFFFF` — panel surfaces
- Card Foreground: `#0F172A`
- Muted: `#F2F3F4` — table header fill, row hover, disabled fill
- Muted Foreground: `#64748B` — labels, captions, secondary table text
- Border: `#E6E8EA` — all borders and dividers, one weight
- Destructive: `#DC2626` — errors, rejected state, delete
- On Destructive: `#FFFFFF`
- Ring: `#334155` — focus ring, 2px offset 1px

### Status hues (locked, one per workflow state)

State colour is carried by a **2px left rule + text colour**, never by a filled pastel card.

- Registered / menunggu validasi: `#0556B3`
- Dalam perbaikan: `#B45309`
- Ready to reuse / validated: `#059669`
- Rejected / tidak layak: `#DC2626`
- Disposal: `#475569`

Five states, five hues, no sixth. Purple, cyan, pink, teal, and indigo are removed from this surface.

Dark mode: not in scope. This is a daylight plant-office tool and no dark toggle exists in the app. Existing `.dark` block in `globals.css` is left untouched.

## Typography

Source row: typography.csv row 31, "Financial Trust" — IBM Plex Sans

- Heading Font: IBM Plex Sans
- Body Font: IBM Plex Sans
- Chosen over row 16 (Lexend) because IBM Plex Sans ships true tabular figures, required for rupiah columns and equipment codes. Replaces Inter, which is on the overused-font list.

Roles:

- H1 (page title): IBM Plex Sans 600, 20px, tracking -0.01em, leading 1.25
- H2 (panel title): IBM Plex Sans 600, 14px, tracking 0, leading 1.35
- H3 (sub-panel): IBM Plex Sans 600, 13px, tracking 0, leading 1.4
- Body: IBM Plex Sans 400, 14px, leading 1.5
- Table cell: IBM Plex Sans 400, 13px, leading 1.4, `font-variant-numeric: tabular-nums`
- Table header: IBM Plex Sans 600, 11px, uppercase, tracking 0.04em
- KPI value: IBM Plex Sans 600, 28px, tracking -0.02em, tabular-nums
- Label / caption: IBM Plex Sans 500, 12px, leading 1.4
- Mono/Code: IBM Plex Mono 400, 12px — equipment codes only

Type scale ratio: 1.2. Max line length: 70ch.

**Uppercase label budget:** table headers and KPI eyebrows only. Uppercase micro-labels are banned inside table cells, modal field values, and activity feeds.

## Spacing

Base unit: 4px. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48

- Page padding: `px-6 py-6`
- Panel padding: `p-5`
- Table cell padding: `px-4 py-2.5`
- Component gap: `gap-4`
- Content max-width: `max-w-[1400px]`

## Grid

Breakpoints: sm 640, md 768, lg 1024, xl 1280, 2xl 1536
Container: `max-w-[1400px] mx-auto px-6`
KPI strip: `grid-cols-2 lg:grid-cols-4`
Dashboard body: `grid-cols-1 lg:grid-cols-3`

## Radius — LOCKED

User constraint: visibly square, slightly softened.

- `--radius: 4px` (was 10px)
- Panels / cards / tables: 4px
- Buttons / inputs / selects: 4px
- Badges / status chips: 2px
- Avatar: `rounded-full` — only permitted circular element
- Banned in scope: `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full` on non-avatar containers

## Elevation

Shadow is reserved for surfaces that float above the page. Everything else uses a border.

- Level 0: no shadow — panels, cards, tables, buttons, inputs. Border `1px #E6E8EA`.
- Level 1: `0 1px 2px 0 rgb(15 23 42 / 0.04)` — dropdowns, popovers
- Level 2: `0 8px 24px -4px rgb(15 23 42 / 0.12)` — modals, toasts

Shadows are tinted to the `#0F172A` foreground hue. No pure-black shadows.

## Motion

- Hover: 140ms ease-out, `background-color` / `color` only
- Active/press: 100ms ease-out, `scale(0.98)`
- Modal enter: 200ms `cubic-bezier(.33,1,.68,1)`, opacity + `scale(0.98→1)`
- Modal exit: 160ms ease-in
- Spinner: existing `animate-spin`, unchanged
- Scroll reveals: **none.** Operational data must be legible the instant it paints.
- Reduced motion: `prefers-reduced-motion: reduce` sets all durations to 0.01ms and disables `animate-spin` transform.

## Component Patterns

- Page header: breadcrumb, H1, one-line description, right-aligned action cluster. Bottom border `1px #E6E8EA`. No card wrapper.
- KPI card: single style, value-dominant. 2px left rule in the state hue. Label 12px above, value 28px, context caption 12px below. No gradient, no icon tile background.
- Table: square edges, sticky header on `#F2F3F4`, `divide-y #E6E8EA`, hover `#F2F3F4`, tabular-nums on numeric columns.
- Status badge: 2px radius, 11px 600, transparent fill, 1px border in state hue, text in state hue.
- Button primary: `#0A356A` fill, white text, 4px radius, hover `#0556B3`.
- Button secondary: white fill, `#E6E8EA` border, `#334155` text, hover `#F2F3F4` fill.
- Modal: 4px radius, solid `#0F172A/50` scrim, no `backdrop-blur`.
- Empty state: icon at `#64748B`, one sentence, one action. No illustration.

## Image Style

No decorative imagery. The only images are user-uploaded equipment photos, rendered at 4px radius with a 1px `#E6E8EA` border and `object-cover`. No stock photography, no generated hero art — this is an authenticated internal tool with no marketing surface.

## Accessibility

- Target: WCAG 2.2 AA
- Contrast verified: `#0F172A` on `#FFFFFF` = 17.9:1; `#64748B` on `#FFFFFF` = 4.8:1; `#FFFFFF` on `#0A356A` = 11.6:1; `#059669` on `#FFFFFF` = 3.9:1 (accent used at 14px+ 600 weight or as border/rule only, never small body text)
- Focus: 2px `#334155` ring, 1px offset, visible on every interactive element
- Touch targets: minimum 44x44px, including table row action buttons
- All icon-only buttons carry `aria-label`
- Reduced motion respected globally
