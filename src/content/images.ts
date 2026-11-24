export type ImageAsset = {
  src: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  creator: string;
  license: string;
  licenseUrl?: string;
  sourceUrl: string;
  position?: string;
};

export const images = {
  florence: {
    src: "/images/florence.webp",
    width: 2160,
    height: 1619,
    alt: "Панорама Флоренции с собором Санта-Мария-дель-Фьоре на фоне холмов",
    title: "Собор Флоренции с площади Микеланджело",
    creator: "Dllu",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Florence_Cathedral_seen_from_Piazzale_Michelangelo_dllu.jpg",
    position: "61% 42%",
  },
  antiquity: {
    src: "/images/antiquity.webp",
    width: 720,
    height: 986,
    alt: "Лицо Платона в мраморном бюсте из Капитолийских музеев",
    title: "Бюст Платона",
    creator: "Marie-Lan Nguyen",
    license: "CC BY 2.5",
    licenseUrl: "https://creativecommons.org/licenses/by/2.5/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Plato_Silanion_Musei_Capitolini_MC1377_(cropped).jpg",
    position: "center 48%",
  },
  humanism: {
    src: "/images/humanism.webp",
    width: 877,
    height: 1250,
    alt: "Эразм Роттердамский в тёмной одежде с руками на книге",
    title: "Портрет Эразма Роттердамского",
    creator: "Ганс Гольбейн Младший",
    license: "Общественное достояние",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Holbein%2C_Hans_(II)_-_Erasmus_-_National_Gallery.jpg",
    position: "center 36%",
  },
  leonardo: {
    src: "/images/leonardo.webp",
    width: 508,
    height: 443,
    alt: "Чертёж механизма крыла и рукописные заметки Леонардо да Винчи",
    title: "Проект летательного аппарата",
    creator: "Леонардо да Винчи",
    license: "Общественное достояние",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Design_for_a_Flying_Machine.jpg",
    position: "center 42%",
  },
  machiavelli: {
    src: "/images/machiavelli.webp",
    width: 1058,
    height: 1174,
    alt: "Никколо Макиавелли в чёрном одеянии с красными рукавами",
    title: "Портрет Никколо Макиавелли",
    creator: "Санти ди Тито",
    license: "Общественное достояние",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Santi_di_Tito_-_Niccolo_Machiavelli%27s_portrait.jpg",
    position: "center 28%",
  },
  reformation: {
    src: "/images/reformation.webp",
    width: 774,
    height: 1200,
    alt: "Мартин Лютер в чёрном головном уборе на голубовато-зелёном фоне",
    title: "Портрет Мартина Лютера",
    creator: "Лукас Кранах Старший",
    license: "Общественное достояние",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Martin_Luther_by_Lucas_Cranach.jpg",
    position: "center 30%",
  },
  art: {
    src: "/images/art.webp",
    width: 1280,
    height: 960,
    alt: "Читальный зал флорентийской библиотеки с резным потолком и рядами пюпитров",
    title: "Читальный зал библиотеки Лауренциана",
    creator: "Sailko",
    license: "CC BY 2.5",
    licenseUrl: "https://creativecommons.org/licenses/by/2.5/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Biblioteca_medicea_laurenziana_interno_01.JPG",
    position: "center 48%",
  },
  legacy: {
    src: "/images/legacy.webp",
    width: 1280,
    height: 960,
    alt: "Крупный план позолоченных колец армиллярной сферы в Музее Галилея",
    title: "Армиллярная сфера Антонио Сантуччи",
    creator: "Sailko",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Antonio_santucci%2C_sfera_armillare%2C_firenze_1588-93%2C_06.JPG",
    position: "center 43%",
  },
  manuscript: {
    src: "/images/manuscript.webp",
    width: 960,
    height: 1172,
    alt: "Лист рукописи Леонардо с рисунками и зеркальным письмом",
    title: "Кодекс о полёте птиц, лист 1r",
    creator: "Леонардо да Винчи",
    license: "Общественное достояние",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Codice_Volo_01R_mod.jpg",
    position: "center 34%",
  },
  map: {
    src: "/images/map.webp",
    width: 1280,
    height: 711,
    alt: "Карта мира Вальдземюллера с меридианами и очертаниями известных ему материков",
    title: "Карта мира Вальдземюллера, 1507",
    creator: "Мартин Вальдземюллер",
    license: "Общественное достояние",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Waldseemuller_map%2C_complete.jpg",
    position: "center",
  },
  printing: {
    src: "/images/printing.webp",
    width: 897,
    height: 1250,
    alt: "Две колонки печатного текста с украшенными инициалами и растительным орнаментом",
    title: "Страница Библии Гутенберга",
    creator: "Иоганн Гутенберг · Библиотека Конгресса США",
    license: "Общественное достояние",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:An_illuminated_page_of_the...Gutenberg_Bible..._LCCN2006680004.jpg",
    position: "center 36%",
  },
  school: {
    src: "/images/school.webp",
    width: 1280,
    height: 713,
    alt: "Платон и Аристотель с книгами среди философов на фреске Рафаэля",
    title: "«Афинская школа», фрагмент",
    creator: "Рафаэль Санти",
    license: "Общественное достояние",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sanzio_01_cropped.png",
    position: "center 37%",
  },
  dome: {
    src: "/images/dome.webp",
    width: 873,
    height: 1400,
    alt: "Кирпичный купол Брунеллески над мраморной стеной флорентийского собора",
    title: "Купол Брунеллески",
    creator: "Jebulon",
    license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Duomo_cot%C3%A9_droit_cath%C3%A9drale.jpg",
    position: "center 39%",
  },
  sanlorenzo: {
    src: "/images/sanlorenzo.webp",
    width: 933,
    height: 1400,
    alt: "Вид вверх на кессонный потолок и купол базилики Сан-Лоренцо",
    title: "Интерьер базилики Сан-Лоренцо",
    creator: "Txllxt TxllxT",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Firenze_-_Florence_-_Basilica_di_San_Lorenzo_-_Designed_by_Brunelleschi_-_View_Up_on_Central_Nave_%26_Cupola.jpg",
    position: "center 43%",
  },
  ponte: {
    src: "/images/ponte.webp",
    width: 1700,
    height: 1133,
    alt: "Дома и арки моста Понте-Веккьо отражаются в реке Арно",
    title: "Понте-Веккьо после заката",
    creator: "Eric Kilby",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Ponte_Vecchio_After_Sunset.jpg",
    position: "center 48%",
  },
  painting: {
    src: "/images/painting.webp",
    width: 1167,
    height: 1400,
    alt: "Ангел, Мария и святой Пётр Мученик под арками на фреске Фра Анджелико",
    title: "«Благовещение со святым Петром Мучеником»",
    creator: "Фра Анджелико",
    license: "Общественное достояние",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Annunciation_by_Fra_Angelico_(San_Marco_Cell_3).jpg",
    position: "center 45%",
  },
} satisfies Record<string, ImageAsset>;

export type ImageKey = keyof typeof images;
