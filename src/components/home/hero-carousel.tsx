"use client";

import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { ImageAsset } from "@/content/images";

const motionPreference = "(prefers-reduced-motion: reduce)";

function watchMotionPreference(callback: () => void) {
  const media = window.matchMedia(motionPreference);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function readMotionPreference() {
  return window.matchMedia(motionPreference).matches;
}

type Slide = {
  title: string;
  description: string;
  action: string;
  href: string;
  image: ImageAsset;
};

export function HeroCarousel({
  slides,
}: {
  slides: readonly [Slide, ...Slide[]];
}) {
  const [index, setIndex] = useState(0);
  const [playback, setPlayback] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);
  const reducedMotion = useSyncExternalStore(
    watchMotionPreference,
    readMotionPreference,
    () => true,
  );
  const playing = playback ?? !reducedMotion;
  const rotating = playing && !hovered && slides.length > 1;
  const slide = slides[index % slides.length];

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => {
      if (!document.hidden)
        setIndex((current) => (current + 1) % slides.length);
    }, 8500);
    return () => window.clearInterval(timer);
  }, [rotating, slides.length]);

  function selectSlide(next: number) {
    setIndex((next + slides.length) % slides.length);
    setPlayback(false);
  }

  return (
    <section
      className="hero"
      aria-label="Обзор исследовательского портала"
      aria-roledescription="карусель"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (
          event.target.matches(":focus-visible") &&
          !event.target.closest("[data-rotation-control]")
        )
          setPlayback(false);
      }}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={index + ":" + slide.href}
          className="hero-image"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.24 }}
        >
          <Image
            src={slide.image.src}
            unoptimized={!slide.image.src.startsWith("/images/")}
            fill
            alt=""
            sizes="100vw"
            preload={index === 0}
            className="object-cover"
            style={{ objectPosition: slide.image.position }}
          />
        </motion.div>
      </AnimatePresence>
      <div className="page-container hero-content">
        <div
          className="hero-copy"
          aria-live={rotating ? "off" : "polite"}
          aria-atomic="true"
        >
          <h1 className="hero-title wrap-break-word">{slide.title}</h1>
          <p className="mt-5 max-w-[50ch] text-base leading-relaxed text-white/95 md:text-lg">
            {slide.description}
          </p>
          <Link href={slide.href} className="cta mt-6">
            {slide.action} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div
          className="flex w-fit items-center gap-0.5 justify-self-end sm:gap-1"
          aria-label="Управление слайдами"
          role="group"
        >
          <button
            type="button"
            className="hero-control"
            onClick={() => selectSlide(index - 1)}
            aria-label="Предыдущий слайд"
          >
            <ArrowLeft size={17} aria-hidden="true" />
          </button>
          {slides.map((item, slideIndex) => (
            <button
              key={slideIndex + ":" + item.href}
              type="button"
              className="hero-dot"
              aria-label={`Слайд ${slideIndex + 1}. ${item.title}`}
              aria-current={index === slideIndex ? "true" : undefined}
              onClick={() => selectSlide(slideIndex)}
            />
          ))}
          <button
            type="button"
            className="hero-control"
            onClick={() => selectSlide(index + 1)}
            aria-label="Следующий слайд"
          >
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            data-rotation-control
            className="hero-control ml-1"
            onClick={() => setPlayback(!playing)}
            aria-label={
              playing
                ? "Остановить автоматическое переключение"
                : "Включить автоматическое переключение"
            }
          >
            {playing ? (
              <Pause size={17} aria-hidden="true" />
            ) : (
              <Play size={17} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
