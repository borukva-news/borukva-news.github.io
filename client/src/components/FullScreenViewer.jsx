import { useEffect, useRef, useState } from 'react';
import { OutlinedIconBtn } from './Atoms';
import { UvPage } from './UvCarouselScreen';
import { YoutubePage } from './YoutubePage';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export function FullScreenViewer({
  pages,
  initialIndex,
  hotspots,
  imageSizes,
  devMode = false,
  onHotspotsChange,
  onClose,
}) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [uvActive, setUvActive] = useState(false);
  const [uvRadius, setUvRadius] = useState(80);

  const dragRef = useRef(null);
  const rootRef = useRef(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const page = pages[index];
  const hasPrev = index > 0;
  const hasNext = index < pages.length - 1;

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [index]);

  useEffect(() => setUvActive(false), [index]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose(index);
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(pages.length - 1, i + 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, pages.length, onClose]);

  // Native non-passive listener: React's synthetic onWheel is passive,
  // so e.preventDefault() inside it never worked.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    function onWheel(e) {
      e.preventDefault();
      const next = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, Math.round((zoomRef.current - e.deltaY * 0.001) * 20) / 20),
      );
      if (next === MIN_ZOOM) setPan({ x: 0, y: 0 });
      setZoom(next);
    }
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  function handlePointerDown(e) {
    if (zoomRef.current <= MIN_ZOOM || e.button !== 0) return;
    if (e.target.closest('button, input, a, [data-no-pan]')) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY };
  }

  function handlePointerMove(e) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.preventDefault();
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;
    setPan((value) => ({ x: Math.round(value.x + dx), y: Math.round(value.y + dy) }));
  }

  function handlePointerEnd(e) {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  const hasUvOnPage = page.type !== 'youtube' && Boolean(page.uvOverlay);

  return (
    <div className="fullscreen-viewer" ref={rootRef}>
      <div
        className="fullscreen-stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onDoubleClick={(e) => {
          if (!e.target.closest('button, input')) resetView();
        }}
      >
        {page.type === 'youtube' ? (
          <YoutubePage videoId={page.videoId} />
        ) : (
          <div
            className="fullscreen-image-wrap"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            <UvPage
              page={page}
              uvActive={uvActive}
              uvRadius={uvRadius}
              hotspots={hotspots[index] || []}
              devMode={devMode}
              onHotspotsChange={(updated) => onHotspotsChange?.(index, updated)}
              imageSize={imageSizes?.[index]}
              zoom={zoom}
            />
          </div>
        )}
      </div>

      <div className="fullscreen-close">
        <OutlinedIconBtn
          onClick={(event) => {
            event.stopPropagation();
            onClose(index);
          }}
          title="Закрити"
        >
          ✕
        </OutlinedIconBtn>
      </div>

      <div className="fullscreen-zoom" aria-live="polite">
        {Math.round(zoom * 100)}%
      </div>

      {hasUvOnPage && (
        <div className="fullscreen-uv-controls">
          {uvActive && (
            <div className="uv-slider-row">
              <span>○</span>
              <input
                type="range"
                min={30}
                max={200}
                value={uvRadius}
                onChange={(e) => setUvRadius(Number(e.target.value))}
              />
              <span>●</span>
            </div>
          )}
          <button
            type="button"
            className={`uv-toggle-btn ${uvActive ? 'active' : ''}`}
            onClick={() => setUvActive((v) => !v)}
          >
            🔦 Ультрафіолет
          </button>
        </div>
      )}

      <div className={`fullscreen-nav fullscreen-nav-left ${hasPrev ? '' : 'hidden'}`}>
        <OutlinedIconBtn disabled={!hasPrev} onClick={() => setIndex((i) => i - 1)} title="Попередня">
          &lt;
        </OutlinedIconBtn>
      </div>
      <div className={`fullscreen-nav fullscreen-nav-right ${hasNext ? '' : 'hidden'}`}>
        <OutlinedIconBtn disabled={!hasNext} onClick={() => setIndex((i) => i + 1)} title="Наступна">
          &gt;
        </OutlinedIconBtn>
      </div>
    </div>
  );
}