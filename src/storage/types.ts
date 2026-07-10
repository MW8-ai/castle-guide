/** User-data types for Castle Guide schemaVersion 1. */

export const SCHEMA_VERSION = 1 as const;
export const EXPORT_FORMAT = 'castle-guide-export' as const;

export type ThemeSetting = 'light' | 'dark' | 'system';
export type LengthUnit = 'ft' | 'm';

export interface AppSettings {
  theme: ThemeSetting;
  activeRendererId: string;
  characterNameOverrides: Record<string, string>;
  currency: string;
  lengthUnit: LengthUnit;
  /** Browser-only; never included in default export. */
  aiKeys?: Record<string, string>;
  realtorGift?: {
    agentName?: string;
    brokerage?: string;
    phone?: string;
    email?: string;
    logoBlobId?: string;
  };
}

export interface Profile {
  id: string;
  displayName: string;
  createdAt: string;
  propertyIds: string[];
  settings: AppSettings;
  activePropertyId: string | null;
}

export interface Dims3 {
  L: number;
  W: number;
  H: number;
}

export interface BlobRef {
  blobId: string;
  kind: 'photo' | 'pdf' | 'other';
  caption?: string;
  createdAt: string;
}

export interface PaintCard {
  id: string;
  brand: string;
  line?: string;
  number: string;
  sheen?: string;
  room?: string;
  date?: string | null;
}

export interface FilterSpec {
  name: string;
  sizeOrModel: string;
}

export interface ServiceEntry {
  id: string;
  date: string;
  note: string;
  cost?: number;
}

/** Frozen snapshot of an item at replacement time — immutable. */
export interface LineageEntry {
  readonly snapshot: Readonly<ItemSnapshot>;
  readonly activeFrom: string;
  readonly activeTo: string;
}

/** Fields captured into lineage (no nested lineage recursion). */
export interface ItemSnapshot {
  id: string;
  category: string;
  roomId?: string | null;
  brand?: string | null;
  model?: string | null;
  serial?: string | null;
  purchaseDate?: string | null;
  price?: number | null;
  cameWithHouse?: boolean | null;
  lifespanYrs?: number | null;
  warrantyEnd?: string | null;
  dims?: Partial<Dims3> | null;
  filterSpecs: FilterSpec[];
  manualDocIds: string[];
  photos: BlobRef[];
  serviceLog: ServiceEntry[];
  poolRoomWorthy: boolean;
  notes?: string | null;
}

export interface Item extends ItemSnapshot {
  active: boolean;
  softDeleted: boolean;
  lineage: LineageEntry[];
}

export interface Placement {
  id: string;
  itemId: string;
  x: number;
  y: number;
  z?: number;
  rotation: number;
  footprint: { L: number; W: number };
}

export interface Room {
  id: string;
  name: string;
  type: string;
  dims: Dims3;
  materials?: { floor?: string; wall?: string; trim?: string };
  paintCards: PaintCard[];
  photos: BlobRef[];
  placements: Placement[];
  noteIds: string[];
}

export interface DocMeta {
  id: string;
  type:
    | 'manual'
    | 'receipt'
    | 'closing'
    | 'inspection'
    | 'warranty'
    | 'blueprint'
    | 'other';
  blobId: string;
  date?: string | null;
  tags: string[];
  itemId?: string | null;
  title?: string;
}

export interface Note {
  id: string;
  body: string;
  someday: boolean;
  roomId?: string | null;
  itemId?: string | null;
  createdAt: string;
  updatedAt: string;
  title?: string;
  links?: string[];
  roughBudget?: number | null;
}

export type ShutoffType =
  | 'water'
  | 'gas'
  | 'electric-main'
  | 'breaker-panel'
  | 'sump'
  | 'septic'
  | 'other';

export interface Shutoff {
  id: string;
  type: ShutoffType;
  locationNote: string;
  photo?: BlobRef | null;
}

export interface Consumable {
  id: string;
  kind: string;
  label: string;
  sizeOrModel: string;
  roomId?: string | null;
  itemId?: string | null;
  notes?: string | null;
}

export type TaskStatus = 'pending' | 'done' | 'skipped';

export interface TaskHistoryEntry {
  id: string;
  completedAt: string;
  note?: string;
}

/** Maintenance / DIY task instance on a property. */
export interface Task {
  id: string;
  /** Links to shipped template id when auto-generated */
  templateId?: string | null;
  itemId?: string | null;
  title: string;
  /** Human cadence label, e.g. "every 90 days" */
  cadence: string;
  /** ISO date YYYY-MM-DD */
  nextDue: string | null;
  difficulty: number; // 1–5 wrenches
  diyCost?: number | null;
  proCost?: number | null;
  tools: string[];
  /** when-NOT-to-DIY and other safety lines — deadpan */
  warnings: string[];
  whenNotToDiy: boolean;
  videoLinks: string[];
  status: TaskStatus;
  history: TaskHistoryEntry[];
  /** Interpolated details e.g. filter size */
  detail?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OpsEventType =
  | 'trash'
  | 'recycling'
  | 'bill'
  | 'tax'
  | 'hoa'
  | 'insurance'
  | 'community'
  | 'other';

/** Household ops calendar entry (not repair-only). */
export interface OpsEvent {
  id: string;
  type: OpsEventType;
  title: string;
  /**
   * Schedule encoding:
   * - weekly:weekday:0-6 (0=Sunday)
   * - monthly:day:1-28
   * - once:YYYY-MM-DD
   * - yearly:MM-DD
   */
  schedule: string;
  source?: string | null;
  remind: boolean;
  notes?: string | null;
  createdAt: string;
}

export interface Improvement {
  id: string;
  date: string;
  desc: string;
  cost: number;
  currency: string;
  receiptDocIds: string[];
  basisEligible: boolean;
  notes?: string | null;
}

export type DaleVerdict = 'fair-dinkum' | 'steep' | 'dreamin' | 'unknown';

export interface QuoteLineItem {
  id: string;
  description: string;
  amount: number;
}

export interface Quote {
  id: string;
  job: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  lineItems: QuoteLineItem[];
  scopeNotes?: string | null;
  costEntryId?: string | null;
  daleVerdict: DaleVerdict;
  daleReasons: string[];
  createdAt: string;
}

/** Optional mortgage fields for payoff tools (stored on property). */
export interface MortgageInfo {
  principal: number;
  annualRatePercent: number;
  termMonths: number;
  startDate?: string | null;
  extraMonthly?: number | null;
  pmiMonthly?: number | null;
  homeValue?: number | null;
}

export interface AreaLink {
  id: string;
  label: string;
  url: string;
  category: 'social' | 'crime' | 'gov' | 'school' | 'pets' | 'utility' | 'other';
}

export interface Property {
  id: string;
  name: string;
  address?: string | null;
  zip?: string | null;
  climateZone?: string | null;
  yearBuilt?: number | null;
  style?: string | null;
  hoa?: boolean | null;
  rooms: Room[];
  items: Item[];
  tasks: Task[];
  opsEvents: OpsEvent[];
  docs: DocMeta[];
  improvements: Improvement[];
  quotes: Quote[];
  notes: Note[];
  areaLinks: AreaLink[];
  shutoffs: Shutoff[];
  consumables: Consumable[];
  mortgage?: MortgageInfo | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExportManifest {
  format: typeof EXPORT_FORMAT;
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  propertyIds: string[];
}

export interface MediaRecord {
  id: string;
  mimeType: string;
  byteLength: number;
  /** SHA-256 hex of raw bytes */
  sha256: string;
  createdAt: string;
}

export type BlobBackend = 'opfs' | 'idb';
