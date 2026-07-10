# `src/ai`

## Owns

- Prompt Pack paste import: parse → schema validate → dry-run preview → confirm
- Human-readable validation errors (never raw AJV)
- Markdown fence stripping
- BYO-key adapters (Phase 4 socket)

## Must never

- Silently accept invalid JSON
- Partial imports (all valid or nothing)
- Require a key for core features
- Persist keys outside the browser or into default exports
- Commit secrets

