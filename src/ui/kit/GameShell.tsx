import type { ComponentChildren } from 'preact';
import { HudBar } from './HudBar';
import { NavRail } from './NavRail';
import { StatPanel } from './StatPanel';

interface Props {
  children?: ComponentChildren;
  dock?: ComponentChildren;
  activeNav?: string;
  castleName?: string;
}

/** Persistent game frame — bible §3. Nothing should render outside this. */
export function GameShell({
  children,
  dock,
  activeNav = 'house',
  castleName = 'Sample Home',
}: Props) {
  return (
    <div class="kit-game-shell">
      <HudBar castleName={castleName} />
      <div class="kit-game-body">
        <NavRail activeId={activeNav} />
        <main class="kit-game-stage">{children}</main>
        {dock}
      </div>
      <div class="kit-quick-bar">
        <button type="button" class="kit-btn primary">
          ＋ Add item
        </button>
        <button type="button" class="kit-btn">
          📷 Walkthrough
        </button>
        <button type="button" class="kit-btn">
          🏆 Pool Room
        </button>
      </div>
      <StatPanel />
    </div>
  );
}
