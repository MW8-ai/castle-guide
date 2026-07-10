import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Property } from '../../storage';
import {
  getCouncil,
  surfaceNuggets,
  seasonalGusNugget,
  characterName,
} from '../../council';

const base = import.meta.env.BASE_URL;

interface Props {
  id?: string;
}

export function CouncilPage({ id }: Props) {
  const [property, setProperty] = useState<Property | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      const s = await ensureStorageReady();
      if (id) setProperty(await s.getProperty(id));
      const profile = await s.getProfile();
      setOverrides(profile?.settings.characterNameOverrides ?? {});
    })();
  }, [id]);

  const surfaced = surfaceNuggets(property, overrides);
  const gus = seasonalGusNugget();

  return (
    <section class="page">
      <p class="eyebrow">
        {id ? (
          <a href={`${base}property/${id}`}>← Property</a>
        ) : (
          <a href={base}>← Home</a>
        )}
      </p>
      <h1>The Council</h1>
      <p class="muted">
        Characters deliver sourced knowledge. Rename them anytime in Settings.
      </p>

      {gus && (
        <div class="card gus-feature">
          <h2>
            {characterName('grandpa-gus', overrides)} — seasonal
          </h2>
          <p class="gus-line">“{gus.title}”</p>
          <p>{gus.body}</p>
          <p class="muted tiny">
            {gus.confidence} · as of {gus.asOfDate}
          </p>
        </div>
      )}

      <div class="card">
        <h2>Council roster</h2>
        <ul class="plain-list">
          {getCouncil().map((c) => (
            <li key={c.id}>
              <strong>{characterName(c.id, overrides)}</strong> — {c.role}
            </li>
          ))}
        </ul>
      </div>

      <div class="card">
        <h2>Nuggets for this castle</h2>
        <ul class="item-list">
          {surfaced.map(({ nugget, characterDisplay, reason }) => (
            <li key={nugget.id} class="item-card">
              <strong>
                {characterDisplay}: {nugget.title}
              </strong>
              <div class="muted">{reason}</div>
              <p>{nugget.body}</p>
              <p class="muted tiny">
                {nugget.confidence} · {nugget.asOfDate}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
