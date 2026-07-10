/**
 * BYO AI keys — browser only. Never export in default ZIP (profile strips aiKeys).
 */

const STORAGE_KEY = 'castle-guide-ai-keys';

export type AiProvider = 'openai' | 'anthropic' | 'google' | 'xai';

export type AiKeyBag = Partial<Record<AiProvider, string>>;

export function loadAiKeys(): AiKeyBag {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AiKeyBag;
  } catch {
    return {};
  }
}

export function saveAiKeys(keys: AiKeyBag): void {
  const cleaned: AiKeyBag = {};
  for (const [k, v] of Object.entries(keys)) {
    if (v && v.trim()) cleaned[k as AiProvider] = v.trim();
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
}

export function clearAiKeys(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasAnyKey(keys: AiKeyBag = loadAiKeys()): boolean {
  return Object.values(keys).some((v) => Boolean(v));
}

/**
 * LIGHT OCR / label assist: without a key, returns a Prompt Pack string.
 * With a key present, still defaults to manual mode unless caller uses fetch (Phase 4 keeps manual primary).
 */
export function buildLabelOcrPrompt(context?: string): string {
  return [
    'Extract appliance label fields from the attached photo or description.',
    'Return ONLY JSON:',
    '{ "brand": string|null, "model": string|null, "serial": string|null, "category": string|null, "notes": string|null }',
    'Prefer null over guessing.',
    context ? `Context: ${context}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildPhotoTriagePrompt(): string {
  return [
    'You are a caution-first home photo triage assistant — NOT an inspector.',
    'Given a home photo description, respond with JSON only:',
    '{ "impression": "normal"|"watch"|"call-pro", "summary": string, "disclaimer": "Not an inspection. Verify with a licensed professional." }',
    'When unsure, prefer "watch" or "call-pro". Never diagnose structural failure as certain.',
  ].join('\n');
}
