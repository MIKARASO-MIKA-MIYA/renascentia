"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Maximize,
  Minimize,
  Pencil,
  Redo2,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  loadHistory,
  loadVersion,
  writeEntry,
  type EditState,
  type VersionInfo,
} from "@/app/admin/actions";
import type { Field } from "@/lib/cms/registry";
import {
  blockLabels,
  documentSchema,
  plainText,
  richDoc,
  richHeading,
  richParagraph,
  type CmsBlock,
  type CmsBlockType,
  type CmsDocument,
  type CmsImage,
} from "@/lib/cms/schema";
import { CmsFigure, RichBlocks } from "./rich-blocks";
import {
  ImageSettings,
  MediaPicker,
  VideoSettings,
  imageFromItem,
  uploadFile,
} from "./media-controls";
import { RichEditor } from "./rich-editor";
import "./editor.css";

export type EditorOptions = {
  entryKey: string;
  builtIn: boolean;
  canPublish: boolean;
  owner: boolean;
  fields: [string, Field][];
  articles: { title: string; slug: string }[];
};
type Panel = "edit" | "preview" | "history";
type EditorProps = EditorOptions & { initial: EditState; onClose: () => void };
type Intent = "draft" | "publish" | "restore" | "unpublish";
const blockKinds = Object.keys(blockLabels) as CmsBlockType[];

function newBlock(type: CmsBlockType): CmsBlock {
  const block = { id: crypto.randomUUID(), type, doc: richDoc() };
  if (type === "heading" || type === "subheading")
    block.doc = richDoc(richHeading("", type === "heading" ? 2 : 3));
  if (type === "divider") block.doc = richDoc({ type: "horizontalRule" });
  if (type === "quote")
    block.doc = richDoc({ type: "blockquote", content: [richParagraph()] });
  if (["list", "sources", "programs"].includes(type)) {
    block.doc = richDoc({
      type: "bulletList",
      content: [{ type: "listItem", content: [richParagraph()] }],
    });
  }
  if (type === "table") {
    block.doc = richDoc({
      type: "table",
      content: [0, 1, 2].map((row) => ({
        type: "tableRow",
        content: [0, 1, 2].map(() => ({
          type: row === 0 ? "tableHeader" : "tableCell",
          attrs: { colspan: 1, rowspan: 1, colwidth: null },
          content: [richParagraph()],
        })),
      })),
    });
  }
  return block;
}

const eventName: Record<string, string> = {
  draft: "Черновик",
  publish: "Публикация",
  restore: "Восстановление",
  unpublish: "Снятие с публикации",
};

function AddBlock({
  index,
  open,
  onToggle,
  onAdd,
}: {
  index: number;
  open: boolean;
  onToggle: () => void;
  onAdd: (type: CmsBlockType) => void;
}) {
  const [filter, setFilter] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  const items = blockKinds.filter((type) =>
    blockLabels[type].toLowerCase().includes(filter.toLowerCase()),
  );
  return (
    <div className="cms-add">
      <button
        type="button"
        aria-expanded={open}
        aria-label={
          index === 0
            ? "Добавить блок в начало"
            : "Добавить блок после позиции " + index
        }
        onClick={() => {
          setFilter("");
          onToggle();
        }}
      >
        + Добавить блок
      </button>
      {open && (
        <div className="cms-command">
          <input
            ref={input}
            type="search"
            placeholder="Найти блок"
            aria-label="Найти блок"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && items[0]) {
                event.preventDefault();
                onAdd(items[0]);
              }
            }}
          />
          <div className="cms-tools">
            {items.map((type) => (
              <button key={type} type="button" onClick={() => onAdd(type)}>
                {blockLabels[type]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function VersionComparison({
  before,
  after,
}: {
  before: CmsDocument;
  after: CmsDocument;
}) {
  const asComparable = (value: unknown) =>
    JSON.stringify(value, (_, item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [key, item[key]]),
          )
        : item,
    );
  const blockBefore = new Map(
    before.blocks.map((block, index) => [block.id, { block, index }]),
  );
  const blockAfter = new Map(
    after.blocks.map((block, index) => [block.id, { block, index }]),
  );
  const rows = [
    ...new Set([...blockBefore.keys(), ...blockAfter.keys()]),
  ].flatMap((id) => {
    const previous = blockBefore.get(id);
    const current = blockAfter.get(id);
    if (asComparable(previous) === asComparable(current)) return [];
    const summarize = (entry?: { block: CmsBlock; index: number }) => {
      if (!entry) return "—";
      const { block, index } = entry;
      return [
        index + 1 + ". " + blockLabels[block.type],
        plainText(block.doc),
        block.anchor && "#" + block.anchor,
        ...(block.images?.map((image) =>
          [image.url, image.caption, image.alt, image.width + "%"]
            .filter(Boolean)
            .join(" · "),
        ) ?? []),
        block.video && block.video.url,
      ]
        .filter(Boolean)
        .join("\n");
    };
    const before = summarize(previous);
    const after = summarize(current);
    return [
      {
        label:
          before === after
            ? "Блок · изменено оформление или параметры"
            : "Блок",
        before,
        after,
      },
    ];
  });
  const native = Object.keys({ ...before.fields, ...after.fields }).flatMap(
    (name) =>
      before.fields[name] === after.fields[name]
        ? []
        : [
            {
              label: name,
              before: before.fields[name],
              after: after.fields[name],
            },
          ],
  );
  const changes = [
    ...(before.title === after.title
      ? []
      : [{ label: "Заголовок", before: before.title, after: after.title }]),
    ...(before.description === after.description
      ? []
      : [
          {
            label: "Описание",
            before: before.description,
            after: after.description,
          },
        ]),
    ...native,
    ...rows,
  ];
  return changes.length ? (
    <div className="cms-diff">
      {changes.map((row, index) => (
        <div key={index}>
          <strong>{row.label}</strong>
          <del>{row.before || "—"}</del>
          <ins>{row.after || "—"}</ins>
        </div>
      ))}
    </div>
  ) : (
    <p>Содержимое совпадает.</p>
  );
}

export default function ContentEditor({
  initial,
  entryKey,
  builtIn,
  canPublish,
  owner,
  fields,
  articles,
  onClose,
}: EditorProps) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [body, setBody] = useState(initial.body);
  const [saved, setSaved] = useState(initial.body);
  const [revision, setRevision] = useState(initial.revision);
  const [published, setPublished] = useState(initial.published);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [addAt, setAddAt] = useState<number | null>(null);
  const [imageAt, setImageAt] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("edit");
  const [full, setFull] = useState(false);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(
    initial.revision ? "Черновик загружен" : "Начальная версия",
  );
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [undoStack, setUndoStack] = useState<CmsDocument[]>([]);
  const [redoStack, setRedoStack] = useState<CmsDocument[]>([]);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [selected, setSelected] = useState<{
    info: VersionInfo;
    body: CmsDocument;
  }>();
  const [compare, setCompare] = useState(false);
  const dirty = body !== saved;
  const hasRequest = useRef(false);
  const bodyRef = useRef(body);
  const activeIndex = body.blocks.findIndex(({ id }) => id === activeBlock);

  const replaceBody = useCallback(
    (next: CmsDocument, history = true) => {
      const previous = bodyRef.current;
      if (next === previous) return;
      if (history) {
        setUndoStack((stack) => [...stack.slice(-49), previous]);
        setRedoStack([]);
      }
      bodyRef.current = next;
      setBody(next);
      if (!conflict) setError("");
    },
    [conflict],
  );

  function updateBlock(id: string, updates: Partial<CmsBlock>) {
    const current = bodyRef.current;
    replaceBody({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block,
      ),
    });
  }

  function addBlock(
    type: CmsBlockType,
    index = addAt ?? bodyRef.current.blocks.length,
    image?: CmsImage,
  ) {
    const current = bodyRef.current;
    const block = newBlock(type);
    if (image) block.images = [image];
    replaceBody({
      ...current,
      blocks: [
        ...current.blocks.slice(0, index),
        block,
        ...current.blocks.slice(index),
      ],
    });
    setActiveBlock(block.id);
    setAddAt(null);
  }

  function move(id: string, target: number) {
    const current = bodyRef.current;
    const from = current.blocks.findIndex((block) => block.id === id);
    if (
      from < 0 ||
      from === target ||
      target < 0 ||
      target >= current.blocks.length
    )
      return;
    const blocks = current.blocks.slice();
    const [block] = blocks.splice(from, 1);
    blocks.splice(target, 0, block);
    replaceBody({ ...current, blocks });
  }

  const save = useCallback(
    async (intent: Intent, versionId?: number) => {
      if (hasRequest.current || conflict) return;
      const snapshot = bodyRef.current;
      if (
        (intent === "draft" || intent === "publish") &&
        !documentSchema.safeParse(snapshot).success
      ) {
        setError("Проверьте заголовок, размеры, ссылки и якоря блоков.");
        return;
      }
      hasRequest.current = true;
      setPending(true);
      setError("");
      setStatus(intent === "publish" ? "Публикация…" : "Сохранение…");
      try {
        const content = new FormData();
        if (intent === "draft" || intent === "publish")
          content.set("body", JSON.stringify(snapshot));
        const result = await writeEntry(
          { key: entryKey, intent, revision, versionId },
          content,
        );
        if (!result.ok) {
          setConflict(Boolean(result.conflict));
          setError(result.message);
          setStatus("Сохранение остановлено");
          return;
        }
        setRevision(result.data);
        if (intent === "restore" && selected) {
          replaceBody(selected.body);
          setSaved(selected.body);
          setEditorKey((key) => key + 1);
          setPanel("edit");
        } else if (intent !== "unpublish") setSaved(snapshot);
        if (intent === "publish" || intent === "unpublish") {
          setPublished(intent === "publish");
          router.refresh();
        }
        setStatus(
          intent === "publish"
            ? "Опубликовано"
            : intent === "unpublish"
              ? "Публикация снята"
              : "Черновик сохранён",
        );
      } catch {
        setError("Не удалось связаться с сервером. Повторите сохранение.");
        setStatus("Сохранение остановлено");
      } finally {
        hasRequest.current = false;
        setPending(false);
      }
    },
    [conflict, entryKey, replaceBody, revision, router, selected],
  );

  const close = useCallback(() => {
    if (
      (dirty || pending || uploading) &&
      !window.confirm("Выйти из редактора с несохранёнными изменениями?")
    )
      return;
    dialog.current?.close();
    onClose();
  }, [dirty, onClose, pending, uploading]);

  const undo = useCallback(() => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setRedoStack((stack) => [...stack, bodyRef.current]);
    setUndoStack(undoStack.slice(0, -1));
    replaceBody(previous, false);
    setEditorKey((key) => key + 1);
  }, [replaceBody, undoStack]);

  const redo = useCallback(() => {
    const next = redoStack.at(-1);
    if (!next) return;
    setUndoStack((stack) => [...stack, bodyRef.current]);
    setRedoStack(redoStack.slice(0, -1));
    replaceBody(next, false);
    setEditorKey((key) => key + 1);
  }, [redoStack, replaceBody]);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => {
    if (!dirty || error || pending || conflict || panel !== "edit") return;
    const timer = window.setTimeout(() => void save("draft"), 1800);
    return () => window.clearTimeout(timer);
  }, [body, dirty, error, pending, conflict, panel, save]);
  useEffect(() => {
    if (!dirty) return;
    function onUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);
  useEffect(() => {
    function shortcuts(event: KeyboardEvent) {
      if ((!event.ctrlKey && !event.metaKey) || event.isComposing) return;
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save("draft");
      }
      if (
        event.key.toLowerCase() === "z" &&
        !(
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        )
      ) {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    }
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, [save, undo, redo]);

  async function history(before?: number) {
    try {
      const result = await loadHistory(entryKey, before);
      if (result.ok) {
        setVersions((current) =>
          before ? [...current, ...result.data] : result.data,
        );
        setPanel("history");
      } else setError(result.message);
    } catch {
      setError("Не удалось загрузить историю.");
    }
  }

  async function showVersion(info: VersionInfo) {
    try {
      const result = await loadVersion(entryKey, info.id);
      if (result.ok) {
        setSelected({ info, body: result.data });
        setCompare(false);
      } else setError(result.message);
    } catch {
      setError("Не удалось открыть версию.");
    }
  }

  async function addFile(file: File) {
    if (uploading) return;
    setUploading(true);
    setError("");
    try {
      const result = await uploadFile(file);
      if (!result.ok) return setError(result.message);
      const image = imageFromItem(result.data);
      const current = bodyRef.current.blocks.find(
        ({ id }) => id === activeBlock,
      );
      if (current?.type === "image")
        updateBlock(current.id, { images: [image] });
      else if (current?.type === "gallery")
        updateBlock(current.id, { images: [...(current.images ?? []), image] });
      else
        addBlock(
          "image",
          activeIndex < 0 ? bodyRef.current.blocks.length : activeIndex + 1,
          image,
        );
    } catch {
      setError("Не удалось загрузить изображение.");
    } finally {
      setUploading(false);
    }
  }

  function renderAdd(index: number) {
    return (
      <AddBlock
        index={index}
        open={addAt === index}
        onToggle={() => setAddAt(addAt === index ? null : index)}
        onAdd={(type) => addBlock(type, index)}
      />
    );
  }

  function fieldChange(name: string, value: string) {
    const current = bodyRef.current;
    replaceBody({ ...current, fields: { ...current.fields, [name]: value } });
  }

  return (
    <dialog
      ref={dialog}
      className="cms-dialog"
      data-full={full}
      aria-labelledby="cms-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (addAt !== null) setAddAt(null);
        else close();
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) event.preventDefault();
      }}
      onDropCapture={(event) => {
        const file = event.dataTransfer.files[0];
        if (panel === "edit" && file) {
          event.preventDefault();
          event.stopPropagation();
          void addFile(file);
        }
      }}
      onPasteCapture={(event) => {
        const file = event.clipboardData.files[0];
        if (panel === "edit" && file) {
          event.preventDefault();
          event.stopPropagation();
          void addFile(file);
        }
      }}
    >
      <header className="cms-dialog-head">
        <div>
          <h2 id="cms-dialog-title">Редактирование</h2>
          <p>{entryKey}</p>
        </div>
        <div className="cms-tools">
          <IconButton
            title={full ? "Выйти из полноэкранного режима" : "На весь экран"}
            onClick={() => setFull(!full)}
          >
            {full ? <Minimize size={18} /> : <Maximize size={18} />}
          </IconButton>
          <IconButton title="Выйти из редактора" onClick={close}>
            <X size={18} />
          </IconButton>
        </div>
      </header>
      <div className="cms-editor-bar">
        <div className="cms-tools">
          <IconButton
            title="Отменить"
            disabled={!undoStack.length}
            onClick={undo}
          >
            <Undo2 size={17} />
          </IconButton>
          <IconButton
            title="Повторить"
            disabled={!redoStack.length}
            onClick={redo}
          >
            <Redo2 size={17} />
          </IconButton>
          <button
            type="button"
            aria-pressed={panel === "preview"}
            onClick={() => setPanel(panel === "preview" ? "edit" : "preview")}
          >
            {panel === "preview"
              ? "Вернуться к редактированию"
              : "Предпросмотр"}
          </button>
          <button
            type="button"
            aria-pressed={panel === "history"}
            onClick={() =>
              panel === "history" ? setPanel("edit") : void history()
            }
          >
            История
          </button>
          <button
            type="button"
            disabled={pending || conflict}
            onClick={() => void save("draft")}
          >
            Сохранить черновик
          </button>
          {canPublish && (
            <button
              type="button"
              className="cms-primary"
              disabled={pending || conflict}
              onClick={() => void save("publish")}
            >
              Опубликовать
            </button>
          )}
          {canPublish && !builtIn && published && (
            <button
              type="button"
              disabled={pending || conflict}
              onClick={() => {
                if (window.confirm("Снять материал с публикации?"))
                  void save("unpublish");
              }}
            >
              Снять с публикации
            </button>
          )}
        </div>
        <p role="status">
          {uploading
            ? "Загрузка изображения…"
            : dirty && !pending && !error
              ? "Есть несохранённые изменения"
              : status}
        </p>
        {error && (
          <p className="cms-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="cms-dialog-content">
        {panel === "edit" && (
          <>
            <div className="cms-form-grid">
              <label>
                Заголовок
                <input
                  value={body.title}
                  maxLength={220}
                  onChange={(event) =>
                    replaceBody({
                      ...bodyRef.current,
                      title: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Описание
                <textarea
                  value={body.description}
                  maxLength={1200}
                  onChange={(event) =>
                    replaceBody({
                      ...bodyRef.current,
                      description: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            {!!fields.length && (
              <details className="cms-native" open={body.blocks.length === 0}>
                <summary>Поля макета</summary>
                <div className="cms-form-grid">
                  {fields.map(([name, field]) => (
                    <div key={name} className="cms-native-field">
                      <label>
                        {field.label}
                        {field.type === "article" ? (
                          <select
                            aria-label={field.label}
                            value={body.fields[name] ?? ""}
                            onChange={(event) =>
                              fieldChange(name, event.target.value)
                            }
                          >
                            {articles.map(({ slug, title }) => (
                              <option key={slug} value={slug}>
                                {title}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={body.fields[name] ?? ""}
                            maxLength={field.maximum ?? 2048}
                            onChange={(event) =>
                              fieldChange(name, event.target.value)
                            }
                          />
                        )}
                      </label>
                      {field.type === "image" && (
                        <button
                          type="button"
                          onClick={() =>
                            setImageAt(imageAt === name ? null : name)
                          }
                        >
                          Выбрать изображение
                        </button>
                      )}
                      {field.type === "image" && imageAt === name && (
                        <MediaPicker
                          onClose={() => setImageAt(null)}
                          onPick={(image) => {
                            fieldChange(name, image.url);
                            setImageAt(null);
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}
            {renderAdd(0)}
            {body.blocks.map((block, index) => (
              <div key={block.id}>
                <section
                  className="cms-edit-block"
                  data-active={activeBlock === block.id}
                  onDragOver={(event) => {
                    if (dragging) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    if (dragging) {
                      event.preventDefault();
                      move(dragging, index);
                      setDragging(null);
                    }
                  }}
                >
                  <div className="cms-block-head">
                    <div className="cms-tools">
                      <span
                        draggable
                        onDragStart={(event) => {
                          setDragging(block.id);
                          event.dataTransfer.setData("text/plain", block.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => setDragging(null)}
                        title="Перетащить блок"
                      >
                        <GripVertical size={17} aria-hidden="true" />
                      </span>
                      <strong>{blockLabels[block.type]}</strong>
                    </div>
                    <div className="cms-tools">
                      <IconButton
                        title="Редактировать блок"
                        onClick={() =>
                          setActiveBlock(
                            activeBlock === block.id ? null : block.id,
                          )
                        }
                      >
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton
                        title="Переместить блок вверх"
                        disabled={index === 0}
                        onClick={() => move(block.id, index - 1)}
                      >
                        <ArrowUp size={15} />
                      </IconButton>
                      <IconButton
                        title="Переместить блок вниз"
                        disabled={index === body.blocks.length - 1}
                        onClick={() => move(block.id, index + 1)}
                      >
                        <ArrowDown size={15} />
                      </IconButton>
                      <IconButton
                        title="Дублировать блок"
                        onClick={() => {
                          const current = bodyRef.current;
                          const copy = {
                            ...block,
                            id: crypto.randomUUID(),
                            anchor: undefined,
                          };
                          replaceBody({
                            ...current,
                            blocks: [
                              ...current.blocks.slice(0, index + 1),
                              copy,
                              ...current.blocks.slice(index + 1),
                            ],
                          });
                        }}
                      >
                        <Copy size={15} />
                      </IconButton>
                      <IconButton
                        title="Удалить блок"
                        onClick={() => {
                          const current = bodyRef.current;
                          replaceBody({
                            ...current,
                            blocks: current.blocks.filter(
                              ({ id }) => id !== block.id,
                            ),
                          });
                        }}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  </div>
                  {activeBlock === block.id ? (
                    <div className="cms-block-editor">
                      <label>
                        Якорь для ссылки или примечания
                        <input
                          value={block.anchor ?? ""}
                          placeholder="primechanie-1"
                          maxLength={80}
                          onChange={(event) =>
                            updateBlock(block.id, {
                              anchor: event.target.value || undefined,
                            })
                          }
                        />
                      </label>
                      {(block.type === "image" || block.type === "gallery") && (
                        <>
                          {block.images?.map((image, item) => (
                            <ImageSettings
                              key={item}
                              image={image}
                              onChange={(replacement) =>
                                updateBlock(block.id, {
                                  images: block.images?.map((img, index) =>
                                    index === item ? replacement : img,
                                  ),
                                })
                              }
                              onRemove={() =>
                                updateBlock(block.id, {
                                  images: block.images?.filter(
                                    (_, index) => index !== item,
                                  ),
                                })
                              }
                            />
                          ))}
                          {(block.type === "gallery" ||
                            !block.images?.length) &&
                            (imageAt === block.id ? (
                              <MediaPicker
                                onClose={() => setImageAt(null)}
                                onPick={(image) => {
                                  updateBlock(block.id, {
                                    images: [...(block.images ?? []), image],
                                  });
                                  setImageAt(null);
                                }}
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => setImageAt(block.id)}
                              >
                                Добавить изображение
                              </button>
                            ))}
                        </>
                      )}
                      {block.type === "video" && (
                        <VideoSettings
                          key={editorKey}
                          video={block.video}
                          onChange={(video) => updateBlock(block.id, { video })}
                        />
                      )}
                      <RichEditor
                        key={block.id + editorKey}
                        content={block.doc}
                        onChange={(doc) => updateBlock(block.id, { doc })}
                        onSlash={() => setAddAt(index + 1)}
                      />
                    </div>
                  ) : (
                    <div className="cms-block-read">
                      <RichBlocks blocks={[{ ...block, anchor: undefined }]} />
                    </div>
                  )}
                </section>
                {renderAdd(index + 1)}
              </div>
            ))}
          </>
        )}
        {panel === "preview" && (
          <article className="cms-preview">
            <div className="cms-tools">
              {dirty ? (
                <button
                  type="button"
                  disabled={pending || conflict}
                  onClick={() => void save("draft")}
                >
                  Сохранить для просмотра страницы
                </button>
              ) : (
                <a
                  href={
                    entryKey.split("~")[0] +
                    "?cms-preview=" +
                    encodeURIComponent(entryKey)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Открыть черновик на странице
                </a>
              )}
            </div>
            <h1>{body.title}</h1>
            <p>{body.description}</p>
            {!!fields.length && (
              <dl>
                {fields.map(([name, field]) => (
                  <div key={name}>
                    <dt>{field.label}</dt>
                    <dd>
                      {field.type === "image" && body.fields[name] ? (
                        <CmsFigure
                          image={{
                            url: body.fields[name],
                            alt: "",
                            caption: "",
                            source: "",
                            author: "",
                            license: "",
                            width: 50,
                            align: "left",
                            wrap: false,
                          }}
                        />
                      ) : (
                        body.fields[name]
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <RichBlocks blocks={body.blocks} />
          </article>
        )}
        {panel === "history" && (
          <div className="cms-history">
            <h3>История изменений</h3>
            {!versions.length && <p>Сохранённых версий пока нет.</p>}
            <ul>
              {versions.map((version) => (
                <li key={version.id}>
                  <button
                    type="button"
                    aria-pressed={selected?.info.id === version.id}
                    onClick={() => void showVersion(version)}
                  >
                    Версия {version.revision} ·{" "}
                    {eventName[version.event] ?? version.event} ·{" "}
                    {version.author_name} ·{" "}
                    {new Date(version.created_at).toLocaleString("ru")}
                  </button>
                </li>
              ))}
            </ul>
            {versions.length > 0 && versions.length % 30 === 0 && (
              <button
                type="button"
                onClick={() => void history(versions.at(-1)?.revision)}
              >
                Более ранние версии
              </button>
            )}
            {selected && (
              <article className="cms-preview">
                <div className="cms-tools">
                  <button
                    type="button"
                    aria-pressed={compare}
                    onClick={() => setCompare(!compare)}
                  >
                    {compare
                      ? "Открыть предпросмотр"
                      : "Сравнить с текущим текстом"}
                  </button>
                  {owner && (
                    <button
                      type="button"
                      disabled={pending || conflict}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Восстановить эту версию в новом черновике?",
                          )
                        )
                          void save("restore", selected.info.id);
                      }}
                    >
                      Восстановить в черновик
                    </button>
                  )}
                </div>
                {compare ? (
                  <VersionComparison before={selected.body} after={body} />
                ) : (
                  <>
                    <h1>{selected.body.title}</h1>
                    <p>{selected.body.description}</p>
                    <RichBlocks blocks={selected.body.blocks} />
                  </>
                )}
              </article>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
