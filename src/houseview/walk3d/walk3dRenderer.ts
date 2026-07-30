import * as THREE from 'three';
import type {
  HouseRendererHandle,
  HouseRendererPlugin,
  HouseViewModel,
  RoomView,
} from '../types';

/**
 * Real third-person 3D walkthrough — the Three.js plugin blueprinted in
 * HUMAN_DIRECTIONS.md and ADR-0002. Rooms are boxes extruded to their real
 * height in feet (no isometric compression needed, unlike walkIso), a
 * visible avatar walks via WASD (camera-relative) with wall collision, and
 * the camera orbits/follows via drag + scroll — mouse to look, WASD to walk.
 */

const WALL_THICKNESS = 0.2;
const DOOR_WIDTH = 3;
const AVATAR_RADIUS = 0.9;
const MOVE_SPEED = 9; // feet/second
const JUMP_SPEED = 10; // feet/second, initial upward velocity
const GRAVITY = 26; // feet/second^2

interface RoomRect {
  x: number;
  y: number;
  L: number;
  W: number;
}

interface WallSeg {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
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

/** Same coarse item classification walkIsoRenderer uses, kept local since
 * that module's tables aren't exported. Kind drives the base color/height;
 * maintenance health becomes a small floating marker instead of the whole
 * box, so items actually read as different things instead of a wash of
 * uniform "ok" green. */
type Kind =
  | 'fridge'
  | 'range'
  | 'washer'
  | 'dryer'
  | 'heater'
  | 'furnace'
  | 'tv'
  | 'sofa'
  | 'bed'
  | 'toilet'
  | 'desk'
  | 'chair'
  | 'table'
  | 'generic';

function kindOf(label: string): Kind {
  const s = label.toLowerCase();
  if (/fridge|refriger/.test(s)) return 'fridge';
  if (/range|oven|stove/.test(s)) return 'range';
  if (/wash/.test(s)) return 'washer';
  if (/dry/.test(s)) return 'dryer';
  if (/water|heater/.test(s)) return 'heater';
  if (/furnace|carrier/.test(s)) return 'furnace';
  if (/tv|television|sony/.test(s)) return 'tv';
  if (/sofa|couch|loveseat/.test(s)) return 'sofa';
  if (/bed/.test(s)) return 'bed';
  if (/toilet|bath/.test(s)) return 'toilet';
  if (/desk/.test(s)) return 'desk';
  if (/chair/.test(s)) return 'chair';
  if (/table/.test(s)) return 'table';
  return 'generic';
}

const KIND_COLOR: Record<Kind, number> = {
  fridge: 0xc8d4e0,
  range: 0x3a3a42,
  washer: 0xeef2f6,
  dryer: 0xe8ecf0,
  heater: 0xcfd4d8,
  furnace: 0x6a7a88,
  tv: 0x1c1c24,
  sofa: 0x5a7a9a,
  bed: 0x8a6a9a,
  toilet: 0xf4f6f8,
  desk: 0xa08050,
  chair: 0x7a9a6a,
  table: 0x8a6a4a,
  generic: 0x9ab0c0,
};

const KIND_HEIGHT: Record<Kind, number> = {
  fridge: 2.1,
  range: 1.4,
  washer: 1.3,
  dryer: 1.3,
  heater: 1.9,
  furnace: 1.7,
  tv: 1.2,
  sofa: 0.9,
  bed: 0.9,
  toilet: 0.8,
  desk: 1.1,
  chair: 0.9,
  table: 1.0,
  generic: 1.5,
};

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
    renderer.domElement.tabIndex = 0;
    renderer.domElement.style.outline = 'none';

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

    // ── Avatar — a legs/torso/arms/head figure so this reads as a person,
    // not a single tall shaft (a lone capsule-with-a-ball-on-top read as
    // exactly that — fixed by breaking the silhouette into distinct parts). ──
    const avatarGroup = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0c8a0 });
    const sweaterMat = new THREE.MeshStandardMaterial({ color: 0x3d9a5f });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x3a4a6a });

    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.5), pantsMat);
    legs.position.y = 0.85;
    avatarGroup.add(legs);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.6, 0.7), sweaterMat);
    torso.position.y = 2.5;
    avatarGroup.add(torso);

    const armGeo = new THREE.CapsuleGeometry(0.22, 1.1, 4, 8);
    const armL = new THREE.Mesh(armGeo, sweaterMat);
    armL.position.set(-0.87, 2.55, 0);
    avatarGroup.add(armL);
    const armR = new THREE.Mesh(armGeo, sweaterMat);
    armR.position.set(0.87, 2.55, 0);
    avatarGroup.add(armR);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.25, 8),
      skinMat
    );
    neck.position.y = 3.425;
    avatarGroup.add(neck);

    const avatarHead = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), skinMat);
    avatarHead.position.y = 4.1;
    avatarGroup.add(avatarHead);
    scene.add(avatarGroup);

    let avatarPos = new THREE.Vector3(0, 0, 0);
    let avatarSpawned = false;
    let wallSegs: WallSeg[] = [];
    const keys = new Set<string>();
    let avatarY = 0;
    let jumpVelocity = 0;
    let isJumping = false;

    function collidesAt(x: number, z: number): boolean {
      for (const w of wallSegs) {
        if (
          x > w.minX - AVATAR_RADIUS &&
          x < w.maxX + AVATAR_RADIUS &&
          z > w.minZ - AVATAR_RADIUS &&
          z < w.maxZ + AVATAR_RADIUS
        ) {
          return true;
        }
      }
      return false;
    }

    // ── Camera — orbits/follows the avatar. Drag to look, wheel to zoom. ──
    let target = new THREE.Vector3(0, 2.5, 0);
    let azimuth = Math.PI * 0.25;
    let polar = Math.PI * 0.32;
    let distance = 16;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let downX = 0;
    let downY = 0;

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
      downX = e.clientX;
      downY = e.clientY;
      renderer.domElement.style.cursor = 'grabbing';
      renderer.domElement.setPointerCapture?.(e.pointerId);
      renderer.domElement.focus();
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
      distance = Math.max(5, Math.min(60, distance + (e.deltaY > 0 ? 2 : -2)));
      applyCamera();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys.add(k);
      if (k === ' ') {
        e.preventDefault();
        if (!isJumping) {
          isJumping = true;
          jumpVelocity = JUMP_SPEED;
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());

    let current: HouseViewModel = model;
    let roomLayout = layoutRooms(model.rooms);
    let translucent = false;
    const wallMaterials: THREE.MeshStandardMaterial[] = [];

    function healthMarkerColor(itemId: string): number | null {
      const h = current.healthByItemId[itemId] ?? 'ok';
      if (h === 'overdue') return 0xe05050;
      if (h === 'due') return 0xe8a838;
      return null;
    }

    function addWallSeg(
      cx: number,
      cy: number,
      w: number,
      d: number,
      wallH: number,
      wallMat: THREE.MeshStandardMaterial
    ) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat);
      wall.position.copy(toWorld(cx, cy, wallH / 2));
      sceneRoot.add(wall);
      wallSegs.push({
        minX: cx - w / 2,
        maxX: cx + w / 2,
        minZ: cy - d / 2,
        maxZ: cy + d / 2,
      });
    }

    /** North wall (along x, at rect.y) gets a real door opening — two wall
     * segments with a gap, plus a visible frame + leaf in the gap so it
     * reads as a doorway, not just an absence. */
    function addNorthWallWithDoor(
      rect: RoomRect,
      wallH: number,
      wallMat: THREE.MeshStandardMaterial
    ) {
      const doorW = Math.min(DOOR_WIDTH, rect.L * 0.5);
      const doorX0 = rect.x + rect.L / 2 - doorW / 2;
      const doorX1 = doorX0 + doorW;
      if (doorX0 - rect.x > 0.3) {
        addWallSeg(
          rect.x + (doorX0 - rect.x) / 2,
          rect.y,
          doorX0 - rect.x,
          WALL_THICKNESS,
          wallH,
          wallMat
        );
      }
      if (rect.x + rect.L - doorX1 > 0.3) {
        addWallSeg(
          doorX1 + (rect.x + rect.L - doorX1) / 2,
          rect.y,
          rect.x + rect.L - doorX1,
          WALL_THICKNESS,
          wallH,
          wallMat
        );
      }
      const doorH = Math.min(wallH * 0.85, 7);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a3020 });
      const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(doorW, 0.3, WALL_THICKNESS * 1.5),
        frameMat
      );
      lintel.position.copy(toWorld(rect.x + rect.L / 2, rect.y, doorH));
      sceneRoot.add(lintel);
      const leaf = new THREE.Mesh(
        new THREE.BoxGeometry(doorW * 0.85, doorH * 0.97, WALL_THICKNESS * 0.6),
        new THREE.MeshStandardMaterial({ color: 0xc9a876 })
      );
      leaf.position.copy(
        toWorld(rect.x + rect.L / 2, rect.y - WALL_THICKNESS * 0.3, doorH / 2)
      );
      sceneRoot.add(leaf);
    }

    function buildScene(next: HouseViewModel) {
      sceneRoot.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) m.dispose();
        }
      });
      sceneRoot.clear();
      wallMaterials.length = 0;
      wallSegs = [];

      current = next;
      roomLayout = layoutRooms(next.rooms);

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let firstRoomCenter: THREE.Vector3 | null = null;

      for (const room of next.rooms) {
        const rect = roomLayout.get(room.id);
        if (!rect) continue;
        minX = Math.min(minX, rect.x);
        minY = Math.min(minY, rect.y);
        maxX = Math.max(maxX, rect.x + rect.L);
        maxY = Math.max(maxY, rect.y + rect.W);
        if (!firstRoomCenter) {
          firstRoomCenter = toWorld(rect.x + rect.L / 2, rect.y + rect.W / 2, 0);
        }

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

        addNorthWallWithDoor(rect, wallH, wallMat);
        addWallSeg(rect.x + rect.L / 2, rect.y + rect.W, rect.L, WALL_THICKNESS, wallH, wallMat);
        addWallSeg(rect.x, rect.y + rect.W / 2, WALL_THICKNESS, rect.W, wallH, wallMat);
        addWallSeg(rect.x + rect.L, rect.y + rect.W / 2, WALL_THICKNESS, rect.W, wallH, wallMat);

        for (const p of next.placements.filter((pl) => pl.roomId === room.id)) {
          const kind = kindOf(p.label);
          const h = KIND_HEIGHT[kind];
          const item = new THREE.Mesh(
            new THREE.BoxGeometry(
              Math.max(1, p.footprint.L),
              h,
              Math.max(1, p.footprint.W)
            ),
            new THREE.MeshStandardMaterial({ color: KIND_COLOR[kind] })
          );
          const cx = rect.x + p.x + p.footprint.L / 2;
          const cz = rect.y + p.y + p.footprint.W / 2;
          item.position.copy(toWorld(cx, cz, h / 2));
          item.userData = { type: 'item', itemId: p.itemId };
          sceneRoot.add(item);

          const markerColor = healthMarkerColor(p.itemId);
          if (markerColor != null) {
            const marker = new THREE.Mesh(
              new THREE.SphereGeometry(0.22, 10, 8),
              new THREE.MeshStandardMaterial({
                color: markerColor,
                emissive: markerColor,
                emissiveIntensity: 0.6,
              })
            );
            marker.position.copy(toWorld(cx, cz, h + 0.5));
            sceneRoot.add(marker);
          }
        }
      }

      if (!avatarSpawned && firstRoomCenter) {
        avatarPos = firstRoomCenter.clone();
        avatarSpawned = true;
      }
      if (Number.isFinite(minX) && !avatarSpawned) {
        target = toWorld((minX + maxX) / 2, (minY + maxY) / 2, 2.5);
        applyCamera();
      }
    }

    buildScene(model);

    const raycaster = new THREE.Raycaster();
    const onClick = (e: MouseEvent) => {
      if (Math.abs(e.clientX - downX) > 4 || Math.abs(e.clientY - downY) > 4) {
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
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let lastTime = performance.now();
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      let ix = 0;
      let iz = 0;
      if (keys.has('w') || keys.has('arrowup')) iz -= 1;
      if (keys.has('s') || keys.has('arrowdown')) iz += 1;
      if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
      if (keys.has('d') || keys.has('arrowright')) ix += 1;
      if (ix !== 0 || iz !== 0) {
        const len = Math.hypot(ix, iz) || 1;
        const inForward = -iz / len;
        const inRight = ix / len;
        const sinA = Math.sin(azimuth);
        const cosA = Math.cos(azimuth);
        const forward = { x: -sinA, z: -cosA };
        const right = { x: cosA, z: -sinA };
        const moveX =
          (inForward * forward.x + inRight * right.x) * MOVE_SPEED * dt;
        const moveZ =
          (inForward * forward.z + inRight * right.z) * MOVE_SPEED * dt;
        const nx = avatarPos.x + moveX;
        const nz = avatarPos.z + moveZ;
        if (!collidesAt(nx, avatarPos.z)) avatarPos.x = nx;
        if (!collidesAt(avatarPos.x, nz)) avatarPos.z = nz;
        if (moveX !== 0 || moveZ !== 0) {
          avatarGroup.rotation.y = Math.atan2(moveX, moveZ);
        }
      }
      if (isJumping) {
        avatarY += jumpVelocity * dt;
        jumpVelocity -= GRAVITY * dt;
        if (avatarY <= 0) {
          avatarY = 0;
          isJumping = false;
          jumpVelocity = 0;
        }
      }
      avatarGroup.position.set(avatarPos.x, avatarY, avatarPos.z);
      target.set(avatarPos.x, 2.5, avatarPos.z);
      applyCamera();

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
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        sceneRoot.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const m of mats) m.dispose();
          }
        });
        avatarGroup.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            (obj.material as THREE.Material).dispose();
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
        avatarPos.set(rect.x + rect.L / 2, 0, rect.y + rect.W / 2);
        distance = Math.max(12, Math.max(rect.L, rect.W) * 1.4);
        applyCamera();
      },
      travelToItem(itemId) {
        const p = current.placements.find((pl) => pl.itemId === itemId);
        if (!p) return;
        const rect = roomLayout.get(p.roomId);
        if (!rect) return;
        avatarPos.set(rect.x + p.x, 0, rect.y + p.y);
        distance = 9;
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
