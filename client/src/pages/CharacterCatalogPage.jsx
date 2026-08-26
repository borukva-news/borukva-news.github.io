import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, UserRound } from 'lucide-react';
import { BG_BLUE_ASSET } from '../data/issues';
import { CHARACTERS, sortCharacters } from '../data/characters';

function getTagLabel(tag) {
  return tag.includes(':') ? tag.slice(tag.indexOf(':') + 1) : tag;
}

export function CharacterCatalogPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [searchFocused, setSearchFocused] = useState(false);

  const tagSuggestions = useMemo(() => (
    [...new Set(CHARACTERS.flatMap((character) => character.tags || []))]
      .sort((left, right) => left.localeCompare(right))
  ), []);

  const matchingSuggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return tagSuggestions.filter((tag) => tag.toLocaleLowerCase().includes(normalizedQuery));
  }, [query, tagSuggestions]);

  function completeSearch(suggestion) {
    if (!suggestion) return;
    setQuery(suggestion);
    setSearchFocused(false);
  }

  const visibleCharacters = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filteredCharacters = CHARACTERS
      .filter((character) => {
        if (!normalizedQuery) return true;
        const searchableText = [character.name, ...(character.tags || [])].join(' ').toLocaleLowerCase();
        return searchableText.includes(normalizedQuery);
      });
    return sortCharacters(filteredCharacters, sortOrder);
  }, [query, sortOrder]);

  return (
    <div className="characters-page">
      <div className="cardviewer-bg" style={{ backgroundImage: `url("${BG_BLUE_ASSET}")` }} />
      <div className="characters-content">
        <header className="characters-header">
          <button className="square-icon-btn" onClick={() => navigate('/')} title="На головну сайту">
            <ChevronLeft size={24} />
          </button>
          <h1>ГРАВЦІ</h1>
        </header>
        <div className="characters-toolbar">
          <div className="characters-search-wrap">
            <label className="characters-search">
              <Search size={18} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onKeyDown={(event) => {
                  if ((event.key === 'Tab' || event.key === 'Enter') && matchingSuggestions.length > 0) {
                    event.preventDefault();
                    completeSearch(matchingSuggestions[0]);
                  }
                }}
                placeholder="Пошук за ім’ям або тегом"
                aria-label="Пошук за ім’ям або тегом"
              />
            </label>
            {searchFocused && matchingSuggestions.length > 0 && (
              <div className="characters-search-suggestions">
                {matchingSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="characters-search-suggestion"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setQuery(suggestion);
                      setSearchFocused(false);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <label className="characters-sort">
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Сортування персонажів">
              <option value="name-asc">Сортувати: ім’ям А-Я</option>
              <option value="name-desc">Сортувати: ім’ям Я-А</option>
              <option value="rarity">Сортувати: рідкістю</option>
            </select>
          </label>
        </div>
        <main className="characters-catalog">
          {visibleCharacters.map((character) => (
            <button
              key={character.id}
              className="character-catalog-card"
              onClick={() => navigate(`/skins?character=${encodeURIComponent(character.id)}&sort=${sortOrder}`)}
            >
              <span className="character-catalog-icon">
                {character.avatarPath ? (
                  <img src={character.avatarPath} alt={character.name} />
                ) : (
                  <UserRound size={42} />
                )}
              </span>
              <span className="character-catalog-name">{character.name}</span>
              <span className="character-catalog-rarity">{character.rarity}</span>
              <span className="character-catalog-tags">
                {(character.tags || []).map((tag, tagIndex) => (
                  <span key={tag} className={`character-tag character-tag-${tagIndex % 4}`}>{getTagLabel(tag)}</span>
                ))}
              </span>
            </button>
          ))}
        </main>
        {visibleCharacters.length === 0 && <p className="characters-empty">Нічого не знайдено</p>}
      </div>
    </div>
  );
}
