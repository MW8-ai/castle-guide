import type { Room, RoomFloor } from '../storage';

export const FLOORS: RoomFloor[] = ['basement', 'ground', 'upper', 'yard'];

export const FLOOR_LABELS: Record<RoomFloor, string> = {
  basement: 'Basement',
  ground: '1st floor',
  upper: '2nd floor',
  yard: 'Yard / outdoor',
};

export function roomFloorOf(room: Room): RoomFloor {
  return room.floor ?? 'ground';
}
