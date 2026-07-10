# TIERING — NOW / LIGHT / BLUEPRINT

> **Phase focus column** = when the tier applies relative to roadmap.  
> **Phase 1 column** = classification for the next build phase after this gate.

Legend:

- **NOW** — build fully in that phase  
- **LIGHT** — working lightweight version; heavy version later without rework  
- **BLUEPRINT** — socket + spec + HUMAN_DIRECTIONS; plug later  
- **—** — not started that phase  

---

## 5.1 Home Record

| Feature | Phase 1 | Later | Rationale |
|---------|---------|-------|-----------|
| Profiles + multi-property | NOW | | Core isolation boundary |
| Item cards (full fields) | NOW | | Core loop |
| Replacement lineage | NOW | | Differentiator; resale memory |
| Guided photo walkthrough UI | LIGHT | enrich P4 | Steps + manual capture first |
| Prompt Pack ingestion (paste JSON) | NOW | | Zero-cost onboarding |
| BYO-key label OCR | LIGHT | P4 NOW | Manual path is default |
| Consumables Locker | NOW | | High weekly value |
| Dimensions vault | NOW | | Feeds renderer |
| Docs vault + local blobs | NOW | | Manuals/receipts |
| Emergency shutoff map | NOW | | 2 a.m. feature |
| Idea notepad + Someday board | NOW | | Loyalty |
| Pool Room | NOW | | Delight + Castle egg |
| ZIP export/import | NOW | | Privacy + multi-device |
| Blueprint/floor-plan upload | LIGHT | | Store as doc + optional overlay later |
| Manual auto-suggest by model | LIGHT | | Link-out + Prompt enrichment |

## 5.2 Maintenance & Ops

| Feature | Phase 1 | Phase 2 | Rationale |
|---------|---------|---------|-----------|
| Task templates in `/data` | LIGHT seed | NOW | Content before engine |
| Auto-schedule from catalog | — | NOW | Needs catalog |
| Seasonal checklists | — | NOW | Climate-aware |
| Full ops calendar | — | NOW | Trash/bills/tax |
| ICS export | — | NOW | Universal reminders |
| PWA push notifications | — | BLUEPRINT | ICS is LIGHT forever |
| DIY vs hire on task cards | — | NOW | |
| when-NOT-to-DIY warnings | — | NOW | Safety; deadpan |

## 5.3 Money & Value

| Feature | Phase 1 | Phase 3 | Rationale |
|---------|---------|---------|-----------|
| Cost library content | seed typical | NOW | Honesty on confidence |
| Cost library UI | — | NOW | |
| Rebates 25C/25D + DSIRE patterns | — | NOW | Sourced static JSON |
| Live rebate APIs | — | BLUEPRINT | |
| Capital improvements ledger | — | NOW | |
| Payoff / equity tools | — | NOW | Pure client math |
| Dale's Desk | — | NOW | vs cost library |
| Price watch user-logged | — | LIGHT | Charts from user data |
| Live retail price pulls | — | BLUEPRINT | HUMAN_DIRECTIONS |
| Resale ROI guide | — | NOW | Cited publications |

## 5.4 Protection

| Feature | Phase 1 | Phase 3 | Rationale |
|---------|---------|---------|-----------|
| Warranty fields on items | NOW | | Data first |
| Warranty tracker UI + flags | — | NOW | |
| Insurance packet ZIP/PDF | — | NOW | |
| Fine-print gotcha library | — | NOW | Sourced content |
| Disaster prep checklists | — | LIGHT→NOW | Regional templates |

## 5.5 Knowledge, Land & Law

| Feature | Phase 1 | Phase 5 | Rationale |
|---------|---------|---------|-----------|
| Nugget schema + sample cards | NOW seed | expand | CI proves pipeline |
| Council browse UI | — | P4–5 | |
| Soil/drainage library | — | NOW | |
| Law vs Nosey Neighbor | — | NOW | Educational + verify locally |
| Codes/zoning/tax primers | — | NOW | |
| Field guide | — | NOW | Caution-first |
| Wish-I'd-Known | — | NOW | |

## 5.6 Neighborhood & Area

| Feature | Phase 1 | Phase 5 | Rationale |
|---------|---------|---------|-----------|
| Area link registry JSON | seed | NOW | |
| Dashboard + socials hub | — | NOW | User-added links |
| Official crime/gov/FEMA/NSOPW links | — | LIGHT/NOW | Curated hub |
| Live crime/valuation feeds | — | BLUEPRINT | HUMAN_DIRECTIONS |
| Registry anti-harassment notice | — | NOW | Hard requirement |

## 5.7 House View

| Feature | Phase 0 | Phase 4 | Phase 6 | Rationale |
|---------|---------|---------|---------|-----------|
| Plugin contract + types | NOW | | | Architecture law |
| Iso spike (2 rooms + click) | NOW | | | Contract proof |
| Isometric full plugin | — | NOW | | ADR-0002 default |
| Drag-drop real dims | — | NOW | | |
| Health overlay | — | NOW | | Serenity inputs |
| List-view equivalent | shell | NOW | | a11y |
| Photo as framed placeable | — | LIGHT | | Not AI 3D |
| Retro pixel skin | — | — | NOW | Second skin |
| 3D walkthrough | BLUEPRINT socket | | plug | HUMAN_DIRECTIONS |
| Photo → styled 3D asset | — | — | BLUEPRINT | |

## 5.8 Fun Builders

| Feature | Phase 5 | Rationale |
|---------|---------|-----------|
| Mancave/shed/bunker/etc. templates | NOW | Colonel + real numbers |
| Dream Home planner | NOW | Banks-linked savings |
| "Does spouse know?" considerations | NOW | Delight without lying about permits |

## 5.9 AI & Prompt Pack

| Feature | Phase 1 | Phase 4 | Rationale |
|---------|---------|---------|-----------|
| Prompt Pack v1 ingestion | NOW | | First-class product |
| Enrichment / ideation / builder prompts | stubs→NOW | expand | |
| BYO-key adapters | socket | NOW | Manual always works |
| Photo triage | — | LIGHT | Caution-first copy |

## 5.10 Profiles & polish

| Feature | Phase | Tier | Rationale |
|---------|-------|------|-----------|
| Multi-property | P1 | NOW | |
| Rental turnover checklists | P1–5 | LIGHT→NOW | |
| Realtor gift mode | P5 | LIGHT | White-label depth OPEN |
| Dark/light themes | P0 stub | NOW | |
| Encrypted cloud sync | — | BLUEPRINT | |
| Contractor marketplace | — | BLUEPRINT distant | |

---

## Promotion rules

- Promoting BLUEPRINT → LIGHT/NOW requires an ADR and HUMAN_DIRECTIONS update.
- Demoting is allowed if constitution risk appears; document in ADR.
- Phase 1 must not block on Phase 4–6 ambition; sockets only.
