// ─────────────────────────────────────────────────────────────────────────────
// All carousel "issues" (ported 1:1 from lib/first_screen.dart .. sixth_screen.dart)
//
// page: { type: 'image' | 'youtube', src?: string, videoId?: string }
// hotspotFile: name of the JSON file in the news-data GitHub repo for this issue
// ─────────────────────────────────────────────────────────────────────────────

const img = (p) => ({ type: 'image', src: `/assets/pictures/${p}` });
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
      uvOverlay: '/assets/pictures/29_03-10_05/Газета 29.03-10.05 Титул невидимка.png',
    },
    {
      ...img('29_03-10_05/Газета 29.03-10.05 стор. 1.png'),
      sticky: '/assets/pictures/29_03-10_05/Газета 29.03-10.05 стор. 1 додаток – фінальна.png',
    },
    {
      ...img('29_03-10_05/Газета 29.03-10.05 стор. 2.png'),
      uvOverlay: '/assets/pictures/29_03-10_05/Газета 29.03-10.05 стор. 2 невидимка.png',
    },
    {
      ...img('29_03-10_05/Газета 29.03-10.05 стор. 3.png'),
      uvOverlay: '/assets/pictures/29_03-10_05/Газета 29.03-10.05 стор. 3 невидимка.png',
    },
    {
      ...img('29_03-10_05/Газета 29.03-10.05 стор. 4.png'),
      uvOverlay: '/assets/pictures/29_03-10_05/Газета 29.03-10.05 стор. 4 невидимка.png',
    },
    {
      ...img('29_03-10_05/Газета 29.03-10.05 стор. 5.png'),
      uvOverlay: '/assets/pictures/29_03-10_05/Газета 29.03-10.05 стор. 5 невидимка.png',
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
    image: '/assets/pictures/29_03-10_05/Газета 29.03-10.05 Титул.png',
    route: '/l9bf3n0p',
    caption: 'Новий випуск з новим форматом!',
    isNew: true,
  },
  {
    image: '/assets/pictures/kchbnk/Нов руб.png',
    route: '/qbE34klm',
    caption: 'Нова рубрика!',
  },
  {
    image: '/assets/pictures/skoro/5323723242159675852.jpg',
    route: '/inter1',
    caption: "Нове інтерв'ю!",
  },
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
  'https://tsebuleve.wiki.gg/uk/wiki/%D0%93%D0%B0%D0%B9%D0%B4_%C2%AB%D0%A0%D0%B5%D1%94%D1%81%D1%82%D1%80%D0%B0%D1%86%D1%96%D1%8F_%D0%BD%D0%B0_%D1%81%D0%B5%D1%80%D0%B2%D0%B5%D1%80%D1%96%C2%BB';

export const BG_ASSET = '/assets/pictures/bg/bg_borukva.png';
export const BG_MONOCHROME_ASSET = '/assets/pictures/bg/bg_borukva-monochrome.png';
export const BG_BLUE_ASSET = '/assets/pictures/bg/bg_borukva-blue.png';
