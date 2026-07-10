# `src/app`

## Owns

- Application shell wiring, routing, top-level pages
- Profile switcher (Phase 1+)
- Global settings surface (theme, active renderer id)

## Must never

- Own home-record business rules (those live in domain modules)
- Write IndexedDB except via `src/storage` APIs
- Hardcode knowledge/cost content (load from `/data`)
