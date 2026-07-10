import type { ComponentChildren } from 'preact';
import { useActiveCastle } from './ActiveCastle';
import { href, go } from './paths';

interface Props {
  children: ComponentChildren;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  path?: string;
}

const NAV: { id: string; label: string; segment: string; icon: string }[] = [
  { id: 'house', label: 'Home map', segment: 'house', icon: '⌂' },
  { id: 'inventory', label: 'Stuff', segment: 'inventory', icon: '🎒' },
  { id: 'maintain', label: 'Quests', segment: 'maintain', icon: '!' },
  { id: 'money', label: 'Coins', segment: 'money', icon: '$' },
  { id: 'area', label: 'World', segment: 'area', icon: '◎' },
  { id: 'council', label: 'Hints', segment: 'council', icon: '?' },
  { id: 'builders', label: 'Builds', segment: 'builders', icon: '⚒' },
  { id: 'settings', label: 'Options', segment: 'settings', icon: '⚙' },
];

export function AppShell({ children, theme, onToggleTheme, path = '' }: Props) {
  const { property, loading } = useActiveCastle();
  const pid = property?.id;
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
    if (segment === 'house') {
      return path.includes('/house') || /\/property\/[^/]+\/?$/.test(path);
    }
    return path.includes(`/${segment}`);
  }

  // Title screen: no chrome
  const titleScreen = !path.includes('/property') && !path.includes('/settings') && !path.includes('/import');

  if (titleScreen) {
    return <div class="shell-title">{loading ? null : children}</div>;
  }

  return (
    <div class="shell game-shell">
      <aside class="sidebar game-sidebar">
        <a
          class="sidebar-brand"
          href={href()}
          onClick={(e) => {
            e.preventDefault();
            go();
          }}
        >
          <div class="logo-pixel">HG</div>
          <div>
            <div class="brand-title">Home Guide</div>
            <div class="brand-sub">All your house stuff</div>
          </div>
        </a>

        {property && (
          <div class="sidebar-castle">
            <div class="sidebar-castle-name">{property.name}</div>
            <div class="sidebar-castle-meta">
              {property.rooms.length} rooms ·{' '}
              {property.items.filter((i) => i.active).length} items
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
            {theme === 'dark' ? 'Day' : 'Night'}
          </button>
          <button type="button" class="sidebar-link subtle" onClick={() => go()}>
            Title screen
          </button>
        </div>
      </aside>

      <div class="shell-main game-main">
        {loading ? (
          <div class="page loading-splash game-font">Loading…</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
