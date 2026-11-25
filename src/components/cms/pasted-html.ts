import {
  safeAddress,
  safeAlignment,
  safeColor,
  safeFont,
  safeFontSize,
  safeLineHeight,
} from "@/lib/cms/content-format";

const attributes = new Set([
  "colspan",
  "rowspan",
  "colwidth",
  "data-colwidth",
  "start",
  "type",
  "open",
  "data-type",
  "data-checked",
  "data-indent",
  "data-language",
  "data-bg",
  "data-align",
]);

export function normalizePastedHtml(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const content = template.content;
  content
    .querySelectorAll(
      "script, style, link, meta, iframe, frame, object, embed, svg, math, img, video, audio, source, form, input, button, textarea, template",
    )
    .forEach((element) => element.remove());
  for (const element of content.querySelectorAll<HTMLElement>("*")) {
    const href =
      element.tagName === "A"
        ? safeAddress(element.getAttribute("href") ?? "")
        : undefined;
    const title = href ? element.getAttribute("title") : null;
    const styles = {
      color: safeColor(element.style.color || element.getAttribute("color")),
      backgroundColor: safeColor(
        element.style.backgroundColor || element.getAttribute("bgcolor"),
      ),
      fontFamily: safeFont(
        element.style.fontFamily || element.getAttribute("face"),
      ),
      fontSize: safeFontSize(element.style.fontSize),
      lineHeight: safeLineHeight(element.style.lineHeight),
      textAlign: safeAlignment(
        element.style.textAlign || element.getAttribute("align"),
      ),
      fontWeight: /^(?:bold|[1-9]00)$/.test(element.style.fontWeight)
        ? element.style.fontWeight
        : "",
      fontStyle: /^(?:italic|oblique)$/.test(element.style.fontStyle)
        ? "italic"
        : "",
      textDecoration: element.style.textDecoration
        .match(/\b(?:underline|line-through)\b/g)
        ?.join(" "),
    };
    const next =
      element.tagName === "FONT" ? document.createElement("span") : element;
    if (next !== element) {
      next.append(...element.childNodes);
      element.replaceWith(next);
    }
    for (const name of next.getAttributeNames())
      if (!attributes.has(name)) next.removeAttribute(name);
    if (href) next.setAttribute("href", href);
    if (title) next.setAttribute("title", title.slice(0, 240));
    for (const [key, value] of Object.entries(styles)) {
      if (value) next.style[key as keyof typeof styles] = value;
    }
    if (next.tagName === "TD" || next.tagName === "TH") {
      const color =
        safeColor(next.getAttribute("data-bg")) ?? styles.backgroundColor;
      const align =
        safeAlignment(next.getAttribute("data-align")) ?? styles.textAlign;
      next.removeAttribute("data-bg");
      next.removeAttribute("data-align");
      if (color) next.setAttribute("data-bg", color);
      if (align) next.setAttribute("data-align", align);
    }
  }
  return template.innerHTML;
}
