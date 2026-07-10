import { createCanvasRenderer } from '../canvasShared';
import type { HouseRendererPlugin } from '../types';

export const isoRenderer: HouseRendererPlugin = createCanvasRenderer(
  'iso',
  'Isometric',
  'iso'
);
