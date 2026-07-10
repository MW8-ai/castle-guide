import { useEffect, useRef, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Item, Property, Room, Task } from '../../storage';
import { buildHouseViewModel } from '../../houseview';
import { walkIsoRenderer } from '../../houseview/walkIso/walkIsoRenderer';
import type { HouseRendererHandle } from '../../houseview';
import { useActiveCastle } from '../ActiveCastle';
import { tipsForRoomType } from '../../council/roomTips';
import { ItemCard } from '../../ui/kit/ItemCard';
import '../../ui/tokens/tokens.css';
import '../../ui/kit/kit.css';
import '../../ui/live-house.css';

interface Props {
  id?: string;
}

/**
 * House is the home screen: walk rooms, layered context appears for the room
 * you're in; click furniture for appliance details. No quest/score chrome.
 */
export function HousePage({ id }: Props) {
  const { property: active, refresh: refreshActive } = useActiveCastle();
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HouseRendererHandle | null>(null);
  const propRef = useRef<Property | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);

  const propertyId = id || active?.id;

  async function load() {
    if (!propertyId) return;
    const s = await ensureStorageReady();
    await s.setActiveProperty(propertyId);
    let p = await s.getProperty(propertyId);
    if (!p) return;
    const built = buildHouseViewModel(p, { ensurePlacements: true });
    if (built.placementsChanged) {
      await s.saveProperty(p);
      p = (await s.getProperty(propertyId))!;
    }
    propRef.current = p;
    setProperty(p);
    await refreshActive();

    const model = buildHouseViewModel(p).model;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!hostRef.current) return;
        handleRef.current?.destroy();
        handleRef.current = walkIsoRenderer.mount(hostRef.current, model, {
          onSelectItem: (itemId) => {
            const item =
              propRef.current?.items.find((i) => i.id === itemId) ?? null;
            setSelected(item);
          },
          onSelectRoom: (rid) => setRoomId(rid),
          onEnterRoom: (rid) => {
            setRoomId(rid);
            // keep item open until user closes — or clear if left building
            if (!rid) setSelected(null);
          },
          onMovePlacement: () => {},
        });
      });
    });
  }

  useEffect(() => {
    void load();
    return () => {
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [propertyId]);

  if (!propertyId) {
    return <div class="page loading-splash">No home selected.</div>;
  }
  if (!property) {
    return <div class="page loading-splash">Loading house…</div>;
  }

  const room: Room | null =
    (roomId && property.rooms.find((r) => r.id === roomId)) || null;
  const roomItems = room
    ? property.items.filter(
        (i) => i.roomId === room.id && i.active && !i.softDeleted
      )
    : [];
  const roomTasks: Task[] = room
    ? property.tasks.filter(
        (t) =>
          t.status === 'pending' &&
          t.itemId &&
          roomItems.some((i) => i.id === t.itemId)
      )
    : [];
  const roomNotes = room
    ? property.notes.filter((n) => n.roomId === room.id)
    : [];
  const tips = room ? tipsForRoomType(room.type) : [];

  const warrantyState = (item: Item) => {
    if (!item.warrantyEnd) return 'none' as const;
    const end = item.warrantyEnd;
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 6);
    if (end < new Date().toISOString().slice(0, 10)) return 'expired' as const;
    if (end < soon.toISOString().slice(0, 10)) return 'expiring' as const;
    return 'active' as const;
  };

  return (
    <div class="live-house" data-theme="nightwatch">
      <div class="live-stage" ref={hostRef} />

      {/* Layered overlays — map stays full bleed */}
      <div class="live-hud-top">
        <div class="live-home-name">{property.name}</div>
        <div class="live-hint">
          Walk with WASD · enter a room for notes · click furniture
        </div>
      </div>

      {room && !selected && (
        <aside class="live-dock room-dock">
          <header class="live-dock-head">
            <div>
              <p class="live-kicker">You are in</p>
              <h2>{room.name}</h2>
            </div>
          </header>
          <p class="mono live-dims">
            {room.dims.L}' × {room.dims.W}'
            {room.materials?.floor ? ` · ${room.materials.floor}` : ''}
          </p>

          {roomTasks.length > 0 && (
            <section class="live-block">
              <h3>Needs attention</h3>
              <ul>
                {roomTasks.map((t) => (
                  <li key={t.id}>
                    <strong>{t.title}</strong>
                    <span class="muted"> · due {t.nextDue}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section class="live-block">
            <h3>In this room</h3>
            {roomItems.length === 0 ? (
              <p class="muted">No cataloged items here yet.</p>
            ) : (
              <ul class="live-item-list">
                {roomItems.map((i) => (
                  <li key={i.id}>
                    <button
                      type="button"
                      class="live-item-btn"
                      onClick={() => setSelected(i)}
                    >
                      {i.brand} {i.model ?? i.category}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {roomNotes.length > 0 && (
            <section class="live-block">
              <h3>Your notes</h3>
              {roomNotes.map((n) => (
                <p key={n.id} class="live-note">
                  {n.body}
                </p>
              ))}
            </section>
          )}

          {tips[0] && (
            <section class="live-council">
              <div class="live-council-face" aria-hidden="true">
                {tips[0].portrait}
              </div>
              <div>
                <strong>{tips[0].advisor}</strong>
                <p>{tips[0].tip}</p>
              </div>
            </section>
          )}

          <p class="muted tiny">
            Flow tip: this room connects to the rest of the house on the map —
            keep pathways clear in real life too.
          </p>
        </aside>
      )}

      {selected && (
        <aside class="live-dock item-dock">
          <header class="live-dock-head">
            <h2>Item</h2>
            <button
              type="button"
              class="kit-icon-btn"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              ✕
            </button>
          </header>
          <ItemCard
            brand={selected.brand ?? undefined}
            model={selected.model ?? undefined}
            serial={selected.serial}
            installed={selected.purchaseDate}
            warranty={warrantyState(selected)}
            warrantyEnd={selected.warrantyEnd}
            price={selected.price}
            room={
              property.rooms.find((r) => r.id === selected.roomId)?.name ??
              undefined
            }
            category={selected.category}
            maintenanceNext={
              property.tasks.find(
                (t) => t.itemId === selected.id && t.status === 'pending'
              )?.title ?? null
            }
            onEdit={() => setSelected(null)}
          />
          {selected.filterSpecs[0] && (
            <p class="live-part">
              Part / filter size:{' '}
              <strong>{selected.filterSpecs[0].sizeOrModel}</strong>
            </p>
          )}
        </aside>
      )}

      {/* Council strip — REF-3 style, bottom, quiet */}
      <footer class="live-council-strip">
        {(room ? tips : tipsForRoomType('living')).slice(0, 4).map((t) => (
          <div key={t.advisor} class="live-council-chip">
            <span class="live-council-face sm">{t.portrait}</span>
            <div>
              <strong>{t.advisor}</strong>
              <p>{t.tip}</p>
            </div>
          </div>
        ))}
      </footer>
    </div>
  );
}
