import type { RoomFloor } from '../storage';
import { FLOORS, FLOOR_LABELS } from './floors';

interface Props {
  active: RoomFloor;
  /** When provided, floors with no rooms yet get a " · empty" hint. */
  floorsWithRooms?: Set<RoomFloor>;
  onSelect: (floor: RoomFloor) => void;
}

/**
 * One floor-tab control, shared by the house view and the floor-plan
 * editor — previously each page built its own with different markup and
 * CSS, so they drifted out of sync visually.
 */
export function FloorSwitcher({ active, floorsWithRooms, onSelect }: Props) {
  return (
    <div class="floor-switcher">
      {FLOORS.map((f) => (
        <button
          key={f}
          type="button"
          class={f === active ? 'active' : ''}
          disabled={f === active}
          onClick={() => onSelect(f)}
        >
          {FLOOR_LABELS[f]}
          {floorsWithRooms && !floorsWithRooms.has(f) && (
            <span class="muted tiny"> · empty</span>
          )}
        </button>
      ))}
    </div>
  );
}
