import { z } from "zod";

export const blockLabels = {
  heading: "Заголовок",
  subheading: "Подзаголовок",
  text: "Текст",
  image: "Изображение",
  gallery: "Галерея",
  video: "Видео",
  quote: "Цитата",
  table: "Таблица",
  list: "Список",
  divider: "Разделитель",
  note: "Информационный блок",
  history: "Историческая справка",
  biography: "Биография",
  timeline: "Хронология",
  publication: "Карточка публикации",
  sources: "Список источников",
  programs: "Исследовательские программы",
} as const;

export const fonts = ["Manrope", "Georgia", "Arial", "monospace"] as const;
export const fontSizes = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "32px",
] as const;
export const lineHeights = ["1.2", "1.5", "1.8", "2"] as const;
export const alignments = ["left", "center", "right", "justify"] as const;
export const imageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;
export const maxImageSize = 3 * 1024 * 1024;
// Leave space for the Server Action arguments and multipart envelope.
export const maxDocumentBytes = 4 * 1024 * 1024 - 32 * 1024;
export const maxRichDepth = 128;

export function exceedsDocumentTransport(json: string) {
  return new TextEncoder().encode(json).byteLength > maxDocumentBytes;
}

export function stripControlCharacters(value: string) {
  return Array.from(value)
    .filter(
      (character) => character >= " " && character !== String.fromCharCode(127),
    )
    .join("");
}

export function isHttps(value: string) {
  if (
    !/^https:\/\//i.test(value) ||
    /[\s\\]/.test(value) ||
    stripControlCharacters(value) !== value
  )
    return false;
  try {
    const url = new URL(value);
    return Boolean(
      url.hostname &&
      !url.username &&
      !url.password &&
      url.protocol === "https:",
    );
  } catch {
    return false;
  }
}

export function isLink(value: string) {
  return (
    isHttps(value) ||
    (/^\/(?![/\\])[^\\\s]*$/.test(value) &&
      stripControlCharacters(value) === value) ||
    /^#[a-zA-Z0-9_-]+$/.test(value)
  );
}

export function isImageUrl(value: string) {
  return (
    isHttps(value) ||
    mediaIdFromUrl(value) !== null ||
    /^\/images\/[a-z0-9-]+\.(?:webp|jpeg|jpg|png|avif|gif)$/i.test(value)
  );
}

export function mediaIdFromUrl(value: string) {
  return (
    /^\/cms\/media\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.exec(
      value,
    )?.[1] ?? null
  );
}

export function videoSource(value: string) {
  if (!isHttps(value)) return null;
  const url = new URL(value);
  const path = url.pathname.split("/").filter(Boolean);
  const short = path[0] === "shorts";
  let id: string | null | undefined;
  if (url.hostname === "youtu.be") id = path[0];
  if (
    [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "www.youtube-nocookie.com",
      "youtube-nocookie.com",
    ].includes(url.hostname)
  ) {
    if (path[0] === "watch") id = url.searchParams.get("v");
    if (short || path[0] === "embed" || path[0] === "live") id = path[1];
  }
  if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return {
      type: "youtube" as const,
      src: `https://www.youtube-nocookie.com/embed/${id}`,
      short,
      id,
    };
  }
  if (/\.(mp4|webm|ogv)$/i.test(url.pathname))
    return { type: "file" as const, src: url.href };
  return null;
}

const color = z.string().regex(/^#[\da-f]{6}$/i);
const textStyle = z
  .object({
    color: color.nullish(),
    backgroundColor: color.nullish(),
    fontFamily: z.enum(fonts).nullish(),
    fontSize: z.enum(fontSizes).nullish(),
    lineHeight: z.enum(lineHeights).nullish(),
  })
  .strict();
const link = z
  .object({
    href: z.string().refine(isLink, "недопустимый адрес ссылки"),
    target: z.enum(["_blank", "_self"]).nullish(),
    rel: z.string().max(60).nullish(),
    class: z.null().optional(),
    title: z.string().max(240).nullish(),
  })
  .strict();
const markType = z.enum([
  "bold",
  "italic",
  "strike",
  "underline",
  "code",
  "superscript",
  "subscript",
]);
const markSchema = z.union([
  z.object({ type: markType }).strict(),
  z.object({ type: z.literal("textStyle"), attrs: textStyle }).strict(),
  z.object({ type: z.literal("link"), attrs: link }).strict(),
]);

const empty = z.object({}).strict();
const textAlign = z.enum(alignments).nullish();
const indent = z.number().int().min(0).max(4).nullish();
const cellAttrs = z
  .object({
    colspan: z.number().int().min(1).max(1000),
    rowspan: z.number().int().min(1).max(65534),
    colwidth: z.array(z.number().int().min(0).max(2400)).nullable(),
    backgroundColor: color.nullish(),
    align: z.enum(alignments).nullish(),
  })
  .strict();

const nodeAttrs = {
  doc: empty,
  paragraph: z.object({ textAlign, indent }).strict(),
  heading: z
    .object({ level: z.number().int().min(1).max(6), textAlign, indent })
    .strict(),
  blockquote: empty,
  bulletList: empty,
  orderedList: z
    .object({
      start: z.number().int().min(-2147483648).max(2147483647).nullish(),
      type: z.enum(["1", "a", "A", "i", "I"]).nullish(),
    })
    .strict(),
  listItem: empty,
  taskList: empty,
  taskItem: z.object({ checked: z.boolean().optional() }).strict(),
  horizontalRule: empty,
  hardBreak: empty,
  codeBlock: z.object({ language: z.string().max(40).nullish() }).strict(),
  details: z.object({ open: z.boolean().nullish() }).strict(),
  detailsSummary: empty,
  detailsContent: empty,
  table: empty,
  tableRow: empty,
  tableHeader: cellAttrs,
  tableCell: cellAttrs,
  text: empty,
};

export type NodeName = keyof typeof nodeAttrs;
export const richNodeTypes = Object.keys(nodeAttrs) as [
  NodeName,
  ...NodeName[],
];
export type RichNode = {
  type: NodeName;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  text?: string;
  marks?: z.infer<typeof markSchema>[];
};
const nodeShape = z
  .object({
    type: z.enum(richNodeTypes),
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(z.unknown()).optional(),
    text: z.string().min(1).optional(),
    marks: z.array(markSchema).optional(),
  })
  .strict();

const blockNodes = new Set<NodeName>([
  "paragraph",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "taskList",
  "horizontalRule",
  "codeBlock",
  "details",
  "table",
]);
const inlineNodes = new Set<NodeName>(["text", "hardBreak"]);

function validChildren(node: z.infer<typeof nodeShape>, children: RichNode[]) {
  const every = (...types: NodeName[]) =>
    children.every(({ type }) => types.includes(type));
  switch (node.type) {
    case "doc":
    case "blockquote":
    case "detailsContent":
    case "tableCell":
    case "tableHeader":
      return (
        children.length > 0 &&
        children.every(({ type }) => blockNodes.has(type))
      );
    case "listItem":
    case "taskItem":
      return (
        children[0]?.type === "paragraph" &&
        children.every(({ type }) => blockNodes.has(type))
      );
    case "paragraph":
    case "heading":
    case "detailsSummary":
      return children.every(({ type }) => inlineNodes.has(type));
    case "codeBlock":
      return every("text") && children.every(({ marks }) => !marks?.length);
    case "bulletList":
    case "orderedList":
      return children.length > 0 && every("listItem");
    case "taskList":
      return children.length > 0 && every("taskItem");
    case "table":
      return children.length > 0 && every("tableRow");
    case "tableRow":
      return children.length > 0 && every("tableCell", "tableHeader");
    case "details":
      return (
        children.length === 2 &&
        children[0]?.type === "detailsSummary" &&
        children[1]?.type === "detailsContent"
      );
    default:
      return children.length === 0;
  }
}

export function richDocumentProblem(input: unknown) {
  function validate(value: unknown, positions: number[]): string | null {
    const label = positions.length
      ? "Текст, узел " + positions.join(".")
      : "Текст";
    if (positions.length > maxRichDepth)
      return label + " · слишком глубокая вложенность";
    const parsed = nodeShape.safeParse(value);
    if (!parsed.success)
      return label + " · неизвестный тип узла или неверный формат";
    const node = parsed.data;
    if (!positions.length && node.type !== "doc")
      return label + " · отсутствует корневой документ";
    const attrs = nodeAttrs[node.type].safeParse(node.attrs ?? {});
    if (!attrs.success)
      return (
        label +
        " · некорректный атрибут " +
        String(attrs.error.issues[0]?.path[0] ?? node.type)
      );
    if (
      node.type === "text"
        ? !node.text || node.content !== undefined
        : node.text !== undefined
    )
      return label + " · текст находится вне допустимого текстового узла";
    if (node.marks && !inlineNodes.has(node.type))
      return label + " · форматирование находится вне строки текста";
    const children = node.content ?? [];
    for (const [index, child] of children.entries()) {
      const problem = validate(child, [...positions, index + 1]);
      if (problem) return problem;
    }
    return validChildren(node, children as RichNode[])
      ? null
      : label + " · нарушена структура узла «" + node.type + "»";
  }
  return validate(input, []);
}

export const mediaSchema = z
  .object({
    url: z.string().refine(isImageUrl),
    alt: z.string(),
    caption: z.string(),
    author: z.string(),
    source: z.string().refine((value) => value === "" || isHttps(value)),
    license: z.string(),
    width: z.number().min(10).max(100),
    maxWidth: z.number().int().min(100).max(2400).nullable().optional(),
    height: z.number().int().min(50).max(1800).nullable().optional(),
    align: z.enum(["left", "center", "right"]),
    wrap: z.boolean(),
  })
  .strict();
const videoSchema = z
  .object({
    url: z.string().refine((value) => Boolean(videoSource(value))),
    caption: z.string(),
    width: z.number().min(20).max(100),
    align: z.enum(["left", "center", "right"]),
  })
  .strict();
export type CmsImage = z.infer<typeof mediaSchema>;
export type CmsVideo = z.infer<typeof videoSchema>;

export const blockSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
    type: z.enum(
      Object.keys(blockLabels) as [
        keyof typeof blockLabels,
        ...(keyof typeof blockLabels)[],
      ],
    ),
    anchor: z
      .string()
      .regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/)
      .optional(),
    doc: z.custom<RichNode>((value) => richDocumentProblem(value) === null),
    images: z.array(mediaSchema).optional(),
    video: videoSchema.optional(),
  })
  .strict()
  .refine(
    ({ type, images, video }) =>
      (!images ||
        (type === "image" && images.length <= 1) ||
        type === "gallery") &&
      (!video || type === "video"),
  );

export const documentSchema = z
  .object({
    format: z.literal(1),
    title: z.string().trim().min(1),
    description: z.string(),
    fields: z.record(z.string().regex(/^[a-zA-Z0-9_.-]{1,100}$/), z.string()),
    blocks: z.array(blockSchema),
  })
  .strict()
  .superRefine((document, context) => {
    const ids = new Set(document.blocks.map(({ id }) => id));
    const anchors = document.blocks.flatMap(({ anchor }) =>
      anchor ? [anchor] : [],
    );
    if (
      ids.size !== document.blocks.length ||
      new Set(anchors).size !== anchors.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["blocks"],
        message: "Идентификаторы блоков и якоря должны быть уникальными.",
      });
    }
  });

export type CmsDocument = z.infer<typeof documentSchema>;
export type CmsBlock = z.infer<typeof blockSchema>;
export type CmsBlockType = CmsBlock["type"];

export const pageKeySchema = z
  .string()
  .max(180)
  .regex(/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?(?:~[a-z0-9.-]+)?$/);
export const newPathSchema = z
  .string()
  .regex(/^\/(?:publications|pages|thinkers)\/[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(100);

export function richText(value: string): RichNode {
  return { type: "text", text: value };
}

export function richParagraph(value = ""): RichNode {
  return {
    type: "paragraph",
    ...(value ? { content: [richText(value)] } : {}),
  };
}

export function richDoc(...nodes: RichNode[]): RichNode {
  return { type: "doc", content: nodes.length ? nodes : [richParagraph()] };
}

export function richHeading(value: string, level = 2): RichNode {
  return {
    type: "heading",
    attrs: { level },
    ...(value ? { content: [richText(value)] } : {}),
  };
}

export function plainText(node: RichNode): string {
  if (node.type === "hardBreak") return "\n";
  const inline = [
    "heading",
    "paragraph",
    "detailsSummary",
    "codeBlock",
  ].includes(node.type);
  return (
    node.text ?? node.content?.map(plainText).join(inline ? "" : " ") ?? ""
  );
}

export function documentText(document: CmsDocument) {
  return [
    document.title,
    document.description,
    ...Object.values(document.fields),
    ...document.blocks.map(({ doc }) => plainText(doc)),
  ].join(" ");
}
