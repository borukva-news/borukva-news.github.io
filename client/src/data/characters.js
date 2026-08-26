import psProfiModelSource from '../../../assets/models/model psprofi.bbmodel?raw';
import fransysDikiyModelSource from '../../../assets/models/model fransysdikiy.bbmodel?raw';
import dornaneskoModelSource from '../../../assets/models/model dornanesko.bbmodel?raw'; 
import mihaModelSource from '../../../assets/models/model miha.bbmodel?raw';
import maliyoModelSource from '../../../assets/models/model maliyo.bbmodel?raw';

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
    avatarPath: '/assets/skins/ps-profi.png',
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
      'Гравець 6, 67 сезону Борукви.',
      'quote{"О великий кажан комунізму врятуй онлайн борукви"}\n',
      'Майстер новин.',
      'Поточна Країна: Гузняни.',
    ],
  },
  {
    id: 'fransys-dikiy',
    name: 'FransysDikiy',
    avatarPath: '/assets/skins/fransys-dikiy.png',
    rarity: 'Меценат',
    tags: ['країна:С.Р.А.К.А', 'країна:Сракоміда', 'відзначився:МЕЦЕНАТ', 'сезон:Сезон: 6', 'сезон:Сезон: 67'],
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
      'Гравець 6, 67 сезону Борукви. ',
      'quote{ "Всі хто користується тризубом повинні сидіти в тюрмі"}\n ',
      'Фанат досягнень, партнер Папасвина, продав душу за фумо.\n', 'Поточна Країна: Сракоміда',
    ],
  },
  {
    id: 'dornanesko',
    name: 'Dornanesko',
    avatarPath: '/assets/skins/dornanesko.png',
    rarity: 'Гравець',
    tags: ['країна:Задунайська Січ', 'відзначився:ГРАВЕЦЬ', 'сезон:Сезон: 6', 'сезон:Сезон: 67'],
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
      'Гравець 6, 67 сезону Борукви.',
      'quote{"Поки ти залишаєшся ♂️slave♂️ ,я стаю ♂️dungeon master\'ом♂️"}\n',
      'Хардкорщик гравець на андроїді, той хто вивозить онлайн, ♂Dungeon Master♂.\n',
      'Поточна Країна: ???',
    ],
  },
  {
    id: 'miha',
    name: 'M_I_H_A_2_1',
    avatarPath: '/assets/skins/miha.png',
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
      'Гравець 6, 67 сезону Борукви.',
      'quote{"Піду скакун з гори в ріку"}\n',
      'Казінолог, ПВК Монако не забуто. \n',
      'Поточна Країна: НІК (Нова Імперія Керосинівка)',
    ],
  },
  {
    id: 'maliyo',
    name: 'Maliyo',
    avatarPath: '/assets/skins/maliyo.png',
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
      'Гравець 6 сезону Борукви.',
      'quote{"Профілактично ірл йому цеглиною можна було б обличча порівняти"}\n',
      'Коли відео? ВМВ pamietamy. \n',
      'Поточна Країна: ???',
    ],
  },
];
