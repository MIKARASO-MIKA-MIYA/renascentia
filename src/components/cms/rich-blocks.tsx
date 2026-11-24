import {
  createElement,
  Fragment,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  isImageUrl,
  isLink,
  videoSource,
  type CmsBlock,
  type CmsImage,
  type CmsVideo,
  type RichNode,
} from "@/lib/cms/schema";

function inline(node: RichNode) {
  let child: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold":
        child = <strong>{child}</strong>;
        break;
      case "italic":
        child = <em>{child}</em>;
        break;
      case "strike":
        child = <s>{child}</s>;
        break;
      case "underline":
        child = <u>{child}</u>;
        break;
      case "superscript":
        child = <sup>{child}</sup>;
        break;
      case "subscript":
        child = <sub>{child}</sub>;
        break;
      case "code":
        child = <code>{child}</code>;
        break;
      case "link": {
        const { href, target } = mark.attrs;
        if (isLink(href))
          child = (
            <a
              href={href}
              target={target ?? undefined}
              rel={target === "_blank" ? "noopener noreferrer" : undefined}
            >
              {child}
            </a>
          );
        break;
      }
      case "textStyle": {
        const { color, backgroundColor, fontFamily, fontSize, lineHeight } =
          mark.attrs;
        child = (
          <span
            style={{
              color: color ?? undefined,
              backgroundColor: backgroundColor ?? undefined,
              fontFamily:
                fontFamily === "Manrope"
                  ? "Manrope Variable, sans-serif"
                  : (fontFamily ?? undefined),
              fontSize: fontSize ?? undefined,
              lineHeight: lineHeight ?? undefined,
            }}
          >
            {child}
          </span>
        );
      }
    }
  }
  return child;
}

const simpleTags = {
  blockquote: "blockquote",
  bulletList: "ul",
  listItem: "li",
  detailsSummary: "summary",
  detailsContent: "div",
  tableRow: "tr",
  doc: Fragment,
} as const;

function renderNode(node: RichNode): ReactNode {
  const child = node.content?.map((item, index) => (
    <Fragment key={index}>{renderNode(item)}</Fragment>
  ));
  const attrs = node.attrs ?? {};
  switch (node.type) {
    case "text":
      return inline(node);
    case "paragraph":
    case "heading": {
      const level = Number(attrs.level);
      const tag =
        node.type === "heading" && level >= 1 && level <= 6 ? "h" + level : "p";
      return createElement(
        tag,
        {
          style: {
            textAlign: attrs.textAlign as CSSProperties["textAlign"],
            paddingInlineStart:
              typeof attrs.indent === "number" && attrs.indent > 0
                ? attrs.indent + "em"
                : undefined,
          },
        },
        child,
      );
    }
    case "hardBreak":
      return <br />;
    case "horizontalRule":
      return <hr />;
    case "orderedList":
      return (
        <ol
          start={Number(attrs.start) || 1}
          type={attrs.type as "1" | "a" | "A" | "i" | "I" | undefined}
        >
          {child}
        </ol>
      );
    case "taskList":
      return <ul className="cms-tasks">{child}</ul>;
    case "taskItem":
      return (
        <li>
          <input
            type="checkbox"
            checked={attrs.checked === true}
            readOnly
            disabled
            aria-label="Состояние задачи"
          />
          <div>{child}</div>
        </li>
      );
    case "details":
      return <details open={attrs.open === true}>{child}</details>;
    case "codeBlock":
      return (
        <pre>
          <code>{child}</code>
        </pre>
      );
    case "table": {
      const widths =
        node.content?.[0]?.content?.flatMap((cell) => {
          const attrs = cell.attrs ?? {};
          return Array.from(
            { length: Number(attrs.colspan) || 1 },
            (_, index) =>
              Array.isArray(attrs.colwidth)
                ? Number(attrs.colwidth[index]) || 0
                : 0,
          );
        }) ?? [];
      return (
        <div
          className="cms-table-wrap"
          role="region"
          aria-label="Таблица"
          tabIndex={0}
        >
          <table
            style={{
              minWidth:
                widths.reduce((sum, width) => sum + width, 0) || undefined,
            }}
          >
            {!!widths.length && (
              <colgroup>
                {widths.map((width, index) => (
                  <col key={index} style={{ width: width || undefined }} />
                ))}
              </colgroup>
            )}
            <tbody>{child}</tbody>
          </table>
        </div>
      );
    }
    case "tableCell":
    case "tableHeader":
      return createElement(
        node.type === "tableHeader" ? "th" : "td",
        {
          colSpan: Number(attrs.colspan) || 1,
          rowSpan: Number(attrs.rowspan) || 1,
          style: {
            backgroundColor: attrs.backgroundColor as string,
            textAlign: attrs.align as CSSProperties["textAlign"],
          },
        },
        child,
      );
    default:
      return createElement(simpleTags[node.type], null, child);
  }
}

export function RichText({ doc }: { doc: RichNode }) {
  return <div className="cms-rich">{renderNode(doc)}</div>;
}

export function CmsFigure({ image }: { image: CmsImage }) {
  if (!isImageUrl(image.url)) return null;
  return (
    <figure
      className="cms-figure"
      data-align={image.align}
      data-wrap={image.wrap && image.align !== "center"}
      style={{
        width: image.width + "%",
        maxWidth: image.maxWidth ?? undefined,
      }}
    >
      <a
        href={image.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={
          image.alt
            ? "Открыть в полном размере · " + image.alt
            : "Открыть изображение в полном размере"
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          style={{ maxHeight: image.height ?? undefined }}
        />
      </a>
      {(image.caption || image.author || image.license || image.source) && (
        <figcaption>
          {image.caption && <span>{image.caption}</span>}
          <span>
            {[image.author, image.license].filter(Boolean).join(" · ")}
            {image.source && isLink(image.source) && (
              <>
                {" "}
                <a href={image.source} rel="noreferrer">
                  Источник
                </a>
              </>
            )}
          </span>
        </figcaption>
      )}
    </figure>
  );
}

export function CmsMovie({ video }: { video: CmsVideo }) {
  const source = videoSource(video.url);
  if (!source) return null;
  return (
    <figure
      className="cms-figure cms-video"
      data-align={video.align}
      style={{ width: video.width + "%" }}
    >
      {source.type === "youtube" ? (
        <iframe
          src={source.src}
          title={video.caption || "Видео YouTube"}
          loading="lazy"
          className={source.short ? "cms-short" : ""}
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <video src={source.src} controls preload="metadata" playsInline />
      )}
      {video.caption && <figcaption>{video.caption}</figcaption>}
    </figure>
  );
}

export function RichBlocks({ blocks }: { blocks: CmsBlock[] }) {
  if (!blocks.length) return null;
  return (
    <div className="cms-blocks">
      {blocks.map((block) => (
        <section
          key={block.id}
          id={block.anchor}
          className="cms-block"
          data-kind={block.type}
        >
          {block.images?.length ? (
            <div
              className={block.type === "gallery" ? "cms-gallery" : undefined}
            >
              {block.images.map((image, index) => (
                <CmsFigure key={index} image={image} />
              ))}
            </div>
          ) : null}
          {block.video && <CmsMovie video={block.video} />}
          <RichText doc={block.doc} />
        </section>
      ))}
    </div>
  );
}
