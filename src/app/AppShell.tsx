import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useActiveCastle } from './ActiveCastle';
import { href, go } from './paths';
import { HouseGhostBackdrop } from './HouseGhostBackdrop';
import { ensureStorageReady } from './storageContext';
import { upcomingTasks } from '../houseview';

interface Props {
  children: ComponentChildren;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  path?: string;
}

const NAV: { id: string; label: string; segment: string; icon: string }[] = [
  { id: 'house', label: 'Home', segment: 'house', icon: '🏠' },
  { id: 'inventory', label: 'Inventory', segment: 'inventory', icon: '📦' },
  { id: 'maintain', label: 'Maintenance', segment: 'maintain', icon: '🔧' },
  { id: 'money', label: 'Money', segment: 'money', icon: '💵' },
  { id: 'area', label: 'Area', segment: 'area', icon: '📍' },
  { id: 'council', label: 'Tips', segment: 'council', icon: '💬' },
  { id: 'builders', label: 'Build list', segment: 'builders', icon: '🛠️' },
  { id: 'settings', label: 'Settings', segment: 'settings', icon: '⚙️' },
];

export function AppShell({ children, theme, onToggleTheme, path = '' }: Props) {
  const { property, loading, refresh } = useActiveCastle();
  const pid = property?.id;
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [dateDraft, setDateDraft] = useState('');

  const upNext = property ? upcomingTasks(property, 4) : [];

  function startReschedule(taskId: string, current: string | null) {
    setEditingTaskId(taskId);
    setDateDraft(current ?? new Date().toISOString().slice(0, 10));
  }

  async function saveReschedule(taskId: string) {
    if (!pid || !dateDraft) return;
    const s = await ensureStorageReady();
    await s.rescheduleTask(pid, taskId, dateDraft);
    setEditingTaskId(null);
    await refresh();
  }

  async function markTaskDone(taskId: string) {
    if (!pid) return;
    const s = await ensureStorageReady();
    await s.completeTask(pid, taskId);
    await refresh();
  }

  function navTo(segment: string) {
    if (!pid) {
      go();
      return;
    }
    if (segment === 'settings') {
      go('settings');
      return;
    }
    go('property', pid, segment);
  }

  function isActive(segment: string): boolean {
    if (segment === 'settings') return path.includes('/settings');
    if (segment === 'house') {
      return path.includes('/house') || /\/property\/[^/]+\/?$/.test(path);
    }
    return path.includes(`/${segment}`);
  }

  const bare =
    path.includes('/kit') ||
    (!path.includes('/property') &&
      !path.includes('/settings') &&
      !path.includes('/import'));

  const onHouse =
    path.includes('/house') || /\/property\/[^/]+\/?$/.test(path);

  // The house view and the glass pages layered over it use their own
  // named theme tokens (nightwatch/hearthlight) rather than the plain
  // theme-light/theme-dark classes, so it has to be picked explicitly here.
  const inHouseExperience =
    onHouse ||
    (Boolean(pid) &&
      (path.includes('/property') ||
        path.includes('/settings') ||
        path.includes('/import')));
  const houseDataTheme = inHouseExperience
    ? theme === 'dark'
      ? 'nightwatch'
      : 'hearthlight'
    : undefined;

  if (bare) {
    return <div class="shell-title">{loading ? null : children}</div>;
  }

  // Single persistent left sidebar for every in-app page, including the
  // house view — no more separate bottom-nav layout to keep in sync.
  return (
    <div class="shell calm-shell" data-theme={houseDataTheme}>
      <aside class="sidebar calm-sidebar">
        <a
          class="sidebar-brand"
          href={href()}
          onClick={(e) => {
            e.preventDefault();
            go();
          }}
        >
          <span class="brand-mark">⌂</span>
          <div class="sidebar-label">
            <div class="brand-title">Home Guide</div>
            {property && <div class="brand-sub">{property.name}</div>}
          </div>
        </a>
        <div class="sidebar-scroll">
          <nav class="sidebar-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                class={
                  isActive(item.segment) ? 'sidebar-link active' : 'sidebar-link'
                }
                title={item.label}
                disabled={!pid && item.segment !== 'settings'}
                onClick={() => navTo(item.segment)}
              >
                <span class="sidebar-ico" aria-hidden="true">
                  {item.icon}
                </span>
                <span class="sidebar-label">{item.label}</span>
              </button>
            ))}
          </nav>
          {pid && (
            <div class="sidebar-upnext">
              <div class="sidebar-upnext-head">
                <span>Up next</span>
                <button type="button" onClick={() => navTo('maintain')}>
                  All
                </button>
              </div>
              {upNext.length === 0 ? (
                <p class="sidebar-upnext-empty">Nothing scheduled</p>
              ) : (
                <ul class="sidebar-upnext-list">
                  {upNext.map((t) => {
                    const due = t.dueInDays;
                    const tone =
                      due != null && due < 0
                        ? 'overdue'
                        : due != null && due <= 14
                          ? 'soon'
                          : 'ok';
                    return (
                      <li key={t.id} class={`sidebar-upnext-item ${tone}`}>
                        <div class="sidebar-upnext-main">
                          <strong>{t.title}</strong>
                          {editingTaskId === t.id ? (
                            <input
                              type="date"
                              value={dateDraft}
                              autoFocus
                              onInput={(e) =>
                                setDateDraft((e.target as HTMLInputElement).value)
                              }
                              onBlur={() => void saveReschedule(t.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') void saveReschedule(t.id);
                                if (e.key === 'Escape') setEditingTaskId(null);
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              class="sidebar-upnext-date"
                              title="Reschedule"
                              onClick={() => startReschedule(t.id, t.nextDue)}
                            >
                              {due == null
                                ? (t.nextDue ?? 'No date')
                                : due < 0
                                  ? `${Math.abs(due)}d overdue`
                                  : due === 0
                                    ? 'Due today'
                                    : `Due in ${due}d`}
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          class="sidebar-upnext-check"
                          title="Mark done"
                          onClick={() => void markTaskDone(t.id)}
                        >
                          ✓
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
        <div class="sidebar-foot">
          <button
            type="button"
            class="theme-btn"
            title={
              theme === 'dark' ? 'Night mode — tap for day' : 'Day mode — tap for night'
            }
            onClick={onToggleTheme}
          >
            <span aria-hidden="true">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span class="sidebar-label">
              {theme === 'dark' ? 'Night' : 'Day'}
            </span>
          </button>
        </div>
      </aside>
      <div class={onHouse ? 'shell-main-col bleed' : 'shell-main-col'}>
        {!onHouse && property && <HouseGhostBackdrop property={property} />}
        {!onHouse && property && (
          <div class="home-identity-bar">
            <div class="home-id-main">
              <strong>{property.name}</strong>
              <span class="muted">
                {[
                  property.address,
                  property.yearBuilt ? `Built ${property.yearBuilt}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Your house'}
              </span>
            </div>
            <button
              type="button"
              class="home-id-emergency"
              onClick={() => navTo('emergency')}
            >
              🚨 Emergency
            </button>
          </div>
        )}
        <div
          class={
            onHouse ? 'shell-main bleed' : 'shell-main glass-over-house'
          }
        >
          {loading ? (
            <div class="page loading-splash">Loading…</div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
