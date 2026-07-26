import * as THREE from 'three';
import type {
  HouseRendererHandle,
  HouseRendererPlugin,
  HouseViewModel,
  RoomView,
} from '../types';

/**
 * Real first-person/orbit 3D walkthrough — the Three.js plugin blueprinted
 * in HUMAN_DIRECTIONS.md and ADR-0002. Rooms are boxes extruded to their
 * real height in feet (no isometric compression needed, unlike walkIso),
 * items are simple colored boxes tinted by maintenance health, and the
 * camera orbits a target point via drag + scroll.
 */

const WALL_THICKNESS = 0.2;
const ITEM_HEIGHT = 2;

interface RoomRect {
  x: number;
  y: number;
  L: number;
  W: number;
}

/** Positioned rooms keep their saved spot; everything else auto-packs into
 * a simple 4-column grid, same approach walkIsoRenderer uses. */
function layoutRooms(rooms: RoomView[]): Map<string, RoomRect> {
  const layout = new Map<string, RoomRect>();
  const positioned = rooms.filter((r) => r.pos);
  let autoOriginX = 0;
  for (const r of positioned) {
    layout.set(r.id, { x: r.pos!.x, y: r.pos!.y, L: r.dims.L, W: r.dims.W });
    autoOriginX = Math.max(autoOriginX, r.pos!.x + r.dims.L);
  }
  const unpositioned = rooms.filter((r) => !r.pos);
  const cols = 4;
  const colWidths: number[] = Array.from({ length: cols }, () => 0);
  const rowHeights: number[] = [];
  const cells: { r: RoomView; col: number; row: number }[] = [];
  let col = 0;
  let row = 0;
  for (const r of unpositioned) {
    cells.push({ r, col, row });
    colWidths[col] = Math.max(colWidths[col], r.dims.L);
    rowHeights[row] = Math.max(rowHeights[row] ?? 0, r.dims.W);
    col++;
    if (col >= cols) {
      col = 0;
      row++;
    }
  }
  for (const c of cells) {
    let ox = autoOriginX;
    for (let k = 0; k < c.col; k++) ox += colWidths[k];
    let oy = 0;
    for (let k = 0; k < c.row; k++) oy += rowHeights[k] ?? 0;
    layout.set(c.r.id, {
      x: ox,
      y: oy,
      L: colWidths[c.col],
      W: rowHeights[c.row] ?? c.r.dims.W,
    });
  }
  return layout;
}

/** feet (x, y-on-floor, z-up) → Three.js world (x, up, depth) */
function toWorld(fx: number, fy: number, fz = 0): THREE.Vector3 {
  return new THREE.Vector3(fx, fz, fy);
}

const ROOM_COLORS = [
  0xc9a876, 0xb8c8c4, 0xc4a574, 0xa08050, 0x9aa0a8, 0xc9b8a0, 0x8a9098,
];
function colorForRoom(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ROOM_COLORS[Math.abs(h) % ROOM_COLORS.length];
}

export const walk3dRenderer: HouseRendererPlugin = {
  id: 'walk3d',
  label: '3D Walkthrough',
  mount(el, model, cb): HouseRendererHandle {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    el.innerHTML = '';
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.cursor = 'grab';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9ecdf0);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x445544, 0.9);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(30, 40, 20);
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: 0x4a8a54 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    const sceneRoot = new THREE.Group();
    scene.add(sceneRoot);

    // ── Orbit camera — drag to rotate, wheel to zoom ──
    let target = new THREE.Vector3(15, 0, 10);
    let azimuth = Math.PI * 0.25;
    let polar = Math.PI * 0.32;
    let distance = 45;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    function applyCamera() {
      const clampedPolar = Math.max(0.12, Math.min(Math.PI / 2 - 0.05, polar));
      const sinP = Math.sin(clampedPolar);
      camera.position.set(
        target.x + distance * sinP * Math.sin(azimuth),
        target.y + distance * Math.cos(clampedPolar),
        target.z + distance * sinP * Math.cos(azimuth)
      );
      camera.lookAt(target);
    }
    applyCamera();

    function resize() {
      const w = el.clientWidth || 800;
      const h = el.clientHeight || 420;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.style.cursor = 'grabbing';
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      azimuth -= dx * 0.006;
      polar -= dy * 0.006;
      applyCamera();
    };
    const onPointerUp = () => {
      dragging = false;
      renderer.domElement.style.cursor = 'grab';
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      distance = Math.max(6, Math.min(140, distance + (e.deltaY > 0 ? 3 : -3)));
      applyCamera();
    };

    let current: HouseViewModel = model;
    let roomLayout = layoutRooms(model.rooms);
    let translucent = false;
    const wallMaterials: THREE.MeshStandardMaterial[] = [];

    function healthColor(itemId: string): number {
      const h = current.healthByItemId[itemId] ?? 'ok';
      return h === 'overdue' ? 0xe05050 : h === 'due' ? 0xe8a838 : 0x3d9a5f;
    }

    function buildScene(next: HouseViewModel) {
      // Dispose everything currently under sceneRoot before rebuilding.
      sceneRoot.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) m.dispose();
        }
      });
      sceneRoot.clear();
      wallMaterials.length = 0;

      current = next;
      roomLayout = layoutRooms(next.rooms);

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const room of next.rooms) {
        const rect = roomLayout.get(room.id);
        if (!rect) continue;
        minX = Math.min(minX, rect.x);
        minY = Math.min(minY, rect.y);
        maxX = Math.max(maxX, rect.x + rect.L);
        maxY = Math.max(maxY, rect.y + rect.W);

        const floorMat = new THREE.MeshStandardMaterial({
          color: colorForRoom(room.id),
        });
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(rect.L, rect.W),
          floorMat
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.copy(toWorld(rect.x + rect.L / 2, rect.y + rect.W / 2, 0));
        floor.userData = { type: 'room', roomId: room.id };
        sceneRoot.add(floor);

        const wallH = Math.max(6, room.dims.H);
        const wallMat = new THREE.MeshStandardMaterial({
          color: 0x9a8468,
          transparent: translucent,
          opacity: translucent ? 0.18 : 1,
        });
        wallMaterials.push(wallMat);

        const addWall = (
          cx: number,
          cy: number,
          w: number,
          d: number
        ) => {
          const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat);
          wall.position.copy(toWorld(cx, cy, wallH / 2));
          sceneRoot.add(wall);
        };
        addWall(rect.x + rect.L / 2, rect.y, rect.L, WALL_THICKNESS);
        addWall(rect.x + rect.L / 2, rect.y + rect.W, rect.L, WALL_THICKNESS);
        addWall(rect.x, rect.y + rect.W / 2, WALL_THICKNESS, rect.W);
        addWall(rect.x + rect.L, rect.y + rect.W / 2, WALL_THICKNESS, rect.W);

        for (const p of next.placements.filter((pl) => pl.roomId === room.id)) {
          const itemMat = new THREE.MeshStandardMaterial({
            color: healthColor(p.itemId),
          });
          const item = new THREE.Mesh(
            new THREE.BoxGeometry(
              Math.max(1, p.footprint.L),
              ITEM_HEIGHT,
              Math.max(1, p.footprint.W)
            ),
            itemMat
          );
          item.position.copy(
            toWorld(
              rect.x + p.x + p.footprint.L / 2,
              rect.y + p.y + p.footprint.W / 2,
              ITEM_HEIGHT / 2
            )
          );
          item.userData = { type: 'item', itemId: p.itemId };
          sceneRoot.add(item);
        }
      }

      if (Number.isFinite(minX)) {
        target = toWorld((minX + maxX) / 2, (minY + maxY) / 2, 0);
        distance = Math.max(20, Math.max(maxX - minX, maxY - minY) * 1.1);
        applyCamera();
      }
    }

    buildScene(model);

    const raycaster = new THREE.Raycaster();
    const onClick = (e: MouseEvent) => {
      if (
        Math.abs(e.clientX - lastX) > 4 ||
        Math.abs(e.clientY - lastY) > 4
      ) {
        return; // was a drag, not a click
      }
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(sceneRoot.children, false);
      for (const hit of hits) {
        const data = hit.object.userData as
          | { type: 'item'; itemId: string }
          | { type: 'room'; roomId: string }
          | undefined;
        if (data?.type === 'item') {
          cb.onSelectItem(data.itemId);
          return;
        }
        if (data?.type === 'room') {
          cb.onSelectRoom(data.roomId);
          return;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('click', onClick);

    let raf = 0;
    const tick = () => {
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return {
      update(next) {
        buildScene(next);
      },
      destroy() {
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('pointercancel', onPointerUp);
        renderer.domElement.removeEventListener('wheel', onWheel);
        renderer.domElement.removeEventListener('click', onClick);
        sceneRoot.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const m of mats) m.dispose();
          }
        });
        ground.geometry.dispose();
        (ground.material as THREE.Material).dispose();
        renderer.dispose();
        renderer.domElement.remove();
      },
      travelToRoom(roomId) {
        const rect = roomLayout.get(roomId);
        if (!rect) return;
        target = toWorld(rect.x + rect.L / 2, rect.y + rect.W / 2, 0);
        distance = Math.max(14, Math.max(rect.L, rect.W) * 2.2);
        applyCamera();
      },
      travelToItem(itemId) {
        const p = current.placements.find((pl) => pl.itemId === itemId);
        if (!p) return;
        const rect = roomLayout.get(p.roomId);
        if (!rect) return;
        target = toWorld(
          rect.x + p.x + p.footprint.L / 2,
          rect.y + p.y + p.footprint.W / 2,
          ITEM_HEIGHT / 2
        );
        distance = 10;
        applyCamera();
      },
      setWallsTranslucent(on) {
        translucent = on;
        for (const m of wallMaterials) {
          m.transparent = on;
          m.opacity = on ? 0.18 : 1;
        }
      },
    };
  },
};
