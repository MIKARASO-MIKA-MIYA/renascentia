import { footerGroups, sections, site } from "@/config/site";
import { articles } from "@/content/articles";
import { artwork, galleryImages, heroSlides, topics } from "@/content/home";
import { images, type ImageAsset, type ImageKey } from "@/content/images";
import { programs } from "@/content/programs";
import { publications } from "@/content/publications";
import { research } from "@/content/research";
import { collectionsGuide, guides } from "@/content/section-guides";
import { featuredVideo } from "@/content/video";
import {
  type CmsBlock,
  type CmsDocument,
  type RichNode,
  isImageUrl,
  isLink,
  newPathSchema,
  richDoc,
  richHeading,
  richParagraph,
  richText,
  videoSource,
} from "./schema";

export type EntryKind =
  "page" | "program" | "publication" | "biography" | "section";
export type Field = {
  label: string;
  value: string;
  type?: "text" | "image" | "link" | "video" | "article";
  optional?: boolean;
  maximum?: number;
};
type Fields = Record<string, Field>;
export type SeedEntry = {
  key: string;
  path: string;
  kind: EntryKind;
  seed: CmsDocument;
  fields: Fields;
};

const entries: SeedEntry[] = [];
const field = (
  label: string,
  value: string,
  type?: Field["type"],
  optional = false,
): Field => ({ label, value, type, optional });
const image = (label: string, key: ImageKey) =>
  field(label, images[key].src, "image");

function makeEntry(
  key: string,
  title: string,
  description = "",
  kind: EntryKind = "page",
  blocks: CmsBlock[] = [],
  fields: Fields = {},
) {
  const entry = {
    key,
    path: key.split("~")[0],
    kind,
    seed: {
      format: 1 as const,
      title,
      description,
      blocks,
      fields: Object.fromEntries(
        Object.entries(fields).map(([name, item]) => [name, item.value]),
      ),
    },
    fields,
  };
  entries.push(entry);
  return entry;
}

type Resource = { title: string; href: string; description?: string };

function linkedText(title: string, href: string): RichNode {
  return { ...richText(title), marks: [{ type: "link", attrs: { href } }] };
}

export function resourceBlock(
  id: string,
  title: string,
  items: readonly Resource[],
  type: CmsBlock["type"] = "sources",
  anchor?: string,
): CmsBlock {
  return {
    id,
    type,
    ...(anchor ? { anchor } : {}),
    doc: richDoc(richHeading(title), {
      type: "bulletList",
      content: items.map((item) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              linkedText(item.title, item.href),
              ...(item.description ? [richText(" — " + item.description)] : []),
            ],
          },
        ],
      })),
    }),
  };
}

export const aboutText =
  "Восемь программ объединяют исследовательские вопросы, статьи и исторические источники. Для музейных объектов и репродукций указаны происхождение и условия использования.";

export const timelineEvents = [
  {
    date: "1436",
    title: "Завершение свода флорентийского собора",
    description:
      "Купол Филиппо Брунеллески завершил основной объём флорентийского собора.",
    href: "https://duomo.firenze.it/en/discover/dome",
  },
  {
    date: "Середина 1450-х",
    title: "Библия Гутенберга",
    description:
      "Ранняя европейская печатная книга, изготовленная с использованием подвижных металлических литер.",
    href: "https://www.loc.gov/item/2021666734/",
  },
  {
    date: "1508–1511",
    title: "Рафаэль расписывает Станцу делла Сеньятура",
    description:
      "«Афинская школа» посвящена философии и входит в ансамбль росписей комнаты.",
    href: "https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/stanze-di-raffaello/stanza-della-segnatura/stanza-della-segnatura.html",
  },
];

const sectionBodies: Record<string, CmsBlock[]> = {
  "/timeline": timelineEvents.map((item, index) => ({
    id: "event-" + index,
    type: "timeline",
    doc: richDoc(
      richHeading(item.date + " · " + item.title),
      richParagraph(item.description),
      {
        type: "paragraph",
        content: [linkedText("Исторический источник", item.href)],
      },
    ),
  })),
  "/about": [
    { id: "about-text", type: "text", doc: richDoc(richParagraph(aboutText)) },
  ],
  "/sources": [
    resourceBlock(
      "academic",
      "Исторические и академические источники",
      collectionsGuide,
    ),
  ],
};
for (const [route, groups] of Object.entries(guides)) {
  sectionBodies["/" + route] = groups.map((group, index) =>
    resourceBlock(
      "group-" + index,
      group.title,
      group.items,
      route === "thinkers" ? "biography" : "sources",
      "id" in group ? group.id : undefined,
    ),
  );
}
for (const section of Object.values(sections)) {
  if (section.href !== "/search")
    makeEntry(
      section.href,
      section.title,
      section.description,
      "page",
      sectionBodies[section.href],
    );
}

for (const material of research) {
  const key = "/research/" + material.slug;
  const program = "code" in material ? material : undefined;
  makeEntry(
    key,
    material.title,
    material.description,
    "program",
    "body" in material && material.body?.length
      ? [
          {
            id: "body",
            type: "text",
            doc: richDoc(...material.body.map(richParagraph)),
          },
        ]
      : [],
    program ? { cover: image("Обложка", program.imageKey) } : {},
  );
  if (program)
    makeEntry(key + "~questions", "Вопросы программы", "", "section", [
      {
        id: "questions",
        type: "list",
        doc: richDoc(richHeading("Вопросы программы"), {
          type: "bulletList",
          content: program.questions.map((question) => ({
            type: "listItem",
            content: [richParagraph(question)],
          })),
        }),
      },
    ]);
}

for (const material of publications) {
  const key = "/publications/" + material.slug;
  const article = "sources" in material ? material : undefined;
  makeEntry(
    key,
    material.title,
    material.description,
    "publication",
    material.body?.length
      ? [
          {
            id: "body",
            type: "text",
            doc: richDoc(...material.body.map(richParagraph)),
          },
        ]
      : [],
    article
      ? {
          cover: image("Обложка", article.imageKey),
          category: field("Рубрика", article.category),
        }
      : {},
  );
  if (article)
    makeEntry(key + "~sources", "Источники статьи", "", "section", [
      resourceBlock("sources", "Источники статьи", article.sources),
    ]);
}

makeEntry("/", site.name, site.description);

makeEntry("/~announcement", "Информационная полоса", "", "section", [], {
  headline: field("Заголовок", "Философия эпохи Возрождения"),
  subtitle: field("Подпись", "XIV–XVI века · " + programs.length + " программ"),
  button: field("Кнопка", "Каталог программ"),
  href: field("Ссылка кнопки", sections.research.href, "link"),
});

makeEntry(
  "/~hero",
  "Слайды главной",
  "",
  "section",
  [],
  Object.fromEntries(
    Array.from({ length: 6 }, (_, index) => {
      const slide = heroSlides[index];
      const label = "Слайд " + (index + 1) + " · ";
      return [
        [
          index + ".title",
          field(label + "заголовок", slide?.title ?? "", "text", index > 0),
        ],
        [
          index + ".description",
          field(label + "описание", slide?.description ?? "", "text", true),
        ],
        [
          index + ".action",
          field(label + "кнопка", slide?.action ?? "Открыть"),
        ],
        [index + ".href", field(label + "ссылка", slide?.href ?? "/", "link")],
        [index + ".image", image(label + "фон", slide?.image ?? "florence")],
      ];
    }).flat(),
  ),
);

makeEntry("/~featured", "Главные исследования", "", "section", [], {
  headline: field("Заголовок блока", "Главные исследования"),
  ...Object.fromEntries(
    articles.map((article, index) => [
      `article.${index}`,
      field("Позиция " + (index + 1), article.slug, "article"),
    ]),
  ),
});

makeEntry("/~video", "Рекомендуемое видео", "", "section", [], {
  cover: image("Обложка", featuredVideo.cover),
  url: field(
    "YouTube",
    featuredVideo.video ? "https://youtu.be/" + featuredVideo.video.id : "",
    "video",
    true,
  ),
  headline: field("Название", featuredVideo.video?.title ?? "", "text", true),
  author: field("Автор", featuredVideo.video?.author ?? "", "text", true),
  summary: field(
    "Описание",
    featuredVideo.video?.description ?? "",
    "text",
    true,
  ),
});
makeEntry(
  "/~programs",
  "Карточки исследовательских программ",
  "",
  "section",
  [],
  {
    headline: field("Заголовок блока", "Исследовательские программы"),
    ...Object.fromEntries(
      programs.flatMap((program) => [
        [
          program.slug + ".title",
          field(program.code + " · заголовок карточки", "", "text", true),
        ],
        [
          program.slug + ".image",
          field(program.code + " · изображение карточки", "", "image", true),
        ],
      ]),
    ),
  },
);
makeEntry("/~artwork", "Произведение дня", "", "section", [], {
  headline: field("Название", artwork.title),
  artist: field("Автор", artwork.artist),
  date: field("Дата", artwork.date, "text", true),
  summary: field("Описание", artwork.description),
  source: field("Ссылка на источник", artwork.source, "link"),
  sourceLabel: field("Текст ссылки", "Описание в Музеях Ватикана"),
  image: image("Изображение", "school"),
});
makeEntry(
  "/~gallery",
  "Историческая галерея",
  "",
  "section",
  [],
  Object.fromEntries(
    galleryImages.flatMap((item, index) => [
      [index + ".label", field("Подпись " + (index + 1), item.label)],
      [index + ".image", image("Изображение " + (index + 1), item.image)],
    ]),
  ),
);
makeEntry("/~archive", "Баннер архива", "", "section", [], {
  headline: field("Заголовок", "Откройте эпоху, которая изменила мир"),
  summary: field(
    "Описание",
    "Исследуйте идеи великих мыслителей, исторические документы и философские труды, сформировавшие новое мировоззрение европейского общества.",
  ),
  button: field("Кнопка", "Перейти в исторический архив"),
  href: field("Ссылка кнопки", sections.archive.href, "link"),
  image: image("Фон", "map"),
});
makeEntry(
  "/~topics",
  "Темы эпохи Возрождения",
  "",
  "section",
  [],
  Object.fromEntries(
    topics.flatMap((topic, index) => [
      [index + ".title", field("Название " + (index + 1), topic.title)],
      [index + ".href", field("Ссылка " + (index + 1), topic.href, "link")],
      [index + ".image", image("Фон " + (index + 1), topic.image)],
    ]),
  ),
);
makeEntry("/~footer", "Футер", "", "section", [], {
  summary: field("Описание центра", site.description),
  ...Object.fromEntries(
    footerGroups.flatMap((group, index) => [
      [index + ".title", field("Название группы " + (index + 1), group.title)],
      ...group.links.map((link, item) => [
        index + "." + item,
        field(group.title + " · " + link.title, link.title),
      ]),
    ]),
  ),
});
makeEntry(
  "/sources~images",
  "Подписи и источники изображений",
  "",
  "section",
  [],
  Object.fromEntries(
    Object.entries(images).flatMap(([key, asset]) => [
      [key + ".title", field(asset.title + " · название", asset.title)],
      [
        key + ".alt",
        field(asset.title + " · альтернативный текст", asset.alt, "text", true),
      ],
      [
        key + ".author",
        field(asset.title + " · автор", asset.creator, "text", true),
      ],
      [
        key + ".source",
        field(asset.title + " · источник", asset.sourceUrl, "link"),
      ],
      [
        key + ".license",
        field(asset.title + " · лицензия", asset.license, "text", true),
      ],
    ]),
  ),
);

export const cmsSeeds = entries;
export const seedByKey = new Map(entries.map((entry) => [entry.key, entry]));
export const articleChoices = articles.map(({ title, slug }) => ({
  title,
  slug,
}));

export function validNativeFields(document: CmsDocument, key: string) {
  const fields = seedByKey.get(key)?.fields ?? {};
  const values = document.fields;
  return (
    Object.keys(values).length === Object.keys(fields).length &&
    Object.entries(fields).every(([name, descriptor]) => {
      const value = values[name];
      if (typeof value !== "string") return false;
      if (!value.trim()) return Boolean(descriptor.optional);
      if (
        value.length >
        (descriptor.maximum ??
          (descriptor.type === "text" || !descriptor.type ? 1200 : 2048))
      )
        return false;
      switch (descriptor.type) {
        case "link":
          return isLink(value);
        case "image":
          return isImageUrl(value);
        case "video":
          return videoSource(value)?.type === "youtube";
        case "article":
          return newPathSchema.safeParse("/publications/" + value).success;
        default:
          return true;
      }
    })
  );
}

export function assetWithFields(
  fallback: ImageAsset,
  fields: Record<string, string> = {},
  url?: string,
): ImageAsset {
  const selected =
    Object.values(images).find((asset) => asset.src === url) ?? fallback;
  const key = Object.keys(images).find(
    (item) => images[item as ImageKey].src === selected.src,
  );
  if (url && url !== selected.src && isImageUrl(url))
    return {
      src: url,
      width: fallback.width,
      height: fallback.height,
      title: "",
      alt: "",
      creator: "",
      sourceUrl: "",
      license: "",
    };
  return {
    ...selected,
    title: fields[key + ".title"] ?? selected.title,
    alt: fields[key + ".alt"] ?? selected.alt,
    creator: fields[key + ".author"] ?? selected.creator,
    sourceUrl: fields[key + ".source"] ?? selected.sourceUrl,
    license: fields[key + ".license"] ?? selected.license,
  };
}
