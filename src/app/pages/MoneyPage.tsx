import { useEffect, useMemo, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import type { Property, Quote } from '../../storage';
import {
  getCostLibrary,
  getRebates,
  getRebateByCode,
  amortize,
  sumBasisEligible,
  sumAllImprovements,
  BASIS_EXPLAINER,
  type CostEntry,
} from '../../money';
import {
  activeWarranties,
  getInsuranceGotchas,
} from '../../protect';
import { Disclaimer } from '../../ui/Disclaimer';

import { go } from '../paths';

interface Props {
  id?: string;
}

export function MoneyPage({ id }: Props) {
  const [property, setProperty] = useState<Property | null>(null);
  const [tab, setTab] = useState<
    'costs' | 'rebates' | 'dale' | 'ledger' | 'payoff' | 'protect'
  >('costs');
  const [message, setMessage] = useState<string | null>(null);
  const costs = useMemo(() => getCostLibrary(), []);
  const rebates = useMemo(() => getRebates(), []);
  const credit25c = useMemo(() => getRebateByCode('25C'), []);

  // Dale form
  const [job, setJob] = useState('Asphalt shingle roof replacement');
  const [vendor, setVendor] = useState('Mate Roofer');
  const [amount, setAmount] = useState('45000');
  const [scope, setScope] = useState('Misc repairs as needed, allowance for various items');
  const [lastQuote, setLastQuote] = useState<Quote | null>(null);

  // Ledger form
  const [impDesc, setImpDesc] = useState('');
  const [impCost, setImpCost] = useState('');
  const [impDate, setImpDate] = useState(new Date().toISOString().slice(0, 10));

  // Payoff form
  const [principal, setPrincipal] = useState('280000');
  const [rate, setRate] = useState('6.5');
  const [term, setTerm] = useState('360');
  const [extra, setExtra] = useState('200');
  const [homeValue, setHomeValue] = useState('');

  async function refresh() {
    if (!id) return;
    const s = await ensureStorageReady();
    setProperty(await s.getProperty(id));
  }

  useEffect(() => {
    void refresh();
  }, [id]);

  // Load saved mortgage terms into the payoff form once per property.
  useEffect(() => {
    const m = property?.mortgage;
    if (!m) return;
    setPrincipal(String(m.principal));
    setRate(String(m.annualRatePercent));
    setTerm(String(m.termMonths));
    setExtra(String(m.extraMonthly ?? 0));
    setHomeValue(m.homeValue != null ? String(m.homeValue) : '');
  }, [property?.id]);

  if (!id) return <p class="error-text">Missing property id.</p>;
  if (!property) return <p class="muted">Loading…</p>;

  const basisTotal = sumBasisEligible(property.improvements);
  const allImp = sumAllImprovements(property.improvements);
  const warranties = activeWarranties(property.items);
  const payoff = amortize({
    principal: Number(principal) || 0,
    annualRatePercent: Number(rate) || 0,
    termMonths: Number(term) || 360,
    extraMonthly: Number(extra) || 0,
  });

  async function submitQuote(e: Event) {
    e.preventDefault();
    const s = await ensureStorageReady();
    const q = await s.addQuote(property!.id, {
      job,
      vendor,
      amount: Number(amount) || 0,
      date: new Date().toISOString().slice(0, 10),
      scopeNotes: scope,
      lineItems: [
        {
          id: 'li1',
          description: scope || job,
          amount: Number(amount) || 0,
        },
      ],
      costEntryId: 'cost-roof-asphalt-replace',
    });
    setLastQuote(q);
    setMessage(
      q.daleVerdict === 'dreamin'
        ? `Dale: "Tell him he's dreamin'."`
        : `Dale verdict: ${q.daleVerdict}`
    );
    await refresh();
  }

  async function submitImprovement(e: Event) {
    e.preventDefault();
    const s = await ensureStorageReady();
    await s.addImprovement(property!.id, {
      date: impDate,
      desc: impDesc,
      cost: Number(impCost) || 0,
      basisEligible: true,
    });
    setImpDesc('');
    setImpCost('');
    setMessage('Improvement logged.');
    await refresh();
  }

  async function saveMortgage(e: Event) {
    e.preventDefault();
    const s = await ensureStorageReady();
    await s.setMortgage(property!.id, {
      principal: Number(principal) || 0,
      annualRatePercent: Number(rate) || 0,
      termMonths: Number(term) || 360,
      extraMonthly: Number(extra) || 0,
      homeValue: homeValue.trim() ? Number(homeValue) : null,
    });
    setMessage('Mortgage terms saved.');
    await refresh();
  }

  async function downloadInsurance() {
    const s = await ensureStorageReady();
    const blob = await s.exportInsurancePacket(property!.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${property!.name.replace(/\s+/g, '-').toLowerCase()}-insurance-packet.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Insurance readiness packet downloaded.');
  }

  return (
    <section class="page">
      <p class="eyebrow">
        <button type="button" class="btn" onClick={() => go('property', id!, 'house')}>
          ← House
        </button>
      </p>
      <h1>Money & Protection</h1>
      <p class="muted">
        Sourced costs and credits. Characters joke; these tables don't.
      </p>

      {message && <p class="ok-text">{message}</p>}

      <nav class="tabs">
        {(
          [
            ['costs', 'Cost library'],
            ['rebates', 'Rebates'],
            ['dale', "Dale's Desk"],
            ['ledger', 'Improvements'],
            ['payoff', 'Payoff'],
            ['protect', 'Protect'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            class={tab === k ? 'tab active' : 'tab'}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'costs' && (
        <div class="card">
          <h2>Repair / replace cost library</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>DIY</th>
                <th>Pro</th>
                <th>As of</th>
                <th>Confidence</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {costs.map((c: CostEntry) => (
                <tr key={c.id}>
                  <td>
                    {c.job}
                    <div class="muted tiny">{c.regionNote}</div>
                  </td>
                  <td>
                    ${c.diyRange.min}–${c.diyRange.max}
                  </td>
                  <td>
                    ${c.proRange.min.toLocaleString()}–$
                    {c.proRange.max.toLocaleString()}
                  </td>
                  <td>{c.asOfDate}</td>
                  <td>
                    <span class={`badge conf-${c.confidence}`}>
                      {c.confidence}
                    </span>
                  </td>
                  <td>
                    {c.sourceUrl ? (
                      <a
                        href={c.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={c.source}
                      >
                        Link
                      </a>
                    ) : (
                      <span class="muted tiny">{c.source}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Disclaimer />
        </div>
      )}

      {tab === 'rebates' && (
        <div class="card">
          <h2>Rebates & incentives</h2>
          {credit25c && (
            <article class="rebate-card highlight">
              <h3>
                {credit25c.code}: {credit25c.title}
              </h3>
              <p>
                <span class={`badge conf-${credit25c.confidence}`}>
                  {credit25c.confidence}
                </span>{' '}
                <span class="muted">as of {credit25c.asOfDate}</span>
              </p>
              <p>{credit25c.summary}</p>
              <p>
                <strong>Eligibility pattern:</strong>{' '}
                {credit25c.eligibilityPattern}
              </p>
              <p class="muted">
                Source:{' '}
                <a href={credit25c.sourceUrl} target="_blank" rel="noreferrer">
                  {credit25c.source}
                </a>
              </p>
            </article>
          )}
          <ul class="item-list">
            {rebates
              .filter((r) => r.code !== '25C')
              .map((r) => (
                <li key={r.id} class="item-card">
                  <strong>
                    {r.code}: {r.title}
                  </strong>
                  <div>
                    <span class={`badge conf-${r.confidence}`}>
                      {r.confidence}
                    </span>{' '}
                    as of {r.asOfDate}
                  </div>
                  <p>{r.summary}</p>
                  <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                    Primary source
                  </a>
                </li>
              ))}
          </ul>
          <Disclaimer />
        </div>
      )}

      {tab === 'dale' && (
        <div class="card">
          <h2>Dale's Desk — quote reviewer</h2>
          <form class="form-grid" onSubmit={(e) => void submitQuote(e)}>
            <label>
              Job
              <input value={job} onInput={(e) => setJob((e.target as HTMLInputElement).value)} />
            </label>
            <label>
              Vendor
              <input value={vendor} onInput={(e) => setVendor((e.target as HTMLInputElement).value)} />
            </label>
            <label>
              Amount (USD)
              <input
                type="number"
                value={amount}
                onInput={(e) => setAmount((e.target as HTMLInputElement).value)}
              />
            </label>
            <label>
              Scope notes
              <textarea
                rows={3}
                value={scope}
                onInput={(e) => setScope((e.target as HTMLTextAreaElement).value)}
              />
            </label>
            <button type="submit" class="btn primary">
              Ask Dale
            </button>
          </form>
          {lastQuote && (
            <div
              class={
                lastQuote.daleVerdict === 'dreamin'
                  ? 'dale-verdict dreamin'
                  : 'dale-verdict'
              }
            >
              <p class="dale-line">
                Verdict: <strong>{lastQuote.daleVerdict}</strong>
                {lastQuote.daleVerdict === 'dreamin' && (
                  <> — &ldquo;Tell him he&apos;s dreamin'.&rdquo;</>
                )}
              </p>
              <ul>
                {lastQuote.daleReasons.map((r: string) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {property.quotes.length > 0 && (
            <details>
              <summary>Quote history ({property.quotes.length})</summary>
              <ul class="plain-list">
                {property.quotes.map((q) => (
                  <li key={q.id}>
                    {q.date} · {q.vendor} · ${q.amount.toLocaleString()} ·{' '}
                    {q.daleVerdict}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {tab === 'ledger' && (
        <div class="card">
          <h2>Capital improvements ledger</h2>
          <p class="muted">{BASIS_EXPLAINER}</p>
          <p>
            Basis-eligible total:{' '}
            <strong>${basisTotal.toLocaleString()}</strong>
            {' · '}
            All logged: ${allImp.toLocaleString()}
          </p>
          <form class="form-grid" onSubmit={(e) => void submitImprovement(e)}>
            <label>
              Date
              <input
                type="date"
                value={impDate}
                onInput={(e) => setImpDate((e.target as HTMLInputElement).value)}
              />
            </label>
            <label>
              Description
              <input
                value={impDesc}
                onInput={(e) => setImpDesc((e.target as HTMLInputElement).value)}
                required
                placeholder="Kitchen remodel — cabinets"
              />
            </label>
            <label>
              Cost
              <input
                type="number"
                value={impCost}
                onInput={(e) => setImpCost((e.target as HTMLInputElement).value)}
                required
              />
            </label>
            <button type="submit" class="btn primary">
              Add improvement
            </button>
          </form>
          <ul class="plain-list">
            {property.improvements.map((i) => (
              <li key={i.id}>
                {i.date} · {i.desc} · ${i.cost.toLocaleString()}
                {i.basisEligible ? ' · basis-eligible' : ''}
              </li>
            ))}
          </ul>
          <Disclaimer />
        </div>
      )}

      {tab === 'payoff' && (
        <div class="card">
          <h2>Payoff & equity tools</h2>
          <form class="form-grid" onSubmit={(e) => void saveMortgage(e)}>
            <label>
              Principal
              <input value={principal} onInput={(e) => setPrincipal((e.target as HTMLInputElement).value)} />
            </label>
            <label>
              APR %
              <input value={rate} onInput={(e) => setRate((e.target as HTMLInputElement).value)} />
            </label>
            <label>
              Term (months)
              <input value={term} onInput={(e) => setTerm((e.target as HTMLInputElement).value)} />
            </label>
            <label>
              Extra monthly principal
              <input value={extra} onInput={(e) => setExtra((e.target as HTMLInputElement).value)} />
            </label>
            <label>
              Home value (optional — powers the Equity stat on the house map)
              <input
                type="number"
                min="0"
                placeholder="e.g. 465000"
                value={homeValue}
                onInput={(e) => setHomeValue((e.target as HTMLInputElement).value)}
              />
            </label>
            <button type="submit" class="btn primary">
              Save mortgage terms
            </button>
          </form>
          <ul class="plain-list">
            <li>
              Monthly P&amp;I: <strong>${payoff.monthlyPi.toLocaleString()}</strong>
            </li>
            <li>
              Interest (no extra): ${payoff.totalInterestBase.toLocaleString()}
            </li>
            <li>
              Interest (with extra): ${payoff.totalInterestWithExtra.toLocaleString()}
            </li>
            <li>
              Months saved with extra: <strong>{payoff.monthsSaved}</strong>
            </li>
          </ul>
          <p class="muted">Educational amortization only — not a loan offer.</p>
          <Disclaimer />
        </div>
      )}

      {tab === 'protect' && (
        <div class="card">
          <h2>Insurance readiness & warranties</h2>
          <button type="button" class="btn primary" onClick={() => void downloadInsurance()}>
            Export insurance packet (ZIP)
          </button>
          <h3>Warranty tracker</h3>
          {warranties.length === 0 ? (
            <p class="muted">
              No active warranty end dates on items. Set warrantyEnd on catalog
              cards.
            </p>
          ) : (
            <ul class="plain-list">
              {warranties.map((w) => (
                <li key={w.itemId} class="ok-text">
                  {w.label}: {w.message}
                </li>
              ))}
            </ul>
          )}
          <h3>Fine-print gotchas</h3>
          <ul class="item-list">
            {getInsuranceGotchas().map((g) => (
              <li key={g.id} class="item-card">
                <strong>{g.title}</strong>
                <div class="muted">
                  {g.asOfDate} · {g.confidence}
                </div>
                <p>{g.body}</p>
              </li>
            ))}
          </ul>
          <Disclaimer />
        </div>
      )}
    </section>
  );
}
