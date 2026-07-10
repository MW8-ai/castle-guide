interface Props {
  label?: string;
  xp?: number;
  onClick?: () => void;
}

export function QuestChip({
  label = 'Serial number missing — snap the label',
  xp = 15,
  onClick,
}: Props) {
  return (
    <button type="button" class="kit-quest-chip" onClick={onClick}>
      <span class="kit-quest-bang">!</span>
      <span>{label}</span>
      <span class="kit-quest-xp">+{xp} XP</span>
    </button>
  );
}
