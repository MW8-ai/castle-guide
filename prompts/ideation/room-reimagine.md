# Prompt: Room reimagine (image LLM)

## Purpose

Generate ideation imagery from a room's real dimensions, colors, and photos. Results go to the room inspiration / Someday board — not the system of record for inventory.

## Prompt

```text
Create a photoreal interior concept for a {{roomType}} approximately
{{L}} ft by {{W}} ft with {{H}} ft ceilings.
Existing wall color: {{wallColor}}.
Floor: {{floor}}.
Constraints: keep window/door positions if described: {{openings}}.
Style direction: {{style}}.
Do not change structural walls. This is inspiration only.
```

## Notes

- Save outputs as user media attached to notes, not as inventory items.
- Empty-state copy for inspiration board: "it's the vibe of it."
