import JSZip from 'jszip';
import type { BlobStore } from '../storage/blobStore';
import type { Property } from '../storage/types';
import { toArrayBuffer } from '../storage/blobUtils';
import { nowIso } from '../storage/ids';

const DISCLAIMER = `Castle Guide insurance packet — educational inventory export, not an insurance policy or claim determination. Verify values with your carrier and a licensed professional.`;

/**
 * One-click insurance readiness package: inventory JSON + media + plain inventory list.
 */
export async function buildInsurancePacket(args: {
  property: Property;
  blobs: BlobStore;
}): Promise<Blob> {
  const { property, blobs } = args;
  const zip = new JSZip();
  const exportedAt = nowIso();

  const inventory = {
    exportedAt,
    propertyName: property.name,
    zip: property.zip,
    address: property.address ?? null,
    items: property.items
      .filter((i) => !i.softDeleted || i.active)
      .map((i) => ({
        id: i.id,
        active: i.active,
        category: i.category,
        brand: i.brand,
        model: i.model,
        serial: i.serial,
        purchaseDate: i.purchaseDate,
        price: i.price,
        warrantyEnd: i.warrantyEnd,
        cameWithHouse: i.cameWithHouse,
        photos: i.photos,
        manualDocIds: i.manualDocIds,
        lineageCount: i.lineage.length,
      })),
    docs: property.docs,
    shutoffs: property.shutoffs.map((s) => ({
      type: s.type,
      locationNote: s.locationNote,
      hasPhoto: Boolean(s.photo),
    })),
    rooms: property.rooms.map((r) => ({
      name: r.name,
      dims: r.dims,
    })),
  };

  zip.file('inventory.json', JSON.stringify(inventory, null, 2));
  zip.file(
    'INVENTORY.txt',
    [
      `Castle Guide — Insurance readiness inventory`,
      `Property: ${property.name}`,
      `Exported: ${exportedAt}`,
      ``,
      DISCLAIMER,
      ``,
      ...inventory.items.map(
        (i, n) =>
          `${n + 1}. [${i.category}] ${i.brand ?? ''} ${i.model ?? ''} serial=${i.serial ?? 'n/a'} value=${i.price ?? 'n/a'} warrantyEnd=${i.warrantyEnd ?? 'n/a'}`
      ),
    ].join('\n')
  );
  zip.file('README.txt', DISCLAIMER + '\n\nPhotos and PDFs are under media/ when available.\n');

  const mediaIds = new Set<string>();
  for (const item of property.items) {
    for (const ph of item.photos) mediaIds.add(ph.blobId);
  }
  for (const d of property.docs) mediaIds.add(d.blobId);

  for (const id of mediaIds) {
    const blob = await blobs.get(id);
    if (blob) {
      const buf = await toArrayBuffer(blob);
      zip.file(`media/${id}`, buf);
    }
  }

  const bytes = await zip.generateAsync({ type: 'uint8array' });
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: 'application/zip' });
}
