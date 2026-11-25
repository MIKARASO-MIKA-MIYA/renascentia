"use client";

import { ArrowLeft, ArrowRight, Maximize, X } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState, type KeyboardEvent } from "react";

type Slide = { src: string; title: string };

export function PresentationViewer({
  title,
  slides,
}: {
  title: string;
  slides: readonly Slide[];
}) {
  const [position, setPosition] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogTitle = useId();
  const slide = slides[position];
  if (!slide) return null;

  function step(offset: number) {
    setPosition((current) =>
      Math.min(slides.length - 1, Math.max(0, current + offset)),
    );
  }

  function onArrowKey(event: KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    step(event.key === "ArrowLeft" ? -1 : 1);
  }

  const controls = (
    <div
      className="flex items-center justify-center gap-4"
      aria-label="Навигация по слайдам"
      role="group"
    >
      <button
        type="button"
        className="hero-control disabled:cursor-default disabled:opacity-40"
        disabled={position === 0}
        onClick={() => step(-1)}
        aria-label="Предыдущий слайд"
      >
        <ArrowLeft size={19} aria-hidden="true" />
      </button>
      <output className="text-center text-sm font-semibold tabular-nums">
        Слайд {position + 1} из {slides.length}
      </output>
      <button
        type="button"
        className="hero-control disabled:cursor-default disabled:opacity-40"
        disabled={position === slides.length - 1}
        onClick={() => step(1)}
        aria-label="Следующий слайд"
      >
        <ArrowRight size={19} aria-hidden="true" />
      </button>
    </div>
  );

  const image = (
    <Image
      src={slide.src}
      alt={slide.title}
      fill
      unoptimized
      className="object-contain"
    />
  );

  return (
    <div className="min-w-0">
      <div
        className="overflow-hidden rounded-xs bg-black text-white [--focus-color:var(--color-masthead-focus)]"
        onKeyDown={onArrowKey}
      >
        <div className="relative aspect-video">{image}</div>
        <div className="p-3">{controls}</div>
      </div>
      <button
        type="button"
        aria-haspopup="dialog"
        className="cta mt-4 cursor-pointer"
        onClick={() => {
          dialog.current?.showModal();
          setExpanded(true);
        }}
      >
        <Maximize size={18} aria-hidden="true" />
        Открыть презентацию
      </button>

      <dialog
        ref={dialog}
        className="viewer-dialog"
        aria-labelledby={dialogTitle}
        onClose={() => setExpanded(false)}
        onKeyDown={onArrowKey}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 id={dialogTitle} className="text-lg font-extrabold" lang="kk">
              {title}
            </h2>
            <button
              type="button"
              className="hero-control"
              aria-label="Закрыть презентацию"
              onClick={() => dialog.current?.close()}
              autoFocus
            >
              <X size={19} aria-hidden="true" />
            </button>
          </div>
          {expanded && (
            <>
              <div className="relative aspect-video max-h-[68dvh] bg-black">
                {image}
              </div>
              <div className="mt-3">{controls}</div>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
