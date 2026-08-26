import { useState } from 'react';

// Thumbnail + play button shown inside the carousel PageView.
// Clicking it swaps in the real embedded player (ports YoutubePageWidget).
export function YoutubePage({ videoId, showFullscreenHint = false }) {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  if (playing) {
    return (
      <div className="youtube-embed-wrap">
        <iframe
          className="youtube-iframe"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="youtube-page">
      <button type="button" className="youtube-thumb" onClick={() => setPlaying(true)}>
        <img src={thumb} alt="YouTube thumbnail" />
        <span className="youtube-play-btn">▶</span>
      </button>
      {showFullscreenHint && <div className="youtube-fullscreen-hint">ВІДКРИЙТЕ НА ВЕСЬ ЕКРАН →</div>}
    </div>
  );
}
