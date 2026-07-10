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
  { id: 'house', label: 'Home', segment: 'house', icon: '🏠' },
  { id: 'inventory', label: 'Inventory', segment: 'inventory', icon: '📦' },
  { id: 'maintain', label: 'Maintenance', segment: 'maintain', icon: '🔧' },
  { id: 'money', label: 'Money', segment: 'money', icon: '💵' },
  { id: 'area', label: 'Area', segment: 'area', icon: '📍' },
  { id: 'council', label: 'Tips', segment: 'council', icon: '💬' },
  { id: 'builders', label: 'Projects', segment: 'builders', icon: '🛠️' },
  { id: 'settings', label: 'Settings', segment: 'settings', icon: '⚙️' },
];

export function AppShell({ children, theme, onToggleTheme, path = '' }: Props) {
  const { property, loading } = useActiveCastle();
  const pid = property?.id;

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

  if (bare) {
    return <div class="shell-title">{loading ? null : children}</div>;
  }

  // House: full map + bottom label bar (does not cover playable center)
  if (onHouse) {
    return (
      <div class="shell house-bleed-v2">
        <div class="shell-main bleed">
          {loading ? (
            <div class="page loading-splash">Loading…</div>
          ) : (
            children
          )}
        </div>
        <nav class="map-bottom-nav" aria-label="Main">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              class={
                isActive(item.segment)
                  ? 'map-nav-btn active'
                  : 'map-nav-btn'
              }
              disabled={!pid && item.segment !== 'settings'}
              onClick={() => navTo(item.segment)}
            >
              <span class="map-nav-ico" aria-hidden="true">
                {item.icon}
              </span>
              <span class="map-nav-label">{item.label}</span>
            </button>
          ))}
          <button
            type="button"
            class="map-nav-btn"
            onClick={onToggleTheme}
          >
            <span class="map-nav-ico" aria-hidden="true">
              {theme === 'dark' ? '☀' : '☾'}
            </span>
            <span class="map-nav-label">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
        </nav>
      </div>
    );
  }

  return (
    <div class="shell calm-shell">
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
          <div>
            <div class="brand-title">Home Guide</div>
            {property && <div class="brand-sub">{property.name}</div>}
          </div>
        </a>

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
            </button>
          ))}
        </nav>

        <div class="sidebar-foot">
          <button type="button" class="theme-btn" onClick={onToggleTheme}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </aside>

      <div class="shell-main">
        {loading ? (
          <div class="page loading-splash">Loading…</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
