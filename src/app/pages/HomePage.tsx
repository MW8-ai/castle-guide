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

  useEffect(() => {
    void (async () => {
      const s = await ensureStorageReady();
      let demo = await ensureDemoCastle(s);
      if (demo.rooms.length < 12) demo = await resetDemoCastle(s);
      setSummary(
        `${demo.rooms.length} rooms · ${demo.items.filter((i) => i.active).length} items`
      );
      await refresh();
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

  async function blank() {
    const name = prompt('Home name', 'My House');
    if (!name?.trim()) return;
    setBusy(true);
    try {
      const s = await ensureStorageReady();
      const p = await s.createProperty(name.trim(), null);
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
        <div class="title-actions">
          <button
            type="button"
            class="btn primary big"
            disabled={busy}
            onClick={() => void openSample()}
          >
            {busy ? 'Opening…' : 'Open sample home'}
          </button>
          <button
            type="button"
            class="btn"
            disabled={busy}
            onClick={() => void reloadSample()}
          >
            Reload full sample
          </button>
          <button
            type="button"
            class="btn ghost"
            disabled={busy}
            onClick={() => void blank()}
          >
            Empty home
          </button>
        </div>
      </div>
    </div>
  );
}
