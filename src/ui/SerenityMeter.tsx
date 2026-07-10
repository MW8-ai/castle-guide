interface SerenityMeterProps {
  /** 0–100 home-health score (computed later from tasks / risks) */
  score: number;
  label?: string;
}

export function SerenityMeter({
  score,
  label = "How's the serenity?",
}: SerenityMeterProps) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div class="serenity" role="meter" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div class="serenity-head">
        <span class="serenity-label">{label}</span>
        <span class="serenity-score">{clamped}</span>
      </div>
      <div class="serenity-track">
        <div class="serenity-fill" style={{ width: `${clamped}%` }} />
      </div>
      <p class="serenity-hint muted">
        Placeholder score for Phase 0. Later: overdue tasks, warranty risk, and
        shutoff completeness.
      </p>
    </div>
  );
}
