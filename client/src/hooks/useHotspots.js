import { useCallback, useEffect, useRef, useState } from 'react';

// Mirrors `HotspotStorage` from lib/hotspot_shared.dart:
//  - GET  /api/hotspots/:file  -> { content: base64, sha }
//  - PUT  /api/hotspots/:file  -> body { content: base64, sha }
//  - falls back to localStorage cache if the API/GitHub is unreachable

function decode(raw, count) {
  try {
    const outer = JSON.parse(raw);
    return Array.from({ length: count }, (_, i) => outer[i] || []);
  } catch {
    return Array.from({ length: count }, () => []);
  }
}

function encode(hotspots) {
  return JSON.stringify(hotspots);
}

export function useHotspots(hotspotFile, pageCount) {
  const [hotspots, setHotspots] = useState(() => Array.from({ length: pageCount }, () => []));
  const [loaded, setLoaded] = useState(false);
  const shaRef = useRef(null);
  const cacheKey = `hotspots_cache:${hotspotFile}`;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const resp = await fetch(`/api/hotspots/${encodeURIComponent(hotspotFile)}`);
        if (resp.ok) {
          const decoded = await resp.json();
          shaRef.current = decoded.sha || null;
          const b64 = (decoded.content || '').replace(/\n/g, '');
          const content = b64 ? decodeURIComponent(escape(atob(b64))) : '[]';
          if (!cancelled) {
            localStorage.setItem(cacheKey, content);
            setHotspots(decode(content, pageCount));
            setLoaded(true);
          }
          return;
        }
      } catch (e) {
        console.warn('[hotspots] fetch failed, falling back to cache', e);
      }
      const cached = localStorage.getItem(cacheKey);
      if (!cancelled) {
        setHotspots(cached ? decode(cached, pageCount) : Array.from({ length: pageCount }, () => []));
        setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotspotFile, pageCount]);

  const save = useCallback(
    async (updated) => {
      const raw = encode(updated);
      localStorage.setItem(cacheKey, raw);
      try {
        if (!shaRef.current) {
          const resp = await fetch(`/api/hotspots/${encodeURIComponent(hotspotFile)}`);
          if (resp.ok) {
            const decoded = await resp.json();
            shaRef.current = decoded.sha || null;
          }
        }
        if (!shaRef.current) return;
        const b64 = btoa(unescape(encodeURIComponent(raw)));
        const resp = await fetch(`/api/hotspots/${encodeURIComponent(hotspotFile)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: b64, sha: shaRef.current }),
        });
        if (resp.ok) {
          const result = await resp.json();
          shaRef.current = result?.content?.sha || shaRef.current;
        }
      } catch (e) {
        console.warn('[hotspots] save to GitHub failed, kept in local cache only', e);
      }
    },
    [hotspotFile, cacheKey]
  );

  const updatePage = useCallback(
    (pageIndex, updatedSpots) => {
      setHotspots((prev) => {
        const next = [...prev];
        next[pageIndex] = updatedSpots;
        save(next);
        return next;
      });
    },
    [save]
  );

  return { hotspots, loaded, updatePage };
}
