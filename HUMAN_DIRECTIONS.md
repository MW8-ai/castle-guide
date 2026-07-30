# HUMAN_DIRECTIONS — BLUEPRINT Socket Activation

Every BLUEPRINT capability ships a **socket** (data hooks + spec) even when the plug is missing. This file tells a human exactly what to do later to activate each socket.

> Status legend: `SOCKET READY` = code/data hooks exist or are specified · `SPEC ONLY` = documented, not yet coded · `DISTANT` = second-company territory

---

## 1. First-person 3D walkthrough renderer

| | |
|---|---|
| **Tier** | BLUEPRINT |
| **Status** | SHIPPED — `walk3d` is a real Three.js `HouseRendererPlugin` (PRs #46, #49), registered and code-split (only downloads if picked), lazily behind `walk3dRendererLazy` in `src/houseview/registry.ts`. |
| **Spec** | `docs/ARCHITECTURE.md` § Renderer Plugin Contract; `docs/adr/ADR-0002.md` |

### What shipped

1. `src/houseview/walk3d/walk3dRenderer.ts` — visible avatar (capsule + head), camera-relative WASD movement with lightweight AABB wall collision, real doors (wall segments split with a gap + frame/leaf), items colored by kind rather than uniform health-green, orbit camera that follows the avatar.
2. Registered as plugin id `walk3d`; iso ↔ walk3d switching loses zero catalog data (same `HouseViewModel` in, same `onSelectItem`/`onSelectRoom` callbacks out).
3. List-view navigation remains primary everywhere else — walk3d is opt-in, not a dependency for core catalog features.
4. A live renderer switcher now sits in the HousePage HUD itself (PR #51) — all 6 registered renderers, one dropdown pick, no Settings detour.

### Do not

- Move item ownership into the 3D scene graph.
- Require WebGL for core catalog features.

---

## 2. Live retail price pulls

| | |
|---|---|
| **Tier** | BLUEPRINT |
| **Status** | SPEC ONLY (LIGHT path: user-logged prices) |

### What a human does later

1. Choose affiliate/API programs per retailer (Home Depot, Lowe's, etc.) — each has separate ToS.
2. Store API keys only in browser Settings → Price Watch (never in repo).
3. Implement adapter behind `src/money/priceWatch/` with the same interface as manual price logs.
4. Keep cost library entries dated; live pulls are supplementary, not replacements for sourced ranges.

---

## 3. Crime & area live data feeds

| | |
|---|---|
| **Tier** | BLUEPRINT (LIGHT = curated official link hub) |
| **Status** | SPEC ONLY |

### What a human does later

1. Enable endpoints as available: FBI Crime Data Explorer, city open-data portals, CityProtect/CrimeMapping where licensed.
2. Paste keys in Settings → Area Intel (browser-only).
3. **Hard requirement:** registry/crime screens stay deadpan professional; always show anti-harassment legal notice; link to NSOPW.gov / state registries — never scrape or rehost offender PII if ToS forbids it.
4. Document refresh cadence and attribution in `/data/area/`.

---

## 4. Home valuation / comps APIs

| | |
|---|---|
| **Tier** | LIGHT now (manual comps + link-outs) · live APIs BLUEPRINT |
| **Status** | SPEC ONLY for live |

### What a human does later

1. Apply for Bridge / ATTOM / Zillow (or successor) API access as a legal entity.
2. Paste key in Settings → Valuation.
3. Map responses into `Property.valuationSnapshots[]` (date, source, estimate, confidence).
4. Never present estimates as appraisals; badge as third-party data with as-of date.

---

## 5. Photo → in-engine 3D / styled asset

| | |
|---|---|
| **Tier** | BLUEPRINT (LIGHT: photo as framed placeable billboard) |
| **Status** | SPEC ONLY |

### What a human does later

1. Evaluate image-to-3D services (or 2D style-transfer for iso sprites).
2. Write asset pipeline: input photo → normalized sprite/mesh → `assets/user-derived/` (local only).
3. Attach result to placement without mutating item identity fields.

---

## 6. Real-time push notifications (PWA)

| | |
|---|---|
| **Tier** | LIGHT reminder path = ICS export · push = BLUEPRINT |
| **Status** | SPEC ONLY |

### What a human does later

1. Generate VAPID key pair; store private key only in deploy secrets (if using a tiny push relay) or document fully-client limitations.
2. Add `vite-plugin-pwa` service worker + notification permission UX.
3. Prefer calendar ICS as the universal default forever; push is convenience, not the system of record.

---

## 7. Cloud sync / accounts

| | |
|---|---|
| **Tier** | BLUEPRINT |
| **Status** | SPEC ONLY (LIGHT: ZIP export/import) |

### What a human does later

1. Threat model first (`docs/adr/` new ADR): home records are burglary maps.
2. Prefer end-to-end encrypted sync (user-held passphrase); provider never sees plaintext.
3. Candidates: custom + Supabase storage of ciphertext, or similar.
4. Accounts must never gate access to local data already on device.
5. No subscriptions in front of the user's own data (constitution + PRD).

---

## 8. Contractor marketplace

| | |
|---|---|
| **Tier** | BLUEPRINT (distant) |
| **Status** | DISTANT |

### What a human does later

This is effectively a second company (supply-side sales, insurance, dispute resolution). Dale's quote reviewer is the product-adjacent substitute. Do not bolt a marketplace onto Castle Guide without a separate business plan.

---

## 9. Purchased / commissioned art pack

| | |
|---|---|
| **Tier** | Optional upgrade path |
| **Status** | SPEC ONLY |

### What a human does later

1. If procedural/SVG quality is insufficient, commission an isometric tile pack + council portraits under a license that allows app distribution.
2. Drop files under `assets/iso/` and `assets/council/`; keep paths data-driven.
3. Never commit copyrighted third-party game assets or trademarked character art.

---

## 10. Push to GitHub + verify Pages URL renders with assets resolving

| | |
|---|---|
| **Tier** | Deferred (not dropped) — parked until the repo is pushed |
| **Status** | DONE — live at `https://mw8-ai.github.io/castle-guide/`, checklist below verified against the real URL. |
| **Spec** | `vite.config.ts` `base: '/castle-guide/'`; `.github/workflows/pages.yml` |

### Verified live

1. `base: '/castle-guide/'` is set; comment documents that 404'd assets fail the gate.
2. `pages.yml` greps built `dist/index.html` for `/castle-guide/` and fails deploy if missing.
3. `https://mw8-ai.github.io/castle-guide/` renders the shell (not blank); page title "Home Guide".
4. DevTools → Network confirmed: `index-*.js` and `index-*.css` return **200**, not 404.
5. Automated: `tests/base-path.test.ts` + Pages workflow check, both green on every push to master.
6. Deploy is on autopilot — every squash-merge to master triggers a fresh Pages build and redeploy; no manual step needed per release.

### Do not

- Change repo name without updating `base` and docs together.

