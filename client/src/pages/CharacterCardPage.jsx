import { useEffect, useState } from 'react';
import './CharacterCardPage.css';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { ModelViewport } from '../components/ModelViewport';
import ModelViewportMobile from '../components/ModelViewportMobile';
import { useIsMobile } from '../hooks/useIsMobile';
import { BG_BLUE_ASSET } from '../data/issues';
import { CHARACTERS, sortCharacters } from '../data/characters';

const RARITY_CLASS = {
  'Гравець': 'rarity-common',
  'Особливий хлопчик': 'rarity-uncommon',
  'Недоторканий (ютубер)': 'rarity-rare',
  'Журналіст': 'rarity-exceptional',
  'Епічний': 'rarity-epic',
  'Власник': 'rarity-legendary',
  'Меценат': 'rarity-mythic',
  'Божественний': 'rarity-divine',
  'Адмін': 'rarity-mysterious',
  'Райдужний': 'rarity-rainbow',
};

function getSafeHref(href) {
  return /^(https?:\/\/|\/|#)/i.test(href.trim()) ? href.trim() : '#';
}

function renderInlineText(text, keyPrefix) {
  const parts = [];
  const pattern = /link\{([^{}]*)\}\[([^\]]*)\]|bold\{([^{}]*)\}|quote\{([^{}]*)\}|(Поточна Країна:)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      parts.push(<a key={`${keyPrefix}-link-${match.index}`} className="feature-link" href={getSafeHref(match[1])}>{renderInlineText(match[2], `${keyPrefix}-link-${match.index}`)}</a>);
      // як писати лінк = link{https://borukva-news.github.io/borukvanews}[текст лінку]
    } else if (match[3] !== undefined) {
      parts.push(<strong key={`${keyPrefix}-bold-${match.index}`}>{renderInlineText(match[3], `${keyPrefix}-bold-${match.index}`)}</strong>);
    } else if (match[4] !== undefined) {
      parts.push(<span key={`${keyPrefix}-quote-${match.index}`} className="feature-quote">{renderInlineText(match[4], `${keyPrefix}-quote-${match.index}`)}</span>);
    } else {
      parts.push(<span key={`${keyPrefix}-country-${match.index}`} className="feature-country-label">{match[5]}</span>);
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function FeatureRow({ text, isFirst }) {
  const paragraphs = text.replace(/\\n/g, '\n').split(/\r?\n/);

  return (
    <div className="feature-row">
      <p>
        {isFirst && <><span className="feature-label">Опис:</span>{' '}</>}
        <span className="feature-text">
          {paragraphs.map((paragraph, index) => (
            <span key={index} className="feature-paragraph">{renderInlineText(paragraph, `paragraph-${index}`)}</span>
          ))}
        </span>
      </p>
    </div>
  );
}

function CharacterCard({  character,
  index,
  total,
  onPrevious,
  onNext, }) {
  
  const [animationName, setAnimationName] = useState('idle');
  const [skinId, setSkinId] = useState(character.skins[0]?.id);
  const [autoRotate, setAutoRotate] = useState(false);
  const animations = character.model.animations || [];
  const activeSkin = character.skins.find((skin) => skin.id === skinId) || character.skins[0];

  useEffect(() => {
    setSkinId(character.skins[0]?.id);
    setAnimationName('idle');
  }, [character]);

  useEffect(() => {
    const current = animations.find((animation) => animation.name === animationName);
    const timer = window.setTimeout(() => {
      setAnimationName((name) => (name === 'idle' ? 'hit' : 'idle'));
    }, Math.max((current?.length || 1) * 1000, 1));
    return () => window.clearTimeout(timer);
  }, [animationName, animations]);

  const isMobile = useIsMobile();

  return (
    <div className="char-card">
      <div className="card-grid">
        <div className="card-viewport-col">
          <div className="card-viewport">
            {isMobile ? (
              <ModelViewportMobile
                bbmodel={character.model}
                textureOverrides={activeSkin.overrides}
                animationName={animationName}
                playing
                autoRotate={autoRotate}
                onSelectElement={() => setAnimationName('idle')}
              />
            ) : (
              <ModelViewport
                bbmodel={character.model}
                textureOverrides={activeSkin.overrides}
                animationName={animationName}
                playing
                autoRotate={autoRotate}
                onSelectElement={() => setAnimationName('idle')}
              />
            )}
            <div className="viewport-tools">
              <button className={`tool-btn ${autoRotate ? 'active' : ''}`} onClick={() => setAutoRotate((value) => !value)} title="Автообертання"><RotateCw size={16} /></button>
            </div>
          </div>
        </div>
        <div className="card-info-col">
          <div className={`title-ribbon ${RARITY_CLASS[character.rarity]}`}><p>{character.name}</p></div>
          <p className={`rarity-label ${RARITY_CLASS[character.rarity]}`}>{character.rarity.toUpperCase()}</p>
          <div className="feature-list">
            {character.characteristics.map((bullet, bulletIndex) => <FeatureRow key={bullet} text={bullet} isFirst={bulletIndex === 0} />)}
          </div>
        </div>
        
      </div>
      <div className="skins-panel">
        <p className="skins-panel-title">СКІНИ</p>
        <div className="skins-row">
          {character.skins.map((skin) => (
            <button key={skin.id} className={`skin-thumb ${skin.id === skinId ? 'active' : ''}`} onClick={() => setSkinId(skin.id)}>
              <p>{skin.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CharacterCardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get('character');
  const sortOrder = searchParams.get('sort') || 'name-asc';
  const sortedCharacters = sortCharacters(CHARACTERS, sortOrder);
  const selectedIndex = Math.max(0, sortedCharacters.findIndex((character) => character.id === selectedId));
  const [index, setIndex] = useState(selectedIndex);
  useEffect(() => setIndex(selectedIndex), [selectedIndex]);
  const character = sortedCharacters[index];
  return (
    <div className="cardviewer-page">
      <div className="cardviewer-bg" style={{ backgroundImage: `url("${BG_BLUE_ASSET}")` }} />
      <div className="cardviewer-content">
        <div className="cardviewer-topbar">
          <button className="square-icon-btn" onClick={() => navigate('/characters')} title="Гравці"><ChevronLeft size={24} /></button>
        </div>
        <div className="cardviewer-row">
          <button className="chevron-btn" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))} title="Попередній персонаж">
            <ChevronLeft size={30} strokeWidth={3.5} />
          </button>
          <div className="cardviewer-card-wrap"><CharacterCard character={character} /></div>
          <button className="chevron-btn" disabled={index === sortedCharacters.length - 1} onClick={() => setIndex((value) => Math.min(sortedCharacters.length - 1, value + 1))} title="Наступний персонаж">
            <ChevronRight size={30} strokeWidth={3.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
