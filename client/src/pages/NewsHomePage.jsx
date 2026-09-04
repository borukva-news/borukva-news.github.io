import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DROPDOWN_MENUS, HOME_CAROUSEL_ITEMS, SERVER_WIKI_URL, BG_MONOCHROME_ASSET } from '../data/issues';
import { useDevModeCombo } from '../hooks/useDevModeCombo';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'https://borukva-news-github-io.onrender.com').replace(/\/+$/, '');
const PROFILE_KEY = 'borukva-news-profile';
const VISITOR_KEY = 'borukva-news-visitor-id';

function getProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); } catch { return {}; }
}

function getVisitorId() {
  let visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    localStorage.setItem(VISITOR_KEY, visitorId);
  }
  return visitorId;
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function NewBadge() {
  return <span className="new-badge">НОВИЙ</span>;
}

function Dropdown({ title, items, navigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const hasNew = items.some((i) => i.isNew);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div className="dropdown" ref={ref}>
      <button className="dropdown-trigger" onClick={() => setOpen((v) => !v)}>
        {title}
        {hasNew && <NewBadge />}
        <span className="dropdown-caret">▾</span>
      </button>
      {open && (
        <div className="dropdown-menu">
          {items.map((item) => (
            <button
              key={item.route}
              className="dropdown-item"
              onClick={() => {
                setOpen(false);
                navigate(item.route);
              }}
            >
              {item.label}
              {item.isNew && <NewBadge />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileMenu({ navigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div className="mobile-menu" ref={ref}>
      <button className="mobile-menu-trigger" onClick={() => setOpen((v) => !v)} aria-label="Меню">
        ☰
      </button>
      {open && (
        <div className="mobile-menu-panel">
          <button
            className="mobile-menu-publish"
            onClick={() => {
              setOpen(false);
              navigate('/generator');
            }}
          >
            <span aria-hidden="true">+</span>
            Опублікувати новину
          </button>
          {Object.entries(DROPDOWN_MENUS).map(([category, items]) => (
            <div key={category} className="mobile-menu-category">
              <div className="mobile-menu-category-title">{category}</div>
              {items.map((item) => (
                <button
                  key={item.route}
                  className="dropdown-item"
                  onClick={() => {
                    setOpen(false);
                    navigate(item.route);
                  }}
                >
                  {item.label}
                  {item.isNew && <NewBadge />}
                </button>
              ))}
            </div>
          ))}
          <button
            className="dropdown-item"
            onClick={() => {
              setOpen(false);
              window.open(SERVER_WIKI_URL, '_blank');
            }}
          >
            ▶ Грати на сервері
          </button>
        </div>
      )}
    </div>
  );
}

function Carousel({ navigate }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef(null);

  function startAutoPlay() {
    stopAutoPlay();
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % HOME_CAROUSEL_ITEMS.length);
    }, 5000);
  }
  function stopAutoPlay() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  useEffect(() => {
    startAutoPlay();
    return stopAutoPlay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goTo(i) {
    stopAutoPlay();
    setIndex((i + HOME_CAROUSEL_ITEMS.length) % HOME_CAROUSEL_ITEMS.length);
    startAutoPlay();
  }

  const item = HOME_CAROUSEL_ITEMS[index];

  return (
    <div className="home-carousel">
      <button className="carousel-arrow left" onClick={() => goTo(index - 1)}>
        &lt;
      </button>

      <div
        className="home-carousel-frame"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => navigate(item.route)}
      >
          <img src={item.image} alt="" className="home-carousel-image" />
        {hovered && <div className="home-carousel-hover-border" />}
        {item.caption && (
          <div className="home-carousel-caption">
            <span>{item.caption}</span>
          </div>
        )}
        {item.isNew && <div className="home-carousel-new-badge">НОВИЙ</div>}
        {item.isBeta && <div className="home-carousel-beta-badge">BETA</div>}
        {hovered && (
          <div className="home-carousel-open-icon">
            <span>⤢</span>
          </div>
        )}

        <div className="home-carousel-dots">
          {HOME_CAROUSEL_ITEMS.map((_, i) => (
            <span key={i} className={`dot ${i === index ? 'active' : ''}`} />
          ))}
        </div>
      </div>

      <button className="carousel-arrow right" onClick={() => goTo(index + 1)}>
        &gt;
      </button>
    </div>
  );
}

function FeedItem({ item, onRefresh, visitorId, devMode }) {
  const profile = getProfile();
  const [comment, setComment] = useState({ author: profile.author || '', authorEmail: profile.authorEmail || '', text: '' });
  const [busy, setBusy] = useState(false);
  const [viewerImage, setViewerImage] = useState(null);
  const [viewerZoom, setViewerZoom] = useState(1);

  async function deleteNews() {
    if (!window.confirm(`Видалити опубліковану новину «${item.title}»?`)) return;
    const token = window.prompt('Введіть MODERATION_SECRET для підтвердження видалення:');
    if (!token) return;
    setBusy(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/news/${item.id}`, { method: 'DELETE', headers: { 'x-moderation-token': token } });
      if (!response.ok) throw new Error(await response.text());
      onRefresh();
    } catch (error) {
      console.error('[feed] delete failed', { id: item.id, message: error.message });
      alert('Не вдалося видалити новину. Перевірте секрет модерації.');
    } finally {
      setBusy(false);
    }
  }

  async function react(type) {
    if (item.userReaction) return;
    setBusy(true);
    const response = await fetch(`${BACKEND_URL}/api/news/${item.id}/reactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, visitorId }) });
    setBusy(false);
    if (response.ok) onRefresh();
  }

  async function submitComment(event) {
    event.preventDefault();
    if (!comment.author.trim() || !comment.authorEmail.trim() || !comment.text.trim()) return;
    setBusy(true);
    const response = await fetch(`${BACKEND_URL}/api/news/${item.id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(comment) });
    if (response.ok) saveProfile({ author: comment.author.trim(), authorEmail: comment.authorEmail.trim() });
    setComment({ ...comment, text: '' });
    setBusy(false);
    onRefresh();
  }

  return (
    <article className="feed-item" id={item.id}>
      <div className="feed-item-heading"><h2>{item.title}</h2><span>{item.author}</span></div>
      <div className="feed-pages">{item.images.map((image, index) => <button className="feed-image-button" key={image} type="button" onClick={() => { setViewerImage(image); setViewerZoom(1); }}><img src={image} alt={`${item.title}, сторінка ${index + 1}`} loading="lazy" /></button>)}</div>
      <div className="feed-actions">
        <button className={item.userReaction === 'like' ? 'active' : ''} disabled={busy || Boolean(item.userReaction)} onClick={() => react('like')}>👍 {item.likes}{item.userReaction === 'like' ? ' · Вже поставлено' : ''}</button>
        <button className={item.userReaction === 'dislike' ? 'active' : ''} disabled={busy || Boolean(item.userReaction)} onClick={() => react('dislike')}>👎 {item.dislikes}{item.userReaction === 'dislike' ? ' · Вже поставлено' : ''}</button>
        <span>{item.commentsCount} коментарів</span>
        {devMode && <button className="feed-delete-button" disabled={busy} onClick={deleteNews}>Видалити</button>}
      </div>
      <div className="feed-comments">{item.comments?.map((entry, index) => <p key={`${entry.createdAt}-${index}`}><strong>{entry.author}:</strong> {entry.text}</p>)}</div>
      <form className="comment-form" onSubmit={submitComment}>
        <input aria-label="Ваш нік" placeholder="Ваш нік" value={comment.author} onChange={(e) => setComment({ ...comment, author: e.target.value })} />
        <input aria-label="Ваш Email" type="email" placeholder="Ваш Email" value={comment.authorEmail} onChange={(e) => setComment({ ...comment, authorEmail: e.target.value })} />
        <input aria-label="Текст коментаря" placeholder="Текст коментаря" value={comment.text} onChange={(e) => setComment({ ...comment, text: e.target.value })} />
        <button disabled={busy} type="submit">Надіслати</button>
      </form>
      {viewerImage && <div className="image-viewer" role="dialog" aria-modal="true" onClick={() => setViewerImage(null)}><div className="image-viewer-toolbar" onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => setViewerZoom((zoom) => Math.max(0.5, zoom - 0.25))}>-</button><span>{Math.round(viewerZoom * 100)}%</span><button type="button" onClick={() => setViewerZoom((zoom) => Math.min(3, zoom + 0.25))}>+</button><button type="button" onClick={() => setViewerZoom(1)}>100%</button><button type="button" className="image-viewer-close" onClick={() => setViewerImage(null)}>x</button></div><img src={viewerImage} alt={item.title} style={{ transform: `scale(${viewerZoom})` }} onClick={(event) => event.stopPropagation()} /></div>}
    </article>
  );
}

function FeedPreviewItem({ item, onDetails }) {
  return (
    <article className="feed-preview-item">
      <img src={item.images[0]} alt={`${item.title}, preview`} loading="lazy" />
      <div className="feed-preview-copy">
        {item.isBeta && <div className="feed-preview-beta-badge">BETA</div>}
        <span className="feed-preview-label">LIVE / {item.author}</span>
        <h2>{item.title}</h2>
        <p>{item.commentsCount} коментарів · 👍 {item.likes} · 👎 {item.dislikes}</p>
        <button onClick={onDetails}>Детальніше →</button>
      </div>
    </article>
  );
}

function SideFeedWidget({ items, onSelect }) {
  return (
    <aside className="side-feed-widget" aria-label="Останні новини">
      <div className="side-feed-tab">Останні</div>
      <div className="side-feed-content">
        <h2>Live feed</h2>
        {items.slice(0, 6).map((item) => <button key={item.id} onClick={() => onSelect(item.id)}><img src={item.images[0]} alt="" /><span>{item.title}</span></button>)}
        {!items.length && <p>Опублікованих новин поки немає.</p>}
      </div>
    </aside>
  );
}

export function NewsHomePage({ feedPage = false }) {
  const navigate = useNavigate();
  const [feed, setFeed] = useState([]);
  const [visitorId] = useState(getVisitorId);
  const [devMode, setDevMode] = useState(false);
  useDevModeCombo(() => setDevMode((enabled) => !enabled));

  const loadFeed = () => fetch(`${BACKEND_URL}/api/news/feed?visitorId=${encodeURIComponent(visitorId)}`).then((response) => response.ok ? response.json() : []).then(setFeed).catch(() => setFeed([]));
  useEffect(() => { loadFeed(); }, []);

  return (
    <div className="news-home">
      <img className="bg-image" src={BG_MONOCHROME_ASSET} alt="" />

      <header className="news-home-header">
        <div className="news-home-logo">Borukva News</div>

        <nav className="news-home-nav desktop-only">
          {Object.entries(DROPDOWN_MENUS).map(([category, items]) => (
            <Dropdown key={category} title={category} items={items} navigate={navigate} />
          ))}
        </nav>

        <button className="play-server-btn desktop-only" onClick={() => window.open(SERVER_WIKI_URL, '_blank')}>
          Грати на сервері
        </button>

        <div className="mobile-only">
          <MobileMenu navigate={navigate} />
        </div>
        {!feedPage && (
          <button className="mobile-live-feed-button" type="button" onClick={() => navigate('/feed')}>
            <span aria-hidden="true">●</span> Live feed
          </button>
        )}
      </header>

      <main className="news-home-main">
        {!feedPage && <Carousel navigate={navigate} />}

        {feedPage && <div className="feed-overlay"><section className="feed-section feed-page-section" id="feed"><div className="feed-section-heading"><span className="section-kicker">BORUKVA / LIVE</span><h1>Повний feed</h1>{devMode && <span className="dev-badge">DEV</span>}<div className="feed-heading-actions"><button onClick={loadFeed}>Оновити</button><button className="feed-close-button" onClick={() => navigate('/')}>Вийти</button></div></div>{feed.map((item) => <FeedItem key={item.id} item={item} visitorId={visitorId} devMode={devMode} onRefresh={loadFeed} />)}{!feed.length && <p className="feed-empty">Стрічка завантажується або ще не має опублікованих випусків.</p>}</section></div>}
        {!feedPage && <SideFeedWidget items={feed} onSelect={() => navigate('/feed')} />}

        <div className="news-home-footer">
          <p>Останні новини та оновлення на Борукві</p>
          <p className="footer-copy">© {new Date().getFullYear()} Borukva News. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
