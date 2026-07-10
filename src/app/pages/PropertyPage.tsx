import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Item, Property } from '../../storage';
import { nowIso } from '../../storage';

const base = import.meta.env.BASE_URL;

interface Props {
  id?: string;
}

export function PropertyPage({ id }: Props) {
  const [property, setProperty] = useState<Property | null>(null);
  const [tab, setTab] = useState<
    'items' | 'rooms' | 'consumables' | 'docs' | 'shutoffs' | 'notes' | 'pool'
  >('items');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quick-add item form
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('appliance');
  const [serial, setSerial] = useState('');

  async function refresh() {
    if (!id) return;
    const s = await ensureStorageReady();
    setProperty(await s.getProperty(id));
  }

  useEffect(() => {
    void refresh();
  }, [id]);

  if (!id) {
    return <p class="error-text">Missing property id.</p>;
  }

  if (!property) {
    return <p class="muted">Loading…</p>;
  }

  const activeItems = property.items.filter((i) => i.active && !i.softDeleted);
  const poolItems = property.items.filter((i) => i.poolRoomWorthy && !i.softDeleted);

  async function addItem(e: Event) {
    e.preventDefault();
    setError(null);
    const s = await ensureStorageReady();
    await s.addItem(property!.id, {
      category,
      brand: brand || 'Unknown',
      model: model || null,
      serial: serial || null,
    });
    setBrand('');
    setModel('');
    setSerial('');
    setMessage('Item added.');
    await refresh();
  }

  async function replaceItem(item: Item) {
    const newBrand = window.prompt('New brand', item.brand ?? '') ?? '';
    if (!newBrand.trim()) return;
    const newModel = window.prompt('New model', item.model ?? '') ?? '';
    const s = await ensureStorageReady();
    await s.replaceItem(property!.id, item.id, {
      category: item.category,
      brand: newBrand.trim(),
      model: newModel.trim() || null,
      serial: null,
      purchaseDate: new Date().toISOString().slice(0, 10),
      roomId: item.roomId,
    });
    setMessage('Replaced — lineage snapshot archived. The house remembers.');
    await refresh();
  }

  async function sendToPool(item: Item) {
    const s = await ensureStorageReady();
    await s.setPoolRoomWorthy(property!.id, item.id, true);
    setMessage("This is going straight to the pool room.");
    await refresh();
  }

  async function attachManual(item: Item) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const s = await ensureStorageReady();
      const { blobId } = await s.putBlob(file, file.type);
      await s.attachDoc(property!.id, {
        type: 'manual',
        blobId,
        itemId: item.id,
        title: file.name,
        tags: ['manual'],
        date: new Date().toISOString().slice(0, 10),
      });
      if (file.type.startsWith('image/')) {
        await s.updateItem(property!.id, item.id, {
          photos: [
            ...item.photos,
            {
              blobId,
              kind: 'photo',
              caption: file.name,
              createdAt: nowIso(),
            },
          ],
        });
      }
      setMessage(`Attached ${file.name}`);
      await refresh();
    };
    input.click();
  }

  async function exportZip() {
    const s = await ensureStorageReady();
    const blob = await s.exportZip(property!.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${property!.name.replace(/\s+/g, '-').toLowerCase()}-castle-export.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Export downloaded. Guard it — sensitive data.');
  }

  async function wipeProperty() {
    if (!window.confirm('Delete this property from this browser? Export first if you care.')) {
      return;
    }
    const s = await ensureStorageReady();
    await s.deleteProperty(property!.id);
    window.location.href = base;
  }

  async function addConsumable(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const s = await ensureStorageReady();
    await s.addConsumable(property!.id, {
      kind: String(fd.get('kind') || 'filter'),
      label: String(fd.get('label') || ''),
      sizeOrModel: String(fd.get('size') || ''),
    });
    form.reset();
    await refresh();
  }

  async function addShutoff(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const s = await ensureStorageReady();
    await s.addShutoff(property!.id, {
      type: String(fd.get('type') || 'water') as 'water',
      locationNote: String(fd.get('note') || ''),
    });
    form.reset();
    await refresh();
  }

  async function addNote(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const s = await ensureStorageReady();
    await s.addNote(property!.id, String(fd.get('body') || ''), {
      title: String(fd.get('title') || '') || undefined,
      someday: fd.get('someday') === 'on',
    });
    form.reset();
    await refresh();
  }

  async function addRoom(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const s = await ensureStorageReady();
    await s.addRoom(property!.id, {
      name: String(fd.get('name') || 'Room'),
      type: String(fd.get('type') || 'other'),
      dims: {
        L: Number(fd.get('L') || 10),
        W: Number(fd.get('W') || 10),
        H: Number(fd.get('H') || 8),
      },
    });
    form.reset();
    await refresh();
  }

  return (
    <section class="page">
      <p class="eyebrow">
        <a href={base}>← Castles</a>
      </p>
      <h1>{property.name}</h1>
      <p class="muted">
        {property.zip ? `ZIP ${property.zip} · ` : ''}
        {activeItems.length} active items · local-first
      </p>

      <div class="btn-row">
        <a class="btn primary" href={`${base}property/${property.id}/maintain`}>
          Maintenance & Ops
        </a>
        <button type="button" class="btn" onClick={() => void exportZip()}>
          Export ZIP
        </button>
        <a class="btn" href={`${base}import`}>
          Prompt Pack paste
        </a>
        <button type="button" class="btn danger" onClick={() => void wipeProperty()}>
          Delete property
        </button>
      </div>

      {message && <p class="ok-text">{message}</p>}
      {error && <p class="error-text">{error}</p>}

      <nav class="tabs">
        {(
          [
            ['items', 'Items'],
            ['rooms', 'Dimensions'],
            ['consumables', 'Consumables'],
            ['docs', 'Docs'],
            ['shutoffs', 'Shutoffs'],
            ['notes', 'Notes'],
            ['pool', 'Pool Room'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            class={tab === key ? 'tab active' : 'tab'}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'items' && (
        <div class="card">
          <h2>Appliance & systems catalog</h2>
          <form class="form-grid" onSubmit={(e) => void addItem(e)}>
            <label>
              Category
              <input value={category} onInput={(e) => setCategory((e.target as HTMLInputElement).value)} />
            </label>
            <label>
              Brand
              <input value={brand} onInput={(e) => setBrand((e.target as HTMLInputElement).value)} required />
            </label>
            <label>
              Model
              <input value={model} onInput={(e) => setModel((e.target as HTMLInputElement).value)} />
            </label>
            <label>
              Serial
              <input value={serial} onInput={(e) => setSerial((e.target as HTMLInputElement).value)} />
            </label>
            <button type="submit" class="btn primary">
              Add item
            </button>
          </form>

          <ul class="item-list">
            {activeItems.map((item) => (
              <li key={item.id} class="item-card">
                <div>
                  <strong>
                    {item.brand} {item.model}
                  </strong>
                  <div class="muted">
                    {item.category}
                    {item.serial ? ` · ${item.serial}` : ''}
                    {item.lineage.length
                      ? ` · ${item.lineage.length} prior generation(s)`
                      : ''}
                  </div>
                  {item.lineage.length > 0 && (
                    <details>
                      <summary>Lineage history</summary>
                      <ol>
                        {item.lineage.map((L, i) => (
                          <li key={i}>
                            {L.snapshot.brand} {L.snapshot.model} (
                            {L.activeFrom} → {L.activeTo})
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                </div>
                <div class="btn-row compact">
                  <button type="button" class="btn" onClick={() => void attachManual(item)}>
                    Attach PDF/photo
                  </button>
                  <button type="button" class="btn" onClick={() => void replaceItem(item)}>
                    Replace
                  </button>
                  <button type="button" class="btn" onClick={() => void sendToPool(item)}>
                    Pool Room
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {property.items.some((i) => i.softDeleted) && (
            <details style={{ marginTop: '1rem' }}>
              <summary class="muted">Archived / replaced items (still exported)</summary>
              <ul>
                {property.items
                  .filter((i) => i.softDeleted)
                  .map((i) => (
                    <li key={i.id}>
                      {i.brand} {i.model} <span class="muted">(soft-deleted)</span>
                    </li>
                  ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {tab === 'rooms' && (
        <div class="card">
          <h2>Dimensions vault</h2>
          <form class="form-grid" onSubmit={(e) => void addRoom(e)}>
            <label>
              Name
              <input name="name" required placeholder="Kitchen" />
            </label>
            <label>
              Type
              <input name="type" placeholder="kitchen" />
            </label>
            <label>
              L (ft)
              <input name="L" type="number" step="0.1" defaultValue={12} />
            </label>
            <label>
              W (ft)
              <input name="W" type="number" step="0.1" defaultValue={14} />
            </label>
            <label>
              H (ft)
              <input name="H" type="number" step="0.1" defaultValue={9} />
            </label>
            <button type="submit" class="btn primary">
              Add room
            </button>
          </form>
          <ul class="plain-list">
            {property.rooms.map((r) => (
              <li key={r.id}>
                <strong>{r.name}</strong> — {r.dims.L}' × {r.dims.W}' × {r.dims.H}'
                {r.paintCards.length
                  ? ` · ${r.paintCards.length} paint card(s)`
                  : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'consumables' && (
        <div class="card">
          <h2>Consumables locker</h2>
          <form class="form-grid" onSubmit={(e) => void addConsumable(e)}>
            <label>
              Kind
              <input name="kind" placeholder="furnace filter" required />
            </label>
            <label>
              Label
              <input name="label" placeholder="Main furnace" required />
            </label>
            <label>
              Size / model
              <input name="size" placeholder="16x25x1" required />
            </label>
            <button type="submit" class="btn primary">
              Add
            </button>
          </form>
          <ul class="plain-list">
            {property.consumables.map((c) => (
              <li key={c.id}>
                <strong>{c.label}</strong> — {c.sizeOrModel}{' '}
                <span class="muted">({c.kind})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'docs' && (
        <div class="card">
          <h2>Docs vault</h2>
          <ul class="plain-list">
            {property.docs.length === 0 && (
              <li class="muted">Attach manuals from an item card.</li>
            )}
            {property.docs.map((d) => (
              <li key={d.id}>
                {d.title ?? d.type} · blob {d.blobId.slice(0, 8)}…
                {d.itemId ? ' · linked to item' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'shutoffs' && (
        <div class="card">
          <h2>Emergency shutoff map</h2>
          <p class="muted">The 2 a.m. feature. Photograph later; note location now.</p>
          <form class="form-grid" onSubmit={(e) => void addShutoff(e)}>
            <label>
              Type
              <select name="type">
                <option value="water">Water main</option>
                <option value="gas">Gas</option>
                <option value="electric-main">Electric main</option>
                <option value="breaker-panel">Breaker panel</option>
                <option value="sump">Sump</option>
                <option value="septic">Septic</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Location note
              <input name="note" required placeholder="Basement, left of water heater" />
            </label>
            <button type="submit" class="btn primary">
              Pin shutoff
            </button>
          </form>
          <ul class="plain-list">
            {property.shutoffs.map((s) => (
              <li key={s.id}>
                <strong>{s.type}</strong> — {s.locationNote}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'notes' && (
        <div class="card">
          <h2>Idea notepad</h2>
          <p class="muted empty-vibe">it's the vibe of it</p>
          <form class="form-grid" onSubmit={(e) => void addNote(e)}>
            <label>
              Title
              <input name="title" placeholder="Someday: deck stain" />
            </label>
            <label>
              Note
              <textarea name="body" required rows={3} />
            </label>
            <label class="checkbox">
              <input type="checkbox" name="someday" /> Someday board
            </label>
            <button type="submit" class="btn primary">
              Save note
            </button>
          </form>
          <ul class="plain-list">
            {property.notes.map((n) => (
              <li key={n.id}>
                {n.someday && <span class="badge">Someday</span>}{' '}
                <strong>{n.title ?? 'Note'}</strong> — {n.body}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'pool' && (
        <div class="card pool-room">
          <h2>The Pool Room</h2>
          <p class="muted">Trophy gallery for prized possessions and finished projects.</p>
          {poolItems.length === 0 ? (
            <p class="muted">Nothing magnificent yet. Mark an item from the catalog.</p>
          ) : (
            <ul class="item-list">
              {poolItems.map((item) => (
                <li key={item.id} class="item-card trophy">
                  <strong>
                    {item.brand} {item.model}
                  </strong>
                  <div class="muted">{item.category}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
