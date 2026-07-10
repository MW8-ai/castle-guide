# `src/houseview`

## Owns

- Renderer **host** and **plugin contract** (`types.ts`)
- Plugin implementations: `iso/`, `pixel/`, `walk3d/` (stubs until Phase 4/6)

## Must never

- Write to storage / IndexedDB
- Own item/room identity (only display placements)
- Be the only navigation path — list views in `record`/`ui` are required peers

## Spike

Throwaway proof: `spikes/iso-canvas` (not production UI).
