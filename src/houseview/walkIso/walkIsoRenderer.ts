import type {
  HouseRendererCallbacks,
  HouseRendererHandle,
  HouseViewModel,
  PlacementView,
  RoomView,
} from '../types';
import floorWoodUrl from '../../../assets/iso/floors/wood.png';
import floorTileUrl from '../../../assets/iso/floors/tile.png';
import floorStoneUrl from '../../../assets/iso/floors/stone.png';
import floorMetalUrl from '../../../assets/iso/floors/metal.png';
import floorGrassUrl from '../../../assets/iso/floors/grass.png';
import sofaUrl from '../../../assets/iso/items/sofa.png';
import bedUrl from '../../../assets/iso/items/bed.png';
import deskUrl from '../../../assets/iso/items/desk.png';
import chairUrl from '../../../assets/iso/items/chair.png';
import diningTableUrl from '../../../assets/iso/items/diningtable.png';
import shelfUrl from '../../../assets/iso/items/shelf.png';
import lampUrl from '../../../assets/iso/items/lamp.png';
import pictureUrl from '../../../assets/iso/items/picture.png';
import plantUrl from '../../../assets/iso/items/plant.png';
import avatarWalkUrl from '../../../assets/iso/avatar/walk.png';

const BASE = 22;

type Kind =
  | 'fridge'
  | 'range'
  | 'washer'
  | 'dryer'
  | 'heater'
  | 'furnace'
  | 'ac'
  | 'tv'
  | 'sofa'
  | 'bed'
  | 'toilet'
  | 'desk'
  | 'car'
  | 'chair'
  | 'table'
  | 'shelf'
  | 'lamp'
  | 'picture'
  | 'plant'
  | 'generic';

function kindOf(label: string): Kind {
  const s = label.toLowerCase();
  if (/fridge|refriger|lg /.test(s)) return 'fridge';
  if (/range|oven|stove|ge /.test(s)) return 'range';
  if (/wash/.test(s)) return 'washer';
  if (/dry/.test(s)) return 'dryer';
  if (/water|rheem|heater/.test(s)) return 'heater';
  if (/furnace|carrier/.test(s)) return 'furnace';
  if (/\bac\b|air-?cond/.test(s)) return 'ac';
  if (/tv|sony/.test(s)) return 'tv';
  if (/sofa|couch|sven|kivik|loveseat/.test(s)) return 'sofa';
  if (/bed|malm|king|queen|twin|farmhouse/.test(s)) return 'bed';
  if (/toilet|toto|kohler|american standard|bath/.test(s)) return 'toilet';
  if (/desk|jarvis/.test(s)) return 'desk';
  if (/rav4|cr-v|toyota|honda|vehicle|car/.test(s)) return 'car';
  if (/chair|armchair|recliner|stool/.test(s)) return 'chair';
  if (/table/.test(s)) return 'table';
  if (/shelf|shelves|bookcase|dresser|cabinet/.test(s)) return 'shelf';
  if (/\blamp\b|light fixture/.test(s)) return 'lamp';
  if (/picture|frame|art(work)?|painting/.test(s)) return 'picture';
  if (/plant|cactus|succulent|greenery/.test(s)) return 'plant';
  return 'generic';
}

const BODY: Record<Kind, string> = {
  fridge: '#c8d4e0',
  range: '#3a3a42',
  washer: '#eef2f6',
  dryer: '#e8ecf0',
  heater: '#cfd4d8',
  furnace: '#6a7a88',
  ac: '#7a8a98',
  tv: '#1c1c24',
  sofa: '#5a7a9a',
  bed: '#8a6a9a',
  toilet: '#f4f6f8',
  desk: '#a08050',
  car: '#3a6a9a',
  chair: '#7a9a6a',
  table: '#8a6a4a',
  shelf: '#8a5a3a',
  lamp: '#c8b898',
  picture: '#6a4a3a',
  plant: '#4a8a5a',
  generic: '#9ab0c0',
};

const ICON: Record<Kind, string> = {
  fridge: '🧊',
  range: '🔥',
  washer: '🫧',
  dryer: '💨',
  heater: '💧',
  furnace: '♨️',
  ac: '❄️',
  tv: '📺',
  sofa: '🛋️',
  bed: '🛏️',
  toilet: '🚽',
  desk: '🖥️',
  car: '🚗',
  chair: '🪑',
  table: '🍽️',
  shelf: '🗄️',
  lamp: '💡',
  picture: '🖼️',
  plant: '🪴',
  generic: '📦',
};

type RoomKind =
  | 'bath'
  | 'kitchen'
  | 'garage'
  | 'utility'
  | 'bed'
  | 'living'
  | 'office'
  | 'generic';

function roomKind(name: string): RoomKind {
  const s = name.toLowerCase();
  if (/bath|toilet/.test(s)) return 'bath';
  if (/kitchen/.test(s)) return 'kitchen';
  if (/garage/.test(s)) return 'garage';
  if (/utility|laundry|mech/.test(s)) return 'utility';
  if (/bed|primary/.test(s)) return 'bed';
  if (/living|family|dining/.test(s)) return 'living';
  if (/office/.test(s)) return 'office';
  return 'generic';
}

const FLOOR_COLOR: Record<RoomKind, string> = {
  bath: '#b8c8c4',
  kitchen: '#d4c4a0',
  garage: '#8a9098',
  utility: '#9aa0a8',
  bed: '#c9b8a0',
  living: '#c4a574',
  office: '#b8a888',
  generic: '#c2a878',
};

/**
 * Real art sockets — drop matching PNGs under assets/iso/ (see
 * HUMAN_DIRECTIONS.md §9) and these start rendering with zero code changes.
 * Until then, missing/404 images fail silently and the flat-shape fallback
 * below keeps drawing exactly as it does today.
 *
 * Floor textures are CC0 (Screaming Brain Studios, see assets/iso/floors/LICENSE.txt).
 * Furniture/item sprites and the avatar are still unset — no CC0 furniture
 * pack was found yet, so those keep using the flat-shape fallback.
 */
const FLOOR_SPRITE_SRC: Partial<Record<RoomKind, string>> = {
  bath: floorTileUrl,
  kitchen: floorTileUrl,
  garage: floorStoneUrl,
  utility: floorMetalUrl,
  bed: floorWoodUrl,
  living: floorWoodUrl,
  office: floorWoodUrl,
  generic: floorWoodUrl,
};
const YARD_SPRITE_SRC: string = floorGrassUrl;
const ITEM_SPRITE_SRC: Partial<Record<Kind, string>> = {
  sofa: sofaUrl,
  bed: bedUrl,
  desk: deskUrl,
  chair: chairUrl,
  table: diningTableUrl,
  shelf: shelfUrl,
  lamp: lampUrl,
  picture: pictureUrl,
  plant: plantUrl,
};
const AVATAR_SPRITE_SRC: string | null = avatarWalkUrl;

const spriteCache = new Map<string, HTMLImageElement | 'loading' | 'error'>();
function getSprite(src: string | null | undefined): HTMLImageElement | null {
  if (!src) return null;
  const cached = spriteCache.get(src);
  if (cached === 'error' || cached === 'loading') return null;
  if (cached) return cached;
  const img = new Image();
  spriteCache.set(src, 'loading');
  img.onload = () => spriteCache.set(src, img);
  img.onerror = () => spriteCache.set(src, 'error');
  img.src = src;
  return null;
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

/**
 * Angled iso house you walk through.
 * WASD move · scroll zoom · click furniture · enter room notifies host.
 */
export const walkIsoRenderer = {
  id: 'walk-iso',
  label: 'Walk house',
  mount(
    el: HTMLElement,
    model: HouseViewModel,
    cb: HouseRendererCallbacks,
    opts?: { interactive?: boolean }
  ): HouseRendererHandle {
    const interactive = opts?.interactive ?? true;
    const canvas = document.createElement('canvas');
    canvas.tabIndex = interactive ? 0 : -1;
    canvas.style.cssText = interactive
      ? 'display:block;width:100%;height:100%;outline:none;image-rendering:pixelated;cursor:crosshair'
      : 'display:block;width:100%;height:100%;outline:none;image-rendering:pixelated;pointer-events:none';
    el.innerHTML = '';
    el.appendChild(canvas);

    let current = model;
    let zoom = 1.05;
    let wallsTranslucent = false;
    const keys = new Set<string>();
    let px = 6;
    let py = 6;
    let facing = 0;
    let lastRoom: string | null = null;
    let walkPhase = 0;
    let moving = false;
    let travel: { x: number; y: number } | null = null;
    /** World origin of each room cell (grid-packed, no gaps). */
    let roomOff = new Map<string, { x: number; y: number }>();
    /** Floor size of each cell — fills the grid so rooms share edges. */
    let roomFloor = new Map<string, { L: number; W: number }>();
    const YARD = 14;

    /**
     * Pack rooms into a tight grid with ZERO gaps. Each room fills its full
     * cell so floors share edges — walk room-to-room without island traps.
     */
    function layout(m: HouseViewModel) {
      roomOff.clear();
      roomFloor.clear();

      // Rooms placed via the floor-plan editor keep their saved position.
      const positioned = m.rooms.filter((r) => r.pos);
      let autoOriginX = 0;
      for (const r of positioned) {
        roomOff.set(r.id, { x: r.pos!.x, y: r.pos!.y });
        roomFloor.set(r.id, { L: r.dims.L, W: r.dims.W });
        autoOriginX = Math.max(autoOriginX, r.pos!.x + r.dims.L);
      }

      // Everything else auto-packs into a grid, offset past any positioned
      // rooms so the two layouts never overlap.
      const unpositioned = m.rooms.filter((r) => !r.pos);
      // Prefer a house-like order if names match sample seed
      const preferred = [
        'Primary Bedroom',
        'Bedroom 2',
        'Bath 1',
        'Bedroom 3',
        'Living Room',
        'Kitchen',
        'Dining',
        'Bath 2',
        'Family Room',
        'Utility',
        'Office',
        'Bath 3',
        'Bedroom 4',
        'Bedroom 5',
        'Garage 1',
        'Garage 2',
        'Garage 3',
      ];
      const rooms = [...unpositioned].sort((a, b) => {
        const ia = preferred.indexOf(a.name);
        const ib = preferred.indexOf(b.name);
        if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });

      const cols = 4;
      const colWidths = Array.from({ length: cols }, () => 0);
      const rowHeights: number[] = [];
      const cells: { r: RoomView; col: number; row: number }[] = [];
      let col = 0;
      let row = 0;
      for (const r of rooms) {
        cells.push({ r, col, row });
        colWidths[col] = Math.max(colWidths[col], r.dims.L);
        rowHeights[row] = Math.max(rowHeights[row] ?? 0, r.dims.W);
        col++;
        if (col >= cols) {
          col = 0;
          row++;
        }
      }
      // gap = 0 → shared walls; each room occupies its full cell
      for (const c of cells) {
        let ox = autoOriginX;
        for (let k = 0; k < c.col; k++) ox += colWidths[k];
        let oy = 0;
        for (let k = 0; k < c.row; k++) oy += rowHeights[k] ?? 0;
        const cellL = colWidths[c.col];
        const cellW = rowHeights[c.row] ?? c.r.dims.W;
        roomOff.set(c.r.id, { x: ox, y: oy });
        roomFloor.set(c.r.id, { L: cellL, W: cellW });
      }
    }

    function floorOf(room: RoomView): { L: number; W: number } {
      return roomFloor.get(room.id) ?? { L: room.dims.L, W: room.dims.W };
    }

    /** Full house footprint — continuous rectangle of tiled cells. */
    function houseBounds() {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const r of current.rooms) {
        const o = roomOff.get(r.id);
        if (!o) continue;
        const f = floorOf(r);
        minX = Math.min(minX, o.x);
        minY = Math.min(minY, o.y);
        maxX = Math.max(maxX, o.x + f.L);
        maxY = Math.max(maxY, o.y + f.W);
      }
      if (!Number.isFinite(minX)) {
        return { minX: 0, minY: 0, maxX: 20, maxY: 20 };
      }
      return { minX, minY, maxX, maxY };
    }

    function worldBounds() {
      const b = houseBounds();
      return {
        minX: b.minX - YARD,
        minY: b.minY - YARD,
        maxX: b.maxX + YARD,
        maxY: b.maxY + YARD,
      };
    }

    function inWorld(wx: number, wy: number): boolean {
      const b = worldBounds();
      return (
        wx >= b.minX - 0.05 &&
        wx <= b.maxX + 0.05 &&
        wy >= b.minY - 0.05 &&
        wy <= b.maxY + 0.05
      );
    }

    function iso(fx: number, fy: number, z = 0, panX = 0, panY = 0) {
      const s = BASE * zoom;
      return {
        sx: panX + (fx - fy) * s,
        sy: panY + (fx + fy) * (s * 0.5) - z * s * 0.42,
      };
    }

    /**
     * Anchors a repeating floor pattern to world space (via the same
     * linear transform iso() uses) instead of canvas-pixel space, so the
     * texture pans/zooms in lockstep with the room instead of sliding
     * independently underneath it as the camera moves.
     */
    function anchorPatternToWorld(
      pattern: CanvasPattern,
      img: HTMLImageElement,
      panX: number,
      panY: number,
      tileFeet = 2
    ) {
      const s = BASE * zoom;
      const k = tileFeet / (img.naturalWidth || 1);
      pattern.setTransform(new DOMMatrix([s * k, s * 0.5 * k, -s * k, s * 0.5 * k, panX, panY]));
    }

    function roomAt(wx: number, wy: number, pad = 0.05): string | null {
      let best: { id: string; d: number } | null = null;
      for (const r of current.rooms) {
        const o = roomOff.get(r.id);
        if (!o) continue;
        const f = floorOf(r);
        if (
          wx >= o.x - pad &&
          wx <= o.x + f.L + pad &&
          wy >= o.y - pad &&
          wy <= o.y + f.W + pad
        ) {
          // prefer room whose center is closest (edge / corner ties)
          const cx = o.x + f.L / 2;
          const cy = o.y + f.W / 2;
          const d = Math.hypot(wx - cx, wy - cy);
          if (!best || d < best.d) best = { id: r.id, d };
        }
      }
      return best?.id ?? null;
    }

    function drawYard(
      ctx: CanvasRenderingContext2D,
      panX: number,
      panY: number
    ) {
      const w = worldBounds();
      const y0 = iso(w.minX, w.minY, 0, panX, panY);
      const y1 = iso(w.maxX, w.minY, 0, panX, panY);
      const y2 = iso(w.maxX, w.maxY, 0, panX, panY);
      const y3 = iso(w.minX, w.maxY, 0, panX, panY);
      ctx.beginPath();
      ctx.moveTo(y0.sx, y0.sy);
      ctx.lineTo(y1.sx, y1.sy);
      ctx.lineTo(y2.sx, y2.sy);
      ctx.lineTo(y3.sx, y3.sy);
      ctx.closePath();
      const yardImg = getSprite(YARD_SPRITE_SRC);
      const yardPattern = yardImg ? ctx.createPattern(yardImg, 'repeat') : null;
      if (yardPattern && yardImg) {
        anchorPatternToWorld(yardPattern, yardImg, panX, panY, 4);
      }
      ctx.fillStyle = yardPattern ?? '#3d8f4a';
      ctx.fill();
      // grass flecks
      ctx.fillStyle = 'rgba(30, 100, 40, 0.35)';
      for (let i = 0; i < 40; i++) {
        const gx = w.minX + ((i * 7) % (w.maxX - w.minX));
        const gy = w.minY + ((i * 11) % (w.maxY - w.minY));
        const g = iso(gx, gy, 0, panX, panY);
        ctx.fillRect(g.sx, g.sy, 3, 2);
      }

      // driveway strip on garage side (max X)
      const hb = houseBounds();
      const d0 = iso(hb.maxX + 0.5, hb.minY + 2, 0, panX, panY);
      const d1 = iso(hb.maxX + 8, hb.minY + 2, 0, panX, panY);
      const d2 = iso(hb.maxX + 8, hb.maxY - 2, 0, panX, panY);
      const d3 = iso(hb.maxX + 0.5, hb.maxY - 2, 0, panX, panY);
      ctx.beginPath();
      ctx.moveTo(d0.sx, d0.sy);
      ctx.lineTo(d1.sx, d1.sy);
      ctx.lineTo(d2.sx, d2.sy);
      ctx.lineTo(d3.sx, d3.sy);
      ctx.closePath();
      ctx.fillStyle = '#5a5e66';
      ctx.fill();
      ctx.strokeStyle = '#3a3e46';
      ctx.lineWidth = 1;
      ctx.stroke();
      // lane lines
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.setLineDash([6, 8]);
      const m0 = iso(hb.maxX + 4, hb.minY + 3, 0, panX, panY);
      const m1 = iso(hb.maxX + 4, hb.maxY - 3, 0, panX, panY);
      ctx.beginPath();
      ctx.moveTo(m0.sx, m0.sy);
      ctx.lineTo(m1.sx, m1.sy);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function drawFoundation(
      ctx: CanvasRenderingContext2D,
      panX: number,
      panY: number
    ) {
      const b = houseBounds();
      const pad = 0.6;
      const c0 = iso(b.minX - pad, b.minY - pad, 0, panX, panY);
      const c1 = iso(b.maxX + pad, b.minY - pad, 0, panX, panY);
      const c2 = iso(b.maxX + pad, b.maxY + pad, 0, panX, panY);
      const c3 = iso(b.minX - pad, b.maxY + pad, 0, panX, panY);
      // soft ground shadow
      ctx.beginPath();
      ctx.moveTo(c0.sx, c0.sy + 10);
      ctx.lineTo(c1.sx, c1.sy + 10);
      ctx.lineTo(c2.sx, c2.sy + 10);
      ctx.lineTo(c3.sx, c3.sy + 10);
      ctx.closePath();
      ctx.fillStyle = 'rgba(20, 40, 20, 0.28)';
      ctx.fill();
      // stone skirt
      ctx.beginPath();
      ctx.moveTo(c0.sx, c0.sy);
      ctx.lineTo(c1.sx, c1.sy);
      ctx.lineTo(c2.sx, c2.sy);
      ctx.lineTo(c3.sx, c3.sy);
      ctx.closePath();
      ctx.fillStyle = '#6a7068';
      ctx.fill();
      ctx.strokeStyle = '#3a4038';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    function drawRoom(
      ctx: CanvasRenderingContext2D,
      room: RoomView,
      o: { x: number; y: number },
      panX: number,
      panY: number,
      highlight: boolean
    ) {
      const kind = roomKind(room.name);
      const floor = FLOOR_COLOR[kind];
      const floorImg = getSprite(FLOOR_SPRITE_SRC[kind]);
      const f = floorOf(room);
      const L = f.L;
      const W = f.W;
      // Scaled from the room's real ceiling height, baseline 9ft ↔ 3 iso
      // units — tall enough to actually read as a wall (rooms felt like
      // 4-inch curbs before this), clamped so extreme values don't break
      // the cutaway look.
      const hWall = Math.max(1.6, Math.min(5.5, (room.dims.H / 9) * 3));
      const c0 = iso(o.x, o.y, 0, panX, panY);
      const c1 = iso(o.x + L, o.y, 0, panX, panY);
      const c2 = iso(o.x + L, o.y + W, 0, panX, panY);
      const c3 = iso(o.x, o.y + W, 0, panX, panY);
      const t0 = iso(o.x, o.y, hWall, panX, panY);
      const t1 = iso(o.x + L, o.y, hWall, panX, panY);
      const t3 = iso(o.x, o.y + W, hWall, panX, panY);

      // floor
      ctx.beginPath();
      ctx.moveTo(c0.sx, c0.sy);
      ctx.lineTo(c1.sx, c1.sy);
      ctx.lineTo(c2.sx, c2.sy);
      ctx.lineTo(c3.sx, c3.sy);
      ctx.closePath();
      const floorPattern = floorImg ? ctx.createPattern(floorImg, 'repeat') : null;
      if (floorPattern && floorImg) {
        anchorPatternToWorld(floorPattern, floorImg, panX, panY);
        ctx.save();
        ctx.clip();
        ctx.fillStyle = floorPattern;
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = floor;
        ctx.fill();
      }
      if (highlight) {
        ctx.fillStyle = 'rgba(240, 180, 65, 0.18)';
        ctx.fill();
      }
      // floor grain
      ctx.strokeStyle = 'rgba(60,40,20,0.12)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const a = iso(o.x + (L * i) / 4, o.y, 0, panX, panY);
        const b2 = iso(o.x + (L * i) / 4, o.y + W, 0, panX, panY);
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b2.sx, b2.sy);
        ctx.stroke();
      }
      ctx.strokeStyle = highlight ? '#f0b441' : 'rgba(60,40,25,0.45)';
      ctx.lineWidth = highlight ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(c0.sx, c0.sy);
      ctx.lineTo(c1.sx, c1.sy);
      ctx.lineTo(c2.sx, c2.sy);
      ctx.lineTo(c3.sx, c3.sy);
      ctx.closePath();
      ctx.stroke();

      // low walls (cutaway) — translucent when "see through walls" is on
      ctx.save();
      if (wallsTranslucent) ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.moveTo(c0.sx, c0.sy);
      ctx.lineTo(t0.sx, t0.sy);
      ctx.lineTo(t3.sx, t3.sy);
      ctx.lineTo(c3.sx, c3.sy);
      ctx.closePath();
      ctx.fillStyle = highlight ? '#9a7a55' : '#7d6548';
      ctx.fill();
      ctx.strokeStyle = '#4a3020';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(c0.sx, c0.sy);
      ctx.lineTo(t0.sx, t0.sy);
      ctx.lineTo(t1.sx, t1.sy);
      ctx.lineTo(c1.sx, c1.sy);
      ctx.closePath();
      ctx.fillStyle = highlight ? '#b09068' : '#947858';
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // door notch on right edge (passage cue)
      const doorY = o.y + W * 0.35;
      const d0 = iso(o.x + L, doorY, 0, panX, panY);
      const d1 = iso(o.x + L, doorY + W * 0.22, 0, panX, panY);
      ctx.strokeStyle = highlight ? '#f0b441' : '#c4a060';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(d0.sx, d0.sy);
      ctx.lineTo(d1.sx, d1.sy);
      ctx.stroke();

      const mid = iso(o.x + L / 2, o.y + W / 2, 0, panX, panY);
      ctx.fillStyle = 'rgba(15,12,8,0.78)';
      ctx.font = 'bold 11px system-ui,sans-serif';
      const tw = ctx.measureText(room.name).width + 12;
      ctx.fillRect(mid.sx - tw / 2, mid.sy - 28, tw, 16);
      ctx.fillStyle = highlight ? '#ffe8a0' : '#fff8ee';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, mid.sx, mid.sy - 16);
    }

    function drawItem(
      ctx: CanvasRenderingContext2D,
      p: PlacementView,
      o: { x: number; y: number },
      panX: number,
      panY: number,
      health: string
    ) {
      const fx = o.x + p.x;
      const fy = o.y + p.y;
      const L = Math.max(1.3, p.footprint.L);
      const W = Math.max(1.3, p.footprint.W);
      const kind = kindOf(p.label);
      const H =
        kind === 'sofa' || kind === 'bed'
          ? 0.9
          : kind === 'car'
            ? 1.15
            : 1.5;
      const body = BODY[kind];
      const rim =
        health === 'overdue'
          ? '#e05050'
          : health === 'due'
            ? '#e8a838'
            : '#3d9a5f';
      const sprite = getSprite(ITEM_SPRITE_SRC[kind]);

      if (sprite) {
        const base = iso(fx + L / 2, fy + W / 2, 0, panX, panY);
        const spriteH =
          70 * zoom * Math.max(0.75, Math.min(1.6, (L + W) / 4));
        const spriteW = spriteH * (sprite.naturalWidth / sprite.naturalHeight || 1);
        ctx.drawImage(
          sprite,
          base.sx - spriteW / 2,
          base.sy - spriteH,
          spriteW,
          spriteH
        );
        ctx.strokeStyle = rim;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(base.sx, base.sy, spriteW * 0.26, spriteW * 0.11, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const b00 = iso(fx, fy, 0, panX, panY);
        const b10 = iso(fx + L, fy, 0, panX, panY);
        const b01 = iso(fx, fy + W, 0, panX, panY);
        const t00 = iso(fx, fy, H, panX, panY);
        const t10 = iso(fx + L, fy, H, panX, panY);
        const t11 = iso(fx + L, fy + W, H, panX, panY);
        const t01 = iso(fx, fy + W, H, panX, panY);

        ctx.beginPath();
        ctx.moveTo(t00.sx, t00.sy);
        ctx.lineTo(t10.sx, t10.sy);
        ctx.lineTo(t11.sx, t11.sy);
        ctx.lineTo(t01.sx, t01.sy);
        ctx.closePath();
        ctx.fillStyle = body;
        ctx.fill();
        ctx.strokeStyle = rim;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(b00.sx, b00.sy);
        ctx.lineTo(t00.sx, t00.sy);
        ctx.lineTo(t01.sx, t01.sy);
        ctx.lineTo(b01.sx, b01.sy);
        ctx.closePath();
        ctx.fillStyle = shade(body, -28);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(b00.sx, b00.sy);
        ctx.lineTo(t00.sx, t00.sy);
        ctx.lineTo(t10.sx, t10.sy);
        ctx.lineTo(b10.sx, b10.sy);
        ctx.closePath();
        ctx.fillStyle = shade(body, -48);
        ctx.fill();
        ctx.stroke();

        if (kind === 'fridge') {
          const m = iso(fx + L * 0.55, fy + W * 0.5, H * 0.5, panX, panY);
          ctx.strokeStyle = '#6a7a88';
          ctx.beginPath();
          ctx.moveTo(m.sx, t00.sy + 4);
          ctx.lineTo(m.sx, b00.sy - 2);
          ctx.stroke();
        }
        if (kind === 'sofa') {
          const arm = iso(fx + 0.3, fy + W * 0.5, H * 0.7, panX, panY);
          ctx.fillStyle = shade(body, 20);
          ctx.beginPath();
          ctx.arc(arm.sx, arm.sy, 4 * zoom, 0, Math.PI * 2);
          ctx.fill();
        }
        if (kind === 'car') {
          // windshield + wheels so it reads as a vehicle, not a blue brick
          const win = iso(fx + L * 0.55, fy + W * 0.5, H * 0.85, panX, panY);
          ctx.fillStyle = 'rgba(160,200,230,0.85)';
          ctx.beginPath();
          ctx.ellipse(win.sx, win.sy, 10 * zoom, 5 * zoom, 0, 0, Math.PI * 2);
          ctx.fill();
          for (const [ox, oy] of [
            [0.2, 0.15],
            [0.2, 0.85],
            [0.8, 0.15],
            [0.8, 0.85],
          ] as const) {
            const wh = iso(fx + L * ox, fy + W * oy, 0.15, panX, panY);
            ctx.fillStyle = '#1a1a1e';
            ctx.beginPath();
            ctx.arc(wh.sx, wh.sy, 4.5 * zoom, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // health pulse ring for due/overdue
      if (health !== 'ok') {
        const pulse = iso(fx + L / 2, fy + W / 2, H + 0.4, panX, panY);
        ctx.beginPath();
        ctx.arc(pulse.sx, pulse.sy, 14 * zoom, 0, Math.PI * 2);
        ctx.strokeStyle =
          health === 'overdue'
            ? 'rgba(224,80,80,0.85)'
            : 'rgba(232,168,56,0.85)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      const mid = iso(fx + L / 2, fy + W / 2, H + 0.15, panX, panY);
      if (!sprite) {
        // glyph so furniture is scannable at a glance (skipped once a real sprite draws it)
        ctx.font = `${Math.round(14 * zoom)}px system-ui,sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(ICON[kind], mid.sx, mid.sy - 2);
      }
      const short = p.label.length > 16 ? p.label.slice(0, 15) + '…' : p.label;
      ctx.fillStyle = 'rgba(10,8,6,0.88)';
      ctx.font = 'bold 10px system-ui,sans-serif';
      const tw = ctx.measureText(short).width + 8;
      ctx.fillRect(mid.sx - tw / 2, mid.sy + 4, tw, 13);
      ctx.fillStyle = '#ffe8c8';
      ctx.fillText(short, mid.sx, mid.sy + 14);
      return mid;
    }

    function tryMove(dx: number, dy: number, speed = 0.38) {
      const nx = px + dx * speed;
      const ny = py + dy * speed;
      let moved = false;
      if (inWorld(nx, py)) {
        px = nx;
        moved = true;
      }
      if (inWorld(px, ny)) {
        py = ny;
        moved = true;
      }
      if (dx || dy) facing = Math.atan2(dy, dx);
      if (moved) {
        moving = true;
        walkPhase += 0.35;
      }
      const rid = roomAt(px, py);
      if (rid !== lastRoom) {
        lastRoom = rid;
        cb.onEnterRoom?.(rid);
        if (rid) cb.onSelectRoom(rid);
      }
    }

    function setTravel(tx: number, ty: number) {
      travel = { x: tx, y: ty };
    }

    function travelToRoom(roomId: string) {
      const r = current.rooms.find((x) => x.id === roomId);
      if (!r) return;
      layout(current);
      const o = roomOff.get(roomId);
      const f = roomFloor.get(roomId) ?? { L: r.dims.L, W: r.dims.W };
      if (!o) return;
      // Don't call onSelectRoom here — tryMove() fires it once the avatar
      // actually arrives (roomAt() crosses into the destination room).
      setTravel(o.x + f.L / 2, o.y + f.W / 2);
    }

    function travelToItem(itemId: string) {
      layout(current);
      const p = current.placements.find((pl) => pl.itemId === itemId);
      if (!p) return;
      const o = roomOff.get(p.roomId);
      if (!o) return;
      setTravel(o.x + p.x + p.footprint.L / 2, o.y + p.y + p.footprint.W / 2);
    }

    let hitList: { itemId: string; sx: number; sy: number; r: number }[] = [];
    let roomHits: { roomId: string; sx: number; sy: number; r: number }[] = [];

    function paint() {
      layout(current);
      const dpr = window.devicePixelRatio || 1;
      const w = el.clientWidth || 960;
      const h = el.clientHeight || 560;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#7ec8e8');
      sky.addColorStop(0.36, '#a8d4a0');
      sky.addColorStop(0.36, '#4a9a58');
      sky.addColorStop(1, '#2f6b3c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      const cam = iso(px, py, 0, 0, 0);
      const panX = w / 2 - cam.sx;
      const panY = h / 2 - cam.sy + 28;

      drawYard(ctx, panX, panY);
      drawFoundation(ctx, panX, panY);

      const roomsSorted = [...current.rooms].sort((a, b) => {
        const oa = roomOff.get(a.id)!;
        const ob = roomOff.get(b.id)!;
        return oa.x + oa.y - (ob.x + ob.y);
      });
      hitList = [];
      roomHits = [];
      const active = roomAt(px, py, 0);
      for (const room of roomsSorted) {
        const o = roomOff.get(room.id)!;
        const f = floorOf(room);
        drawRoom(ctx, room, o, panX, panY, room.id === active);
        const midR = iso(o.x + f.L / 2, o.y + f.W / 2, 0, panX, panY);
        roomHits.push({
          roomId: room.id,
          sx: midR.sx,
          sy: midR.sy,
          r: Math.max(36, Math.min(f.L, f.W) * BASE * zoom * 0.35),
        });
        for (const p of current.placements
          .filter((pl) => pl.roomId === room.id)
          .sort((a, b) => a.x + a.y - (b.x + b.y))) {
          // cars get a bigger footprint read
          const kind = kindOf(p.label);
          const fp =
            kind === 'car'
              ? {
                  ...p,
                  footprint: {
                    L: Math.max(p.footprint.L, 4.5),
                    W: Math.max(p.footprint.W, 2.4),
                  },
                }
              : p;
          const mid = drawItem(
            ctx,
            fp,
            o,
            panX,
            panY,
            current.healthByItemId[p.itemId] ?? 'ok'
          );
          hitList.push({
            itemId: p.itemId,
            sx: mid.sx,
            sy: mid.sy,
            r: kind === 'car' ? 42 * zoom : 30 * zoom,
          });
        }
      }

      // avatar — slight walk bob / leg swing
      const ap = iso(px, py, 0.3, panX, panY);
      const bob = moving ? Math.sin(walkPhase) * 2.2 : 0;
      const leg = moving ? Math.sin(walkPhase) * 5 : 0;
      const avatarSprite = getSprite(AVATAR_SPRITE_SRC);
      ctx.save();
      ctx.translate(ap.sx, ap.sy + bob);
      ctx.rotate(facing);
      if (avatarSprite) {
        // Keep the character upright rather than spinning the bitmap;
        // real art should swap directional frames here instead.
        ctx.rotate(-facing);
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 6, 11, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        const h = 44;
        const w =
          h * (avatarSprite.naturalWidth / avatarSprite.naturalHeight || 0.6);
        ctx.drawImage(avatarSprite, -w / 2, -h + 4, w, h);
      } else {
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 6, 11, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // legs
        ctx.strokeStyle = '#1a3a28';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3, 2);
        ctx.lineTo(-3 + leg * 0.3, 11);
        ctx.moveTo(3, 2);
        ctx.lineTo(3 - leg * 0.3, 11);
        ctx.stroke();
        // body
        ctx.fillStyle = '#2f9a55';
        ctx.fillRect(-8, -14, 16, 18);
        ctx.strokeStyle = '#0a2010';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-8, -14, 16, 18);
        // head
        ctx.fillStyle = '#f0c8a0';
        ctx.beginPath();
        ctx.arc(0, -18, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3a2818';
        ctx.stroke();
        // hair
        ctx.fillStyle = '#2a1a10';
        ctx.beginPath();
        ctx.arc(0, -21, 6.5, Math.PI, 0);
        ctx.fill();
        // arm (rotates with the body via ctx.rotate(facing) above)
        ctx.strokeStyle = '#f0c8a0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(8, -8);
        ctx.lineTo(13, -4);
        ctx.stroke();
      }
      ctx.restore();
      moving = false;

      ctx.fillStyle = 'rgba(10,14,18,0.78)';
      ctx.fillRect(12, h - 42, Math.min(560, w - 24), 30);
      ctx.fillStyle = '#e8f0f4';
      ctx.font = '13px system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        'WASD walk · click a room to go there · click furniture · yard is open',
        20,
        h - 22
      );
    }

    let raf = 0;
    const loop = () => {
      let dx = 0;
      let dy = 0;
      if (keys.has('w') || keys.has('arrowup')) dy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) dy += 1;
      if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;
      if (dx || dy) {
        travel = null; // manual control cancels auto-walk
        const len = Math.hypot(dx, dy) || 1;
        tryMove(dx / len, dy / len);
      } else if (travel) {
        const tdx = travel.x - px;
        const tdy = travel.y - py;
        const dist = Math.hypot(tdx, tdy);
        if (dist < 0.35) {
          travel = null;
        } else {
          tryMove(tdx / dist, tdy / dist, 0.55);
        }
      }
      paint();
      raf = requestAnimationFrame(loop);
    };

    layout(current);
    // Spawn in Living Room if present, else first room center
    const spawn =
      current.rooms.find((r) => /living/i.test(r.name)) ?? current.rooms[0];
    if (spawn) {
      const o = roomOff.get(spawn.id)!;
      const f = floorOf(spawn);
      px = o.x + f.L / 2;
      py = o.y + f.W / 2;
      lastRoom = spawn.id;
      cb.onEnterRoom?.(spawn.id);
      cb.onSelectRoom(spawn.id);
    }

    // Keys work even when canvas isn't focused (map is the main stage)
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT' ||
          t.isContentEditable)
      ) {
        return;
      }
      const k = e.key.toLowerCase();
      if (
        [
          'w',
          'a',
          's',
          'd',
          'arrowup',
          'arrowdown',
          'arrowleft',
          'arrowright',
        ].includes(k)
      ) {
        e.preventDefault();
        keys.add(k);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom = Math.max(0.6, Math.min(2.3, zoom + (e.deltaY > 0 ? -0.08 : 0.08)));
    };
    const onClick = (e: MouseEvent) => {
      canvas.focus();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let best: { id: string; d: number } | null = null;
      for (const hit of hitList) {
        const d = Math.hypot(hit.sx - mx, hit.sy - my);
        if (d < hit.r && (!best || d < best.d)) best = { id: hit.itemId, d };
      }
      if (best) {
        travelToItem(best.id);
        cb.onSelectItem(best.id);
        return;
      }
      // click room floor / label → auto-walk there
      let bestRoom: { id: string; d: number } | null = null;
      for (const hit of roomHits) {
        const d = Math.hypot(hit.sx - mx, hit.sy - my);
        if (d < hit.r && (!bestRoom || d < bestRoom.d)) {
          bestRoom = { id: hit.roomId, d };
        }
      }
      if (bestRoom) travelToRoom(bestRoom.id);
    };

    if (interactive) {
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      canvas.addEventListener('wheel', onWheel, { passive: false });
      canvas.addEventListener('click', onClick);
      setTimeout(() => canvas.focus(), 50);
    }
    raf = requestAnimationFrame(loop);

    return {
      update(next) {
        current = next;
        layout(current);
      },
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        canvas.removeEventListener('wheel', onWheel);
        canvas.removeEventListener('click', onClick);
        canvas.remove();
      },
      travelToRoom,
      travelToItem,
      setWallsTranslucent(v: boolean) {
        wallsTranslucent = v;
      },
    } satisfies HouseRendererHandle;
  },
};
