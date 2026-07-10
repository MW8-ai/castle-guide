import type {
  HouseRendererHandle,
  HouseRendererPlugin,
  HouseViewModel,
  PlacementView,
  RoomView,
} from '../types';

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
  generic: '#9ab0c0',
};

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
export const walkIsoRenderer: HouseRendererPlugin = {
  id: 'walk-iso',
  label: 'Walk house',
  mount(el, model, cb) {
    const canvas = document.createElement('canvas');
    canvas.tabIndex = 0;
    canvas.style.cssText =
      'display:block;width:100%;height:100%;outline:none;image-rendering:pixelated;cursor:crosshair';
    el.innerHTML = '';
    el.appendChild(canvas);

    let current = model;
    let zoom = 1.05;
    const keys = new Set<string>();
    let px = 6;
    let py = 6;
    let facing = 0;
    let lastRoom: string | null = null;
    let roomOff = new Map<string, { x: number; y: number }>();

    /**
     * Pack rooms into a tight grid with ZERO gaps so you can walk
     * room-to-room across shared edges (no island trapping).
     */
    function layout(m: HouseViewModel) {
      roomOff.clear();
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
      const rooms = [...m.rooms].sort((a, b) => {
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
      // gap = 0 → shared walls; walkable across boundaries
      for (const c of cells) {
        let ox = 0;
        for (let k = 0; k < c.col; k++) ox += colWidths[k];
        let oy = 0;
        for (let k = 0; k < c.row; k++) oy += rowHeights[k] ?? 0;
        // Center smaller rooms inside their cell so edges still touch the grid
        const cellL = colWidths[c.col];
        const cellW = rowHeights[c.row] ?? c.r.dims.W;
        const insetX = (cellL - c.r.dims.L) / 2;
        const insetY = (cellW - c.r.dims.W) / 2;
        roomOff.set(c.r.id, { x: ox + insetX, y: oy + insetY });
      }
    }

    /** Full house footprint — walkable floor (not just room islands). */
    function houseBounds() {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const r of current.rooms) {
        const o = roomOff.get(r.id);
        if (!o) continue;
        minX = Math.min(minX, o.x);
        minY = Math.min(minY, o.y);
        maxX = Math.max(maxX, o.x + r.dims.L);
        maxY = Math.max(maxY, o.y + r.dims.W);
      }
      if (!Number.isFinite(minX)) {
        return { minX: 0, minY: 0, maxX: 20, maxY: 20 };
      }
      // expand slightly so doorways between slightly inset rooms still work
      return {
        minX: minX - 0.25,
        minY: minY - 0.25,
        maxX: maxX + 0.25,
        maxY: maxY + 0.25,
      };
    }

    function inHouse(wx: number, wy: number): boolean {
      const b = houseBounds();
      return wx >= b.minX && wx <= b.maxX && wy >= b.minY && wy <= b.maxY;
    }

    function iso(fx: number, fy: number, z = 0, panX = 0, panY = 0) {
      const s = BASE * zoom;
      return {
        sx: panX + (fx - fy) * s,
        sy: panY + (fx + fy) * (s * 0.5) - z * s * 0.42,
      };
    }

    function roomAt(wx: number, wy: number, pad = 0.15): string | null {
      let best: { id: string; d: number } | null = null;
      for (const r of current.rooms) {
        const o = roomOff.get(r.id);
        if (!o) continue;
        if (
          wx >= o.x - pad &&
          wx <= o.x + r.dims.L + pad &&
          wy >= o.y - pad &&
          wy <= o.y + r.dims.W + pad
        ) {
          // prefer room whose center is closest (for edge cases)
          const cx = o.x + r.dims.L / 2;
          const cy = o.y + r.dims.W / 2;
          const d = Math.hypot(wx - cx, wy - cy);
          if (!best || d < best.d) best = { id: r.id, d };
        }
      }
      return best?.id ?? null;
    }

    function drawRoom(
      ctx: CanvasRenderingContext2D,
      room: RoomView,
      o: { x: number; y: number },
      panX: number,
      panY: number,
      highlight: boolean
    ) {
      const floors = ['#c4a574', '#d2b896', '#b8956a', '#c9b48a', '#a89070'];
      const idx = Math.abs(room.name.charCodeAt(0)) % floors.length;
      const hWall = 1.1;
      const c0 = iso(o.x, o.y, 0, panX, panY);
      const c1 = iso(o.x + room.dims.L, o.y, 0, panX, panY);
      const c2 = iso(o.x + room.dims.L, o.y + room.dims.W, 0, panX, panY);
      const c3 = iso(o.x, o.y + room.dims.W, 0, panX, panY);
      const t0 = iso(o.x, o.y, hWall, panX, panY);
      const t1 = iso(o.x + room.dims.L, o.y, hWall, panX, panY);
      const t3 = iso(o.x, o.y + room.dims.W, hWall, panX, panY);

      ctx.beginPath();
      ctx.moveTo(c0.sx, c0.sy);
      ctx.lineTo(c1.sx, c1.sy);
      ctx.lineTo(c2.sx, c2.sy);
      ctx.lineTo(c3.sx, c3.sy);
      ctx.closePath();
      ctx.fillStyle = floors[idx];
      ctx.fill();
      ctx.strokeStyle = highlight ? '#f0b441' : '#5a3d28';
      ctx.lineWidth = highlight ? 3.5 : 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(c0.sx, c0.sy);
      ctx.lineTo(t0.sx, t0.sy);
      ctx.lineTo(t3.sx, t3.sy);
      ctx.lineTo(c3.sx, c3.sy);
      ctx.closePath();
      ctx.fillStyle = highlight ? '#9a7a55' : '#8b6b4a';
      ctx.fill();
      ctx.strokeStyle = '#4a3020';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(c0.sx, c0.sy);
      ctx.lineTo(t0.sx, t0.sy);
      ctx.lineTo(t1.sx, t1.sy);
      ctx.lineTo(c1.sx, c1.sy);
      ctx.closePath();
      ctx.fillStyle = highlight ? '#b09068' : '#a08060';
      ctx.fill();
      ctx.stroke();

      const mid = iso(
        o.x + room.dims.L / 2,
        o.y + room.dims.W / 2,
        0,
        panX,
        panY
      );
      ctx.fillStyle = 'rgba(15,12,8,0.72)';
      ctx.font = 'bold 12px system-ui,sans-serif';
      const tw = ctx.measureText(room.name).width + 14;
      ctx.fillRect(mid.sx - tw / 2, mid.sy - 26, tw, 18);
      ctx.fillStyle = '#fff8ee';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, mid.sx, mid.sy - 13);
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

      const mid = iso(fx + L / 2, fy + W / 2, H + 0.15, panX, panY);
      const short = p.label.length > 14 ? p.label.slice(0, 13) + '…' : p.label;
      ctx.fillStyle = 'rgba(10,8,6,0.85)';
      ctx.font = 'bold 10px system-ui,sans-serif';
      const tw = ctx.measureText(short).width + 8;
      ctx.fillRect(mid.sx - tw / 2, mid.sy + 2, tw, 13);
      ctx.fillStyle = '#ffe8c8';
      ctx.textAlign = 'center';
      ctx.fillText(short, mid.sx, mid.sy + 12);
      return mid;
    }

    function tryMove(dx: number, dy: number) {
      const speed = 0.28;
      const nx = px + dx * speed;
      const ny = py + dy * speed;
      // Whole house footprint is walkable — rooms are zones, not cages
      if (inHouse(nx, ny)) {
        px = nx;
        py = ny;
        if (dx || dy) facing = Math.atan2(dy, dx);
      }
      const rid = roomAt(px, py);
      if (rid !== lastRoom) {
        lastRoom = rid;
        cb.onEnterRoom?.(rid);
        if (rid) cb.onSelectRoom(rid);
      }
    }

    let hitList: { itemId: string; sx: number; sy: number; r: number }[] = [];

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

      const roomsSorted = [...current.rooms].sort((a, b) => {
        const oa = roomOff.get(a.id)!;
        const ob = roomOff.get(b.id)!;
        return oa.x + oa.y - (ob.x + ob.y);
      });
      hitList = [];
      const active = roomAt(px, py, 0);
      for (const room of roomsSorted) {
        const o = roomOff.get(room.id)!;
        drawRoom(ctx, room, o, panX, panY, room.id === active);
        for (const p of current.placements
          .filter((pl) => pl.roomId === room.id)
          .sort((a, b) => a.x + a.y - (b.x + b.y))) {
          const mid = drawItem(
            ctx,
            p,
            o,
            panX,
            panY,
            current.healthByItemId[p.itemId] ?? 'ok'
          );
          hitList.push({
            itemId: p.itemId,
            sx: mid.sx,
            sy: mid.sy,
            r: 30 * zoom,
          });
        }
      }

      const ap = iso(px, py, 0.3, panX, panY);
      ctx.save();
      ctx.translate(ap.sx, ap.sy);
      ctx.rotate(facing);
      ctx.fillStyle = '#2d8a4e';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0a2010';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#f0c8a0';
      ctx.beginPath();
      ctx.arc(0, -13, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a5030';
      ctx.fillRect(8, -2, 6, 3);
      ctx.restore();

      ctx.fillStyle = 'rgba(10,14,18,0.78)';
      ctx.fillRect(12, h - 42, Math.min(520, w - 24), 30);
      ctx.fillStyle = '#e8f0f4';
      ctx.font = '13px system-ui,sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        'WASD — walk between rooms  ·  scroll zoom  ·  click fridge / couch / water heater',
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
        const len = Math.hypot(dx, dy) || 1;
        tryMove(dx / len, dy / len);
      }
      paint();
      raf = requestAnimationFrame(loop);
    };

    layout(current);
    if (current.rooms[0]) {
      const r0 = current.rooms[0];
      const o = roomOff.get(r0.id)!;
      px = o.x + r0.dims.L / 2;
      py = o.y + r0.dims.W / 2;
      lastRoom = r0.id;
      cb.onEnterRoom?.(r0.id);
    }

    const onKeyDown = (e: KeyboardEvent) => {
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
      if (best) cb.onSelectItem(best.id);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('click', onClick);
    raf = requestAnimationFrame(loop);
    setTimeout(() => canvas.focus(), 50);

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
    } satisfies HouseRendererHandle;
  },
};
