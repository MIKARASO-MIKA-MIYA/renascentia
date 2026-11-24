"use client";

import { Extension, type Editor, type GlobalAttributes } from "@tiptap/core";
import {
  Details,
  DetailsContent,
  DetailsSummary,
} from "@tiptap/extension-details";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { useState, type ReactNode } from "react";
import {
  alignments,
  fonts,
  fontSizes,
  isLink,
  lineHeights,
  type RichNode,
} from "@/lib/cms/schema";

const Styles = Extension.create({
  name: "cmsStyles",
  addGlobalAttributes(): GlobalAttributes {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element: HTMLElement) =>
              Math.min(4, Math.max(0, Number(element.dataset.indent) || 0)),
            renderHTML: ({ indent }) =>
              indent
                ? {
                    "data-indent": indent,
                    style: `padding-inline-start: ${indent}em`,
                  }
                : {},
          },
        },
      },
      {
        types: ["tableHeader", "tableCell"],
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute("data-bg"),
            renderHTML: ({ backgroundColor }) =>
              backgroundColor
                ? {
                    "data-bg": backgroundColor,
                    style: "background-color:" + backgroundColor,
                  }
                : {},
          },
          align: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute("data-align"),
            renderHTML: ({ align }) =>
              align
                ? { "data-align": align, style: "text-align:" + align }
                : {},
          },
        },
      },
    ];
  },
});

const extensions = [
  StarterKit.configure({
    link: {
      openOnClick: false,
      defaultProtocol: "https",
      isAllowedUri: isLink,
    },
    undoRedo: false,
  }),
  TextStyleKit,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Subscript,
  Superscript,
  TaskList,
  TaskItem.configure({ nested: true }),
  Details.configure({ persist: true }),
  DetailsSummary,
  DetailsContent,
  TableKit.configure({ table: { resizable: true } }),
  Styles,
];

function EditButton({
  title,
  active,
  action,
  children,
}: {
  title: string;
  active?: boolean;
  action: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={action}
    >
      {children}
    </button>
  );
}

const alignLabels = ["Слева", "По центру", "Справа", "По ширине"];

function Toolbar({ editor }: { editor: Editor }) {
  const [linkVisible, setLinkVisible] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const chain = () => editor.chain().focus();
  const textStyle = editor.getAttributes("textStyle");
  const heading = editor.getAttributes("heading").level ?? 0;
  function setIndent(direction: number) {
    const type = editor.isActive("heading") ? "heading" : "paragraph";
    const value = Number(editor.getAttributes(type).indent ?? 0);
    chain()
      .updateAttributes(type, {
        indent: Math.max(0, Math.min(4, value + direction)),
      })
      .run();
  }
  function applyLink() {
    if (link && !isLink(link)) {
      setError("Используйте HTTPS-ссылку, путь сайта или якорь.");
      return;
    }
    const selection = chain().extendMarkRange("link");
    if (link) selection.setLink({ href: link, target: "_blank" }).run();
    else selection.unsetLink().run();
    setLinkVisible(false);
    setError("");
  }
  return (
    <div className="cms-toolbar" role="group" aria-label="Форматирование">
      <div className="cms-tools">
        <select
          aria-label="Стиль абзаца"
          value={heading}
          onChange={(event) => {
            const level = Number(event.target.value) as
              0 | 1 | 2 | 3 | 4 | 5 | 6;
            if (level) chain().setHeading({ level }).run();
            else chain().setParagraph().run();
          }}
        >
          <option value={0}>Абзац</option>
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <option key={level} value={level}>
              H{level}
            </option>
          ))}
        </select>
        <EditButton
          title="Жирный"
          active={editor.isActive("bold")}
          action={() => chain().toggleBold().run()}
        >
          <b>Ж</b>
        </EditButton>
        <EditButton
          title="Курсив"
          active={editor.isActive("italic")}
          action={() => chain().toggleItalic().run()}
        >
          <i>К</i>
        </EditButton>
        <EditButton
          title="Подчёркивание"
          active={editor.isActive("underline")}
          action={() => chain().toggleUnderline().run()}
        >
          <u>Ч</u>
        </EditButton>
        <EditButton
          title="Зачёркивание"
          active={editor.isActive("strike")}
          action={() => chain().toggleStrike().run()}
        >
          <s>З</s>
        </EditButton>
        <EditButton
          title="Верхний индекс"
          active={editor.isActive("superscript")}
          action={() => chain().toggleSuperscript().run()}
        >
          x²
        </EditButton>
        <EditButton
          title="Нижний индекс"
          active={editor.isActive("subscript")}
          action={() => chain().toggleSubscript().run()}
        >
          x₂
        </EditButton>
        <label title="Цвет текста">
          <span className="sr-only">Цвет текста</span>
          <input
            type="color"
            value={textStyle.color ?? "#191919"}
            onChange={(event) => chain().setColor(event.target.value).run()}
          />
        </label>
        <label title="Цвет выделения">
          <span className="sr-only">Цвет выделения</span>
          <input
            type="color"
            value={textStyle.backgroundColor ?? "#fff1a3"}
            onChange={(event) =>
              chain().setBackgroundColor(event.target.value).run()
            }
          />
        </label>
        <select
          aria-label="Шрифт"
          value={textStyle.fontFamily ?? ""}
          onChange={(event) =>
            (event.target.value
              ? chain().setFontFamily(event.target.value)
              : chain().unsetFontFamily()
            ).run()
          }
        >
          <option value="">Шрифт</option>
          {fonts.map((font) => (
            <option key={font}>{font}</option>
          ))}
        </select>
        <select
          aria-label="Размер шрифта"
          value={textStyle.fontSize ?? ""}
          onChange={(event) =>
            (event.target.value
              ? chain().setFontSize(event.target.value)
              : chain().unsetFontSize()
            ).run()
          }
        >
          <option value="">Размер</option>
          {fontSizes.map((size) => (
            <option key={size}>{size}</option>
          ))}
        </select>
        <select
          aria-label="Межстрочный интервал"
          value={textStyle.lineHeight ?? ""}
          onChange={(event) =>
            (event.target.value
              ? chain().setLineHeight(event.target.value)
              : chain().unsetLineHeight()
            ).run()
          }
        >
          <option value="">Интервал</option>
          {lineHeights.map((height) => (
            <option key={height}>{height}</option>
          ))}
        </select>
        <select
          aria-label="Выравнивание"
          value={
            editor.getAttributes("paragraph").textAlign ??
            editor.getAttributes("heading").textAlign ??
            ""
          }
          onChange={(event) =>
            (event.target.value
              ? chain().setTextAlign(event.target.value)
              : chain().unsetTextAlign()
            ).run()
          }
        >
          <option value="">Выравнивание</option>
          {alignments.map((align, index) => (
            <option key={align} value={align}>
              {alignLabels[index]}
            </option>
          ))}
        </select>
        <EditButton title="Увеличить отступ" action={() => setIndent(1)}>
          →|
        </EditButton>
        <EditButton title="Уменьшить отступ" action={() => setIndent(-1)}>
          |←
        </EditButton>
        <EditButton
          title="Очистить форматирование"
          action={() => chain().unsetAllMarks().clearNodes().run()}
        >
          Очистить
        </EditButton>
      </div>
      <div className="cms-tools">
        <EditButton
          title="Маркированный список"
          active={editor.isActive("bulletList")}
          action={() => chain().toggleBulletList().run()}
        >
          • Список
        </EditButton>
        <EditButton
          title="Нумерованный список"
          active={editor.isActive("orderedList")}
          action={() => chain().toggleOrderedList().run()}
        >
          1. Список
        </EditButton>
        <EditButton
          title="Чек-лист"
          active={editor.isActive("taskList")}
          action={() => chain().toggleTaskList().run()}
        >
          ☑
        </EditButton>
        <EditButton
          title="Вложить пункт списка"
          action={() =>
            chain()
              .sinkListItem(
                editor.isActive("taskItem") ? "taskItem" : "listItem",
              )
              .run()
          }
        >
          Глубже
        </EditButton>
        <EditButton
          title="Поднять пункт списка"
          action={() =>
            chain()
              .liftListItem(
                editor.isActive("taskItem") ? "taskItem" : "listItem",
              )
              .run()
          }
        >
          Выше
        </EditButton>
        <EditButton
          title="Цитата"
          active={editor.isActive("blockquote")}
          action={() => chain().toggleBlockquote().run()}
        >
          Цитата
        </EditButton>
        <EditButton
          title="Разделитель"
          action={() => chain().setHorizontalRule().run()}
        >
          Линия
        </EditButton>
        <EditButton
          title="Кодовый блок"
          active={editor.isActive("codeBlock")}
          action={() => chain().toggleCodeBlock().run()}
        >
          Код
        </EditButton>
        <EditButton
          title="Раскрывающийся блок"
          action={() => chain().setDetails().run()}
        >
          Раскрытие
        </EditButton>
        <EditButton
          title="Ссылка или ссылка на примечание"
          active={editor.isActive("link")}
          action={() => {
            setLink(editor.getAttributes("link").href ?? "");
            setLinkVisible(!linkVisible);
          }}
        >
          Ссылка
        </EditButton>
        <EditButton
          title="Добавить таблицу"
          action={() =>
            chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          Таблица
        </EditButton>
      </div>
      {linkVisible && (
        <div className="cms-tools">
          <input
            aria-label="Адрес ссылки"
            placeholder="https://… или #примечание"
            value={link}
            onChange={(event) => setLink(event.target.value)}
          />
          <button type="button" onClick={applyLink}>
            Применить
          </button>
          {error && <span role="alert">{error}</span>}
        </div>
      )}
      {editor.isActive("table") && (
        <div className="cms-tools">
          <EditButton
            title="Добавить строку сверху"
            action={() => chain().addRowBefore().run()}
          >
            + Строка сверху
          </EditButton>
          <EditButton
            title="Добавить строку снизу"
            action={() => chain().addRowAfter().run()}
          >
            + Строка снизу
          </EditButton>
          <EditButton
            title="Удалить строку"
            action={() => chain().deleteRow().run()}
          >
            − Строка
          </EditButton>
          <EditButton
            title="Добавить столбец слева"
            action={() => chain().addColumnBefore().run()}
          >
            + Столбец слева
          </EditButton>
          <EditButton
            title="Добавить столбец справа"
            action={() => chain().addColumnAfter().run()}
          >
            + Столбец справа
          </EditButton>
          <EditButton
            title="Удалить столбец"
            action={() => chain().deleteColumn().run()}
          >
            − Столбец
          </EditButton>
          <EditButton
            title="Объединить или разделить ячейки"
            action={() => chain().mergeOrSplit().run()}
          >
            Объединить / разделить
          </EditButton>
          <EditButton
            title="Переключить заголовок таблицы"
            action={() => chain().toggleHeaderRow().run()}
          >
            Шапка
          </EditButton>
          <label title="Фон ячейки">
            <span className="sr-only">Фон ячейки</span>
            <input
              type="color"
              onChange={(event) =>
                chain()
                  .setCellAttribute("backgroundColor", event.target.value)
                  .run()
              }
            />
          </label>
          <select
            aria-label="Выравнивание в ячейке"
            onChange={(event) =>
              chain()
                .setCellAttribute("align", event.target.value || null)
                .run()
            }
          >
            <option value="">Текст в ячейке</option>
            {alignments.map((align, index) => (
              <option key={align} value={align}>
                {alignLabels[index]}
              </option>
            ))}
          </select>
          <EditButton
            title="Удалить таблицу"
            action={() => chain().deleteTable().run()}
          >
            Удалить таблицу
          </EditButton>
        </div>
      )}
    </div>
  );
}

export function RichEditor({
  content,
  onChange,
  onSlash,
}: {
  content: RichNode;
  onChange: (value: RichNode) => void;
  onSlash: () => void;
}) {
  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: "cms-rich cms-prosemirror",
        role: "textbox",
        "aria-label": "Текст блока",
        "aria-multiline": "true",
      },
      handleKeyDown(view, event) {
        if (
          event.key !== "/" ||
          event.ctrlKey ||
          event.metaKey ||
          event.isComposing ||
          view.state.selection.$from.parent.textContent.trim()
        )
          return false;
        onSlash();
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichNode),
  });
  if (!editor) return <p>Загрузка редактора…</p>;
  return (
    <>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
}
