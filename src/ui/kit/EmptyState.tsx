interface Props {
  title?: string;
  body?: string;
  cta?: string;
  onCta?: () => void;
}

export function EmptyState({
  title = "It's the vibe of it",
  body = 'Add your first appliance — photo, name, room, category. Everything else can wait.',
  cta = 'Add first item',
  onCta,
}: Props) {
  return (
    <div class="kit-empty">
      <div class="kit-empty-art" aria-hidden="true">
        🏠
      </div>
      <h3>{title}</h3>
      <p class="muted">{body}</p>
      <button type="button" class="kit-btn primary" onClick={onCta}>
        {cta}
      </button>
    </div>
  );
}
