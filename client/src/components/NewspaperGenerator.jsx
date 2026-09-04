import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { HotspotDevLayer } from './HotspotLayer';
import { assetUrl } from '../data/issues';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'https://borukva-news-github-io.onrender.com').replace(/\/+$/, '');
const PROFILE_KEY = 'borukva-news-profile';

function getSavedProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); } catch { return {}; }
}

const PRESET_BACKGROUNDS = [
  { id: 'paper1', label: 'Фон Borukva', path: assetUrl('assets/pictures/bg/bg_borukva.png') },
  { id: 'paper2', label: 'Фон Borukva монохромний', path: assetUrl('assets/pictures/bg/bg_borukva-monochrome.png') },
];

export default function NewspaperGenerator() {
  const navigate = useNavigate();
  const [docName, setDocName] = useState('Газета_29.03-10.05');
  const savedProfile = getSavedProfile();
  const [authorNick, setAuthorNick] = useState(savedProfile.author || '');
  const [authorEmail, setAuthorEmail] = useState(savedProfile.authorEmail || '');
  const [pages, setPages] = useState([
    { id: 1, background: PRESET_BACKGROUNDS[0]?.path || '', elements: [], hotspots: [] },
  ]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedElId, setSelectedElId] = useState(null);
  const [hotspotMode, setHotspotMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [shortcutStatus, setShortcutStatus] = useState('');
  const [hasCopiedElement, setHasCopiedElement] = useState(false);

  const pageRef = useRef(null);
  const historyRef = useRef([]);
  const copiedElementRef = useRef(null);
  const dragStateRef = useRef(null);
  const currentPage = pages[activePageIndex];

  // ── Робота зі сторінками ──
  const addPage = () => {
    const newPage = {
      id: pages.length + 1,
      background: currentPage.background,
      elements: [],
      hotspots: [],
    };
    setPages([...pages, newPage]);
    setActivePageIndex(pages.length);
  };

  const updateCurrentPage = (updater) => {
    setPages((prev) => {
      historyRef.current = [...historyRef.current.slice(-49), prev];
      return prev.map((page, idx) => (idx === activePageIndex ? updater(page) : page));
    });
  };

  const updateElementsWithoutHistory = (updater) => {
    setPages((prev) => prev.map((page, idx) => (
      idx === activePageIndex ? { ...page, elements: updater(page.elements) } : page
    )));
  };

  const createElementId = () => Date.now() + Math.random();

  const clampElement = (element) => ({
    ...element,
    left: Math.max(0, Math.min(600 - Math.max(20, element.width), element.left)),
    top: Math.max(0, Math.min(850 - Math.max(2, element.height), element.top)),
    width: Math.max(20, Math.min(600, element.width)),
    height: Math.max(2, Math.min(850, element.height)),
  });

  const startElementDrag = (event, element, mode = 'move', handle = '') => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedElId(element.id);
    historyRef.current = [...historyRef.current.slice(-49), pages];
    dragStateRef.current = { id: element.id, element, mode, handle, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
  };

  const copySelectedElement = () => {
    const selected = currentPage.elements.find((element) => element.id === selectedElId);
    if (!selected) return;
    copiedElementRef.current = { ...selected };
    setHasCopiedElement(true);
    setShortcutStatus('Елемент скопійовано');
  };

  const pasteElement = () => {
    if (!copiedElementRef.current) {
      setShortcutStatus('Спочатку скопіюйте елемент');
      return;
    }
    const copy = { ...copiedElementRef.current, id: createElementId(), left: copiedElementRef.current.left + 20, top: copiedElementRef.current.top + 20 };
    updateCurrentPage((page) => ({ ...page, elements: [...page.elements, clampElement(copy)] }));
    setSelectedElId(copy.id);
    setShortcutStatus('Елемент вставлено');
  };

  const undoAction = () => {
    if (!historyRef.current.length) {
      setShortcutStatus('Немає дій для скасування');
      return;
    }
    setPages(historyRef.current.pop());
    setSelectedElId(null);
    setShortcutStatus('Дію скасовано');
  };

  useEffect(() => {
    function moveElement(event) {
      const drag = dragStateRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      const next = { ...drag.element };
      if (drag.mode === 'move') {
        next.left += dx;
        next.top += dy;
      } else {
        next.width += drag.handle.includes('right') ? dx : -dx;
        next.height += drag.handle.includes('bottom') ? dy : -dy;
        if (drag.handle.includes('left')) next.left += dx;
        if (drag.handle.includes('top')) next.top += dy;
      }
      updateElementsWithoutHistory((elements) => elements.map((element) => (
        element.id === drag.id ? clampElement(next) : element
      )));
    }
    const finishElementDrag = () => { dragStateRef.current = null; };
    window.addEventListener('pointermove', moveElement);
    window.addEventListener('pointerup', finishElementDrag);
    return () => {
      window.removeEventListener('pointermove', moveElement);
      window.removeEventListener('pointerup', finishElementDrag);
    };
  }, [activePageIndex, pages]);

  useEffect(() => {
    function handleKeyboard(event) {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) return;
      if (!event.ctrlKey && !event.metaKey) return;
      const key = event.key.toLowerCase();
      if (key === 'c' && selectedElId) {
        event.preventDefault();
        copySelectedElement();
      } else if (key === 'v') {
        event.preventDefault();
        pasteElement();
      } else if (key === 'z') {
        event.preventDefault();
        undoAction();
      }
    }
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [currentPage, selectedElId]);

  // ── Зміна фону ──
  const handleCustomBackground = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateCurrentPage((page) => ({ ...page, background: url }));
    }
  };

  // ── Додавання елементів ──
  const addTextElement = () => {
    const newText = {
      id: Date.now(),
      type: 'text',
      content: 'Текст новини...',
      isBold: false,
      isItalic: false,
      fontSize: 16,
      left: 50,
      top: 100,
      width: 300,
      height: 80,
    };
    updateCurrentPage((p) => ({ ...p, elements: [...p.elements, newText] }));
    setSelectedElId(newText.id);
  };

  const addImageElement = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imgUrl = URL.createObjectURL(file);
      const newImg = {
        id: Date.now(),
        type: 'image',
        url: imgUrl,
        left: 50,
        top: 200,
        width: 300,
        height: 200,
        scale: 1,
      };
      updateCurrentPage((p) => ({ ...p, elements: [...p.elements, newImg] }));
      setSelectedElId(newImg.id);
    }
  };

  const addLineElement = () => {
    const newLine = {
      id: Date.now(),
      type: 'line',
      left: 50,
      top: 150,
      width: 500,
      height: 2,
    };
    updateCurrentPage((p) => ({ ...p, elements: [...p.elements, newLine] }));
  };

  // ── Редагування вибраного текстового елемента ──
  const updateSelectedElement = (key, value) => {
    if (!selectedElId) return;
    updateCurrentPage((p) => ({
      ...p,
      elements: p.elements.map((el) => (el.id === selectedElId ? { ...el, [key]: value } : el)),
    }));
  };

  // ── Генерація PNG картинки ──
  const capturePageImage = async () => {
    if (!pageRef.current) return null;
    return await toPng(pageRef.current, { cacheBust: true, width: 600, height: 850, pixelRatio: 2 });
  };

  const waitForPageRender = () => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  // ── Збереження на свій ПК ──
  const handleSaveToDevice = async () => {
    setIsExporting(true);
    const dataUrl = await capturePageImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `${docName}_стор_${activePageIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
    }
    setIsExporting(false);
  };

  // ── Передача пропозиції на backend ──
  const handleSendToReview = async () => {
    if (!docName.trim() || !authorNick.trim() || !authorEmail.trim()) {
      alert('Заповніть назву, нікнейм та Email перед відправкою!');
      return;
    }

    setIsExporting(true);

    try {
      const originalPageIndex = activePageIndex;
      setSelectedElId(null);
      const images = [];
      for (let index = 0; index < pages.length; index += 1) {
        setActivePageIndex(index);
        await waitForPageRender();
        images.push(await capturePageImage());
      }
      setActivePageIndex(originalPageIndex);
      const response = await fetch(`${BACKEND_URL}/api/propose-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: docName, authorNick, authorEmail, images, hotspots: pages.flatMap((page, index) => page.hotspots.map((hotspot) => ({ ...hotspot, page: index + 1 }))) }),
      });
      if (!response.ok) throw new Error(await response.text());

      const result = await response.json();
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ author: authorNick.trim(), authorEmail: authorEmail.trim() }));
      alert(result.mailSent
        ? `Новину ${result.id} збережено як чернетку та відправлено на модерацію.`
        : `Новину ${result.id} збережено як чернетку, але лист модератору не надіслано. Перевірте SMTP налаштування на Render.`);
    } catch (err) {
      console.error(err);
      alert('Помилка при відправці файлів.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedElement = currentPage.elements.find((el) => el.id === selectedElId);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* ── Ліва Панель Управління ── */}
      <div style={{ width: '340px', background: '#222', padding: '16px', overflowY: 'auto', borderRight: '2px solid #444' }}>
        <button onClick={() => navigate('/')} style={{ marginBottom: '14px' }}>
          ← На головний екран
        </button>
        <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>ГЕНЕРАТОР НОВИН</h2>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <button onClick={copySelectedElement} disabled={!selectedElement}>Копіювати</button>
          <button onClick={pasteElement} disabled={!hasCopiedElement}>Вставити</button>
          <button onClick={undoAction}>Скасувати</button>
        </div>
        {shortcutStatus && <div style={{ color: '#80c7ff', fontSize: '12px', marginBottom: '12px' }}>{shortcutStatus}</div>}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Назва випуску:</label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            style={{ width: '100%', padding: '8px', background: '#333', color: '#fff', border: '1px solid #555' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Ваш нікнейм:</label>
          <input type="text" value={authorNick} onChange={(e) => setAuthorNick(e.target.value)} style={{ width: '100%', padding: '8px', background: '#333', color: '#fff', border: '1px solid #555' }} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Ваш Email:</label>
          <input type="email" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} style={{ width: '100%', padding: '8px', background: '#333', color: '#fff', border: '1px solid #555' }} />
        </div>

        {/* Вибір фону */}
        <div style={{ marginBottom: '16px', borderTop: '1px solid #444', paddingTop: '12px' }}>
          <h3 style={{ fontSize: '14px' }}>Фон сторінки</h3>
          <select
            onChange={(e) => updateCurrentPage((p) => ({ ...p, background: e.target.value }))}
            style={{ width: '100%', padding: '6px', marginBottom: '8px', background: '#333', color: '#fff' }}
          >
            {PRESET_BACKGROUNDS.map((bg) => (
              <option key={bg.id} value={bg.path}>{bg.label}</option>
            ))}
          </select>
          <input type="file" accept="image/*" onChange={handleCustomBackground} style={{ fontSize: '10px' }} />
        </div>

        {/* Додавання елементів */}
        <div style={{ marginBottom: '16px', borderTop: '1px solid #444', paddingTop: '12px' }}>
          <h3 style={{ fontSize: '14px' }}>Елементи</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={addTextElement}>+ Текст</button>
            <label style={{ background: '#444', color: '#fff', padding: '6px', textAlign: 'center', cursor: 'pointer', fontSize: '12px' }}>
              + Додати Фото
              <input type="file" accept="image/*" onChange={addImageElement} style={{ display: 'none' }} />
            </label>
            <button onClick={addLineElement}>+ Лінія</button>
            <button
              onClick={() => setHotspotMode((enabled) => !enabled)}
              style={{ background: hotspotMode ? '#007acc' : '#333' }}
            >
              {hotspotMode ? 'Завершити hotspot' : '+ Додати hotspot'}
            </button>
          </div>
        </div>

        {selectedElement && selectedElement.type === 'image' && (
          <div style={{ marginBottom: '16px', borderTop: '1px solid #444', paddingTop: '12px' }}>
            <h3 style={{ fontSize: '14px' }}>Розмір фото</h3>
            <label style={{ display: 'block', fontSize: '12px' }}>
              Масштаб: {Math.round((selectedElement.scale || 1) * 100)}%
              <input
                type="range"
                min="0.25"
                max="3"
                step="0.05"
                value={selectedElement.scale || 1}
                onChange={(e) => updateSelectedElement('scale', Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </label>
          </div>
        )}

        {selectedElement && (
          <div style={{ marginBottom: '16px', borderTop: '1px solid #444', paddingTop: '12px' }}>
            <h3 style={{ fontSize: '14px' }}>Поворот елемента</h3>
            <label style={{ display: 'block', fontSize: '12px' }}>
              Кут: {Math.round(selectedElement.rotation || 0)}°
              <input type="range" min="-180" max="180" step="1" value={selectedElement.rotation || 0} onChange={(e) => updateSelectedElement('rotation', Number(e.target.value))} style={{ width: '100%' }} />
            </label>
            <input type="number" min="-360" max="360" value={selectedElement.rotation || 0} onChange={(e) => updateSelectedElement('rotation', Number(e.target.value))} style={{ width: '80px', padding: '5px', background: '#333', color: '#fff', border: '1px solid #555' }} />
          </div>
        )}

        {/* Форматування вибраного тексту */}
        {selectedElement && selectedElement.type === 'text' && (
          <div style={{ marginBottom: '16px', borderTop: '1px solid #444', paddingTop: '12px' }}>
            <h3 style={{ fontSize: '14px' }}>Форматування тексту</h3>
            <textarea
              value={selectedElement.content}
              onChange={(e) => updateSelectedElement('content', e.target.value)}
              rows={4}
              style={{ width: '100%', background: '#333', color: '#fff', padding: '6px' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                style={{ fontWeight: selectedElement.isBold ? 'bold' : 'normal', background: selectedElement.isBold ? '#555' : '#333' }}
                onClick={() => updateSelectedElement('isBold', !selectedElement.isBold)}
              >
                Ж
              </button>
              <button
                style={{ fontStyle: selectedElement.isItalic ? 'italic' : 'normal', background: selectedElement.isItalic ? '#555' : '#333' }}
                onClick={() => updateSelectedElement('isItalic', !selectedElement.isItalic)}
              >
                К
              </button>
            </div>
            <label style={{ display: 'block', fontSize: '12px', marginTop: '10px' }}>
              Розмір шрифту: {selectedElement.fontSize}px
              <input type="range" min="8" max="96" step="1" value={selectedElement.fontSize} onChange={(e) => updateSelectedElement('fontSize', Number(e.target.value))} style={{ width: '100%' }} />
            </label>
            <input type="number" min="8" max="200" value={selectedElement.fontSize} onChange={(e) => updateSelectedElement('fontSize', Number(e.target.value))} style={{ width: '80px', padding: '5px', background: '#333', color: '#fff', border: '1px solid #555' }} />
          </div>
        )}

        {/* Сторінки */}
        <div style={{ marginBottom: '16px', borderTop: '1px solid #444', paddingTop: '12px' }}>
          <h3 style={{ fontSize: '14px' }}>Сторінки ({pages.length})</h3>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {pages.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => { setActivePageIndex(idx); setSelectedElId(null); }}
                style={{ background: idx === activePageIndex ? '#007acc' : '#333' }}
              >
                Стор. {idx + 1}
              </button>
            ))}
          </div>
          <button onClick={addPage}>+ Додати сторінку</button>
        </div>

        {/* Дії/Збереження */}
        <div style={{ borderTop: '1px solid #444', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={handleSaveToDevice} disabled={isExporting}>Зберегти собі</button>
          <button onClick={handleSendToReview} disabled={isExporting} style={{ background: '#e67e22' }}>
            Відправити на розгляд
          </button>
        </div>
      </div>

      {/* ── Область полотна (Canvas) ── */}
      <div style={{ flex: 1, background: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', padding: '20px' }}>
        <div
          ref={pageRef}
          className="newspaper-page"
          style={{
            position: 'relative',
            width: '600px',
            height: '850px',
            minWidth: '600px',
            minHeight: '850px',
            flex: '0 0 600px',
            backgroundImage: currentPage.background ? `url(${currentPage.background})` : 'none',
            backgroundColor: '#dcd6cd',
            backgroundSize: 'cover',
            color: '#000',
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          {/* Автоматична шапка */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '12px', fontSize: '14px' }}>
            <span>НОВИНИ БОРУКВИ</span>
            {pages.length > 1 && <span>Сторінка {activePageIndex + 1}</span>}
          </div>

          {/* Рендеринг елементів сторінки */}
          {currentPage.elements.map((el) => {
            const selected = selectedElId === el.id;
            const scale = el.type === 'image' ? (el.scale || 1) : 1;
            return (
              <div
                key={el.id}
                onPointerDown={(event) => startElementDrag(event, el)}
                style={{
                  position: 'absolute',
                  left: `${el.left}px`,
                  top: `${el.top}px`,
                  width: `${el.width * scale}px`,
                  height: `${el.height * scale}px`,
                  transform: `rotate(${el.rotation || 0}deg)`,
                  transformOrigin: 'center',
                  cursor: 'move',
                  outline: selected ? '1px dashed #007acc' : 'none',
                  zIndex: selected ? 3 : 1,
                }}
              >
                {el.type === 'text' && (
                  <div style={{ width: '100%', height: '100%', fontWeight: el.isBold ? 'bold' : 'normal', fontStyle: el.isItalic ? 'italic' : 'normal', fontSize: `${el.fontSize}px`, whiteSpace: 'pre-wrap', overflow: 'hidden' }}>
                    {el.content}
                  </div>
                )}
                {el.type === 'image' && <img src={el.url} alt="Новина" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                {el.type === 'line' && <div style={{ width: '100%', height: '100%', backgroundColor: '#000' }} />}
                {selected && ['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((handle) => (
                  <span
                    key={handle}
                    onPointerDown={(event) => startElementDrag(event, el, 'resize', handle)}
                    style={{ position: 'absolute', width: '10px', height: '10px', background: '#007acc', border: '1px solid #fff', cursor: `${handle}-resize`, ...(handle.includes('top') ? { top: '-5px' } : { bottom: '-5px' }), ...(handle.includes('left') ? { left: '-5px' } : { right: '-5px' }) }}
                  />
                ))}
              </div>
            );
          })}

          {/* Шар Хотспотів */}
          {hotspotMode && (
            <HotspotDevLayer
              hotspots={currentPage.hotspots}
              imageSize={{ width: 600, height: 850 }}
              onChange={(newSpots) => updateCurrentPage((p) => ({ ...p, hotspots: newSpots }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}