export const site = {
  name: "RENASCENTIA",
  shortName: "RENASCENTIA",
  subtitle: "Исследовательский центр эпохи Возрождения",
  description:
    "Студенческий исследовательский проект о философии, науке, истории и искусстве эпохи Возрождения.",
  language: "ru",
  locale: "ru_RU",
  version: "0.0.5",
} as const;

export type SiteSection = {
  href: `/${string}`;
  title: string;
  description: string;
};

export const sections = {
  research: {
    href: "/research",
    title: "Исследовательские программы",
    description:
      "Восемь направлений для изучения идей, источников и культурного наследия Возрождения.",
  },
  renaissance: {
    href: "/renaissance",
    title: "Эпоха Возрождения",
    description:
      "История европейского Возрождения в XIV–XVI веках. Флоренция, культура городов и новые способы работы с античным наследием.",
  },
  philosophy: {
    href: "/philosophy",
    title: "Философия",
    description:
      "Античная философия, гуманистическая программа образования и споры о достоинстве человека.",
  },
  thinkers: {
    href: "/thinkers",
    title: "Великие мыслители",
    description: "Мыслители, чьи тексты и методы помогают изучать Возрождение.",
  },
  science: {
    href: "/science",
    title: "Наука и открытия",
    description:
      "Натурфилософия, наблюдения, инженерные рисунки и новые способы описывать Вселенную.",
  },
  art: {
    href: "/art",
    title: "Искусство и культура",
    description:
      "Живопись, архитектура и книжная культура Возрождения в музейных коллекциях и исследовательских статьях.",
  },
  timeline: {
    href: "/timeline",
    title: "Историческая хронология",
    description:
      "Избранные события и произведения, к которым обращаются программы центра.",
  },
  archive: {
    href: "/archive",
    title: "Библиотека и архив",
    description:
      "Архитектура, портреты, книги, карты и чертежи с указанием авторства и условий использования.",
  },
  education: {
    href: "/education",
    title: "Образовательные ресурсы",
    description:
      "Музейные материалы и первоисточники для самостоятельного изучения эпохи.",
  },
  publications: {
    href: "/publications",
    title: "Публикации",
    description:
      "Исследовательские статьи и обзоры о философии, науке и культуре Возрождения.",
  },
  multimedia: {
    href: "/multimedia",
    title: "Мультимедиа",
    description:
      "Документальные материалы и визуальные источники по эпохе Возрождения.",
  },
  about: {
    href: "/about",
    title: "О центре",
    description:
      "RENASCENTIA — студенческий исследовательский проект о философии, науке, истории, искусстве и наследии Возрождения.",
  },
  team: {
    href: "/team",
    title: "Наша команда",
    description:
      "Сведения об участниках исследовательской команды будут опубликованы в этом разделе.",
  },
  sources: {
    href: "/sources",
    title: "Источники",
    description:
      "Музейные каталоги, первоисточники и сведения о происхождении изображений портала.",
  },
  search: {
    href: "/search",
    title: "Поиск",
    description:
      "Поиск по названиям, описаниям и кодам исследовательских программ и публикаций.",
  },
} as const satisfies Record<string, SiteSection>;

export const exploreLinks = [
  { href: "/", title: "Главная" },
  sections.research,
  sections.renaissance,
  sections.philosophy,
  sections.thinkers,
  sections.science,
  sections.art,
  sections.timeline,
  sections.archive,
  sections.education,
  sections.about,
  sections.team,
];

export const footerGroups = [
  {
    title: "Исследования",
    links: [
      sections.research,
      sections.publications,
      sections.philosophy,
      sections.science,
      sections.art,
    ],
  },
  {
    title: "Материалы",
    links: [
      sections.archive,
      sections.multimedia,
      sections.timeline,
      sections.education,
      sections.sources,
    ],
  },
  {
    title: "Центр",
    links: [
      sections.about,
      sections.team,
      { href: "/about#site-map", title: "Карта сайта" },
    ],
  },
];
