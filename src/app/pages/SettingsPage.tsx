import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import {
  loadAiKeys,
  saveAiKeys,
  clearAiKeys,
  buildLabelOcrPrompt,
  buildPhotoTriagePrompt,
  type AiKeyBag,
} from '../../ai';
import { listRenderers } from '../../houseview';

const base = import.meta.env.BASE_URL;

export function SettingsPage() {
  const [keys, setKeys] = useState<AiKeyBag>({});
  const [agentName, setAgentName] = useState('');
  const [brokerage, setBrokerage] = useState('');
  const [phone, setPhone] = useState('');
  const [rendererId, setRendererId] = useState('iso');
  const [ocrPrompt, setOcrPrompt] = useState('');
  const [triagePrompt, setTriagePrompt] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setKeys(loadAiKeys());
    setOcrPrompt(buildLabelOcrPrompt());
    setTriagePrompt(buildPhotoTriagePrompt());
    void (async () => {
      const s = await ensureStorageReady();
      const p = await s.getProfile();
      if (p?.settings.realtorGift) {
        setAgentName(p.settings.realtorGift.agentName ?? '');
        setBrokerage(p.settings.realtorGift.brokerage ?? '');
        setPhone(p.settings.realtorGift.phone ?? '');
      }
      setRendererId(p?.settings.activeRendererId ?? 'iso');
    })();
  }, []);

  function saveKeys() {
    saveAiKeys(keys);
    setMsg('AI keys saved in this browser only (never in export by default).');
  }

  async function saveRealtor() {
    const s = await ensureStorageReady();
    await s.updateRealtorGift({
      agentName,
      brokerage,
      phone,
    });
    setMsg('Realtor gift footer saved (LIGHT white-label).');
  }

  async function saveRenderer() {
    const s = await ensureStorageReady();
    await s.setRendererPreference(rendererId);
    setMsg(`Default renderer: ${rendererId}`);
  }

  return (
    <section class="page">
      <p class="eyebrow">
        <a href={base}>← Home</a>
      </p>
      <h1>Settings</h1>

      {msg && <p class="ok-text">{msg}</p>}

      <div class="card">
        <h2>House renderer default</h2>
        <select
          value={rendererId}
          onChange={(e) =>
            setRendererId((e.target as HTMLSelectElement).value)
          }
        >
          {listRenderers().map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <button type="button" class="btn primary" onClick={() => void saveRenderer()}>
          Save renderer
        </button>
      </div>

      <div class="card">
        <h2>BYO AI keys (optional)</h2>
        <p class="muted">
          Manual Prompt Pack mode always works with zero keys. Keys stay in
          localStorage only.
        </p>
        {(['openai', 'anthropic', 'google', 'xai'] as const).map((p) => (
          <label key={p} class="form-grid">
            {p}
            <input
              type="password"
              autocomplete="off"
              value={keys[p] ?? ''}
              onInput={(e) =>
                setKeys((k) => ({
                  ...k,
                  [p]: (e.target as HTMLInputElement).value,
                }))
              }
              placeholder={`${p} API key`}
            />
          </label>
        ))}
        <div class="btn-row">
          <button type="button" class="btn primary" onClick={saveKeys}>
            Save keys
          </button>
          <button
            type="button"
            class="btn danger"
            onClick={() => {
              clearAiKeys();
              setKeys({});
              setMsg('Keys cleared.');
            }}
          >
            Clear keys
          </button>
        </div>
      </div>

      <div class="card">
        <h2>Label OCR / photo triage (manual mode)</h2>
        <p class="muted">
          Copy into any LLM. Photo triage is informational, not an inspection.
        </p>
        <h3>Label OCR prompt</h3>
        <pre class="code-block">{ocrPrompt}</pre>
        <h3>Photo triage prompt</h3>
        <pre class="code-block">{triagePrompt}</pre>
      </div>

      <div class="card">
        <h2>Realtor gift mode (LIGHT)</h2>
        <p class="muted">Shows in gift footer when set — white-label depth OPEN.</p>
        <div class="form-grid">
          <label>
            Agent name
            <input
              value={agentName}
              onInput={(e) => setAgentName((e.target as HTMLInputElement).value)}
            />
          </label>
          <label>
            Brokerage
            <input
              value={brokerage}
              onInput={(e) => setBrokerage((e.target as HTMLInputElement).value)}
            />
          </label>
          <label>
            Phone
            <input
              value={phone}
              onInput={(e) => setPhone((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
        <button type="button" class="btn primary" onClick={() => void saveRealtor()}>
          Save realtor card
        </button>
      </div>

      <div class="card">
        <h2>Stretch sockets (Phase 6)</h2>
        <ul class="plain-list">
          <li>
            <strong>Live valuation APIs</strong> — BLUEPRINT; manual comps +
            link-outs only. See HUMAN_DIRECTIONS.
          </li>
          <li>
            <strong>PWA push</strong> — BLUEPRINT; ICS remains the default
            reminder path.
          </li>
          <li>
            <strong>Encrypted sync</strong> — BLUEPRINT; ZIP export/import works
            today.
          </li>
          <li>
            <strong>GitHub Pages live verify</strong> — deferred until push
            (HUMAN_DIRECTIONS §10).
          </li>
        </ul>
      </div>
    </section>
  );
}
