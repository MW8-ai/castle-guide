import { useEffect, useRef, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Item, Property } from '../../storage';
import { buildHouseViewModel, getRenderer } from '../../houseview';
import type { HouseRendererHandle } from '../../houseview';
import { useActiveCastle } from '../ActiveCastle';
import { go } from '../paths';

interface Props {
  id?: string;
}

/** Visual-first home map. Side panel only when something is selected. */
export function HousePage({ id }: Props) {
  const { property: active, refresh: refreshActive } = useActiveCastle();
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HouseRendererHandle | null>(null);
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

    const model = buildHouseViewModel(p).model;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!hostRef.current) return;
        handleRef.current?.destroy();
        handleRef.current = getRenderer('pixel-home').mount(
          hostRef.current,
          model,
          {
            onSelectItem: (itemId) => {
              setSelected(p!.items.find((i) => i.id === itemId) ?? null);
            },
            onSelectRoom: () => {},
            onMovePlacement: () => {},
          }
        );
      });
    });
  }

  useEffect(() => {
    void load();
    return () => {
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [propertyId]);

  if (!propertyId) {
    return (
      <section class="page">
        <button type="button" class="btn primary" onClick={() => go()}>
          Home
        </button>
      </section>
    );
  }
  if (!property) {
    return <div class="page loading-splash">Loading…</div>;
  }

  return (
    <section class={`visual-home ${selected ? 'has-panel' : ''}`}>
      <div class="visual-map-wrap">
        <div class="visual-map-bar">
          <div>
            <h1 class="visual-home-name">{property.name}</h1>
            <p class="visual-meta muted">
              {property.style ?? 'Home'} · {property.rooms.length} rooms ·{' '}
              {property.items.filter((i) => i.active).length} items · drag to pan
              · scroll to zoom · click an item
            </p>
          </div>
        </div>
        <div class="visual-map-host" ref={hostRef} />
      </div>

      {selected && (
        <aside class="visual-detail" aria-label="Item details">
          <div class="visual-detail-head">
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
          <p class="muted cap">{selected.category.replace(/-/g, ' ')}</p>
          <dl class="detail-dl">
            <div>
              <dt>Serial</dt>
              <dd>{selected.serial ?? '—'}</dd>
            </div>
            <div>
              <dt>Installed</dt>
              <dd>{selected.purchaseDate ?? '—'}</dd>
            </div>
            <div>
              <dt>Warranty</dt>
              <dd>{selected.warrantyEnd ?? '—'}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>
                {selected.price != null
                  ? `$${selected.price.toLocaleString()}`
                  : '—'}
              </dd>
            </div>
            {selected.filterSpecs[0] && (
              <div>
                <dt>Part / filter</dt>
                <dd>{selected.filterSpecs[0].sizeOrModel}</dd>
              </div>
            )}
          </dl>
          {selected.notes && <p class="muted">{selected.notes}</p>}
          <button
            type="button"
            class="btn"
            onClick={() => go('property', propertyId, 'inventory')}
          >
            Edit in inventory
          </button>
        </aside>
      )}
    </section>
  );
}
