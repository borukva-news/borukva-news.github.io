import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DROPDOWN_MENUS, HOME_CAROUSEL_ITEMS, SERVER_WIKI_URL, BG_MONOCHROME_ASSET } from '../data/issues';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'https://borukva-news-github-io.onrender.com').replace(/\/+$/, '');

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

function FeedItem({ item, onRefresh }) {
  const [comment, setComment] = useState({ author: '', text: '' });
  const [busy, setBusy] = useState(false);

  async function react(type) {
    setBusy(true);
    await fetch(`${BACKEND_URL}/api/news/${item.id}/reactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }) });
    setBusy(false);
    onRefresh();
  }

  async function submitComment(event) {
    event.preventDefault();
    if (!comment.author.trim() || !comment.text.trim()) return;
    setBusy(true);
    await fetch(`${BACKEND_URL}/api/news/${item.id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(comment) });
    setComment({ author: '', text: '' });
    setBusy(false);
    onRefresh();
  }

  return (
    <article className="feed-item" id={item.id}>
      <div className="feed-item-heading"><h2>{item.title}</h2><span>{item.author}</span></div>
      <div className="feed-pages">{item.images.map((image, index) => <img key={image} src={image} alt={`${item.title}, сторінка ${index + 1}`} loading="lazy" />)}</div>
      <div className="feed-actions">
        <button disabled={busy} onClick={() => react('like')}>👍 {item.likes}</button>
        <button disabled={busy} onClick={() => react('dislike')}>👎 {item.dislikes}</button>
        <span>{item.commentsCount} коментарів</span>
      </div>
      <div className="feed-comments">{item.comments?.map((entry, index) => <p key={`${entry.createdAt}-${index}`}><strong>{entry.author}:</strong> {entry.text}</p>)}</div>
      <form className="comment-form" onSubmit={submitComment}>
        <input aria-label="Ваш нік" placeholder="Ваш нік" value={comment.author} onChange={(e) => setComment({ ...comment, author: e.target.value })} />
        <input aria-label="Текст коментаря" placeholder="Текст коментаря" value={comment.text} onChange={(e) => setComment({ ...comment, text: e.target.value })} />
        <button disabled={busy} type="submit">Надіслати</button>
      </form>
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

  const loadFeed = () => fetch(`${BACKEND_URL}/api/news/feed`).then((response) => response.ok ? response.json() : []).then(setFeed).catch(() => setFeed([]));
  useEffect(() => { loadFeed(); }, []);

  return (
    <div className="news-home">
      <img className="bg-image" src={BG_MONOCHROME_ASSET} alt="" />

      <header className="news-home-header">
        <div className="news-home-logo">Borukva News</div>

        <button className="publish-news-btn news-home-publish-btn" onClick={() => navigate('/generator')}>
          Опублікувати новину <span aria-hidden="true">+</span>
        </button>

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
      </header>

      <main className="news-home-main">
        {!feedPage && <Carousel navigate={navigate} />}

        {feedPage && (
          <section className="feed-section feed-page-section" id="feed">
            <div className="feed-section-heading"><span className="section-kicker">BORUKVA / LIVE</span><h1>Повний feed</h1><button onClick={loadFeed}>Оновити</button></div>
            {feed.map((item) => <FeedItem key={item.id} item={item} onRefresh={loadFeed} />)}
            {!feed.length && <p className="feed-empty">Стрічка завантажується або ще не має опублікованих випусків.</p>}
          </section>
        )}
        {!feedPage && <SideFeedWidget items={feed} onSelect={() => navigate('/feed')} />}

        <div className="news-home-footer">
          <p>Останні новини та оновлення на Борукві</p>
          <p className="footer-copy">© {new Date().getFullYear()} Borukva News. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
