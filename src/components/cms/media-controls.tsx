"use client";

import { useEffect, useState, type PointerEvent } from "react";
import {
  listMedia,
  uploadImage,
  type MediaItem,
} from "@/app/admin/media-actions";
import { images } from "@/content/images";
import {
  imageTypes,
  isImageUrl,
  videoSource,
  type CmsImage,
  type CmsVideo,
} from "@/lib/cms/schema";
import { CmsFigure, CmsMovie } from "./rich-blocks";

export function mediaUrl(id: string) {
  return "/cms/media/" + id;
}

export function imageFromItem(item: MediaItem): CmsImage {
  return {
    url: mediaUrl(item.id),
    alt: item.alt,
    caption: "",
    author: item.author,
    license: item.license,
    source: item.source,
    width: 100,
    align: "center",
    wrap: false,
  };
}

export async function uploadFile(file: File) {
  const form = new FormData();
  form.set("file", file);
  return uploadImage(form);
}

export function MediaPicker({
  onPick,
  onClose,
}: {
  onPick: (image: CmsImage) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [libraryError, setLibraryError] = useState("");
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void listMedia(query, page)
        .then((result) => {
          if (!active) return;
          if (result.ok) {
            setItems(result.data);
            setLibraryError("");
          } else setLibraryError(result.message);
        })
        .catch(() => {
          if (active) setLibraryError("Не удалось открыть медиатеку.");
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, page]);

  return (
    <div className="cms-media-picker" aria-label="Выбор изображения">
      <div className="cms-tools">
        <label className="cms-file-upload">
          Загрузить изображение
          <input
            type="file"
            accept={imageTypes.join(",")}
            disabled={uploading}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setUploading(true);
              setError("");
              try {
                const result = await uploadFile(file);
                if (result.ok) onPick(imageFromItem(result.data));
                else setError(result.message);
              } catch {
                setError("Не удалось загрузить изображение.");
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
        <button type="button" onClick={onClose}>
          Закрыть выбор
        </button>
      </div>
      {uploading && <p role="status">Загрузка…</p>}
      <div className="cms-tools">
        <input
          aria-label="Адрес изображения"
          type="url"
          placeholder="https://…"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        <button
          type="button"
          onClick={() => {
            const value = url.trim();
            if (!isImageUrl(value))
              return setError("Введите корректный HTTPS-адрес изображения.");
            const asset = Object.values(images).find(
              ({ src }) => src === value,
            );
            onPick({
              url: value,
              alt: asset?.alt ?? "",
              caption: "",
              author: asset?.creator ?? "",
              source: asset?.sourceUrl ?? "",
              license: asset?.license ?? "",
              width: 100,
              align: "center",
              wrap: false,
            });
          }}
        >
          Добавить по ссылке
        </button>
      </div>
      <label>
        Изображения портала
        <select
          defaultValue=""
          onChange={(event) => {
            const asset = Object.values(images).find(
              ({ src }) => src === event.target.value,
            );
            if (asset)
              onPick({
                url: asset.src,
                alt: asset.alt,
                caption: "",
                author: asset.creator,
                source: asset.sourceUrl,
                license: asset.license,
                width: 100,
                wrap: false,
                align: "center",
              });
          }}
        >
          <option value="">Выберите изображение</option>
          {Object.values(images).map((asset) => (
            <option key={asset.src} value={asset.src}>
              {asset.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Поиск по медиатеке
        <input
          value={query}
          maxLength={100}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
        />
      </label>
      {(error || libraryError) && <p role="alert">{error || libraryError}</p>}
      <ul className="cms-library-grid">
        {items.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onPick(imageFromItem(item))}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(item.id)} alt="" loading="lazy" />
              <span>{item.title}</span>
            </button>
          </li>
        ))}
      </ul>
      {(page > 0 || items.length === 24) && (
        <div className="cms-tools">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Назад
          </button>
          <button
            type="button"
            disabled={items.length < 24}
            onClick={() => setPage(page + 1)}
          >
            Далее
          </button>
        </div>
      )}
    </div>
  );
}

function bound(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ImageSettings({
  image,
  onChange,
  onRemove,
}: {
  image: CmsImage;
  onChange: (image: CmsImage) => void;
  onRemove: () => void;
}) {
  const [replace, setReplace] = useState(false);
  function startResize(
    event: PointerEvent<HTMLButtonElement>,
    direction: number,
  ) {
    if (event.button !== 0) return;
    const button = event.currentTarget;
    const frame = button.parentElement?.parentElement;
    const containerWidth = frame?.getBoundingClientRect().width;
    if (!containerWidth) return;
    const start = event.clientX;
    const width = image.width;
    button.setPointerCapture(event.pointerId);
    button.onpointermove = (move) => {
      button.style.setProperty(
        "--cms-resize",
        Math.round(
          bound(
            width +
              ((direction * (move.clientX - start)) / containerWidth) * 100,
            10,
            100,
          ),
        ) + "%",
      );
      button.parentElement?.style.setProperty(
        "width",
        button.style.getPropertyValue("--cms-resize"),
      );
    };
    button.onlostpointercapture = () => {
      const size = Number.parseInt(
        button.style.getPropertyValue("--cms-resize"),
        10,
      );
      button.onpointermove = null;
      button.onlostpointercapture = null;
      button.parentElement?.style.setProperty("width", width + "%");
      button.style.removeProperty("--cms-resize");
      if (Number.isFinite(size)) onChange({ ...image, width: size });
    };
  }
  return (
    <fieldset className="cms-image-settings">
      <legend>Параметры изображения</legend>
      <div className="cms-resize-frame">
        <div
          className="cms-resize-image"
          style={{
            width: image.width + "%",
            maxWidth: image.maxWidth ?? undefined,
          }}
        >
          <CmsFigure image={{ ...image, width: 100, wrap: false }} />
          {["tl", "tr", "bl", "br"].map((corner) => (
            <button
              type="button"
              key={corner}
              className="cms-resize-handle"
              data-corner={corner}
              aria-label="Масштабировать изображение"
              onPointerDown={(event) =>
                startResize(event, corner.endsWith("l") ? -1 : 1)
              }
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                  return;
                event.preventDefault();
                onChange({
                  ...image,
                  width: bound(
                    image.width + (event.key === "ArrowLeft" ? -5 : 5),
                    10,
                    100,
                  ),
                });
              }}
            />
          ))}
        </div>
      </div>
      <div className="cms-tools">
        {[25, 50, 75, 100].map((width) => (
          <button
            type="button"
            key={width}
            aria-pressed={image.width === width}
            onClick={() => onChange({ ...image, width })}
          >
            {width}%
          </button>
        ))}
        <button type="button" onClick={() => setReplace(!replace)}>
          Заменить
        </button>
        <button type="button" onClick={onRemove}>
          Убрать из материала
        </button>
      </div>
      {replace && (
        <MediaPicker
          onClose={() => setReplace(false)}
          onPick={(replacement) => {
            onChange({
              ...image,
              url: replacement.url,
              alt: replacement.alt,
              author: replacement.author,
              source: replacement.source,
              license: replacement.license,
            });
            setReplace(false);
          }}
        />
      )}
      <div className="cms-form-grid">
        {(
          [
            ["alt", "Альтернативный текст", 420],
            ["caption", "Подпись", 600],
            ["author", "Автор", 220],
            ["source", "Источник", 2048],
            ["license", "Лицензия", 220],
          ] as const
        ).map(([key, label, max]) => (
          <label key={key}>
            {label}
            <input
              value={image[key]}
              maxLength={max}
              onChange={(event) =>
                onChange({ ...image, [key]: event.target.value })
              }
            />
          </label>
        ))}
        <label>
          Ширина, %
          <input
            type="number"
            min="10"
            max="100"
            value={image.width}
            onChange={(event) =>
              onChange({ ...image, width: event.target.valueAsNumber || 10 })
            }
          />
        </label>
        <label>
          Максимальная ширина, px
          <input
            type="number"
            min="100"
            max="2400"
            value={image.maxWidth ?? ""}
            onChange={(event) =>
              onChange({
                ...image,
                maxWidth: event.target.valueAsNumber || null,
              })
            }
          />
        </label>
        <label>
          Максимальная высота, px
          <input
            type="number"
            min="50"
            max="1800"
            value={image.height ?? ""}
            onChange={(event) =>
              onChange({ ...image, height: event.target.valueAsNumber || null })
            }
          />
        </label>
        <label>
          Выравнивание
          <select
            value={image.align}
            onChange={(event) =>
              onChange({
                ...image,
                align: event.target.value as CmsImage["align"],
              })
            }
          >
            <option value="left">Слева</option>
            <option value="center">По центру</option>
            <option value="right">Справа</option>
          </select>
        </label>
        <label className="cms-check">
          <input
            type="checkbox"
            checked={image.wrap}
            onChange={(event) =>
              onChange({ ...image, wrap: event.target.checked })
            }
          />{" "}
          Обтекание текстом
        </label>
      </div>
    </fieldset>
  );
}

const emptyVideo: CmsVideo = {
  url: "",
  caption: "",
  width: 100,
  align: "center",
};

export function VideoSettings({
  video,
  onChange,
}: {
  video?: CmsVideo;
  onChange: (video?: CmsVideo) => void;
}) {
  const value = video ?? emptyVideo;
  const [url, setUrl] = useState(value.url);
  const [error, setError] = useState("");
  return (
    <fieldset>
      <legend>Видео</legend>
      <div className="cms-tools">
        <input
          aria-label="Ссылка на видео"
          type="url"
          value={url}
          placeholder="YouTube, Shorts, MP4, WebM или OGV"
          onChange={(event) => setUrl(event.target.value)}
        />
        <button
          type="button"
          onClick={() => {
            if (!videoSource(url.trim()))
              return setError("Укажите допустимую HTTPS-ссылку на видео.");
            onChange({ ...value, url: url.trim() });
            setError("");
          }}
        >
          {video ? "Заменить видео" : "Добавить видео"}
        </button>
        {video && (
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              setUrl("");
            }}
          >
            Убрать видео
          </button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {video && (
        <>
          <CmsMovie video={video} />
          <div className="cms-form-grid">
            <label>
              Подпись
              <input
                value={video.caption}
                maxLength={600}
                onChange={(event) =>
                  onChange({ ...video, caption: event.target.value })
                }
              />
            </label>
            <label>
              Ширина, %
              <input
                type="number"
                min="20"
                max="100"
                value={video.width}
                onChange={(event) =>
                  onChange({
                    ...video,
                    width: event.target.valueAsNumber || 20,
                  })
                }
              />
            </label>
            <label>
              Выравнивание
              <select
                value={video.align}
                onChange={(event) =>
                  onChange({
                    ...video,
                    align: event.target.value as CmsVideo["align"],
                  })
                }
              >
                <option value="left">Слева</option>
                <option value="center">По центру</option>
                <option value="right">Справа</option>
              </select>
            </label>
          </div>
        </>
      )}
    </fieldset>
  );
}
