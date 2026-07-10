import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Item, Property } from '../../storage';
import { useActiveCastle } from '../ActiveCastle';
import { go } from '../paths';
import { newId } from '../../storage';
import { ageFromInstall, daysUntil } from '../../houseview';
import { ItemCard } from '../../ui/kit/ItemCard';
import '../../ui/kit/kit.css';

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

  const warrantyState = (item: Item) => {
    if (!item.warrantyEnd) return 'none' as const;
    const end = item.warrantyEnd;
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 6);
    if (end < new Date().toISOString().slice(0, 10)) return 'expired' as const;
    if (end < soon.toISOString().slice(0, 10)) return 'expiring' as const;
    return 'active' as const;
  };

  // Group by room for a house-shaped inventory
  const byRoom = property.rooms
    .map((r) => ({
      room: r,
      items: shown.filter((i) => i.roomId === r.id),
    }))
    .filter((g) => g.items.length > 0);
  const unassigned = shown.filter((i) => !i.roomId);

  return (
    <section class="page inv-calm">
      <header class="inv-head">
        <div>
          <h1>Inventory</h1>
          <p class="muted">
            {active.length} items · {property.rooms.length} rooms · serials,
            warranties, and where each thing lives
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

      <div class="inv-layout">
        <div class="inv-groups">
          {byRoom.map(({ room, items }) => (
            <section key={room.id} class="inv-room-group">
              <h2>
                {room.name}{' '}
                <span class="muted">
                  · {room.dims.L}'×{room.dims.W}' · {items.length}
                </span>
              </h2>
              <div class="item-grid">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    class={
                      picked?.id === item.id ? 'item-tile active' : 'item-tile'
                    }
                    onClick={() => setPicked(item)}
                  >
                    <span class="item-tile-brand">
                      {item.brand ?? item.category}
                    </span>
                    <span class="item-tile-model">
                      {item.model ?? item.category}
                    </span>
                    <span class="item-tile-room">
                      {item.serial ? `S/N ${item.serial}` : 'No serial yet'}
                      {item.warrantyEnd ? ` · W ${item.warrantyEnd}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {unassigned.length > 0 && (
            <section class="inv-room-group">
              <h2>Unassigned</h2>
              <div class="item-grid">
                {unassigned.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    class={
                      picked?.id === item.id ? 'item-tile active' : 'item-tile'
                    }
                    onClick={() => setPicked(item)}
                  >
                    <span class="item-tile-brand">
                      {item.brand ?? item.category}
                    </span>
                    <span class="item-tile-model">
                      {item.model ?? item.category}
                    </span>
                    <span class="item-tile-room">No room</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {shown.length === 0 && (
            <p class="muted">No items match that search.</p>
          )}
        </div>

        {picked && (
          <div class="card picked-panel inv-detail">
            <ItemCard
              brand={picked.brand ?? picked.category}
              model={picked.model ?? ''}
              serial={picked.serial}
              installed={picked.purchaseDate}
              ageLabel={ageFromInstall(picked.purchaseDate) ?? undefined}
              warranty={warrantyState(picked)}
              warrantyEnd={picked.warrantyEnd}
              price={picked.price}
              room={roomName(picked.roomId)}
              category={picked.category}
              maintenanceNext={
                property.tasks.find(
                  (t) => t.itemId === picked.id && t.status === 'pending'
                )?.title ?? null
              }
              maintenanceDueInDays={daysUntil(
                property.tasks.find(
                  (t) => t.itemId === picked.id && t.status === 'pending'
                )?.nextDue
              )}
              docsCount={
                picked.manualDocIds.length + (picked.photos?.length ?? 0)
              }
              onView={() => go('property', propertyId, 'house')}
              onEdit={() => setPicked(null)}
            />
            {picked.filterSpecs[0] && (
              <p class="muted" style={{ marginTop: '0.75rem' }}>
                {picked.filterSpecs[0].name}:{' '}
                <strong>{picked.filterSpecs[0].sizeOrModel}</strong>
              </p>
            )}
            {picked.notes && <p class="muted">{picked.notes}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
