// ─────────────────────────────────────────────────────────────────────────────
// All carousel "issues" (ported 1:1 from lib/first_screen.dart .. sixth_screen.dart)
//
// page: { type: 'image' | 'youtube', src?: string, videoId?: string }
// hotspotFile: name of the JSON file in the news-data GitHub repo for this issue
// ─────────────────────────────────────────────────────────────────────────────

export function assetUrl(p) {
  if (!p) return '';
  if (/^https?:\/\//i.test(p) || p.startsWith('data:')) return p;
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = p.startsWith('/') ? p.slice(1) : p;
  return `${cleanBase}${cleanPath}`;
}

const img = (p) => ({ type: 'image', src: assetUrl(`assets/pictures/${p}`) });
const youtube = (id) => ({ type: 'youtube', videoId: id });

export const ISSUES = {
  // ── /atRmklps — 09.02-14.02 (first_screen.dart) ──
  '09_02-14_02': {
    path: '/atRmklps',
    hotspotFile: '09_02-14_02_hotspots.json',
    pages: [
      img('09_02-14_02/title_1.png'),
      img('09_02-14_02/page_1.png'),
      img('09_02-14_02/page_2.png'),
      img('09_02-14_02/page_3.png'),
      img('09_02-14_02/page_4.png'),
      img('09_02-14_02/last_1.png'),
    ],
  },

  // ── /qizmvUxp — 15.02-21.02 (second_screen.dart) ──
  '15_02-21_02': {
    path: '/qizmvUxp',
    hotspotFile: '15_02-21_02_hotspots.json',
    pages: [
      img('15_02-21_02/15.02-21.02.png'),
      img('15_02-21_02/Газета 15-21 лют стор. 1.png'),
      img('15_02-21_02/Газета 15-21 лют стор. 2.png'),
      img('15_02-21_02/Газета 15-21 лют стор. 3.png'),
      img('15_02-21_02/Газета 15-21 лют стор. 4.png'),
      img('15_02-21_02/Газета 15-21 лют стор. 5.png'),
      img('остання стор.png'),
    ],
  },

  // ── /pLxqnrvt — 22.02-28.02 (third_screen.dart) ──
  '22_02-28_02': {
    path: '/pLxqnrvt',
    hotspotFile: '22_02-28_02_hotspots.json',
    pages: [
      img('22_02-28_02/22.02-28.02.png'),
      img('22_02-28_02/Газета 22-28 лют стор. 1.png'),
      img('22_02-28_02/Газета 22-28 лют стор. 2.png'),
      img('22_02-28_02/Газета 22-28 лют стор. 3.png'),
      img('22_02-28_02/Газета 22-28 лют стор. 4.png'),
      img('22_02-28_02/Газета 22-28 лют стор. 5.png'),
      img('остання стор.png'),
      img('22_02-28_02/Газета 22-28 лют стор. 6.png'),
      img('22_02-28_02/Газета 22-28 лют стор. 7.png'),
      img('22_02-28_02/Газета 22-28 лют стор. 8.png'),
    ],
  },

  // ── /x9t2q7wb — 01.03-14.03 (fourth_screen.dart) ──
  '01_03-14_03': {
    path: '/x9t2q7wb',
    hotspotFile: '01_03-14_03_hotspots.json',
    pages: [
      img('01_03-14_03/Титул. 1-14 бер.png'),
      img('01_03-14_03/Газета 1-14 бер стор. 1.png'),
      img('01_03-14_03/Газета 1-14 бер стор. 2.png'),
      img('01_03-14_03/Газета 1-14 бер стор. 3.png'),
      img('01_03-14_03/Газета 1-14 бер стор. 4.png'),
      img('01_03-14_03/Газета 1-14 бер стор. 5.png'),
      img('01_03-14_03/Газета 1-14 бер стор. 6.png'),
      img('01_03-14_03/Газета 1-14 бер стор. 7.png'),
      img('01_03-14_03/Газета 1-14 бер стор. 8.png'),
      img('01_03-14_03/Газета 1-14 бер стор. 9.png'),
      img('остання стор.png'),
    ],
  },

  // ── /k7m2q9vz — 15.03-29.03 (fifth_screen.dart) ──
  '15_03-29_03': {
    path: '/k7m2q9vz',
    hotspotFile: '15_03-29_03_hotspots.json',
    pages: [
      img('15_03-29_03/Титул. 15-29 бер.png'),
      img('15_03-29_03/Газета 15-29 бер стор. 1.png'),
      img('15_03-29_03/Газета 15-29 бер стор. 2.png'),
      img('15_03-29_03/Газета 15-29 бер стор. 3.png'),
      img('15_03-29_03/Газета 15-29 бер стор. 4.png'),
      img('15_03-29_03/Газета 15-29 бер стор. 5.png'),
      img('15_03-29_03/Газета 15-29 бер стор. 6.png'),
      img('остання стор.png'),
    ],
  },

  // ── /qbE34klm — Спецвипуск "Кчбнк" (kchbnk.dart) ──
  kchbnk: {
    path: '/qbE34klm',
    hotspotFile: 'kchbnk_hotspots.json',
    pages: [
      img('kchbnk/Нов руб.png'),
      img('kchbnk/Кчбнк стор.1 .png'),
      img('kchbnk/Кчбнк стор.2 .png'),
      img('kchbnk/Кчбнк стор.3 .png'),
      img('kchbnk/Кчбнк стор.4 .png'),
      img('kchbnk/Кчбнк стор.5 .png'),
      img('kchbnk/Кчбнк стор.6 .png'),
      img('kchbnk/Кчбнк стор.7 .png'),
      img('kchbnk/Кчбнк титул. .png'),
    ],
  },

  // ── /inter1 — Інтерв'ю з Артемідою (interview_artemida.dart) ──
  inter1: {
    path: '/inter1',
    hotspotFile: '09_02-14_02_hotspots.json',
    pages: [youtube('YjGYxL-vAZo')],
  },
};

// ── /l9bf3n0p — 29.03-10.05, UV overlay issue (sixth_screen.dart) ──
// uvOverlay: "invisible ink" image shown inside the torch circle
// sticky: extra photo slid up from below the page (only page 1 has one)
export const UV_ISSUE = {
  path: '/l9bf3n0p',
  hotspotFile: '29_03-10_05_hotspots.json',
  pages: [
    {
      ...img('29_03-10_05/Газета 29.03-10.05 Титул.png'),
      uvOverlay: assetUrl('assets/pictures/29_03-10_05/Газета 29.03-10.05 Титул невидимка.png'),
    },
    {
      ...img('29_03-10_05/Газета 29.03-10.05 стор. 1.png'),
      sticky: assetUrl('assets/pictures/29_03-10_05/Газета 29.03-10.05 стор. 1 додаток – фінальна.png'),
    },
    {
      ...img('29_03-10_05/Газета 29.03-10.05 стор. 2.png'),
      uvOverlay: assetUrl('assets/pictures/29_03-10_05/Газета 29.03-10.05 стор. 2 невидимка.png'),
    },
    {
      ...img('29_03-10_05/Газета 29.03-10.05 стор. 3.png'),
      uvOverlay: assetUrl('assets/pictures/29_03-10_05/Газета 29.03-10.05 стор. 3 невидимка.png'),
    },
    {
      ...img('29_03-10_05/Газета 29.03-10.05 стор. 4.png'),
      uvOverlay: assetUrl('assets/pictures/29_03-10_05/Газета 29.03-10.05 стор. 4 невидимка.png'),
    },
    {
      ...img('29_03-10_05/Газета 29.03-10.05 стор. 5.png'),
      uvOverlay: assetUrl('assets/pictures/29_03-10_05/Газета 29.03-10.05 стор. 5 невидимка.png'),
    },
    img('остання стор.png'),
  ],
};

// ── Home page ("/") dropdown menus + auto-play carousel (news_home.dart) ──
export const DROPDOWN_MENUS = {
  'Основні випуски': [
    { label: '09.02-14.02', route: '/atRmklps' },
    { label: '15.02-21.02', route: '/qizmvUxp' },
    { label: '22.02-28.02', route: '/pLxqnrvt',  },
    { label: '01.03-14.03', route: '/x9t2q7wb',  },
    { label: '15.03-29.03', route: '/k7m2q9vz',  },
    { label: '29.03-10.05', route: '/l9bf3n0p', },
  ],
  'Спецвипуски': [{ label: 'Спецвипуск 1', route: '/qbE34klm' }],
  "Інтерв'ю": [{ label: "Інтерв'ю з Артемідою", route: '/inter1' }],
  'Каталог гравців': [{ label: 'Картки персонажів (3D)', route: '/characters', isNew: true }],
};

export const HOME_CAROUSEL_ITEMS = [
  {
    image: assetUrl('assets/pictures/29_03-10_05/Газета 29.03-10.05 Титул.png'),
    route: '/l9bf3n0p',
    caption: 'Новий випуск з новим форматом!',
  },
  {
    image: assetUrl('assets/pictures/kchbnk/Нов руб.png'),
    route: '/qbE34klm',
    caption: 'Нова рубрика!',
  },
  {
    image: assetUrl('assets/pictures/skoro/5323723242159675852.jpg'),
    route: '/inter1',
    caption: "Нове інтерв'ю!",
  },
];
//  псевдоформатування: 

// bold{текст} — жирний текст
// quote{текст} — текст цитата
// italic{текст} — курсив
// underline{текст} — підкреслений текст
// under{текст} — підкреслений текст
// underscore{текст} — підкреслений текст
// link{URL}[текст] — посилання
export const HOME_TICKER_ITEMS = [
  'Результати виборів до Корита: переміг кандидат від партії "гр и б" з 34% голосів. Також до корита будуть допущені решта link{https://t.me/borukva_minecraft/1575}[underline{6 кандидатів що були в топі.}]',
  'На сервер додано ботів-помічників, доступ отримують платні підписники.',
  "Спавном тепер керує Temari_nya, слідкуйте за змінами порядку link{https://site.borukva.space/org/spavn}[underline{тут}].",
  'Невідомий варить бурду якій вже 608 годин, а вона все ще не зіпсована.',
  'Хотіли колись послухати реально нахапані треки? Радіо Хапонія - регулярно по вечорах, приєднуйтесь на сервері.',
  'link{https://site.borukva.space/org/khaponiya/post/4729872e-eab1-478c-b916-f9371e1177ac}[underline{17.10 в 21:00 відбудеться голосування за нового лідера Хапонії}], хто ж нахапається на цю посаду?',
  'link{https://site.borukva.space/org/halytska-khunta/post/dd1a2ce9-cf73-4d2b-89aa-9fbc813a9385}[underline{18.10 в 20:00 відбудеться друге скликання сейму Королівства Галіції.}]',
];

// ── Main entry menu ("/RULE34") — ported from MainScreen in main.dart ──
export const MAIN_MENU_BUTTONS = [
  { label: '09.02-14.02', route: '/atRmklps' },
  { label: '15.02-21.02', route: '/qizmvUxp' },
  { label: '22.02-28.02', route: '/pLxqnrvt' },
  { label: 'Кчбнк', route: '/qbE34klm' },
  { label: '01.03-14.03', route: '/x9t2q7wb' },
  { label: "Інтерв'ю з Артемідою", route: '/inter1' },
  { label: '15.03-29.03', route: '/k7m2q9vz' },
  { label: '29.03-10.05', route: '/l9bf3n0p' },
];

export const SERVER_WIKI_URL =
  'https://site.borukva.space/pages/welcome';

export const BG_ASSET = assetUrl('assets/pictures/bg/bg_borukva.png');
export const BG_MONOCHROME_ASSET = assetUrl('assets/pictures/bg/bg_borukva-monochrome.png');
export const BG_BLUE_ASSET = assetUrl('assets/pictures/bg/bg_borukva-blue.png');
