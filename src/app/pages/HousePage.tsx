import { useEffect, useRef, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Item, Property } from '../../storage';
import {
  buildHouseViewModel,
  computeSerenity,
  serenityLabel,
  getRenderer,
} from '../../houseview';
import type { HouseRendererHandle } from '../../houseview';
import { SerenityMeter } from '../../ui/SerenityMeter';
import { useActiveCastle } from '../ActiveCastle';
import { go } from '../paths';
import { surfaceNuggets } from '../../council';

interface Props {
  id?: string;
}

export function HousePage({ id }: Props) {
  const { property: active, refresh: refreshActive } = useActiveCastle();
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HouseRendererHandle | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [hint, setHint] = useState(
    'Click an appliance for details · Drag to move · Use the left menu for Inventory'
  );

  const propertyId = id || active?.id;

  async function load(selectItemId?: string | null) {
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

    if (selectItemId) {
      setSelected(p.items.find((i) => i.id === selectItemId) ?? null);
    }

    const profile = await s.getProfile();
    const surfaced = surfaceNuggets(p, profile?.settings.characterNameOverrides);
    const gus = surfaced.find((x) => x.nugget.character === 'grandpa-gus');
    if (gus) {
      setHint(`${gus.characterDisplay}: ${gus.nugget.title}`);
    }

    const model = buildHouseViewModel(p).model;
    const mount = () => {
      if (!hostRef.current) return;
      handleRef.current?.destroy();
      const plugin = getRenderer('iso');
      handleRef.current = plugin.mount(hostRef.current, model, {
        onSelectItem: (itemId) => {
          const item = p!.items.find((i) => i.id === itemId) ?? null;
          setSelected(item);
        },
        onSelectRoom: (roomId) => {
          const room = p!.rooms.find((r) => r.id === roomId);
          if (room) setHint(`Room: ${room.name} · ${room.dims.L}'×${room.dims.W}'`);
        },
        onMovePlacement: (placementId, next) => {
          void (async () => {
            const st = await ensureStorageReady();
            await st.movePlacement(propertyId!, placementId, next);
            // Soft refresh without full remount thrash
            const updated = await st.getProperty(propertyId!);
            if (!updated) return;
            setProperty(updated);
            const m = buildHouseViewModel(updated).model;
            handleRef.current?.update(m);
            await refreshActive();
          })();
        },
      });
    };

    // Double rAF so layout has size for centering
    requestAnimationFrame(() => requestAnimationFrame(mount));
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
        <p>No castle selected.</p>
        <button type="button" class="btn primary" onClick={() => go()}>
          Go home
        </button>
      </section>
    );
  }

  if (!property) {
    return <div class="page loading-splash">Loading house…</div>;
  }

  const score = computeSerenity(property);
  const upcoming = property.tasks
    .filter((t) => t.status === 'pending')
    .slice(0, 4);

  return (
    <section class="house-workspace">
      <header class="house-top">
        <div>
          <h1>{property.name}</h1>
          <p class="muted house-hint">{hint}</p>
        </div>
        <div class="house-top-actions">
          <button
            type="button"
            class="btn"
            onClick={() => go('property', propertyId, 'inventory')}
          >
            + Add item
          </button>
          <button
            type="button"
            class="btn primary"
            onClick={() => go('property', propertyId, 'maintain')}
          >
            Maintenance
          </button>
        </div>
      </header>

      <div class="house-grid">
        <div class="house-stage card">
          <div class="house-stage-label">Castle View</div>
          <div class="house-canvas-host" ref={hostRef} />
          <div class="house-legend">
            <span>
              <i class="dot ok" /> Healthy
            </span>
            <span>
              <i class="dot due" /> Due soon
            </span>
            <span>
              <i class="dot overdue" /> Overdue
            </span>
          </div>
        </div>

        <aside class="house-side">
          <SerenityMeter score={score} label={serenityLabel(score)} />

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
              <p class="item-cat">{selected.category}</p>
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
              </dl>
              {selected.lineage.length > 0 && (
                <div class="lineage-box">
                  <strong>History</strong>
                  <ol>
                    {selected.lineage.map((L, i) => (
                      <li key={i}>
                        {L.snapshot.brand} {L.snapshot.model} ({L.activeFrom} →{' '}
                        {L.activeTo})
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {selected.notes && <p class="muted">{selected.notes}</p>}
              <div class="btn-row">
                <button
                  type="button"
                  class="btn primary"
                  onClick={() => go('property', propertyId, 'inventory')}
                >
                  Open in Inventory
                </button>
              </div>
            </div>
          ) : (
            <div class="card item-panel empty-panel">
              <h2>Nothing selected</h2>
              <p class="muted">
                Click a colored block on the house (fridge, furnace, water
                heater…). That's your data — not decoration.
              </p>
            </div>
          )}

          <div class="card">
            <h3>Up next</h3>
            {upcoming.length === 0 ? (
              <p class="muted">No pending tasks.</p>
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
              All maintenance
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
