import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Item, Property } from '../../storage';
import { useActiveCastle } from '../ActiveCastle';
import { go } from '../paths';
import { newId } from '../../storage';

interface Props {
  id?: string;
}

const QUICK = [
  'refrigerator',
  'furnace',
  'water-heater',
  'range',
  'washer',
  'dryer',
  'furniture',
  'other',
];

export function InventoryPage({ id }: Props) {
  const { refresh: refreshActive } = useActiveCastle();
  const [property, setProperty] = useState<Property | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('refrigerator');
  const [roomId, setRoomId] = useState('');
  const [filter, setFilter] = useState('');
  const [picked, setPicked] = useState<Item | null>(null);

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

  if (!propertyId) return null;
  if (!property) return <div class="page loading-splash">Loading…</div>;

  const active = property.items.filter((i) => i.active && !i.softDeleted);
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
            footprint: { L: 2.5, W: 2.5 },
          });
          await s.saveProperty(p);
        }
      }
    }
    setBrand('');
    setModel('');
    setShowAdd(false);
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
    await load();
  }

  const roomName = (rid?: string | null) =>
    property.rooms.find((r) => r.id === rid)?.name ?? '—';

  return (
    <section class="page inv-calm">
      <header class="inv-head">
        <div>
          <h1>Inventory</h1>
          <p class="muted">
            {active.length} items · {property.rooms.length} rooms
          </p>
        </div>
        <div class="btn-row">
          <button type="button" class="btn" onClick={() => void addRoom()}>
            Add room
          </button>
          <button
            type="button"
            class="btn primary"
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? 'Cancel' : 'Add item'}
          </button>
          <button
            type="button"
            class="btn"
            onClick={() => go('property', propertyId, 'house')}
          >
            Back to map
          </button>
        </div>
      </header>

      {showAdd && (
        <form class="card add-strip" onSubmit={(e) => void addItem(e)}>
          <div class="add-row">
            <label>
              Type
              <select
                value={category}
                onChange={(e) =>
                  setCategory((e.target as HTMLSelectElement).value)
                }
              >
                {QUICK.map((c) => (
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
                required
              />
            </label>
            <label>
              Model
              <input
                value={model}
                onInput={(e) => setModel((e.target as HTMLInputElement).value)}
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
              Save
            </button>
          </div>
        </form>
      )}

      <input
        class="search"
        placeholder="Search…"
        value={filter}
        onInput={(e) => setFilter((e.target as HTMLInputElement).value)}
      />

      <div class="item-grid">
        {shown.map((item) => (
          <button
            key={item.id}
            type="button"
            class={picked?.id === item.id ? 'item-tile active' : 'item-tile'}
            onClick={() => setPicked(item)}
          >
            <span class="item-tile-brand">{item.brand}</span>
            <span class="item-tile-model">{item.model ?? item.category}</span>
            <span class="item-tile-room">{roomName(item.roomId)}</span>
          </button>
        ))}
      </div>

      {picked && (
        <div class="card picked-panel">
          <h2>
            {picked.brand} {picked.model}
          </h2>
          <p class="muted">
            {picked.category} · {roomName(picked.roomId)} ·{' '}
            {picked.serial ?? 'no serial'}
          </p>
        </div>
      )}
    </section>
  );
}
