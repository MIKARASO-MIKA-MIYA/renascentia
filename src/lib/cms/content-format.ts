import {
  alignments,
  fonts,
  fontSizes,
  isLink,
  isHttps,
  lineHeights,
  stripControlCharacters,
} from "./schema";

export function safeColor(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  const color = value.trim().toLowerCase();
  if (/^#[a-f0-9]{6}$/.test(color)) return color;
  if (/^#[a-f0-9]{3}$/.test(color))
    return "#" + [...color.slice(1)].map((part) => part + part).join("");
  const colors: Record<string, string> = {
    black: "#000000",
    white: "#ffffff",
    red: "#ff0000",
    blue: "#0000ff",
    green: "#008000",
    yellow: "#ffff00",
  };
  if (Object.hasOwn(colors, color)) return colors[color];
  const parts =
    /^rgba?\(\s*(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*[,/]\s*(0(?:\.\d+)?|1(?:\.0+)?))?\s*\)$/.exec(
      color,
    );
  if (!parts || parts[4] === "0") return;
  return (
    "#" +
    parts
      .slice(1, 4)
      .map((channel) =>
        Math.min(255, Number(channel)).toString(16).padStart(2, "0"),
      )
      .join("")
  );
}

export function safeFont(value: unknown) {
  if (typeof value !== "string") return;
  const parts = value
    .toLowerCase()
    .split(",")
    .map((part) => part.trim().replace(/^["']|["']$/g, ""));
  for (const part of parts) {
    const known = fonts.find((font) => font.toLowerCase() === part);
    if (known) return known;
    if (/^manrope\b/.test(part)) return "Manrope";
    if (/calibri|aptos|helvetica|sans-serif/.test(part)) return "Arial";
    if (/times|cambria|^serif$/.test(part)) return "Georgia";
    if (/courier|consolas|monospace/.test(part)) return "monospace";
  }
}

function closest<T extends string>(value: number, choices: readonly T[]): T {
  return choices.reduce((best, option) =>
    Math.abs(value - parseFloat(option)) < Math.abs(value - parseFloat(best))
      ? option
      : best,
  );
}

export function safeFontSize(value: unknown) {
  if (typeof value !== "string") return;
  const match = /^(\d+(?:\.\d+)?)\s*(px|pt|rem|em|%)$/.exec(
    value.trim().toLowerCase(),
  );
  if (!match) return;
  const factor = { px: 1, pt: 4 / 3, rem: 16, em: 16, "%": 0.16 }[match[2]];
  return closest(Number(match[1]) * (factor ?? 1), fontSizes);
}

export function safeLineHeight(value: unknown) {
  if (typeof value !== "string") return;
  const match = /^(\d+(?:\.\d+)?)\s*(px|%)?$/.exec(value.trim());
  if (!match) return;
  return closest(
    Number(match[1]) / (match[2] === "%" ? 100 : match[2] === "px" ? 16 : 1),
    lineHeights,
  );
}

export function safeAlignment(value: unknown) {
  if (typeof value !== "string") return;
  const normalized = value.trim().toLowerCase();
  return (
    alignments.find((alignment) => alignment === normalized) ??
    (normalized === "start"
      ? "left"
      : normalized === "end"
        ? "right"
        : undefined)
  );
}

export function unsafeAddress(value: string) {
  const collapsed = stripControlCharacters(value).replace(/\s/g, "");
  if (
    /^(?:javascript|data|vbscript|file|blob):/i.test(collapsed) ||
    /\\/.test(collapsed) ||
    collapsed.startsWith("//")
  )
    return true;
  if (/^https?:\/\//i.test(collapsed)) {
    try {
      const url = new URL(collapsed);
      return Boolean(url.username || url.password);
    } catch {
      return false;
    }
  }
  return false;
}

const cyrillicLetters = [..."абвгдеёжзийклмнопрстуфхцчшщъыьэюя"];
const latinLetters = [
  "a",
  "b",
  "v",
  "g",
  "d",
  "e",
  "yo",
  "zh",
  "z",
  "i",
  "y",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "r",
  "s",
  "t",
  "u",
  "f",
  "kh",
  "ts",
  "ch",
  "sh",
  "shch",
  "",
  "y",
  "",
  "e",
  "yu",
  "ya",
];

export function anchorSlug(value: string) {
  const normalized = value.toLowerCase().normalize("NFC");
  const slug = [...normalized]
    .map((character) => {
      const index = cyrillicLetters.indexOf(character);
      return index < 0 ? character : latinLetters[index];
    })
    .join("")
    .normalize("NFKD")
    .replace(/\p{Mark}+/gu, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
  return slug && /^[a-z]/.test(slug)
    ? slug.slice(0, 72)
    : slug
      ? ("blok-" + slug).slice(0, 72)
      : "";
}

export function safeAddress(value: string) {
  const trimmed = value.trim();
  if (unsafeAddress(trimmed)) return;
  if (isLink(trimmed)) return trimmed;
  if (/^http:\/\//i.test(trimmed)) {
    const upgraded = "https:" + trimmed.slice(5);
    if (isHttps(upgraded)) return upgraded;
  }
  if (trimmed.startsWith("#")) {
    const slug = anchorSlug(trimmed.slice(1));
    if (slug) return "#" + slug;
  }
}
