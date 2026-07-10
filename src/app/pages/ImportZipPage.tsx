import { useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';

const base = import.meta.env.BASE_URL;

export function ImportZipPage() {
  const [errors, setErrors] = useState<string[]>([]);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true);
    setErrors([]);
    setOkMsg(null);
    try {
      const storage = await ensureStorageReady();
      const result = await storage.importZip(file);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setOkMsg(`Imported property ${result.propertyId}`);
      window.location.href = `${base}property/${result.propertyId}`;
    } catch (err) {
      setErrors([err instanceof Error ? err.message : String(err)]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section class="page">
      <p class="eyebrow">
        <a href={base}>← Home</a>
      </p>
      <h1>Import ZIP export</h1>
      <p class="muted">
        Restores a Castle Guide export. Future schema versions are refused.
        Incomplete ZIPs import nothing.
      </p>
      <div class="card">
        <label class="btn primary file-btn">
          {busy ? 'Importing…' : 'Choose ZIP'}
          <input
            type="file"
            accept=".zip,application/zip"
            hidden
            disabled={busy}
            onChange={(e) => void onFile(e)}
          />
        </label>
      </div>
      {okMsg && <p class="ok-text">{okMsg}</p>}
      {errors.length > 0 && (
        <div class="card error-card">
          <h2>Import refused</h2>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
