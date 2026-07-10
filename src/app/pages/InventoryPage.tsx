import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Item, Property } from '../../storage';
import { useActiveCastle } from '../ActiveCastle';
import { go } from '../paths';
import { newId } from '../../storage';

interface Props {
  id?: string;
}

const QUICK_CATEGORIES = [
  'refrigerator',
  'furnace',
  'water-heater',
  'range',
  'washer',
  'dryer',
  'dishwasher',
  'hvac',
  'other',
];

export function InventoryPage({ id }: Props) {
  const { refresh: refreshActive } = useActiveCastle();
  const [property, setProperty] = useState<Property | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('appliance');
  const [roomId, setRoomId] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const propertyId = id;

  async function load() {
    if (!propertyId) return;
    const s = await ensureStorageReady();
    await s.setActiveProperty(propertyId);
    const p = await s.getProperty(propertyId);
    setProperty(p);
    if (p?.rooms[0] && !roomId) setRoomId(p.rooms[0].id);
    await refreshActive();
  }

  useEffect(() => {
    void load();
  }, [propertyId]);

  if (!propertyId) {
    return (
      <section class="page">
        <button type="button" class="btn" onClick={() => go()}>
          Home
        </button>
      </section>
    );
  }

  if (!property) return <div class="page loading-splash">Loading inventory…</div>;

  const active = property.items.filter((i) => i.active && !i.softDeleted);
  const archived = property.items.filter((i) => i.softDeleted);
  const q = filter.toLowerCase();
  const shown = active.filter(
    (i) =>
      !q ||
      i.brand?.toLowerCase().includes(q) ||
      i.model?.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
  );

  async function addItem(e: Event) {
    e.preventDefault();
    const s = await ensureStorageReady();
    const item = await s.addItem(propertyId!, {
      category,
      brand: brand.trim() || 'Unknown',
      model: model.trim() || null,
      roomId: roomId || null,
    });
    // Place in room if chosen
    if (roomId) {
      const p = await s.getProperty(propertyId!);
      if (p) {
        const room = p.rooms.find((r) => r.id === roomId);
        if (room) {
          room.placements.push({
            id: newId(),
            itemId: item.id,
            x: 1 + room.placements.length * 2.5,
            y: 1,
            rotation: 0,
            footprint: { L: 2, W: 2 },
          });
          await s.saveProperty(p);
        }
      }
    }
    setBrand('');
    setModel('');
    setShowAdd(false);
    setMsg('Added — find it on House View.');
    await load();
  }

  async function togglePool(item: Item) {
    const s = await ensureStorageReady();
    await s.setPoolRoomWorthy(propertyId!, item.id, !item.poolRoomWorthy);
    setMsg(!item.poolRoomWorthy ? 'Starred as a favorite.' : 'Removed from favorites.');
    await load();
  }

  async function replaceItem(item: Item) {
    const newBrand = prompt('New brand (old one is archived in history)', item.brand ?? '');
    if (!newBrand?.trim()) return;
    const newModel = prompt('New model', item.model ?? '') ?? '';
    const s = await ensureStorageReady();
    await s.replaceItem(propertyId!, item.id, {
      category: item.category,
      brand: newBrand.trim(),
      model: newModel.trim() || null,
      purchaseDate: new Date().toISOString().slice(0, 10),
      roomId: item.roomId,
    });
    setMsg('Replaced — history kept.');
    await load();
  }

  async function addRoom() {
    const name = prompt('Room name', 'Bedroom');
    if (!name?.trim()) return;
    const s = await ensureStorageReady();
    await s.addRoom(propertyId!, {
      name: name.trim(),
      type: 'other',
      dims: { L: 12, W: 11, H: 9 },
    });
    setMsg(`Room “${name.trim()}” added.`);
    await load();
  }

  const roomName = (rid?: string | null) =>
    property.rooms.find((r) => r.id === rid)?.name ?? '—';

  return (
    <section class="page inv-page">
      <header class="inv-head">
        <div>
          <h1>Your stuff</h1>
          <p class="muted">
            {active.length} items · {property.rooms.length} rooms · quick add,
            details later
          </p>
        </div>
        <div class="btn-row">
          <button type="button" class="btn" onClick={() => void addRoom()}>
            + Room
          </button>
          <button
            type="button"
            class="btn primary"
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? 'Cancel' : '+ Add item'}
          </button>
        </div>
      </header>

      {msg && <p class="ok-text">{msg}</p>}

      {showAdd && (
        <form class="card add-strip" onSubmit={(e) => void addItem(e)}>
          <h2>Quick add</h2>
          <div class="add-row">
            <label>
              What is it?
              <select
                value={category}
                onChange={(e) =>
                  setCategory((e.target as HTMLSelectElement).value)
                }
              >
                {QUICK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Brand
              <input
                value={brand}
                onInput={(e) => setBrand((e.target as HTMLInputElement).value)}
                placeholder="LG"
                required
              />
            </label>
            <label>
              Model
              <input
                value={model}
                onInput={(e) => setModel((e.target as HTMLInputElement).value)}
                placeholder="optional"
              />
            </label>
            <label>
              Room
              <select
                value={roomId}
                onChange={(e) =>
                  setRoomId((e.target as HTMLSelectElement).value)
                }
              >
                {property.rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" class="btn primary">
              Save item
            </button>
          </div>
          <p class="muted tiny">
            Serial, warranty, and photos can wait — open the item later.
          </p>
        </form>
      )}

      <div class="inv-toolbar">
        <input
          class="search"
          placeholder="Filter items…"
          value={filter}
          onInput={(e) => setFilter((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="inv-rooms muted">
        Rooms:{' '}
        {property.rooms.map((r) => (
          <span key={r.id} class="room-chip">
            {r.name} ({r.dims.L}'×{r.dims.W}')
          </span>
        ))}
      </div>

      <ul class="inv-list">
        {shown.map((item) => (
          <li key={item.id} class="inv-card">
            <div class="inv-card-main">
              <strong>
                {item.brand} {item.model}
              </strong>
              <div class="muted">
                {item.category} · {roomName(item.roomId)}
                {item.poolRoomWorthy ? ' · 🏆 Pool Room' : ''}
              </div>
              {item.lineage.length > 0 && (
                <div class="muted tiny">
                  {item.lineage.length} prior generation(s) saved
                </div>
              )}
            </div>
            <div class="inv-card-actions">
              <button type="button" class="btn" onClick={() => void replaceItem(item)}>
                Replace
              </button>
              <button type="button" class="btn" onClick={() => void togglePool(item)}>
                {item.poolRoomWorthy ? 'Unstar' : '★ Favorite'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {archived.length > 0 && (
        <details class="card">
          <summary class="muted">
            Archived / replaced ({archived.length}) — still in export
          </summary>
          <ul class="plain-list">
            {archived.map((i) => (
              <li key={i.id}>
                {i.brand} {i.model} <span class="muted">({i.category})</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {property.items.some((i) => i.poolRoomWorthy && !i.softDeleted) && (
        <div class="card pool-banner">
          <h2>★ Favorites</h2>
          <p class="muted">Stuff you starred as keepers.</p>
          <ul class="plain-list">
            {property.items
              .filter((i) => i.poolRoomWorthy && !i.softDeleted)
              .map((i) => (
                <li key={i.id}>
                  {i.brand} {i.model}
                </li>
              ))}
          </ul>
        </div>
      )}
    </section>
  );
}
