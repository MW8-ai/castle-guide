import type { HouseRendererPlugin } from './types';
import { isoRenderer } from './iso/isoRenderer';
import { pixelRenderer } from './pixel/pixelRenderer';
import { walk3dRenderer } from './walk3d/walk3dRenderer';

const plugins: HouseRendererPlugin[] = [
  isoRenderer,
  pixelRenderer,
  walk3dRenderer,
];

export function listRenderers(): HouseRendererPlugin[] {
  return plugins.slice();
}

export function getRenderer(id: string): HouseRendererPlugin {
  return plugins.find((p) => p.id === id) ?? isoRenderer;
}
