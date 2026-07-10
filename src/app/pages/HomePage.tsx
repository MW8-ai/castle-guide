import { useEffect, useState } from 'preact/hooks';
import { SerenityMeter } from '../../ui/SerenityMeter';
import { ensureStorageReady } from '../storageContext';
import type { Property } from '../../storage';

const base = import.meta.env.BASE_URL;

export function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [name, setName] = useState('The Serenity');
  const [zip, setZip] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const s = await ensureStorageReady();
    setProperties(await s.listProperties());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onCreate(e: Event) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const s = await ensureStorageReady();
      const p = await s.createProperty(name.trim() || 'My Castle', zip.trim() || null);
      window.location.href = `${base}property/${p.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section class="page">
      <header class="hero">
        <p class="eyebrow">Phase 1 · Home Record</p>
        <h1>Castle Guide</h1>
        <p class="tagline">
          Your castle. Cataloged, maintained, defended, and leveled up.
        </p>
      </header>

      <SerenityMeter score={100} label="How's the serenity?" />

      <div class="card" style={{ marginTop: '1.25rem' }}>
        <h2>Create a property</h2>
        <form class="form-grid" onSubmit={onCreate}>
          <label>
            House name
            <input
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
              placeholder="The Serenity"
              required
            />
          </label>
          <label>
            ZIP (optional)
            <input
              value={zip}
              onInput={(e) => setZip((e.target as HTMLInputElement).value)}
              placeholder="46240"
            />
          </label>
          <button type="submit" class="btn primary" disabled={busy}>
            {busy ? 'Creating…' : 'Create castle'}
          </button>
        </form>
        {error && <p class="error-text">{error}</p>}
      </div>

      <div class="card" style={{ marginTop: '1rem' }}>
        <h2>Your properties</h2>
        {properties.length === 0 ? (
          <p class="muted">No castles yet — create one or import a Prompt Pack paste.</p>
        ) : (
          <ul class="plain-list">
            {properties.map((p) => (
              <li key={p.id}>
                <a href={`${base}property/${p.id}`}>
                  <strong>{p.name}</strong>
                </a>
                <span class="muted">
                  {' '}
                  · {p.items.filter((i) => i.active).length} active items ·{' '}
                  {p.rooms.length} rooms
                </span>
              </li>
            ))}
          </ul>
        )}
        <p style={{ marginTop: '0.75rem' }}>
          <a class="btn" href={`${base}import`}>
            Import Prompt Pack JSON
          </a>{' '}
          <a class="btn" href={`${base}import-zip`}>
            Import ZIP
          </a>
        </p>
      </div>
    </section>
  );
}
