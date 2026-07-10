import type { HouseRendererPlugin } from './types';
import { walkIsoRenderer } from './walkIso/walkIsoRenderer';
import { pixelHomeRenderer } from './pixelHome/pixelHomeRenderer';
import { exploreRenderer } from './explore/exploreRenderer';
import { isoRenderer } from './iso/isoRenderer';
import { pixelRenderer } from './pixel/pixelRenderer';
import { walk3dRenderer } from './walk3d/walk3dRenderer';

const plugins: HouseRendererPlugin[] = [
  walkIsoRenderer,
  pixelHomeRenderer,
  exploreRenderer,
  isoRenderer,
  pixelRenderer,
  walk3dRenderer,
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
