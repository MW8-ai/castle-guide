/**
 * Throwaway isometric spike — proves HouseRendererPlugin against real dim data.
 * No polish. No storage writes.
 */
import type {
  HouseRendererCallbacks,
  HouseRendererHandle,
  HouseViewModel,
} from '../../src/houseview/types';
import { createIsoSpikeRenderer } from './isoSpikeRenderer';
import fixture from './fixture.json';

const host = document.getElementById('host');
const selectedEl = document.getElementById('selected');
if (!host || !selectedEl) {
  throw new Error('spike DOM missing');
}

const model = fixture as HouseViewModel;

const cb: HouseRendererCallbacks = {
  onSelectItem: (itemId) => {
    selectedEl.textContent = itemId;
    console.log('onSelectItem', itemId);
  },
  onSelectRoom: (roomId) => {
    selectedEl.textContent = `room:${roomId}`;
    console.log('onSelectRoom', roomId);
  },
  onMovePlacement: (placementId, next) => {
    console.log('onMovePlacement', placementId, next);
  },
};

const handle: HouseRendererHandle = createIsoSpikeRenderer().mount(
  host,
  model,
  cb
);

// Prove update() path once
handle.update(model);
