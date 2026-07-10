import type { HouseRendererPlugin } from './types';
import { exploreRenderer } from './explore/exploreRenderer';
import { isoRenderer } from './iso/isoRenderer';
import { pixelRenderer } from './pixel/pixelRenderer';
import { walk3dRenderer } from './walk3d/walk3dRenderer';

const plugins: HouseRendererPlugin[] = [
  exploreRenderer,
  isoRenderer,
  pixelRenderer,
  walk3dRenderer,
];

export function listRenderers(): HouseRendererPlugin[] {
  return plugins.slice();
}

export function getRenderer(id?: string | null): HouseRendererPlugin {
  // Default / legacy preference → walk-around
  if (!id || id === 'default') return exploreRenderer;
  return plugins.find((p) => p.id === id) ?? exploreRenderer;
}
