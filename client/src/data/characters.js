import psProfiModelSource from '../../public/assets/models/model psprofi.bbmodel?raw';
import fransysDikiyModelSource from '../../public/assets/models/model fransysdikiy.bbmodel?raw';
import dornaneskoModelSource from '../../public/assets/models/model dornanesko.bbmodel?raw'; 
import mihaModelSource from '../../public/assets/models/model miha.bbmodel?raw';
import maliyoModelSource from '../../public/assets/models/model maliyo.bbmodel?raw';
import maliyo2ModelSource from '../../public/assets/models/model maliyo2.bbmodel?raw';
import kruchkaModelSource from '../../public/assets/models/model kruchka.bbmodel?raw';
import quodModelSource from '../../public/assets/models/model quod.bbmodel?raw';
import patokiModelSource from '../../public/assets/models/model patoki.bbmodel?raw';
import orestModelSource from '../../public/assets/models/model orest.bbmodel?raw';
import papasvinModelSource from '../../public/assets/models/model papasvin.bbmodel?raw';

function buildEmbeddedOverrides(model) {
  const overrides = {};
  (model.textures || []).forEach((texture) => {
    if (typeof texture.source !== 'string' || !texture.source.startsWith('data:')) return;
    if (texture.uuid) overrides[texture.uuid] = texture.source;
    if (texture.name) overrides[texture.name] = texture.source;
    if (texture.id !== undefined && texture.id !== null) overrides[String(texture.id)] = texture.source;
  });
  return overrides;
}

const psProfiModel = JSON.parse(psProfiModelSource);
const fransysDikiyModel = JSON.parse(fransysDikiyModelSource);
const dornaneskoModel = JSON.parse(dornaneskoModelSource);
const mihaModel = JSON.parse(mihaModelSource);
const maliyoModel = JSON.parse(maliyoModelSource);
const maliyo2Model = JSON.parse(maliyo2ModelSource);
const kruchkaModel = JSON.parse(kruchkaModelSource);
const quodModel = JSON.parse(quodModelSource);
const patokiModel = JSON.parse(patokiModelSource);
const orestModel = JSON.parse(orestModelSource);
const papasvinModel = JSON.parse(papasvinModelSource);
// зробити перенаправлення з borukva-news.github.io / borukvanews на borukva - news.github.io

export function sortCharacters(characters, sortOrder) {
  return [...characters].sort((left, right) => {
    if (sortOrder === 'name-desc') return right.name.localeCompare(left.name);
    if (sortOrder === 'rarity') return left.rarity.localeCompare(right.rarity);
    return left.name.localeCompare(right.name);
  });
}

export const CHARACTERS = [
  {
    id: 'ps-profi',
    name: 'PS_PROFI',
    avatarPath: `assets/skins/ps-profi.png`,
    rarity: 'Журналіст',
    tags: ['країна:Телос Докіме', 'країна:Гузняни', 'відзначився:ЖУРНАЛІСТ', 'сезон:Сезон: 6', 'сезон:Сезон: 67'],
    animationFile: 'model psprofi.bbmodel',
    model: psProfiModel,
    skins: [
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(psProfiModel),
      },
    ],
    characteristics: [
      'Гравець 6, 6-7 сезону Борукви.',
      'quote{"О великий кажан комунізму врятуй онлайн борукви"}\n',
      'Майстер новин.',
      'Поточна Країна: Гузняни.',
    ],
  },
  {
    id: 'fransys-dikiy',
    name: 'FransysDikiy',
    avatarPath: `assets/skins/fransys-dikiy.png`,
    rarity: 'Меценат',
    tags: ['країна:С.Р.А.К.А.', 'країна:Сракоміда', 'відзначився:МЕЦЕНАТ', 'сезон:Сезон: 6', 'сезон:Сезон: 67'],
    animationFile: 'model fransysdikiy.bbmodel',
    model: fransysDikiyModel,
    skins: [
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(fransysDikiyModel),
      },
    ],
    characteristics: [
      'Гравець 6, 6-7 сезону Борукви. ',
      'quote{ "Всі хто користується тризубом повинні сидіти в тюрмі"}\n ',
      'Фанат досягнень, партнер link{https://borukva-news.github.io/skins?character=papa-svin&sort=name-asc}[PapaSvin1], продав душу за фумо.\n', 'Поточна Країна: Сракоміда',
    ],
  },
  {
    id: 'dornanesko',
    name: 'Dornanesko',
    avatarPath: `assets/skins/dornanesko.png`,
    rarity: 'Гравець',
    tags: ['країна:Задунайська Січ', 'країна:НІК',  'відзначився:ГРАВЕЦЬ', 'сезон:Сезон: 6', 'сезон:Сезон: 67'],
    animationFile: 'model dornanesko.bbmodel',
    model: dornaneskoModel,
    skins: [
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(dornaneskoModel),
      },
    ],
    characteristics: [
      'Гравець 6, 6-7 сезону Борукви.',
      'quote{"Поки ти залишаєшся ♂️slave♂️ ,я стаю ♂️dungeon master\'ом♂️"}\n',
      'Хардкорщик гравець на андроїді, той хто вивозить онлайн, ♂Dungeon Master♂.\n',
      'Поточна Країна: ???',
    ],
  },
  {
    id: 'miha',
    name: 'M_I_H_A_2_1',
    avatarPath: `assets/skins/miha.png`,
    rarity: 'Особливий хлопчик',
    tags: ['країна:Керосинівка', 'країна:Монако', 'країна:НІК', 'відзначився:ПРОПЛАЧЕНИЙ', 'сезон:Сезон: 6', 'сезон:Сезон: 67'],
    animationFile: 'model miha.bbmodel',
    model: mihaModel,
    skins: [
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(mihaModel),
      },
    ],
    characteristics: [
      'Гравець 6, 6-7 сезону Борукви.',
      'quote{"Піду скакун з гори в ріку"}\n',
      'Казінолог, ПВК Монако не забуто. \n',
      'Поточна Країна: НІК (Нова Імперія Керосинівка)',
    ],
  },
  {
    id: 'maliyo',
    name: 'Maliyo',
    avatarPath: `assets/skins/maliyo.png`,
    rarity: 'Недоторканий (ютубер)',
    tags: ['компанія:ВМВ', 'відзначився:ЮТУБЕР', 'сезон:Сезон: 6', 'сезон:Сезон: 67'],
    animationFile: 'model maliyo.bbmodel',
    model: maliyoModel,
    skins: [
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(maliyoModel),
      },
      
    ],
    characteristics: [
      'Гравець 6, 6-7 сезону Борукви.',
      'quote{"Профілактично ірл йому цеглиною можна було б обличча порівняти"}\n',
      'Коли відео? ВМВ pamietamy. \n',
      'Поточна Країна: ???',
    ],
  },
  {
    id: 'kruchka',
    name: 'Kruchka',
    avatarPath: `assets/skins/kruchka.png`,
    rarity: 'Гравець',
    tags: ['країна:С.Р.А.К.А.', 'відзначився:ГРАВЕЦЬ', 'сезон:Сезон: 6', 'сезон:Сезон: 67', 'країна:Хапонія'],
    animationFile: 'model kruchka.bbmodel',
    model: kruchkaModel,
    skins: [
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(kruchkaModel),
      },
      
    ],
    characteristics: [
      'Гравець 6, 6-7 сезону Борукви.',
      'quote{"Ми не любимо підарів. До геїв питань нема..."}\n',
      'Вімзікал будівельниця. \n',
      'Поточна Країна: (майбутня) Хапонія',
    ],
  },
  {
    id: 'quod',
    name: 'Quod',
    avatarPath: `assets/skins/quod.png`,
    rarity: 'Гравець',  
    tags: ['відзначився:ОЛД', 'сезон:Сезон: 6', 'сезон:Сезон: 67', 'країна:Хапонія', 'країна:С.Р.А.К.А.', 'країна:Сракоміда'],
    animationFile: 'model quod.bbmodel',
    model: quodModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(quodModel),
      }
    ],
    characteristics: [
      'Гравець 6, 6-7 сезону Борукви.',
      'quote{"В когось є фото мухи з хуйом?"}\n',
      'Quod (але в грі Quodie, бо якийсь імбецил 10 років тому зайняв мій нік і більше ніколи не заходив у гру), граю з 2 сезону. \n',
      'Поточна Країна: (майбутня) Хапонія',
    ],
  },
  {
    id: 'patoki',
    name: 'Ratskui',
    avatarPath: `assets/skins/patoki.png`,
    rarity: 'Адмін',  
    tags: [ 'відзначився:ОЛД', 'відзначився:АДМІН', 'сезон:Сезон: 6', 'сезон:Сезон: 67', 'країна:Постмодернія', 'країна:67 Русь'],
    animationFile: 'model patoki.bbmodel',
    model: patokiModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(patokiModel),
      }
    ],
    characteristics: [
      'Гравець 6, 6-7 сезону Борукви.',
      'quote{"ніхто не повернеться на 3 сезон."}\n',
      'Він же patoki, топ 5 пранків в спектаторі, фанат Шонґкрату \n',
      'Поточна Країна: 67 русь',
    ],
  },
  {
    id: 'orestborykva',
    name: 'OrestBorykva',
    avatarPath: `assets/skins/orestborykva.png`,
    rarity: 'Власник',  
    tags: [ 'відзначився:ВЛАСНИК', 'сезон:Сезон: 6',  'країна:Керосинівка'],
    animationFile: 'model orest.bbmodel',
    model: orestModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(orestModel),
      }
    ],
    characteristics: [
      'Гравець 6, 6-7 сезону Борукви.',
      'quote{"Розбомбити всіх в кого втсановлееий майнкрафт"}\n',
      'Він же xxFIREBOSSxx, фан факт, адмін УкрНаступу \n',
      'Поточна Країна: ???',
    ],
  },
  {
    id: 'papa-svin',
    name: 'PapaSvin1',
    avatarPath: `assets/skins/papasvin.png`,
    rarity: 'Гравець',  
    tags: [ 'відзначився:ГРАВЕЦЬ', 'сезон:Сезон: 6',  'країна:Кримська Долина'],
    animationFile: 'model papasvin.bbmodel',
    model: papasvinModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(papasvinModel),
      }
    ],
    characteristics: [
      'Гравець 6, 6-7 сезону Борукви.',
      'quote{"я дійсно папасвін"}\n',
      'Фанат досягнень 2, топ 2 по досягненням, партнер link{https://borukva-news.github.io/skins?character=fransys-dikiy&sort=name-asc}[FransysDikiy] \n',
      'Поточна Країна: ???',
    ],
  },
];
