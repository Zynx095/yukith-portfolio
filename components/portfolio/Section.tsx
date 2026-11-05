/** Section shell: a numbered small-caps label, a display heading and content. */
export function Section({
  id,
  n,
  label,
  title,
  children,
  className = "",
}: {
  id: string;
  n: string;
  label: string;
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-20 border-t border-line py-20 md:py-28 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <p className="label flex items-center gap-3">
          <span className="text-sap tabular-nums">{n}</span>
          <span aria-hidden="true" className="h-px w-8 bg-line-strong" />
          {label}
        </p>
        <h2 id={`${id}-title`} className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">
          {title}
        </h2>
        <div className="mt-12 md:mt-16">{children}</div>
      </div>
    </section>
  );
}

/** Small mono chip for stacks and tags. */
export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-full border border-line px-2.5 py-0.5 font-mono text-[0.72rem] text-paper-dim">{children}</span>;
}
