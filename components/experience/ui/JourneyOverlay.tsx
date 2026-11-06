"use client";

import { useEffect, useRef, useState } from "react";
import { BEATS, RINGS } from "@/lib/world/journey";
import { CHAPTERS } from "@/lib/world/chapters";
import { frame, openRecord, useUi } from "@/lib/world/store";
import { scrollToProgress } from "@/lib/world/scroll";
import { projectById, DOMAIN_LABEL } from "@/src/data/projects";
import { ringEntries } from "@/lib/world/rings";
import { ArrowRight } from "@/components/shared/Icons";

/**
 * Everything drawn over the World Tree: one line of narration at a time, the
 * chapter rail, the label beside the relic in focus, the year cards in the
 * rings, a hint for Bella and the first "scroll" cue. Positions follow the
 * scene through refs on animation frames — React re-renders only when the
 * beat, chapter or focused relic changes.
 */

function useProgressBeat() {
  const [beat, setBeat] = useState(-1);
  const [ring, setRing] = useState(-1);
  useEffect(() => {
    let raf = 0;
    let lastB = -2;
    let lastR = -2;
    const tick = () => {
      const p = frame.progress;
      const b = BEATS.findIndex((x) => p >= x.start && p < x.end);
      if (b !== lastB) setBeat((lastB = b));
      let r = -1;
      RINGS.forEach((x, i) => {
        if (Math.abs(p - x.progress) < 0.0115) r = i;
      });
      if (r !== lastR) setRing((lastR = r));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return { beat, ring };
}

function Narration({ beat }: { beat: number }) {
  const b = beat >= 0 ? BEATS[beat] : null;
  const isTitle = beat === 0;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 px-5 md:bottom-28 md:px-12" aria-live="polite">
      <div key={beat} className={`max-w-2xl transition-all duration-700 ${b ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`} style={{ animation: b ? "beat-in 900ms var(--ease-out-soft) both" : undefined }}>
        {b && (
          <>
            <p className="label text-paper/80">{b.kicker}</p>
            {isTitle ? (
              <p className="mt-3 font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95] tracking-tight text-paper [text-shadow:0_2px_30px_rgba(0,0,0,0.45)]">{b.line}</p>
            ) : (
              <p className="mt-2 font-display text-[clamp(1.4rem,3vw,2.3rem)] leading-snug text-paper [text-shadow:0_2px_24px_rgba(0,0,0,0.55)]">{b.line}</p>
            )}
            {b.sub && <p className="mt-3 text-sm text-paper/80 md:text-base [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">{b.sub}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function ChapterRail() {
  const chapter = useUi((s) => s.chapter);
  const fill = useRef<HTMLSpanElement[]>([]);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = frame.progress;
      CHAPTERS.forEach((c, i) => {
        const end = CHAPTERS[i + 1]?.start ?? 1;
        const f = Math.min(1, Math.max(0, (p - c.start) / (end - c.start)));
        const el = fill.current[i];
        if (el) el.style.transform = `scaleX(${f})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <nav aria-label="Journey chapters" className="pointer-events-auto absolute inset-x-0 bottom-6 px-5 md:bottom-8 md:px-12">
      <p className="label mb-2 text-paper/80">
        <span className="tabular-nums text-sap">{String(chapter + 1).padStart(2, "0")}</span> · {CHAPTERS[chapter]?.title}
      </p>
      <ol className="flex max-w-xl gap-1.5">
        {CHAPTERS.map((c, i) => (
          <li key={c.id} className="flex-1">
            <button
              type="button"
              onClick={() => scrollToProgress(c.start + (i === 0 ? 0 : 0.012))}
              aria-label={`Go to chapter ${i + 1}: ${c.title}`}
              aria-current={i === chapter ? "step" : undefined}
              className="group block w-full py-2"
            >
              <span className="relative block h-[2px] overflow-hidden rounded-full bg-paper/20 group-hover:bg-paper/40">
                <span ref={(el) => void (el && (fill.current[i] = el))} className="absolute inset-0 origin-left bg-paper" style={{ transform: "scaleX(0)" }} />
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function RelicLabel() {
  const focusId = useUi((s) => s.focusId);
  const hoverId = useUi((s) => s.hoverId);
  const box = useRef<HTMLDivElement>(null);
  const id = focusId;
  const project = id ? projectById(id) : undefined;

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = box.current;
      if (el) {
        const narrow = window.innerWidth < 768;
        const visible = frame.focusVisible && frame.focusNear > 0.25;
        el.style.opacity = visible ? String(Math.min(1, (frame.focusNear - 0.25) * 2.5)) : "0";
        el.style.pointerEvents = visible ? "auto" : "none";
        if (narrow) {
          el.style.transform = "translate3d(0,0,0)";
        } else {
          const x = Math.min(window.innerWidth - 420, frame.focusX + frame.focusR + 28);
          const y = Math.max(90, Math.min(window.innerHeight - 330, frame.focusY - 110));
          el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={box}
      className="absolute bottom-28 left-4 right-4 top-auto max-w-sm transition-opacity duration-300 md:bottom-auto md:left-0 md:right-auto md:top-0 md:w-[380px]"
      style={{ opacity: 0 }}
    >
      {project && (
        <div className="rounded-xl border border-line bg-ink/80 p-5 backdrop-blur-sm">
          <p className="label">
            {DOMAIN_LABEL[project.domain]} · {project.period}
          </p>
          <p className="mt-2 font-display text-3xl leading-tight">{project.title}</p>
          <p className="text-sm text-paper-dim">{project.kind}</p>
          <p className="mt-3 text-[0.95rem] leading-snug text-paper/90">{project.tagline}</p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-paper-dim">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-signal" />
            {project.status}
          </p>
          <div>
            <button
              type="button"
              onClick={() => openRecord(project.id)}
              aria-haspopup="dialog"
              className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors ${hoverId === project.id ? "bg-signal text-ink" : "bg-paper text-ink hover:bg-signal"}`}
            >
              Open the record <ArrowRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RingCard({ ring }: { ring: number }) {
  const r = ring >= 0 ? RINGS[ring] : null;
  const entries = r ? ringEntries(r.year) : [];
  return (
    <div className={`pointer-events-none absolute right-4 top-24 w-[min(380px,calc(100vw-2rem))] transition-all duration-500 md:right-12 md:top-28 ${r ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`} aria-live="polite">
      {r && (
        <div className="rounded-xl border border-line bg-ink/80 p-5 backdrop-blur-sm">
          <p className="label">Ring</p>
          <p className="font-display text-5xl text-sap">{r.year}</p>
          <ul className="mt-4 space-y-3">
            {entries.map((e) => (
              <li key={e.title + e.detail}>
                <p className="label text-[0.6rem]">{e.kind}</p>
                <p className="leading-tight">{e.title}</p>
                <p className="text-sm text-paper-dim">{e.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PetHint() {
  const el = useRef<HTMLDivElement>(null);
  const [used, setUsed] = useState(false);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const d = el.current;
      if (d) {
        d.style.opacity = frame.petVisible && !used ? "1" : "0";
        d.style.transform = `translate3d(${frame.petX - 60}px, ${frame.petY - 52}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onClick = () => frame.petVisible && setUsed(true);
    window.addEventListener("pointerdown", onClick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", onClick);
    };
  }, [used]);
  return (
    <div ref={el} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 w-[120px] text-center text-xs text-paper transition-opacity duration-500" style={{ opacity: 0 }}>
      <span className="rounded-full bg-ink/70 px-2.5 py-1 backdrop-blur-sm">Bella · click her</span>
    </div>
  );
}

function ScrollCue() {
  const el = useRef<HTMLDivElement>(null);
  const ready = useUi((s) => s.ready);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (el.current) el.current.style.opacity = ready && frame.progress < 0.012 ? "1" : "0";
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);
  return (
    <div ref={el} aria-hidden="true" className="pointer-events-none absolute bottom-24 right-6 flex flex-col items-center gap-3 transition-opacity duration-700 md:right-12" style={{ opacity: 0 }}>
      <span className="label [writing-mode:vertical-rl]">Scroll</span>
      <span className="relative h-14 w-px overflow-hidden bg-paper/25">
        <span className="absolute inset-x-0 top-0 h-5 animate-[cue_1.8s_ease-in-out_infinite] bg-paper" />
      </span>
    </div>
  );
}

/** The world fades to ink as the journey ends, so the portfolio continues seamlessly. */
function Outro() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (el.current) el.current.style.opacity = String(Math.min(1, Math.max(0, (frame.progress - 0.975) / 0.025)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div ref={el} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-ink" style={{ opacity: 0 }} />;
}

export function JourneyOverlay() {
  const inWorld = useUi((s) => s.inWorld);
  const ready = useUi((s) => s.ready);
  const { beat, ring } = useProgressBeat();
  return (
    <div className={`pointer-events-none fixed inset-0 z-20 transition-opacity duration-700 ${inWorld && ready ? "opacity-100" : "opacity-0"}`} style={{ visibility: inWorld ? "visible" : "hidden" }}>
      {/* A gentle gradient keeps the lower-third text readable over any frame. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/45 to-transparent" />
      <Outro />
      <Narration beat={beat} />
      <RingCard ring={ring} />
      <RelicLabel />
      <PetHint />
      <ScrollCue />
      <ChapterRail />
    </div>
  );
}
