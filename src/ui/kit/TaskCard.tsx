interface TaskCardProps {
  title?: string;
  dueInDays?: number;
  difficulty?: number;
  diyCost?: number | null;
  proCost?: number | null;
  whenNotToDiy?: boolean;
  onComplete?: () => void;
}

export function TaskCard({
  title = 'Change HVAC filter',
  dueInDays = 12,
  difficulty = 1,
  diyCost = 15,
  proCost = 80,
  whenNotToDiy = false,
  onComplete,
}: TaskCardProps) {
  return (
    <article class={whenNotToDiy ? 'kit-task-card danger' : 'kit-task-card'}>
      {whenNotToDiy && <div class="kit-danger-stripe">When NOT to DIY</div>}
      <div class="kit-task-main">
        <div class="kit-due-ring" title={`Due in ${dueInDays} days`}>
          {dueInDays}d
        </div>
        <div>
          <h3>{title}</h3>
          <p class="muted">
            {'🔧'.repeat(Math.min(5, Math.max(1, difficulty)))} · DIY $
            {diyCost ?? '—'} / pro ${proCost ?? '—'}
          </p>
        </div>
      </div>
      <button type="button" class="kit-btn primary" onClick={onComplete}>
        Mark done
      </button>
    </article>
  );
}
