# Roadmap — Castle Guide

| Phase | Name | Ships | Gate proof |
|-------|------|-------|------------|
| **0** | Planning | Docs, ADRs, scaffold, CI, Pages hello shell, iso spike | Owner reviews docs; app deploys with working assets under `/castle-guide/` |
| **1** | Home Record | Profiles, items + lineage, consumables, vaults, shutoffs, notepad, Pool Room, ZIP export/import, Prompt Pack v1 | Appliance via paste LLM JSON (or photo path LIGHT) in &lt;2 min; export/import round-trips |
| **2** | Maintenance + Ops | Auto-schedule, seasonal checklists, task cards, ops calendar, ICS | Furnace filter + trash day land in a real calendar |
| **3** | Money + Protection | Cost library, rebates, ledger, payoff, Dale, insurance packet, warranties | Insurance ZIP; 25C explained w/ source; Dale flags padded quote |
| **4** | House View + Council + AI | Iso renderer full, drag-drop, health overlay, nuggets, BYO-key OCR + manual | Click fridge → card w/ lineage; Gus seasonal nugget |
| **5** | Area + Builders + Polish | Neighborhood hub, law module, builders, dream home, realtor gift LIGHT | Colonel prices Glory mancave; Karen fence dispute w/ statute link |
| **6** | Stretch | Pixel skin, walk3d plug, PWA push, encrypted sync, live valuation sockets | Per ADR |

## Demo script (product-complete vision)

Clean browser → "The Serenity" → water-heater label → card → house view → anode rod year-4 → trash day → insurance packet → Dale *"tell him he's dreamin'"* → Pool Room. &lt;5 minutes, zero accounts, offline.

## Versioning

- Phase gates bump **minor** (0.1.0 Phase 0 → 0.2.0 Phase 1, …).
- Breaking schema changes bump `schemaVersion` in export manifest and ship migrations.
