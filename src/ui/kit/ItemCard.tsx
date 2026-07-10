export type WarrantyState = 'active' | 'expiring' | 'expired' | 'none';

export interface ItemCardProps {
  brand?: string;
  model?: string;
  serial?: string | null;
  installed?: string | null;
  ageLabel?: string;
  warranty?: WarrantyState;
  warrantyEnd?: string | null;
  price?: number | null;
  room?: string;
  category?: string;
  maintenanceNext?: string | null;
  maintenanceDueInDays?: number | null;
  docsCount?: number;
  photoUrl?: string | null;
  onView?: () => void;
  onEdit?: () => void;
}

export function ItemCard({
  brand = 'LG',
  model = 'LRFCS2503S',
  serial = '803KWT0A1234',
  installed = '2021-05-12',
  ageLabel = '4 years',
  warranty = 'active',
  warrantyEnd = '2026-05-12',
  price = 1899,
  room = 'Kitchen',
  category = 'Refrigerator',
  maintenanceNext = 'Clean filter',
  maintenanceDueInDays = 23,
  docsCount = 3,
  photoUrl,
  onView,
  onEdit,
}: ItemCardProps) {
  const warrantyLabel =
    warranty === 'active'
      ? 'Active'
      : warranty === 'expiring'
        ? 'Expiring'
        : warranty === 'expired'
          ? 'Expired'
          : 'Unknown';

  return (
    <article class="kit-item-card">
      <div class="kit-item-photo">
        {photoUrl ? (
          <img src={photoUrl} alt="" />
        ) : (
          <div class="kit-item-photo-ph" aria-hidden="true">
            🧊
          </div>
        )}
      </div>
      <div class="kit-item-body">
        <h3 class="kit-item-title">
          {brand} {model}
        </h3>
        <p class="kit-item-sub">
          {category} · {room}
        </p>
        <dl class="kit-item-facts">
          <div>
            <dt>Serial</dt>
            <dd class="mono">{serial ?? '—'}</dd>
          </div>
          <div>
            <dt>Installed</dt>
            <dd>
              {installed ?? '—'}
              {ageLabel ? ` · ${ageLabel}` : ''}
            </dd>
          </div>
          <div>
            <dt>Warranty</dt>
            <dd>
              <span class={`kit-pill warranty-${warranty}`}>
                {warrantyLabel}
              </span>
              {warrantyEnd ? ` until ${warrantyEnd}` : ''}
            </dd>
          </div>
          <div>
            <dt>Purchase</dt>
            <dd class="mono">
              {price != null ? `$${price.toLocaleString()}` : '—'}
            </dd>
          </div>
        </dl>
        {maintenanceNext && (
          <div class="kit-maint-bar">
            <div class="kit-maint-label">
              Next: {maintenanceNext}
              {maintenanceDueInDays != null && (
                <span> · Due in {maintenanceDueInDays} days</span>
              )}
            </div>
            <div class="kit-maint-track">
              <div
                class="kit-maint-fill"
                style={{
                  width: `${Math.max(8, 100 - (maintenanceDueInDays ?? 30))}%`,
                }}
              />
            </div>
          </div>
        )}
        <div class="kit-docs-strip">
          <span class="muted">Docs ({docsCount})</span>
          <div class="kit-docs-thumbs">
            <span /><span /><span />
          </div>
        </div>
        <div class="kit-item-actions">
          <button type="button" class="kit-btn primary" onClick={onView}>
            View details
          </button>
          <button type="button" class="kit-btn" onClick={onEdit}>
            Edit
          </button>
        </div>
      </div>
    </article>
  );
}
