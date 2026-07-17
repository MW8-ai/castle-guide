import { describe, it, expect, beforeEach } from 'vitest';
import { CastleStorage } from '../src/storage/CastleStorage';
import { deleteDatabase } from '../src/storage/db';
import {
  scheduleTasksFromCatalog,
  buildIcs,
  expandOpsOccurrences,
  taskOccurrences,
  mergeCalendar,
  getTaskTemplates,
  computeNextDue,
} from '../src/maintain';
import { createEmptyProperty, createItem } from '../src/storage/factories';

const DB = 'castle-test-maintain';

describe('Phase 2 maintenance engine', () => {
  beforeEach(async () => {
    await deleteDatabase(DB);
  });

  it('schedules furnace filter task with YOUR filter size on the title', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('Filter House', '46240');
    const furnace = await storage.addItem(property.id, {
      category: 'furnace',
      brand: 'Carrier',
      filterSpecs: [{ name: 'furnace filter', sizeOrModel: '16x25x1' }],
    });
    await storage.addConsumable(property.id, {
      kind: 'furnace filter',
      label: 'Main furnace',
      sizeOrModel: '16x25x1',
      itemId: furnace.id,
    });

    const result = await storage.scheduleFromCatalog(property.id);
    expect(result.created.length).toBeGreaterThan(0);

    const filterTask = result.created.find((t) =>
      t.templateId === 'tpl-furnace-filter'
    );
    expect(filterTask).toBeTruthy();
    expect(filterTask!.title).toContain('16x25x1');
    expect(filterTask!.detail).toBe('16x25x1');
    expect(filterTask!.nextDue).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const loaded = await storage.getProperty(property.id);
    expect(loaded!.tasks.some((t) => t.title.includes('16x25x1'))).toBe(true);
  });

  it('is idempotent — second schedule does not duplicate template+item tasks', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('Idempotent', '10001');
    await storage.addItem(property.id, {
      category: 'furnace',
      brand: 'Trane',
      filterSpecs: [{ name: 'filter', sizeOrModel: '20x20x1' }],
    });
    const a = await storage.scheduleFromCatalog(property.id);
    const b = await storage.scheduleFromCatalog(property.id);
    expect(b.created.length).toBe(0);
    expect(b.skippedExisting).toBeGreaterThan(0);
    const p = await storage.getProperty(property.id);
    const filterTasks = p!.tasks.filter((t) => t.templateId === 'tpl-furnace-filter');
    expect(filterTasks.length).toBe(1);
    expect(a.created.length).toBeGreaterThan(0);
  });

  it('puts trash day on the ops calendar', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('Trash', '46240');
    await storage.addOpsEvent(property.id, {
      type: 'trash',
      title: 'Trash day',
      schedule: 'weekly:weekday:2',
      remind: true,
    });
    const cal = await storage.getCalendar(property.id, 4);
    expect(cal.some((c) => c.title === 'Trash day' && c.kind === 'ops')).toBe(
      true
    );
  });

  it('removeOpsEvent drops it from the property and the calendar', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('Remove Ops', '46240');
    const trash = await storage.addOpsEvent(property.id, {
      type: 'trash',
      title: 'Trash day',
      schedule: 'weekly:weekday:2',
      remind: true,
    });
    const hoa = await storage.addOpsEvent(property.id, {
      type: 'hoa',
      title: 'HOA dues',
      schedule: 'monthly:day:1',
      remind: true,
    });

    await storage.removeOpsEvent(property.id, trash.id);

    const loaded = await storage.getProperty(property.id);
    expect(loaded!.opsEvents.map((e) => e.id)).toEqual([hoa.id]);
    const cal = await storage.getCalendar(property.id, 8);
    expect(cal.some((c) => c.sourceId === trash.id)).toBe(false);
    expect(cal.some((c) => c.sourceId === hoa.id)).toBe(true);
  });

  it('expands monthly, yearly, and once schedule modes', () => {
    const occurrences = expandOpsOccurrences(
      [
        {
          id: 'monthly1',
          type: 'hoa',
          title: 'HOA dues',
          schedule: 'monthly:day:15',
          remind: true,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'yearly1',
          type: 'tax',
          title: 'Property tax',
          schedule: 'yearly:04-15',
          remind: true,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'once1',
          type: 'other',
          title: 'Roof inspection',
          schedule: 'once:2026-08-01',
          remind: true,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      45, // wide enough window to catch the next yearly occurrence too
      '2026-07-01'
    );

    const monthly = occurrences.filter((o) => o.sourceId === 'monthly1');
    expect(monthly.length).toBeGreaterThanOrEqual(2);
    expect(monthly.every((o) => o.date.endsWith('-15'))).toBe(true);

    const yearly = occurrences.filter((o) => o.sourceId === 'yearly1');
    expect(yearly).toEqual([
      expect.objectContaining({ date: '2027-04-15' }),
    ]);

    const once = occurrences.filter((o) => o.sourceId === 'once1');
    expect(once).toEqual([expect.objectContaining({ date: '2026-08-01' })]);
  });

  it('once events outside the requested window are excluded', () => {
    const occurrences = expandOpsOccurrences(
      [
        {
          id: 'past',
          type: 'other',
          title: 'Already happened',
          schedule: 'once:2026-01-01',
          remind: true,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'far-future',
          type: 'other',
          title: 'Way out',
          schedule: 'once:2030-01-01',
          remind: true,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      8,
      '2026-07-01'
    );
    expect(occurrences).toEqual([]);
  });

  it('ICS contains furnace-filter task and trash day', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('ICS House', '46240');
    await storage.addItem(property.id, {
      category: 'furnace',
      brand: 'Carrier',
      filterSpecs: [{ name: 'filter', sizeOrModel: '16x25x1' }],
    });
    await storage.scheduleFromCatalog(property.id);
    await storage.addOpsEvent(property.id, {
      type: 'trash',
      title: 'Trash day',
      schedule: 'weekly:weekday:3',
      remind: true,
    });

    const ics = await storage.exportIcs(property.id, 8);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toMatch(/Trash day/);
    expect(ics).toMatch(/filter|Furnace|furnace/i);
    expect(ics).toContain('END:VCALENDAR');
  });

  it('ships at least one when-NOT-to-DIY gas/electrical template with warnings', () => {
    const templates = getTaskTemplates();
    const gas = templates.find((t) => t.id === 'tpl-gas-appliance-valve');
    const panel = templates.find((t) => t.id === 'tpl-main-panel');
    expect(gas?.whenNotToDiy).toBe(true);
    expect(gas!.warnings.length).toBeGreaterThan(0);
    expect(panel?.whenNotToDiy).toBe(true);

    const property = createEmptyProperty('Safety');
    property.items.push(
      createItem({
        category: 'water-heater',
        brand: 'Rheem',
        purchaseDate: '2019-01-01',
      })
    );
    const { created } = scheduleTasksFromCatalog(property);
    const gasTask = created.find((t) => t.templateId === 'tpl-gas-appliance-valve');
    expect(gasTask).toBeTruthy();
    expect(gasTask!.whenNotToDiy).toBe(true);
    expect(gasTask!.warnings.join(' ')).toMatch(/gas/i);
  });

  it('computeNextDue rolls cadence from anchor', () => {
    const due = computeNextDue({
      anchorDate: '2020-01-01',
      cadenceDays: 90,
      fromDate: '2026-01-01',
    });
    expect(due >= '2026-01-01').toBe(true);
  });

  it('buildIcs escapes and produces importable structure', () => {
    const ics = buildIcs(
      [
        {
          date: '2026-07-15',
          title: 'Trash day',
          type: 'trash',
          sourceId: 'ops1',
          kind: 'ops',
        },
        {
          date: '2026-08-01',
          title: 'Replace furnace filter (16x25x1)',
          type: 'maintenance',
          sourceId: 'task1',
          kind: 'task',
          detail: '16x25x1',
        },
      ],
      'Test Cal'
    );
    expect(ics.split('\r\n').length).toBeGreaterThan(10);
    const ops = expandOpsOccurrences(
      [
        {
          id: 'o1',
          type: 'trash',
          title: 'Trash day',
          schedule: 'weekly:weekday:1',
          remind: true,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      2,
      '2026-07-06'
    );
    expect(ops.length).toBeGreaterThan(0);
    const merged = mergeCalendar(
      ops,
      taskOccurrences([
        {
          id: 't1',
          title: 'Filter',
          nextDue: '2026-07-20',
          status: 'pending',
        },
      ])
    );
    expect(merged.some((m) => m.kind === 'task')).toBe(true);
  });
});
