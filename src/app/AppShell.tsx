import type { ComponentChildren } from 'preact';
import { useActiveCastle } from './ActiveCastle';
import { href, go } from './paths';
import { HouseGhostBackdrop } from './HouseGhostBackdrop';

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

  // Nightwatch theme applies to the whole "inside a property" experience
  // (house view plus the glass pages layered over it), not just the house
  // view itself.
  const houseTheme =
    onHouse ||
    (Boolean(pid) &&
      (path.includes('/property') ||
        path.includes('/settings') ||
        path.includes('/import')));

  if (bare) {
    return <div class="shell-title">{loading ? null : children}</div>;
  }

  // Single persistent left sidebar for every in-app page, including the
  // house view — no more separate bottom-nav layout to keep in sync.
  return (
    <div class="shell calm-shell" data-theme={houseTheme ? 'nightwatch' : undefined}>
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
        <div class="sidebar-foot">
          <button
            type="button"
            class="theme-btn"
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            onClick={onToggleTheme}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
            <span class="sidebar-label">
              {theme === 'dark' ? 'Light' : 'Dark'}
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
            <div class="home-id-shutoffs" title="Emergency shutoffs">
              {property.shutoffs.length === 0 ? (
                <span class="muted">No shutoffs logged</span>
              ) : (
                property.shutoffs.slice(0, 4).map((sh) => (
                  <span key={sh.id} class="home-id-chip">
                    {sh.type.replace(/-/g, ' ')}
                  </span>
                ))
              )}
            </div>
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
