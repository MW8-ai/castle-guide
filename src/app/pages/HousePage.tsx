import { useEffect, useRef, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Item, Property } from '../../storage';
import {
  buildHouseViewModel,
  computeSerenity,
  serenityLabel,
  getRenderer,
  listRenderers,
} from '../../houseview';
import type { HouseRendererHandle } from '../../houseview';
import { SerenityMeter } from '../../ui/SerenityMeter';
import { surfaceNuggets } from '../../council';

const base = import.meta.env.BASE_URL;

interface Props {
  id?: string;
}

export function HousePage({ id }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HouseRendererHandle | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [rendererId, setRendererId] = useState('iso');
  const [selected, setSelected] = useState<Item | null>(null);
  const [listMode, setListMode] = useState(false);
  const [nuggetLine, setNuggetLine] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    const s = await ensureStorageReady();
    const p = await s.getProperty(id);
    if (!p) return;
    const profile = await s.getProfile();
    const rid = profile?.settings.activeRendererId ?? 'iso';
    setRendererId(rid);

    const { model, placementsChanged } = buildHouseViewModel(p, {
      ensurePlacements: true,
    });
    if (placementsChanged) {
      await s.saveProperty(p);
    }
    setProperty(await s.getProperty(id));

    const surfaced = surfaceNuggets(p, profile?.settings.characterNameOverrides);
    const gus = surfaced.find((x) => x.nugget.character === 'grandpa-gus');
    if (gus) {
      setNuggetLine(
        `${gus.characterDisplay}: "${gus.nugget.title}" — ${gus.reason}`
      );
    }

    // Mount renderer after state
    requestAnimationFrame(() => {
      if (!hostRef.current) return;
      handleRef.current?.destroy();
      const plugin = getRenderer(rid);
      handleRef.current = plugin.mount(hostRef.current, model, {
        onSelectItem: (itemId) => {
          const item = p.items.find((i) => i.id === itemId) ?? null;
          setSelected(item);
        },
        onSelectRoom: () => {
          /* list rooms in panel later */
        },
        onMovePlacement: (placementId, next) => {
          void (async () => {
            const st = await ensureStorageReady();
            await st.movePlacement(id!, placementId, next);
            await load();
          })();
        },
      });
    });
  }

  useEffect(() => {
    void load();
    return () => {
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [id]);

  async function switchRenderer(rid: string) {
    setRendererId(rid);
    const s = await ensureStorageReady();
    await s.setRendererPreference(rid);
    handleRef.current?.destroy();
    handleRef.current = null;
    await load();
  }

  if (!id) return <p class="error-text">Missing property.</p>;
  if (!property) return <p class="muted">Loading house view…</p>;

  const score = computeSerenity(property);
  const active = property.items.filter((i) => i.active && !i.softDeleted);

  return (
    <section class="page house-page">
      <p class="eyebrow">
        <a href={`${base}property/${id}`}>← {property.name}</a>
      </p>
      <h1>House view</h1>
      <SerenityMeter score={score} label={serenityLabel(score)} />
      {nuggetLine && <p class="gus-line">{nuggetLine}</p>}

      <div class="btn-row">
        {listRenderers().map((r) => (
          <button
            key={r.id}
            type="button"
            class={rendererId === r.id ? 'btn primary' : 'btn'}
            onClick={() => void switchRenderer(r.id)}
          >
            {r.label}
          </button>
        ))}
        <button
          type="button"
          class="btn"
          onClick={() => setListMode((v) => !v)}
        >
          {listMode ? 'Hide list view' : 'List view (a11y)'}
        </button>
      </div>

      {!listMode && (
        <div class="house-canvas-host" ref={hostRef} />
      )}

      {listMode && (
        <div class="card">
          <h2>List view (equivalent navigation)</h2>
          <ul class="item-list">
            {active.map((item) => (
              <li key={item.id} class="item-card">
                <button
                  type="button"
                  class="btn"
                  onClick={() => setSelected(item)}
                >
                  Open {item.brand} {item.model || item.category}
                </button>
                {item.lineage.length > 0 && (
                  <span class="muted">
                    {' '}
                    · {item.lineage.length} prior gen
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && (
        <div class="card item-detail">
          <h2>
            {selected.brand} {selected.model}
          </h2>
          <p class="muted">
            {selected.category}
            {selected.serial ? ` · ${selected.serial}` : ''}
          </p>
          {selected.lineage.length > 0 && (
            <details open>
              <summary>Lineage history</summary>
              <ol>
                {selected.lineage.map((L, i) => (
                  <li key={i}>
                    {L.snapshot.brand} {L.snapshot.model} ({L.activeFrom} →{' '}
                    {L.activeTo})
                  </li>
                ))}
              </ol>
            </details>
          )}
          <a class="btn" href={`${base}property/${id}`}>
            Open full catalog card
          </a>
        </div>
      )}
    </section>
  );
}
