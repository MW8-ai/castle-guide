import { describe, it, expect } from 'vitest';
import {
  resolveRoomPosition,
  resolveRoomResize,
  roomFloorOf,
  type PositionedRect,
} from '../src/houseview';
import { createRoom } from '../src/storage/factories';

describe('roomFloorOf', () => {
  it('defaults to ground when unset', () => {
    const room = createRoom({ name: 'Mystery' });
    expect(room.floor).toBeUndefined();
    expect(roomFloorOf(room)).toBe('ground');
  });

  it('returns the explicit floor when set', () => {
    const room = createRoom({ name: 'Attic Bedroom', floor: 'upper' });
    expect(roomFloorOf(room)).toBe('upper');
  });
});

describe('resolveRoomPosition (floor-plan drag snap + collision)', () => {
  it('snaps to a neighbor edge it runs alongside on the other axis', () => {
    // Kitchen at x:0-16, dropping Living just past its right edge with
    // matching y-range — should snap flush against it.
    const others: PositionedRect[] = [
      { id: 'kitchen', x: 0, y: 0, L: 16, W: 14 },
    ];
    const { x, y } = resolveRoomPosition(
      { id: 'living', L: 18, W: 16 },
      others,
      16.8, // just right of Kitchen's edge, within snap distance
      1
    );
    expect(x).toBe(16);
    expect(y).toBe(1);
  });

  it('does not snap onto a room it does not run alongside on the other axis', () => {
    // A room far below (no y-overlap) sits near the same x — must not pull
    // the dragged room sideways onto it (this was a real regression: rooms
    // could snap onto an unrelated room's edge and fully overlap it).
    const others: PositionedRect[] = [
      { id: 'faraway', x: 16, y: 200, L: 10, W: 10 },
    ];
    const { x, y } = resolveRoomPosition(
      { id: 'living', L: 18, W: 16 },
      others,
      16.8,
      1
    );
    expect(x).toBe(16.8);
    expect(y).toBe(1);
  });

  it('never returns a negative position', () => {
    const { x, y } = resolveRoomPosition({ id: 'a', L: 10, W: 10 }, [], -5, -3);
    expect(x).toBe(0);
    expect(y).toBe(0);
  });

  it('pushes a room out of full overlap along the least-overlap axis', () => {
    // Room B dropped directly on top of Room A — B is wider than it is
    // tall relative to the overlap, so it should get pushed out vertically
    // (the axis with less overlap), not horizontally.
    const others: PositionedRect[] = [
      { id: 'a', x: 0, y: 0, L: 20, W: 6 },
    ];
    const { x, y } = resolveRoomPosition(
      { id: 'b', L: 20, W: 6 },
      others,
      1,
      1
    );
    // Pushed to sit below A rather than overlapping it.
    expect(y).toBeGreaterThanOrEqual(6);
    expect(x).toBeLessThan(20);
  });

  it('falls back to pushing right when pushing left would go negative', () => {
    // The dragged room mostly overlaps A on its left side (smaller x-overlap
    // than y-overlap, so the horizontal push branch is chosen) and A starts
    // close enough to x=0 that "push left" (oL - room.L) would go negative —
    // resolver must fall back to pushing right instead of silently
    // re-colliding when the later x=max(0,x) clamp undoes a negative push.
    const others: PositionedRect[] = [
      { id: 'a', x: 3, y: -10, L: 8, W: 30 },
    ];
    const { x, y } = resolveRoomPosition(
      { id: 'b', L: 8, W: 8 },
      others,
      1,
      1
    );
    expect(x).toBe(11); // pushed to A's right edge (oR), not left
    expect(y).toBe(1);
  });
});

describe('resolveRoomResize (floor-plan corner-handle resize)', () => {
  it('grows freely into open space with no neighbor', () => {
    const { L, W } = resolveRoomResize({ id: 'a', x: 0, y: 0 }, [], 12.3, 9.1);
    expect(L).toBe(12);
    expect(W).toBe(9);
  });

  it('clamps growth to stop at a neighbor to the right', () => {
    const others: PositionedRect[] = [
      { id: 'dining', x: 18, y: 0, L: 14, W: 12 },
    ];
    const { L, W } = resolveRoomResize(
      { id: 'living', x: 0, y: 0 },
      others,
      30, // would overlap Dining at x=18
      16
    );
    expect(L).toBe(18);
    expect(W).toBe(16);
  });

  it('clamps growth to stop at a neighbor below', () => {
    const others: PositionedRect[] = [
      { id: 'below', x: 0, y: 10, L: 10, W: 10 },
    ];
    const { L, W } = resolveRoomResize(
      { id: 'a', x: 0, y: 0 },
      others,
      8,
      20 // would overlap the room below at y=10
    );
    expect(W).toBe(10);
    expect(L).toBe(8);
  });

  it('rounds the result down to the nearest half-foot', () => {
    const { L, W } = resolveRoomResize(
      { id: 'a', x: 0, y: 0 },
      [],
      12.74,
      9.26
    );
    expect(L).toBe(12.5);
    expect(W).toBe(9);
  });

  it('enforces a minimum room size', () => {
    const { L, W } = resolveRoomResize({ id: 'a', x: 0, y: 0 }, [], 1, 0.5);
    expect(L).toBe(4);
    expect(W).toBe(4);
  });

  it('ignores neighbors that do not overlap on the other axis', () => {
    // A neighbor to the right but far below (no y-range overlap) must not
    // clamp L — only neighbors actually in the growing rect's path count.
    const others: PositionedRect[] = [
      { id: 'unrelated', x: 5, y: 100, L: 10, W: 10 },
    ];
    const { L, W } = resolveRoomResize(
      { id: 'a', x: 0, y: 0 },
      others,
      12,
      8
    );
    expect(L).toBe(12);
    expect(W).toBe(8);
  });
});
