import { useEffect, useState } from 'preact/hooks';
import {
  getBuilderTemplates,
  tierEstimate,
  type BuilderTemplate,
} from '../../builders';
import { buildListCost } from '../../houseview';
import { ensureStorageReady } from '../storageContext';
import type { Property } from '../../storage';
import { go } from '../paths';
import '../../ui/kit/kit.css';

interface Props {
  id?: string;
}

export function BuildersPage({ id }: Props) {
  const templates = getBuilderTemplates();
  const [active, setActive] = useState<BuilderTemplate>(templates[0]);
  const [tierName, setTierName] = useState('Glory');
  const [property, setProperty] = useState<Property | null>(null);
  const [dreamName, setDreamName] = useState('');
  const [dreamCost, setDreamCost] = useState('');

  async function load() {
    if (!id) return;
    const s = await ensureStorageReady();
    setProperty(await s.getProperty(id));
  }

  useEffect(() => {
    void load();
  }, [id]);

  const tier =
    active.tiers.find((t) => t.name === tierName) ?? active.tiers[0];
  const est = tierEstimate(tier);
  const dreamItems = property?.notes.filter((n) => n.someday) ?? [];
  const dreamTotal = property ? buildListCost(property) : 0;

  async function addDreamItem(e: Event) {
    e.preventDefault();
    if (!id) return;
    const s = await ensureStorageReady();
    await s.addNote(id, dreamName, {
      title: dreamName,
      someday: true,
      roughBudget: Number(dreamCost) || null,
    });
    setDreamName('');
    setDreamCost('');
    await load();
  }

  async function removeDreamItem(noteId: string) {
    if (!id) return;
    const s = await ensureStorageReady();
    const p = await s.getProperty(id);
    if (!p) return;
    p.notes = p.notes.filter((n) => n.id !== noteId);
    await s.saveProperty(p);
    await load();
  }

  return (
    <section class="page">
      <p class="eyebrow">
        <button
          type="button"
          class="btn"
          onClick={() => (id ? go('property', id, 'house') : go())}
        >
          ← Back
        </button>
      </p>
      <h1>Builders (The Colonel)</h1>
      <p class="muted">
        Real-ish ranges · {active.confidence} · as of {active.asOfDate}.{' '}
        {active.regionNote}
      </p>

      <div class="btn-row">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            class={active.id === t.id ? 'btn primary' : 'btn'}
            onClick={() => {
              setActive(t);
              setTierName(t.tiers[t.tiers.length - 1]?.name ?? 'Budget');
            }}
          >
            {t.title}
          </button>
        ))}
      </div>

      <div class="card">
        <h2>{active.title}</h2>
        <div class="btn-row">
          {active.tiers.map((t) => (
            <button
              key={t.name}
              type="button"
              class={tier.name === t.name ? 'btn primary' : 'btn'}
              onClick={() => setTierName(t.name)}
            >
              {t.name}
            </button>
          ))}
        </div>
        <p class="ok-text">
          <strong>{tier.name} tier estimate:</strong> $
          {est.low.toLocaleString()} – ${est.high.toLocaleString()} {active.currency}
        </p>
        <table class="data-table">
          <thead>
            <tr>
              <th>Line item</th>
              <th>Low</th>
              <th>High</th>
            </tr>
          </thead>
          <tbody>
            {tier.lineItems.map((li) => (
              <tr key={li.item}>
                <td>{li.item}</td>
                <td>${li.low.toLocaleString()}</td>
                <td>${li.high.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>Considerations</h3>
        <ul>
          {tier.considerations.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      <div class="card">
        <h2>Dream Home planner</h2>
        <p class="muted empty-vibe">
          Someday projects — feeds the "Build list" total on the house map.
        </p>
        <form class="form-grid" onSubmit={(e) => void addDreamItem(e)}>
          <label>
            Wishlist item
            <input
              value={dreamName}
              onInput={(e) => setDreamName((e.target as HTMLInputElement).value)}
              required
            />
          </label>
          <label>
            Cost tag
            <input
              type="number"
              min="0"
              value={dreamCost}
              onInput={(e) => setDreamCost((e.target as HTMLInputElement).value)}
              required
            />
          </label>
          <button type="submit" class="btn primary">
            Add to dream board
          </button>
        </form>
        <p>
          Distance to dream: <strong>${dreamTotal.toLocaleString()}</strong>
        </p>
        <ul class="plain-list">
          {dreamItems.map((d) => (
            <li key={d.id}>
              {d.title || d.body}
              {d.roughBudget != null ? ` — $${d.roughBudget.toLocaleString()}` : ''}
              <button
                type="button"
                class="kit-icon-btn"
                aria-label="Remove"
                onClick={() => void removeDreamItem(d.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
