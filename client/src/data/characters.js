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
import placeholderModelSource from '../../public/assets/models/model placeholder.bbmodel?raw';
import griagModelSource from '../../public/assets/models/model griag.bbmodel?raw';
import tetoModelSource from '../../public/assets/models/model teto.bbmodel?raw';

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
const placeholderModel = JSON.parse(placeholderModelSource);
const griagModel = JSON.parse(griagModelSource);
const tetoModel = JSON.parse(tetoModelSource);
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
    avatarPath: `assets/skin-avatar/ps-profi.png`,
    rarity: 'Журналіст',
    tags: ['країна:Телос Докіме', 'країна:Гузняни', 'відзначився:ЖУРНАЛІСТ', 'сезон:Сезон: 6', 'сезон:Сезон: 67' , 'сезон:Сезон 7', 'країна:КОКС'],
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
      'Гравець 7 сезону Борукви.',
      'quote{"О великий кажан комунізму врятуй онлайн борукви"}\n',
      'Майстер новин.',
      'Поточна Країна: Країна Оази Квітучого Сонця.',
    ],
  },
  {
    id: 'fransys-dikiy',
    name: 'FransysDikiy',
    avatarPath: `assets/skin-avatar/fransys-dikiy.png`,
    rarity: 'Меценат',
    tags: ['країна:С.Р.А.К.А.', 'країна:Сракоміда', 'відзначився:МЕЦЕНАТ', 'сезон:Сезон: 6', 'сезон:Сезон: 67', 'сезон:Сезон 7', 'країна:Досягнокрай'],
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
      'Гравець 7 сезону Борукви. ',
      'quote{ "Всі хто користується тризубом повинні сидіти в тюрмі"}\n ',
      'Фанат досягнень, партнер link{https://borukva-news.github.io/skins?character=papa-svin&sort=name-asc}[PapaSvin1], продав душу за фумо.\n', 'Поточна Країна: Сракоміда',
    ],
  },
  {
    id: 'dornanesko',
    name: 'Dornanesko',
    avatarPath: `assets/skin-avatar/dornanesko.png`,
    rarity: 'Гравець',
    tags: ['країна:Задунайська Січ', 'країна:НІК',  'відзначився:ГРАВЕЦЬ', 'сезон:Сезон: 6', 'сезон:Сезон: 67', 'сезон:Сезон 7', 'країна:Бака-Троєщина'],
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
      'Гравець 7 сезону Борукви.',
      'quote{"Поки ти залишаєшся ♂️slave♂️ ,я стаю ♂️dungeon master\'ом♂️"}\n',
      'Хардкорщик гравець на андроїді, той хто вивозить онлайн, ♂Dungeon Master♂.\n',
      'Поточна Країна: Бака-Троєщина',
    ],
  },
  {
    id: 'miha',
    name: 'M_I_H_A_2_1',
    avatarPath: `assets/skin-avatar/miha.png`,
    rarity: 'Гравець',
    tags: ['країна:Керосинівка', 'країна:Монако', 'країна:НІК', 'відзначився:МЕЛОЧЬ ПУЗАТА', 'сезон:Сезон: 6', 'сезон:Сезон: 67', 'сезон:Сезон 7', 'країна:Западенці'],
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
      'Гравець 7 сезону Борукви.',
      'quote{"Піду скакун з гори в ріку"}\n',
      'Казінолог, ПВК Монако не забуто. \n',
      'Поточна Країна: Западенці',
    ],
  },
  {
    id: 'maliyo',
    name: 'Maliyo',
    avatarPath: `assets/skin-avatar/maliyo.png`,
    rarity: 'Недоторканий (ютубер)',
    tags: ['компанія:ВМВ', 'відзначився:ЮТУБЕР', 'сезон:Сезон: 6'],
    animationFile: 'model maliyo2.bbmodel',
    model: maliyo2Model,
    skins: [
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(maliyoModel),
      },
      
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"Профілактично ірл йому цеглиною можна було б обличча порівняти"}\n',
      'Коли відео? ВМВ pamietamy. \n',
      'Поточна Країна: ???',
    ],
  },
  {
    id: 'kruchka',
    name: 'Kruchka',
    avatarPath: `assets/skin-avatar/kruchka.png`,
    rarity: 'Гравець',
    tags: ['країна:С.Р.А.К.А.', 'відзначився:ГРАВЕЦЬ', 'сезон:Сезон: 6', 'сезон:Сезон: 67', 'сезон:Сезон 7', 'країна:Хапонія'],
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
      'Гравець 7 сезону Борукви.',
      'quote{"Ми не любимо підарів. До геїв питань нема..."}\n',
      'Вімзікал будівельниця. \n',
      'Поточна Країна: Хапонія',
    ],
  },
  {
    id: 'quod',
    name: 'Quod',
    known: 'Quodie',
    avatarPath: `assets/skin-avatar/quod.png`,
    rarity: 'Гравець',  
    tags: ['відзначився:ОЛД', 'сезон:Сезон: 6', 'сезон:Сезон: 67', 'сезон:Сезон 7', 'країна:Хапонія', 'країна:С.Р.А.К.А.', 'країна:Сракоміда'],
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
      'Гравець 7 сезону Борукви.',
      'quote{"В когось є фото мухи з хуйом?"}\n',
      'Quod (але в грі Quodie, бо якийсь імбецил 10 років тому зайняв мій нік і більше ніколи не заходив у гру), граю з 2 сезону. \n',
      'Поточна Країна: Хапонія',
    ],
  },
  {
    id: 'patoki',
    name: 'ratskui',
    known: 'patoki',
    avatarPath: `assets/skin-avatar/patoki.png`,
    rarity: 'Адмін',  
    tags: [ 'відзначився:ОЛД', 'відзначився:АДМІН', 'сезон:Сезон: 6', 'сезон:Сезон: 67', 'сезон:Сезон 7', 'країна:Постмодернія', 'країна:67 Русь', 'країна:Западенці'],
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
      'Гравець 7 сезону Борукви.',
      'quote{"ніхто не повернеться на 3 сезон."}\n',
      'Він же patoki, топ 5 пранків в спектаторі, фанат Шонґкрату \n',
      'Поточна Країна: Западенці',
    ],
  },
  {
    id: 'orestborykva',
    name: 'OrestBorykva',
    avatarPath: `assets/skin-avatar/orestborykva.png`,
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
      'Гравець 6 сезону Борукви.',
      'quote{"Розбомбити всіх в кого втсановлееий майнкрафт"}\n',
      'Він же xxFIREBOSSxx, фан факт, адмін УкрНаступу \n',
      'Поточна Країна: ???',
    ],
  },
  {
    id: 'papa-svin',
    name: 'PapaSvin1',
    known: 'твінки: Twink, BarakObama, Kolya_UA',
    avatarPath: `assets/skin-avatar/papasvin.png`,
    rarity: 'Гравець',  
    tags: [ 'відзначився:ГРАВЕЦЬ', 'сезон:Сезон: 6', 'сезон:Сезон 7', 'країна:Кримська Долина', 'країна:Досягнoкрай' ],
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
      'Гравець 7 сезону Борукви.',
      'quote{"я дійсно папасвін"}\n',
      'Фанат досягнень 2, топ 2 по досягненням, партнер link{https://borukva-news.github.io/skins?character=fransys-dikiy&sort=name-asc}[FransysDikiy] \n',
      'Поточна Країна: Досягнокрай',
    ],
  },
  {
    id: 'griag',
    name: 'griag_',
    avatarPath: `assets/skin-avatar/griag.png`,
    rarity: 'Гравець',  
    tags: [ 'відзначився:ГРАВЕЦЬ', 'сезон:Сезон: 6', 'сезон:Сезон: 67', 'сезон:Сезон 7', 'країна:Грягівка', 'країна:Бака-Троєщина' ],
    animationFile: 'model griag.bbmodel',
    model: griagModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(griagModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"гр я  г"}\n',
      'це гря г\n',
      'Поточна Країна: Бака-Троєщина',
    ],
  },
  {
    id: 'teto',
    name: 'Teto_____',
    avatarPath: `assets/skin-avatar/teto.png`,
    rarity: 'Адмін',  
    tags: [ 'відзначився:АДМІН', 'сезон:Сезон: 6', 'сезон:Сезон: 67', 'сезон:Сезон 7', 'країна:Бака-Троєщина' ],
    animationFile: 'model teto.bbmodel',
    model: tetoModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(tetoModel),
      },
      {
        id: 'teto2',
        name: 'Тето 2',
        overrides: buildEmbeddedOverrides(tetoModel),
    }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"новенький скидай труси"}\n',
      'Адмін, крутий ПВПшер, гриб на всю голову\n',
      'Поточна Країна: Бака-Троєщина',
    ],
  },
    {
    id: 'skeker',
    name: 'Skeker',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
    
    {
    id: 'garodogtos',
    name: 'Garodogtos',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
    
    {
    id: 'daboorl1e',
    name: 'daboorl1e',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'somyk',
    name: 'somyk',
    known: 'rybosoma',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'kygylo',
    name: 'Kygylo',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'murrrly',
    name: 'Murrrly',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'judas',
    name: 'Judas',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'aikofromhell',
    name: 'AikoFromHell',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'reign3r',
    name: '_Reign3r_',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'wi9ster1a',
    name: 'wi9ster1a',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'memento-mori',
    name: 'MEMENTO_MORI',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'temari-nya',
    name: 'Temari_nya',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'vit2005',
    name: 'Vit2005',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'meowingcat25',
    name: 'MeowingCat25',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'zefir',
    name: 'Zefir',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'spysock',
    name: 'SpySock',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'secretblog',
    name: 'secretblog',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'nitramtkach',
    name: 'NitramTkach',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'bhdm',
    name: 'Bhdm',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'kladbm',
    name: 'Kladbm',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
        
    {
    id: 'dimavh',
    name: 'dimavh_',
    avatarPath: `assets/skin-avatar/none.png`,
    rarity: '???',  
    tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
    animationFile: 'model placeholder.bbmodel',
    model: placeholderModel,
    skins: [  
      {
        id: 'original',
        name: 'Оригінал',
        overrides: buildEmbeddedOverrides(placeholderModel),
      }
    ],
    characteristics: [
      'Гравець 7 сезону Борукви.',
      'quote{"???"}\n',
      '???\n',
      'Поточна Країна: ???',
    ],
  },
  //   {
  //   id: 'none',
  //   name: 'placeholder',
  //   avatarPath: `assets/skin-avatar/none.png`,
  //   rarity: '???',  
  //   tags: [ 'відзначився:???', 'сезон:Сезон 7', ],
  //   animationFile: 'model placeholder.bbmodel',
  //   model: placeholderModel,
  //   skins: [  
  //     {
  //       id: 'original',
  //       name: 'Оригінал',
  //       overrides: buildEmbeddedOverrides(placeholderModel),
  //     }
  //   ],
  //   characteristics: [
  //     'Гравець 7 сезону Борукви.',
  //     'quote{"???"}\n',
  //     '???\n',
  //     'Поточна Країна: ???',
  //   ],
  // },
];
