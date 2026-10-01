import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CircleHelp, Search, UserRound } from 'lucide-react';
import { BG_BLUE_ASSET } from '../data/issues';
import { CHARACTERS, sortCharacters } from '../data/characters';

function getTagLabel(tag) {
  return tag.includes(':') ? tag.slice(tag.indexOf(':') + 1) : tag;
}

export function CharacterCatalogPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('-відзначився:???');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [searchFocused, setSearchFocused] = useState(false);

  const tagSuggestions = useMemo(() => (
    [...new Set(CHARACTERS.flatMap((character) => character.tags || []))]
      .sort((left, right) => left.localeCompare(right))
  ), []);

  const matchingSuggestions = useMemo(() => {
    const trimmedQuery = query.trimEnd().toLocaleLowerCase();
    const negativeStart = trimmedQuery.lastIndexOf(' -');
    const activeFilter = negativeStart >= 0
      ? trimmedQuery.slice(negativeStart + 2)
      : trimmedQuery.startsWith('-')
        ? trimmedQuery.slice(1)
        : trimmedQuery;
    return tagSuggestions.filter((tag) => tag.toLocaleLowerCase().includes(activeFilter));
  }, [query, tagSuggestions]);

  function completeSearch(suggestion) {
    if (!suggestion) return;
    const trimmedQuery = query.trimEnd();
    const negativeStart = trimmedQuery.lastIndexOf(' -');
    if (negativeStart >= 0) {
      setQuery(`${trimmedQuery.slice(0, negativeStart + 2)}${suggestion}`);
    } else if (trimmedQuery.startsWith('-')) {
      setQuery(`-${suggestion}`);
    } else if (query.length > trimmedQuery.length) {
      setQuery(`${trimmedQuery} ${suggestion}`.trim());
    } else {
      setQuery(suggestion);
    }
    setSearchFocused(false);
  }

  const visibleCharacters = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const [positiveFilter, ...excludedFilters] = normalizedQuery.startsWith('-')
      ? ['', ...normalizedQuery.slice(1).split(/\s+-/)]
      : normalizedQuery.split(/\s+-/);
    const filteredCharacters = CHARACTERS
      .filter((character) => {
        const searchableText = [character.name, ...(character.tags || [])].join(' ').toLocaleLowerCase();
        return (!positiveFilter.trim() || searchableText.includes(positiveFilter.trim()))
          && excludedFilters.every((filter) => !filter.trim() || !searchableText.includes(filter.trim()));
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
          <div className="characters-search-control">
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
                      onClick={() => completeSearch(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className="characters-filter-help"
              aria-label="Підказка про виключення фільтрів"
              aria-describedby="characters-filter-help-tooltip"
            >
              <CircleHelp size={18} />
              <span className="characters-filter-tooltip" id="characters-filter-help-tooltip" role="tooltip">
                Поставте «-» перед фільтром, щоб виключити його. Наприклад: -країна:Хапонія
              </span>
            </button>
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
