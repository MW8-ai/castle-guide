# Data Model — Castle Guide

> **Version:** 0.1.0 · Phase 0  
> Formalizes master guide §8 with export package layout and schema versioning.

**Units:** Lengths in **feet** unless a field documents otherwise. Currency in user-selected code (default `USD`). Dates as ISO-8601 `YYYY-MM-DD`.

**IDs:** UUID v4 strings generated client-side.

---

## 1. Package & versioning

### Export ZIP layout

```
castle-export/
├── manifest.json          # schemaVersion, exportedAt, appVersion, propertyIds
├── profile.json           # Profile without secrets
├── properties/
│   └── <propertyId>/
│       ├── property.json  # Property + nested collections
│       └── media/
│           └── <blobId>   # photos, PDFs
└── README.txt             # human note: sensitive data
```

### manifest.json

```json
{
  "format": "castle-guide-export",
  "schemaVersion": 1,
  "appVersion": "0.1.0",
  "exportedAt": "2026-07-09T12:00:00.000Z",
  "propertyIds": ["…"]
}
```

Migrations: `src/storage/migrations/` bump `schemaVersion` and transform on import.

---

## 2. App-level entities (user data)

### Profile

| Field | Type | Req | Notes |
|-------|------|-----|-------|
| id | string | ✓ | |
| displayName | string | ✓ | |
| createdAt | string | ✓ | ISO datetime |
| propertyIds | string[] | ✓ | |
| settings | AppSettings | ✓ | |

### AppSettings

| Field | Type | Notes |
|-------|------|-------|
| theme | `'light' \| 'dark' \| 'system'` | |
| activeRendererId | string | e.g. `iso` |
| characterNameOverrides | Record&lt;string,string&gt; | council id → display name |
| currency | string | default `USD` |
| lengthUnit | `'ft' \| 'm'` | display; storage remains ft in v1 unless migrated |
| aiKeys | AiKeyBag? | **browser-only; never default-export** |
| realtorGift | RealtorGiftConfig? | stub until white-label depth decided |

### Property

| Field | Type | Req | Notes |
|-------|------|-----|-------|
| id | string | ✓ | |
| name | string | ✓ | e.g. "The Serenity" |
| address | string? | | Optional (privacy) |
| zip | string? | | Unlocks regional content |
| climateZone | string? | | Derived/lookup from ZIP |
| yearBuilt | number? | | |
| style | string? | | architectural style free text |
| hoa | boolean? | | |
| rooms | Room[] | ✓ | |
| items | Item[] | ✓ | |
| tasks | Task[] | ✓ | |
| opsEvents | OpsEvent[] | ✓ | |
| docs | DocMeta[] | ✓ | blob in media/ |
| improvements | Improvement[] | ✓ | |
| quotes | Quote[] | ✓ | |
| notes | Note[] | ✓ | |
| areaLinks | AreaLink[] | ✓ | |
| shutoffs | Shutoff[] | ✓ | |
| valuationSnapshots | ValuationSnapshot[] | | LIGHT/manual |

Address is optional; ZIP alone is enough for climate and link hubs.

### Room

| Field | Type | Req |
|-------|------|-----|
| id | string | ✓ |
| name | string | ✓ |
| type | string | | kitchen, bath, … |
| dims | `{ L: number, W: number, H: number }` | ✓ |
| materials | `{ floor?, wall?, trim? }` | |
| paintCards | PaintCard[] | |
| photos | BlobRef[] | |
| placements | Placement[] | |
| noteIds | string[] | |

### Placement (house-view)

| Field | Type | Req | Notes |
|-------|------|-----|-------|
| id | string | ✓ | |
| itemId | string | ✓ | |
| x, y | number | ✓ | feet from room origin |
| z | number? | | 3D-ready |
| rotation | number | ✓ | degrees |
| footprint | `{ L, W }` | ✓ | for drag collision |

### Item

| Field | Type | Req | Notes |
|-------|------|-----|-------|
| id | string | ✓ | |
| category | string | ✓ | appliance, system, furniture, … |
| roomId | string? | | |
| brand, model, serial | string? | | |
| purchaseDate | string? | | |
| price | number? | | |
| cameWithHouse | boolean? | | |
| lifespanYrs | number? | | |
| warrantyEnd | string? | | |
| dims | `{ L?, W?, H? }` | | cutout / unit size |
| filterSpecs | FilterSpec[] | | |
| manualDocIds | string[] | | |
| photos | BlobRef[] | | label + install |
| serviceLog | ServiceEntry[] | | |
| lineage | LineageEntry[] | | history snapshots |
| poolRoomWorthy | boolean | | Pool Room |
| active | boolean | ✓ | false when replaced |

### LineageEntry

| Field | Type | Notes |
|-------|------|-------|
| snapshot | object | frozen item fields at replacement |
| activeFrom | string | ISO date |
| activeTo | string | ISO date |

### Task

| Field | Type | Req |
|-------|------|-----|
| id | string | ✓ |
| itemId | string? | |
| title | string | ✓ |
| cadence | string | RRULE-ish or template id |
| nextDue | string? | |
| difficulty | 1–5 | wrenches |
| diyCost | number? | |
| proCost | number? | |
| tools | string[] | |
| warnings | string[] | when-NOT-to-DIY |
| videoLinks | string[] | |
| history | TaskHistoryEntry[] | |

### OpsEvent

| Field | Type |
|-------|------|
| id | string |
| type | `trash \| recycling \| bill \| tax \| hoa \| insurance \| community \| other` |
| title | string |
| schedule | string | human + machine cadence |
| source | string? |
| remind | boolean |

### DocMeta

| Field | Type |
|-------|------|
| id | string |
| type | `manual \| receipt \| closing \| inspection \| warranty \| blueprint \| other` |
| blobId | string |
| date | string? |
| tags | string[] |
| itemId | string? |

### Improvement / Quote / Note / AreaLink / Shutoff

As sketch in guide §8, plus:

- `Improvement.basisEligible: boolean`
- `Quote.daleVerdict: 'fair-dinkum' \| 'steep' \| 'dreamin' \| 'unknown'`
- `Note.someday: boolean` for Someday board
- `AreaLink.category: social \| crime \| gov \| school \| pets \| utility \| other`
- `Shutoff.type: water \| gas \| electric-main \| breaker-panel \| sump \| septic \| other`

### PaintCard / FilterSpec / BlobRef / ServiceEntry

Supporting types; see JSON Schemas under `data/schemas/` as they land in Phase 1. Phase 0 ships core schemas: Profile shell, NuggetCard, CostEntry, HouseViewModel fixture.

---

## 3. Shipped content (read-only `/data`)

### NuggetCard

| Field | Type | Req |
|-------|------|-----|
| id | string | ✓ |
| character | string | ✓ | council id |
| category | string | ✓ |
| title | string | ✓ |
| body | string | ✓ |
| sources | `{ url: string, date: string, label?: string }[]` | ✓ |
| asOfDate | string | ✓ |
| confidence | `verified \| typical \| regional` | ✓ |
| regionTags | string[] | |
| seasonTags | string[] | |
| estSavings | number? | |

CI **rejects** missing `sources` or `asOfDate`.  
**Verified** entries require a real primary-source URL (not a placeholder).

### CostEntry

| Field | Type | Req |
|-------|------|-----|
| id | string | ✓ |
| job | string | ✓ |
| diyRange | `{ min: number, max: number }` | ✓ |
| proRange | `{ min: number, max: number }` | ✓ |
| currency | string | ✓ |
| source | string | ✓ |
| sourceUrl | string? | required if confidence=verified |
| asOfDate | string | ✓ |
| regionNote | string | ✓ |
| confidence | `verified \| typical \| regional` | ✓ |

### CharacterDef / BuilderTemplate / MaintenanceTemplate / AreaRegistry

Defined under `data/characters`, `data/builders`, `data/maintenance`, `data/area` as content expands. BuilderTemplate:

```
BuilderTemplate { id, type, tiers: [{ name, lineItems[], considerations[] }] }
```

---

## 4. Computed (not stored as authority)

| Concept | Derivation |
|---------|------------|
| Serenity score | function of overdue tasks, warranty risk, shutoff completeness |
| Climate zone | ZIP → lookup table in `/data` |
| Health by item | task nextDue vs today |

---

## 5. Privacy notes

- Address optional; exports should warn that package is sensitive.
- `aiKeys` never in default export.
- Full delete removes property tree + media blobs.
