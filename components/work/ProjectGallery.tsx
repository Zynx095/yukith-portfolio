"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProjectImage } from "@/src/data/projects";

/**
 * Screenshot gallery: crossfading slides with arrow buttons, thumbnails,
 * keyboard (← →) and swipe. Captions are the images' own descriptions.
 */
export function ProjectGallery({ images, title, accent }: { images: ProjectImage[]; title: string; accent: string }) {
  const [index, setIndex] = useState(0);
  const start = useRef<number | null>(null);
  const n = images.length;
  const go = (d: number) => setIndex((i) => (i + d + n) % n);
  const ratio = images[0].width && images[0].height ? `${images[0].width} / ${images[0].height}` : "16 / 10";

  return (
    <figure className="w-full">
      <div
        className="group relative overflow-hidden rounded-xl border border-[#51321E] bg-[#15100C] shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#B99755]"
        style={{ aspectRatio: ratio, boxShadow: `0 30px 80px -30px ${accent}55` }}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${title} screenshots — use the arrow keys to browse`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        onPointerDown={(e) => (start.current = e.clientX)}
        onPointerUp={(e) => {
          if (start.current === null) return;
          const dx = e.clientX - start.current;
          start.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        {images.map((img, k) => (
          <Image
            key={img.src}
            src={img.src}
            alt={img.alt}
            fill
            sizes="(min-width: 1024px) 56vw, 100vw"
            className="select-none object-cover transition-opacity duration-700 ease-out"
            style={{ opacity: k === index ? 1 : 0 }}
            draggable={false}
            aria-hidden={k !== index}
          />
        ))}
        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous screenshot"
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-[#F4F1EA] opacity-80 backdrop-blur transition hover:bg-black/70 hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next screenshot"
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-[#F4F1EA] opacity-80 backdrop-blur transition hover:bg-black/70 hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      <figcaption className="mt-3 flex items-baseline justify-between gap-4 font-mono text-xs text-[#D8C9A8]/75" aria-live="polite">
        <span>{images[index].alt}</span>
        <span className="shrink-0 tabular-nums text-[#B99755]">
          {index + 1} / {n}
        </span>
      </figcaption>
      {n > 1 && (
        <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {images.map((img, k) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setIndex(k)}
              aria-label={`Show screenshot ${k + 1}: ${img.alt}`}
              aria-current={k === index}
              className="relative overflow-hidden rounded-md border transition"
              style={{ aspectRatio: ratio, borderColor: k === index ? accent : "#3A2417", opacity: k === index ? 1 : 0.55 }}
            >
              <Image src={img.src} alt="" fill sizes="12vw" className="object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </figure>
  );
}
