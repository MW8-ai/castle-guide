import type {
  HouseRendererCallbacks,
  HouseRendererHandle,
  HouseViewModel,
  PlacementView,
  RoomView,
} from './types';

export type DrawStyle = 'iso' | 'pixel';

const SCALE_ISO = 18;
const SCALE_PIXEL = 14;

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
      const scale = style === 'pixel' ? SCALE_PIXEL : SCALE_ISO;
      const origin = { x: 80, y: 100 };

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
        let cursorX = 0;
        for (const room of m.rooms) {
          roomOffsets.set(room.id, { x: cursorX, y: 0 });
          cursorX += room.dims.L + 2;
        }
      }

      function drawRoom(
        ctx: CanvasRenderingContext2D,
        room: RoomView,
        off: { x: number; y: number },
        fill: string
      ) {
        const corners = [
          { x: off.x, y: off.y },
          { x: off.x + room.dims.L, y: off.y },
          { x: off.x + room.dims.L, y: off.y + room.dims.W },
          { x: off.x, y: off.y + room.dims.W },
        ].map((c) => project(c.x, c.y));

        ctx.beginPath();
        ctx.moveTo(corners[0].sx, corners[0].sy);
        for (let i = 1; i < corners.length; i++)
          ctx.lineTo(corners[i].sx, corners[i].sy);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.strokeStyle = style === 'pixel' ? '#c4a574' : '#5b9fd4';
        ctx.lineWidth = style === 'pixel' ? 3 : 2;
        if (style === 'pixel') ctx.imageSmoothingEnabled = false;
        ctx.fill();
        ctx.stroke();

        const mid = project(
          off.x + room.dims.L / 2,
          off.y + room.dims.W / 2
        );
        ctx.fillStyle = style === 'pixel' ? '#f4e4bc' : '#e8eef5';
        ctx.font = style === 'pixel' ? '12px monospace' : '14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${room.name} (${room.dims.L}'×${room.dims.W}')`,
          mid.sx,
          mid.sy
        );
      }

      function healthColor(h: string): string {
        if (h === 'overdue') return '#e07a7a';
        if (h === 'due') return '#e8b86d';
        return style === 'pixel' ? '#7ecf8a' : '#6bcf8e';
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
        ctx.strokeStyle = '#e8eef5';
        ctx.fill();
        ctx.stroke();

        const mid = project(
          x0 + p.footprint.L / 2,
          y0 + p.footprint.W / 2
        );
        ctx.fillStyle = '#0f1419';
        ctx.font =
          style === 'pixel' ? 'bold 11px monospace' : 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(p.label.slice(0, 18), mid.sx, mid.sy);
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

      function hitPlacement(
        mx: number,
        my: number
      ): PlacementView | null {
        const ft = screenToFeet(mx, my);
        for (const p of current.placements) {
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
        const h = el.clientHeight || 420;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = style === 'pixel' ? '#1a1520' : '#0f1419';
        ctx.fillRect(0, 0, w, h);

        layoutOffsets(current);
        const fills =
          style === 'pixel'
            ? ['#3d2e4a', '#2e3d2e']
            : ['#243044', '#2a3a28'];
        current.rooms.forEach((room, i) => {
          const off = roomOffsets.get(room.id) ?? { x: 0, y: 0 };
          drawRoom(ctx, room, off, fills[i % fills.length]);
        });
        for (const p of current.placements) {
          const off = roomOffsets.get(p.roomId) ?? { x: 0, y: 0 };
          const health = current.healthByItemId[p.itemId] ?? 'ok';
          drawPlacement(ctx, p, off, health);
        }

        ctx.fillStyle = '#9aabbd';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(
          `${current.houseName} · ${label} · drag appliances · click for card`,
          16,
          h - 16
        );
      };

      const onPointerDown = (ev: PointerEvent) => {
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
        const rect = canvas.getBoundingClientRect();
        const mx = ev.clientX - rect.left;
        const my = ev.clientY - rect.top;
        const ft = screenToFeet(mx, my);
        const p = current.placements.find((x) => x.id === dragging!.placementId);
        if (!p) return;
        const off = roomOffsets.get(p.roomId) ?? { x: 0, y: 0 };
        const nx = Math.max(0, ft.x - off.x - dragging.offsetX);
        const ny = Math.max(0, ft.y - off.y - dragging.offsetY);
        // Optimistic local update
        p.x = Math.round(nx * 10) / 10;
        p.y = Math.round(ny * 10) / 10;
        paint();
      };

      const onPointerUp = (ev: PointerEvent) => {
        if (dragging) {
          const p = current.placements.find((x) => x.id === dragging!.placementId);
          if (p) {
            cb.onMovePlacement(p.id, {
              x: p.x,
              y: p.y,
              rotation: p.rotation,
            });
          }
          dragging = null;
          canvas.style.cursor = 'grab';
        } else {
          const rect = canvas.getBoundingClientRect();
          const mx = ev.clientX - rect.left;
          const my = ev.clientY - rect.top;
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
              if (dx * dx + dy * dy < 70 * 70) {
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
