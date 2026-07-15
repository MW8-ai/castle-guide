import { useEffect, useRef, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Property, Room, RoomFloor } from '../../storage';
import { FLOORS, FLOOR_LABELS, roomFloorOf } from '../../houseview';
import { go } from '../paths';
import '../../ui/floorplan.css';

interface Props {
  id?: string;
}

const SNAP_FT = 1.5;

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
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);

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

  function onPointerMove(e: PointerEvent) {
    if (!dragRef.current) return;
    const p = svgPoint(e.clientX, e.clientY);
    setDragPos({
      id: dragRef.current.id,
      x: p.x - dragRef.current.ox,
      y: p.y - dragRef.current.oy,
    });
  }

  async function onPointerUp() {
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

    let x = dragPos.x;
    let y = dragPos.y;

    // Snap to the nearest edge on each axis — but only against rooms the
    // dragged room actually runs alongside on the other axis, so it snaps
    // to form a shared wall rather than aligning with an unrelated room.
    let bestDX: number | null = null;
    let bestDY: number | null = null;
    for (const other of floorRooms) {
      if (other.id === room.id || !other.pos) continue;
      const oL = other.pos.x;
      const oR = other.pos.x + other.dims.L;
      const oT = other.pos.y;
      const oB = other.pos.y + other.dims.W;
      const left = x;
      const right = x + room.dims.L;
      const top = y;
      const bottom = y + room.dims.W;
      const yOverlaps = top < oB + SNAP_FT && bottom > oT - SNAP_FT;
      const xOverlaps = left < oR + SNAP_FT && right > oL - SNAP_FT;

      if (yOverlaps) {
        if (Math.abs(left - oR) < SNAP_FT && (bestDX == null || Math.abs(oR - x) < Math.abs(bestDX - x))) {
          bestDX = oR;
        }
        if (Math.abs(right - oL) < SNAP_FT && (bestDX == null || Math.abs(oL - room.dims.L - x) < Math.abs(bestDX - x))) {
          bestDX = oL - room.dims.L;
        }
      }
      if (xOverlaps) {
        if (Math.abs(top - oB) < SNAP_FT && (bestDY == null || Math.abs(oB - y) < Math.abs(bestDY - y))) {
          bestDY = oB;
        }
        if (Math.abs(bottom - oT) < SNAP_FT && (bestDY == null || Math.abs(oT - room.dims.W - y) < Math.abs(bestDY - y))) {
          bestDY = oT - room.dims.W;
        }
      }
    }
    if (bestDX != null) x = bestDX;
    if (bestDY != null) y = bestDY;
    x = Math.max(0, x);
    y = Math.max(0, y);

    // Snapping onto a shared wall can still leave the room overlapping a
    // third room — push it out along whichever axis has the least overlap.
    for (let pass = 0; pass < 6; pass++) {
      const hit = floorRooms.find((other) => {
        if (other.id === room.id || !other.pos) return false;
        const oL = other.pos.x;
        const oR = other.pos.x + other.dims.L;
        const oT = other.pos.y;
        const oB = other.pos.y + other.dims.W;
        return x < oR && x + room.dims.L > oL && y < oB && y + room.dims.W > oT;
      });
      if (!hit) break;
      const oL = hit.pos!.x;
      const oR = hit.pos!.x + hit.dims.L;
      const oT = hit.pos!.y;
      const oB = hit.pos!.y + hit.dims.W;
      const overlapX = Math.min(x + room.dims.L, oR) - Math.max(x, oL);
      const overlapY = Math.min(y + room.dims.W, oB) - Math.max(y, oT);
      if (overlapX < overlapY) {
        // "Push left" can go negative (room dragged near x=0) — fall back
        // to "push right" rather than let the later clamp re-collide it.
        const pushLeft = oL - room.dims.L;
        const preferLeft = x + room.dims.L / 2 < oL + hit.dims.L / 2;
        x = preferLeft && pushLeft >= 0 ? pushLeft : oR;
      } else {
        const pushUp = oT - room.dims.W;
        const preferUp = y + room.dims.W / 2 < oT + hit.dims.W / 2;
        y = preferUp && pushUp >= 0 ? pushUp : oB;
      }
    }
    x = Math.max(0, x);
    y = Math.max(0, y);

    setDragPos(null);
    const s = await ensureStorageReady();
    await s.updateRoom(property!.id, room.id, { pos: { x, y } });
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
    L: r.dims.L,
    W: r.dims.W,
    room: r,
  }));
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
        Drag rooms to reposition — edges snap into place near neighbors.
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
          viewBox={`${-pad} ${-pad} ${maxX + pad * 2} ${maxY + pad * 2}`}
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
