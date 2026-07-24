import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { OpsEvent, OpsEventType, Property, Task } from '../../storage';
import {
  pickSeasonalChecklists,
  getOpsTemplates,
  climateZoneFromZip,
} from '../../maintain';

import { go } from '../paths';
import '../../ui/kit/kit.css';

interface Props {
  id?: string;
}

const EVENT_TYPES: OpsEventType[] = [
  'trash',
  'recycling',
  'bill',
  'tax',
  'hoa',
  'insurance',
  'community',
  'other',
];
const EVENT_TYPE_LABELS: Record<OpsEventType, string> = {
  trash: 'Trash',
  recycling: 'Recycling',
  bill: 'Utility bill',
  tax: 'Property tax',
  hoa: 'HOA payment',
  insurance: 'Insurance',
  community: 'Community',
  other: 'Other',
};
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
type Frequency = 'weekly' | 'monthly' | 'yearly' | 'once';

function describeSchedule(schedule: string): string {
  const [mode, ...rest] = schedule.split(':');
  if (mode === 'weekly' && rest[1] != null) {
    return `Weekly on ${WEEKDAYS[Number(rest[1])] ?? rest[1]}`;
  }
  if (mode === 'monthly' && rest[1] != null) {
    return `Monthly on day ${rest[1]}`;
  }
  if (mode === 'yearly' && rest[0]) {
    return `Yearly on ${rest[0]}`;
  }
  if (mode === 'once' && rest[0]) {
    return `Once on ${rest[0]}`;
  }
  return schedule;
}

export function MaintainPage({ id }: Props) {
  const [property, setProperty] = useState<Property | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<
    { date: string; title: string; kind: string; whenNotToDiy?: boolean }[]
  >([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventType, setEventType] = useState<OpsEventType>('bill');
  const [eventTypeOther, setEventTypeOther] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventCost, setEventCost] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [weekday, setWeekday] = useState('2');
  const [monthDay, setMonthDay] = useState('1');
  const [yearMonth, setYearMonth] = useState('01');
  const [yearDay, setYearDay] = useState('01');
  const [onceDate, setOnceDate] = useState(new Date().toISOString().slice(0, 10));

  async function refresh() {
    if (!id) return;
    const s = await ensureStorageReady();
    const p = await s.getProperty(id);
    setProperty(p);
    if (p) {
      setCalendar(await s.getCalendar(p.id, 8));
    }
  }

  useEffect(() => {
    void refresh();
  }, [id]);

  if (!id) return <p class="error-text">Missing property id.</p>;
  if (!property) return <p class="muted">Loading…</p>;

  const zone = property.climateZone ?? climateZoneFromZip(property.zip);
  const seasonal = pickSeasonalChecklists(property.zip);
  const pending = property.tasks.filter((t) => t.status === 'pending');
  const notDiy = pending.filter((t) => t.whenNotToDiy);

  async function runSchedule() {
    const s = await ensureStorageReady();
    const result = await s.scheduleFromCatalog(property!.id);
    setMessage(
      `Scheduled ${result.created.length} task(s) for climate zone "${result.zone}"` +
        (result.skippedExisting
          ? ` (${result.skippedExisting} already existed)`
          : '')
    );
    await refresh();
  }

  function buildSchedule(): string {
    if (frequency === 'weekly') return `weekly:weekday:${weekday}`;
    if (frequency === 'monthly') return `monthly:day:${monthDay}`;
    if (frequency === 'yearly') return `yearly:${yearMonth}-${yearDay}`;
    return `once:${onceDate}`;
  }

  /** Inverse of buildSchedule — pre-fills the form's fields when editing. */
  function applySchedule(schedule: string) {
    const [mode, ...rest] = schedule.split(':');
    if (mode === 'weekly' && rest[1] != null) {
      setFrequency('weekly');
      setWeekday(rest[1]);
    } else if (mode === 'monthly' && rest[1] != null) {
      setFrequency('monthly');
      setMonthDay(rest[1]);
    } else if (mode === 'yearly' && rest[0]) {
      setFrequency('yearly');
      const [m, d] = rest[0].split('-');
      if (m) setYearMonth(m);
      if (d) setYearDay(d);
    } else if (mode === 'once' && rest[0]) {
      setFrequency('once');
      setOnceDate(rest[0]);
    }
  }

  function resetEventForm() {
    setEditingEventId(null);
    setEventTitle('');
    setEventTypeOther('');
    setEventCost('');
    setShowAddEvent(false);
  }

  function startEditEvent(ev: OpsEvent) {
    setEditingEventId(ev.id);
    setEventType(ev.type);
    // The free-text "what kind of event?" box (shown only when type is
    // 'other') is never stored separately — it just seeds the title, which
    // is already pre-filled below, so there's nothing to reconstruct here.
    setEventTypeOther('');
    setEventTitle(ev.title);
    setEventCost(ev.costEstimate != null ? String(ev.costEstimate) : '');
    applySchedule(ev.schedule);
    setShowAddEvent(true);
  }

  async function saveEvent(e: Event) {
    e.preventDefault();
    const title = eventTitle.trim() || (eventType === 'other' ? eventTypeOther.trim() : EVENT_TYPE_LABELS[eventType]);
    if (!title) return;
    const s = await ensureStorageReady();
    const costEstimate = eventCost.trim() ? Number(eventCost) : null;
    if (editingEventId) {
      await s.updateOpsEvent(property!.id, editingEventId, {
        type: eventType,
        title,
        schedule: buildSchedule(),
        costEstimate,
      });
      setMessage(`${title} updated.`);
    } else {
      await s.addOpsEvent(property!.id, {
        type: eventType,
        title,
        schedule: buildSchedule(),
        source: 'user',
        remind: true,
        costEstimate,
      });
      setMessage(`${title} added to your home calendar.`);
    }
    resetEventForm();
    await refresh();
  }

  async function removeEvent(ev: OpsEvent) {
    const s = await ensureStorageReady();
    await s.removeOpsEvent(property!.id, ev.id);
    setMessage(`Removed "${ev.title}" from your home calendar.`);
    await refresh();
  }

  async function addFromTemplate(tplId: string) {
    const tpl = getOpsTemplates().find((t) => t.id === tplId);
    if (!tpl) return;
    if (property!.opsEvents.some((e) => e.source === tpl.id)) {
      setMessage(`${tpl.title} is already on your calendar.`);
      return;
    }
    const s = await ensureStorageReady();
    await s.addOpsEvent(property!.id, {
      type: tpl.type as OpsEventType,
      title: tpl.title,
      schedule: tpl.defaultSchedule,
      source: tpl.id,
      remind: true,
      notes: tpl.notes,
    });
    await refresh();
  }

  async function markDone(task: Task) {
    const s = await ensureStorageReady();
    await s.completeTask(property!.id, task.id);
    setMessage(`Checked off: ${task.title}`);
    await refresh();
  }

  async function downloadIcs() {
    const s = await ensureStorageReady();
    const ics = await s.exportIcs(property!.id);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${property!.name.replace(/\s+/g, '-').toLowerCase()}-castle.ics`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('ICS downloaded — import into Google, Apple, or Outlook.');
  }

  const overdue = pending.filter(
    (t) => t.nextDue && t.nextDue < new Date().toISOString().slice(0, 10)
  );
  const soon = pending.filter((t) => {
    if (!t.nextDue) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (t.nextDue < today) return false;
    const d = new Date(t.nextDue + 'T00:00:00Z');
    const lim = new Date(today + 'T00:00:00Z');
    lim.setUTCDate(lim.getUTCDate() + 14);
    return d <= lim;
  });

  return (
    <section class="page inv-calm">
      <header class="inv-head">
        <div>
          <h1>Maintenance</h1>
          <p class="muted">
            Climate {zone}
            {property.zip ? ` · ZIP ${property.zip}` : ''} · {pending.length}{' '}
            open · {overdue.length} overdue · {soon.length} due in 2 weeks
          </p>
        </div>
        <div class="btn-row">
          <button
            type="button"
            class="btn"
            onClick={() => go('property', id!, 'house')}
          >
            Back to map
          </button>
          <button
            type="button"
            class="btn primary"
            onClick={() => void runSchedule()}
          >
            Schedule from inventory
          </button>
          <button
            type="button"
            class="btn"
            onClick={() => {
              if (showAddEvent) {
                resetEventForm();
              } else {
                setShowAddEvent(true);
              }
            }}
          >
            {showAddEvent ? 'Cancel' : '+ Add calendar event'}
          </button>
          <button type="button" class="btn" onClick={() => void downloadIcs()}>
            Export calendar
          </button>
        </div>
      </header>

      {message && <p class="ok-text">{message}</p>}

      {showAddEvent && (
        <form class="card add-strip" onSubmit={(e) => void saveEvent(e)}>
          <div class="add-row">
            <label>
              Type
              <select
                value={eventType}
                onChange={(e) =>
                  setEventType((e.target as HTMLSelectElement).value as OpsEventType)
                }
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EVENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
            {eventType === 'other' && (
              <label>
                What kind of event?
                <input
                  autoFocus
                  placeholder="e.g. Lawn care service"
                  value={eventTypeOther}
                  onInput={(e) =>
                    setEventTypeOther((e.target as HTMLInputElement).value)
                  }
                />
              </label>
            )}
            <label>
              Title
              <input
                placeholder={eventType === 'other' ? eventTypeOther || 'e.g. Lawn care' : EVENT_TYPE_LABELS[eventType]}
                value={eventTitle}
                onInput={(e) => setEventTitle((e.target as HTMLInputElement).value)}
              />
            </label>
            <label>
              Repeats
              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency((e.target as HTMLSelectElement).value as Frequency)
                }
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="once">One time</option>
              </select>
            </label>
            {frequency === 'weekly' && (
              <label>
                Weekday
                <select
                  value={weekday}
                  onChange={(e) => setWeekday((e.target as HTMLSelectElement).value)}
                >
                  {WEEKDAYS.map((name, i) => (
                    <option key={name} value={i}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {frequency === 'monthly' && (
              <label>
                Day of month
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={monthDay}
                  onInput={(e) => setMonthDay((e.target as HTMLInputElement).value)}
                />
              </label>
            )}
            {frequency === 'yearly' && (
              <>
                <label>
                  Month
                  <input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="MM"
                    value={yearMonth}
                    onInput={(e) =>
                      setYearMonth((e.target as HTMLInputElement).value.padStart(2, '0'))
                    }
                  />
                </label>
                <label>
                  Day
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="DD"
                    value={yearDay}
                    onInput={(e) =>
                      setYearDay((e.target as HTMLInputElement).value.padStart(2, '0'))
                    }
                  />
                </label>
              </>
            )}
            {frequency === 'once' && (
              <label>
                Date
                <input
                  type="date"
                  value={onceDate}
                  onInput={(e) => setOnceDate((e.target as HTMLInputElement).value)}
                />
              </label>
            )}
            <label>
              Est. cost ($)
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="optional"
                value={eventCost}
                onInput={(e) => setEventCost((e.target as HTMLInputElement).value)}
              />
            </label>
            <button type="submit" class="btn primary">
              {editingEventId ? 'Save changes' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {notDiy.length > 0 && (
        <div class="card warning-card">
          <h2>When NOT to DIY</h2>
          <p class="muted">
            Safety warnings — deadpan on purpose. Characters joke; these don't.
          </p>
          <ul>
            {notDiy.map((t) => (
              <li key={t.id}>
                <strong class="danger-text">{t.title}</strong>
                <ul>
                  {t.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div class="card">
        <h2>Tasks</h2>
        {pending.length === 0 ? (
          <p class="muted">
            No open tasks. Add appliances in Inventory, then schedule from
            inventory.
          </p>
        ) : (
          <ul class="item-list">
            {pending.map((t) => (
              <li key={t.id} class="item-card">
                <div>
                  <strong>{t.title}</strong>
                  <div class="muted">
                    Due {t.nextDue ?? '—'} · {t.cadence} ·{' '}
                    {'🔧'.repeat(Math.min(5, Math.max(1, t.difficulty)))} · DIY ~
                    ${t.diyCost ?? '—'} / pro ~ ${t.proCost ?? '—'}
                  </div>
                  {t.whenNotToDiy && (
                    <p class="danger-text">
                      <strong>when-NOT-to-DIY</strong>
                    </p>
                  )}
                  {t.warnings.map((w) => (
                    <p key={w} class={t.whenNotToDiy ? 'danger-text' : 'muted'}>
                      {w}
                    </p>
                  ))}
                  {t.tools.length > 0 && (
                    <p class="muted">Tools: {t.tools.join(', ')}</p>
                  )}
                </div>
                <button type="button" class="btn" onClick={() => void markDone(t)}>
                  Check off
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div class="card">
        <h2>Recurring events</h2>
        <p class="muted">
          Trash, bills, taxes, HOA, insurance — anything on a repeating home
          calendar. Remove one and every future occurrence goes with it.
        </p>
        <div class="btn-row compact">
          {getOpsTemplates().map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              class="btn"
              onClick={() => void addFromTemplate(tpl.id)}
            >
              + {tpl.title}
            </button>
          ))}
        </div>
        {property.opsEvents.length === 0 ? (
          <p class="muted">
            No recurring events yet — add trash day, HOA, insurance, or a
            custom one above.
          </p>
        ) : (
          <ul class="plain-list">
            {property.opsEvents.map((ev) => (
              <li key={ev.id}>
                <strong>{ev.title}</strong>{' '}
                <span class="muted">
                  · {EVENT_TYPE_LABELS[ev.type] ?? ev.type} ·{' '}
                  {describeSchedule(ev.schedule)}
                  {ev.costEstimate != null ? ` · ~$${ev.costEstimate}` : ''}
                </span>
                <button
                  type="button"
                  class="kit-icon-btn"
                  aria-label="Edit"
                  onClick={() => startEditEvent(ev)}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  class="kit-icon-btn"
                  aria-label="Remove"
                  onClick={() => void removeEvent(ev)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div class="card">
        <h2>Upcoming</h2>
        <p class="muted">Next 8 weeks, from the recurring events above plus your maintenance tasks.</p>
        {calendar.length === 0 ? (
          <p class="muted">Nothing scheduled yet.</p>
        ) : (
          <ul class="plain-list cal-list">
            {calendar.map((c) => (
              <li key={`${c.date}-${c.title}-${c.kind}`}>
                <span class="cal-date">{c.date}</span>{' '}
                <span class={c.whenNotToDiy ? 'danger-text' : ''}>{c.title}</span>{' '}
                <span class="muted">({c.kind})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {seasonal.map((list) => (
        <div class="card" key={list.id}>
          <h2>{list.title}</h2>
          <p class="gus-line">“{list.gusLine}”</p>
          <ul>
            {list.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
