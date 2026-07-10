import type { ComponentChildren } from 'preact';
import { useActiveCastle } from './ActiveCastle';
import { href, go } from './paths';

interface Props {
  children: ComponentChildren;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  path?: string;
}

/** Calm nav — not a game menu. Visual is the product. */
const NAV: { id: string; label: string; segment: string }[] = [
  { id: 'house', label: 'Home', segment: 'house' },
  { id: 'inventory', label: 'Inventory', segment: 'inventory' },
  { id: 'maintain', label: 'Maintenance', segment: 'maintain' },
  { id: 'money', label: 'Money', segment: 'money' },
  { id: 'area', label: 'Area', segment: 'area' },
  { id: 'council', label: 'Tips', segment: 'council' },
  { id: 'builders', label: 'Projects', segment: 'builders' },
  { id: 'settings', label: 'Settings', segment: 'settings' },
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

  // House view = full-bleed (map is the product); thin icon rail only
  const onHouse =
    path.includes('/house') || /\/property\/[^/]+\/?$/.test(path);

  if (bare) {
    return <div class="shell-title">{loading ? null : children}</div>;
  }

  if (onHouse) {
    return (
      <div class="shell house-bleed">
        <nav class="icon-rail" aria-label="Main">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.label}
              class={
                isActive(item.segment) ? 'icon-rail-btn active' : 'icon-rail-btn'
              }
              disabled={!pid && item.segment !== 'settings'}
              onClick={() => navTo(item.segment)}
            >
              {item.label.slice(0, 1)}
            </button>
          ))}
          <button
            type="button"
            class="icon-rail-btn"
            title="Theme"
            onClick={onToggleTheme}
          >
            ◐
          </button>
        </nav>
        <div class="shell-main bleed">
          {loading ? (
            <div class="page loading-splash">Loading…</div>
          ) : (
            children
          )}
        </div>
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
