# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Real art** in the walk renderer, replacing flat-shape placeholders: CC0 floor textures (wood/tile/stone/metal/grass), furniture sprites (sofa/bed/desk/chair/table/shelf/lamp/picture/plant), and a walking-pose avatar — all baked from CC0 3D models (KayKit, Screaming Brain Studios) via a new reusable `tools/sprite-bake` pipeline (Three.js, matched to the renderer's own isometric camera angle)
- **Art view** (angled painted house illustration + clickable hotspots) is now a real, selectable view on the House page for the Sample Home demo — previously a fully built component (`ImageHouseView`) sat unused, never imported anywhere
- **Multi-story support**: floor tabs (basement/ground/upper/yard) and an outdoor yard room type
- **Drag-and-drop floor plan editor**: reposition rooms with edge-snapping, set wall height, toggle see-through walls, and drag-to-resize a room's footprint (collision-aware — can't be dragged/resized on top of a neighbor)
- **Real first-run onboarding**: the landing page shows an actual "Start my house" vs "Explore sample home" choice instead of auto-redirecting into the demo, and "Start my house" now offers Prompt Pack (paste AI-generated JSON) vs typing it in by hand
- **Prompt Pack import is now reachable** — previously had zero UI entry points anywhere in the app (only reachable by typing `/import` directly); now linked from first-run and from Settings
- **Empty-state House view** for a freshly created home — one clear "add your first room or appliance" CTA instead of a populated-looking HUD with nothing behind it
- **Emergency shutoffs UI** — previously had zero creation path anywhere in the app despite being shown on every House HUD; now addable/removable from Inventory
- **Consumables UI** and **Documents vault UI** (upload/view/remove, backed by real blob storage) — both had working storage methods but no UI anywhere; fully wired now
- Common room chip presets and "Other" field reveals for shutoff/consumable types on Inventory
- General maintenance event form (type/title/frequency) plus a separate recurring-events list on the Maintenance page, and HOA/utility-bill event templates

### Fixed

- Room notes: "someday" notes and a second note for the same room no longer silently disappear
- Item dock: freeform notes and last-service-date were dropped from the UI in the walkable-house rewrite; restored
- Paint line/collection name and sheen dropped from the room dock's paint display; restored
- Avatar no longer stayed facing one direction while walking (`ctx.rotate` had been dropped)
- Equity/Home value stats: a `homeValue` of exactly `0` was treated as "not set" (falsy check instead of `!= null`)
- "Build list" HUD stat was permanently stuck at "—" — the only UI that could set a someday-note budget (`PropertyPage.tsx`) was dead code, never routed; Dream Home planner on the Builders page now persists real notes instead of ephemeral local state
- Mortgage/payoff form silently reset to hardcoded placeholder numbers on every visit instead of loading/saving `property.mortgage`; Equity now actually reflects saved home value
- Dead "Home value" HUD chip removed (its render condition was logically unreachable)
- `travelToRoom` no longer swaps the room dock to the destination before the avatar arrives
- Fixed a stale-load race and removed a no-op `keepRoom` flag on the House page's property loader
- New "glass" pages (Settings/Inventory/Import) no longer render an unstyled, fully-interactive background canvas that hijacked scroll/keyboard input
- Replaced two blocking `window.prompt()` calls (add room, add trash day) with real inline forms
- Ops-calendar events that couldn't be removed once created
- Floor textures visibly slid independently of the room instead of staying anchored to it while the camera panned (canvas pattern was anchored to pixel space instead of world space)
- Cramped, hard-to-hit "✕" remove buttons across every list in the app (shutoffs, consumables, docs, ops-events, dream board) — one shared layout fix
- **Art view / See through walls / Edit floor plan buttons were completely unclickable** — an ancestor's `pointer-events: none` (added so decorative hint text wouldn't block canvas dragging) was silently swallowing clicks on these buttons too
- Bottom-nav clipping: page content (confirm buttons, list items) could render partially or fully underneath the fixed bottom nav because its height was hardcoded instead of measured — now measured via `ResizeObserver` and exposed as CSS variables (`--top-bars-h`, `--bottom-nav-h`) wherever it matters
- **Council chat pushed the room-jump strip completely off-screen** — `.live-council-chat` had zero CSS anywhere (a rename left it and `.live-room-jump` unstyled while old, dead CSS for the pre-rename class names lingered unused); both now have real, non-overlapping positioning
- Two WCAG AA contrast failures in light theme (gold accent text, primary button text)
- Added test coverage for `removeOpsEvent`, floor filtering, floor-plan editor snap/collision math, and demo-seed floor assignment — all shipped with zero tests initially

## [1.2.0] — 2026-07-10

### Added — homeowner command center

- **House HUD**: real home health grade, due-soon counts, catalog size — not XP
- **Up Next rail** on the map with check-off; shutoff quick list
- **Room dock**: finishes/paint, warranty pills on items, richer council tips
- **Item dock**: age, due days, filter size, service log, real ItemCard data
- Inventory grouped by room with sticky detail card
- Walk map: foundation, floor types by room, door cues, health rings, furniture glyphs
- Continuous multi-room walk + labeled bottom nav (from 1.1)

## [1.1.0] — 2026-07-10

### Changed — walk the house (look & feel)

- **Walkable angled iso house** is the main screen (WASD, camera follow, zoom)
- **Enter a room** → dock shows room dims, items, tasks, owner notes, council tip (REF-3 advisors)
- **Click furniture** → ItemCard dock (real brand/model/warranty)
- Map is full-bleed; thin icon rail only — no quest/score chrome, no welcome board
- Opens **straight into the filled sample house** after load
- Council strip along the bottom (quiet tips, not XP)

## [1.0.1] — 2026-07-10

### Changed — art & clarity

- **Visual is the product**: house map is nearly full-viewport; detail panel only when you click something
- Removed welcome / quest board / gamified nav labels (Home · Inventory · Maintenance)
- Sample Home is a **large filled house**: 5 bedrooms, 3 baths, 3 garages + kitchen/living/dining/family/utility/office; couch, fridge, water heater, and many more placed items
- Calmer chrome (no chunky “Press Start” game UI on every surface)

## [1.0.0] — 2026-07-10

### Changed — fun-first product pass (design lead)

- **Title screen** pushes a full Sample Home (never blank forms first)
- **Pixel-game shell**: Press Start vibe, chunky borders, quest language
- **Default map**: angled pixel-iso house with walls, grass/sky, furniture blocks that read as appliances (FR/WH/HV…), pan + zoom, click for cards
- **Stuff bag** inventory grid; **Quest board** for maintenance
- Backend/data rules unchanged — only experience layer redesigned
- Removed random scores / phase chrome / Serenity branding from primary path

## [0.9.1] — 2026-07-10

### Changed

- **Default house view is illustrated art** (angled cutaway from sample painting), not bird’s-eye walker
- Glow **pins** on real appliances; click opens detail card (no green squares-as-fridges)
- Pan + zoom on the painting; removed wall-collision walk mode from the main path
- Sample art lives in `assets/house/sample-home.png`

## [0.9.0] — 2026-07-10

### Changed — playable home, plain English

- **Walk-around map** is the default house view (WASD + scroll zoom + grass)
- Demo renamed **Sample Home** (no Serenity / in-joke branding in UI)
- Demo packed with kitchen, living, bath, bedroom, utility, garage + many appliances
- Sidebar: My Home / Stuff / To-Dos (not phase labels or serenity score)
- Removed corner “Add item / Maintenance” chrome and random health score from house view
- “Ops calendar” → **Home calendar**; friendlier task copy
- Pool Room → Favorites

## [0.8.0] — 2026-07-09

### Changed — UX quality reboot (guided by refs/1–4)

- **Demo starter castle** auto-loads ("The Serenity") with rooms, appliances, placements, tasks, shutoffs, filter size
- **Home** is enter-demo-first, not a blank create-form gauntlet
- **Sidebar app shell** (House / Inventory / Maintenance / …) instead of random top links
- **House View** is the default property screen: centered map, side detail panel, upcoming tasks
- **Inventory** compact quick-add (not 20 fields); Pool Room is a trophy section not a lonely tab
- **Navigation** via preact-router `route()` helpers (fixes view-hop breakage)
- **Canvas** greener stage, room labels, emoji appliance icons, fit-to-center framing
- Stronger text contrast tokens

## [0.7.0] — 2026-07-09

### Added

#### Phase 4 — House View + Council + AI
- Production isometric renderer with drag-drop placements + health overlay
- House view page: click item → catalog card with lineage; list-view a11y twin
- Serenity score from tasks/shutoffs/catalog
- Council page + contextual/seasonal nugget surfacing (Gus)
- BYO-key settings (browser-only) + manual OCR/triage prompt generators

#### Phase 5 — Area + Builders + Polish
- Neighborhood official link hub (FEMA, NSOPW, FBI CDE, etc.) + anti-harassment notice
- User socials links per property
- Law vs Nosey Neighbor fence module (Karen) with source link
- Mancave + bunker builders with Budget/Solid/Glory estimates (Colonel)
- Dream Home wishlist board; realtor gift LIGHT in Settings

#### Phase 6 — Stretch (implemented skins + sockets)
- Retro **pixel** renderer skin (same plugin contract)
- **walk3d** canvas walkthrough plug (WASD); full Three.js still in HUMAN_DIRECTIONS
- Settings panel documents valuation/PWA/sync/Pages BLUEPRINT sockets

### Changed
- App version 0.7.0; footer and export manifest

## [0.4.0] — 2026-07-09

### Added

- Phase 3 Money + Protection: cost library UI, IRS 25C/25D + DSIRE rebate cards (sourced, dated)
- Dale's Desk quote reviewer (fair-dinkum → dreamin' with catchphrase)
- Capital improvements ledger with basis-eligible totals
- Payoff/amortization + extra principal scenarios
- Insurance readiness packet ZIP (inventory + media)
- Warranty tracker flags; insurance gotcha library
- Money & Protect UI at `/property/:id/money`
- CI tests for undated-cost ban, 25C source, Dale dreamin', insurance ZIP, warranties, payoff

## [0.3.0] — 2026-07-09

### Added

- Phase 2 Maintenance + Ops: auto-schedule from catalog + climate zone
- Task templates in `/data/maintenance` (furnace filter with size, anode rod, dryer vent, sump, smoke/CO, gas/panel when-NOT-to-DIY)
- Seasonal checklists with Gus lines (climate-aware)
- Ops calendar: trash/recycling/tax/insurance templates; weekly/monthly/yearly schedules
- ICS export for tasks + ops (Google/Apple/Outlook importable)
- Maintain UI at `/property/:id/maintain`
- CI tests for filter size on task title, trash day calendar, ICS content, when-NOT-to-DIY templates

## [0.2.0] — 2026-07-09

### Added

- Phase 1 Home Record: profiles, multi-property, item catalog, rooms/dimensions, consumables, docs vault, shutoffs, notes/Someday, Pool Room
- `CastleStorage` façade (Dexie IndexedDB + OPFS/IDB blob store); components never touch Dexie/OPFS directly
- Immutable replacement lineage (`replaceItem` snapshots; lineage stripped from updates; soft-deleted items retained in export)
- ZIP export/import with all-or-nothing validation; refuses future `schemaVersion`; reports missing media/manifest
- CI tests: ZIP round-trip with blob SHA-256 + lineage order (IDB blob fallback path), tampered ZIP, future schema
- Prompt Pack import: fence strip → AJV schema → dry-run preview → confirm; human-readable errors; partial import forbidden
- Prompt Pack fixtures + tests (valid, missing brand, extra field, markdown fences)
- Schema migrations scaffold at `schemaVersion` 1
- HUMAN_DIRECTIONS socket #10: push to GitHub + live Pages verification (deferred until push)
- UI: create property, catalog, import paste, import ZIP, export, Pool Room

### Changed

- App version 0.2.0; footer and export manifest appVersion
- ROADMAP Phase 1 opened

## [0.1.0] — 2026-07-09

### Added

- Phase 0 planning deliverables: PRD, ARCHITECTURE, DATA_MODEL, TIERING, CONTENT_POLICY, ROADMAP, AGENTS
- ADRs: storage (0001), renderer default (0002), framework (0003)
- Repo scaffold matching master guide §10 module layout
- JSON Schemas + CI validation for core shipped content types
- Honest sample nuggets/costs marked **typical** (not verified)
- Prompt Pack stubs (ingestion, enrichment, ideation, builder)
- Hello-castle Preact shell with serenity meter stub, themes, disclaimer
- Throwaway isometric spike (`spikes/iso-canvas`) proving renderer-plugin contract
- GitHub Actions: CI (typecheck, schemas, tests, build, gitleaks) + Pages deploy
- Cross-platform line endings (`.gitattributes` eol=lf)
- Temporary All Rights Reserved LICENSE

### Fixed

- Validate iso spike fixture against `house-view-model.schema.json` in CI
- Expand `docs/ROADMAP.md` with per-phase gate proofs (Phase 0 marked PASSED)
