import { useEffect, useRef, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { DocMeta, Item, Property, RoomFloor, ShutoffType } from '../../storage';
import { useActiveCastle } from '../ActiveCastle';
import { go } from '../paths';
import { newId, nowIso } from '../../storage';
import { ageFromInstall, daysUntil, FLOORS, FLOOR_LABELS } from '../../houseview';
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

const COMMON_ROOMS = [
  'Kitchen',
  'Living Room',
  'Dining Room',
  'Family Room',
  'Primary Bedroom',
  'Bedroom',
  'Bathroom',
  'Half Bath',
  'Garage',
  'Laundry / Utility',
  'Office',
  'Basement',
  'Attic',
  'Mudroom',
  'Hallway',
  'Patio / Deck',
];

const SHUTOFF_TYPES: ShutoffType[] = [
  'water',
  'gas',
  'electric-main',
  'breaker-panel',
  'sump',
  'septic',
  'other',
];

const DOC_TYPES: DocMeta['type'][] = [
  'manual',
  'receipt',
  'closing',
  'inspection',
  'warranty',
  'blueprint',
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
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState<RoomFloor>('ground');
  const [showAddShutoff, setShowAddShutoff] = useState(false);
  const [shutoffType, setShutoffType] = useState<ShutoffType>('water');
  const [shutoffTypeOther, setShutoffTypeOther] = useState('');
  const [shutoffNote, setShutoffNote] = useState('');
  const [docType, setDocType] = useState<DocMeta['type']>('manual');
  const [showAddConsumable, setShowAddConsumable] = useState(false);
  const [consumableKind, setConsumableKind] = useState('filter');
  const [consumableKindOther, setConsumableKindOther] = useState('');
  const [consumableLabel, setConsumableLabel] = useState('');
  const [consumableSize, setConsumableSize] = useState('');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editSerial, setEditSerial] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editRoomId, setEditRoomId] = useState('');
  const [editPurchaseDate, setEditPurchaseDate] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editWarrantyEnd, setEditWarrantyEnd] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [pickedPhotoUrl, setPickedPhotoUrl] = useState<string | null>(null);

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

  const appliedDeepLink = useRef(false);
  useEffect(() => {
    if (!property || appliedDeepLink.current) return;
    appliedDeepLink.current = true;
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('item');
    if (!itemId) return;
    const item = property.items.find((i) => i.id === itemId);
    if (!item) return;
    setPicked(item);
    if (params.get('edit') === '1') startEdit(item);
  }, [property]);

  // Resolve the picked item's first photo to a displayable object URL,
  // revoking the previous one so we don't leak blob URLs as selection
  // changes.
  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    const firstPhoto = picked?.photos[0];
    if (firstPhoto) {
      void (async () => {
        const s = await ensureStorageReady();
        const blob = await s.getBlob(firstPhoto.blobId);
        if (cancelled || !blob) return;
        url = URL.createObjectURL(blob);
        setPickedPhotoUrl(url);
      })();
    } else {
      setPickedPhotoUrl(null);
    }
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [picked?.id, picked?.photos.length]);

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

  function startEdit(item: Item) {
    setEditingItem(item);
    setEditBrand(item.brand ?? '');
    setEditModel(item.model ?? '');
    setEditSerial(item.serial ?? '');
    setEditCategory(item.category);
    setEditRoomId(item.roomId ?? '');
    setEditPurchaseDate(item.purchaseDate ?? '');
    setEditPrice(item.price != null ? String(item.price) : '');
    setEditWarrantyEnd(item.warrantyEnd ?? '');
    setEditNotes(item.notes ?? '');
  }

  async function saveEdit(e: Event) {
    e.preventDefault();
    if (!editingItem || !propertyId) return;
    const s = await ensureStorageReady();
    await s.updateItem(propertyId, editingItem.id, {
      brand: editBrand.trim() || null,
      model: editModel.trim() || null,
      serial: editSerial.trim() || null,
      category: editCategory.trim() || editingItem.category,
      roomId: editRoomId || null,
      purchaseDate: editPurchaseDate || null,
      price: editPrice.trim() ? Number(editPrice) : null,
      warrantyEnd: editWarrantyEnd || null,
      notes: editNotes.trim() || null,
    });
    const p = await s.getProperty(propertyId);
    setProperty(p);
    setPicked(p?.items.find((i) => i.id === editingItem.id) ?? null);
    setEditingItem(null);
    await refreshActive();
  }

  async function addItemPhoto(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !picked || !propertyId) return;
    const s = await ensureStorageReady();
    const { blobId } = await s.putBlob(file, file.type);
    const photos = [
      ...picked.photos,
      { blobId, kind: 'photo' as const, createdAt: nowIso() },
    ];
    await s.updateItem(propertyId, picked.id, { photos });
    input.value = '';
    const p = await s.getProperty(propertyId);
    setProperty(p);
    setPicked(p?.items.find((i) => i.id === picked.id) ?? null);
  }

  async function addRoom(e: Event) {
    e.preventDefault();
    const name = newRoomName.trim();
    if (!name) return;
    const s = await ensureStorageReady();
    await s.addRoom(propertyId!, {
      name,
      type: newRoomFloor === 'yard' ? 'yard' : 'other',
      floor: newRoomFloor,
      dims: { L: 12, W: 11, H: 9 },
    });
    setNewRoomName('');
    setShowAddRoom(false);
    await load();
  }

  async function addShutoff(e: Event) {
    e.preventDefault();
    const note = shutoffNote.trim();
    if (!note) return;
    const custom = shutoffType === 'other' ? shutoffTypeOther.trim() : '';
    const s = await ensureStorageReady();
    await s.addShutoff(propertyId!, {
      type: shutoffType,
      locationNote: custom ? `${custom} — ${note}` : note,
    });
    setShutoffNote('');
    setShutoffTypeOther('');
    setShowAddShutoff(false);
    await load();
  }

  async function removeShutoff(shutoffId: string) {
    const s = await ensureStorageReady();
    const p = await s.getProperty(propertyId!);
    if (!p) return;
    p.shutoffs = p.shutoffs.filter((sh) => sh.id !== shutoffId);
    await s.saveProperty(p);
    await load();
  }

  async function addDoc(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const s = await ensureStorageReady();
    const { blobId } = await s.putBlob(file, file.type);
    await s.attachDoc(propertyId!, {
      type: docType,
      blobId,
      title: file.name,
      tags: [],
      date: new Date().toISOString().slice(0, 10),
    });
    (e.target as HTMLInputElement).value = '';
    await load();
  }

  async function viewDoc(blobId: string) {
    const s = await ensureStorageReady();
    const blob = await s.getBlob(blobId);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function removeDoc(docId: string) {
    const s = await ensureStorageReady();
    const p = await s.getProperty(propertyId!);
    if (!p) return;
    p.docs = p.docs.filter((d) => d.id !== docId);
    await s.saveProperty(p);
    await load();
  }

  async function addConsumable(e: Event) {
    e.preventDefault();
    const label = consumableLabel.trim();
    if (!label) return;
    const kind =
      consumableKind === 'other'
        ? consumableKindOther.trim() || 'other'
        : consumableKind;
    const s = await ensureStorageReady();
    await s.addConsumable(propertyId!, {
      kind,
      label,
      sizeOrModel: consumableSize.trim(),
    });
    setConsumableLabel('');
    setConsumableSize('');
    setConsumableKindOther('');
    setShowAddConsumable(false);
    await load();
  }

  async function removeConsumable(consumableId: string) {
    const s = await ensureStorageReady();
    const p = await s.getProperty(propertyId!);
    if (!p) return;
    p.consumables = p.consumables.filter((c) => c.id !== consumableId);
    await s.saveProperty(p);
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
          <button
            type="button"
            class="btn"
            onClick={() => setShowAddRoom((v) => !v)}
          >
            {showAddRoom ? 'Cancel' : 'Add room'}
          </button>
          <button
            type="button"
            class="btn"
            onClick={() => go('property', propertyId, 'floorplan')}
          >
            ✏️ Edit floor plan
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
            onClick={() => setShowAddShutoff((v) => !v)}
          >
            {showAddShutoff ? 'Cancel' : '⛔ Add shutoff'}
          </button>
          <button
            type="button"
            class="btn"
            onClick={() => setShowAddConsumable((v) => !v)}
          >
            {showAddConsumable ? 'Cancel' : '🧻 Add filter/supply'}
          </button>
          <select
            class="doc-type-select"
            value={docType}
            aria-label="Document type"
            onChange={(e) =>
              setDocType((e.target as HTMLSelectElement).value as DocMeta['type'])
            }
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <label class="btn doc-upload-btn">
            📄 Add document
            <input type="file" onChange={(e) => void addDoc(e)} hidden />
          </label>
          <button
            type="button"
            class="btn"
            onClick={() => go('property', propertyId, 'house')}
          >
            Back to map
          </button>
        </div>
      </header>

      {showAddShutoff && (
        <form class="card add-strip" onSubmit={(e) => void addShutoff(e)}>
          <div class="add-row">
            <label>
              Type
              <select
                value={shutoffType}
                onChange={(e) =>
                  setShutoffType((e.target as HTMLSelectElement).value as ShutoffType)
                }
              >
                {SHUTOFF_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/-/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            {shutoffType === 'other' && (
              <label>
                What is it?
                <input
                  placeholder="e.g. Propane tank valve"
                  value={shutoffTypeOther}
                  onInput={(e) =>
                    setShutoffTypeOther((e.target as HTMLInputElement).value)
                  }
                />
              </label>
            )}
            <label>
              Location
              <input
                autoFocus
                placeholder="e.g. Basement, left of water heater"
                value={shutoffNote}
                onInput={(e) =>
                  setShutoffNote((e.target as HTMLInputElement).value)
                }
                required
              />
            </label>
            <button type="submit" class="btn primary">
              Save
            </button>
          </div>
        </form>
      )}

      {property.shutoffs.length > 0 && (
        <div class="card">
          <h2>Emergency shutoffs</h2>
          <ul class="plain-list">
            {property.shutoffs.map((sh) => (
              <li key={sh.id}>
                <strong>{sh.type.replace(/-/g, ' ')}</strong> —{' '}
                {sh.locationNote}
                <button
                  type="button"
                  class="kit-icon-btn"
                  aria-label="Remove"
                  onClick={() => void removeShutoff(sh.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showAddConsumable && (
        <form class="card add-strip" onSubmit={(e) => void addConsumable(e)}>
          <div class="add-row">
            <label>
              Kind
              <select
                value={consumableKind}
                onChange={(e) =>
                  setConsumableKind((e.target as HTMLSelectElement).value)
                }
              >
                {['filter', 'battery', 'bulb', 'cartridge', 'other'].map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            {consumableKind === 'other' && (
              <label>
                What kind?
                <input
                  placeholder="e.g. water softener salt"
                  value={consumableKindOther}
                  onInput={(e) =>
                    setConsumableKindOther((e.target as HTMLInputElement).value)
                  }
                />
              </label>
            )}
            <label>
              Label
              <input
                autoFocus
                placeholder="e.g. Furnace filter"
                value={consumableLabel}
                onInput={(e) =>
                  setConsumableLabel((e.target as HTMLInputElement).value)
                }
                required
              />
            </label>
            <label>
              Size / model
              <input
                placeholder="e.g. 16x25x1"
                value={consumableSize}
                onInput={(e) =>
                  setConsumableSize((e.target as HTMLInputElement).value)
                }
              />
            </label>
            <button type="submit" class="btn primary">
              Save
            </button>
          </div>
        </form>
      )}

      {property.consumables.length > 0 && (
        <div class="card">
          <h2>Filters &amp; Supplies</h2>
          <ul class="plain-list">
            {property.consumables.map((c) => (
              <li key={c.id}>
                <strong>{c.label}</strong>
                {c.sizeOrModel ? ` — ${c.sizeOrModel}` : ''}
                {' · '}
                <span class="muted tiny">{c.kind}</span>
                <button
                  type="button"
                  class="kit-icon-btn"
                  aria-label="Remove"
                  onClick={() => void removeConsumable(c.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {property.docs.length > 0 && (
        <div class="card">
          <h2>Documents</h2>
          <ul class="plain-list">
            {property.docs.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  class="link-btn"
                  onClick={() => void viewDoc(d.blobId)}
                >
                  {d.title ?? d.type}
                </button>
                {' · '}
                <span class="muted tiny">{d.type}</span>
                <button
                  type="button"
                  class="kit-icon-btn"
                  aria-label="Remove"
                  onClick={() => void removeDoc(d.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showAddRoom && (
        <form class="card add-strip" onSubmit={(e) => void addRoom(e)}>
          <p class="muted tiny">Common rooms — tap to fill the name, or type your own:</p>
          <div class="chip-row">
            {COMMON_ROOMS.map((name) => (
              <button
                key={name}
                type="button"
                class={newRoomName === name ? 'chip active' : 'chip'}
                onClick={() => setNewRoomName(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <div class="add-row">
            <label>
              Room name
              <input
                autoFocus
                placeholder="e.g. Kitchen, Primary Bedroom"
                value={newRoomName}
                onInput={(e) =>
                  setNewRoomName((e.target as HTMLInputElement).value)
                }
                required
              />
            </label>
            <label>
              Floor
              <select
                value={newRoomFloor}
                onChange={(e) =>
                  setNewRoomFloor((e.target as HTMLSelectElement).value as RoomFloor)
                }
              >
                {FLOORS.map((f) => (
                  <option key={f} value={f}>
                    {FLOOR_LABELS[f]}
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

        {picked && editingItem?.id === picked.id && (
          <form
            class="card picked-panel edit-item-form"
            onSubmit={(e) => void saveEdit(e)}
          >
            <h2>Edit item</h2>
            <div class="form-grid">
              <label>
                Type
                <select
                  value={editCategory}
                  onChange={(e) =>
                    setEditCategory((e.target as HTMLSelectElement).value)
                  }
                >
                  {QUICK.includes(editCategory) ? null : (
                    <option value={editCategory}>{editCategory}</option>
                  )}
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
                  value={editBrand}
                  onInput={(e) =>
                    setEditBrand((e.target as HTMLInputElement).value)
                  }
                />
              </label>
              <label>
                Model
                <input
                  value={editModel}
                  onInput={(e) =>
                    setEditModel((e.target as HTMLInputElement).value)
                  }
                />
              </label>
              <label>
                Serial
                <input
                  value={editSerial}
                  onInput={(e) =>
                    setEditSerial((e.target as HTMLInputElement).value)
                  }
                />
              </label>
              <label>
                Room
                <select
                  value={editRoomId}
                  onChange={(e) =>
                    setEditRoomId((e.target as HTMLSelectElement).value)
                  }
                >
                  <option value="">Unassigned</option>
                  {property.rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Purchase date
                <input
                  type="date"
                  value={editPurchaseDate}
                  onInput={(e) =>
                    setEditPurchaseDate((e.target as HTMLInputElement).value)
                  }
                />
              </label>
              <label>
                Price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPrice}
                  onInput={(e) =>
                    setEditPrice((e.target as HTMLInputElement).value)
                  }
                />
              </label>
              <label>
                Warranty end
                <input
                  type="date"
                  value={editWarrantyEnd}
                  onInput={(e) =>
                    setEditWarrantyEnd((e.target as HTMLInputElement).value)
                  }
                />
              </label>
            </div>
            <label class="edit-item-notes">
              Notes
              <textarea
                rows={3}
                value={editNotes}
                onInput={(e) =>
                  setEditNotes((e.target as HTMLTextAreaElement).value)
                }
              />
            </label>
            <div class="btn-row">
              <button type="submit" class="btn primary">
                Save changes
              </button>
              <button
                type="button"
                class="btn"
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {picked && editingItem?.id !== picked.id && (
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
              photoUrl={pickedPhotoUrl}
              onView={() => go('property', propertyId, 'house')}
              onEdit={() => startEdit(picked)}
              onClose={() => setPicked(null)}
            />
            {picked.filterSpecs[0] && (
              <p class="muted" style={{ marginTop: '0.75rem' }}>
                {picked.filterSpecs[0].name}:{' '}
                <strong>{picked.filterSpecs[0].sizeOrModel}</strong>
              </p>
            )}
            {picked.notes && <p class="muted">{picked.notes}</p>}
            <label class="btn sm add-photo-btn">
              📷 {picked.photos.length > 0 ? 'Add another photo' : 'Add a photo'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void addItemPhoto(e)}
                hidden
              />
            </label>
          </div>
        )}
      </div>
    </section>
  );
}
