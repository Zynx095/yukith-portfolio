"use client";

import { useState } from "react";
import type { ProjectImage } from "@/src/data/projects";
import { ChevronLeft, ChevronRight } from "@/components/shared/Icons";

/** Screenshot gallery: one image at a time, arrow buttons, ← → keys, captions from alt text. */
export function Gallery({ images, title }: { images: ProjectImage[]; title: string }) {
  const [i, setI] = useState(0);
  const go = (d: number) => setI((v) => (v + d + images.length) % images.length);
  const img = images[i];
  return (
    <figure
      className="overflow-hidden rounded-lg border border-line bg-ink-2"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
    >
      <div className="relative" style={{ aspectRatio: `${img.width} / ${img.height}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt={img.alt} width={img.width} height={img.height} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <figcaption className="flex items-center justify-between gap-3 border-t border-line px-3 py-2">
        <span className="text-sm text-paper-dim">
          <span className="sr-only">
            {title} screenshot {i + 1} of {images.length}:{" "}
          </span>
          {img.alt}
        </span>
        {images.length > 1 && (
          <span className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => go(-1)} aria-label="Previous screenshot" className="grid h-9 w-9 place-items-center rounded-full text-paper-dim hover:text-paper">
              <ChevronLeft />
            </button>
            <span className="label tabular-nums" aria-hidden="true">
              {i + 1}/{images.length}
            </span>
            <button type="button" onClick={() => go(1)} aria-label="Next screenshot" className="grid h-9 w-9 place-items-center rounded-full text-paper-dim hover:text-paper">
              <ChevronRight />
            </button>
          </span>
        )}
      </figcaption>
    </figure>
  );
}
