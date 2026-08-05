# PRODUCT.md

## What it is

Equipment registration form for PT Pusri's idle equipment management system. Used by maintenance staff (RENDAL_PEMELIHARAAN role) to register idle assets with photos, specifications, and storage details.

## Target audience

Internal operational staff: maintenance coordinators, warehouse managers, asset controllers at PT Pusri manufacturing plants. Technical literacy: moderate. Context: desktop workstations during shift work.

## Brand voice

Professional, clear, trustworthy. Operational tool, not consumer product. No marketing fluff.

## Key messages

- Register equipment accurately with complete data
- Upload photos and documents for verification
- Track equipment from idle to ready-to-reuse

## Anti-references

Not consumer-friendly/playful, not dark tech, not startup-bro, not minimal luxury. Should feel like SAP/Oracle but modern.

## User-provided facts

- Source: user — Blue color palette must be preserved: #0A356A (primary dark) and #0556B3 (primary)
- Source: existing code — Form has: equipment code, name, object type, storage location, plant, area, vendor, year, value, condition, notes, file uploads
- Source: existing code — Users can upload multiple photos (drag-drop)
- Source: existing code — Excel import modal exists
- Source: existing code — Max file size 5MB per file

## Missing facts

- Photo requirements (how many minimum): [NEEDS INPUT]
- Validation rules priority: [NEEDS INPUT]
- Mobile usage context: [NEEDS INPUT]

## Working assumptions

- Desktop-primary workflow (maintenance staff at workstations)
- Multi-step wizard will reduce cognitive load vs. long single form
- Step 1: Basic info, Step 2: Specifications, Step 3: Photos/docs
- Existing Tailwind v4 + shadcn/ui should be leveraged

## Constraints

- Must integrate with existing API: createEquipment, uploadEquipmentAttachment
- Must preserve existing role-based access (RENDAL_PEMELIHARAAN)
- Must work within existing authenticated layout
- Blue palette (#0A356A / #0556B3) is non-negotiable
