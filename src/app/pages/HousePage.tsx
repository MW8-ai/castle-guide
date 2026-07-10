import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Item, Property } from '../../storage';
import { buildHouseViewModel } from '../../houseview';
import { ImageHouseView } from '../../houseview/imageMap/ImageHouseView';
import { useActiveCastle } from '../ActiveCastle';
import { go } from '../paths';

interface Props {
  id?: string;
}

export function HousePage({ id }: Props) {
  const { property: active, refresh: refreshActive } = useActiveCastle();
  const [property, setProperty] = useState<Property | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);

  const propertyId = id || active?.id;

  async function load() {
    if (!propertyId) return;
    const s = await ensureStorageReady();
    await s.setActiveProperty(propertyId);
    let p = await s.getProperty(propertyId);
    if (!p) return;
    const built = buildHouseViewModel(p, { ensurePlacements: true });
    if (built.placementsChanged) {
      await s.saveProperty(p);
      p = (await s.getProperty(propertyId))!;
    }
    setProperty(p);
    await refreshActive();
  }

  useEffect(() => {
    void load();
  }, [propertyId]);

  if (!propertyId) {
    return (
      <section class="page">
        <p>No home selected.</p>
        <button type="button" class="btn primary" onClick={() => go()}>
          Home
        </button>
      </section>
    );
  }

  if (!property) {
    return <div class="page loading-splash">Loading your home…</div>;
  }

  const upcoming = property.tasks
    .filter((t) => t.status === 'pending')
    .slice(0, 5);

  return (
    <section class="house-workspace">
      <header class="house-top">
        <div>
          <h1>{property.name}</h1>
          <p class="muted house-hint">
            Illustrated home — zoom in, pan around, tap a glowing pin for the
            real appliance card (brand, model, warranty).
          </p>
        </div>
      </header>

      <div class="house-grid">
        <div class="house-stage card art-stage-card">
          <div class="house-stage-label">Your home</div>
          <ImageHouseView
            items={property.items}
            houseName={property.name}
            selectedItemId={selected?.id}
            onSelectItem={setSelected}
          />
        </div>

        <aside class="house-side">
          {selected ? (
            <div class="card item-panel">
              <div class="item-panel-head">
                <h2>
                  {selected.brand} {selected.model}
                </h2>
                <button
                  type="button"
                  class="btn icon"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div class="item-hero-emoji" aria-hidden="true">
                {heroGlyph(selected)}
              </div>
              <p class="item-cat">{selected.category.replace(/-/g, ' ')}</p>
              <dl class="fact-list">
                <div>
                  <dt>Serial</dt>
                  <dd>{selected.serial ?? '—'}</dd>
                </div>
                <div>
                  <dt>Installed</dt>
                  <dd>{selected.purchaseDate ?? '—'}</dd>
                </div>
                <div>
                  <dt>Warranty until</dt>
                  <dd>{selected.warrantyEnd ?? '—'}</dd>
                </div>
                <div>
                  <dt>You paid</dt>
                  <dd>
                    {selected.price != null
                      ? `$${selected.price.toLocaleString()}`
                      : '—'}
                  </dd>
                </div>
              </dl>
              {selected.filterSpecs.length > 0 && (
                <p>
                  <strong>Parts:</strong>{' '}
                  {selected.filterSpecs
                    .map((f) => `${f.name}: ${f.sizeOrModel}`)
                    .join(' · ')}
                </p>
              )}
              {selected.notes && <p class="muted">{selected.notes}</p>}
              <button
                type="button"
                class="btn primary"
                onClick={() => go('property', propertyId, 'inventory')}
              >
                Edit in Stuff
              </button>
            </div>
          ) : (
            <div class="card item-panel empty-panel">
              <h2>Look around</h2>
              <p class="muted">
                This is a painted cutaway of the sample home — closer to a modern
                game screenshot than a spreadsheet. Pins mark things you own.
              </p>
              <p class="muted">
                Zoom until you can read the rooms, then tap the fridge or water
                heater pin.
              </p>
            </div>
          )}

          <div class="card">
            <h3>Coming up</h3>
            {upcoming.length === 0 ? (
              <p class="muted">Nothing due right now.</p>
            ) : (
              <ul class="plain-list tight">
                {upcoming.map((t) => (
                  <li key={t.id}>
                    <strong>{t.title}</strong>
                    <div class="muted">Due {t.nextDue}</div>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              class="btn"
              onClick={() => go('property', propertyId, 'maintain')}
            >
              Open to-do list
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function heroGlyph(item: Item): string {
  const c = item.category.toLowerCase();
  if (c.includes('refriger')) return '🧊';
  if (c.includes('range') || c.includes('oven')) return '🔥';
  if (c.includes('water-heater') || c.includes('water heater')) return '💧';
  if (c.includes('furnace') || c.includes('hvac')) return '🌡️';
  if (c.includes('wash')) return '👕';
  if (c.includes('dry')) return '🌀';
  if (c.includes('tv')) return '📺';
  if (c.includes('bed')) return '🛏️';
  return '📦';
}
