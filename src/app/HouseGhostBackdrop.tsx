import { useEffect, useRef } from 'preact/hooks';
import type { Property } from '../storage';
import { buildHouseViewModel } from '../houseview';
import { walkIsoRenderer } from '../houseview/walkIso/walkIsoRenderer';
import type { HouseRendererHandle } from '../houseview';

/**
 * Dimmed live house under glass pages so inventory/settings still feel
 * attached to the home.
 */
export function HouseGhostBackdrop({ property }: { property: Property }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HouseRendererHandle | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const model = buildHouseViewModel(property, { ensurePlacements: false })
      .model;
    handleRef.current?.destroy();
    handleRef.current = walkIsoRenderer.mount(
      hostRef.current,
      model,
      {
        onSelectItem: () => {},
        onSelectRoom: () => {},
        onMovePlacement: () => {},
      },
      { interactive: false }
    );
    return () => {
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [property.id, property.updatedAt]);

  return (
    <div class="house-ghost" aria-hidden="true">
      <div class="house-ghost-stage" ref={hostRef} />
      <div class="house-ghost-veil" />
    </div>
  );
}
