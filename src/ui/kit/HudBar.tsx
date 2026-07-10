interface HudBarProps {
  castleName?: string;
  level?: number;
  xp?: number;
  xpMax?: number;
  serenity?: number;
  bellCount?: number;
  dateLabel?: string;
}

export function HudBar({
  castleName = 'Sample Home',
  level = 12,
  xp = 2340,
  xpMax = 3000,
  serenity = 87,
  bellCount = 3,
  dateLabel = 'May 17',
}: HudBarProps) {
  const pct = Math.round((xp / xpMax) * 100);
  return (
    <header class="kit-hud" role="banner">
      <div class="kit-hud-left">
        <button type="button" class="kit-castle-name">
          🏰 {castleName} ▾
        </button>
        <div class="kit-level" title="Castle level">
          <span class="kit-level-ring">Lv {level}</span>
          <div class="kit-xp-track" aria-hidden="true">
            <div class="kit-xp-fill" style={{ width: `${pct}%` }} />
          </div>
          <span class="kit-xp-label">
            {xp.toLocaleString()} / {xpMax.toLocaleString()} XP
          </span>
        </div>
      </div>
      <div class="kit-hud-right">
        <div class="kit-serenity" title="How's the serenity?">
          <span aria-hidden="true">♥</span>
          <span>Serenity {serenity}%</span>
          <div class="kit-serenity-bar">
            <div style={{ width: `${serenity}%` }} />
          </div>
        </div>
        <span class="kit-date">{dateLabel}</span>
        <button type="button" class="kit-icon-btn" aria-label="Notifications">
          🔔
          {bellCount > 0 && <span class="kit-badge">{bellCount}</span>}
        </button>
        <button type="button" class="kit-icon-btn" aria-label="Settings">
          ⚙
        </button>
      </div>
    </header>
  );
}
