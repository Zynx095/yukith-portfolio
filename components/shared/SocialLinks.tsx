import { socialData, type SocialLink } from "@/src/data/social";
import { FileIcon, GitHubIcon, InstagramIcon, LinkedInIcon, MailIcon } from "./Icons";

const ICON: Record<SocialLink["platform"], (p: { size?: number }) => React.ReactElement> = {
  GitHub: GitHubIcon,
  LinkedIn: LinkedInIcon,
  Instagram: InstagramIcon,
  Email: MailIcon,
  Resume: FileIcon,
};

const external = (url: string) => url.startsWith("http");

/** Contact and profile links. `variant="icons"` is compact; `"buttons"` shows labels. */
export function SocialLinks({ variant = "buttons", className = "", only }: { variant?: "icons" | "buttons"; className?: string; only?: SocialLink["platform"][] }) {
  const links = only ? socialData.filter((l) => only.includes(l.platform)) : socialData;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {links.map((l) => {
        const Icon = ICON[l.platform];
        const label = l.platform === "Resume" ? "Resume (PDF)" : l.platform;
        return (
          <li key={l.platform}>
            <a
              href={l.url}
              {...(external(l.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              {...(l.platform === "Resume" ? { target: "_blank" } : {})}
              aria-label={variant === "icons" ? `${label}${l.handle ? ` — ${l.handle}` : ""}` : undefined}
              className={
                variant === "icons"
                  ? "grid h-10 w-10 place-items-center rounded-full border border-line text-paper-dim transition-colors duration-200 hover:border-signal/60 hover:text-paper"
                  : "inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm text-paper transition-colors duration-200 hover:border-signal/60 hover:text-signal"
              }
            >
              <Icon size={16} />
              {variant === "buttons" && <span>{label}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
