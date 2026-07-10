import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Property } from '../../storage';
import { ensureDemoCastle, resetDemoCastle, DEMO_PROPERTY_NAME } from '../../record/demoSeed';
import { go, href } from '../paths';
import { useActiveCastle } from '../ActiveCastle';
import { computeSerenity } from '../../houseview';

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

  async function openCastle(id: string) {
    await setPropertyId(id);
    go('property', id, 'house');
  }

  async function openDemo() {
    setBusy(true);
    try {
      const s = await ensureStorageReady();
      const demo = await ensureDemoCastle(s);
      await refresh();
      go('property', demo.id, 'house');
    } finally {
      setBusy(false);
    }
  }

  async function resetDemo() {
    if (!confirm('Reset The Serenity demo castle to factory starter data?')) return;
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

  async function blankCastle() {
    const name = prompt('Name your castle', 'My Castle');
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
        <p class="eyebrow">How's the serenity?</p>
        <h1>Your castle starts with a map, not a spreadsheet.</h1>
        <p class="tagline">
          Explore a fully filled demo home. Click appliances. Drag things around.
          Add rooms when you are ready — not before you understand what this is.
        </p>
      </header>

      <div class="home-cta-row">
        <button
          type="button"
          class="btn primary big"
          disabled={busy}
          onClick={() => void openDemo()}
        >
          {busy ? 'Opening…' : '▶ Enter demo castle'}
        </button>
        <button
          type="button"
          class="btn big"
          disabled={busy}
          onClick={() => void blankCastle()}
        >
          Start empty castle
        </button>
      </div>

      <div class="home-guide card">
        <h2>What you can do in 60 seconds</h2>
        <ol class="steps">
          <li>
            <strong>House View</strong> — click the fridge / water heater for a
            real card (brand, warranty, lineage later).
          </li>
          <li>
            <strong>Drag</strong> an appliance to move it on the floor plan.
          </li>
          <li>
            <strong>Inventory</strong> — add one item with a short form (not 20
            fields).
          </li>
          <li>
            <strong>Maintenance</strong> — see the demo filter task already due
            soon.
          </li>
        </ol>
      </div>

      {demo && (
        <div class="card home-demo-card">
          <div class="home-demo-head">
            <div>
              <h2>{demo.name}</h2>
              <p class="muted">
                Starter data · {demo.rooms.length} rooms ·{' '}
                {demo.items.filter((i) => i.active).length} items · serenity{' '}
                {computeSerenity(demo)}
              </p>
            </div>
            <div class="btn-row">
              <button
                type="button"
                class="btn primary"
                onClick={() => void openCastle(demo.id)}
              >
                Open
              </button>
              <button type="button" class="btn" onClick={() => void resetDemo()}>
                Reset demo
              </button>
            </div>
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div class="card">
          <h2>Your other castles</h2>
          <ul class="castle-list">
            {others.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  class="castle-row"
                  onClick={() => void openCastle(p.id)}
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
        Advanced:{' '}
        <a href={href('import')}>Import Prompt Pack</a>
        {' · '}
        <a href={href('import-zip')}>Import ZIP</a>
      </p>
    </section>
  );
}
