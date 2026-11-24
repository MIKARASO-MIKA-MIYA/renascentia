import type { ImageKey } from "./images";

export type HomeLink = { title: string; href: string; image: ImageKey };

export const heroSlides = [
  {
    title: "В поисках исследователей нового мышления",
    description:
      "Изучаем философию, науку, искусство и культуру эпохи Возрождения, раскрывая идеи, людей и открытия, которые изменили представление человека о мире и самом себе.",
    action: "Изучить исследование",
    href: "/research/renaissance-philosophy",
    image: "florence",
  },
  {
    title: "Как исследовали природу",
    description:
      "Инженерные рисунки и астрономические наблюдения помогают проследить, как складывались способы описывать природу.",
    action: "Открыть программу",
    href: "/research/rp-004",
    image: "leonardo",
  },
  {
    title: "История в первоисточниках",
    description:
      "Изучайте книжные страницы, карты и памятники архитектуры в исторической галерее центра.",
    action: "Посмотреть архив",
    href: "/archive",
    image: "sanlorenzo",
  },
] as const;

export const galleryImages = [
  { label: "Архитектура", image: "dome" },
  { label: "Рукописи", image: "manuscript" },
  { label: "Научные чертежи", image: "leonardo" },
  { label: "Исторические карты", image: "map" },
  { label: "Портреты мыслителей", image: "humanism" },
  { label: "Живопись", image: "painting" },
] as const satisfies readonly { label: string; image: ImageKey }[];

export const topics = [
  { title: "Философия", href: "/philosophy", image: "antiquity" },
  { title: "Гуманизм", href: "/research/rp-003", image: "humanism" },
  { title: "Наука и открытия", href: "/science", image: "legacy" },
  { title: "Искусство", href: "/art", image: "school" },
  { title: "Архитектура", href: "/art#architecture", image: "florence" },
  { title: "Литература", href: "/education#reading", image: "manuscript" },
  { title: "Реформация", href: "/research/rp-006", image: "reformation" },
  { title: "Великие мыслители", href: "/thinkers", image: "machiavelli" },
] as const satisfies readonly HomeLink[];

export const artwork = {
  title: "«Афинская школа»",
  artist: "Рафаэль Санти",
  date: "Ок. 1509–1511",
  description:
    "В центре фрески Рафаэль поместил Платона с «Тимеем» и Аристотеля с «Этикой». В Станце делла Сеньятура эта композиция представляет философию. Античные мыслители стали частью программы ренессансной библиотеки папы Юлия II.",
  source:
    "https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/stanze-di-raffaello/stanza-della-segnatura/scuola-di-atene.html",
};
