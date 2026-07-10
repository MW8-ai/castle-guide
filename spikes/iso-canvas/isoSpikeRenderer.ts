import type {
  HouseRendererCallbacks,
  HouseRendererHandle,
  HouseRendererPlugin,
  HouseViewModel,
  PlacementView,
  RoomView,
} from '../../src/houseview/types';

/** Feet → screen scale for the throwaway spike only */
const SCALE = 18;
const ORIGIN_X = 80;
const ORIGIN_Y = 120;

function isoProject(x: number, y: number): { sx: number; sy: number } {
  // Classic 2:1 isometric
  return {
    sx: ORIGIN_X + (x - y) * SCALE,
    sy: ORIGIN_Y + (x + y) * (SCALE / 2),
  };
}

function roomPolygon(room: RoomView, offsetX: number, offsetY: number) {
  const corners = [
    { x: offsetX, y: offsetY },
    { x: offsetX + room.dims.L, y: offsetY },
    { x: offsetX + room.dims.L, y: offsetY + room.dims.W },
    { x: offsetX, y: offsetY + room.dims.W },
  ].map((c) => isoProject(c.x, c.y));
  return corners;
}

function drawRoom(
  ctx: CanvasRenderingContext2D,
  room: RoomView,
  offsetX: number,
  offsetY: number,
  fill: string
) {
  const pts = roomPolygon(room, offsetX, offsetY);
  ctx.beginPath();
  ctx.moveTo(pts[0].sx, pts[0].sy);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].sx, pts[i].sy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = '#5b9fd4';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();

  const labelAt = isoProject(
    offsetX + room.dims.L / 2,
    offsetY + room.dims.W / 2
  );
  ctx.fillStyle = '#e8eef5';
  ctx.font = '14px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${room.name} (${room.dims.L}'×${room.dims.W}')`,
    labelAt.sx,
    labelAt.sy
  );
}

function drawPlacement(
  ctx: CanvasRenderingContext2D,
  placement: PlacementView,
  roomOffset: { x: number; y: number },
  health: string
) {
  const x0 = roomOffset.x + placement.x;
  const y0 = roomOffset.y + placement.y;
  const corners = [
    { x: x0, y: y0 },
    { x: x0 + placement.footprint.L, y: y0 },
    { x: x0 + placement.footprint.L, y: y0 + placement.footprint.W },
    { x: x0, y: y0 + placement.footprint.W },
  ].map((c) => isoProject(c.x, c.y));

  ctx.beginPath();
  ctx.moveTo(corners[0].sx, corners[0].sy);
  for (let i = 1; i < corners.length; i++)
    ctx.lineTo(corners[i].sx, corners[i].sy);
  ctx.closePath();
  ctx.fillStyle = health === 'overdue' ? '#e07a7a' : '#6bcf8e';
  ctx.strokeStyle = '#e8eef5';
  ctx.fill();
  ctx.stroke();

  const mid = isoProject(
    x0 + placement.footprint.L / 2,
    y0 + placement.footprint.W / 2
  );
  ctx.fillStyle = '#0f1419';
  ctx.font = 'bold 12px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(placement.label, mid.sx, mid.sy);
}

/** Hit-test in room-local feet approx via inverse iso (spike-quality) */
function hitPlacement(
  mx: number,
  my: number,
  placement: PlacementView,
  roomOffset: { x: number; y: number }
): boolean {
  // Convert screen ≈ inverse of isoProject (spike only)
  const relX = mx - ORIGIN_X;
  const relY = my - ORIGIN_Y;
  const ftX = relX / SCALE / 2 + relY / SCALE;
  const ftY = relY / SCALE - relX / SCALE / 2;
  const x0 = roomOffset.x + placement.x;
  const y0 = roomOffset.y + placement.y;
  return (
    ftX >= x0 &&
    ftX <= x0 + placement.footprint.L &&
    ftY >= y0 &&
    ftY <= y0 + placement.footprint.W
  );
}

export function createIsoSpikeRenderer(): HouseRendererPlugin {
  return {
    id: 'iso-spike',
    label: 'Isometric spike',
    mount(el, model, cb) {
      const canvas = document.createElement('canvas');
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      el.appendChild(canvas);

      let current = model;
      const roomOffsets = new Map<string, { x: number; y: number }>();

      // Place kitchen at origin; living room to the right with a gap in foot-space
      function layoutOffsets(m: HouseViewModel) {
        roomOffsets.clear();
        let cursorX = 0;
        for (const room of m.rooms) {
          roomOffsets.set(room.id, { x: cursorX, y: 0 });
          cursorX += room.dims.L + 2;
        }
      }

      const paint = () => {
        const dpr = window.devicePixelRatio || 1;
        const w = el.clientWidth || 800;
        const h = el.clientHeight || 500;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0f1419';
        ctx.fillRect(0, 0, w, h);

        layoutOffsets(current);
        const fills = ['#243044', '#2a3a28'];
        current.rooms.forEach((room, i) => {
          const off = roomOffsets.get(room.id) ?? { x: 0, y: 0 };
          drawRoom(ctx, room, off.x, off.y, fills[i % fills.length]);
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
          `${current.houseName} · dims drive footprint · click appliance`,
          16,
          h - 16
        );
      };

      const onClick = (ev: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const mx = ev.clientX - rect.left;
        const my = ev.clientY - rect.top;
        for (const p of current.placements) {
          const off = roomOffsets.get(p.roomId) ?? { x: 0, y: 0 };
          if (hitPlacement(mx, my, p, off)) {
            cb.onSelectItem(p.itemId);
            return;
          }
        }
        // Room hit (rough): nearest room origin
        for (const room of current.rooms) {
          const off = roomOffsets.get(room.id) ?? { x: 0, y: 0 };
          const center = isoProject(
            off.x + room.dims.L / 2,
            off.y + room.dims.W / 2
          );
          const dx = mx - center.sx;
          const dy = my - center.sy;
          if (dx * dx + dy * dy < 80 * 80) {
            cb.onSelectRoom(room.id);
            return;
          }
        }
      };

      const onResize = () => paint();
      canvas.addEventListener('click', onClick);
      window.addEventListener('resize', onResize);
      paint();

      const handle: HouseRendererHandle = {
        update(next) {
          current = next;
          paint();
        },
        destroy() {
          canvas.removeEventListener('click', onClick);
          window.removeEventListener('resize', onResize);
          canvas.remove();
        },
      };

      // Silence unused callback in spike while keeping the type surface complete
      void (cb as HouseRendererCallbacks).onMovePlacement;

      return handle;
    },
  };
}
