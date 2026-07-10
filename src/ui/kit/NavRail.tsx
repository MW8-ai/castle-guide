export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

interface NavRailProps {
  items: NavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  collapsed?: boolean;
}

const DEFAULT: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▣' },
  { id: 'house', label: 'House', icon: '⌂' },
  { id: 'inventory', label: 'Inventory', icon: '▤' },
  { id: 'maintain', label: 'Maintain', icon: '🔧', badge: 3 },
  { id: 'money', label: 'Money', icon: '$' },
  { id: 'protect', label: 'Protect', icon: '🛡' },
  { id: 'council', label: 'Council', icon: '👤' },
  { id: 'prompt', label: 'Prompt Pack', icon: '✦' },
];

export function NavRail({
  items = DEFAULT,
  activeId = 'house',
  onSelect,
  collapsed = false,
}: NavRailProps) {
  return (
    <nav
      class={collapsed ? 'kit-nav collapsed' : 'kit-nav'}
      aria-label="Main"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          class={
            item.id === activeId ? 'kit-nav-item active' : 'kit-nav-item'
          }
          onClick={() => onSelect?.(item.id)}
        >
          <span class="kit-nav-ico" aria-hidden="true">
            {item.icon}
          </span>
          {!collapsed && <span>{item.label}</span>}
          {item.badge != null && item.badge > 0 && (
            <span class="kit-badge">{item.badge}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
