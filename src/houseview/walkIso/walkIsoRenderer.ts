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
  generic: '📦',
};

function floorColor(name: string): string {
  const s = name.toLowerCase();
  if (/bath|toilet/.test(s)) return '#b8c8c4';
  if (/kitchen/.test(s)) return '#d4c4a0';
  if (/garage/.test(s)) return '#8a9098';
  if (/utility|laundry|mech/.test(s)) return '#9aa0a8';
  if (/bed|primary/.test(s)) return '#c9b8a0';
  if (/living|family|dining/.test(s)) return '#c4a574';
  if (/office/.test(s)) return '#b8a888';
  return '#c2a878';
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
    /** World origin of each room cell (grid-packed, no gaps). */
    let roomOff = new Map<string, { x: number; y: number }>();
    /** Floor size of each cell — fills the grid so rooms share edges. */
    let roomFloor = new Map<string, { L: number; W: number }>();

    /**
     * Pack rooms into a tight grid with ZERO gaps. Each room fills its full
     * cell so floors share edges — walk room-to-room without island traps.
     */
    function layout(m: HouseViewModel) {
      roomOff.clear();
      roomFloor.clear();
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
      // gap = 0 → shared walls; each room occupies its full cell
      for (const c of cells) {
        let ox = 0;
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

    function inHouse(wx: number, wy: number): boolean {
      const b = houseBounds();
      // tiny edge pad so you don't snag on float boundaries
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
      const floor = floorColor(room.name);
      const f = floorOf(room);
      const L = f.L;
      const W = f.W;
      const hWall = 1.15;
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
      ctx.fillStyle = floor;
      ctx.fill();
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

      // low walls (cutaway)
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
      // glyph so furniture is scannable at a glance
      ctx.font = `${Math.round(14 * zoom)}px system-ui,sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(ICON[kind], mid.sx, mid.sy - 2);
      const short = p.label.length > 16 ? p.label.slice(0, 15) + '…' : p.label;
      ctx.fillStyle = 'rgba(10,8,6,0.88)';
      ctx.font = 'bold 10px system-ui,sans-serif';
      const tw = ctx.measureText(short).width + 8;
      ctx.fillRect(mid.sx - tw / 2, mid.sy + 4, tw, 13);
      ctx.fillStyle = '#ffe8c8';
      ctx.fillText(short, mid.sx, mid.sy + 14);
      return mid;
    }

    function tryMove(dx: number, dy: number) {
      const speed = 0.38;
      // Axis-separate so you can slide along walls into the next room
      const nx = px + dx * speed;
      const ny = py + dy * speed;
      if (inHouse(nx, py)) px = nx;
      if (inHouse(px, ny)) py = ny;
      if (dx || dy) facing = Math.atan2(dy, dx);
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

      drawFoundation(ctx, panX, panY);

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
        'WASD / arrows — walk room to room  ·  scroll zoom  ·  click furniture',
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
