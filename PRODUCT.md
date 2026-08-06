# PRODUCT.md

## What it is

Internal web application for PT Pusri to register, validate, repair, and dispose of idle plant equipment. This redesign scope covers the **Rendal Pemeliharaan** role surface only: `src/app/(authenticated-routes)/rendal/`.

## Target audience

Staff Rendal Pemeliharaan (maintenance planning & control) at a fertilizer plant. Desktop-first, long shifts, high data volume. They scan tables of equipment codes, compare rupiah values, and move assets through a fixed workflow. Not a public site, not a marketing surface. Indonesian language.

## Primary job-to-be-done

"Show me which assets are stuck, at which stage, and let me act on them without hunting."

## Brand voice

Precise / Technical / Calm. Instrument panel, not a product tour.

## Key messages

Not applicable. This is an operational tool, not a marketing page. The interface's job is legibility and state clarity.

## Anti-references

- Not a SaaS marketing dashboard with floating gradient cards
- Not the current state: 6 competing accent hues, `shadow-sm` on every surface, tiny uppercase labels above every value, `rounded-xl` on data tables
- Not the anti-slop overcorrection either: no cream/serif/editorial treatment on a plant maintenance tool

## User-provided facts

- Source: user — Redesign scope starts at `src/app/(authenticated-routes)/rendal/`
- Source: user — Corner radius must be small. "Jangan rounded banget, masih keliatan kotak tapi sedikit rounded."
- Source: user — Current output reads as AI slop and must not.
- Source: existing codebase — Brand navy `#0A356A` and link blue `#0556B3` are already in use across the app and in the sidebar.

## Missing facts

- Official PT Pusri brand guideline hex values: [NEEDS INPUT] (using the hexes already committed in the repo)
- Accessibility target (WCAG level required by PT Pusri IT): [NEEDS INPUT] (defaulting to WCAG 2.2 AA)
- Whether other role surfaces (admin, inspeksi, manajer, unit-kerja) should follow: [NEEDS INPUT]

## Working assumptions

- Desktop 1280px+ is the primary working width; mobile is occasional field lookup.
- All numbers rendered in the UI come from the live API. No sample or seeded figures are introduced by this redesign.

## Constraints

- Next.js 16 + Tailwind v4 + `lucide-react` already installed. No new runtime dependencies.
- Page logic, data fetching, and route behaviour must not change. Presentation only.
