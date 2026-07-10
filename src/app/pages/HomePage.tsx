import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Property } from '../../storage';
import {
  ensureDemoCastle,
  resetDemoCastle,
  DEMO_PROPERTY_NAME,
} from '../../record/demoSeed';
import { go, href } from '../paths';
import { useActiveCastle } from '../ActiveCastle';

export function HomePage() {
  const { refresh, setPropertyId } = useActiveCastle();
  const [properties, setProperties] = useState<Property[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const s = await ensureStorageReady();
    let list = await s.listProperties();
    if (list.length === 0) {
      await ensureDemoCastle(s);
      list = await s.listProperties();
      await refresh();
    }
    setProperties(list);
  }

  useEffect(() => {
    void load();
  }, []);

  async function openHome(id: string) {
    await setPropertyId(id);
    go('property', id, 'house');
  }

  async function openDemo() {
    setBusy(true);
    try {
      const s = await ensureStorageReady();
      const demo = await ensureDemoCastle(s);
      // Force rebuild if old thin demo
      if (demo.items.length < 8) {
        const rebuilt = await resetDemoCastle(s);
        await refresh();
        go('property', rebuilt.id, 'house');
        return;
      }
      await refresh();
      go('property', demo.id, 'house');
    } finally {
      setBusy(false);
    }
  }

  async function resetDemo() {
    if (!confirm('Reload the sample home with full demo furniture and appliances?'))
      return;
    setBusy(true);
    try {
      const s = await ensureStorageReady();
      const demo = await resetDemoCastle(s);
      await refresh();
      await load();
      go('property', demo.id, 'house');
    } finally {
      setBusy(false);
    }
  }

  async function blankHome() {
    const name = prompt('Name this home', 'My House');
    if (!name?.trim()) return;
    setBusy(true);
    try {
      const s = await ensureStorageReady();
      const p = await s.createProperty(name.trim(), null);
      await refresh();
      go('property', p.id, 'house');
    } finally {
      setBusy(false);
    }
  }

  const demo = properties.find((p) => p.name === DEMO_PROPERTY_NAME);
  const others = properties.filter((p) => p.name !== DEMO_PROPERTY_NAME);

  return (
    <section class="page home-v2">
      <header class="home-hero">
        <p class="eyebrow">Home Guide</p>
        <h1>Walk through a real house — not a blank form.</h1>
        <p class="tagline">
          The sample home is packed with kitchens, utilities, appliances, and
          to-dos. Move around like a game, click stuff you own, then replace the
          demo with your own place when you’re ready.
        </p>
      </header>

      <div class="home-cta-row">
        <button
          type="button"
          class="btn primary big"
          disabled={busy}
          onClick={() => void openDemo()}
        >
          {busy ? 'Opening…' : '▶ Play sample home'}
        </button>
        <button
          type="button"
          class="btn big"
          disabled={busy}
          onClick={() => void blankHome()}
        >
          Start empty home
        </button>
      </div>

      <div class="home-guide card">
        <h2>60-second tour</h2>
        <ol class="steps">
          <li>
            <strong>Walk</strong> with WASD or arrow keys inside the house map.
          </li>
          <li>
            <strong>Zoom</strong> with the mouse wheel until rooms feel roomy.
          </li>
          <li>
            <strong>Click</strong> the fridge or water heater for brand, model,
            warranty.
          </li>
          <li>
            <strong>Stuff</strong> in the left menu adds rooms and items without
            a tax-form UI.
          </li>
        </ol>
      </div>

      {demo && (
        <div class="card home-demo-card">
          <div class="home-demo-head">
            <div>
              <h2>{demo.name}</h2>
              <p class="muted">
                {demo.rooms.length} rooms ·{' '}
                {demo.items.filter((i) => i.active).length} items · ready to
                explore
              </p>
            </div>
            <div class="btn-row">
              <button
                type="button"
                class="btn primary"
                onClick={() => void openHome(demo.id)}
              >
                Open
              </button>
              <button type="button" class="btn" onClick={() => void resetDemo()}>
                Reload full sample
              </button>
            </div>
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div class="card">
          <h2>Your homes</h2>
          <ul class="castle-list">
            {others.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  class="castle-row"
                  onClick={() => void openHome(p.id)}
                >
                  <strong>{p.name}</strong>
                  <span class="muted">
                    {p.items.filter((i) => i.active).length} items ·{' '}
                    {p.rooms.length} rooms
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p class="home-advanced muted">
        Power users:{' '}
        <a href={href('import')}>Import from a chat checklist</a>
        {' · '}
        <a href={href('import-zip')}>Import backup ZIP</a>
      </p>
    </section>
  );
}
