import { createCanvasRenderer } from '../canvasShared';
import type { HouseRendererPlugin } from '../types';

/** Phase 6 second skin — same contract, pixel aesthetic. */
export const pixelRenderer: HouseRendererPlugin = createCanvasRenderer(
  'pixel',
  'Retro pixel',
  'pixel'
);
