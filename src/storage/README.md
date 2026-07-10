# `src/storage`

## Owns

- IndexedDB/OPFS repositories, export/import ZIP, schema migrations

## Must never

- Depend on UI modules
- Sync plaintext home records to a server without a new ADR + threat model
