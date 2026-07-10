import type {
  HouseRendererHandle,
  HouseRendererPlugin,
  HouseViewModel,
  PlacementView,
} from '../types';

/**
 * Zelda-style top-down walk-around of the home.
 * WASD/arrows move, scroll zooms, click or walk near + click items.
 */
export const exploreRenderer: HouseRendererPlugin = {
  id: 'explore',
  label: 'Walk around',
  mount(el, model, cb) {
    const canvas = document.createElement('canvas');
    canvas.tabIndex = 0;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.cursor = 'crosshair';
    canvas.style.outline = 'none';
    el.innerHTML = '';
    el.appendChild(canvas);

    let current = model;
    let zoom = 28; // px per foot
    const keys = new Set<string>();

    // Player in world feet coords
    let px = 8;
    let py = 8;
    let facing = 0; // radians

    type WorldRoom = {
      id: string;
      name: string;
      ox: number;
      oy: number;
      L: number;
      W: number;
    };
    let worldRooms: WorldRoom[] = [];
    type WorldItem = PlacementView & { wx: number; wy: number };
    let worldItems: WorldItem[] = [];

    function layoutWorld(m: HouseViewModel) {
      worldRooms = [];
      // Connected floor plan: kitchen-living row, utility-garage south
      const gap = 0.5;
      let x = 0;
      const row1 = m.rooms.slice(0, 2);
      const row2 = m.rooms.slice(2);
      let maxH = 0;
      for (const r of row1.length ? row1 : m.rooms) {
        worldRooms.push({
          id: r.id,
          name: r.name,
          ox: x,
          oy: 0,
          L: r.dims.L,
          W: r.dims.W,
        });
        maxH = Math.max(maxH, r.dims.W);
        x += r.dims.L + gap;
      }
      x = 0;
      const y2 = maxH + gap;
      for (const r of row2) {
        worldRooms.push({
          id: r.id,
          name: r.name,
          ox: x,
          oy: y2,
          L: r.dims.L,
          W: r.dims.W,
        });
        x += r.dims.L + gap;
      }
      // fallback single row if only few rooms
      if (worldRooms.length === 0) {
        m.rooms.forEach((r, i) => {
          worldRooms.push({
            id: r.id,
            name: r.name,
            ox: i * (r.dims.L + 1),
            oy: 0,
            L: r.dims.L,
            W: r.dims.W,
          });
        });
      }

      worldItems = [];
      for (const p of m.placements) {
        const room = worldRooms.find((r) => r.id === p.roomId);
        if (!room) continue;
        worldItems.push({
          ...p,
          wx: room.ox + p.x + p.footprint.L / 2,
          wy: room.oy + p.y + p.footprint.W / 2,
        });
      }

      // Spawn player in first room center if far away
      if (worldRooms[0]) {
        const r0 = worldRooms[0];
        const inAny = worldRooms.some(
          (r) =>
            px >= r.ox &&
            px <= r.ox + r.L &&
            py >= r.oy &&
            py <= r.oy + r.W
        );
        if (!inAny) {
          px = r0.ox + r0.L / 2;
          py = r0.oy + r0.W / 2;
        }
      }
    }

    function iconFor(label: string): string {
      const s = label.toLowerCase();
      if (s.includes('fridge') || s.includes('lg ') || s.includes('refriger'))
        return '🧊';
      if (s.includes('range') || s.includes('oven') || s.includes('ge '))
        return '🔥';
      if (s.includes('water') || s.includes('rheem') || s.includes('heater'))
        return '💧';
      if (s.includes('furnace') || s.includes('carrier') || s.includes('hvac'))
        return '🌡️';
      if (s.includes('wash')) return '👕';
      if (s.includes('dry')) return '🌀';
      if (s.includes('dish')) return '🍽️';
      if (s.includes('tv') || s.includes('sofa') || s.includes('couch'))
        return '📺';
      if (s.includes('bed')) return '🛏️';
      if (s.includes('toilet') || s.includes('bath')) return '🚿';
      if (s.includes('car') || s.includes('truck')) return '🚗';
      return '📦';
    }

    function paint() {
      layoutWorld(current);
      const dpr = window.devicePixelRatio || 1;
      const w = el.clientWidth || 800;
      const h = el.clientHeight || 520;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Camera: center on player
      const camX = px * zoom - w / 2;
      const camY = py * zoom - h / 2;

      // Grass field
      const grass = ctx.createLinearGradient(0, 0, 0, h);
      grass.addColorStop(0, '#3d7a4a');
      grass.addColorStop(0.5, '#4a9a58');
      grass.addColorStop(1, '#2f6b3c');
      ctx.fillStyle = grass;
      ctx.fillRect(0, 0, w, h);

      // Grass texture dots
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 80; i++) {
        const gx = ((i * 73 - camX * 0.2) % w + w) % w;
        const gy = ((i * 91 - camY * 0.2) % h + h) % h;
        ctx.beginPath();
        ctx.arc(gx, gy, 2 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }

      // Soft path around house
      ctx.fillStyle = 'rgba(180, 160, 100, 0.35)';
      for (const r of worldRooms) {
        const x = r.ox * zoom - camX - 12;
        const y = r.oy * zoom - camY - 12;
        ctx.fillRect(x, y, r.L * zoom + 24, r.W * zoom + 24);
      }

      // Rooms
      const fills = ['#c4a574', '#d4b896', '#b8956a', '#c9b08a', '#a89070'];
      worldRooms.forEach((r, i) => {
        const x = r.ox * zoom - camX;
        const y = r.oy * zoom - camY;
        const rw = r.L * zoom;
        const rh = r.W * zoom;

        // floor shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 4, y + 6, rw, rh);

        ctx.fillStyle = fills[i % fills.length];
        ctx.strokeStyle = '#5a4030';
        ctx.lineWidth = 3;
        ctx.fillRect(x, y, rw, rh);
        ctx.strokeRect(x, y, rw, rh);

        // floor boards
        ctx.strokeStyle = 'rgba(90, 60, 40, 0.15)';
        ctx.lineWidth = 1;
        for (let fy = y + 8; fy < y + rh; fy += 10) {
          ctx.beginPath();
          ctx.moveTo(x + 2, fy);
          ctx.lineTo(x + rw - 2, fy);
          ctx.stroke();
        }

        // room name plate
        ctx.fillStyle = 'rgba(20, 16, 12, 0.55)';
        const label = r.name;
        ctx.font = 'bold 13px system-ui, sans-serif';
        const tw = ctx.measureText(label).width + 14;
        ctx.fillRect(x + 8, y + 8, tw, 22);
        ctx.fillStyle = '#fff8ee';
        ctx.textAlign = 'left';
        ctx.fillText(label, x + 15, y + 24);
      });

      // Items
      for (const it of worldItems) {
        const ix = it.wx * zoom - camX;
        const iy = it.wy * zoom - camY;
        const health = current.healthByItemId[it.itemId] ?? 'ok';
        const col =
          health === 'overdue'
            ? '#e07070'
            : health === 'due'
              ? '#e8b86d'
              : '#6bcf8e';
        const size = Math.max(22, Math.min(it.footprint.L, it.footprint.W) * zoom * 0.55);

        ctx.fillStyle = col;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        roundRect(ctx, ix - size / 2, iy - size / 2, size, size, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = `${Math.floor(size * 0.55)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(iconFor(it.label), ix, iy - 2);

        ctx.fillStyle = '#1a1208';
        ctx.font = 'bold 10px system-ui';
        ctx.textBaseline = 'top';
        const short =
          it.label.length > 14 ? it.label.slice(0, 13) + '…' : it.label;
        ctx.fillText(short, ix, iy + size / 2 + 2);
      }

      // Player (link-ish green tunic vibe, simple)
      const ppx = px * zoom - camX;
      const ppy = py * zoom - camY;
      ctx.save();
      ctx.translate(ppx, ppy);
      ctx.rotate(facing);
      // body
      ctx.fillStyle = '#2d8a4e';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0a2010';
      ctx.lineWidth = 2;
      ctx.stroke();
      // head
      ctx.fillStyle = '#f0c8a0';
      ctx.beginPath();
      ctx.arc(0, -14, 7, 0, Math.PI * 2);
      ctx.fill();
      // facing nose
      ctx.fillStyle = '#1a5030';
      ctx.fillRect(8, -3, 6, 4);
      ctx.restore();

      // HUD chrome
      ctx.fillStyle = 'rgba(10, 16, 12, 0.72)';
      ctx.fillRect(12, h - 52, 320, 40);
      ctx.fillStyle = '#e8f5ec';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('WASD / arrows — walk   ·   Scroll — zoom   ·   Click item', 24, h - 32);

      ctx.fillStyle = 'rgba(10, 16, 12, 0.72)';
      ctx.fillRect(w - 120, 12, 100, 36);
      ctx.fillStyle = '#e8f5ec';
      ctx.textAlign = 'center';
      ctx.fillText(`Zoom ${Math.round(zoom)}`, w - 70, 30);
    }

    function roundRect(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function tryMove(dx: number, dy: number) {
      const speed = 0.18;
      const nx = px + dx * speed;
      const ny = py + dy * speed;
      // soft walls: stay inside union of rooms expanded slightly (hallways between)
      const ok = worldRooms.some((r) => {
        const pad = 0.35;
        return (
          nx >= r.ox - pad &&
          nx <= r.ox + r.L + pad &&
          ny >= r.oy - pad &&
          ny <= r.oy + r.W + pad
        );
      });
      if (ok || worldRooms.length === 0) {
        px = nx;
        py = ny;
        if (dx || dy) facing = Math.atan2(dy, dx);
      }
    }

    let raf = 0;
    const tick = () => {
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
      raf = requestAnimationFrame(tick);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(
          k
        )
      ) {
        e.preventDefault();
        keys.add(k);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = zoom + (e.deltaY > 0 ? -2 : 2);
      zoom = Math.max(14, Math.min(56, next));
    };
    const onClick = (e: MouseEvent) => {
      canvas.focus();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const w = el.clientWidth || 800;
      const h = el.clientHeight || 520;
      const camX = px * zoom - w / 2;
      const camY = py * zoom - h / 2;
      const wx = (mx + camX) / zoom;
      const wy = (my + camY) / zoom;

      let best: WorldItem | null = null;
      let bestD = 1.8;
      for (const it of worldItems) {
        const d = Math.hypot(it.wx - wx, it.wy - wy);
        if (d < bestD) {
          bestD = d;
          best = it;
        }
      }
      // also near player
      if (!best) {
        for (const it of worldItems) {
          const d = Math.hypot(it.wx - px, it.wy - py);
          if (d < 2.2 && d < bestD) {
            bestD = d;
            best = it;
          }
        }
      }
      if (best) cb.onSelectItem(best.itemId);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('click', onClick);
    const onResize = () => paint();
    window.addEventListener('resize', onResize);

    layoutWorld(current);
    raf = requestAnimationFrame(tick);
    setTimeout(() => canvas.focus(), 50);

    const handle: HouseRendererHandle = {
      update(next) {
        current = next;
        layoutWorld(current);
      },
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        canvas.removeEventListener('wheel', onWheel);
        canvas.removeEventListener('click', onClick);
        window.removeEventListener('resize', onResize);
        canvas.remove();
      },
    };
    void cb.onMovePlacement;
    void cb.onSelectRoom;
    return handle;
  },
};
