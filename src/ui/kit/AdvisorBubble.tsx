interface AdvisorBubbleProps {
  name?: string;
  tip?: string;
  portrait?: string;
}

export function AdvisorBubble({
  name = 'Merlin',
  tip = "The wise keep records today so they don't pay twice tomorrow.",
  portrait = '🧙',
}: AdvisorBubbleProps) {
  return (
    <aside class="kit-advisor">
      <div class="kit-advisor-portrait" aria-hidden="true">
        {portrait}
      </div>
      <div class="kit-advisor-bubble">
        <strong>{name}</strong>
        <p>{tip}</p>
        <div class="kit-advisor-actions">
          <button type="button" class="kit-btn tiny">
            Save nugget
          </button>
          <button type="button" class="kit-btn tiny ghost">
            Dismiss
          </button>
        </div>
      </div>
    </aside>
  );
}
