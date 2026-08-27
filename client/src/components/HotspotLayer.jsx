import { useCallback, useEffect, useRef, useState } from 'react';

// Ports `imageRect()` from hotspot_shared.dart — computes the letterboxed
// rect of an `object-fit: contain` image inside its container.
export function imageRect(container, intrinsic) {
  const cA = container.width / container.height;
  const iA = intrinsic.width / intrinsic.height;
  let w, h;
  if (iA > cA) {
    w = container.width;
    h = container.width / iA;
  } else {
    h = container.height;
    w = container.height * iA;
  }
  return { left: (container.width - w) / 2, top: (container.height - h) / 2, width: w, height: h };
}

function useContainerRect(ref) {
  const [rect, setRect] = useState({ width: 0, height: 0 });
  const observerRef = useRef(null);
  const setNode = useCallback((node) => {
    ref.current = node;
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setRect({ width, height });
    });
    observerRef.current.observe(node);
    setRect({ width: node.clientWidth, height: node.clientHeight });
  }, [ref]);
  return [setNode, rect];
}

// ── View mode: transparent clickable rects that open their URL ─────────────
export function HotspotViewLayer({ hotspots, imageSize }) {
  const containerRef = useRef(null);
  const [setNode, rect] = useContainerRect(containerRef);

  if (!hotspots || hotspots.length === 0) {
    return <div ref={setNode} style={{ position: 'absolute', inset: 0 }} />;
  }

  const img = rect.width && imageSize?.width ? imageRect(rect, imageSize) : null;

  return (
    <div ref={setNode} style={{ position: 'absolute', inset: 0 }}>
      {img &&
        hotspots.map((spot, i) => (
          <a
            key={i}
            href={spot.url}
            target="_blank"
            rel="noreferrer"
            className="hotspot"
            style={{
              left: img.left + spot.left * img.width,
              top: img.top + spot.top * img.height,
              width: spot.width * img.width,
              height: spot.height * img.height,
            }}
          />
        ))}
    </div>
  );
}

// ── Dev mode: click empty area to add, drag to move, corner handles resize ─
export function HotspotDevLayer({ hotspots, imageSize, onChange }) {
  const containerRef = useRef(null);
  const [setNode, rect] = useContainerRect(containerRef);
  const dragState = useRef(null);
  const didDrag = useRef(false);
  const hotspotsRef = useRef(hotspots);
  const [newSpot, setNewSpot] = useState(null);
  const [newUrl, setNewUrl] = useState('https://');

  const img = rect.width && imageSize?.width ? imageRect(rect, imageSize) : null;
  const imageRectRef = useRef(img);
  hotspotsRef.current = hotspots;
  imageRectRef.current = img;

  function clamp(spot) {
    spot.width = Math.min(Math.max(spot.width, 0.04), 1);
    spot.height = Math.min(Math.max(spot.height, 0.04), 1);
    spot.left = Math.min(Math.max(spot.left, 0), 1 - spot.width);
    spot.top = Math.min(Math.max(spot.top, 0), 1 - spot.height);
    return spot;
  }

  function emit(next) {
    onChange(next);
  }

  function handleBackgroundClick(e) {
    if (!img || didDrag.current || e.target.closest('.hotspot-dev-box')) return;
    const containerBox = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - containerBox.left;
    const y = e.clientY - containerBox.top;
    const fx = (x - img.left) / img.width;
    const fy = (y - img.top) / img.height;
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return;
    const hit = hotspots.some((s) => fx >= s.left && fx <= s.left + s.width && fy >= s.top && fy <= s.top + s.height);
    if (hit) return;
    setNewUrl('https://');
    setNewSpot({ left: fx, top: fy });
  }

  function addSpot() {
    const url = newUrl.trim();
    if (!newSpot || !url || url === 'https://') return;
    const next = [
      ...hotspots,
      clamp({
        left: Math.min(Math.max(newSpot.left - 0.15, 0), 0.7),
        top: Math.min(Math.max(newSpot.top - 0.07, 0), 0.86),
        width: 0.3,
        height: 0.14,
        url,
      }),
    ];
    emit(next);
    setNewSpot(null);
  }

  function startDrag(index, mode, handle) {
    return (e) => {
      if (e.target.closest('button')) return;
      e.stopPropagation();
      e.preventDefault();
      didDrag.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      dragState.current = { index, mode, handle, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY };
    };
  }

  function onDragMove(e) {
    const st = dragState.current;
    const currentImg = imageRectRef.current;
    if (!st || !currentImg || st.pointerId !== e.pointerId) return;
    const dx = (e.clientX - st.startX) / currentImg.width;
    const dy = (e.clientY - st.startY) / currentImg.height;
    st.startX = e.clientX;
    st.startY = e.clientY;
    const next = hotspotsRef.current.map((s) => ({ ...s }));
    const s = next[st.index];
    if (st.mode === 'move') {
      s.left += dx;
      s.top += dy;
    } else if (st.mode === 'resize') {
      if (st.handle === 'tl') {
        s.left += dx;
        s.width -= dx;
        s.top += dy;
        s.height -= dy;
      } else if (st.handle === 'tr') {
        s.top += dy;
        s.height -= dy;
        s.width += dx;
      } else if (st.handle === 'bl') {
        s.left += dx;
        s.width -= dx;
        s.height += dy;
      } else if (st.handle === 'br') {
        s.width += dx;
        s.height += dy;
      }
    }
    clamp(s);
    emit(next);
  }

  function onDragEnd() {
    dragState.current = null;
    requestAnimationFrame(() => {
      didDrag.current = false;
    });
  }

  useEffect(() => {
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragEnd);
    window.addEventListener('pointercancel', onDragEnd);
    return () => {
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', onDragEnd);
      window.removeEventListener('pointercancel', onDragEnd);
    };
  });

  function editUrl(index) {
    const url = window.prompt('URL хотспоту:', hotspots[index].url);
    if (!url) return;
    const next = hotspots.map((s, i) => (i === index ? { ...s, url } : s));
    emit(next);
  }

  function removeSpot(index) {
    emit(hotspots.filter((_, i) => i !== index));
  }

  return (
    <>
      <div
        ref={setNode}
        className="hotspot-dev-layer"
        onClick={handleBackgroundClick}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) didDrag.current = false;
          e.stopPropagation();
        }}
      >
      {img &&
        hotspots.map((s, i) => {
          const l = img.left + s.left * img.width;
          const t = img.top + s.top * img.height;
          const w = s.width * img.width;
          const h = s.height * img.height;
          return (
            <div key={i} className="hotspot-dev-box" style={{ left: l, top: t, width: w, height: h }} onPointerDown={startDrag(i, 'move')}>
              <span className="hotspot-dev-url">{s.url}</span>
              <button
                className="hotspot-dev-edit"
                onClick={(e) => {
                  e.stopPropagation();
                  editUrl(i);
                }}
                title="Редагувати URL"
              >
                ✎
              </button>
              <button
                className="hotspot-dev-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSpot(i);
                }}
                title="Видалити"
              >
                ✕
              </button>
              {['tl', 'tr', 'bl', 'br'].map((handle) => (
                <span
                  key={handle}
                  className={`hotspot-dev-handle handle-${handle}`}
                  onPointerDown={startDrag(i, 'resize', handle)}
                />
              ))}
            </div>
          );
        })}
      </div>

      {newSpot && (
        <div className="hotspot-dialog-backdrop" onMouseDown={() => setNewSpot(null)}>
          <form
            className="hotspot-dialog"
            onSubmit={(e) => {
              e.preventDefault();
              addSpot();
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2>Новий hotspot</h2>
            <label htmlFor="new-hotspot-url">Посилання</label>
            <input
              id="new-hotspot-url"
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              autoFocus
              placeholder="https://example.com"
            />
            <div className="hotspot-dialog-actions">
              <button type="button" onClick={() => setNewSpot(null)}>
                Скасувати
              </button>
              <button type="submit" disabled={!newUrl.trim() || newUrl.trim() === 'https://'}>
                Додати
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
