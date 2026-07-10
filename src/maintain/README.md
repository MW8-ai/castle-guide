# `src/maintain`

## Owns

- Task auto-schedule from catalog + `/data/maintenance` templates
- Ops calendar expansion + ICS export
- Seasonal checklists (climate-aware)
- Climate zone heuristic from ZIP

## Must never

- Invent undated DIY/pro costs — template costs are **typical** with asOfDate in data
- Soften when-NOT-to-DIY warnings with jokes
- Write storage except via `CastleStorage` APIs called from UI
