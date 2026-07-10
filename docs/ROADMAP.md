# Roadmap — Castle Guide

> Living document. Phase gates bump **minor** versions. Expand gate-proof detail when a phase opens.

| Phase | Name | Version target | Status |
|-------|------|----------------|--------|
| **0** | Planning | 0.1.0 | **PASSED** (owner audit 2026-07-09) |
| **1** | Home Record | 0.2.0 | **PASSED** (implemented) |
| **2** | Maintenance + Ops | 0.3.0 | **PASSED** (implemented) |
| **3** | Money + Protection | 0.4.0 | **OPEN** — implement & gate |
| **4** | House View + Council + AI | 0.5.0 | Planned |
| **5** | Area + Builders + Polish | 0.6.0 | Planned |
| **6** | Stretch | 0.7.0+ | Planned (order by ADR) |

---

## Phase 0 — Planning · PASSED

**Shipped:** PRD, ARCHITECTURE, DATA_MODEL, TIERING, CONTENT_POLICY, AGENTS, ROADMAP, ADRs 0001–0003, HUMAN_DIRECTIONS, repo scaffold, hello shell, iso spike, schema CI, gitleaks, Pages base `/castle-guide/`.

**Gate proof (verified by owner):**

- [x] Docs complete; requirement IDs in PRD; tier rationales in TIERING
- [x] `npm ci && npm run ci` green on clean install
- [x] Built assets resolve under `/castle-guide/`; Pages workflow fails if base missing
- [x] Spike: 2 rooms from real dims, clickable placement, real `HouseRendererPlugin` types, no storage writes
- [x] Sample content `typical` only; schemas require `sources` + `asOfDate`
- [x] Amendments: LF gitattributes, Node-only scripts, gitleaks, ARR license, honest seeds

**Nits deferred into Phase 1 cleanup:** spike fixture in validate script; ROADMAP depth; keep `dist/` untracked (gitignored).

---

## Phase 1 — Home Record · OPEN

**Ships (NOW unless noted):**

| Area | Deliverables | PRD IDs |
|------|--------------|---------|
| Profiles | Multi-property shells, active property switcher | HR-01 |
| Catalog | Item cards (full fields), soft replace + lineage | HR-02, HR-03 |
| Onboarding | Guided walkthrough UI (LIGHT), Prompt Pack paste import | HR-04, HR-05, AI-01 |
| Lockers | Consumables, dimensions, docs vault + blobs | HR-06–HR-08 |
| Safety / delight | Shutoff map, notepad + Someday, Pool Room | HR-09–HR-11 |
| Portability | ZIP export/import round-trip | HR-12 |
| Storage | IndexedDB + OPFS, schemaVersion migrations | ADR-0001 |

**Gate proof (must demo):**

1. Clean browser, no account → create property **"The Serenity"**.
2. Add a real appliance via **pasted LLM JSON** (Prompt Pack path) **or** manual form in **&lt;2 minutes**.
3. Card shows brand/model/serial (as provided); lineage empty until first swap.
4. Swap appliance → prior snapshot in history; current item active.
5. Export ZIP → wipe (or second profile) → import → data + media round-trip.
6. Pool Room shows an item marked `poolRoomWorthy`.
7. `npm run ci` green; no secrets; CHANGELOG 0.2.0.

**Out of Phase 1 (sockets only):** BYO-key OCR polish (LIGHT), full iso house view (P4), live calendars (P2).

---

## Phase 2 — Maintenance + Ops

**Ships:** Auto-schedule from catalog + climate zone; seasonal checklists; task cards (difficulty, DIY vs pro, when-NOT-to-DIY); ops calendar (trash/bills/tax/HOA/insurance); **ICS export**.

**Gate proof:**

1. Furnace-filter task appears at catalog-driven cadence (with **your** filter size on the card).
2. Trash day (user-configured) appears on ops calendar.
3. ICS file imports into Google **or** Apple **or** Outlook and shows both events.
4. At least one red when-NOT-to-DIY warning on a gas/electrical/structural template task.

**Note:** PWA push remains BLUEPRINT; ICS is the forever LIGHT path.

---

## Phase 3 — Money + Protection

**Ships:** Cost library UI (~seeded jobs, expand toward ~100); rebates (25C/25D + DSIRE patterns, sourced); capital improvements ledger; payoff/equity tools; Dale's Desk; insurance packet ZIP/PDF; warranty tracker + task flags.

**Gate proof:**

1. Generate insurance readiness package from inventory (photos/serials/values as available).
2. A federal **25C** credit card explains eligibility pattern **with source + as-of date**.
3. Log a padded roofing quote → Dale verdict path includes **"tell him he's dreamin'"** when over library range / vague scope heuristics fire.
4. Cost rows show confidence badges; no undated costs.

---

## Phase 4 — House View + Council + AI

**Ships:** Production isometric plugin (drag-drop real dims, health overlay); council nugget surfacing; BYO-key OCR + photo triage LIGHT + manual mode always; serenity score wired to health.

**Gate proof:**

1. Click fridge in house view → same item card with lineage opens.
2. Drag placement updates coordinates via host mutation (not renderer-owned storage).
3. Overdue task → amber/red glow on placement; serenity meter moves.
4. Gus delivers a seasonal nugget (context or Council screen).
5. List-view path works with house view disabled / inaccessible.

---

## Phase 5 — Area + Builders + Polish

**Ships:** Neighborhood dashboard + socials hub; law-vs-neighbor (Karen) educational module; fun builders (Colonel); dream-home planner; realtor gift LIGHT (depth still OPEN in PRD).

**Gate proof:**

1. Colonel prices a **Glory**-tier mancave with itemized estimate + considerations (permits, spouse clause flavor OK; numbers stay real).
2. Karen fence dispute card links a statute/pattern source and says verify locally.
3. Registry/crime surfaces show anti-harassment notice; deadpan tone.
4. Area links load from data/user config, not hardcoded only-in-JS.

---

## Phase 6 — Stretch (order by ADR)

| Candidate | Prerequisite |
|-----------|----------------|
| Retro pixel skin | Plugin contract stable |
| walk3d Three.js plugin | HUMAN_DIRECTIONS §1; H/z data populated |
| PWA push | VAPID + SW; ICS remains default |
| Encrypted sync | Threat-model ADR; never gates local data |
| Live valuation / crime APIs | Keys browser-only; link hub remains |

**Gate proof:** TBD per ADR when a stretch item is promoted.

---

## Product-complete demo script

Clean browser → create **"The Serenity"** → water-heater label / paste → card auto-fills → house view shows it → anode-rod task at year-4 cadence → trash day on calendar → export insurance packet → Dale reviews roofing quote → something great goes to the **Pool Room**.

**Under five minutes. Zero accounts. Works offline.**

---

## Versioning & phase-gate checklist

- Phase gates bump **minor** (0.1.0 → 0.2.0 …).
- Breaking export shape bumps `schemaVersion` + migrations.
- Every gate: demo from clean clone · docs current · CHANGELOG · schemas CI · gitleaks clean · TIERING current · open questions in PRD.
