interface Props {
  score?: number;
  label?: string;
}

export function SerenityMeterKit({
  score = 87,
  label = "How's the serenity?",
}: Props) {
  return (
    <div
      class="kit-serenity-meter"
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div class="kit-serenity-top">
        <span>♥ {label}</span>
        <strong>{score}%</strong>
      </div>
      <div class="kit-serenity-track">
        <div style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
