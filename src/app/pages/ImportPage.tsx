import { useState } from 'preact/hooks';
import {
  dryRunPromptPackImport,
  commitPromptPackImport,
  type ImportPreview,
  type PromptPackPayload,
} from '../../ai';
import { ensureStorageReady } from '../storageContext';

import { go, href } from '../paths';

const SAMPLE = `{
  "schemaVersion": 1,
  "property": {
    "name": "Sample Home",
    "zip": "46240",
    "rooms": [
      {
        "name": "Utility",
        "type": "utility",
        "dims": { "L": 8, "W": 6, "H": 8 },
        "paintCards": [
          {
            "brand": "Sherwin-Williams",
            "number": "SW 7008",
            "sheen": "eggshell"
          }
        ]
      }
    ],
    "items": [
      {
        "category": "water-heater",
        "roomName": "Utility",
        "brand": "Rheem",
        "model": "XE50T10H45U0",
        "serial": "ABC123",
        "purchaseDate": "2019-05-01",
        "cameWithHouse": false
      }
    ],
    "shutoffs": [
      { "type": "water", "locationNote": "Front wall, red valve" }
    ]
  },
  "assumptions": [],
  "unknowns": []
}`;

export function ImportPage() {
  const [raw, setRaw] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [payload, setPayload] = useState<PromptPackPayload | null>(null);
  const [busy, setBusy] = useState(false);

  function onDryRun() {
    setErrors([]);
    setPreview(null);
    setPayload(null);
    const result = dryRunPromptPackImport(raw);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setPreview(result.preview);
    setPayload(result.payload);
  }

  async function onConfirm() {
    if (!payload) return;
    setBusy(true);
    setErrors([]);
    try {
      const storage = await ensureStorageReady();
      const result = await commitPromptPackImport(storage, payload);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      go('property', result.propertyId, 'house');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section class="page">
      <p class="eyebrow">
        <a href={href()}>← Home</a>
      </p>
      <h1>Prompt Pack import</h1>
      <p class="muted">
        Paste JSON from any LLM. We parse → validate → dry-run preview → you
        confirm. All valid or nothing lands. Markdown fences are stripped
        automatically.
      </p>

      <div class="card">
        <label>
          Pasted JSON
          <textarea
            class="paste-area"
            rows={16}
            value={raw}
            onInput={(e) => setRaw((e.target as HTMLTextAreaElement).value)}
            placeholder="Paste Castle Guide JSON here…"
          />
        </label>
        <div class="btn-row">
          <button type="button" class="btn primary" onClick={onDryRun}>
            Validate & preview
          </button>
          <button
            type="button"
            class="btn"
            onClick={() => setRaw(SAMPLE)}
          >
            Load sample
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div class="card error-card">
          <h2>Validation errors</h2>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p class="muted">Nothing was imported.</p>
        </div>
      )}

      {preview && payload && (
        <div class="card preview-card">
          <h2>Dry-run preview</h2>
          <p>
            <strong>{preview.propertyName}</strong> — {preview.summary}
          </p>
          <ul class="muted">
            <li>{preview.itemCount} items</li>
            <li>{preview.roomCount} rooms</li>
            <li>{preview.paintCardCount} paint cards</li>
            <li>{preview.shutoffCount} shutoffs</li>
          </ul>
          {preview.assumptions.length > 0 && (
            <p>
              Assumptions: {preview.assumptions.join('; ')}
            </p>
          )}
          <button
            type="button"
            class="btn primary"
            disabled={busy}
            onClick={() => void onConfirm()}
          >
            {busy ? 'Importing…' : 'Confirm import'}
          </button>
        </div>
      )}
    </section>
  );
}
