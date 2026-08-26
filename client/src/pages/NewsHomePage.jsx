import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DROPDOWN_MENUS, HOME_CAROUSEL_ITEMS, SERVER_WIKI_URL, BG_MONOCHROME_ASSET } from '../data/issues';

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

export function NewsHomePage() {
  const navigate = useNavigate();

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
      </header>

      <main className="news-home-main">
        <Carousel navigate={navigate} />

        <div className="news-home-footer">
          <p>Останні новини та оновлення на Борукві</p>
          <p className="footer-copy">© {new Date().getFullYear()} Borukva News. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
