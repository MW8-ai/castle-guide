import { useEffect, useRef, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Item, Property, Room, Task } from '../../storage';
import {
  buildHouseViewModel,
  computeSerenity,
  serenityLabel,
  healthGrade,
  daysUntil,
  ageFromInstall,
  upcomingTasks,
  catalogStats,
} from '../../houseview';
import { walkIsoRenderer } from '../../houseview/walkIso/walkIsoRenderer';
import type { HouseRendererHandle } from '../../houseview';
import { useActiveCastle } from '../ActiveCastle';
import { tipsForRoomType, homeCouncilTips } from '../../council/roomTips';
import { ItemCard } from '../../ui/kit/ItemCard';
import { go } from '../paths';
import '../../ui/tokens/tokens.css';
import '../../ui/kit/kit.css';
import '../../ui/live-house.css';

interface Props {
  id?: string;
}

/**
 * House is the home screen: walk rooms, real homeowner context docks,
 * Up Next tasks, council tips. No score / XP chrome.
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
          (t.itemId
            ? roomItems.some((i) => i.id === t.itemId)
            : false)
      )
    : [];
  // also include room-scoped pending by title match is hard — show all soon if none
  const roomNotes = room
    ? property.notes.filter((n) => n.roomId === room.id)
    : [];
  const tips = room
    ? tipsForRoomType(room.type || room.name)
    : homeCouncilTips();

  const score = computeSerenity(property);
  const grade = healthGrade(score);
  const stats = catalogStats(property);
  const upNext = upcomingTasks(property, 5);
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const warrantyState = (item: Item) => {
    if (!item.warrantyEnd) return 'none' as const;
    const end = item.warrantyEnd;
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 6);
    if (end < new Date().toISOString().slice(0, 10)) return 'expired' as const;
    if (end < soon.toISOString().slice(0, 10)) return 'expiring' as const;
    return 'active' as const;
  };

  async function markDone(task: Task) {
    if (!property) return;
    const s = await ensureStorageReady();
    await s.completeTask(property.id, task.id);
    await load();
  }

  function openItem(item: Item) {
    setSelected(item);
  }

  return (
    <div class="live-house" data-theme="nightwatch">
      <div class="live-stage" ref={hostRef} />

      {/* Top HUD — real homeowner signals, not game scores */}
      <header class="live-hud-top">
        <div class="live-hud-left">
          <div class="live-home-name">{property.name}</div>
          <div class="live-hint">
            WASD walk rooms · click furniture · data stays on your device
          </div>
        </div>
        <div class="live-hud-stats">
          <div class="live-stat-chip" title={serenityLabel(score)}>
            <span class="live-stat-k">Home health</span>
            <strong>
              {grade} · {score}%
            </strong>
          </div>
          <div class="live-stat-chip">
            <span class="live-stat-k">Due soon</span>
            <strong>
              {stats.overdue > 0 ? (
                <span class="warn">{stats.overdue} overdue</span>
              ) : (
                `${stats.pending} tasks`
              )}
            </strong>
          </div>
          <div class="live-stat-chip">
            <span class="live-stat-k">Catalog</span>
            <strong>
              {stats.items} items · {stats.rooms} rooms
            </strong>
          </div>
          <div class="live-stat-chip muted-chip">
            <span class="live-stat-k">{dateLabel}</span>
            <strong>
              {property.yearBuilt ? `Built ${property.yearBuilt}` : 'Your house'}
            </strong>
          </div>
        </div>
      </header>

      {/* Up Next — left rail */}
      <aside class="live-up-next" aria-label="Upcoming maintenance">
        <header class="live-up-head">
          <h3>Up next</h3>
          <button
            type="button"
            class="live-link-btn"
            onClick={() => go('property', property.id, 'maintain')}
          >
            All
          </button>
        </header>
        {upNext.length === 0 ? (
          <p class="muted tiny">
            No scheduled tasks yet. Open Maintenance to generate from your
            catalog.
          </p>
        ) : (
          <ul class="live-up-list">
            {upNext.map((t) => {
              const due = t.dueInDays;
              const tone =
                due != null && due < 0
                  ? 'overdue'
                  : due != null && due <= 14
                    ? 'soon'
                    : 'ok';
              return (
                <li key={t.id} class={`live-up-item ${tone}`}>
                  <div class="live-up-main">
                    <strong>{t.title}</strong>
                    <span class="muted">
                      {due == null
                        ? t.nextDue
                        : due < 0
                          ? `${Math.abs(due)}d overdue`
                          : due === 0
                            ? 'Due today'
                            : `Due in ${due}d`}
                      {t.whenNotToDiy ? ' · pro recommended' : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    class="live-check"
                    title="Mark done"
                    onClick={() => void markDone(t)}
                  >
                    ✓
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {property.shutoffs.length > 0 && (
          <section class="live-shutoffs">
            <h4>Shutoffs</h4>
            <ul>
              {property.shutoffs.slice(0, 3).map((sh) => (
                <li key={sh.id}>
                  <strong>{sh.type.replace(/-/g, ' ')}</strong>
                  <span class="muted"> — {sh.locationNote}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>

      {/* Room dock */}
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
            {room.dims.H ? ` × ${room.dims.H}'` : ''}
            {room.materials?.floor ? ` · ${room.materials.floor}` : ''}
          </p>

          {(room.materials?.wall || room.paintCards?.[0]) && (
            <section class="live-block">
              <h3>Finishes</h3>
              <ul class="live-facts">
                {room.materials?.wall && <li>Walls: {room.materials.wall}</li>}
                {room.materials?.trim && <li>Trim: {room.materials.trim}</li>}
                {room.paintCards?.[0] && (
                  <li>
                    Paint: {room.paintCards[0].brand}
                    {room.paintCards[0].line
                      ? ` ${room.paintCards[0].line}`
                      : ''}{' '}
                    #{room.paintCards[0].number}
                    {room.paintCards[0].sheen
                      ? ` · ${room.paintCards[0].sheen}`
                      : ''}
                  </li>
                )}
              </ul>
            </section>
          )}

          {roomTasks.length > 0 && (
            <section class="live-block">
              <h3>Needs attention here</h3>
              <ul>
                {roomTasks.map((t) => (
                  <li key={t.id}>
                    <strong>{t.title}</strong>
                    <span class="muted">
                      {' '}
                      ·{' '}
                      {(() => {
                        const d = daysUntil(t.nextDue);
                        if (d == null) return t.nextDue;
                        if (d < 0) return `${Math.abs(d)}d overdue`;
                        return `due in ${d}d`;
                      })()}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section class="live-block">
            <h3>In this room ({roomItems.length})</h3>
            {roomItems.length === 0 ? (
              <p class="muted">
                Nothing cataloged yet — open Inventory to add the fridge, bed,
                or water heater.
              </p>
            ) : (
              <ul class="live-item-list">
                {roomItems.map((i) => {
                  const w = warrantyState(i);
                  return (
                    <li key={i.id}>
                      <button
                        type="button"
                        class="live-item-btn"
                        onClick={() => openItem(i)}
                      >
                        <span>
                          {i.brand ? `${i.brand} ` : ''}
                          {i.model ?? i.category}
                        </span>
                        {w !== 'none' && (
                          <span class={`live-w-pill w-${w}`}>
                            {w === 'active'
                              ? 'Warranty'
                              : w === 'expiring'
                                ? 'Expiring'
                                : 'Expired'}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
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
        </aside>
      )}

      {/* Item dock — REF-3 style card */}
      {selected && (
        <aside class="live-dock item-dock">
          <header class="live-dock-head">
            <div>
              <p class="live-kicker">
                {property.rooms.find((r) => r.id === selected.roomId)?.name ??
                  'Item'}
              </p>
              <h2>
                {selected.brand ?? selected.category}
                {selected.model ? ` ${selected.model}` : ''}
              </h2>
            </div>
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
            brand={selected.brand ?? selected.category}
            model={selected.model ?? ''}
            serial={selected.serial}
            installed={selected.purchaseDate}
            ageLabel={ageFromInstall(selected.purchaseDate) ?? undefined}
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
            maintenanceDueInDays={daysUntil(
              property.tasks.find(
                (t) => t.itemId === selected.id && t.status === 'pending'
              )?.nextDue
            )}
            docsCount={
              selected.manualDocIds.length + (selected.photos?.length ?? 0)
            }
            onView={() => go('property', property.id, 'inventory')}
            onEdit={() => setSelected(null)}
          />
          {selected.filterSpecs[0] && (
            <p class="live-part">
              {selected.filterSpecs[0].name}:{' '}
              <strong>{selected.filterSpecs[0].sizeOrModel}</strong>
            </p>
          )}
          {selected.notes && (
            <p class="live-note" style={{ marginTop: '0.75rem' }}>
              {selected.notes}
            </p>
          )}
          {selected.serviceLog?.[0] && (
            <p class="muted tiny" style={{ marginTop: '0.5rem' }}>
              Last service: {selected.serviceLog[0].date}
              {selected.serviceLog[0].note
                ? ` — ${selected.serviceLog[0].note}`
                : ''}
            </p>
          )}
        </aside>
      )}

      {/* Council strip */}
      <footer class="live-council-strip">
        {(room ? tips : homeCouncilTips()).slice(0, 4).map((t) => (
          <div key={t.advisor + t.tip.slice(0, 12)} class="live-council-chip">
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
