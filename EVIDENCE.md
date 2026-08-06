# EVIDENCE.md

Every externally verifiable claim that could appear in the Rendal UI.

| Claim | Source | Confidence | Allowed wording | Usage |
| ------- | -------- | ------------ | ----------------- | ------- |
| Brand navy `#0A356A` | existing repo code (Sidebar, all rendal pages) | high | use as-is | primary surface/text |
| Brand blue `#0556B3` | existing repo code (Header, NextTopLoader) | high | use as-is | hover/link state |
| Equipment counts (validasi, perbaikan, reuse, disposal) | live API via `getEquipments()` / `getDisposals()` | high | render API value only | KPI strip |
| Cost avoidance rupiah figures | live API `original_value` / `scrap_value` | high | render API value only | charts, totals |
| Audit log entries | live API, derived in `buildAuditLogs()` | high | render API value only | Laporan table |
| PT Pusri official brand palette | missing | 0 | MUST NOT USE as a claim | — |
| Any user count / adoption / time-saved metric | missing | 0 | MUST NOT USE | — |
| Any SLA, uptime, or performance number | missing | 0 | MUST NOT USE | — |
| Any certification (ISO, SNI, etc.) | missing | 0 | MUST NOT USE | — |
| Any testimonial or named person | missing | 0 | MUST NOT USE | — |

Rule for this redesign: **no new numeric literal may be added to the UI.** Every figure on screen must trace to an API field that already exists in the current code.
