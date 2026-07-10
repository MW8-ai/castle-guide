# Prompt: Model number enrichment

## Purpose

Given a brand + model (and optional serial), propose lifespan, filter sizes, common failures, and manual URL candidates. Output must stay educational and dated.

## Prompt

```text
Given this appliance:
Brand: {{brand}}
Model: {{model}}
Category: {{category}}

Return ONLY JSON:
{
  "lifespanYrsTypical": number | null,
  "filterSpecs": [{ "name": string, "sizeOrModel": string }],
  "commonFailures": string[],
  "manualUrlCandidates": string[],
  "sources": [{ "url": string, "date": string, "label": string }],
  "asOfDate": string,
  "confidence": "typical" | "verified" | "regional",
  "caveats": string[]
}

Rules:
- Use confidence "verified" only with a real manufacturer or primary URL.
- Prefer "typical" when synthesizing industry norms.
- Never invent a manual URL; omit if unknown.
- asOfDate is today or the source date, ISO YYYY-MM-DD.
```
