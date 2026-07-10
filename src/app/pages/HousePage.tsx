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
          Title screen
        </button>
      </section>
    );
  }
  if (!property) {
    return <div class="page loading-splash game-font">Loading home…</div>;
  }

  const quests = property.tasks.filter((t) => t.status === 'pending').slice(0, 4);
  const itemCount = property.items.filter((i) => i.active).length;

  return (
    <section class="game-home">
      <header class="game-home-bar">
        <div>
          <div class="game-kicker">YOUR HOME</div>
          <h1 class="game-title">{property.name}</h1>
        </div>
        <div class="game-stats">
          <div class="stat-pill">
            <span>Rooms</span>
            <strong>{property.rooms.length}</strong>
          </div>
          <div class="stat-pill">
            <span>Stuff</span>
            <strong>{itemCount}</strong>
          </div>
          <div class="stat-pill warn">
            <span>To-dos</span>
            <strong>{quests.length}</strong>
          </div>
        </div>
      </header>

      <div class="game-home-grid">
        <div class="game-map-frame">
          <div class="game-map-title">⌂ House map · click furniture</div>
          <div class="game-map-host" ref={hostRef} />
        </div>

        <aside class="game-side">
          {selected ? (
            <div class="game-card item-card-game">
              <div class="game-card-head">
                <h2>
                  {selected.brand}
                  <br />
                  <span class="model">{selected.model}</span>
                </h2>
                <button
                  type="button"
                  class="btn icon"
                  onClick={() => setSelected(null)}
                >
                  ✕
                </button>
              </div>
              <div class="item-big-icon">{glyph(selected)}</div>
              <div class="pixel-facts">
                <div>
                  <span>TYPE</span>
                  {selected.category.replace(/-/g, ' ')}
                </div>
                <div>
                  <span>SERIAL</span>
                  {selected.serial ?? '—'}
                </div>
                <div>
                  <span>INSTALLED</span>
                  {selected.purchaseDate ?? '—'}
                </div>
                <div>
                  <span>WARRANTY</span>
                  {selected.warrantyEnd ?? '—'}
                </div>
                <div>
                  <span>COST</span>
                  {selected.price != null
                    ? `$${selected.price.toLocaleString()}`
                    : '—'}
                </div>
              </div>
              {selected.filterSpecs[0] && (
                <p class="part-callout">
                  Filter / part: <strong>{selected.filterSpecs[0].sizeOrModel}</strong>
                </p>
              )}
              {selected.notes && <p class="muted">{selected.notes}</p>}
              <button
                type="button"
                class="btn primary block"
                onClick={() => go('property', propertyId, 'inventory')}
              >
                Open in Stuff bag
              </button>
            </div>
          ) : (
            <div class="game-card">
              <h2>Welcome home</h2>
              <p class="muted">
                This is a <strong>filled demo</strong> so you can see the best
                case. Drag the map, scroll to zoom, click the fridge or water
                heater.
              </p>
              <p class="muted">
                Left menu: <strong>Stuff</strong> (inventory),{' '}
                <strong>To-dos</strong> (maintenance).
              </p>
            </div>
          )}

          <div class="game-card quest-card">
            <h3>★ Quest board</h3>
            {quests.length === 0 ? (
              <p class="muted">All clear for now.</p>
            ) : (
              <ul class="quest-list">
                {quests.map((t) => (
                  <li key={t.id}>
                    <span class="quest-mark">!</span>
                    <div>
                      <strong>{t.title}</strong>
                      <div class="muted">Due {t.nextDue}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              class="btn block"
              onClick={() => go('property', propertyId, 'maintain')}
            >
              Full quest list
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function glyph(item: Item): string {
  const c = item.category.toLowerCase();
  if (c.includes('refriger')) return '🧊';
  if (c.includes('range')) return '🔥';
  if (c.includes('water')) return '💧';
  if (c.includes('furnace')) return '🌡️';
  if (c.includes('wash')) return '👕';
  if (c.includes('dry')) return '🌀';
  if (c.includes('tv')) return '📺';
  if (c.includes('bed')) return '🛏️';
  if (c.includes('sofa') || c.includes('furniture')) return '🛋️';
  return '📦';
}
