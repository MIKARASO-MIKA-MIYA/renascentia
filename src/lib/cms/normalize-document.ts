import type { Field } from "./registry";
import {
  anchorSlug,
  safeAddress,
  safeAlignment,
  safeColor,
  safeFont,
  safeFontSize,
  safeLineHeight,
  unsafeAddress,
} from "./content-format";
import {
  blockLabels,
  documentSchema,
  isHttps,
  isImageUrl,
  maxRichDepth,
  newPathSchema,
  plainText,
  richDocumentProblem,
  richNodeTypes,
  richParagraph,
  videoSource,
  type CmsBlock,
  type CmsDocument,
  type CmsImage,
  type CmsVideo,
  type NodeName,
  type RichNode,
} from "./schema";

export type DocumentNotice = {
  level: "repair" | "warning";
  field: string;
  message: string;
};
type NormalizedDocument =
  | { ok: true; body: CmsDocument; notices: DocumentNotice[] }
  | { ok: false; field: string; message: string };
type Notice = (
  level: DocumentNotice["level"],
  field: string,
  message: string,
) => void;
type RecordValue = Record<string, unknown>;

class InvalidContent extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

function record(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

const text = (value: unknown) =>
  typeof value === "string" ? value.replaceAll("\0", "\ufffd") : "";

function range(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
  rounded = false,
) {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^-?\d+(?:\.\d+)?%?$/.test(value.trim())
        ? Number(value.trim().replace(/%$/, ""))
        : fallback;
  const bounded = Number.isFinite(number)
    ? Math.min(maximum, Math.max(minimum, number))
    : fallback;
  return rounded ? Math.round(bounded) : bounded;
}

const simpleMarks = new Set([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "superscript",
  "subscript",
]);
const nodeTypes = new Set<string>(richNodeTypes);
const blockTypes = new Set<string>(Object.keys(blockLabels));
const allowedAnchor = /^[A-Za-z][A-Za-z0-9_-]{0,79}$/;
const allowedId = /^[A-Za-z0-9_-]{1,80}$/;

function address(value: unknown, field: string, notice: Notice) {
  const raw = text(value);
  if (unsafeAddress(raw))
    throw new InvalidContent(
      field,
      "адрес использует опасный протокол или недопустимые учётные данные",
    );
  const safe = safeAddress(raw);
  if (safe && safe !== raw)
    notice("repair", field, "Адрес приведён к допустимому формату.");
  return safe;
}

const styleFields = {
  color: safeColor,
  backgroundColor: safeColor,
  fontFamily: safeFont,
  fontSize: safeFontSize,
  lineHeight: safeLineHeight,
};

function normalizeMarks(
  raw: unknown,
  field: string,
  notice: Notice,
): RichNode["marks"] {
  if (!Array.isArray(raw)) return undefined;
  const marks = new Map<string, NonNullable<RichNode["marks"]>[number]>();
  for (const item of raw) {
    const mark = record(item);
    const kind = text(mark?.type);
    if (simpleMarks.has(kind)) {
      marks.set(kind, { type: kind } as NonNullable<RichNode["marks"]>[number]);
    } else if (kind === "link") {
      const attrs = record(mark?.attrs) ?? {};
      const href = address(attrs.href, field + " · Адрес ссылки", notice);
      if (href) {
        const target =
          attrs.target === "_blank" || attrs.target === "_self"
            ? attrs.target
            : undefined;
        marks.set(kind, {
          type: "link",
          attrs: {
            href,
            ...(target ? { target } : {}),
            ...(typeof attrs.title === "string"
              ? { title: text(attrs.title).slice(0, 240) }
              : {}),
          },
        });
      } else
        notice(
          "warning",
          field + " · Адрес ссылки",
          "Недопустимый адрес снят со ссылки. Текст оставлен.",
        );
    } else if (kind === "textStyle") {
      const attrs = record(mark?.attrs) ?? {};
      const style = Object.fromEntries(
        Object.entries(styleFields).flatMap(([key, normalize]) => {
          const original = attrs[key];
          const value = normalize(original);
          if (original != null && value !== original)
            notice(
              value ? "repair" : "warning",
              field + " · Оформление текста",
              value
                ? "Приведены к допустимому виду цвет, шрифт или интервал."
                : "Неподдерживаемый стиль снят. Текст оставлен.",
            );
          return value ? [[key, value]] : [];
        }),
      );
      if (Object.keys(style).length)
        marks.set(kind, { type: "textStyle", attrs: style });
    } else
      notice(
        "repair",
        field + " · Оформление текста",
        "Неподдерживаемый стиль снят.",
      );
  }
  return marks.size ? [...marks.values()] : undefined;
}

function normalizeAttrs(
  type: NodeName,
  raw: unknown,
  field: string,
  notice: Notice,
) {
  const attrs = record(raw) ?? {};
  switch (type) {
    case "heading":
    case "paragraph": {
      const alignment = safeAlignment(attrs.textAlign);
      const indent = range(attrs.indent, 0, 0, 4, true);
      if (
        (attrs.textAlign != null && attrs.textAlign !== alignment) ||
        (attrs.indent != null && attrs.indent !== indent)
      ) {
        notice(
          "repair",
          field + " · Абзац",
          "Исправлены выравнивание или отступ.",
        );
      }
      return {
        ...(type === "heading"
          ? { level: range(attrs.level, 2, 1, 6, true) }
          : {}),
        ...(alignment ? { textAlign: alignment } : {}),
        ...(indent ? { indent } : {}),
      };
    }
    case "orderedList": {
      const style = ["1", "a", "A", "i", "I"].find(
        (value) => value === attrs.type,
      );
      const start = range(attrs.start, 1, -2147483648, 2147483647, true);
      return {
        ...(start !== 1 ? { start } : {}),
        ...(style ? { type: style } : {}),
      };
    }
    case "tableHeader":
    case "tableCell": {
      const colspan = range(attrs.colspan, 1, 1, 1000, true);
      const rowspan = range(attrs.rowspan, 1, 1, 65534, true);
      const colwidth = Array.isArray(attrs.colwidth)
        ? attrs.colwidth
            .slice(0, colspan)
            .map((width) => range(width, 0, 0, 2400, true))
        : null;
      const backgroundColor = safeColor(attrs.backgroundColor);
      const align = safeAlignment(attrs.align);
      if (
        (attrs.backgroundColor != null &&
          backgroundColor !== attrs.backgroundColor) ||
        (attrs.colspan != null && attrs.colspan !== colspan) ||
        (attrs.rowspan != null && attrs.rowspan !== rowspan) ||
        (attrs.colwidth != null &&
          JSON.stringify(colwidth) !== JSON.stringify(attrs.colwidth))
      ) {
        notice(
          "repair",
          field + " · Ячейка таблицы",
          "Нормализованы размеры или оформление ячейки.",
        );
      }
      return {
        colspan,
        rowspan,
        colwidth,
        ...(backgroundColor && { backgroundColor }),
        ...(align && { align }),
      };
    }
    case "taskItem":
      return typeof attrs.checked === "boolean"
        ? { checked: attrs.checked }
        : {};
    case "details":
      return typeof attrs.open === "boolean" ? { open: attrs.open } : {};
    case "codeBlock":
      return typeof attrs.language === "string"
        ? { language: text(attrs.language).slice(0, 40) }
        : {};
    default:
      return {};
  }
}

function normalizeRich(raw: unknown, field: string, notice: Notice): RichNode {
  function visit(value: unknown, path: number[]): RichNode | undefined {
    const location = path.length
      ? field + " · Текст, узел " + path.join(".")
      : field + " · Текст";
    if (path.length > maxRichDepth)
      throw new InvalidContent(
        location,
        "вложенность превышает предел обработки документа",
      );
    const node = record(value);
    if (!node || typeof node.type !== "string" || !nodeTypes.has(node.type)) {
      throw new InvalidContent(
        location,
        "неизвестный тип узла" +
          (node?.type ? " «" + text(node.type).slice(0, 50) + "»" : ""),
      );
    }
    const type = node.type as NodeName;
    if (node.content !== undefined && !Array.isArray(node.content))
      throw new InvalidContent(location, "содержимое узла должно быть списком");
    if (type === "text") {
      if (typeof node.text !== "string" || node.content !== undefined)
        throw new InvalidContent(location, "повреждён текстовый узел");
      const value = text(node.text);
      const marks = normalizeMarks(node.marks, field, notice);
      return value ? { type, text: value, ...(marks && { marks }) } : undefined;
    }
    if (node.text !== undefined)
      throw new InvalidContent(location, "текст записан вне текстового узла");
    const content =
      (node.content as unknown[] | undefined)?.flatMap((child, index) => {
        const normalized = visit(child, [...path, index + 1]);
        return normalized ? [normalized] : [];
      }) ?? [];
    if (
      !content.length &&
      [
        "doc",
        "blockquote",
        "tableCell",
        "tableHeader",
        "detailsContent",
        "listItem",
        "taskItem",
      ].includes(type)
    )
      content.push(richParagraph());
    if (
      !content.length &&
      (type === "bulletList" || type === "orderedList" || type === "taskList")
    ) {
      content.push({
        type: type === "taskList" ? "taskItem" : "listItem",
        content: [richParagraph()],
      });
    }
    if (type === "codeBlock") for (const child of content) delete child.marks;
    const attrs = normalizeAttrs(type, node.attrs, field, notice);
    return {
      type,
      ...(Object.keys(attrs).length ? { attrs } : {}),
      ...(content.length ? { content } : {}),
    };
  }
  const result = visit(raw, []);
  if (result?.type !== "doc")
    throw new InvalidContent(
      field + " · Текст",
      "отсутствует корневой документ",
    );
  return result;
}

function mediaWidth(
  value: unknown,
  min: number,
  field: string,
  notice: Notice,
) {
  const width = range(value, 100, min, 100);
  if (value != null && width !== value)
    notice(
      "repair",
      field + " · Ширина",
      "Размер приведён к ширине контейнера.",
    );
  return width;
}

function mediaAlign(value: unknown): CmsImage["align"] {
  const result = safeAlignment(value);
  return result === "left" || result === "right" ? result : "center";
}

function normalizeImage(
  raw: unknown,
  field: string,
  notice: Notice,
): CmsImage | undefined {
  const image = record(raw) ?? {};
  const url = address(image.url, field + " · Адрес изображения", notice);
  if (!url || !isImageUrl(url)) {
    notice(
      "warning",
      field + " · Адрес изображения",
      "Изображение пропущено. Нужна HTTPS-ссылка или запись медиатеки.",
    );
    return;
  }
  const source = address(
    image.source,
    field + " · Источник изображения",
    notice,
  );
  if (image.source && (!source || !isHttps(source)))
    notice(
      "warning",
      field + " · Источник изображения",
      "В источнике ожидается HTTPS-ссылка. Поле оставлено пустым.",
    );
  const alt = text(image.alt);
  if (!alt.trim())
    notice(
      "warning",
      field + " · Альтернативный текст",
      "У изображения нет альтернативного текста.",
    );
  const maxWidth =
    image.maxWidth == null || image.maxWidth === ""
      ? null
      : range(image.maxWidth, 2400, 100, 2400, true);
  const height =
    image.height == null || image.height === ""
      ? null
      : range(image.height, 1800, 50, 1800, true);
  if (
    (maxWidth !== null && maxWidth !== image.maxWidth) ||
    (height !== null && height !== image.height)
  ) {
    notice(
      "repair",
      field + " · Габариты изображения",
      "Слишком большой или некорректный размер приведён к допустимому.",
    );
  }
  return {
    url,
    alt,
    caption: text(image.caption),
    author: text(image.author),
    source: source && isHttps(source) ? source : "",
    license: text(image.license),
    width: mediaWidth(image.width, 10, field, notice),
    ...(maxWidth !== null && { maxWidth }),
    ...(height !== null && { height }),
    align: mediaAlign(image.align),
    wrap: image.wrap === true,
  };
}

function normalizeVideo(
  raw: unknown,
  field: string,
  notice: Notice,
): CmsVideo | undefined {
  const video = record(raw) ?? {};
  const url = address(video.url, field + " · Адрес видео", notice);
  if (!url || !videoSource(url)) {
    notice(
      "warning",
      field + " · Адрес видео",
      "Видео пропущено. Используйте YouTube или прямую HTTPS-ссылку на MP4, WebM или OGV.",
    );
    return;
  }
  return {
    url,
    caption: text(video.caption),
    width: mediaWidth(video.width, 20, field, notice),
    align: mediaAlign(video.align),
  };
}

function normalizeFields(
  raw: unknown,
  definitions: Record<string, Field>,
  notice: Notice,
) {
  const input = record(raw) ?? {};
  return Object.fromEntries(
    Object.entries(definitions).map(([name, descriptor]) => {
      const label = "Поля макета · " + descriptor.label;
      let value =
        typeof input[name] === "string" ? text(input[name]) : descriptor.value;
      if (!value.trim())
        return [name, descriptor.optional ? "" : descriptor.value];
      const kind = descriptor.type;
      if (kind === "image" || kind === "link" || kind === "video") {
        const url = address(value, label, notice);
        const valid =
          url &&
          (kind === "link" ||
            (kind === "image"
              ? isImageUrl(url)
              : videoSource(url)?.type === "youtube"));
        if (!valid)
          notice(
            "warning",
            label,
            "Этот адрес не подходит. Использовано исходное значение.",
          );
        value = valid ? url : descriptor.value;
      } else if (
        kind === "article" &&
        !newPathSchema.safeParse("/publications/" + value).success
      ) {
        notice(
          "warning",
          label,
          "Адрес публикации не распознан. Восстановлено исходное значение.",
        );
        value = descriptor.value;
      }
      return [name, value];
    }),
  );
}

function unique(
  base: string,
  claimed: Set<string>,
  reserved: Set<string>,
  supplied: boolean,
) {
  let value = base;
  let suffix = 2;
  while (
    claimed.has(value) ||
    (reserved.has(value) && (!supplied || value !== base))
  ) {
    value = base.slice(0, 72) + "-" + suffix++;
  }
  claimed.add(value);
  return value;
}

export function normalizeDocument(
  raw: unknown,
  options: { title?: string; fields?: Record<string, Field> } = {},
): NormalizedDocument {
  const notices = new Map<string, DocumentNotice>();
  const notice: Notice = (level, field, message) => {
    if (notices.size < 100)
      notices.set(level + field + message, { level, field, message });
  };
  try {
    const input = record(raw);
    if (!input || input.format !== 1)
      throw new InvalidContent("Документ", "версия формата не поддерживается");
    if (!Array.isArray(input.blocks))
      throw new InvalidContent(
        "Блоки",
        "в документе отсутствует список блоков",
      );
    const title = text(input.title).trim() || options.title || "Без названия";
    if (!text(input.title).trim())
      notice(
        "warning",
        "Заголовок материала",
        "Использован исходный или стандартный заголовок.",
      );
    const ids = new Set<string>();
    const anchors = new Set<string>();
    const reservedIds = new Set(
      input.blocks
        .map((block) => text(record(block)?.id))
        .filter((id) => allowedId.test(id)),
    );
    const reservedAnchors = new Set(
      input.blocks
        .map((block) => text(record(block)?.anchor))
        .filter((anchor) => allowedAnchor.test(anchor)),
    );
    const blocks = input.blocks.map((raw, index): CmsBlock => {
      const block = record(raw);
      const type = text(block?.type);
      const name = "Блок " + (index + 1);
      if (!block || !blockTypes.has(type))
        throw new InvalidContent(
          name + " · Тип",
          "тип блока не поддерживается",
        );
      const blockType = type as CmsBlock["type"];
      const label = name + " («" + blockLabels[blockType] + "»)";
      const suppliedId = text(block.id);
      const hasId = allowedId.test(suppliedId);
      const base = hasId ? suppliedId : "block-" + (index + 1);
      const id = unique(base, ids, reservedIds, hasId);
      if (id !== suppliedId)
        notice(
          "repair",
          label + " · Идентификатор",
          "Присвоен уникальный идентификатор.",
        );
      const doc = normalizeRich(block.doc, label, notice);
      const suppliedAnchor = text(block.anchor).trim();
      const validAnchor = allowedAnchor.test(suppliedAnchor);
      const generateAnchor =
        suppliedAnchor || blockType === "heading" || blockType === "subheading";
      let anchor: string | undefined;
      if (generateAnchor) {
        const base = validAnchor
          ? suppliedAnchor
          : anchorSlug(suppliedAnchor || plainText(doc)) ||
            "blok-" + (index + 1);
        anchor = unique(base, anchors, reservedAnchors, validAnchor);
        if (anchor !== suppliedAnchor)
          notice(
            "repair",
            label + " · Якорь",
            "Назначен уникальный якорь #" + anchor + ".",
          );
      }
      const images =
        Array.isArray(block.images) &&
        (blockType === "image" || blockType === "gallery")
          ? (blockType === "image"
              ? block.images.slice(0, 1)
              : block.images
            ).flatMap((image, index) => {
              const normalized = normalizeImage(
                image,
                label + " · Изображение " + (index + 1),
                notice,
              );
              return normalized ? [normalized] : [];
            })
          : undefined;
      const video =
        blockType === "video" && block.video != null
          ? normalizeVideo(block.video, label, notice)
          : undefined;
      return {
        id,
        type: blockType,
        doc,
        ...(anchor && { anchor }),
        ...(images?.length ? { images } : {}),
        ...(video && { video }),
      };
    });
    const body = documentSchema.safeParse({
      format: 1,
      title,
      description: text(input.description),
      fields: normalizeFields(input.fields, options.fields ?? {}, notice),
      blocks,
    });
    if (!body.success) {
      const path = body.error.issues[0]?.path ?? [];
      if (
        path[0] === "blocks" &&
        typeof path[1] === "number" &&
        path[2] === "doc"
      ) {
        const problem = richDocumentProblem(blocks[path[1]]?.doc);
        if (problem) throw new InvalidContent("Блок " + (path[1] + 1), problem);
      }
      const field =
        path[0] === "blocks" && typeof path[1] === "number"
          ? "Блок " + (path[1] + 1) + " · " + String(path[2] ?? "Структура")
          : String(path[0] ?? "Документ");
      throw new InvalidContent(
        field,
        "содержимое не соответствует формату хранения",
      );
    }
    return { ok: true, body: body.data, notices: [...notices.values()] };
  } catch (error) {
    if (error instanceof InvalidContent)
      return { ok: false, field: error.field, message: error.message };
    throw error;
  }
}
