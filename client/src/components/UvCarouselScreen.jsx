import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OutlinedIconBtn, ImageWithLoader } from './Atoms';
import { HotspotViewLayer, HotspotDevLayer, imageRect as getImageRect } from './HotspotLayer';
import { useHotspots } from '../hooks/useHotspots';
import { useDevModeCombo } from '../hooks/useDevModeCombo';
import { BG_ASSET } from '../data/issues';

import { FullScreenViewer } from './FullScreenViewer';
// Exported so FullScreenViewer can reuse it
export function UvPage({ page, uvActive, uvRadius, hotspots, devMode, onHotspotsChange, imageSize, zoom = 1 }) {
  const wrapRef = useRef(null);
  const [cursor, setCursor] = useState(null);
  const [wrapSize, setWrapSize] = useState(null);
  const pointerRef = useRef(null);

  const showUv = uvActive && Boolean(page.uvOverlay);

  // Measure the wrap reactively (mount, sticky layout, window resize)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () =>
      setWrapSize((prev) => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        return prev && prev.w === w && prev.h === h ? prev : { w, h };
      });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Drop stale cursor on toggle / page change
  useEffect(() => setCursor(null), [uvActive, page.src]);

  // Recalculate the local cursor position after an ancestor zoom changes its
  // bounding box. Wheel events do not necessarily produce a mousemove.
  useEffect(() => {
    if (!showUv || !pointerRef.current) return undefined;
    const frame = requestAnimationFrame(() => handleMove(pointerRef.current));
    return () => cancelAnimationFrame(frame);
  }, [zoom, showUv]);

  const displayedImage =
    wrapSize && imageSize ? getImageRect({ width: wrapSize.w, height: wrapSize.h }, imageSize) : null;

  function handleMove(e) {
    if (!showUv) return;
    pointerRef.current = e;
    const el = wrapRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    // Convert the screen position back into this element's unscaled local
    // coordinates, compensating for fullscreen zoom and pan.
    const sx = box.width ? el.clientWidth / box.width : 1;
    const sy = box.height ? el.clientHeight / box.height : 1;
    setCursor({ x: (e.clientX - box.left) * sx, y: (e.clientY - box.top) * sy });
  }

  let revealStyle = null;
  if (showUv && displayedImage && cursor) {
    const at = `${cursor.x - displayedImage.left}px ${cursor.y - displayedImage.top}px`;
    revealStyle = {
      left: `${displayedImage.left}px`,
      top: `${displayedImage.top}px`,
      width: `${displayedImage.width}px`,
      height: `${displayedImage.height}px`,
      clipPath: `circle(${uvRadius}px at ${at})`,
      WebkitClipPath: `circle(${uvRadius}px at ${at})`,
    };
  }

  const content = (
    <div
      ref={wrapRef}
      className="uv-image-wrap"
      onMouseMove={handleMove}
      style={{ cursor: showUv ? 'none' : 'default' }}
    >
      <ImageWithLoader src={page.src} className="uv-base-image" />

      {showUv && (
        <>
          <div className="uv-dark-overlay" />
          {revealStyle && (
            <img
              src={page.uvOverlay}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="uv-reveal-layer"
              style={revealStyle}
            />
          )}
        </>
      )}

      {!showUv && imageSize && (
        <div className="hotspot-overlay">
          {devMode ? (
            <HotspotDevLayer hotspots={hotspots} imageSize={imageSize} onChange={onHotspotsChange} />
          ) : (
            <HotspotViewLayer hotspots={hotspots} imageSize={imageSize} />
          )}
        </div>
      )}
    </div>
  );

  if (page.sticky) {
    return (
      <div className="uv-scroll-wrap">
        <div
          className="uv-main-frame"
          style={imageSize ? { aspectRatio: `${imageSize.width} / ${imageSize.height}` } : undefined}
        >
          {content}
        </div>
        <div className="uv-sticky-photo">
          <img
            src={page.sticky}
            alt=""
            onError={(event) => {
              event.currentTarget.src = '/assets/pictures/bg/bg_borukva-monochrome.png';
            }}
          />
        </div>
      </div>
    );
  }

  return content;
}

export function UvCarouselScreen({ title = 'Borukva News', pages, hotspotFile, bgAsset = BG_ASSET }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [devMode, setDevMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [uvActive, setUvActive] = useState(false);
  const [uvRadius, setUvRadius] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const { hotspots, loaded, updatePage } = useHotspots(hotspotFile, pages.length);
  const [imageSizes, setImageSizes] = useState(() => pages.map(() => null));

  useDevModeCombo(() => {
    setDevMode((v) => {
      const next = !v;
      setToast(next ? '🛠 Developer mode ON' : '🔒 Developer mode OFF');
      setTimeout(() => setToast(null), 2000);
      return next;
    });
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      pages.map(
        (p) =>
          new Promise((resolve) => {
            const im = new Image();
            im.onload = () => resolve({ width: im.naturalWidth, height: im.naturalHeight });
            im.onerror = () => resolve({ width: 1000, height: 1000 });
            im.src = p.src;
          })
      )
    ).then((res) => !cancelled && setImageSizes(res));
    return () => {
      cancelled = true;
    };
  }, [pages]);

  useEffect(() => setUvActive(false), [index]);

  const hasPrev = index > 0;
  const hasNext = index < pages.length - 1;
  const page = pages[index];
  const hasUvOnPage = Boolean(page.uvOverlay);
  const stageStyle = imageSizes[index]
    ? { aspectRatio: `${imageSizes[index].width} / ${imageSizes[index].height}` }
    : undefined;

  return (
    <div className="carousel-screen">
      <img className="bg-image" src={bgAsset} alt="" />

      <header className="carousel-appbar">
        <button className="back-link" onClick={() => navigate('/')} title="На головну">
          &lt;
        </button>
        <h1 className="appbar-title">{title}</h1>
        {devMode && <span className="dev-badge">DEV</span>}
      </header>

      <main className="carousel-body">
        <div className="carousel-stage" style={stageStyle}>
          <UvPage
            page={page}
            uvActive={uvActive}
            uvRadius={uvRadius}
            hotspots={loaded ? hotspots[index] || [] : []}
            devMode={devMode}
            onHotspotsChange={(updated) => updatePage(index, updated)}
            imageSize={imageSizes[index]}
          />

          <div className="uv-controls">
            {uvActive && (
              <div className="uv-slider-row">
                <span>○</span>
                <input
                  type="range"
                  min={30}
                  max={260}
                  value={uvRadius}
                  onChange={(e) => setUvRadius(Number(e.target.value))}
                />
                <span>●</span>
              </div>
            )}
            <button
              type="button"
              className={`uv-toggle-btn ${uvActive ? 'active' : ''} ${!hasUvOnPage ? 'disabled' : ''}`}
              disabled={!hasUvOnPage}
              onClick={() => setUvActive((v) => !v)}
            >
              🔦 Ультрафіолет
            </button>
          </div>

          {devMode && (
            <div className="dev-hint">Клік по вільному місцю — новий хотспот · перетягуй — рухай · кутики — розмір</div>
          )}

          <div className="carousel-controls-top">
            {devMode && (
              <>
                <OutlinedIconBtn color="#111" disabled={!hasPrev} onClick={() => setIndex((i) => i - 1)}>
                  ‹
                </OutlinedIconBtn>
                <OutlinedIconBtn color="#111" disabled={!hasNext} onClick={() => setIndex((i) => i + 1)}>
                  ›
                </OutlinedIconBtn>
              </>
            )}
            <OutlinedIconBtn color="#111" onClick={() => setFullscreen(true)} title="На весь екран">
              ⛶
            </OutlinedIconBtn>
          </div>
        </div>

        <div className="carousel-pager">
          <button className="pager-btn" disabled={!hasPrev} onClick={() => setIndex((i) => i - 1)}>
            &lt;
          </button>
          <span className="pager-count">
            {index + 1} / {pages.length}
          </span>
          <button className="pager-btn" disabled={!hasNext} onClick={() => setIndex((i) => i + 1)}>
            &gt;
          </button>
        </div>
      </main>

      {toast && <div className="dev-toast">{toast}</div>}

      {fullscreen && (
        <FullScreenViewer
          pages={pages}
          initialIndex={index}
          hotspots={loaded ? hotspots : []}
          imageSizes={imageSizes}
          devMode={devMode}
          onHotspotsChange={(pageIndex, updated) => updatePage(pageIndex, updated)}
          onClose={(nextIndex) => {
            setIndex(nextIndex);
            setFullscreen(false);
          }}
        />
      )}
    </div>
  );
}