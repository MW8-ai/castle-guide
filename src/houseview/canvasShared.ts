import type {
  HouseRendererCallbacks,
  HouseRendererHandle,
  HouseViewModel,
  PlacementView,
  RoomView,
} from './types';

export type DrawStyle = 'iso' | 'pixel';

const SCALE_ISO = 22;
const SCALE_PIXEL = 16;

const ROOM_FILLS = [
  '#3d5a4c',
  '#4a5568',
  '#5c4a3a',
  '#3a4a5c',
  '#4a3a5c',
  '#3a5c4a',
];

function iconForLabel(label: string, categoryHint = ''): string {
  const s = `${label} ${categoryHint}`.toLowerCase();
  if (s.includes('fridge') || s.includes('refriger')) return '🧊';
  if (s.includes('range') || s.includes('oven') || s.includes('stove')) return '🔥';
  if (s.includes('water') || s.includes('heater') || s.includes('rheem')) return '💧';
  if (s.includes('furnace') || s.includes('hvac') || s.includes('carrier')) return '🌡️';
  if (s.includes('wash')) return '👕';
  if (s.includes('dry')) return '🌀';
  if (s.includes('dish')) return '🍽️';
  return '📦';
}

export function createCanvasRenderer(
  pluginId: string,
  label: string,
  style: DrawStyle
): {
  id: string;
  label: string;
  mount: (
    el: HTMLElement,
    model: HouseViewModel,
    cb: HouseRendererCallbacks
  ) => HouseRendererHandle;
} {
  return {
    id: pluginId,
    label,
    mount(el, model, cb) {
      const canvas = document.createElement('canvas');
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.cursor = 'grab';
      el.innerHTML = '';
      el.appendChild(canvas);

      let current = model;
      let dragging: {
        placementId: string;
        offsetX: number;
        offsetY: number;
      } | null = null;
      const roomOffsets = new Map<string, { x: number; y: number }>();
      let scale = style === 'pixel' ? SCALE_PIXEL : SCALE_ISO;
      let origin = { x: 80, y: 100 };

      function project(x: number, y: number) {
        if (style === 'pixel') {
          return {
            sx: origin.x + x * scale,
            sy: origin.y + y * scale,
          };
        }
        return {
          sx: origin.x + (x - y) * scale,
          sy: origin.y + (x + y) * (scale / 2),
        };
      }

      function layoutOffsets(m: HouseViewModel) {
        roomOffsets.clear();
        // 2-column-ish layout for readability
        let col = 0;
        let row = 0;
        let rowHeight = 0;
        const maxRowW = 28;
        let x = 0;
        let y = 0;
        for (const room of m.rooms) {
          if (x > 0 && x + room.dims.L > maxRowW) {
            x = 0;
            y += rowHeight + 2;
            rowHeight = 0;
            row++;
            col = 0;
          }
          roomOffsets.set(room.id, { x, y });
          x += room.dims.L + 2;
          rowHeight = Math.max(rowHeight, room.dims.W);
          col++;
        }
        void row;
      }

      function bounds(m: HouseViewModel) {
        layoutOffsets(m);
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (const room of m.rooms) {
          const off = roomOffsets.get(room.id) ?? { x: 0, y: 0 };
          const corners = [
            [off.x, off.y],
            [off.x + room.dims.L, off.y],
            [off.x + room.dims.L, off.y + room.dims.W],
            [off.x, off.y + room.dims.W],
          ];
          for (const [fx, fy] of corners) {
            const p = project(fx, fy);
            minX = Math.min(minX, p.sx);
            maxX = Math.max(maxX, p.sx);
            minY = Math.min(minY, p.sy);
            maxY = Math.max(maxY, p.sy);
          }
        }
        if (!Number.isFinite(minX)) {
          return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
        }
        return { minX, minY, maxX, maxY };
      }

      function fitToView(w: number, h: number) {
        // Reset origin/scale then measure and center
        origin = { x: 0, y: 0 };
        scale = style === 'pixel' ? SCALE_PIXEL : SCALE_ISO;
        const b1 = bounds(current);
        const contentW = b1.maxX - b1.minX || 1;
        const contentH = b1.maxY - b1.minY || 1;
        const pad = 48;
        const sx = (w - pad * 2) / contentW;
        const sy = (h - pad * 2) / contentH;
        const fit = Math.min(sx, sy, style === 'pixel' ? 18 : 28);
        scale = Math.max(10, fit * (style === 'iso' ? 1 : 1));
        // re-measure with new scale
        origin = { x: 0, y: 0 };
        const b2 = bounds(current);
        const cw = b2.maxX - b2.minX;
        const ch = b2.maxY - b2.minY;
        origin = {
          x: (w - cw) / 2 - b2.minX,
          y: (h - ch) / 2 - b2.minY,
        };
      }

      function drawYard(
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number
      ) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#1a3a2a');
        g.addColorStop(0.45, '#2d4a38');
        g.addColorStop(1, '#1e3328');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // soft dots as foliage suggestion
        ctx.fillStyle = 'rgba(80, 140, 90, 0.25)';
        for (let i = 0; i < 40; i++) {
          const x = (i * 97) % w;
          const y = (i * 53) % h;
          ctx.beginPath();
          ctx.arc(x, y, 8 + (i % 5), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function drawRoom(
        ctx: CanvasRenderingContext2D,
        room: RoomView,
        off: { x: number; y: number },
        fill: string,
        index: number
      ) {
        const corners = [
          { x: off.x, y: off.y },
          { x: off.x + room.dims.L, y: off.y },
          { x: off.x + room.dims.L, y: off.y + room.dims.W },
          { x: off.x, y: off.y + room.dims.W },
        ].map((c) => project(c.x, c.y));

        // shadow
        ctx.beginPath();
        ctx.moveTo(corners[0].sx + 4, corners[0].sy + 6);
        for (let i = 1; i < corners.length; i++)
          ctx.lineTo(corners[i].sx + 4, corners[i].sy + 6);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(corners[0].sx, corners[0].sy);
        for (let i = 1; i < corners.length; i++)
          ctx.lineTo(corners[i].sx, corners[i].sy);
        ctx.closePath();
        ctx.fillStyle = fill || ROOM_FILLS[index % ROOM_FILLS.length];
        ctx.strokeStyle = style === 'pixel' ? '#e8c98a' : '#8ec8a0';
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();

        const mid = project(
          off.x + room.dims.L / 2,
          off.y + room.dims.W / 2
        );
        ctx.fillStyle = 'rgba(15, 20, 25, 0.55)';
        const tw = ctx.measureText(room.name).width + 16;
        ctx.fillRect(mid.sx - tw / 2, mid.sy - 22, tw, 20);
        ctx.fillStyle = '#f4f7fb';
        ctx.font =
          style === 'pixel'
            ? 'bold 12px monospace'
            : 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(room.name, mid.sx, mid.sy - 8);
      }

      function healthColor(h: string): string {
        if (h === 'overdue') return '#e07070';
        if (h === 'due') return '#e8b86d';
        return '#6bcf8e';
      }

      function drawPlacement(
        ctx: CanvasRenderingContext2D,
        p: PlacementView,
        off: { x: number; y: number },
        health: string
      ) {
        const x0 = off.x + p.x;
        const y0 = off.y + p.y;
        const corners = [
          { x: x0, y: y0 },
          { x: x0 + p.footprint.L, y: y0 },
          { x: x0 + p.footprint.L, y: y0 + p.footprint.W },
          { x: x0, y: y0 + p.footprint.W },
        ].map((c) => project(c.x, c.y));

        ctx.beginPath();
        ctx.moveTo(corners[0].sx, corners[0].sy);
        for (let i = 1; i < corners.length; i++)
          ctx.lineTo(corners[i].sx, corners[i].sy);
        ctx.closePath();
        ctx.fillStyle = healthColor(health);
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        const mid = project(
          x0 + p.footprint.L / 2,
          y0 + p.footprint.W / 2
        );
        const icon = iconForLabel(p.label);
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.fillText(icon, mid.sx, mid.sy - 2);
        ctx.fillStyle = '#0f1419';
        ctx.font = 'bold 10px system-ui, sans-serif';
        const short = p.label.length > 12 ? p.label.slice(0, 11) + '…' : p.label;
        ctx.fillText(short, mid.sx, mid.sy + 14);
      }

      function screenToFeet(mx: number, my: number): { x: number; y: number } {
        if (style === 'pixel') {
          return {
            x: (mx - origin.x) / scale,
            y: (my - origin.y) / scale,
          };
        }
        const relX = mx - origin.x;
        const relY = my - origin.y;
        return {
          x: relX / scale / 2 + relY / scale,
          y: relY / scale - relX / scale / 2,
        };
      }

      function hitPlacement(mx: number, my: number): PlacementView | null {
        const ft = screenToFeet(mx, my);
        // reverse order so top items win
        for (let i = current.placements.length - 1; i >= 0; i--) {
          const p = current.placements[i];
          const off = roomOffsets.get(p.roomId) ?? { x: 0, y: 0 };
          const x0 = off.x + p.x;
          const y0 = off.y + p.y;
          if (
            ft.x >= x0 &&
            ft.x <= x0 + p.footprint.L &&
            ft.y >= y0 &&
            ft.y <= y0 + p.footprint.W
          ) {
            return p;
          }
        }
        return null;
      }

      const paint = () => {
        const dpr = window.devicePixelRatio || 1;
        const w = el.clientWidth || 800;
        const h = el.clientHeight || 480;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        fitToView(w, h);
        drawYard(ctx, w, h);

        layoutOffsets(current);
        current.rooms.forEach((room, i) => {
          const off = roomOffsets.get(room.id) ?? { x: 0, y: 0 };
          drawRoom(
            ctx,
            room,
            off,
            ROOM_FILLS[i % ROOM_FILLS.length],
            i
          );
        });
        for (const p of current.placements) {
          const off = roomOffsets.get(p.roomId) ?? { x: 0, y: 0 };
          const health = current.healthByItemId[p.itemId] ?? 'ok';
          drawPlacement(ctx, p, off, health);
        }
      };

      let moved = false;
      const onPointerDown = (ev: PointerEvent) => {
        moved = false;
        const rect = canvas.getBoundingClientRect();
        const mx = ev.clientX - rect.left;
        const my = ev.clientY - rect.top;
        const hit = hitPlacement(mx, my);
        if (hit) {
          const ft = screenToFeet(mx, my);
          const off = roomOffsets.get(hit.roomId) ?? { x: 0, y: 0 };
          dragging = {
            placementId: hit.id,
            offsetX: ft.x - (off.x + hit.x),
            offsetY: ft.y - (off.y + hit.y),
          };
          canvas.setPointerCapture(ev.pointerId);
          canvas.style.cursor = 'grabbing';
        }
      };

      const onPointerMove = (ev: PointerEvent) => {
        if (!dragging) return;
        moved = true;
        const rect = canvas.getBoundingClientRect();
        const mx = ev.clientX - rect.left;
        const my = ev.clientY - rect.top;
        const ft = screenToFeet(mx, my);
        const p = current.placements.find((x) => x.id === dragging!.placementId);
        if (!p) return;
        const off = roomOffsets.get(p.roomId) ?? { x: 0, y: 0 };
        const nx = Math.max(0, ft.x - off.x - dragging.offsetX);
        const ny = Math.max(0, ft.y - off.y - dragging.offsetY);
        p.x = Math.round(nx * 10) / 10;
        p.y = Math.round(ny * 10) / 10;
        paint();
      };

      const onPointerUp = (ev: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        const mx = ev.clientX - rect.left;
        const my = ev.clientY - rect.top;
        if (dragging) {
          const p = current.placements.find(
            (x) => x.id === dragging!.placementId
          );
          if (p) {
            cb.onMovePlacement(p.id, {
              x: p.x,
              y: p.y,
              rotation: p.rotation,
            });
            if (!moved) cb.onSelectItem(p.itemId);
          }
          dragging = null;
          canvas.style.cursor = 'grab';
        } else {
          const hit = hitPlacement(mx, my);
          if (hit) cb.onSelectItem(hit.itemId);
          else {
            for (const room of current.rooms) {
              const off = roomOffsets.get(room.id) ?? { x: 0, y: 0 };
              const mid = project(
                off.x + room.dims.L / 2,
                off.y + room.dims.W / 2
              );
              const dx = mx - mid.sx;
              const dy = my - mid.sy;
              if (dx * dx + dy * dy < 90 * 90) {
                cb.onSelectRoom(room.id);
                break;
              }
            }
          }
        }
      };

      const onResize = () => paint();
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      window.addEventListener('resize', onResize);
      paint();

      return {
        update(next) {
          current = next;
          paint();
        },
        destroy() {
          canvas.removeEventListener('pointerdown', onPointerDown);
          canvas.removeEventListener('pointermove', onPointerMove);
          canvas.removeEventListener('pointerup', onPointerUp);
          window.removeEventListener('resize', onResize);
          canvas.remove();
        },
      };
    },
  };
}
