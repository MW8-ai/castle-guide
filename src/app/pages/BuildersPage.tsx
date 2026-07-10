import { useState } from 'preact/hooks';
import {
  getBuilderTemplates,
  tierEstimate,
  type BuilderTemplate,
} from '../../builders';

const base = import.meta.env.BASE_URL;

interface Props {
  id?: string;
}

export function BuildersPage({ id }: Props) {
  const templates = getBuilderTemplates();
  const [active, setActive] = useState<BuilderTemplate>(templates[0]);
  const [tierName, setTierName] = useState('Glory');
  const [dreamItems, setDreamItems] = useState<
    { name: string; cost: number }[]
  >([]);
  const [dreamName, setDreamName] = useState('');
  const [dreamCost, setDreamCost] = useState('');

  const tier =
    active.tiers.find((t) => t.name === tierName) ?? active.tiers[0];
  const est = tierEstimate(tier);
  const dreamTotal = dreamItems.reduce((s, i) => s + i.cost, 0);

  return (
    <section class="page">
      <p class="eyebrow">
        {id ? (
          <a href={`${base}property/${id}`}>← Property</a>
        ) : (
          <a href={base}>← Home</a>
        )}
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
        <p class="muted empty-vibe">it's the vibe of it</p>
        <form
          class="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            setDreamItems((prev) => [
              ...prev,
              { name: dreamName, cost: Number(dreamCost) || 0 },
            ]);
            setDreamName('');
            setDreamCost('');
          }}
        >
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
          {dreamItems.map((d, i) => (
            <li key={i}>
              {d.name} — ${d.cost.toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
