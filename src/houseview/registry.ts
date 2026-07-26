import type { HouseRendererPlugin } from './types';
import { walkIsoRenderer } from './walkIso/walkIsoRenderer';
import { pixelHomeRenderer } from './pixelHome/pixelHomeRenderer';
import { exploreRenderer } from './explore/exploreRenderer';
import { isoRenderer } from './iso/isoRenderer';
import { pixelRenderer } from './pixel/pixelRenderer';

/** Three.js (~500KB) only downloads if someone actually picks this
 * renderer — everyone else's bundle stays untouched. */
const walk3dRendererLazy: HouseRendererPlugin = {
  id: 'walk3d',
  label: '3D Walkthrough',
  async mount(el, model, cb) {
    const { walk3dRenderer } = await import('./walk3d/walk3dRenderer');
    return walk3dRenderer.mount(el, model, cb);
  },
};

const plugins: HouseRendererPlugin[] = [
  walkIsoRenderer,
  pixelHomeRenderer,
  exploreRenderer,
  isoRenderer,
  pixelRenderer,
  walk3dRendererLazy,
];

export function listRenderers(): HouseRendererPlugin[] {
  return plugins.slice();
}

export function getRenderer(id?: string | null): HouseRendererPlugin {
  if (!id || id === 'default' || id === 'iso' || id === 'explore' || id === 'pixel-home') {
    return walkIsoRenderer;
  }
  return plugins.find((p) => p.id === id) ?? walkIsoRenderer;
}
