export type {
  HouseViewModel,
  HouseRendererPlugin,
  HouseRendererCallbacks,
  HouseRendererHandle,
  HealthState,
} from './types';
export { buildHouseViewModel, healthFromTasks, itemLabel } from './buildModel';
export {
  computeSerenity,
  serenityLabel,
  healthGrade,
  healthTone,
  daysUntil,
  addMonthsIso,
  ageFromInstall,
  upcomingTasks,
  catalogStats,
  repairCostEstimate,
  buildListCost,
  equityFromProperty,
} from './serenity';
export { listRenderers, getRenderer } from './registry';
export { ImageHouseView } from './imageMap/ImageHouseView';
export { FLOORS, FLOOR_LABELS, roomFloorOf } from './floors';
export {
  resolveRoomPosition,
  resolveRoomResize,
  SNAP_FT,
  MIN_ROOM_FT,
} from './floorplanGeometry';
export type { PositionedRect } from './floorplanGeometry';

