import { useEffect, useRef, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Item, Note, Property, Room, Task } from '../../storage';
import { newId } from '../../storage';
import {
  buildHouseViewModel,
  computeSerenity,
  serenityLabel,
  healthGrade,
  healthTone,
  daysUntil,
  ageFromInstall,
  upcomingTasks,
  catalogStats,
  repairCostEstimate,
  buildListCost,
  equityFromProperty,
} from '../../houseview';
import { walkIsoRenderer } from '../../houseview/walkIso/walkIsoRenderer';
import { ImageHouseView } from '../../houseview/imageMap/ImageHouseView';
import type { HouseRendererHandle } from '../../houseview';
import { useActiveCastle } from '../ActiveCastle';
import { tipsForRoomType, homeCouncilTips } from '../../council/roomTips';
import { ItemCard } from '../../ui/kit/ItemCard';
import { downloadNotesMarkdown } from '../../record/notesMarkdown';
import { DEMO_PROPERTY_NAME } from '../../record/demoSeed';
import { go } from '../paths';
import '../../ui/tokens/tokens.css';
import '../../ui/kit/kit.css';
import '../../ui/live-house.css';

interface Props {
  id?: string;
}

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `$${Math.round(n / 1000)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

function dueBarPct(dueInDays: number | null): number {
  if (dueInDays == null) return 40;
  if (dueInDays < 0) return 100;
  // 0 days = full bar urgency; 90+ days = thin
  return Math.max(8, Math.min(100, 100 - dueInDays));
}

/**
 * House home screen: walk, docks, health colors, build list $, notes, council chat.
 */
export function HousePage({ id }: Props) {
  const { property: active, refresh: refreshActive } = useActiveCastle();
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HouseRendererHandle | null>(null);
  const propRef = useRef<Property | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [viewMode, setViewMode] = useState<'walk' | 'art'>('walk');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteStatus, setNoteStatus] = useState<string | null>(null);
  const [dockPos, setDockPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const dragRef = useRef<{
    ox: number;
    oy: number;
    sx: number;
    sy: number;
  } | null>(null);

  const propertyId = id || active?.id;
  const loadToken = useRef(0);

  async function load() {
    if (!propertyId) return;
    const token = ++loadToken.current;
    const s = await ensureStorageReady();
    await s.setActiveProperty(propertyId);
    let p = await s.getProperty(propertyId);
    if (!p || token !== loadToken.current) return;
    const built = buildHouseViewModel(p, { ensurePlacements: true });
    if (built.placementsChanged) {
      await s.saveProperty(p);
      p = (await s.getProperty(propertyId))!;
      if (token !== loadToken.current) return;
    }
    propRef.current = p;
    setProperty(p);
    await refreshActive();
    if (token !== loadToken.current) return;

    if (viewMode !== 'walk') return;
    const model = buildHouseViewModel(p).model;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!hostRef.current || token !== loadToken.current) return;
        const keep = handleRef.current;
        if (keep) {
          keep.update(model);
          return;
        }
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
      loadToken.current++;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [propertyId, viewMode]);

  function toggleViewMode() {
    setViewMode((m) => (m === 'walk' ? 'art' : 'walk'));
    setRoomId(null);
  }

  // Sync note draft when room changes
  useEffect(() => {
    if (!property || !roomId) {
      setNoteDraft('');
      return;
    }
    const existing = property.notes.find((n) => n.roomId === roomId && !n.someday);
    setNoteDraft(existing?.body ?? '');
    setNoteStatus(null);
  }, [roomId, property?.id]);

  if (!propertyId) {
    return <div class="page loading-splash">No home selected.</div>;
  }
  if (!property) {
    return <div class="page loading-splash">Loading house…</div>;
  }

  // buildHouseViewModel silently synthesizes an "auto-room" so the walk
  // view always has a floor — so a genuinely fresh house is "no items yet
  // and no room the user actually created", not literally zero rooms.
  const isFreshHouse =
    property.items.length === 0 &&
    !property.rooms.some((r) => r.id !== 'auto-room');
  if (isFreshHouse) {
    return (
      <div class="live-house live-house-empty" data-theme="nightwatch">
        <div class="empty-onboard">
          <h1>{property.name}</h1>
          <p>This house is empty — let's add your first room.</p>
          <button
            type="button"
            class="btn primary big"
            onClick={() => go('property', property.id, 'inventory')}
          >
            + Add a room or appliance
          </button>
          <p class="muted tiny">
            Add rooms and appliances as you go — no need to fill everything
            out up front. The walk view fills in as soon as your first room
            exists.
          </p>
        </div>
      </div>
    );
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
  const primaryRoomNote = room
    ? property.notes.find((n) => n.roomId === room.id && !n.someday)
    : null;
  const otherRoomNotes = room
    ? property.notes.filter(
        (n) => n.roomId === room.id && n.id !== primaryRoomNote?.id
      )
    : [];
  const tips = room
    ? tipsForRoomType(room.type || room.name)
    : homeCouncilTips();

  const score = computeSerenity(property);
  const grade = healthGrade(score);
  const tone = healthTone(score);
  const stats = catalogStats(property);
  const upNext = upcomingTasks(property, 6);
  const repairs = repairCostEstimate(property);
  const buildList = buildListCost(property);
  const { equity } = equityFromProperty(property);
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Council chat messages from room + home + urgent tasks
  const chat = [
    ...tips.map((t) => ({
      who: t.advisor,
      face: t.portrait,
      text: t.tip,
      kind: 'tip' as const,
    })),
    ...upNext.slice(0, 2).map((t) => ({
      who: t.whenNotToDiy ? 'Frank the Foreman' : 'Wrench Wanda',
      face: t.whenNotToDiy ? '👷' : '🔧',
      text:
        t.dueInDays != null && t.dueInDays < 0
          ? `"${t.title}" is overdue. Don't let it rot.`
          : `On the board: ${t.title}${
              t.dueInDays != null ? ` — ${t.dueInDays}d` : ''
            }.`,
      kind: 'task' as const,
    })),
  ];

  const warrantyState = (item: Item) => {
    if (!item.warrantyEnd) return 'none' as const;
    const end = item.warrantyEnd;
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 6);
    if (end < new Date().toISOString().slice(0, 10)) return 'expired' as const;
    if (end < soon.toISOString().slice(0, 10)) return 'expiring' as const;
    return 'active' as const;
  };

  function partHint(task: Task): string | null {
    if (!task.itemId || !property) return task.detail ?? null;
    const item = property.items.find((i) => i.id === task.itemId);
    const fs = item?.filterSpecs?.[0];
    if (fs) return `${fs.name}: ${fs.sizeOrModel}`;
    return task.detail ?? null;
  }

  async function markDone(task: Task) {
    if (!property) return;
    const s = await ensureStorageReady();
    await s.completeTask(property.id, task.id);
    await load();
  }

  async function saveRoomNote() {
    if (!property || !room) return;
    const s = await ensureStorageReady();
    const p = await s.getProperty(property.id);
    if (!p) return;
    const body = noteDraft.trim();
    const idx = p.notes.findIndex((n) => n.roomId === room.id && !n.someday);
    const ts = new Date().toISOString();
    if (!body) {
      if (idx >= 0) p.notes.splice(idx, 1);
    } else if (idx >= 0) {
      p.notes[idx] = {
        ...p.notes[idx],
        body,
        title: p.notes[idx].title || `${room.name} notes`,
        updatedAt: ts,
      };
    } else {
      const note: Note = {
        id: newId(),
        title: `${room.name} notes`,
        body,
        someday: false,
        roomId: room.id,
        itemId: null,
        createdAt: ts,
        updatedAt: ts,
        links: [],
        roughBudget: null,
      };
      p.notes.push(note);
    }
    await s.saveProperty(p);
    setNoteStatus('Saved');
    propRef.current = p;
    setProperty(p);
    await refreshActive();
  }

  function onDockPointerDown(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    if (!(e.target as HTMLElement).closest('.live-dock-drag')) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      ox: e.clientX,
      oy: e.clientY,
      sx: dockPos?.x ?? rect.left,
      sy: dockPos?.y ?? rect.top,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onDockPointerMove(e: PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.ox;
    const dy = e.clientY - dragRef.current.oy;
    setDockPos({
      x: Math.max(8, dragRef.current.sx + dx),
      y: Math.max(56, dragRef.current.sy + dy),
    });
  }

  function onDockPointerUp() {
    dragRef.current = null;
  }

  const dockStyle = dockPos
    ? {
        left: `${dockPos.x}px`,
        top: `${dockPos.y}px`,
        right: 'auto',
        bottom: 'auto',
      }
    : undefined;

  const isDemoHome = property.name === DEMO_PROPERTY_NAME;

  return (
    <div class="live-house" data-theme="nightwatch">
      {viewMode === 'art' ? (
        <ImageHouseView
          items={property.items}
          houseName={property.name}
          onSelectItem={(item) => setSelected(item)}
          selectedItemId={selected?.id}
        />
      ) : (
        <div class="live-stage" ref={hostRef} />
      )}

      {/* Fixed identity — name, address, year, shutoffs */}
      <div class="live-identity">
        <div class="live-id-text">
          <strong>{property.name}</strong>
          <span>
            {[
              property.address,
              property.yearBuilt ? `Built ${property.yearBuilt}` : null,
              dateLabel,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
        <div class="live-id-shutoffs">
          {property.shutoffs.map((sh) => (
            <span key={sh.id} class="live-id-chip" title={sh.locationNote}>
              ⛔ {sh.type.replace(/-/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      <header class="live-hud-top">
        <div class="live-hud-left">
          {viewMode === 'walk' && (
            <div class="live-hint">
              Click a room to walk there · WASD · yard is open · drag the
              dock handle
            </div>
          )}
          {isDemoHome && (
            <button type="button" class="live-link-btn" onClick={toggleViewMode}>
              {viewMode === 'walk' ? '🖼️ Art view' : '🚶 Walk view'}
            </button>
          )}
        </div>
        <div class="live-hud-stats">
          <div
            class={`live-stat-chip health-${tone}`}
            title={serenityLabel(score)}
          >
            <span class="live-stat-k">Home health</span>
            <strong>
              {grade} · {score}%
            </strong>
          </div>
          {equity != null && (
            <div class="live-stat-chip">
              <span class="live-stat-k">Equity</span>
              <strong>{money(equity)}</strong>
            </div>
          )}
          <div class="live-stat-chip">
            <span class="live-stat-k">Repairs</span>
            <strong>{repairs > 0 ? money(repairs) : '—'}</strong>
          </div>
          <div class="live-stat-chip">
            <span class="live-stat-k">Build list</span>
            <strong>{buildList > 0 ? money(buildList) : '—'}</strong>
          </div>
          <div class="live-stat-chip muted-chip">
            <span class="live-stat-k">Catalog</span>
            <strong>
              {stats.items} items · {stats.rooms} rms
            </strong>
          </div>
        </div>
      </header>

      {/* Up Next */}
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
            No scheduled tasks — Maintenance → Schedule from inventory.
          </p>
        ) : (
          <ul class="live-up-list">
            {upNext.map((t) => {
              const due = t.dueInDays;
              const toneT =
                due != null && due < 0
                  ? 'overdue'
                  : due != null && due <= 14
                    ? 'soon'
                    : 'ok';
              const part = partHint(t);
              return (
                <li key={t.id} class={`live-up-item ${toneT}`}>
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
                      {t.whenNotToDiy ? ' · pro' : ''}
                    </span>
                    <div class="live-due-track" aria-hidden="true">
                      <div
                        class={`live-due-fill ${toneT}`}
                        style={{ width: `${dueBarPct(due)}%` }}
                      />
                    </div>
                    {part && <span class="live-part-hint">Part · {part}</span>}
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
      </aside>

      {/* Council chat */}
      <aside class="live-council-chat" aria-label="Council chat">
        <header class="live-up-head">
          <h3>Council</h3>
        </header>
        <div class="live-chat-scroll">
          {chat.map((m, i) => (
            <div key={i} class="live-chat-line">
              <span class="live-council-face sm">{m.face}</span>
              <div>
                <strong>{m.who}</strong>
                <p>{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Room dock — draggable */}
      {room && !selected && (
        <aside
          class="live-dock room-dock fade-in"
          style={dockStyle}
          onPointerDown={onDockPointerDown as unknown as (e: Event) => void}
          onPointerMove={onDockPointerMove as unknown as (e: Event) => void}
          onPointerUp={onDockPointerUp}
        >
          <header class="live-dock-head">
            <div>
              <p class="live-kicker live-dock-drag" title="Drag panel">
                ⠿ You are in
              </p>
              <h2>{room.name}</h2>
            </div>
            <button
              type="button"
              class="live-link-btn"
              onClick={() => handleRef.current?.travelToRoom?.(room.id)}
            >
              Go here
            </button>
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
                    {room.paintCards[0].line ? ` ${room.paintCards[0].line}` : ''}{' '}
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
              <p class="muted">Nothing cataloged yet.</p>
            ) : (
              <ul class="live-item-list">
                {roomItems.map((i) => {
                  const w = warrantyState(i);
                  return (
                    <li key={i.id}>
                      <button
                        type="button"
                        class="live-item-btn"
                        onClick={() => {
                          setSelected(i);
                          handleRef.current?.travelToItem?.(i.id);
                        }}
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

          {otherRoomNotes.length > 0 && (
            <section class="live-block">
              <h3>Other notes</h3>
              <ul class="live-facts">
                {otherRoomNotes.map((n) => (
                  <li key={n.id}>
                    {n.someday && <span class="badge">Someday</span>} {n.body}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section class="live-block">
            <h3>Homeowner notes</h3>
            <textarea
              class="live-note-input"
              rows={3}
              placeholder={`Notes for ${room.name}…`}
              value={noteDraft}
              onInput={(e) =>
                setNoteDraft((e.target as HTMLTextAreaElement).value)
              }
            />
            <div class="live-note-actions">
              <button
                type="button"
                class="btn primary sm"
                onClick={() => void saveRoomNote()}
              >
                Save note
              </button>
              <button
                type="button"
                class="btn sm"
                onClick={() => downloadNotesMarkdown(property)}
              >
                All rooms .md
              </button>
              {noteStatus && <span class="ok-text tiny">{noteStatus}</span>}
            </div>
          </section>
        </aside>
      )}

      {selected && (
        <aside
          class="live-dock item-dock fade-in"
          style={dockStyle}
          onPointerDown={onDockPointerDown as unknown as (e: Event) => void}
          onPointerMove={onDockPointerMove as unknown as (e: Event) => void}
          onPointerUp={onDockPointerUp}
        >
          <header class="live-dock-head">
            <div>
              <p class="live-kicker live-dock-drag">⠿ Item</p>
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

      {/* Mini room jump list */}
      {viewMode === 'walk' && (
        <div class="live-room-jump">
          {property.rooms.slice(0, 12).map((r) => (
            <button
              key={r.id}
              type="button"
              class={r.id === roomId ? 'active' : ''}
              onClick={() => handleRef.current?.travelToRoom?.(r.id)}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
