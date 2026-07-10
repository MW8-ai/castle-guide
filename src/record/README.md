# `src/record`

## Owns

- Phase 1 catalog UX lives under `src/app/pages` (PropertyPage) using `CastleStorage`
- Domain helpers may land here as the module grows

## Must never

- Touch Dexie/OPFS directly
- Hardcode knowledge content
- Delete lineage history on replacement (archive via `CastleStorage.replaceItem`)
- Implement house-view renderers (out of Phase 1 scope)

