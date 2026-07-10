interface RoomCardProps {
  name?: string;
  dims?: string;
  paint?: string;
  flooring?: string;
  itemCount?: number;
}

export function RoomCard({
  name = 'Kitchen',
  dims = "14' × 16'",
  paint = 'SW 7008 Warm White',
  flooring = 'Oak hardwood',
  itemCount = 6,
}: RoomCardProps) {
  return (
    <article class="kit-room-card">
      <h3>{name}</h3>
      <p class="mono">{dims}</p>
      <div class="kit-paint-row">
        <span class="kit-paint-chip" style={{ background: '#f0ebe3' }} />
        <span>{paint}</span>
      </div>
      <p class="muted">{flooring}</p>
      <p class="kit-room-count">{itemCount} items</p>
    </article>
  );
}
