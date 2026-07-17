/** Pure position/size math for the floor-plan editor's drag-and-resize UI. */

export interface PositionedRect {
  id: string;
  x: number;
  y: number;
  L: number;
  W: number;
}

export const SNAP_FT = 1.5;
export const MIN_ROOM_FT = 4;

/**
 * Resolve a dragged room's final position: snap to a neighbor's edge when
 * close (only against neighbors it actually runs alongside on the other
 * axis, so it forms a shared wall rather than aligning with an unrelated
 * room), then push out of any remaining overlap along whichever axis has
 * the least overlap, clamped to x/y >= 0 throughout.
 */
export function resolveRoomPosition(
  room: { id: string; L: number; W: number },
  others: PositionedRect[],
  rawX: number,
  rawY: number,
  snapFt: number = SNAP_FT
): { x: number; y: number } {
  let x = rawX;
  let y = rawY;

  let bestDX: number | null = null;
  let bestDY: number | null = null;
  for (const other of others) {
    if (other.id === room.id) continue;
    const oL = other.x;
    const oR = other.x + other.L;
    const oT = other.y;
    const oB = other.y + other.W;
    const left = x;
    const right = x + room.L;
    const top = y;
    const bottom = y + room.W;
    const yOverlaps = top < oB + snapFt && bottom > oT - snapFt;
    const xOverlaps = left < oR + snapFt && right > oL - snapFt;

    if (yOverlaps) {
      if (
        Math.abs(left - oR) < snapFt &&
        (bestDX == null || Math.abs(oR - x) < Math.abs(bestDX - x))
      ) {
        bestDX = oR;
      }
      if (
        Math.abs(right - oL) < snapFt &&
        (bestDX == null || Math.abs(oL - room.L - x) < Math.abs(bestDX - x))
      ) {
        bestDX = oL - room.L;
      }
    }
    if (xOverlaps) {
      if (
        Math.abs(top - oB) < snapFt &&
        (bestDY == null || Math.abs(oB - y) < Math.abs(bestDY - y))
      ) {
        bestDY = oB;
      }
      if (
        Math.abs(bottom - oT) < snapFt &&
        (bestDY == null || Math.abs(oT - room.W - y) < Math.abs(bestDY - y))
      ) {
        bestDY = oT - room.W;
      }
    }
  }
  if (bestDX != null) x = bestDX;
  if (bestDY != null) y = bestDY;
  x = Math.max(0, x);
  y = Math.max(0, y);

  for (let pass = 0; pass < 6; pass++) {
    const hit = others.find((other) => {
      if (other.id === room.id) return false;
      const oL = other.x;
      const oR = other.x + other.L;
      const oT = other.y;
      const oB = other.y + other.W;
      return x < oR && x + room.L > oL && y < oB && y + room.W > oT;
    });
    if (!hit) break;
    const oL = hit.x;
    const oR = hit.x + hit.L;
    const oT = hit.y;
    const oB = hit.y + hit.W;
    const overlapX = Math.min(x + room.L, oR) - Math.max(x, oL);
    const overlapY = Math.min(y + room.W, oB) - Math.max(y, oT);
    if (overlapX < overlapY) {
      // "Push left" can go negative (room dragged near x=0) — fall back to
      // "push right" rather than let the later clamp re-collide it.
      const pushLeft = oL - room.L;
      const preferLeft = x + room.L / 2 < oL + hit.L / 2;
      x = preferLeft && pushLeft >= 0 ? pushLeft : oR;
    } else {
      const pushUp = oT - room.W;
      const preferUp = y + room.W / 2 < oT + hit.W / 2;
      y = preferUp && pushUp >= 0 ? pushUp : oB;
    }
  }
  x = Math.max(0, x);
  y = Math.max(0, y);

  return { x, y };
}

/**
 * Resolve a dragged corner-handle resize: clamp growth to stop just before
 * any neighbor it would otherwise overlap (checked per axis independently),
 * then round down to the nearest half-foot so raw pointer-drag deltas don't
 * leave the room with fractional-inch dimensions.
 */
export function resolveRoomResize(
  room: { id: string; x: number; y: number },
  others: PositionedRect[],
  rawL: number,
  rawW: number,
  minFt: number = MIN_ROOM_FT
): { L: number; W: number } {
  const x = room.x;
  const y = room.y;
  let L = Math.max(minFt, rawL);
  let W = Math.max(minFt, rawW);

  for (const other of others) {
    if (other.id === room.id) continue;
    const oL = other.x;
    const oT = other.y;
    const oB = oT + other.W;
    // Strictly greater than x — a neighbor whose left edge is flush with
    // ours (e.g. one directly below, sharing the same x origin) is not "in
    // the way" of growing rightward and must not clamp L.
    if (oL > x && oL < x + L && y < oB && y + W > oT) {
      L = Math.max(minFt, Math.min(L, oL - x));
    }
  }
  for (const other of others) {
    if (other.id === room.id) continue;
    const oT = other.y;
    const oL = other.x;
    const oR = oL + other.L;
    if (oT > y && oT < y + W && x < oR && x + L > oL) {
      W = Math.max(minFt, Math.min(W, oT - y));
    }
  }

  L = Math.max(minFt, Math.floor(L * 2) / 2);
  W = Math.max(minFt, Math.floor(W * 2) / 2);

  return { L, W };
}
