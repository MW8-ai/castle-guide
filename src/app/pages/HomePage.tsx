import { SerenityMeter } from '../../ui/SerenityMeter';

export function HomePage() {
  return (
    <section class="page">
      <header class="hero">
        <p class="eyebrow">Phase 0 · Planning scaffold</p>
        <h1>Castle Guide</h1>
        <p class="tagline">
          Your castle. Cataloged, maintained, defended, and leveled up.
        </p>
      </header>

      <SerenityMeter score={100} label="How's the serenity?" />

      <div class="card-grid">
        <article class="card">
          <h2>Data before decoration</h2>
          <p>
            The schema-validated home record is the product. House views are
            swappable renderer plugins — isometric by default (ADR-0002).
          </p>
        </article>
        <article class="card">
          <h2>Local-first</h2>
          <p>
            No forced accounts. No telemetry. Full export and delete. AI is
            BYO-key with a manual Prompt Pack path as the zero-cost default.
          </p>
        </article>
        <article class="card">
          <h2>What ships next</h2>
          <p>
            Phase 1: profiles, item cards, lineage, consumables, vaults, Pool
            Room, ZIP export/import, and Prompt Pack v1 ingestion.
          </p>
        </article>
      </div>

      <p class="muted">
        Open <code>docs/PRD.md</code> in the repo for the full requirements. This
        shell exists so GitHub Pages deploys a real page with working assets
        under <code>/castle-guide/</code>.
      </p>
    </section>
  );
}
