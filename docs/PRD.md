# PRD — Castle Guide

> **Version:** 0.1.0 (Phase 0)  
> **Date:** 2026-07-09  
> **Source:** CASTLE_GUIDE_MASTER_GUIDE v0.2.0  
> **Status:** Ready for owner review (phase gate)

---

## 1. Product summary

**One-liner:** Your castle. Cataloged, maintained, defended, and leveled up.

Castle Guide is a local-first homeowner companion that turns a photo walkthrough (or manual entry / LLM paste) into a structured, exportable home record — then layers maintenance scheduling, money tools, protection packets, neighborhood intel, and a council of expert characters on top.

**Primary product surface:** the schema-validated home record (JSON).  
**Secondary surface:** swappable house-view renderer plugins over that data.  
**Tone:** funny and warm on the outside; professional, sourced, and money-saving underneath. Characters joke; cost tables don't.

---

## 2. Goals & success metrics

### Goals

| Pillar | User outcome |
|--------|----------------|
| **RECORD** | Every appliance, room dim, paint card, manual, and shutoff is findable |
| **MAINTAIN** | Right reminder before things break; ops calendar for whole house life |
| **DECIDE** | Costs, rebates, quotes, ROI — dated and sourced |
| **PROTECT** | Insurance packet, warranties, disaster prep |
| **DELIGHT** | House view, council, Pool Room, builders — so people actually use it |

### Phase-gate demo (full product vision)

Clean browser → create "The Serenity" → water-heater label → card → house view → anode-rod cadence → trash day → insurance ZIP → Dale: *"tell him he's dreamin'"* → Pool Room. **&lt;5 min, zero accounts, offline.**

### Phase 0 success (this gate)

- Docs complete and reviewed
- Empty app builds and deploys with correct Pages base (`/castle-guide/`)
- Schemas validate in CI; gitleaks clean
- Iso spike proves plugin contract against real dimension data

---

## 3. Personas

| Persona | Must-have day-one value |
|---------|-------------------------|
| Just moved in / buying | Walkthrough onboarding, checklists, area intel |
| Casual tracker | Appliance cards + few reminders in ≤10 min setup |
| Long-time owner | Catalog, age warnings, lineage, resale prep |
| DIY warrior | Fixes, parts, when-NOT-to-DIY, tools |
| Landlord / multi-property | Per-property profiles, turnover checklists |
| Seller | Cap-ex ledger, ROI, curb appeal |
| Realtor (distributor) | Giftable welcome packet, card in footer |
| Maximalist | Builders, soil, law, equity, bunker — tiered in |

---

## 4. Constitution (non-negotiable)

A feature ships only if it improves **RECORD / MAINTAIN / DECIDE / PROTECT** or **DELIGHT** enough that owners actually do the useful work.

1. Data before decoration — renderers never own data.
2. Tier ambition (NOW/LIGHT/BLUEPRINT); every BLUEPRINT has a socket + HUMAN_DIRECTIONS entry.
3. Accuracy — no guess as fact; confidence tiers + sources + as-of dates.
4. Privacy — local-first, no telemetry, no forced accounts, full export/delete. Crime/registry: official links + anti-harassment notice only.
5. Core loop proves itself before deep expansion (gate, not ceiling).

**Conflict policy:** If a request violates the constitution, the agent says so and does not silently comply.

---

## 5. Functional requirements (by domain)

Requirements are labeled with target phase. Tier detail lives in [TIERING.md](./TIERING.md).

### 5.1 Home Record — Phase 1 core

| ID | Requirement |
|----|-------------|
| HR-01 | Multi-profile / multi-property; each property independently exportable |
| HR-02 | Item cards: brand, model, serial, dates, price, came-with-house, lifespan, warranty, photos, manuals, filter specs, service log |
| HR-03 | Replacement lineage: swap archives prior item into history; nothing hard-deleted by default |
| HR-04 | Photo-walkthrough onboarding flow (guided steps) |
| HR-05 | Prompt Pack ingestion: app emits prompt → user pastes JSON → schema validate → import |
| HR-06 | Consumables Locker (filters, bulbs, caulk, paint cards) |
| HR-07 | Dimensions vault (rooms, openings, cutouts, capacities) |
| HR-08 | Docs vault (manuals, receipts, closing, survey, inspection, warranties) |
| HR-09 | Emergency shutoff map (photo + pin + note) |
| HR-10 | Idea notepad + Someday board attachable to rooms/items |
| HR-11 | Pool Room trophy gallery (`poolRoomWorthy`) |
| HR-12 | Full ZIP export/import round-trip |

### 5.2 Maintenance & Ops — Phase 2

| ID | Requirement |
|----|-------------|
| MO-01 | Smart schedules from catalog + climate zone (ZIP) |
| MO-02 | Household ops calendar (trash, bills, tax, insurance, HOA, community) |
| MO-03 | ICS export to Google/Apple/Outlook |
| MO-04 | Seasonal checklists with character commentary |
| MO-05 | Task cards: difficulty, time, DIY vs pro cost, tools, videos, red when-NOT-to-DIY |

### 5.3 Money & Value — Phase 3

| ID | Requirement |
|----|-------------|
| MV-01 | Repair/replace cost library (~100 jobs) with source + date + region note |
| MV-02 | Rebates finder (IRS 25C/25D + DSIRE patterns) sourced |
| MV-03 | Capital improvements ledger → adjusted cost basis explainer |
| MV-04 | Payoff/equity tools (amortization, extra payment, PMI, refi break-even) |
| MV-05 | Dale's Desk quote reviewer vs cost library |
| MV-06 | Price watch (user-logged LIGHT; live pulls BLUEPRINT) |
| MV-07 | Resale ROI guide with cited cost-vs-value data |

### 5.4 Protection — Phase 3

| ID | Requirement |
|----|-------------|
| PR-01 | Insurance readiness packet (ZIP/PDF inventory) |
| PR-02 | Fine-print gotcha library (sourced, dated) |
| PR-03 | Warranty tracker + "still under warranty" task flags |
| PR-04 | Region-appropriate disaster prep |

### 5.5 Knowledge, Land & Law — Phase 5 (seed content earlier)

| ID | Requirement |
|----|-------------|
| KL-01 | Soil/drainage knowledge (Sod Father + Frank) |
| KL-02 | Law vs Nosey Neighbor (Karen) — educational, verify locally |
| KL-03 | Codes/zoning/tax primers with county finders |
| KL-04 | Field guide (bugs/plants/mold) caution-first |
| KL-05 | Wish-I'd-Known library with est. savings |

### 5.6 Neighborhood — Phase 5

| ID | Requirement |
|----|-------------|
| AR-01 | Area dashboard: curated official link hub per property/ZIP |
| AR-02 | Registry awareness via NSOPW + state links + legal notice (hard requirement) |
| AR-03 | User-curated neighborhood socials hub |
| AR-04 | Local rhythm events feed ops calendar |
| AR-05 | Live crime/valuation APIs = BLUEPRINT sockets |

### 5.7 House View — Phase 4 (contract + spike in Phase 0)

| ID | Requirement |
|----|-------------|
| HV-01 | Renderer plugin contract; default isometric |
| HV-02 | Click item → data card; drag-drop with real dims; health overlay |
| HV-03 | House/room naming; materials/colors; list-view equivalent always |
| HV-04 | Pixel skin later; 3D walkthrough BLUEPRINT |

### 5.8 Fun Builders — Phase 5

| ID | Requirement |
|----|-------------|
| FB-01 | Mancave / shed / bunker / treehouse / RV / tiny-home: Budget/Solid/Glory tiers with real numbers |
| FB-02 | Dream Home planner + savings tracker |

### 5.9 AI & Prompt Pack — Phase 1 (manual) / Phase 4 (BYO-key)

| ID | Requirement |
|----|-------------|
| AI-01 | Prompt Pack shipped in `/prompts` (ingestion, enrichment, ideation, builder) |
| AI-02 | Manual mode always works (zero cost, zero lock-in) |
| AI-03 | BYO-key adapters (OpenAI/Anthropic/Google/xAI) browser-only storage |
| AI-04 | Label OCR + photo triage caution-first ("not an inspection") |

### 5.10 Cross-cutting

| ID | Requirement |
|----|-------------|
| XC-01 | Dark + light themes; everything nameable |
| XC-02 | Castle easter eggs lightly salted (Pool Room, Dale, serenity meter, vibe empty-state) |
| XC-03 | Standing disclaimers on Money/Legal/Insurance/Area |
| XC-04 | No secrets in repo; no telemetry; no forced accounts |
| XC-05 | Conventional commits; CHANGELOG every merge |
| XC-06 | GitHub Pages deploy with `base: '/castle-guide/'` — asset 404 = failed gate |

---

## 6. Non-goals (for early phases — not forever)

- Cloud-only lock-in or subscription walls in front of user data
- Undated cost or legal claims
- Harassment tooling built on registry data
- Contractor marketplace (distant BLUEPRINT)
- Hard dependency on any single LLM vendor

---

## 7. Content & accuracy policy (summary)

See [CONTENT_POLICY.md](./CONTENT_POLICY.md).

- **Verified** — primary source URL + as-of date  
- **Typical** — industry ranges; "your market varies"  
- **Regional** — pattern + verify at YOUR county  

**Rule:** Nothing ships marked **Verified** without a real primary-source URL. Sample data in Phase 0 is **typical** only.

---

## 8. Open questions

Do not guess these in implementation. Log decisions as ADRs when resolved.

| # | Question | Phase 0 agent recommendation | Owner decision |
|---|----------|------------------------------|----------------|
| 1 | Renderer default | **Isometric** (ADR-0002); pixel later; 3D BLUEPRINT | Approved isometric |
| 2 | Framework | **Preact + Vite + TS** (ADR-0003) | Approved |
| 3 | Art pipeline | Procedural/SVG + curated portraits; commission pack optional later | **OPEN** |
| 4 | Realtor gift white-label depth | Stub config fields only until owner specifies | **OPEN** |
| 5 | Monetization | No subscriptions in front of data; pay-once vs free/open undecided | **OPEN** |
| 6 | LICENSE | Temporary **All Rights Reserved** until monetization settled | **OPEN** (temp ARR) |
| 7 | Default climate/region content density | US-first ZIP tables; international later? | **OPEN** |
| 8 | Multi-user household (partners sharing one castle) | Out of scope until sync BLUEPRINT | **OPEN** |

---

## 9. Out of constitution — escalate

If a feature request cannot map to RECORD / MAINTAIN / DECIDE / PROTECT / DELIGHT, reject or reframe. If it maps only to DELIGHT but threatens data integrity or privacy, reject.

---

## 10. Phase 0 acceptance checklist

- [x] PRD, ARCHITECTURE, DATA_MODEL, TIERING, CONTENT_POLICY, ROADMAP, AGENTS
- [x] ADR-0001, ADR-0002, ADR-0003
- [x] HUMAN_DIRECTIONS for BLUEPRINT sockets
- [x] Repo scaffold + module READMEs
- [x] Schema CI + honest sample data
- [x] Hello-castle shell + disclaimer + serenity stub
- [x] Iso spike: two rooms, real dims, one clickable appliance
- [x] Pages base `/castle-guide/`; gitleaks in CI; `.gitattributes` eol=lf
- [ ] **Owner review of docs (this gate)**
