/**
 * Section shell: an editorial two-column layout — a sticky numbered label on
 * the left (wide screens), the heading and content on the right.
 */
export function Section({
  id,
  n,
  label,
  title,
  intro,
  children,
  className = "",
}: {
  id: string;
  n: string;
  label: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-20 border-t border-line py-20 md:py-28 ${className}`}>
      <div className="mx-auto grid w-full max-w-6xl gap-x-12 px-5 md:px-8 lg:grid-cols-[11rem_minmax(0,1fr)]">
        <p className="label flex h-fit items-center gap-3 lg:sticky lg:top-24 lg:flex-col lg:items-start lg:gap-2">
          <span className="tabular-nums text-sap">{n}</span>
          <span aria-hidden="true" className="h-px w-8 bg-line-strong lg:w-10" />
          <span>{label}</span>
        </p>
        <div className="mt-4 min-w-0 lg:mt-0">
          <div className="reveal">
            <h2 id={`${id}-title`} className="max-w-3xl font-display text-4xl leading-[1.05] tracking-tight md:text-[3.5rem]">
              {title}
            </h2>
            {intro && <p className="mt-5 max-w-2xl text-lg text-paper-dim">{intro}</p>}
          </div>
          <div className="mt-12 md:mt-14">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Small mono chip for stacks and tags. */
export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-full border border-line px-2.5 py-0.5 font-mono text-[0.72rem] text-paper-dim">{children}</span>;
}
