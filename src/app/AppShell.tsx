import type { ComponentChildren } from 'preact';
import { useActiveCastle } from './ActiveCastle';
import { href, go } from './paths';
import { computeSerenity } from '../houseview';

interface Props {
  children: ComponentChildren;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  path?: string;
}

const NAV: { id: string; label: string; segment: string; icon: string }[] = [
  { id: 'house', label: 'House View', segment: 'house', icon: '🏠' },
  { id: 'inventory', label: 'Inventory', segment: 'inventory', icon: '📦' },
  { id: 'maintain', label: 'Maintenance', segment: 'maintain', icon: '🔧' },
  { id: 'money', label: 'Money', segment: 'money', icon: '💵' },
  { id: 'area', label: 'Neighborhood', segment: 'area', icon: '🗺️' },
  { id: 'council', label: 'Council', segment: 'council', icon: '👑' },
  { id: 'builders', label: 'Builders', segment: 'builders', icon: '🛠️' },
  { id: 'settings', label: 'Settings', segment: 'settings', icon: '⚙️' },
];

export function AppShell({ children, theme, onToggleTheme, path = '' }: Props) {
  const { property, loading } = useActiveCastle();
  const pid = property?.id;
  const serenity = property ? computeSerenity(property) : 100;
  const taskDue =
    property?.tasks.filter((t) => t.status === 'pending').length ?? 0;

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
    return path.includes(`/${segment}`);
  }

  return (
    <div class="shell">
      <aside class="sidebar">
        <a
          class="sidebar-brand"
          href={href()}
          onClick={(e) => {
            e.preventDefault();
            go();
          }}
        >
          <span class="brand-mark" aria-hidden="true">
            🏰
          </span>
          <div>
            <div class="brand-title">Castle Guide</div>
            <div class="brand-sub">Your castle. Your data.</div>
          </div>
        </a>

        {property && (
          <div class="sidebar-castle">
            <div class="sidebar-castle-name">{property.name}</div>
            <div class="sidebar-castle-meta">
              Serenity {serenity}
              {taskDue > 0 ? ` · ${taskDue} tasks` : ''}
            </div>
          </div>
        )}

        <nav class="sidebar-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              class={
                isActive(item.segment) ? 'sidebar-link active' : 'sidebar-link'
              }
              disabled={!pid && item.segment !== 'settings'}
              onClick={() => navTo(item.segment)}
            >
              <span class="sidebar-ico">{item.icon}</span>
              {item.label}
              {item.segment === 'maintain' && taskDue > 0 && (
                <span class="nav-badge">{taskDue}</span>
              )}
            </button>
          ))}
        </nav>

        <div class="sidebar-foot">
          <button type="button" class="theme-btn" onClick={onToggleTheme}>
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
          <button
            type="button"
            class="sidebar-link subtle"
            onClick={() => go()}
          >
            All castles
          </button>
        </div>
      </aside>

      <div class="shell-main">
        {loading ? (
          <div class="page loading-splash">Opening your castle…</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
