import { profile, education } from "@/src/data/profile";
import { COLLABORATIONS, FEATURED, MORE_WORK, DOMAIN_LABEL, PROJECTS, type Project } from "@/src/data/projects";
import { experience } from "@/src/data/experience";
import { achievements } from "@/src/data/achievements";
import { leadership } from "@/src/data/leadership";
import { skillGroups, certifications } from "@/src/data/skills";
import { interests, home } from "@/src/data/about";
import { socialData } from "@/src/data/social";
import { SocialLinks } from "@/components/shared/SocialLinks";
import { ArrowRight, ArrowUpRight, FileIcon, MailIcon } from "@/components/shared/Icons";
import { BackToTree } from "./BackToTree";
import { ProjectDetails } from "./ProjectDetails";
import { Chip, Section } from "./Section";

/**
 * The written portfolio. It is the Classic presentation on its own (light,
 * editorial theme) and the record that follows the World Tree journey in the
 * Immersive presentation (dark theme) — the same markup, server-rendered, so
 * it is complete without JavaScript or WebGL. Every fact comes from src/data.
 */

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

function ProjectLinks({ project }: { project: Project }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
      {project.links.map((l) => (
        <a key={l.href} href={l.href} {...external} className="inline-flex min-h-11 items-center gap-1.5 text-sm text-paper underline decoration-line-strong underline-offset-4 hover:text-signal hover:decoration-signal">
          {l.label}
          <ArrowUpRight />
          <span className="sr-only">for {project.title} (opens in a new tab)</span>
        </a>
      ))}
    </div>
  );
}

function Stack({ items, label = "Stack" }: { items: readonly string[]; label?: string }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label={label}>
      {items.map((s) => (
        <li key={s}>
          <Chip>{s}</Chip>
        </li>
      ))}
    </ul>
  );
}

export function Portfolio() {
  const email = socialData.find((s) => s.platform === "Email")!;
  const placements = achievements.filter((a) => a.tier === "placement");
  const participation = achievements.filter((a) => a.tier === "participation");
  const ownProjects = PROJECTS.filter((p) => !p.collaboration);
  const stats = [
    { value: ownProjects.length, label: "projects, each linked to its source" },
    { value: experience.length, label: "industry engagements — internship and capstone" },
    { value: placements.length, label: "competition finals and placings" },
    { value: leadership.length, label: "leadership and organising roles" },
  ];

  return (
    <div id="portfolio" className="relative z-10 bg-ink">
      <main id="main">
      {/* ── Introduction ─────────────────────────────────────────── */}
      <header id="record" aria-labelledby="name" className="scroll-mt-20">
        <div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-40">
          <div className="label flex flex-wrap items-center justify-between gap-3">
            <span>Portfolio</span>
            <span>{profile.location}</span>
          </div>
          <h1 id="name" className="mt-6 font-display text-[clamp(3.25rem,11.5vw,9.25rem)] leading-[0.9] tracking-[-0.025em]">
            Yukith <span className="text-paper-dim">M</span> Joseph
          </h1>

          <div className="mt-10 grid gap-12 md:mt-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16">
            <div>
              <p className="max-w-2xl font-display text-[1.65rem] leading-snug md:text-[2.1rem]">{profile.intro}</p>
              <p className="mt-5 max-w-2xl text-paper-dim">
                {profile.role} — {education.institution}, {education.period.replace(" (expected)", "")}.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#work" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-paper px-6 text-sm font-medium text-ink transition-colors hover:bg-signal">
                  See the work <ArrowRight />
                </a>
                <a href="/resume.pdf" target="_blank" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-line-strong px-5 text-sm hover:border-signal hover:text-signal">
                  <FileIcon size={16} /> Résumé (PDF)
                </a>
                <a href={email.url} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-line-strong px-5 text-sm hover:border-signal hover:text-signal">
                  <MailIcon size={16} /> {email.handle}
                </a>
              </div>
            </div>
            <dl className="grid gap-x-8 gap-y-6 border-t border-line pt-8 sm:grid-cols-2 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <div>
                <dt className="label">Focus</dt>
                <dd className="mt-2">{profile.focus.join(" · ")}</dd>
              </div>
              <div>
                <dt className="label">Currently learning</dt>
                <dd className="mt-2">{profile.currentlyLearning.join(" · ")}</dd>
              </div>
              <div>
                <dt className="label">Studying</dt>
                <dd className="mt-2">{education.degree}</dd>
              </div>
              <div>
                <dt className="label">Elsewhere</dt>
                <dd className="mt-1">
                  <SocialLinks variant="icons" only={["GitHub", "LinkedIn", "Instagram"]} />
                </dd>
              </div>
            </dl>
          </div>

          <ul className="mt-16 grid grid-cols-2 border-y border-line md:mt-20 md:grid-cols-4">
            {stats.map((s, i) => (
              <li key={s.label} className={`px-1 py-6 md:px-6 ${i % 2 === 1 ? "border-l border-line pl-5" : ""} ${i >= 2 ? "border-t border-line md:border-t-0" : ""} ${i === 2 ? "md:border-l md:pl-6" : ""} ${i === 0 ? "md:pl-0" : ""}`}>
                <span className="block font-display text-4xl tabular-nums md:text-5xl">{s.value}</span>
                <span className="mt-2 block text-sm text-paper-dim">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* ── About ────────────────────────────────────────────────── */}
      <Section id="about" n="01" label="About" title="An engineering student who ships working systems.">
        <div className="grid gap-14 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="space-y-5 text-lg leading-relaxed text-paper/90">
            {profile.about.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <ul className="grid h-fit gap-6 sm:grid-cols-2 xl:grid-cols-1">
            {interests.map((it) => (
              <li key={it.label}>
                <p className="label">{it.label}</p>
                <p className="mt-1 text-paper/85">{it.note}</p>
              </li>
            ))}
            <li>
              <p className="label">Home</p>
              <p className="mt-1 text-paper/85">
                {home.city}, with family and {home.dog.name} the {home.dog.breed}. I speak {home.languages.slice(0, -1).join(", ")} and {home.languages.at(-1)}.
              </p>
            </li>
            <li>
              <p className="label">The lesson</p>
              <p className="mt-1 font-display text-xl text-paper">{profile.lesson}</p>
            </li>
          </ul>
        </div>
      </Section>

      {/* ── Projects ─────────────────────────────────────────────── */}
      <Section
        id="work"
        n="02"
        label="Projects"
        title="Selected work — and what each one really does."
        intro={`${FEATURED.length} featured builds across security, applied AI, distributed systems and hardware, then ${MORE_WORK.length} more. Open any project for its implementation details and honest limits.`}
      >
        <ol className="divide-y divide-line border-y border-line">
          {FEATURED.map((p, i) => (
            <li key={p.id}>
              <article id={`project-${p.id}`} aria-labelledby={`p-${p.id}`} className="reveal grid scroll-mt-24 gap-5 py-10 md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] md:gap-10 md:py-12">
                <div>
                  <p className="label flex flex-wrap gap-x-3">
                    <span className="tabular-nums text-sap">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      {DOMAIN_LABEL[p.domain]} · {p.period}
                    </span>
                  </p>
                  <h3 id={`p-${p.id}`} className="mt-3 font-display text-[2.1rem] leading-tight md:text-[2.6rem]">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-paper-dim">{p.kind}</p>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm text-paper-dim">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-signal" />
                    {p.status}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="font-display text-xl leading-snug md:text-[1.6rem]">{p.tagline}</p>
                  <p className="mt-4 text-paper/85">{p.summary}</p>
                  <div className="mt-5">
                    <Stack items={p.stack} />
                  </div>
                  <div className="mt-3">
                    <ProjectLinks project={p} />
                  </div>
                  <ProjectDetails project={p} className="mt-4" />
                </div>
              </article>
            </li>
          ))}
        </ol>

        <h3 className="label mt-20">More work</h3>
        <ul className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
          {MORE_WORK.map((p) => (
            <li key={p.id} id={`project-${p.id}`} className="flex scroll-mt-24 flex-col bg-ink p-6 md:p-7 md:last:odd:col-span-2">
              <p className="label">
                {DOMAIN_LABEL[p.domain]} · {p.period}
              </p>
              <h4 className="mt-2 font-display text-[1.75rem] leading-tight">{p.title}</h4>
              <p className="text-sm text-paper-dim">{p.kind}</p>
              <p className="mt-3 flex-1 text-paper/85">{p.tagline}</p>
              {p.context && <p className="mt-3 text-sm text-paper-dim">{p.context}</p>}
              <div className="mt-5">
                <Stack items={p.stack} />
              </div>
              <div className="mt-2">
                <ProjectLinks project={p} />
              </div>
              <ProjectDetails project={p} className="mt-3" />
            </li>
          ))}
        </ul>

        <h3 className="label mt-20">Collaborations</h3>
        <ul className="mt-6 grid gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          {COLLABORATIONS.map((p) => (
            <li key={p.id} id={`project-${p.id}`} className="scroll-mt-24 rounded-2xl border border-line p-6 md:p-7">
              <p className="label">
                {DOMAIN_LABEL[p.domain]} · {p.period} · Collaborative work
              </p>
              <h4 className="mt-2 font-display text-[1.75rem] leading-tight">{p.title}</h4>
              <p className="text-sm text-paper-dim">{p.kind}</p>
              <p className="mt-3 text-paper/85">{p.summary}</p>
              <p className="mt-3 text-sm text-paper-dim">{p.contribution}</p>
              <div className="mt-5">
                <Stack items={p.stack} />
              </div>
              <div className="mt-2">
                <ProjectLinks project={p} />
              </div>
            </li>
          ))}
          <li className="h-fit rounded-2xl border border-dashed border-line-strong p-6 text-paper-dim md:p-7">
            <p className="label">Also built in a team</p>
            <p className="mt-3">
              <a href="#project-aura" className="text-paper underline decoration-line-strong underline-offset-4 hover:text-signal">
                AURA
              </a>{" "}
              and{" "}
              <a href="#project-dayflow" className="text-paper underline decoration-line-strong underline-offset-4 hover:text-signal">
                Dayflow
              </a>{" "}
              — with Pranathi Nagabhushana on the frontend. Each record states who built what.
            </p>
          </li>
        </ul>
      </Section>

      {/* ── Experience ───────────────────────────────────────────── */}
      <Section id="experience" n="03" label="Experience" title="Industry work.">
        <ol className="space-y-14">
          {experience.map((e) => (
            <li key={e.organisation} className="grid gap-4 md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] md:gap-10">
              <div>
                <p className="label">{e.period}</p>
                <h3 className="mt-2 font-display text-[1.75rem] leading-tight">{e.organisation}</h3>
                <p className="text-paper-dim">{e.role}</p>
              </div>
              <div>
                <p className="font-display text-xl">{e.project}</p>
                <ul className="mt-4 space-y-3">
                  {e.points.map((pt) => (
                    <li key={pt} className="flex gap-3 text-paper/85">
                      <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-sap" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Stack items={e.stack} />
                  {e.link && (
                    <a href={e.link.href} {...external} className="inline-flex min-h-11 items-center gap-1.5 text-sm text-paper underline decoration-line-strong underline-offset-4 hover:text-signal">
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

      {/* ── Leadership ───────────────────────────────────────────── */}
      <Section id="leadership" n="04" label="Leadership" title="Events organised, communities run.">
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
          {leadership.map((r) => (
            <li key={r.role + r.organisation} className="bg-ink p-6">
              <div className="flex items-baseline justify-between gap-6">
                <h3 className="font-display text-xl leading-snug">{r.role}</h3>
                {r.period && <span className="label shrink-0 tabular-nums">{r.period}</span>}
              </div>
              <p className="text-paper-dim">{r.organisation}</p>
              {r.details && (
                <ul className="mt-3 space-y-1 text-sm text-paper/85">
                  {r.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Achievements ─────────────────────────────────────────── */}
      <Section id="achievements" n="05" label="Achievements" title="Finals reached, and where I placed.">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div>
            <h3 className="label">Results</h3>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {placements.map((a) => (
                <li key={a.title} className="grid grid-cols-[1fr_auto] items-baseline gap-6 py-5">
                  <span>
                    <span className="block font-display text-[1.4rem] leading-snug">{a.result}</span>
                    <span className="block text-paper-dim">
                      {a.title}
                      {a.organiser ? ` — ${a.organiser}` : ""}
                    </span>
                  </span>
                  <span className="label tabular-nums text-sap">{a.year}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="label">Competitions entered</h3>
            <ul className="mt-4 space-y-3">
              {participation.map((a) => (
                <li key={a.title} className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                  <span>
                    {a.title}
                    <span className="block text-sm text-paper-dim">
                      {a.result}
                      {a.organiser ? ` · ${a.organiser}` : ""}
                    </span>
                  </span>
                  <span className="label tabular-nums">{a.year}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── Skills ───────────────────────────────────────────────── */}
      <Section id="skills" n="06" label="Skills" title="Tools I've used — and where." intro="Each skill names the project it was used in, or the coursework it comes from.">
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          {skillGroups.map((g) => (
            <div key={g.title}>
              <h3 className="label border-b border-line pb-3">{g.title}</h3>
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

      {/* ── Education & certification ────────────────────────────── */}
      <Section id="education" n="07" label="Education" title="Education and certification.">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <article className="rounded-2xl border border-line p-6 md:p-8">
            <p className="label">{education.period}</p>
            <h3 className="mt-3 font-display text-[1.9rem] leading-tight">{education.degree}</h3>
            <p className="mt-1 text-paper-dim">{education.institution}</p>
            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="label pt-0.5">CGPA</dt>
              <dd>{education.cgpa}</dd>
            </dl>
            <p className="label mt-6">Coursework</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {education.coursework.map((c) => (
                <li key={c}>
                  <Chip>{c}</Chip>
                </li>
              ))}
            </ul>
          </article>
          <article className="h-fit rounded-2xl border border-line p-6 md:p-8">
            <p className="label">Certification</p>
            <ul className="mt-3 space-y-2">
              {certifications.map((c) => (
                <li key={c} className="font-display text-xl leading-snug">
                  {c}
                </li>
              ))}
            </ul>
            <p className="label mt-8">Currently learning</p>
            <p className="mt-2 text-paper/85">{profile.currentlyLearning.join(" · ")}</p>
          </article>
        </div>
      </Section>

      {/* ── Contact ──────────────────────────────────────────────── */}
      <Section id="contact" n="08" label="Contact" title="Write to me about internships, research, projects or a hackathon team.">
        <a href={email.url} className="group inline-flex max-w-full items-center gap-4 break-all font-display text-[clamp(1.6rem,5vw,3.75rem)] leading-none underline decoration-line-strong decoration-1 underline-offset-[0.2em] hover:decoration-signal">
          {email.handle}
          <ArrowRight size={32} className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
        </a>
        <SocialLinks className="mt-10" only={["GitHub", "LinkedIn", "Instagram", "Resume"]} />
      </Section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-paper-dim md:flex-row md:items-start md:justify-between md:px-8">
          <div className="space-y-1">
            <p className="text-paper">© {new Date().getFullYear()} Yukith M Joseph</p>
            <p>
              Built with Next.js, React Three Fiber and three.js.{" "}
              <a href="https://github.com/Zynx095/yukith-portfolio" {...external} className="underline underline-offset-4 hover:text-signal">
                Source
              </a>
              .
            </p>
            <p>
              Textures and models from{" "}
              <a href="https://polyhaven.com" {...external} className="underline underline-offset-4 hover:text-signal">
                Poly Haven
              </a>{" "}
              (CC0).
            </p>
            <p>
              Two presentations of the same portfolio:{" "}
              <a href="/?view=immersive" className="underline underline-offset-4 hover:text-signal">
                Immersive
              </a>{" "}
              ·{" "}
              <a href="/?view=classic" className="underline underline-offset-4 hover:text-signal">
                Classic
              </a>
              .
            </p>
          </div>
          <BackToTree />
        </div>
      </footer>
    </div>
  );
}
