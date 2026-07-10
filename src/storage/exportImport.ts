import JSZip from 'jszip';
import type { CastleDatabase } from './db';
import type { BlobStore } from './blobStore';
import type {
  ExportManifest,
  Profile,
  Property,
} from './types';
import {
  EXPORT_FORMAT,
  SCHEMA_VERSION,
} from './types';
import {
  canMigrateToCurrent,
  migratePropertyData,
  currentSchemaVersion,
} from './migrations';
import { refreezePropertyLineage } from './lineage';
import { nowIso } from './ids';
import { toArrayBuffer } from './blobUtils';

const APP_VERSION = '0.7.0';

export type ImportResult =
  | { ok: true; propertyId: string; schemaVersion: number }
  | { ok: false; errors: string[] };

export async function exportPropertyZip(args: {
  property: Property;
  profile: Profile;
  blobs: BlobStore;
}): Promise<Blob> {
  const { property, profile, blobs } = args;
  const zip = new JSZip();

  const manifest: ExportManifest = {
    format: EXPORT_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    exportedAt: nowIso(),
    propertyIds: [property.id],
  };

  // Strip secrets from profile export
  const exportProfile: Profile = {
    ...profile,
    settings: {
      ...profile.settings,
      aiKeys: undefined,
    },
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('profile.json', JSON.stringify(exportProfile, null, 2));
  zip.file(
    `properties/${property.id}/property.json`,
    JSON.stringify(property, null, 2)
  );
  zip.file(
    'README.txt',
    [
      'Castle Guide export — SENSITIVE DATA',
      'This ZIP may contain addresses, serial numbers, photos, and shutoff locations.',
      'Treat it like a house key. Do not share carelessly.',
      `schemaVersion: ${SCHEMA_VERSION}`,
      `exportedAt: ${manifest.exportedAt}`,
    ].join('\n')
  );

  const mediaIds = collectMediaIds(property);
  for (const id of mediaIds) {
    const blob = await blobs.get(id);
    if (blob) {
      // ArrayBuffer is portable across Node/happy-dom/browser (Blob can break JSZip)
      const buf = await toArrayBuffer(blob);
      zip.file(`properties/${property.id}/media/${id}`, buf);
    }
  }

  return zip.generateAsync({ type: 'uint8array' }).then((bytes) => {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return new Blob([copy], { type: 'application/zip' });
  });
}

export async function importPropertyZip(args: {
  zipBlob: Blob;
  db: CastleDatabase;
  blobs: BlobStore;
  getProfile: () => Promise<Profile>;
  saveProfile: (p: Profile) => Promise<void>;
}): Promise<ImportResult> {
  const { zipBlob, db, blobs, getProfile, saveProfile } = args;
  const errors: string[] = [];

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipBlob);
  } catch {
    return { ok: false, errors: ['Not a valid ZIP file.'] };
  }

  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    return { ok: false, errors: ['Missing manifest.json — incomplete export.'] };
  }

  let manifest: ExportManifest;
  try {
    manifest = JSON.parse(await manifestFile.async('string')) as ExportManifest;
  } catch {
    return { ok: false, errors: ['manifest.json is not valid JSON.'] };
  }

  if (manifest.format !== EXPORT_FORMAT) {
    errors.push(
      `Unknown export format "${String(manifest.format)}"; expected "${EXPORT_FORMAT}".`
    );
  }
  if (typeof manifest.schemaVersion !== 'number') {
    errors.push('manifest.schemaVersion is missing or not a number.');
  }
  if (errors.length) return { ok: false, errors };

  if (manifest.schemaVersion > currentSchemaVersion()) {
    return {
      ok: false,
      errors: [
        `This export uses schemaVersion ${manifest.schemaVersion}, but this app only understands up to ${currentSchemaVersion()}. Upgrade Castle Guide, then try again. Nothing was imported.`,
      ],
    };
  }

  if (!canMigrateToCurrent(manifest.schemaVersion)) {
    return {
      ok: false,
      errors: [
        `No migration path from schemaVersion ${manifest.schemaVersion} to ${currentSchemaVersion()}. Nothing was imported.`,
      ],
    };
  }

  const propertyIds =
    manifest.propertyIds?.length > 0
      ? manifest.propertyIds
      : findPropertyIdsFromZip(zip);

  if (propertyIds.length === 0) {
    return {
      ok: false,
      errors: ['manifest lists no properties and none were found in the ZIP.'],
    };
  }

  // Validate ALL properties and media before writing anything (all-or-nothing)
  const prepared: { property: Property; media: { id: string; data: Blob }[] }[] =
    [];

  for (const propertyId of propertyIds) {
    const path = `properties/${propertyId}/property.json`;
    const propFile = zip.file(path);
    if (!propFile) {
      errors.push(`Missing ${path}`);
      continue;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(await propFile.async('string'));
    } catch {
      errors.push(`${path} is not valid JSON`);
      continue;
    }

    let property: Property;
    try {
      property = migratePropertyData(raw, manifest.schemaVersion) as Property;
    } catch (e) {
      errors.push(
        `Migration failed for property ${propertyId}: ${e instanceof Error ? e.message : String(e)}`
      );
      continue;
    }

    if (!property?.id || !property?.name || !Array.isArray(property.items)) {
      errors.push(
        `Property ${propertyId} is missing required fields (id, name, items[]).`
      );
      continue;
    }

    property.items = refreezePropertyLineage(property.items ?? []);
    const mediaIds = collectMediaIds(property);
    const media: { id: string; data: Blob }[] = [];

    for (const mid of mediaIds) {
      const mpath = `properties/${propertyId}/media/${mid}`;
      const mfile = zip.file(mpath);
      if (!mfile) {
        errors.push(`Missing media file ${mpath} (referenced by property data)`);
        continue;
      }
      const u8 = await mfile.async('uint8array');
      const copy = new Uint8Array(u8.byteLength);
      copy.set(u8);
      const data = new Blob([copy], {
        type: 'application/octet-stream',
      });
      media.push({ id: mid, data });
    }

    prepared.push({ property, media });
  }

  if (errors.length) {
    return {
      ok: false,
      errors: [
        ...errors,
        'Import aborted: nothing was written (all-or-nothing).',
      ],
    };
  }

  // Commit
  const profile = await getProfile();
  for (const { property, media } of prepared) {
    for (const m of media) {
      await blobs.put(m.id, m.data);
    }
    await db.properties.put(property);
    if (!profile.propertyIds.includes(property.id)) {
      profile.propertyIds.push(property.id);
    }
    profile.activePropertyId = property.id;
  }
  await saveProfile(profile);

  return {
    ok: true,
    propertyId: prepared[0].property.id,
    schemaVersion: manifest.schemaVersion,
  };
}

function collectMediaIds(property: Property): string[] {
  const ids = new Set<string>();
  for (const d of property.docs ?? []) ids.add(d.blobId);
  for (const item of property.items ?? []) {
    for (const ph of item.photos ?? []) ids.add(ph.blobId);
  }
  for (const room of property.rooms ?? []) {
    for (const ph of room.photos ?? []) ids.add(ph.blobId);
  }
  for (const s of property.shutoffs ?? []) {
    if (s.photo?.blobId) ids.add(s.photo.blobId);
  }
  return [...ids];
}

function findPropertyIdsFromZip(zip: JSZip): string[] {
  const ids: string[] = [];
  zip.forEach((relativePath) => {
    const m = /^properties\/([^/]+)\/property\.json$/.exec(relativePath);
    if (m) ids.push(m[1]);
  });
  return ids;
}
