import { useEffect, useRef, useState } from 'preact/hooks';
import type { Item } from '../../storage/types';
import {
  SAMPLE_HOME_HOTSPOTS,
  matchItemToHotspot,
  type ArtHotspot,
} from './hotspots';
import sampleHomeUrl from '../../../assets/house/sample-home.png';

interface Props {
  items: Item[];
  houseName: string;
  onSelectItem: (item: Item) => void;
  selectedItemId?: string | null;
}

/**
 * Angled art house view — real illustration + interactive pins.
 * Pan/zoom on the painting; no walking into invisible walls.
 */
export function ImageHouseView({
  items,
  houseName,
  onSelectItem,
  selectedItemId,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    ox: number;
    oy: number;
    px: number;
    py: number;
  } | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Fit image on first mount
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [houseName]);

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    setScale((s) => {
      const next = s + (e.deltaY > 0 ? -0.08 : 0.08);
      return Math.max(0.55, Math.min(2.4, next));
    });
  }

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => onWheel(e);
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  function onPointerDown(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('.hotspot')) return;
    const el = viewportRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    drag.current = {
      ox: e.clientX,
      oy: e.clientY,
      px: pan.x,
      py: pan.y,
    };
  }

  function onPointerMove(e: PointerEvent) {
    if (!drag.current) return;
    setPan({
      x: drag.current.px + (e.clientX - drag.current.ox),
      y: drag.current.py + (e.clientY - drag.current.oy),
    });
  }

  function onPointerUp() {
    drag.current = null;
  }

  function pinClick(hs: ArtHotspot) {
    const item = matchItemToHotspot(items, hs);
    if (item) onSelectItem(item);
  }

  return (
    <div class="art-house">
      <div
        class="art-viewport"
        ref={viewportRef}
        onPointerDown={(e) => onPointerDown(e as unknown as PointerEvent)}
        onPointerMove={(e) => onPointerMove(e as unknown as PointerEvent)}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          class="art-stage"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          }}
        >
          <img
            class="art-image"
            src={sampleHomeUrl}
            alt={`${houseName} — illustrated home`}
            draggable={false}
          />
          {SAMPLE_HOME_HOTSPOTS.map((hs) => {
            const item = matchItemToHotspot(items, hs);
            if (!item) return null;
            const active = selectedItemId === item.id || hoverId === hs.id;
            const healthClass = 'ok';
            return (
              <button
                key={hs.id}
                type="button"
                class={`hotspot ${active ? 'active' : ''} health-${healthClass}`}
                style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                title={`${item.brand} ${item.model ?? ''}`.trim()}
                onMouseEnter={() => setHoverId(hs.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  pinClick(hs);
                }}
              >
                <span class="hotspot-dot" />
                <span class="hotspot-label">
                  <strong>
                    {item.brand} {item.model ? item.model.split(/[\s-]/)[0] : ''}
                  </strong>
                  <em>{hs.room}</em>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div class="art-toolbar">
        <button
          type="button"
          class="btn"
          onClick={() => setScale((s) => Math.min(2.4, s + 0.15))}
        >
          Zoom in
        </button>
        <button
          type="button"
          class="btn"
          onClick={() => setScale((s) => Math.max(0.55, s - 0.15))}
        >
          Zoom out
        </button>
        <button
          type="button"
          class="btn"
          onClick={() => {
            setScale(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          Reset view
        </button>
        <span class="muted art-help">
          Drag to pan · Scroll or buttons to zoom · Tap a pin for details
        </span>
      </div>
    </div>
  );
}
