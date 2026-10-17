import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  DROPDOWN_MENUS,
  HOME_CAROUSEL_ITEMS,
  HOME_TICKER_ITEMS,
  SERVER_WIKI_URL,
  BG_MONOCHROME_ASSET,
} from '../data/issues';

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

function MobileMenu({ navigate, onPublishClick }) {
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
          <button className="mobile-menu-publish" onClick={() => {
            setOpen(false);
            onPublishClick();
          }}>
            <span>Опублікувати новину</span>
            <ArrowRight size={14} aria-hidden="true" />
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

function NewsTicker() {
  function renderTickerText(text, keyPrefix) {
    const parts = [];
    const pattern = /link\{([^{}]*)\}\[([^\]]*)\]|bold\{([^{}]*)\}|italic\{([^{}]*)\}|underline\{([^{}]*)\}|under\{([^{}]*)\}|underscore\{([^{}]*)\}|quote\{([^{}]*)\}/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
      if (match[1] !== undefined) {
        const href = /^(https?:\/\/|\/|#)/i.test(match[1].trim()) ? match[1].trim() : '#';
        parts.push(
          <a key={`${keyPrefix}-link-${match.index}`} href={href}>
            {renderTickerText(match[2], `${keyPrefix}-link-${match.index}`)}
          </a>,
        );
      } else if (match[3] !== undefined) {
        parts.push(
          <strong key={`${keyPrefix}-bold-${match.index}`}>
            {renderTickerText(match[3], `${keyPrefix}-bold-${match.index}`)}
          </strong>,
        );
      } else if (match[4] !== undefined) {
        parts.push(
          <em key={`${keyPrefix}-italic-${match.index}`} className="news-ticker-italic">
            {renderTickerText(match[4], `${keyPrefix}-italic-${match.index}`)}
          </em>,
        );
      } else if (match[5] !== undefined || match[6] !== undefined || match[7] !== undefined) {
        const underlineText = match[5] ?? match[6] ?? match[7];
        parts.push(
          <span key={`${keyPrefix}-underline-${match.index}`} className="news-ticker-underline">
            {renderTickerText(underlineText, `${keyPrefix}-underline-${match.index}`)}
          </span>,
        );
      } else {
        parts.push(
          <span key={`${keyPrefix}-quote-${match.index}`} className="news-ticker-quote">
            {renderTickerText(match[8], `${keyPrefix}-quote-${match.index}`)}
          </span>,
        );
      }
      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  }

  const renderItems = () => HOME_TICKER_ITEMS.map((item, index) => (
    <span className="news-ticker-item" key={`${item}-${index}`}>
      {renderTickerText(item, `ticker-${index}`)}
    </span>
  ));

  return (
    <aside className="news-ticker" aria-label="Останні новини">
      <span className="news-ticker-label">LIVE</span>
      <div className="news-ticker-viewport">
        <div className="news-ticker-track">
          <div className="news-ticker-group">{renderItems()}</div>
          <div className="news-ticker-group" aria-hidden="true">{renderItems()}</div>
        </div>
      </div>
    </aside>
  );
}

export function NewsHomePage() {
  const navigate = useNavigate();
  const [publishNotice, setPublishNotice] = useState(false);
  const publishNoticeTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(publishNoticeTimer.current), []);

  function showPublishNotice() {
    setPublishNotice(true);
    window.clearTimeout(publishNoticeTimer.current);
    publishNoticeTimer.current = window.setTimeout(() => setPublishNotice(false), 3000);
  }

  return (
    <div className="news-home">
      <div className="bg-image" style={{ backgroundImage: `url(${BG_MONOCHROME_ASSET})` }} aria-hidden="true" />

      <header className="news-home-header">
        <div className="news-home-logo">Borukva News</div>

        <nav className="news-home-nav desktop-only">
          {Object.entries(DROPDOWN_MENUS).map(([category, items]) => (
            <Dropdown key={category} title={category} items={items} navigate={navigate} />
          ))}
        </nav>

        <button className="publish-news-btn news-home-publish-btn desktop-only" onClick={showPublishNotice}>
          <span>Опублікувати новину</span>
          <ArrowRight size={14} aria-hidden="true" />
        </button>

        <button className="play-server-btn desktop-only" onClick={() => window.open(SERVER_WIKI_URL, '_blank')}>
          Грати на сервері
        </button>

        <div className="mobile-only">
          <MobileMenu navigate={navigate} onPublishClick={showPublishNotice} />
        </div>
      </header>

      {publishNotice && (
        <div className="publish-news-toast" role="status" aria-live="polite">
          Публікація новин тимчасово недоступна
        </div>
      )}

      <main className="news-home-main">
        <Carousel navigate={navigate} />
        <NewsTicker />

        <div className="news-home-footer">
          <p>Останні новини та оновлення на Борукві</p>
          <p className="footer-copy">© {new Date().getFullYear()} Borukva News. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
