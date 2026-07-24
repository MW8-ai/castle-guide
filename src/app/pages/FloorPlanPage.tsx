import { useEffect, useRef, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Property, Room, RoomFloor } from '../../storage';
import {
  FLOORS,
  FLOOR_LABELS,
  roomFloorOf,
  resolveRoomPosition,
  resolveRoomResize,
  MIN_ROOM_FT,
  type PositionedRect,
} from '../../houseview';
import { go } from '../paths';
import '../../ui/floorplan.css';

interface Props {
  id?: string;
}

function initialFloor(): RoomFloor {
  const requested = new URLSearchParams(window.location.search).get('floor');
  return (FLOORS as string[]).includes(requested ?? '')
    ? (requested as RoomFloor)
    : 'ground';
}

export function FloorPlanPage({ id }: Props) {
  const [property, setProperty] = useState<Property | null>(null);
  const [floor, setFloor] = useState<RoomFloor>(initialFloor);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(
    null
  );
  const [resizeDims, setResizeDims] = useState<{ id: string; L: number; W: number } | null>(
    null
  );
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ id: string; startL: number; startW: number; startPx: number; startPy: number } | null>(
    null
  );

  async function load() {
    if (!id) return;
    const s = await ensureStorageReady();
    const p = await s.getProperty(id);
    if (!p) return;
    const floorRooms = p.rooms.filter((r) => roomFloorOf(r) === floor);
    const positioned = floorRooms.filter((r) => r.pos);
    const missing = floorRooms.filter((r) => !r.pos);
    if (missing.length) {
      let cursorX = positioned.length
        ? Math.max(...positioned.map((r) => r.pos!.x + r.dims.L))
        : 0;
      for (const r of missing) {
        r.pos = { x: cursorX, y: 0 };
        cursorX += r.dims.L;
      }
      await s.saveProperty(p);
    }
    setProperty(p);
  }

  useEffect(() => {
    void load();
  }, [id, floor]);

  if (!id) return <p class="error-text">Missing property id.</p>;
  if (!property) return <p class="muted">Loading…</p>;

  const floorRooms = property.rooms.filter((r) => roomFloorOf(r) === floor);
  const selected = floorRooms.find((r) => r.id === selectedId) ?? null;

  function svgPoint(clientX: number, clientY: number): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: loc.x, y: loc.y };
  }

  function onRoomPointerDown(e: PointerEvent, room: Room) {
    // Capture is best-effort (keeps the drag going if the pointer leaves the
    // element) — it can throw NotFoundError in edge cases and must never
    // block selecting the room or starting the drag.
    try {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore — capture is a nicety, not a requirement */
    }
    const p = svgPoint(e.clientX, e.clientY);
    dragRef.current = {
      id: room.id,
      ox: p.x - (room.pos?.x ?? 0),
      oy: p.y - (room.pos?.y ?? 0),
    };
    setSelectedId(room.id);
  }

  function onHandlePointerDown(e: PointerEvent, room: Room) {
    e.stopPropagation();
    try {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore — capture is a nicety, not a requirement */
    }
    const p = svgPoint(e.clientX, e.clientY);
    resizeRef.current = {
      id: room.id,
      startL: room.dims.L,
      startW: room.dims.W,
      startPx: p.x,
      startPy: p.y,
    };
    setSelectedId(room.id);
  }

  function onPointerMove(e: PointerEvent) {
    if (resizeRef.current) {
      const p = svgPoint(e.clientX, e.clientY);
      const r = resizeRef.current;
      setResizeDims({
        id: r.id,
        L: Math.max(MIN_ROOM_FT, r.startL + (p.x - r.startPx)),
        W: Math.max(MIN_ROOM_FT, r.startW + (p.y - r.startPy)),
      });
      return;
    }
    if (!dragRef.current) return;
    const p = svgPoint(e.clientX, e.clientY);
    setDragPos({
      id: dragRef.current.id,
      x: p.x - dragRef.current.ox,
      y: p.y - dragRef.current.oy,
    });
  }

  async function onPointerUp() {
    if (resizeRef.current) {
      await commitResize();
      return;
    }
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || !dragPos) {
      setDragPos(null);
      return;
    }
    const room = floorRooms.find((r) => r.id === drag.id);
    if (!room) {
      setDragPos(null);
      return;
    }

    const others: PositionedRect[] = floorRooms
      .filter((r) => r.id !== room.id && r.pos)
      .map((r) => ({ id: r.id, x: r.pos!.x, y: r.pos!.y, L: r.dims.L, W: r.dims.W }));
    const { x, y } = resolveRoomPosition(
      { id: room.id, L: room.dims.L, W: room.dims.W },
      others,
      dragPos.x,
      dragPos.y
    );

    setDragPos(null);
    const s = await ensureStorageReady();
    await s.updateRoom(property!.id, room.id, { pos: { x, y } });
    await load();
  }

  async function commitResize() {
    const resize = resizeRef.current;
    resizeRef.current = null;
    if (!resize || !resizeDims) {
      setResizeDims(null);
      return;
    }
    const room = floorRooms.find((r) => r.id === resize.id);
    if (!room || !room.pos) {
      setResizeDims(null);
      return;
    }
    const others: PositionedRect[] = floorRooms
      .filter((r) => r.id !== room.id && r.pos)
      .map((r) => ({ id: r.id, x: r.pos!.x, y: r.pos!.y, L: r.dims.L, W: r.dims.W }));
    const { L, W } = resolveRoomResize(
      { id: room.id, x: room.pos.x, y: room.pos.y },
      others,
      resizeDims.L,
      resizeDims.W
    );

    setResizeDims(null);
    const s = await ensureStorageReady();
    await s.updateRoom(property!.id, room.id, { dims: { ...room.dims, L, W } });
    await load();
  }

  async function saveWallHeight(h: number) {
    if (!selected || !Number.isFinite(h) || h <= 0) return;
    const s = await ensureStorageReady();
    await s.updateRoom(property!.id, selected.id, {
      dims: { ...selected.dims, H: h },
    });
    await load();
  }

  const positions = floorRooms.map((r) => ({
    x: dragPos && dragPos.id === r.id ? dragPos.x : (r.pos?.x ?? 0),
    y: dragPos && dragPos.id === r.id ? dragPos.y : (r.pos?.y ?? 0),
    L: resizeDims && resizeDims.id === r.id ? resizeDims.L : r.dims.L,
    W: resizeDims && resizeDims.id === r.id ? resizeDims.W : r.dims.W,
    room: r,
  }));
  // Rooms can now sit at negative x/y (dragged above/left of wherever the
  // first room landed), so the viewBox origin has to track the actual
  // minimum instead of assuming everything starts at 0.
  const minX = Math.min(0, ...positions.map((p) => p.x));
  const minY = Math.min(0, ...positions.map((p) => p.y));
  const maxX = Math.max(10, ...positions.map((p) => p.x + p.L));
  const maxY = Math.max(10, ...positions.map((p) => p.y + p.W));
  const pad = 4;

  return (
    <section class="page floorplan-page">
      <p class="eyebrow">
        <button
          type="button"
          class="btn"
          onClick={() => go('property', property.id, 'house')}
        >
          ← House
        </button>
      </p>
      <h1>Edit floor plan</h1>
      <p class="muted">
        Drag rooms to reposition — edges snap into place near neighbors. Drag
        the corner handle on a selected room to resize it.
      </p>
      <p class="muted">
        Footprint: {Math.round(maxX - minX)}' × {Math.round(maxY - minY)}' ·{' '}
        {Math.round(
          positions.reduce((sum, p) => sum + p.L * p.W, 0)
        ).toLocaleString()}{' '}
        sq ft of rooms on {FLOOR_LABELS[floor].toLowerCase()}
      </p>

      <nav class="tabs">
        {FLOORS.map((f) => (
          <button
            key={f}
            type="button"
            class={f === floor ? 'tab active' : 'tab'}
            onClick={() => {
              setFloor(f);
              setSelectedId(null);
            }}
          >
            {FLOOR_LABELS[f]}
          </button>
        ))}
      </nav>

      <div class="floorplan-canvas-wrap">
        <svg
          ref={svgRef}
          viewBox={`${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`}
          class="floorplan-svg"
          onPointerMove={(e) => onPointerMove(e as unknown as PointerEvent)}
          onPointerUp={() => void onPointerUp()}
        >
          {positions.map(({ x, y, L, W, room }) => (
            <g
              key={room.id}
              class={room.id === selectedId ? 'fp-room selected' : 'fp-room'}
              onPointerDown={(e) =>
                onRoomPointerDown(e as unknown as PointerEvent, room)
              }
            >
              <rect x={x} y={y} width={L} height={W} rx={0.3} />
              <text x={x + L / 2} y={y + W / 2} font-size={Math.min(1, W / 4)}>
                {room.name}
              </text>
              {room.id === selectedId && (
                <rect
                  class="fp-resize-handle"
                  x={x + L - 0.6}
                  y={y + W - 0.6}
                  width={1.2}
                  height={1.2}
                  onPointerDown={(e) =>
                    onHandlePointerDown(e as unknown as PointerEvent, room)
                  }
                />
              )}
            </g>
          ))}
        </svg>
      </div>

      {floorRooms.length === 0 && (
        <p class="muted">
          No rooms on {FLOOR_LABELS[floor].toLowerCase()} yet — add one from
          Inventory.
        </p>
      )}

      {selected && (
        <div class="card">
          <h2>{selected.name}</h2>
          <label>
            Wall height (ft)
            <input
              type="number"
              min="6"
              max="20"
              step="0.5"
              value={selected.dims.H}
              onChange={(e) =>
                void saveWallHeight(
                  Number((e.target as HTMLInputElement).value)
                )
              }
            />
          </label>
        </div>
      )}
    </section>
  );
}
