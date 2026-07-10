interface Props {
  floors?: string[];
  active?: string;
  onChange?: (floor: string) => void;
}

export function FloorTabs({
  floors = ['1F', '2F', 'Basement', 'Yard'],
  active = '1F',
  onChange,
}: Props) {
  return (
    <div class="kit-floor-tabs" role="tablist" aria-label="Floors">
      {floors.map((f) => (
        <button
          key={f}
          type="button"
          role="tab"
          aria-selected={f === active}
          class={f === active ? 'active' : ''}
          onClick={() => onChange?.(f)}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
