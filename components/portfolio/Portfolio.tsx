import { profile, education } from "@/src/data/profile";
import { FEATURED, MORE_WORK, DOMAIN_LABEL } from "@/src/data/projects";
import { experience } from "@/src/data/experience";
import { achievements } from "@/src/data/achievements";
import { leadership } from "@/src/data/leadership";
import { skillGroups, certifications } from "@/src/data/skills";
import { interests, home } from "@/src/data/about";
import { socialData } from "@/src/data/social";
import { SocialLinks } from "@/components/shared/SocialLinks";
import { ArrowRight, ArrowUpRight } from "@/components/shared/Icons";
import { RecordButton } from "@/components/record/RecordPanel";
import { BackToTree } from "./BackToTree";
import { Chip, Section } from "./Section";

/**
 * The written portfolio — the conventional, fully accessible layer under the
 * World Tree journey. Everything in the 3D world is also here.
 */
export function Portfolio() {
  const email = socialData.find((s) => s.platform === "Email")!;
  const placements = achievements.filter((a) => a.tier === "placement");
  const participation = achievements.filter((a) => a.tier === "participation");

  return (
    <div id="portfolio" className="relative z-10 bg-ink">
      {/* ── Introduction ─────────────────────────────────────────── */}
      <header id="record" aria-labelledby="name" className="scroll-mt-20">
        <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-40">
          <p className="label">The record</p>
          <h1 id="name" className="mt-5 font-display text-[clamp(3rem,10vw,8.5rem)] leading-[0.92] tracking-tight">
            Yukith <span className="text-paper-dim">M</span> Joseph
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-paper-dim md:text-xl">
            {profile.role} — {education.institution}, {education.period.replace(" (expected)", "")}.
          </p>
          <p className="mt-6 max-w-2xl font-display text-2xl leading-snug md:text-3xl">{profile.intro}</p>
          <SocialLinks className="mt-10" />
          <dl className="mt-16 grid gap-8 border-t border-line pt-8 sm:grid-cols-3">
            <div>
              <dt className="label">Focus</dt>
              <dd className="mt-2">{profile.focus.join(" · ")}</dd>
            </div>
            <div>
              <dt className="label">Currently learning</dt>
              <dd className="mt-2">{profile.currentlyLearning.join(" · ")}</dd>
            </div>
            <div>
              <dt className="label">Based in</dt>
              <dd className="mt-2">{profile.location}</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* ── Projects ─────────────────────────────────────────────── */}
      <Section id="work" n="01" label="Projects" title="Things I've built — and what each one really does.">
        <ol className="divide-y divide-line border-y border-line">
          {FEATURED.map((p, i) => (
            <li key={p.id}>
              <article aria-labelledby={`p-${p.id}`} className="grid gap-4 py-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 md:py-10">
                <div>
                  <p className="label flex gap-3">
                    <span className="tabular-nums text-sap">{String(i + 1).padStart(2, "0")}</span>
                    {DOMAIN_LABEL[p.domain]} · {p.period}
                  </p>
                  <h3 id={`p-${p.id}`} className="mt-3 font-display text-3xl md:text-4xl">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-paper-dim">{p.kind}</p>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm text-paper-dim">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-signal" />
                    {p.status}
                  </p>
                </div>
                <div>
                  <p className="font-display text-xl leading-snug md:text-2xl">{p.tagline}</p>
                  <p className="mt-4 text-paper/85">{p.summary}</p>
                  <ul className="mt-5 flex flex-wrap gap-2" aria-label="Stack">
                    {p.stack.map((s) => (
                      <li key={s}>
                        <Chip>{s}</Chip>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <RecordButton id={p.id} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-paper px-5 text-sm font-medium text-ink transition-colors hover:bg-signal">
                      Read the record <ArrowRight />
                    </RecordButton>
                    {p.links.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-paper-dim underline-offset-4 hover:text-signal hover:underline">
                        {l.label}
                        <ArrowUpRight />
                        <span className="sr-only">for {p.title} (opens in a new tab)</span>
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>

        <h3 className="label mt-20">More work</h3>
        <ul className="mt-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {MORE_WORK.map((p) => (
            <li key={p.id} className="flex flex-col bg-ink p-6">
              <p className="label">
                {p.kind} · {p.period}
              </p>
              <h4 className="mt-2 font-display text-2xl">{p.title}</h4>
              <p className="mt-2 flex-1 text-paper/85">{p.tagline}</p>
              {p.context && <p className="mt-3 text-sm text-paper-dim">{p.context}</p>}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                <RecordButton id={p.id} className="inline-flex min-h-11 items-center gap-1.5 text-sm text-paper hover:text-signal">
                  Read the record <ArrowRight />
                </RecordButton>
                {p.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-paper-dim hover:text-signal">
                    {l.label}
                    <ArrowUpRight />
                    <span className="sr-only">for {p.title} (opens in a new tab)</span>
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Experience ───────────────────────────────────────────── */}
      <Section id="experience" n="02" label="Experience" title="Where I've worked.">
        <ol className="space-y-12">
          {experience.map((e) => (
            <li key={e.organisation} className="grid gap-4 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-10">
              <div>
                <p className="label">{e.period}</p>
                <h3 className="mt-2 font-display text-2xl">{e.organisation}</h3>
                <p className="text-paper-dim">{e.role}</p>
              </div>
              <div>
                <p className="font-display text-xl">{e.project}</p>
                <ul className="mt-4 space-y-3">
                  {e.points.map((pt) => (
                    <li key={pt} className="flex gap-3 text-paper/85">
                      <span aria-hidden="true" className="mt-[0.65em] h-1 w-3 shrink-0 bg-sap/70" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {e.stack.map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                  {e.link && (
                    <a href={e.link.href} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex min-h-11 items-center gap-1.5 text-sm text-paper-dim hover:text-signal">
                      {e.link.label} <ArrowUpRight />
                      <span className="sr-only">for {e.project} (opens in a new tab)</span>
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Achievements & leadership ────────────────────────────── */}
      <Section id="recognition" n="03" label="Achievements & leadership" title="Finals reached, events organised.">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <h3 className="label">Results</h3>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {placements.map((a) => (
                <li key={a.title} className="flex items-baseline justify-between gap-6 py-4">
                  <span>
                    <span className="font-display text-xl">{a.result}</span>
                    <span className="block text-paper-dim">
                      {a.title}
                      {a.organiser ? ` — ${a.organiser}` : ""}
                    </span>
                  </span>
                  <span className="label tabular-nums text-sap">{a.year}</span>
                </li>
              ))}
            </ul>
            <h3 className="label mt-10">Also took part in</h3>
            <ul className="mt-3 space-y-1.5 text-paper/85">
              {participation.map((a) => (
                <li key={a.title}>
                  {a.title} {a.year} <span className="text-paper-dim">— {a.result}</span>
                </li>
              ))}
            </ul>
            <h3 className="label mt-10">Certification</h3>
            <p className="mt-3">{certifications.join(" · ")}</p>
          </div>
          <div>
            <h3 className="label">Leadership & community</h3>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {leadership.map((r) => (
                <li key={r.role + r.organisation} className="py-4">
                  <div className="flex items-baseline justify-between gap-6">
                    <span className="font-display text-xl">{r.role}</span>
                    <span className="label shrink-0 tabular-nums">{r.period}</span>
                  </div>
                  <p className="text-paper-dim">{r.organisation}</p>
                  {r.details && <p className="mt-1 text-sm text-paper/80">{r.details.join(" · ")}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── Skills ───────────────────────────────────────────────── */}
      <Section id="skills" n="04" label="Skills" title="Tools I've actually used — and where.">
        <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-3">
          {skillGroups.map((g) => (
            <div key={g.title}>
              <h3 className="label">{g.title}</h3>
              <ul className="mt-4 space-y-3">
                {g.skills.map((s) => (
                  <li key={s.name}>
                    <span>{s.name}</span>
                    <span className="block font-mono text-xs text-paper-faint">{s.evidence === "academic" ? "coursework" : s.where?.join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* ── About ────────────────────────────────────────────────── */}
      <Section id="about" n="05" label="About" title="Off the clock.">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="space-y-5 text-lg text-paper/90">
            {profile.about.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <ul className="!mt-10 grid gap-6 sm:grid-cols-2">
              {interests.map((it) => (
                <li key={it.label}>
                  <p className="label">{it.label}</p>
                  <p className="mt-1 text-base text-paper/85">{it.note}</p>
                </li>
              ))}
              <li>
                <p className="label">Home</p>
                <p className="mt-1 text-base text-paper/85">
                  {home.city}, with {home.dog.name} the {home.dog.breed}. I speak {home.languages.slice(0, -1).join(", ")} and {home.languages.at(-1)}.
                </p>
              </li>
              <li>
                <p className="label">The lesson</p>
                <p className="mt-1 text-base text-paper/85">{profile.lesson}</p>
              </li>
            </ul>
          </div>
          <aside aria-labelledby="edu-title" className="h-fit rounded-xl border border-line p-6">
            <h3 id="edu-title" className="label">
              Education
            </h3>
            <p className="mt-3 font-display text-2xl leading-tight">{education.degree}</p>
            <p className="mt-2 text-paper-dim">{education.institution}</p>
            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="label pt-0.5">Years</dt>
              <dd>{education.period}</dd>
              <dt className="label pt-0.5">CGPA</dt>
              <dd>{education.cgpa}</dd>
            </dl>
            <p className="label mt-5">Coursework</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {education.coursework.map((c) => (
                <li key={c}>
                  <Chip>{c}</Chip>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Section>

      {/* ── Contact ──────────────────────────────────────────────── */}
      <Section id="contact" n="06" label="Contact" title="Write to me about internships, research, projects or a hackathon team.">
        <a href={email.url} className="group inline-flex items-center gap-4 font-display text-[clamp(1.75rem,5vw,3.75rem)] leading-none underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:decoration-signal">
          {email.handle}
          <ArrowRight size={32} className="transition-transform duration-300 group-hover:translate-x-1" />
        </a>
        <SocialLinks className="mt-10" only={["GitHub", "LinkedIn", "Instagram", "Resume"]} />
      </Section>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-paper-dim md:flex-row md:items-start md:justify-between md:px-8">
          <div className="space-y-1">
            <p className="text-paper">© {new Date().getFullYear()} Yukith M Joseph</p>
            <p>
              Built with Next.js, React Three Fiber and three.js.{" "}
              <a href="https://github.com/Zynx095/yukith-portfolio" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-signal">
                Source
              </a>
              .
            </p>
            <p>
              Textures and models from{" "}
              <a href="https://polyhaven.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-signal">
                Poly Haven
              </a>{" "}
              (CC0).
            </p>
          </div>
          <BackToTree />
        </div>
      </footer>
    </div>
  );
}
