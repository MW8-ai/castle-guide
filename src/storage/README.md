# `src/storage`

## Owns

- IndexedDB (Dexie) + OPFS/IDB blob store
- `CastleStorage` façade — **only** public API for persistence
- ZIP export/import (all-or-nothing), schema migrations scaffold (`schemaVersion` 1)
- Lineage freeze + strip on update

## Must never

- Depend on UI modules
- Be imported as `db.ts` / `blobStore.ts` from components (use `CastleStorage` via `src/storage/index.ts`)
- Sync plaintext home records to a server without a new ADR + threat model
- Allow lineage mutation through generic item updates

## Blob backends

- Production: OPFS when available, else IndexedDB blobs
- Tests: force `blobMode: 'idb'` so round-trip CI exercises the fallback path

