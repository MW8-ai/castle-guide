# Phase 1.5 triage — Design Bible corrective

**Date:** 2026-07-10  
**Source:** `docs/DESIGN_BIBLE.md` (from CASTLE_GUIDE_DESIGN_BIBLE.md)

## Step 1 — Data gate (`npm run ci`)

| Check | Result |
|-------|--------|
| Typecheck | PASS |
| Schema validation | PASS |
| Unit tests | **53/53 PASS** |
| Production build | PASS |

**Survives untouched (data before decoration):**
- IndexedDB / OPFS storage façade
- ZIP export/import + lineage immutability
- Prompt Pack dry-run + fixtures
- Maintenance scheduler / money / protect modules
- Demo seed content model

**Condemned (do not iterate — rebuild per bible):**
- Current ad-hoc pages under `src/app/pages` (except kit)
- Current gray/admin UI patterns in `src/ui/styles.css` (to be replaced by shell + kit after kit gate)

## Step 2 — Kit gate (HARD STOP)

- Route: **`/castle-guide/kit`**
- Components: bible §5 list implemented under `src/ui/kit/`
- Themes: Hearthlight + Nightwatch tokens (`src/ui/tokens/tokens.css`)
- Owner action: screenshot both themes → approve → then house screen + re-home

## Not started yet (after kit approval)

- C. House screen in game shell
- D. Re-home Phase 1 features into kit components
- E. `docs/design-critique.md` per-screen self-critique
