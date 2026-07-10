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

function categoryIcon(category?: string): string {
  const s = (category ?? '').toLowerCase();
  if (/fridge|refriger/.test(s)) return '🧊';
  if (/range|oven|stove/.test(s)) return '🔥';
  if (/wash/.test(s)) return '🫧';
  if (/dry/.test(s)) return '💨';
  if (/water|heater/.test(s)) return '💧';
  if (/furnace|hvac|ac/.test(s)) return '♨️';
  if (/tv|television/.test(s)) return '📺';
  if (/sofa|couch|furniture/.test(s)) return '🛋️';
  if (/bed/.test(s)) return '🛏️';
  if (/car|vehicle/.test(s)) return '🚗';
  if (/toilet|bath/.test(s)) return '🚽';
  return '📦';
}

export function ItemCard({
  brand,
  model,
  serial,
  installed,
  ageLabel,
  warranty = 'none',
  warrantyEnd,
  price,
  room,
  category,
  maintenanceNext,
  maintenanceDueInDays,
  docsCount = 0,
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

  const title = [brand, model].filter(Boolean).join(' ') || category || 'Item';
  const dueLabel =
    maintenanceDueInDays == null
      ? ''
      : maintenanceDueInDays < 0
        ? ` · ${Math.abs(maintenanceDueInDays)}d overdue`
        : maintenanceDueInDays === 0
          ? ' · Due today'
          : ` · Due in ${maintenanceDueInDays} days`;

  return (
    <article class="kit-item-card">
      <div class="kit-item-photo">
        {photoUrl ? (
          <img src={photoUrl} alt="" />
        ) : (
          <div class="kit-item-photo-ph" aria-hidden="true">
            {categoryIcon(category)}
          </div>
        )}
      </div>
      <div class="kit-item-body">
        <h3 class="kit-item-title">{title}</h3>
        <p class="kit-item-sub">
          {[category, room].filter(Boolean).join(' · ') || '—'}
        </p>
        <dl class="kit-item-facts">
          <div>
            <dt>Serial</dt>
            <dd class="mono">{serial || '—'}</dd>
          </div>
          <div>
            <dt>Installed</dt>
            <dd>
              {installed || '—'}
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
              {dueLabel}
            </div>
            <div class="kit-maint-track">
              <div
                class="kit-maint-fill"
                style={{
                  width: `${Math.max(
                    8,
                    Math.min(
                      100,
                      maintenanceDueInDays == null
                        ? 40
                        : maintenanceDueInDays < 0
                          ? 100
                          : 100 - Math.min(90, maintenanceDueInDays)
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
        <div class="kit-docs-strip">
          <span class="muted">Docs & photos ({docsCount})</span>
          <div class="kit-docs-thumbs">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div class="kit-item-actions">
          <button type="button" class="kit-btn primary" onClick={onView}>
            Open inventory
          </button>
          <button type="button" class="kit-btn" onClick={onEdit}>
            Close
          </button>
        </div>
      </div>
    </article>
  );
}
