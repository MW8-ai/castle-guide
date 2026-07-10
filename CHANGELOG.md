# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
