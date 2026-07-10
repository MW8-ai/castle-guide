# Castle Guide

> *Your castle. Cataloged, maintained, defended, and leveled up.*

**How's the serenity?** — yes, THAT Castle. A local-first homeowner companion: structured home record first, swappable house-view renderers second.

| | |
|---|---|
| **Status** | Phase 1 — Home Record |
| **Version** | 0.2.0 |
| **Stack** | Preact · Vite · TypeScript · IndexedDB/OPFS (planned) |
| **Default house view** | Isometric sim (ADR-0002) |
| **Repo name / Pages base** | `castle-guide` → `base: '/castle-guide/'` |

## Quickstart

```bash
npm install
npm run dev
```

Open the local URL Vite prints (default `http://localhost:5173/castle-guide/`).

```bash
npm run ci          # typecheck + schemas + tests + build
npm run spike:iso   # throwaway isometric contract spike
```

## Vision (one paragraph)

Walk around your house with your phone, photograph appliance labels, rooms, paint cans, and panels — then (via the Prompt Pack + optional AI) turn that walk into a complete structured home record. From there: maintenance brain, money co-pilot, neighborhood awareness, and a council of expert characters who actually save money. Serious enough for realtors to gift; fun enough to open when nothing is broken.

## Constitution (summary)

1. **Data before decoration** — schema-validated home record is the product; visuals are renderer plugins.
2. **Tiered ambition** — NOW / LIGHT / BLUEPRINT; never amputate ideas.
3. **Accuracy** — sources, as-of dates, confidence tiers on cost/legal/insurance content.
4. **Privacy** — local-first, no telemetry, no forced accounts, full export/delete.
5. **Core loop first** — add item → see it in the house → right reminder → check off.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/PRD.md](docs/PRD.md) | Requirements + open questions |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, modules, renderer contract |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Entities + export package |
| [docs/TIERING.md](docs/TIERING.md) | NOW / LIGHT / BLUEPRINT map |
| [docs/CONTENT_POLICY.md](docs/CONTENT_POLICY.md) | Accuracy & sourcing rules |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phases 0–6 |
| [docs/AGENTS.md](docs/AGENTS.md) | How agents organize work |
| [docs/adr/](docs/adr/) | Architecture decision records |
| [HUMAN_DIRECTIONS.md](HUMAN_DIRECTIONS.md) | BLUEPRINT activation steps |
| [CHANGELOG.md](CHANGELOG.md) | Keep a Changelog |

## Demo script (target — not Phase 0)

Clean browser → create "The Serenity" → snap water-heater label → card auto-fills → house view shows it → anode-rod task at year-4 cadence → trash day on calendar → export insurance packet → Dale reviews a roofing quote: *"tell him he's dreamin'"* → something great goes straight to the pool room. Under five minutes, zero accounts, works offline.

## License

All Rights Reserved (temporary). See [LICENSE](LICENSE) and PRD open questions on monetization.

## Disclaimer

Castle Guide provides general educational information about home ownership, maintenance, costs, taxes, insurance, safety, and regulations. It is not legal, tax, financial, insurance, or engineering advice. Verify with licensed professionals and local authorities before acting.

---

*"Any home can be a castle when the king and queen keep the receipts." — Grandpa Gus, probably*
