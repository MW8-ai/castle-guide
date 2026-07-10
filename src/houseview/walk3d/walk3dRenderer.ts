import type {
  HouseRendererCallbacks,
  HouseRendererHandle,
  HouseRendererPlugin,
} from '../types';

/**
 * Lightweight first-person-style walkthrough using canvas (no Three.js dependency).
 * Rooms as floor plan with height-extruded walls; WASD / click to select.
 * BLUEPRINT full Three.js remains in HUMAN_DIRECTIONS — this is a working socket plug.
 */
export const walk3dRenderer: HouseRendererPlugin = {
  id: 'walk3d',
  label: 'Walkthrough 3D',
  mount(el, model, cb) {
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    el.innerHTML = '';
    el.appendChild(canvas);

    let current = model;
    let angle = 0.4;
    let camX = 8;
    let camY = 8;
    const keys = new Set<string>();

    const paint = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = el.clientWidth || 800;
      const h = el.clientHeight || 420;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Sky / floor
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1a2740');
      grad.addColorStop(0.5, '#2a3548');
      grad.addColorStop(0.5, '#3a4a3a');
      grad.addColorStop(1, '#2a3028');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Perspective floor grid from camera
      const ox = w / 2;
      const oy = h * 0.65;

      function worldToScreen(x: number, y: number, z: number) {
        // camera-relative
        const dx = x - camX;
        const dy = y - camY;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        const depth = ry + 8;
        if (depth < 0.5) return null;
        const f = 220 / depth;
        return {
          sx: ox + rx * f,
          sy: oy - z * f * 0.8 - (depth - 8) * 2,
          f,
          depth,
        };
      }

      let roomOffX = 0;
      for (const room of current.rooms) {
        const corners = [
          [roomOffX, 0],
          [roomOffX + room.dims.L, 0],
          [roomOffX + room.dims.L, room.dims.W],
          [roomOffX, room.dims.W],
        ] as [number, number][];
        const floor = corners
          .map(([x, y]) => worldToScreen(x, y, 0))
          .filter(Boolean) as { sx: number; sy: number }[];
        if (floor.length === 4) {
          ctx.beginPath();
          ctx.moveTo(floor[0].sx, floor[0].sy);
          for (let i = 1; i < 4; i++) ctx.lineTo(floor[i].sx, floor[i].sy);
          ctx.closePath();
          ctx.fillStyle = 'rgba(60, 80, 100, 0.55)';
          ctx.strokeStyle = '#5b9fd4';
          ctx.fill();
          ctx.stroke();
        }

        // wall height lines
        for (const [x, y] of corners) {
          const a = worldToScreen(x, y, 0);
          const b = worldToScreen(x, y, room.dims.H * 0.35);
          if (a && b) {
            ctx.strokeStyle = 'rgba(200,220,255,0.35)';
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }

        for (const p of current.placements.filter((pl) => pl.roomId === room.id)) {
          const px = roomOffX + p.x + p.footprint.L / 2;
          const py = p.y + p.footprint.W / 2;
          const s = worldToScreen(px, py, 1.2);
          if (!s) continue;
          const health = current.healthByItemId[p.itemId] ?? 'ok';
          const size = Math.max(8, 28 * (s.f / 40));
          ctx.fillStyle =
            health === 'overdue'
              ? '#e07a7a'
              : health === 'due'
                ? '#e8b86d'
                : '#6bcf8e';
          ctx.beginPath();
          ctx.arc(s.sx, s.sy, size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#e8eef5';
          ctx.font = '11px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(p.label.slice(0, 14), s.sx, s.sy - size / 2 - 4);
        }

        roomOffX += room.dims.L + 2;
      }

      ctx.fillStyle = '#9aabbd';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${current.houseName} · Walkthrough · WASD move · Q/E turn · click item`,
        16,
        h - 16
      );
    };

    const screenHits: { itemId: string; sx: number; sy: number; r: number }[] =
      [];

    const paintWithHits = () => {
      paint();
      // rebuild hits roughly for click
      screenHits.length = 0;
      // simplified: store last placement screen positions during paint — recompute
      const w = el.clientWidth || 800;
      const h = el.clientHeight || 420;
      const ox = w / 2;
      const oy = h * 0.65;
      function worldToScreen(x: number, y: number, z: number) {
        const dx = x - camX;
        const dy = y - camY;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        const depth = ry + 8;
        if (depth < 0.5) return null;
        const f = 220 / depth;
        return { sx: ox + rx * f, sy: oy - z * f * 0.8, f };
      }
      let roomOffX = 0;
      for (const room of current.rooms) {
        for (const p of current.placements.filter((pl) => pl.roomId === room.id)) {
          const px = roomOffX + p.x + p.footprint.L / 2;
          const py = p.y + p.footprint.W / 2;
          const s = worldToScreen(px, py, 1.2);
          if (s)
            screenHits.push({
              itemId: p.itemId,
              sx: s.sx,
              sy: s.sy,
              r: Math.max(8, 28 * (s.f / 40)),
            });
        }
        roomOffX += room.dims.L + 2;
      }
    };

    let raf = 0;
    const tick = () => {
      let moved = false;
      const speed = 0.15;
      if (keys.has('w') || keys.has('arrowup')) {
        camX += Math.sin(angle) * speed;
        camY += Math.cos(angle) * speed;
        moved = true;
      }
      if (keys.has('s') || keys.has('arrowdown')) {
        camX -= Math.sin(angle) * speed;
        camY -= Math.cos(angle) * speed;
        moved = true;
      }
      if (keys.has('a') || keys.has('arrowleft')) {
        camX -= Math.cos(angle) * speed;
        camY += Math.sin(angle) * speed;
        moved = true;
      }
      if (keys.has('d') || keys.has('arrowright')) {
        camX += Math.cos(angle) * speed;
        camY -= Math.sin(angle) * speed;
        moved = true;
      }
      if (keys.has('q')) {
        angle -= 0.04;
        moved = true;
      }
      if (keys.has('e')) {
        angle += 0.04;
        moved = true;
      }
      if (moved || true) paintWithHits();
      raf = requestAnimationFrame(tick);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
    };
    const onClick = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      const my = ev.clientY - rect.top;
      for (const hit of screenHits) {
        const dx = mx - hit.sx;
        const dy = my - hit.sy;
        if (dx * dx + dy * dy < hit.r * hit.r * 2) {
          cb.onSelectItem(hit.itemId);
          return;
        }
      }
    };
    const onResize = () => paintWithHits();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);
    raf = requestAnimationFrame(tick);

    const handle: HouseRendererHandle = {
      update(next) {
        current = next;
      },
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        canvas.removeEventListener('click', onClick);
        window.removeEventListener('resize', onResize);
        canvas.remove();
      },
    };
    void (cb as HouseRendererCallbacks).onMovePlacement;
    return handle;
  },
};
