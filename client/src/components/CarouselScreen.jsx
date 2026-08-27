import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OutlinedIconBtn, ImageWithLoader } from './Atoms';
import { HotspotViewLayer, HotspotDevLayer } from './HotspotLayer';
import { YoutubePage } from './YoutubePage';
import { FullScreenViewer } from './FullScreenViewer';
import { useHotspots } from '../hooks/useHotspots';
import { useDevModeCombo } from '../hooks/useDevModeCombo';
import { BG_ASSET } from '../data/issues';

function useImageSizes(pages) {
  const [sizes, setSizes] = useState(() => pages.map(() => null));

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      pages.map(
        (page) =>
          new Promise((resolve) => {
            if (page.type === 'youtube') return resolve({ width: 1920, height: 1080 });
            const im = new Image();
            im.onload = () => resolve({ width: im.naturalWidth, height: im.naturalHeight });
            im.onerror = () => resolve({ width: 1000, height: 1000 });
            im.src = page.src;
          })
      )
    ).then((result) => {
      if (!cancelled) setSizes(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages]);

  return sizes;
}

export function CarouselScreen({ title = 'Borukva News', pages, hotspotFile, bgAsset = BG_ASSET }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [devMode, setDevMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const { hotspots, loaded, updatePage } = useHotspots(hotspotFile, pages.length);
  const imageSizes = useImageSizes(pages);

  useDevModeCombo(() => {
    setDevMode((v) => {
      const next = !v;
      setToast(next ? '🛠 Developer mode ON' : '🔒 Developer mode OFF');
      setTimeout(() => setToast(null), 2000);
      return next;
    });
  });

  const hasPrev = index > 0;
  const hasNext = index < pages.length - 1;
  const page = pages[index];
  const imageSize = imageSizes[index];
  const stageStyle = imageSize
    ? { aspectRatio: `${imageSize.width} / ${imageSize.height}` }
    : page.type === 'youtube'
      ? { aspectRatio: '16 / 9' }
      : undefined;

  useEffect(() => {
    function onKey(e) {
      if (fullscreen) return;
      if (devMode) return;
      if (e.key === 'ArrowLeft' && hasPrev) setIndex((i) => i - 1);
      if (e.key === 'ArrowRight' && hasNext) setIndex((i) => i + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasPrev, hasNext, fullscreen, devMode]);

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
          {page.type === 'youtube' ? (
            <YoutubePage videoId={page.videoId} showFullscreenHint={page.videoId === 'YjGYxL-vAZo'} />
          ) : (
            <ImageWithLoader src={page.src} className="carousel-image-wrap" />
          )}

          {loaded && imageSizes[index] && (
            <div className="hotspot-overlay">
              {devMode ? (
                <HotspotDevLayer
                  hotspots={hotspots[index] || []}
                  imageSize={imageSizes[index]}
                  onChange={(updated) => updatePage(index, updated)}
                />
              ) : (
                <HotspotViewLayer hotspots={hotspots[index] || []} imageSize={imageSizes[index]} />
              )}
            </div>
          )}

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
          hotspots={hotspots}
          imageSizes={imageSizes}
          devMode={devMode}
          onHotspotsChange={(pageIndex, updated) => updatePage(pageIndex, updated)}
          onClose={(i) => {
            setIndex(i);
            setFullscreen(false);
          }}
        />
      )}
    </div>
  );
}
