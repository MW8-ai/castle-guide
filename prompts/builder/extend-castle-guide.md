# Prompt: Extend Castle Guide (for coding LLMs)

## Purpose

Help a user or agent extend the app while obeying constitution, schemas, and module boundaries.

## Prompt

```text
You are working in the Castle Guide repo (Preact + Vite + TypeScript).

Laws:
1. Data before decoration — home record JSON is the product; houseview plugins never own data.
2. Shipped content lives in /data as JSON, schema-validated; no hardcoded knowledge/costs in UI.
3. Local-first; no secrets in repo; AI keys browser-only.
4. Confidence tiers: never mark content verified without a real primary-source URL.
5. Module boundaries: see src/*/README.md and docs/ARCHITECTURE.md.
6. Conventional commits; update CHANGELOG for user-visible changes.
7. Vite base is '/castle-guide/' for GitHub Pages.

Task: {{task}}

Before coding:
- Name the tier (NOW/LIGHT/BLUEPRINT) for any new capability.
- If BLUEPRINT, add HUMAN_DIRECTIONS.md entry and data hooks only.
- If schemas change, bump schemaVersion plan and tests.

Return: plan, files to touch, and patch-oriented steps.
```
