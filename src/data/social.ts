export interface SocialLink {
  platform: "GitHub" | "LinkedIn" | "Instagram" | "Email" | "Resume";
  url: string;
  /** Short handle shown next to the icon where space allows. */
  handle?: string;
}

export const socialData: SocialLink[] = [
  { platform: "GitHub", url: "https://github.com/Zynx095", handle: "Zynx095" },
  { platform: "LinkedIn", url: "https://www.linkedin.com/in/yukith-joseph", handle: "yukith-joseph" },
  { platform: "Email", url: "mailto:yukithj@gmail.com", handle: "yukithj@gmail.com" },
  { platform: "Resume", url: "/resume.pdf" },
];
