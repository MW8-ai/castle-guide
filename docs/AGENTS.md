# AGENTS — How the machine organizes itself

Castle Guide encourages agentic self-organization. This document is the map for humans and future agents.

---

## 1. Source of truth order

1. Constitution + PRD (`docs/PRD.md`)
2. ADRs (`docs/adr/`) — decisions win over chat memory
3. DATA_MODEL + JSON Schemas (`data/schemas/`)
4. TIERING.md — what to build now
5. HUMAN_DIRECTIONS.md — BLUEPRINT activation
6. Module READMEs under `src/*`

If chat conflicts with docs, **docs win**. Update docs via ADR when changing direction.

---

## 2. Suggested agent roles

| Role | Responsibility | Touch paths |
|------|----------------|-------------|
| **Lead architect** | Phase plans, ADRs, module boundaries | `docs/`, `src/*/README.md` |
| **Schema guardian** | JSON Schema, AJV CI, import validation, migrations | `data/schemas/`, `scripts/`, `src/storage/` |
| **Content research** | Nuggets, costs, legal primers with sources + dates | `data/knowledge/`, `data/costs/`, … |
| **Prompt pack author** | Keep `/prompts` aligned with schemas + conventions | `prompts/` |
| **House view / sprite** | Renderer plugins, procedural art conventions | `src/houseview/`, `assets/`, `spikes/` |
| **Core loop engineer** | Record → maintain path, export/import | `src/record/`, `src/maintain/`, `src/storage/` |

Phase 0: roles are documented; skills may be added under the owner's agent environment later.

---

## 3. Working agreements for agents

- Conventional commits: `feat(record): …`, `docs(adr): …`, `fix(ci): …`
- Update CHANGELOG for user-visible merges
- No secrets in repo; AI keys browser-only
- Prefer LIGHT/BLUEPRINT over cutting scope
- Never mark content `verified` without primary-source URL
- Cross-platform scripts only (Node); LF line endings
- Pages `base: '/castle-guide/'` — broken assets fail the gate

---

## 4. Definition of done (feature)

1. Data model + schema updated if needed  
2. UI renders from data (no hardcoded domain content)  
3. List-view path if house-view interaction added  
4. Tests for validation / core logic  
5. TIERING.md still accurate  
6. Disclaimer present on money/legal/insurance/area surfaces  

---

## 5. Phase gate checklist (human + agent)

- [ ] Demo path works from clean clone  
- [ ] Docs current  
- [ ] CHANGELOG entry  
- [ ] Schemas pass CI  
- [ ] gitleaks clean  
- [ ] TIERING.md current  
- [ ] Open questions logged in PRD  
