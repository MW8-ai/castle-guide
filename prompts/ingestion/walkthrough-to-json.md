# Prompt: Walkthrough photos/notes → Castle Guide property JSON

## Purpose

Turn a homeowner's photo walkthrough notes (and optional LLM vision of labels) into JSON that Castle Guide can validate and import.

## Instructions for the user

1. Copy everything under **Prompt** below into any LLM.
2. Attach or describe your photos/notes.
3. Paste the model's JSON response into Castle Guide → Import (Phase 1 UI).
4. The app validates against schema before saving.

## Prompt

```text
You are helping create a Castle Guide home record. Return ONLY valid JSON
(no markdown fences) matching this shape:

{
  "schemaVersion": 1,
  "property": {
    "name": string,
    "zip": string | null,
    "yearBuilt": number | null,
    "rooms": [
      {
        "name": string,
        "type": string,
        "dims": { "L": number, "W": number, "H": number },
        "paintCards": [
          { "brand": string, "line": string, "number": string, "sheen": string, "room": string, "date": string | null }
        ]
      }
    ],
    "items": [
      {
        "category": string,
        "roomName": string | null,
        "brand": string | null,
        "model": string | null,
        "serial": string | null,
        "purchaseDate": string | null,
        "cameWithHouse": boolean | null,
        "filterSpecs": [{ "name": string, "sizeOrModel": string }],
        "notes": string | null
      }
    ],
    "shutoffs": [
      { "type": "water"|"gas"|"electric-main"|"breaker-panel"|"sump"|"septic"|"other", "locationNote": string }
    ]
  },
  "assumptions": string[],
  "unknowns": string[]
}

Rules:
- Prefer null over guessing serial numbers or dimensions.
- List every assumption in assumptions[].
- Units for dims are feet.
- If a label is unreadable, put the item with nulls and explain in unknowns[].
```

## Validation notes

- Phase 1 maps `roomName` → `roomId` on import.
- Reject if `schemaVersion` missing or dims ≤ 0.
