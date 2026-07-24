/**
 * Public storage API — the only module UI/domain should import from storage/.
 */
export { CastleStorage, type CastleStorageOptions } from './CastleStorage';
export {
  SCHEMA_VERSION,
  EXPORT_FORMAT,
  type Profile,
  type Property,
  type Item,
  type Room,
  type RoomFloor,
  type Note,
  type DocMeta,
  type Shutoff,
  type ShutoffType,
  type Consumable,
  type EmergencyContact,
  type LineageEntry,
  type PaintCard,
  type BlobRef,
  type Task,
  type OpsEvent,
  type OpsEventType,
  type Quote,
  type Improvement,
  type MortgageInfo,
  type DaleVerdict,
} from './types';
export {
  createItem,
  createRoom,
  createNote,
  createEmptyProperty,
} from './factories';
export { newId, nowIso, todayIsoDate } from './ids';
export { sha256Blob, sha256Hex } from './hash';
export type { ImportResult } from './exportImport';
export { currentSchemaVersion } from './migrations';
