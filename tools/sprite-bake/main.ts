import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Matches src/houseview/walkIso/walkIsoRenderer.ts's iso() projection:
//   sx = (fx - fy) * s
//   sy = (fx + fy) * (s * 0.5) - z * s * 0.42
// That's the standard 2:1 dimetric projection (screen tile is twice as
// wide as it is tall) — the corresponding 3D camera angle is a 45° yaw
// with a pitch of atan(0.5), not the 35.264° of a "true" isometric.
const AZIMUTH = Math.PI * 0.25;
const ELEVATION = Math.atan(0.5);

const MODELS: Record<string, string> = {
  couch: './models/couch/couch.gltf',
  bed_double_A: './models/bed_double_A/bed_double_A.gltf',
  table_medium: './models/table_medium/table_medium.gltf',
  armchair: './models/armchair/armchair.gltf',
  table_medium_long: './models/table_medium_long/table_medium_long.gltf',
  cabinet_medium: './models/cabinet_medium/cabinet_medium.gltf',
  lamp_standing: './models/lamp_standing/lamp_standing.gltf',
};

const CHARACTER_URL = './models/rogue/Rogue.glb';
const ANIM_URL = './models/anim/Rig_Medium_MovementBasic.glb';

const CANVAS_SIZE = 512;
const PADDING_PX = 6;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
});
renderer.setSize(CANVAS_SIZE, CANVAS_SIZE);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(
  Math.cos(AZIMUTH) * Math.cos(ELEVATION),
  Math.sin(ELEVATION) + 0.4,
  Math.sin(AZIMUTH) * Math.cos(ELEVATION)
);
scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.35);
fill.position.set(-key.position.x, 0.3, -key.position.z);
scene.add(fill);

const camera = new THREE.OrthographicCamera();
camera.up.set(0, 1, 0);

const loader = new GLTFLoader();

function loadGltf(url: string): Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }> {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve({ scene: gltf.scene, animations: gltf.animations }),
      undefined,
      reject
    );
  });
}

function loadModel(url: string): Promise<THREE.Group> {
  return loadGltf(url).then((g) => g.scene);
}

function fitCameraToObject(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // Recenter so the model sits on y=0, centered on x/z.
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= box.min.y;

  const radius = size.length() * 0.6 + 0.5;
  const dir = new THREE.Vector3(
    Math.cos(AZIMUTH) * Math.cos(ELEVATION),
    Math.sin(ELEVATION),
    Math.sin(AZIMUTH) * Math.cos(ELEVATION)
  );
  camera.position.copy(dir.multiplyScalar(radius * 3));
  camera.lookAt(0, size.y / 2, 0);

  // Project the (recentered) bounding box corners into camera space to
  // size the orthographic frustum tightly around the model.
  const newBox = new THREE.Box3().setFromObject(object);
  const corners = [
    new THREE.Vector3(newBox.min.x, newBox.min.y, newBox.min.z),
    new THREE.Vector3(newBox.min.x, newBox.min.y, newBox.max.z),
    new THREE.Vector3(newBox.min.x, newBox.max.y, newBox.min.z),
    new THREE.Vector3(newBox.min.x, newBox.max.y, newBox.max.z),
    new THREE.Vector3(newBox.max.x, newBox.min.y, newBox.min.z),
    new THREE.Vector3(newBox.max.x, newBox.min.y, newBox.max.z),
    new THREE.Vector3(newBox.max.x, newBox.max.y, newBox.min.z),
    new THREE.Vector3(newBox.max.x, newBox.max.y, newBox.max.z),
  ];
  camera.updateMatrixWorld();
  const viewMatrix = camera.matrixWorldInverse;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const c of corners) {
    const v = c.clone().applyMatrix4(viewMatrix);
    minX = Math.min(minX, v.x);
    maxX = Math.max(maxX, v.x);
    minY = Math.min(minY, v.y);
    maxY = Math.max(maxY, v.y);
  }
  const pad = Math.max(maxX - minX, maxY - minY) * 0.06;
  camera.left = minX - pad;
  camera.right = maxX + pad;
  camera.bottom = minY - pad;
  camera.top = maxY + pad;
  camera.near = 0.01;
  camera.far = radius * 8;
  camera.updateProjectionMatrix();
}

/** Trim fully-transparent padding off a canvas, returning a new cropped canvas. */
function trim(source: HTMLCanvasElement): HTMLCanvasElement {
  // source is the WebGL canvas — a canvas can only ever have one context
  // type bound to it, so copy the pixels onto a plain 2D canvas first
  // before doing pixel-level alpha reads.
  const { width, height } = source;
  const copy = document.createElement('canvas');
  copy.width = width;
  copy.height = height;
  const ctx = copy.getContext('2d')!;
  ctx.drawImage(source, 0, 0);
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (minX > maxX || minY > maxY) return copy; // fully transparent, nothing to trim
  minX = Math.max(0, minX - PADDING_PX);
  minY = Math.max(0, minY - PADDING_PX);
  maxX = Math.min(width - 1, maxX + PADDING_PX);
  maxY = Math.min(height - 1, maxY + PADDING_PX);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  out.getContext('2d')!.drawImage(copy, minX, minY, w, h, 0, 0, w, h);
  return out;
}

function appendCard(name: string, dataUrl: string, w: number, h: number) {
  const card = document.createElement('div');
  card.className = 'render-card';
  const img = document.createElement('img');
  img.src = dataUrl;
  const label = document.createElement('div');
  label.textContent = `${name} (${w}x${h})`;
  card.append(img, label);
  document.getElementById('renders')!.appendChild(card);
}

function renderAndTrim(object: THREE.Object3D): { dataUrl: string; w: number; h: number } {
  scene.add(object);
  fitCameraToObject(object);
  renderer.render(scene, camera);
  const trimmed = trim(renderer.domElement);
  const dataUrl = trimmed.toDataURL('image/png');
  scene.remove(object);
  return { dataUrl, w: trimmed.width, h: trimmed.height };
}

async function bakeModel(name: string): Promise<string> {
  const url = MODELS[name];
  if (!url) throw new Error(`Unknown model: ${name}`);
  const object = await loadModel(url);
  const { dataUrl, w, h } = renderAndTrim(object);
  appendCard(name, dataUrl, w, h);
  return dataUrl;
}

/** List the animation clip names bundled in the movement animation file — for picking a pose. */
async function listClips(): Promise<string[]> {
  const { animations } = await loadGltf(ANIM_URL);
  return animations.map((a) => a.name);
}

/**
 * Bakes the character mid-stride: loads the character mesh+skeleton and a
 * separately-authored animation clip (same "Rig_Medium" bone names, so
 * Three.js resolves the clip's tracks onto the character's own skeleton —
 * the standard glTF retargeting-by-name technique), advances the mixer to
 * `poseFraction` through the clip's duration once, then bakes that single
 * frame the same way a static prop is baked.
 */
async function bakeCharacter(clipNameMatch: RegExp, poseFraction: number): Promise<string> {
  const [{ scene: character }, { animations }] = await Promise.all([
    loadGltf(CHARACTER_URL),
    loadGltf(ANIM_URL),
  ]);
  const clip = animations.find((a) => clipNameMatch.test(a.name));
  if (!clip) {
    throw new Error(
      `No clip matching ${clipNameMatch} — available: ${animations.map((a) => a.name).join(', ')}`
    );
  }
  const mixer = new THREE.AnimationMixer(character);
  const action = mixer.clipAction(clip, character);
  action.play();
  mixer.update(poseFraction * clip.duration);

  const { dataUrl, w, h } = renderAndTrim(character);
  appendCard(`avatar (${clip.name} @ ${poseFraction})`, dataUrl, w, h);
  return dataUrl;
}

Object.assign(window as unknown as Record<string, unknown>, {
  bakeModel,
  bakeCharacter,
  listClips,
});

const controls = document.getElementById('controls')!;
for (const name of Object.keys(MODELS)) {
  const btn = document.createElement('button');
  btn.textContent = `Bake ${name}`;
  btn.onclick = () => void bakeModel(name);
  controls.appendChild(btn);
}
