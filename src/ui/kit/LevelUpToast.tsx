interface Props {
  xp?: number;
  level?: number;
}

export function LevelUpToast({ xp = 15, level = 13 }: Props) {
  return (
    <div class="kit-levelup" role="status">
      <span class="kit-levelup-pip">+{xp} XP</span>
      <div class="kit-levelup-bar">
        <div style={{ width: '72%' }} />
      </div>
      <strong>Level {level} — Keeper of the Filters</strong>
    </div>
  );
}
