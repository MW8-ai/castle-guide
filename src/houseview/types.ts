/**
 * Renderer plugin contract — see docs/ARCHITECTURE.md §5 and ADR-0002.
 * Renderers are read-only views; the host applies mutations.
 */

export type HealthState = 'ok' | 'due' | 'overdue';

export interface RoomView {
  id: string;
  name: string;
  dims: { L: number; W: number; H: number };
  materials?: { floor?: string; wall?: string; trim?: string };
}

export interface PlacementView {
  id: string;
  roomId: string;
  itemId: string;
  label: string;
  x: number;
  y: number;
  z?: number;
  rotation: number;
  footprint: { L: number; W: number };
}

export interface HouseViewModel {
  houseName: string;
  rooms: RoomView[];
  placements: PlacementView[];
  healthByItemId: Record<string, HealthState>;
}

export interface HouseRendererCallbacks {
  onSelectItem: (itemId: string) => void;
  onSelectRoom: (roomId: string) => void;
  /** Fired when the avatar enters a room (walk mode). */
  onEnterRoom?: (roomId: string | null) => void;
  onMovePlacement: (
    placementId: string,
    next: { x: number; y: number; rotation: number }
  ) => void;
}

export interface HouseRendererHandle {
  update: (model: HouseViewModel) => void;
  destroy: () => void;
}

export interface HouseRendererPlugin {
  id: string;
  label: string;
  mount: (
    el: HTMLElement,
    model: HouseViewModel,
    cb: HouseRendererCallbacks
  ) => HouseRendererHandle;
}
