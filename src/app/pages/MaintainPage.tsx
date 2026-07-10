import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Property, Task } from '../../storage';
import {
  pickSeasonalChecklists,
  getOpsTemplates,
  climateZoneFromZip,
} from '../../maintain';

const base = import.meta.env.BASE_URL;

interface Props {
  id?: string;
}

export function MaintainPage({ id }: Props) {
  const [property, setProperty] = useState<Property | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<
    { date: string; title: string; kind: string; whenNotToDiy?: boolean }[]
  >([]);

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

  async function addTrashDay() {
    const day = window.prompt(
      'Trash weekday (0=Sun … 6=Sat). Default 2 = Tuesday:',
      '2'
    );
    if (day === null) return;
    const weekday = Math.min(6, Math.max(0, Number(day) || 2));
    const s = await ensureStorageReady();
    await s.addOpsEvent(property!.id, {
      type: 'trash',
      title: 'Trash day',
      schedule: `weekly:weekday:${weekday}`,
      source: 'user',
      remind: true,
    });
    setMessage('Trash day added to ops calendar.');
    await refresh();
  }

  async function addFromTemplate(tplId: string) {
    const tpl = getOpsTemplates().find((t) => t.id === tplId);
    if (!tpl) return;
    const s = await ensureStorageReady();
    await s.addOpsEvent(property!.id, {
      type: tpl.type as 'trash',
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

  return (
    <section class="page">
      <p class="eyebrow">
        <a href={`${base}property/${id}`}>← {property.name}</a>
      </p>
      <h1>Maintenance & Ops</h1>
      <p class="muted">
        Climate zone: <strong>{zone}</strong>
        {property.zip ? ` (from ZIP ${property.zip})` : ' — add a ZIP for regional cadence'}
      </p>

      <div class="btn-row">
        <button type="button" class="btn primary" onClick={() => void runSchedule()}>
          Auto-schedule from catalog
        </button>
        <button type="button" class="btn" onClick={() => void addTrashDay()}>
          Add trash day
        </button>
        <button type="button" class="btn" onClick={() => void downloadIcs()}>
          Export ICS
        </button>
      </div>

      {message && <p class="ok-text">{message}</p>}

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
        <h2>Task cards</h2>
        {pending.length === 0 ? (
          <p class="muted">
            No pending tasks. Add appliances, then run auto-schedule (furnace
            filter uses your consumable size when present).
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
        <h2>Ops calendar (next 8 weeks)</h2>
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
        {calendar.length === 0 ? (
          <p class="muted">Empty — schedule tasks and add trash/recycling days.</p>
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
