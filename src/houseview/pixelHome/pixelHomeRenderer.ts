import type {
  HouseRendererHandle,
  HouseRendererPlugin,
  HouseViewModel,
  PlacementView,
  RoomView,
} from '../types';

const TILE = 20; // feet → iso scale base

type SpriteKind =
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
  | 'generic';

function kindFromLabel(label: string): SpriteKind {
  const s = label.toLowerCase();
  if (s.includes('fridge') || s.includes('refriger') || s.includes('lg'))
    return 'fridge';
  if (s.includes('range') || s.includes('oven') || s.includes('stove'))
    return 'range';
  if (s.includes('wash')) return 'washer';
  if (s.includes('dry')) return 'dryer';
  if (s.includes('water') || s.includes('rheem') || s.includes('heater'))
    return 'heater';
  if (s.includes('furnace') || s.includes('carrier')) return 'furnace';
  if (s.includes('a/c') || s.includes('ac') || s.includes('air')) return 'ac';
  if (s.includes('tv') || s.includes('sony')) return 'tv';
  if (s.includes('sofa') || s.includes('couch')) return 'sofa';
  if (s.includes('bed') || s.includes('malm')) return 'bed';
  if (s.includes('toilet') || s.includes('bath') || s.includes('toto'))
    return 'toilet';
  return 'generic';
}

/**
 * Cozy pixel-isometric home map — game-first visual for homeowners.
 * Pan (drag) + zoom (wheel). Click furniture for data cards.
 */
export const pixelHomeRenderer: HouseRendererPlugin = {
  id: 'pixel-home',
  label: 'Pixel home',
  mount(el, model, cb) {
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.cursor = 'grab';
    canvas.style.imageRendering = 'pixelated';
    el.innerHTML = '';
    el.appendChild(canvas);

    let current = model;
    let zoom = 1.15;
    let panX = 0;
    let panY = 0;
    let dragging = false;
    let lastMX = 0;
    let lastMY = 0;
    let downX = 0;
    let downY = 0;
    let roomOff = new Map<string, { x: number; y: number }>();

    function layout(m: HouseViewModel) {
      roomOff.clear();
      // Connected floor plan in foot-space
      let x = 0;
      let y = 0;
      let rowH = 0;
      const maxW = 36;
      for (const r of m.rooms) {
        if (x > 0 && x + r.dims.L > maxW) {
          x = 0;
          y += rowH + 1.5;
          rowH = 0;
        }
        roomOff.set(r.id, { x, y });
        x += r.dims.L + 1.2;
        rowH = Math.max(rowH, r.dims.W);
      }
    }

    function iso(fx: number, fy: number, z = 0) {
      const s = TILE * zoom;
      return {
        sx: panX + (fx - fy) * s,
        sy: panY + (fx + fy) * (s * 0.5) - z * s * 0.45,
      };
    }

    function fit(w: number, h: number) {
      layout(current);
      zoom = 1.2;
      panX = 0;
      panY = 0;
      // measure bounds
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      const mark = (fx: number, fy: number) => {
        const p = iso(fx, fy);
        minX = Math.min(minX, p.sx);
        maxX = Math.max(maxX, p.sx);
        minY = Math.min(minY, p.sy);
        maxY = Math.max(maxY, p.sy);
      };
      for (const r of current.rooms) {
        const o = roomOff.get(r.id)!;
        mark(o.x, o.y);
        mark(o.x + r.dims.L, o.y);
        mark(o.x, o.y + r.dims.W);
        mark(o.x + r.dims.L, o.y + r.dims.W);
      }
      if (!Number.isFinite(minX)) return;
      const cw = maxX - minX || 1;
      const ch = maxY - minY || 1;
      const pad = 40;
      const fitZ = Math.min((w - pad * 2) / cw, (h - pad * 2) / ch) * zoom;
      zoom = Math.max(0.7, Math.min(2.2, fitZ));
      // remeasure
      minX = Infinity;
      minY = Infinity;
      maxX = -Infinity;
      maxY = -Infinity;
      panX = 0;
      panY = 0;
      for (const r of current.rooms) {
        const o = roomOff.get(r.id)!;
        mark(o.x, o.y);
        mark(o.x + r.dims.L, o.y);
        mark(o.x, o.y + r.dims.W);
        mark(o.x + r.dims.L, o.y + r.dims.W);
      }
      panX = (w - (maxX - minX)) / 2 - minX;
      panY = (h - (maxY - minY)) / 2 - minY + 10;
    }

    function drawGrass(ctx: CanvasRenderingContext2D, w: number, h: number) {
      ctx.fillStyle = '#3a7d4a';
      ctx.fillRect(0, 0, w, h);
      // chunky pixel dots
      for (let i = 0; i < 120; i++) {
        const x = (i * 47) % w;
        const y = (i * 31) % h;
        ctx.fillStyle = i % 3 === 0 ? '#4a9458' : '#2f6b3c';
        ctx.fillRect(x, y, 3, 3);
      }
      // sky band
      const g = ctx.createLinearGradient(0, 0, 0, h * 0.35);
      g.addColorStop(0, '#7ec8e3');
      g.addColorStop(1, 'rgba(126,200,227,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h * 0.4);
    }

    function drawRoom(
      ctx: CanvasRenderingContext2D,
      room: RoomView,
      o: { x: number; y: number },
      idx: number
    ) {
      const floors = ['#c4a574', '#d2b48c', '#b8956a', '#c9b48a'];
      const floor = floors[idx % floors.length];
      const hWall = 1.2;

      // floor diamond
      const c0 = iso(o.x, o.y);
      const c1 = iso(o.x + room.dims.L, o.y);
      const c2 = iso(o.x + room.dims.L, o.y + room.dims.W);
      const c3 = iso(o.x, o.y + room.dims.W);

      // shadow
      ctx.beginPath();
      ctx.moveTo(c0.sx + 4, c0.sy + 6);
      ctx.lineTo(c1.sx + 4, c1.sy + 6);
      ctx.lineTo(c2.sx + 4, c2.sy + 6);
      ctx.lineTo(c3.sx + 4, c3.sy + 6);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(c0.sx, c0.sy);
      ctx.lineTo(c1.sx, c1.sy);
      ctx.lineTo(c2.sx, c2.sy);
      ctx.lineTo(c3.sx, c3.sy);
      ctx.closePath();
      ctx.fillStyle = floor;
      ctx.fill();
      ctx.strokeStyle = '#5a3d28';
      ctx.lineWidth = 2;
      ctx.stroke();

      // left wall
      const w0 = iso(o.x, o.y, hWall);
      const w3 = iso(o.x, o.y + room.dims.W, hWall);
      ctx.beginPath();
      ctx.moveTo(c0.sx, c0.sy);
      ctx.lineTo(w0.sx, w0.sy);
      ctx.lineTo(w3.sx, w3.sy);
      ctx.lineTo(c3.sx, c3.sy);
      ctx.closePath();
      ctx.fillStyle = '#8b6b4a';
      ctx.fill();
      ctx.strokeStyle = '#4a3020';
      ctx.stroke();

      // right wall
      const w1 = iso(o.x + room.dims.L, o.y, hWall);
      ctx.beginPath();
      ctx.moveTo(c0.sx, c0.sy);
      ctx.lineTo(w0.sx, w0.sy);
      ctx.lineTo(w1.sx, w1.sy);
      ctx.lineTo(c1.sx, c1.sy);
      ctx.closePath();
      ctx.fillStyle = '#a08060';
      ctx.fill();
      ctx.stroke();

      // room label
      const mid = iso(o.x + room.dims.L / 2, o.y + room.dims.W / 2);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = 'rgba(20,12,8,0.75)';
      ctx.fillRect(mid.sx - 36, mid.sy - 28, 72, 14);
      ctx.fillStyle = '#fff6e8';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(room.name.toUpperCase(), mid.sx, mid.sy - 18);
    }

    function drawAppliance(
      ctx: CanvasRenderingContext2D,
      p: PlacementView,
      o: { x: number; y: number },
      health: string
    ) {
      const fx = o.x + p.x;
      const fy = o.y + p.y;
      const L = p.footprint.L;
      const W = p.footprint.W;
      const H = 1.4;
      const kind = kindFromLabel(p.label);

      // iso box corners bottom
      const b00 = iso(fx, fy);
      const b10 = iso(fx + L, fy);
      const b01 = iso(fx, fy + W);
      const t00 = iso(fx, fy, H);
      const t10 = iso(fx + L, fy, H);
      const t11 = iso(fx + L, fy + W, H);
      const t01 = iso(fx, fy + W, H);

      const rim =
        health === 'overdue'
          ? '#e05050'
          : health === 'due'
            ? '#e8a838'
            : '#3d9a5f';

      // colors by kind
      const body =
        kind === 'fridge'
          ? '#c5d0dc'
          : kind === 'range'
            ? '#3a3a40'
            : kind === 'washer' || kind === 'dryer'
              ? '#e8eef4'
              : kind === 'heater'
                ? '#d0d4d8'
                : kind === 'furnace' || kind === 'ac'
                  ? '#6a7a8a'
                  : kind === 'tv'
                    ? '#1a1a22'
                    : kind === 'sofa'
                      ? '#5a7a9a'
                      : kind === 'bed'
                        ? '#8a6a9a'
                        : kind === 'toilet'
                          ? '#f0f4f8'
                          : '#9ab0c0';

      // top
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

      // left face
      ctx.beginPath();
      ctx.moveTo(b00.sx, b00.sy);
      ctx.lineTo(t00.sx, t00.sy);
      ctx.lineTo(t01.sx, t01.sy);
      ctx.lineTo(b01.sx, b01.sy);
      ctx.closePath();
      ctx.fillStyle = shade(body, -25);
      ctx.fill();
      ctx.stroke();

      // right face
      ctx.beginPath();
      ctx.moveTo(b00.sx, b00.sy);
      ctx.lineTo(t00.sx, t00.sy);
      ctx.lineTo(t10.sx, t10.sy);
      ctx.lineTo(b10.sx, b10.sy);
      ctx.closePath();
      ctx.fillStyle = shade(body, -45);
      ctx.fill();
      ctx.stroke();

      // icon detail on top face
      ctx.fillStyle = '#1a1208';
      ctx.font = `${Math.max(10, Math.floor(10 * zoom))}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      const mid = iso(fx + L / 2, fy + W / 2, H + 0.15);
      const glyph =
        kind === 'fridge'
          ? 'FR'
          : kind === 'range'
            ? 'OV'
            : kind === 'heater'
              ? 'WH'
              : kind === 'furnace'
                ? 'HV'
                : kind === 'washer'
                  ? 'WA'
                  : kind === 'dryer'
                    ? 'DR'
                    : kind === 'tv'
                      ? 'TV'
                      : kind === 'sofa'
                        ? 'SF'
                        : kind === 'bed'
                          ? 'BD'
                          : kind === 'toilet'
                            ? 'WC'
                            : 'IT';
      ctx.fillText(glyph, mid.sx, mid.sy);

      // name plate
      ctx.fillStyle = 'rgba(10,8,6,0.85)';
      const label =
        p.label.length > 16 ? p.label.slice(0, 15) + '…' : p.label;
      ctx.font = `bold ${Math.max(9, Math.floor(9 * zoom))}px "Courier New", monospace`;
      const tw = ctx.measureText(label).width + 8;
      ctx.fillRect(mid.sx - tw / 2, mid.sy + 6, tw, 12);
      ctx.fillStyle = '#ffe8c8';
      ctx.fillText(label, mid.sx, mid.sy + 15);

      return { mid, p };
    }

    function shade(hex: string, amt: number): string {
      const n = parseInt(hex.slice(1), 16);
      let r = (n >> 16) + amt;
      let g = ((n >> 8) & 0xff) + amt;
      let b = (n & 0xff) + amt;
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      return `rgb(${r},${g},${b})`;
    }

    const hitList: {
      itemId: string;
      sx: number;
      sy: number;
      r: number;
    }[] = [];

    function paint() {
      const dpr = window.devicePixelRatio || 1;
      const w = el.clientWidth || 900;
      const h = el.clientHeight || 520;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      drawGrass(ctx, w, h);
      layout(current);

      // sort rooms back-to-front by iso depth
      const roomsSorted = [...current.rooms].sort((a, b) => {
        const oa = roomOff.get(a.id)!;
        const ob = roomOff.get(b.id)!;
        return oa.x + oa.y - (ob.x + ob.y);
      });

      hitList.length = 0;
      roomsSorted.forEach((room, i) => {
        const o = roomOff.get(room.id)!;
        drawRoom(ctx, room, o, i);
        const items = current.placements
          .filter((p) => p.roomId === room.id)
          .sort((a, b) => a.x + a.y - (b.x + b.y));
        for (const p of items) {
          const health = current.healthByItemId[p.itemId] ?? 'ok';
          const drawn = drawAppliance(ctx, p, o, health);
          hitList.push({
            itemId: p.itemId,
            sx: drawn.mid.sx,
            sy: drawn.mid.sy,
            r: 28 * zoom,
          });
        }
      });

      // HUD
      ctx.fillStyle = 'rgba(12,10,8,0.8)';
      ctx.fillRect(10, h - 36, Math.min(w - 20, 420), 26);
      ctx.fillStyle = '#ffe8c8';
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        'DRAG map  ·  SCROLL zoom  ·  CLICK furniture for details',
        18,
        h - 18
      );
    }

    let fitted = false;
    function paintFit() {
      const w = el.clientWidth || 900;
      const h = el.clientHeight || 520;
      if (!fitted && w > 50) {
        fit(w, h);
        fitted = true;
      }
      paint();
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = zoom + (e.deltaY > 0 ? -0.1 : 0.1);
      zoom = Math.max(0.6, Math.min(2.4, next));
      paint();
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastMX = e.clientX;
      lastMY = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      panX += e.clientX - lastMX;
      panY += e.clientY - lastMY;
      lastMX = e.clientX;
      lastMY = e.clientY;
      paint();
    };
    const onUp = (e: PointerEvent) => {
      const dragDist = Math.hypot(e.clientX - downX, e.clientY - downY);
      dragging = false;
      canvas.style.cursor = 'grab';
      if (dragDist > 6) return; // pan, not click
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let best: (typeof hitList)[0] | null = null;
      let bestD = 36 * zoom;
      for (const hit of hitList) {
        const d = Math.hypot(hit.sx - mx, hit.sy - my);
        if (d < bestD) {
          bestD = d;
          best = hit;
        }
      }
      if (best) cb.onSelectItem(best.itemId);
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    window.addEventListener('resize', () => {
      fitted = false;
      paintFit();
    });
    requestAnimationFrame(paintFit);

    return {
      update(next) {
        current = next;
        paint();
      },
      destroy() {
        canvas.removeEventListener('wheel', onWheel);
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp);
        canvas.remove();
      },
    } satisfies HouseRendererHandle;
  },
};
