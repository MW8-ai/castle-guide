# Architecture — Castle Guide

> **Version:** 0.1.0 · Phase 0  
> **Related ADRs:** [ADR-0001](./adr/ADR-0001.md) Storage · [ADR-0002](./adr/ADR-0002.md) Renderer · [ADR-0003](./adr/ADR-0003.md) Framework

---

## 1. Architectural laws

1. **Data before decoration.** The home record is the system of record. UI and house views are replaceable.
2. **Local-first.** User data lives in the browser. Export/import is the multi-device story until encrypted sync ships.
3. **Shipped content is data.** Knowledge, costs, characters, builders live as JSON under `/data`, schema-validated in CI. UI never hardcodes content strings for those domains.
4. **Renderers are plugins.** No renderer writes storage; host applies validated mutations.
5. **AI is optional.** Manual Prompt Pack path is the zero-cost default; BYO-key is optional.

---

## 2. Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | TypeScript (strict) | |
| UI | Preact + signals | ADR-0003 |
| Build | Vite 6 | |
| Routing | preact-router | |
| User DB | IndexedDB (Dexie or idb) — Phase 1 | ADR-0001 |
| Blobs | OPFS preferred, IDB fallback | photos/PDFs |
| Export | ZIP (JSZip in Phase 1) | |
| Validation | JSON Schema + AJV | CI + runtime import |
| Tests | Vitest | |
| Deploy | GitHub Pages | repo name `castle-guide` |
| Secrets scan | gitleaks | CI required |
| Line endings | LF via `.gitattributes` | Windows dev / Ubuntu CI |

### GitHub Pages base path (gate requirement)

```ts
// vite.config.ts
base: '/castle-guide/',
```

Deployed URL shape: `https://<owner>.github.io/castle-guide/`

**Verification:** After Pages deploy, open the site and confirm JS/CSS load. A blank page with 404 assets is a **FAILED** phase gate, not a pass. Locally, Vite dev also serves under `/castle-guide/` so path bugs surface early.

Asset URLs in code must use Vite's `import.meta.env.BASE_URL` (or relative paths from the bundler) — never hardcode `/assets/...` from site root.

---

## 3. Module boundaries

```
src/
├── app/        # shell, routing, profiles switcher, settings
├── record/     # catalog, lineage, consumables, pool room, notes, dims
├── maintain/   # scheduler, ops calendar, ICS
├── money/      # ledger, costs UI, rebates, Dale, payoff
├── protect/    # insurance packet, warranties, shutoffs, prep
├── knowledge/  # library UI, field guide, law modules
├── area/       # neighborhood dashboard, link hub
├── council/    # character engine, contextual nuggets
├── houseview/  # renderer host + plugins (iso, pixel, walk3d)
├── ai/         # BYO-key adapters + manual prompt mode
├── storage/    # IndexedDB/OPFS, export/import, migrations
└── ui/         # shared components, themes, disclaimer, serenity meter
```

### Dependency rules

| Module | May import | Must never |
|--------|------------|------------|
| `storage` | schemas, pure types | UI, houseview |
| `record` / `maintain` / … | `storage`, `ui`, domain types | other domains' private UI |
| `houseview/*` | plugin contract types, read models | `storage` writes |
| `ai` | schemas for validate-on-import | assume keys exist |
| `app` | all feature modules as routes | business rules owned by domains |

Each module README states **owns** / **must never do**.

---

## 4. Data flow

```
┌─────────────┐     import/validate      ┌──────────────┐
│  /data JSON │ ───────────────────────► │ Content cache│
│  (shipped)  │                          └──────┬───────┘
└─────────────┘                                 │
                                                ▼
┌─────────────┐   mutations (validated)  ┌──────────────┐
│ Prompt Pack │ ───────────────────────► │  Home record │
│ paste/OCR   │                          │  (IndexedDB) │
└─────────────┘                          └──────┬───────┘
                                                │
                     read models                │
         ┌──────────────────────────────────────┤
         ▼                                      ▼
┌─────────────────┐                    ┌────────────────┐
│ List / form UI  │                    │ Renderer host  │
│ (accessible)    │◄── same events ───►│ iso|pixel|3d   │
└─────────────────┘                    └────────────────┘
```

---

## 5. Renderer plugin contract

Formal TypeScript shape (implemented in `src/houseview/types.ts`, exercised by `spikes/iso-canvas`):

```ts
/** Read-only view; host owns mutation */
export interface HouseViewModel {
  houseName: string;
  rooms: Array<{
    id: string;
    name: string;
    dims: { L: number; W: number; H: number }; // feet (or documented unit)
    materials?: { floor?: string; wall?: string; trim?: string };
  }>;
  placements: Array<{
    id: string;
    roomId: string;
    itemId: string;
    label: string;
    x: number; // feet from room origin
    y: number;
    z?: number;
    rotation: number; // degrees
    footprint: { L: number; W: number };
  }>;
  healthByItemId: Record<string, 'ok' | 'due' | 'overdue'>;
}

export interface HouseRendererCallbacks {
  onSelectItem: (itemId: string) => void;
  onSelectRoom: (roomId: string) => void;
  onMovePlacement: (
    placementId: string,
    next: { x: number; y: number; rotation: number }
  ) => void;
}

export interface HouseRendererPlugin {
  id: string; // 'iso' | 'pixel' | 'walk3d'
  label: string;
  mount: (
    el: HTMLElement,
    model: HouseViewModel,
    cb: HouseRendererCallbacks
  ) => HouseRendererHandle;
}

export interface HouseRendererHandle {
  update: (model: HouseViewModel) => void;
  destroy: () => void;
}
```

### Rules

1. Plugins **must not** import `storage` or write IndexedDB.
2. Switching `activeRendererId` in settings must not rewrite property JSON.
3. Data model stores 3D-ready fields now (`H`, optional `z`) even if default view is 2.5D iso.
4. Every house-view interaction has a **list-view equivalent**.
5. Health overlay colors: ok = neutral, due = amber, overdue = red (serenity meter aggregates this).

### Spike proof (Phase 0)

`spikes/iso-canvas` mounts two rooms from real dims and one clickable appliance placement. Its job is contract proof, not polish.

---

## 6. Storage strategy (summary)

See [ADR-0001](./adr/ADR-0001.md).

- Structured user data → IndexedDB
- Media → OPFS / IDB blobs
- Export package → ZIP with `manifest.json` + `schemaVersion` + per-property JSON + `media/`
- AI keys → browser only; excluded from default export
- Shipped `/data` → immutable from app's perspective (updates via app release)

---

## 7. AI layer

```
Feature request
    │
    ├─► Manual mode (default): generate prompt from /prompts + context
    │         user runs external LLM → paste → AJV validate → import
    │
    └─► BYO-key mode (optional): same schema target via adapter
              key in browser settings only
```

Adapters: OpenAI / Anthropic / Google / xAI — same `AiAdapter` interface. Failures fall back to manual mode copy.

---

## 8. CI & quality gates

| Gate | Tool |
|------|------|
| Typecheck | `tsc -b` |
| Unit + schema tests | Vitest |
| Schema validation of `/data` | `npm run validate:schemas` (AJV) |
| Secrets | **gitleaks** in GitHub Actions |
| Build | `vite build` with `base: '/castle-guide/'` |
| Deploy | `pages.yml` → GitHub Pages |

Cross-platform: all npm scripts are Node-based (no bash/PowerShell-only scripts).

---

## 9. Security & privacy

- No telemetry in Phase 0–5 design.
- No forced accounts.
- Full delete = wipe IDB + OPFS for profile/property.
- Registry/crime: outbound links to official sources + standing legal notice.
- Treat home record as sensitive: export warnings in UI (Phase 1).

---

## 10. Theming & tone surfaces

| Surface | Tone |
|---------|------|
| Characters, empty states, builders, loading lines | Warm, funny, Castle nods |
| Cost tables, legal, insurance, safety, registry/crime | Deadpan professional |
| Serenity meter | Home-health score; "How's the serenity?" |

---

## 11. Future sockets (see HUMAN_DIRECTIONS.md)

Encrypted sync, live valuation/crime APIs, PWA push, walk3d plugin, photo→asset pipeline, contractor marketplace (distant).
