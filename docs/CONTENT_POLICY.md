# Content Policy — Accuracy Backbone

> Expands master guide §9. Enforced by schema + CI, not honor system.

---

## 1. Confidence tiers

| Tier | Badge | When to use | Required fields |
|------|-------|-------------|-----------------|
| **Verified** | Green / "Verified" | Primary source: IRS, statute, manufacturer, DSIRE entry, official agency | `sources[]` with real URL, `asOfDate`, `confidence: verified` |
| **Typical** | Amber / "Typical" | Industry-standard ranges (costs, lifespans, rules of thumb) | `sources[]` (may be secondary), `asOfDate`, region/variance note in body or `regionNote` |
| **Regional** | Blue / "Regional" | Zoning, permits, HOA patterns, local costs | `sources[]`, `asOfDate`, explicit "verify at YOUR county/state" framing |

### Hard rules

1. **No cost without a date.**
2. **No legal claim without a jurisdiction qualifier** (state/county/HOA).
3. **Nothing marked Verified without a real primary-source URL.** Placeholder URLs are forbidden for `verified`.
4. **Sample/seed data in repo must use `typical` or `regional`** until a human or research agent attaches real primary sources.
5. Region-dependent content must say so in UI.

---

## 2. Schema enforcement

JSON Schemas under `data/schemas/` require:

- `sources` minItems: 1  
- `asOfDate` format: date  
- `confidence` enum  

CI script `npm run validate:schemas` fails the build on violations.

Additional lint (Phase 1+): if `confidence === 'verified'`, each source URL must be `http`/`https` and not match denylist (`example.com`, `localhost`, `TBD`, `TODO`).

---

## 3. UI presentation

- Confidence badge on every nugget, cost row, and legal card.
- "Your market varies" on typical costs.
- Standing disclaimer component on Money, Legal, Insurance, Area screens (master guide §15 text).
- Registry / crime screens: professional tone + anti-harassment notice always visible.

---

## 4. Humor boundaries

| Allowed | Forbidden |
|---------|-----------|
| Characters, empty states, loading lines, builders, Pool Room | Cost tables |
| Serenity meter chrome | Legal/insurance/safety body copy |
| Dale verdict flavor after numeric compare | Registry/crime content |

---

## 5. Photo triage & AI

- Photo triage is **informational, not an inspection**.
- Caution-first copy; prefer "consider a pro" over diagnosis.
- AI outputs validated against schema before merge; user confirms import.

---

## 6. Disclaimer (canonical)

> Castle Guide provides general educational information about home ownership, maintenance, costs, taxes, insurance, safety, and regulations. It is not legal, tax, financial, insurance, or engineering advice. Costs and laws vary by location and change over time; verify with your local building department, a licensed professional, or a qualified advisor before acting. Photo triage is informational, not an inspection. Crime and registry links point to official public sources; registry information may not lawfully be used to harass or commit any crime against any person.
