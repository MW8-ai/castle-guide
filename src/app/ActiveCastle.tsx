import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { ensureStorageReady } from './storageContext';
import type { Property } from '../storage';
import { ensureDemoCastle } from '../record/demoSeed';

interface ActiveCastleCtx {
  property: Property | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setPropertyId: (id: string) => Promise<void>;
}

const Ctx = createContext<ActiveCastleCtx>({
  property: null,
  loading: true,
  refresh: async () => {},
  setPropertyId: async () => {},
});

export function useActiveCastle() {
  return useContext(Ctx);
}

export function ActiveCastleProvider({
  children,
}: {
  children: ComponentChildren;
}) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const s = await ensureStorageReady();
    let list = await s.listProperties();
    if (list.length === 0) {
      await ensureDemoCastle(s);
      list = await s.listProperties();
    }
    const profile = await s.getProfile();
    const activeId = profile?.activePropertyId ?? list[0]?.id;
    const p = activeId
      ? ((await s.getProperty(activeId)) ?? list[0] ?? null)
      : list[0] ?? null;
    if (p && profile?.activePropertyId !== p.id) {
      await s.setActiveProperty(p.id);
    }
    setProperty(p);
    setLoading(false);
  }

  async function setPropertyId(id: string) {
    const s = await ensureStorageReady();
    await s.setActiveProperty(id);
    setProperty(await s.getProperty(id));
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <Ctx.Provider value={{ property, loading, refresh, setPropertyId }}>
      {children}
    </Ctx.Provider>
  );
}
