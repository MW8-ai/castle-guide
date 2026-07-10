import { useEffect, useRef, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Item, Property } from '../../storage';
import { buildHouseViewModel, getRenderer, listRenderers } from '../../houseview';
import type { HouseRendererHandle } from '../../houseview';
import { useActiveCastle } from '../ActiveCastle';
import { go } from '../paths';

interface Props {
  id?: string;
}

export function HousePage({ id }: Props) {
  const { property: active, refresh: refreshActive } = useActiveCastle();
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HouseRendererHandle | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [mode, setMode] = useState('explore');
  const [hint, setHint] = useState(
    'Walk with WASD · Scroll to zoom · Click anything to open its card'
  );

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
    const mount = () => {
      if (!hostRef.current) return;
      handleRef.current?.destroy();
      const plugin = getRenderer(mode);
      handleRef.current = plugin.mount(hostRef.current, model, {
        onSelectItem: (itemId) => {
          const item = p!.items.find((i) => i.id === itemId) ?? null;
          setSelected(item);
          if (item) {
            setHint(`${item.brand} ${item.model ?? ''} — details on the right`);
          }
        },
        onSelectRoom: (roomId) => {
          const room = p!.rooms.find((r) => r.id === roomId);
          if (room) {
            setHint(`${room.name} · ${room.dims.L}' × ${room.dims.W}'`);
          }
        },
        onMovePlacement: (placementId, next) => {
          void (async () => {
            const st = await ensureStorageReady();
            await st.movePlacement(propertyId!, placementId, next);
            const updated = await st.getProperty(propertyId!);
            if (!updated) return;
            setProperty(updated);
            handleRef.current?.update(buildHouseViewModel(updated).model);
            await refreshActive();
          })();
        },
      });
    };
    requestAnimationFrame(() => requestAnimationFrame(mount));
  }

  useEffect(() => {
    void load();
    return () => {
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [propertyId, mode]);

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
          <p class="muted house-hint">{hint}</p>
        </div>
        <div class="view-modes" role="group" aria-label="Map style">
          {listRenderers().map((r) => (
            <button
              key={r.id}
              type="button"
              class={mode === r.id ? 'btn primary' : 'btn'}
              onClick={() => setMode(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <div class="house-grid">
        <div class="house-stage card">
          <div class="house-stage-label">
            {mode === 'explore'
              ? 'Walk around your home'
              : mode === 'iso'
                ? 'Bird’s-eye map'
                : listRenderers().find((r) => r.id === mode)?.label}
          </div>
          <div class="house-canvas-host" ref={hostRef} />
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
                    .map((f) => `${f.name} ${f.sizeOrModel}`)
                    .join(', ')}
                </p>
              )}
              {selected.notes && <p class="muted">{selected.notes}</p>}
              {selected.lineage.length > 0 && (
                <div class="lineage-box">
                  <strong>Replaced over time</strong>
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
              <button
                type="button"
                class="btn primary"
                onClick={() => go('property', propertyId, 'inventory')}
              >
                Edit in Inventory
              </button>
            </div>
          ) : (
            <div class="card item-panel empty-panel">
              <h2>Explore the house</h2>
              <p class="muted">
                You’re the little figure on the map. Walk into the kitchen and
                living room, click the fridge or water heater — every block is
                real data from your inventory.
              </p>
              <p class="muted">
                Scroll the mouse wheel to zoom. Use the left menu for inventory
                and to-dos.
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
