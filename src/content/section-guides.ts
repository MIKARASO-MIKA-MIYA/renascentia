import type { ResourceGroup } from "@/components/thematic-page";
import {
  collections,
  getMaterial,
  materialHref,
  type Collection,
} from "@/lib/materials";
import type { Material } from "./types";

function resource(collection: Collection, slug: string) {
  const entries: readonly Material[] = collections[collection];
  const { title, description } = getMaterial(entries, slug);
  return { title, description, href: materialHref(collection, slug) };
}

const florence = resource("publications", "florence-and-renaissance");
const antiquity = resource("publications", "return-to-ancient-philosophy");
const leonardo = resource("publications", "leonardo-scientific-notebooks");
const humanism = resource("publications", "humanism-and-dignity");
const machiavelli = resource(
  "publications",
  "machiavelli-political-philosophy",
);
const printing = resource("publications", "rise-of-printing");
const cosmos = resource("publications", "new-view-of-the-universe");
const architecture = resource("publications", "renaissance-architecture");

const beginnings = resource("research", "rp-001");
const ancientThought = resource("research", "rp-002");
const humanities = resource("research", "rp-003");
const naturalPhilosophy = resource("research", "rp-004");
const politics = resource("research", "rp-005");
const reformation = resource("research", "rp-006");
const art = resource("research", "rp-007");
const legacy = resource("research", "rp-008");

export const collectionsGuide = [
  {
    title: "Музеи Ватикана · «Афинская школа»",
    href: "https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/stanze-di-raffaello/stanza-della-segnatura/scuola-di-atene.html",
    description: "Описание фрески, её персонажей и композиции.",
  },
  {
    title: "Метрополитен-музей · Архитектура Возрождения",
    href: "https://www.metmuseum.org/essays/architecture-in-renaissance-italy",
    description: "Музейный обзор форм, памятников и архитекторов Ренессанса.",
  },
  {
    title: "Библиотека Конгресса США · Библия Гутенберга",
    href: "https://www.loc.gov/item/2021666734/",
    description:
      "Каталожная запись одного из экземпляров ранней печатной Библии.",
  },
  {
    title: "Стенфордская философская энциклопедия · Аристотелизм Возрождения",
    href: "https://plato.stanford.edu/entries/aristotelianism-renaissance/",
    description:
      "Академический обзор чтения и преподавания Аристотеля в эпоху Возрождения.",
  },
];

export const guides = {
  renaissance: [
    {
      title: "История Возрождения",
      items: [
        beginnings,
        florence,
        legacy,
        { title: "Историческая хронология", href: "/timeline" },
      ],
    },
  ],
  philosophy: [
    {
      title: "Исследовательские направления",
      items: [ancientThought, humanities, politics],
    },
    { title: "Статьи о философии", items: [antiquity, humanism, machiavelli] },
  ],
  thinkers: [
    {
      title: "Мыслители в исследованиях центра",
      items: [
        {
          title: "Платон и Аристотель",
          href: antiquity.href,
          description: "Античные тексты и их чтение в эпоху Возрождения.",
        },
        {
          title: "Никколо Макиавелли",
          href: machiavelli.href,
          description: "Власть, гражданская жизнь и устройство республики.",
        },
        {
          title: "Леонардо да Винчи",
          href: leonardo.href,
          description: "Наблюдение, рисунок и инженерный замысел.",
        },
        {
          title: "Джованни Пико делла Мирандола",
          href: humanism.href,
          description: "Гуманизм, образование и достоинство человека.",
        },
        {
          title: "Мартин Лютер",
          href: reformation.href,
          description: "Религиозная полемика, перевод и печать.",
        },
      ],
    },
  ],
  science: [
    {
      title: "Исследования природы",
      items: [
        naturalPhilosophy,
        leonardo,
        cosmos,
        { title: "Научные чертежи в галерее", href: "/archive#gallery" },
      ],
    },
  ],
  art: [
    {
      title: "Искусство и визуальные источники",
      items: [
        art,
        { title: "«Афинская школа» и историческая галерея", href: "/archive" },
      ],
    },
    {
      id: "architecture",
      title: "Архитектура",
      items: [architecture, collectionsGuide[1]],
    },
  ],
  education: [
    {
      id: "reading",
      title: "Материалы для чтения",
      items: [humanism, printing, antiquity],
    },
    { title: "Музейные и академические ресурсы", items: collectionsGuide },
  ],
} as const satisfies Record<string, readonly ResourceGroup[]>;
