import type { ComponentChildren } from 'preact';

interface Props {
  open?: boolean;
  title?: string;
  children?: ComponentChildren;
  onClose?: () => void;
}

export function ContextDock({
  open = true,
  title = 'Details',
  children,
  onClose,
}: Props) {
  if (!open) return null;
  return (
    <aside class="kit-dock" aria-label={title}>
      <header class="kit-dock-head">
        <h2>{title}</h2>
        <button type="button" class="kit-icon-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>
      <div class="kit-dock-body">{children}</div>
    </aside>
  );
}
