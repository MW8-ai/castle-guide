import { useEffect, useState } from 'preact/hooks';
import { ensureStorageReady } from '../storageContext';
import {
  ensureDemoCastle,
  resetDemoCastle,
  DEMO_PROPERTY_NAME,
} from '../../record/demoSeed';
import { go } from '../paths';
import { useActiveCastle } from '../ActiveCastle';

/**
 * Game title screen — always push people into a FULL demo, never a blank form.
 */
export function HomePage() {
  const { refresh, setPropertyId } = useActiveCastle();
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    void (async () => {
      const s = await ensureStorageReady();
      let demo = await ensureDemoCastle(s);
      if (demo.items.length < 10) {
        demo = await resetDemoCastle(s);
      }
      setItemCount(demo.items.filter((i) => i.active).length);
      await refresh();
      setReady(true);
    })();
  }, []);

  async function play() {
    setBusy(true);
    try {
      const s = await ensureStorageReady();
      let demo = await ensureDemoCastle(s);
      if (demo.items.length < 10) demo = await resetDemoCastle(s);
      await setPropertyId(demo.id);
      await refresh();
      go('property', demo.id, 'house');
    } finally {
      setBusy(false);
    }
  }

  async function freshDemo() {
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
    const name = prompt('Name your home', 'My House');
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
    <div class="title-screen">
      <div class="title-sky" />
      <div class="title-panel">
        <div class="title-badge">HOME GUIDE</div>
        <h1 class="title-logo">
          Your whole house
          <br />
          <span>in one place</span>
        </h1>
        <p class="title-tag">
          Catalog appliances, remember filter sizes, get reminders before things
          break — wrapped in a little game so you’ll actually open it.
        </p>

        <div class="title-demo-blurb">
          <strong>{DEMO_PROPERTY_NAME}</strong> is preloaded with kitchen,
          living room, bath, bedroom, utility, garage, and{' '}
          {ready ? itemCount : '…'} real items + to-dos.
        </div>

        <div class="title-actions">
          <button
            type="button"
            class="btn primary big title-play"
            disabled={busy || !ready}
            onClick={() => void play()}
          >
            {busy ? 'Loading…' : '▶  Enter sample home'}
          </button>
          <button
            type="button"
            class="btn big"
            disabled={busy}
            onClick={() => void freshDemo()}
          >
            Reload full sample
          </button>
          <button
            type="button"
            class="btn ghost"
            disabled={busy}
            onClick={() => void blank()}
          >
            Empty home (advanced)
          </button>
        </div>

        <ol class="title-steps">
          <li>Open the map and click the fridge</li>
          <li>Check Quests for filter change</li>
          <li>Stuff bag = inventory without the tax form</li>
        </ol>
      </div>
    </div>
  );
}
