const docs = [
  { name: 'PRD', path: 'docs/PRD.md' },
  { name: 'Architecture', path: 'docs/ARCHITECTURE.md' },
  { name: 'Data model', path: 'docs/DATA_MODEL.md' },
  { name: 'Tiering', path: 'docs/TIERING.md' },
  { name: 'ADR-0001 Storage', path: 'docs/adr/ADR-0001.md' },
  { name: 'ADR-0002 Renderer', path: 'docs/adr/ADR-0002.md' },
  { name: 'ADR-0003 Framework', path: 'docs/adr/ADR-0003.md' },
  { name: 'Human directions', path: 'HUMAN_DIRECTIONS.md' },
];

export function DocsPage() {
  return (
    <section class="page">
      <h1>Documentation map</h1>
      <p class="muted">
        Docs live in the git repo (not fetched by this static shell). Clone the
        project to read them — this page is a checklist for reviewers.
      </p>
      <ul class="doc-list">
        {docs.map((d) => (
          <li key={d.path}>
            <strong>{d.name}</strong> — <code>{d.path}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}
