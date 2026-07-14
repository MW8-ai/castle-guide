import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import {
  ensureDemoCastle,
  resetDemoCastle,
  DEMO_PROPERTY_NAME,
} from '../../record/demoSeed';
import { go } from '../paths';
import { useActiveCastle } from '../ActiveCastle';

export function HomePage() {
  const { refresh, setPropertyId } = useActiveCastle();
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState('');
  const [showNewHome, setShowNewHome] = useState(false);
  const [newHomeName, setNewHomeName] = useState('');

  useEffect(() => {
    void (async () => {
      const s = await ensureStorageReady();
      let demo = await ensureDemoCastle(s);
      if (demo.rooms.length < 12) demo = await resetDemoCastle(s);
      setSummary(
        `${demo.rooms.length} rooms · ${demo.items.filter((i) => i.active).length} items`
      );
      // Just ensure the showcase exists — don't switch to it or navigate
      // away. This is the landing page; let the user pick a path.
    })();
  }, []);

  async function openSample() {
    setBusy(true);
    try {
      const s = await ensureStorageReady();
      let demo = await ensureDemoCastle(s);
      if (demo.rooms.length < 12) demo = await resetDemoCastle(s);
      await setPropertyId(demo.id);
      await refresh();
      go('property', demo.id, 'house');
    } finally {
      setBusy(false);
    }
  }

  async function reloadSample() {
    setBusy(true);
    try {
      const s = await ensureStorageReady();
      const demo = await resetDemoCastle(s);
      await setPropertyId(demo.id);
      await refresh();
      go('property', demo.id, 'house');
    } finally {
      setBusy(false);
    }
  }

  async function createHome(e: Event) {
    e.preventDefault();
    const name = newHomeName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const s = await ensureStorageReady();
      const p = await s.createProperty(name, null);
      await setPropertyId(p.id);
      await refresh();
      go('property', p.id, 'house');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="title-screen calm-title">
      <div class="title-sky" />
      <div class="title-panel">
        <p class="title-badge">HOME GUIDE</p>
        <h1 class="title-logo-calm">
          Your home,
          <br />
          all in one place
        </h1>
        <p class="title-tag">
          See the house, click the fridge or water heater, keep records without
          digging through folders. Sample home is fully filled so you can judge
          the best case first.
        </p>
        {summary && (
          <p class="title-demo-blurb">
            <strong>{DEMO_PROPERTY_NAME}</strong> — {summary} (5 bedrooms, 3
            baths, 3 garages, kitchen, living, utility…)
          </p>
        )}

        {showNewHome ? (
          <form class="form-grid title-new-home" onSubmit={(e) => void createHome(e)}>
            <label>
              What's your house called?
              <input
                autoFocus
                placeholder="e.g. The Serenity, or just your address"
                value={newHomeName}
                onInput={(e) =>
                  setNewHomeName((e.target as HTMLInputElement).value)
                }
              />
            </label>
            <p class="muted tiny">
              That's it for now — add rooms and appliances as you go, no forms
              to fill out up front.
            </p>
            <div class="title-actions">
              <button
                type="submit"
                class="btn primary big"
                disabled={busy || !newHomeName.trim()}
              >
                {busy ? 'Creating…' : 'Create my house'}
              </button>
              <button
                type="button"
                class="btn ghost"
                disabled={busy}
                onClick={() => setShowNewHome(false)}
              >
                Back
              </button>
            </div>
          </form>
        ) : (
          <div class="title-actions">
            <button
              type="button"
              class="btn primary big"
              disabled={busy}
              onClick={() => setShowNewHome(true)}
            >
              Start my house
            </button>
            <button
              type="button"
              class="btn"
              disabled={busy}
              onClick={() => void openSample()}
            >
              {busy ? 'Opening…' : 'Explore sample home first'}
            </button>
            <button
              type="button"
              class="btn ghost sm"
              disabled={busy}
              onClick={() => void reloadSample()}
            >
              Reload full sample
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
