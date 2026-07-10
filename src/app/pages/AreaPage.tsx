import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Property } from '../../storage';
import { getOfficialAreaLinks, getAreaLegalNotice } from '../../area';
import { getLawModules } from '../../knowledge/law';
import { Disclaimer } from '../../ui/Disclaimer';

import { go } from '../paths';

interface Props {
  id?: string;
}

export function AreaPage({ id }: Props) {
  const [property, setProperty] = useState<Property | null>(null);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const law = getLawModules();

  async function refresh() {
    if (!id) return;
    const s = await ensureStorageReady();
    setProperty(await s.getProperty(id));
  }

  useEffect(() => {
    void refresh();
  }, [id]);

  if (!id) return <p class="error-text">Missing property.</p>;
  if (!property) return <p class="muted">Loading…</p>;

  async function addSocial(e: Event) {
    e.preventDefault();
    const s = await ensureStorageReady();
    await s.addAreaLink(property!.id, {
      label: label || 'Neighborhood link',
      url,
      category: 'social',
    });
    setLabel('');
    setUrl('');
    await refresh();
  }

  return (
    <section class="page">
      <p class="eyebrow">
        <button type="button" class="btn" onClick={() => go('property', id!, 'house')}>
          ← House
        </button>
      </p>
      <h1>Neighborhood & area</h1>
      <p class="muted">
        ZIP {property.zip ?? '—'} · curated official links + your socials
      </p>

      <div class="card warning-card">
        <h2>Legal notice (always on)</h2>
        <p>{getAreaLegalNotice()}</p>
      </div>

      <div class="card">
        <h2>Official link hub</h2>
        <ul class="plain-list">
          {getOfficialAreaLinks().map((l) => (
            <li key={l.id}>
              <a href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>
              <div class="muted tiny">
                {l.category}
                {l.note ? ` · ${l.note}` : ''}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div class="card">
        <h2>Neighborhood socials</h2>
        <form class="form-grid" onSubmit={(e) => void addSocial(e)}>
          <label>
            Label
            <input
              value={label}
              onInput={(e) => setLabel((e.target as HTMLInputElement).value)}
              placeholder="HOA portal / Nextdoor / buy-nothing"
            />
          </label>
          <label>
            URL
            <input
              value={url}
              onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
              required
              type="url"
              placeholder="https://"
            />
          </label>
          <button type="submit" class="btn primary">
            Add link
          </button>
        </form>
        <ul class="plain-list">
          {property.areaLinks.map((l) => (
            <li key={l.id}>
              <a href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>{' '}
              <span class="muted">({l.category})</span>
            </li>
          ))}
        </ul>
      </div>

      <div class="card">
        <h2>Law vs Nosey Neighbor (Karen)</h2>
        {law.map((n) => (
          <article key={n.id}>
            <h3>{n.title}</h3>
            <p>{n.body}</p>
            <p class="muted tiny">
              {n.confidence} · as of {n.asOfDate} ·{' '}
              <a href={n.sources[0]?.url} target="_blank" rel="noreferrer">
                {n.sources[0]?.label ?? 'source'}
              </a>
            </p>
            <p class="muted">Verify locally — not legal advice.</p>
          </article>
        ))}
      </div>

      <Disclaimer />
    </section>
  );
}
