import { plainText, type CmsDocument, type RichNode } from "./schema";

const escaped = (text: string) => text.replace(/[\\`*_{}[\]<>~|#]/g, "\\$&");
const destination = (href: string) =>
  "<" + href.replaceAll("<", "%3C").replaceAll(">", "%3E") + ">";

function fenced(code: string) {
  const longest = Math.max(
    2,
    ...(code.match(/`+/g) ?? []).map((part) => part.length),
  );
  const fence = "`".repeat(longest + 1);
  return fence + "\n" + code + "\n" + fence;
}

function markdown(node: RichNode): string {
  const children = node.content ?? [];
  const inline = () => children.map(markdown).join("");
  const blocks = () => children.map(markdown).join("\n\n");
  switch (node.type) {
    case "text": {
      let text = escaped(node.text ?? "");
      for (const mark of node.marks ?? []) {
        if (mark.type === "bold") text = "**" + text + "**";
        if (mark.type === "italic") text = "*" + text + "*";
        if (mark.type === "strike") text = "~~" + text + "~~";
        if (mark.type === "code") {
          const value = node.text ?? "";
          const tick = "`".repeat(
            Math.max(
              0,
              ...(value.match(/`+/g) ?? []).map((part) => part.length),
            ) + 1,
          );
          text = tick + " " + value + " " + tick;
        }
        if (mark.type === "link")
          text = "[" + text + "](" + destination(mark.attrs.href) + ")";
      }
      return text;
    }
    case "heading":
      return "#".repeat(Number(node.attrs?.level) || 2) + " " + inline();
    case "paragraph":
    case "detailsSummary":
      return inline();
    case "hardBreak":
      return "  \n";
    case "horizontalRule":
      return "---";
    case "blockquote":
      return blocks()
        .split("\n")
        .map((line) => "> " + line)
        .join("\n");
    case "codeBlock":
      return fenced(plainText(node));
    case "orderedList":
    case "bulletList":
    case "taskList":
      return children
        .map((child, index) => {
          const marker =
            node.type === "orderedList"
              ? index + (Number(node.attrs?.start) || 1) + ". "
              : node.type === "taskList"
                ? "- [" + (child.attrs?.checked ? "x" : " ") + "] "
                : "- ";
          const [first = "", ...rest] = (child.content ?? [])
            .map(markdown)
            .join("\n")
            .split("\n");
          return [
            marker + first,
            ...rest.map((line) => " ".repeat(marker.length) + line),
          ].join("\n");
        })
        .join("\n");
    case "table": {
      const rows = children.map((row) =>
        (row.content ?? []).map((cell) => markdown(cell).replace(/\n+/g, " ")),
      );
      const columns = Math.max(1, ...rows.map((row) => row.length));
      const row = (cells: string[]) =>
        "| " +
        Array.from({ length: columns }, (_, index) => cells[index] || " ").join(
          " | ",
        ) +
        " |";
      return [
        row(rows[0] ?? []),
        row(Array.from({ length: columns }, () => "---")),
        ...rows.slice(1).map(row),
      ].join("\n");
    }
    default:
      return blocks();
  }
}

export function toMarkdown(document: CmsDocument) {
  return (
    [
      "# " + escaped(document.title),
      escaped(document.description),
      ...document.blocks.flatMap((block) => [
        ...(block.images?.map(
          (image) =>
            "![" +
            escaped(image.alt) +
            "](" +
            destination(image.url) +
            ")" +
            (image.caption ? "\n\n" + escaped(image.caption) : "") +
            ([image.author, image.license, image.source].some(Boolean)
              ? "\n\n" +
                [
                  escaped(image.author),
                  escaped(image.license),
                  image.source &&
                    "[Источник](" + destination(image.source) + ")",
                ]
                  .filter(Boolean)
                  .join(" · ")
              : ""),
        ) ?? []),
        block.video &&
          "[" +
            escaped(block.video.caption || "Видео") +
            "](" +
            destination(block.video.url) +
            ")",
        markdown(block.doc),
      ]),
    ]
      .filter(Boolean)
      .join("\n\n") + "\n"
  );
}
