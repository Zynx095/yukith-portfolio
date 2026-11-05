/**
 * Who Yukith is — identity, education and the short story the site tells.
 * Sources: the current resume (public/resume.pdf, October 2026), the GitHub
 * profile README and owner-provided notes. See docs/CONTENT_VERIFICATION.md.
 */

export const profile = {
  name: "Yukith M Joseph",
  firstName: "Yukith",
  role: "Computer Science & Engineering student · Networks",
  location: "Bengaluru, India",
  /** One-line introduction. */
  intro: "I build security systems, applied-AI tools and the occasional robot — and I like them to explain themselves.",
  /** A few sentences for the about section. */
  about: [
    "I'm a Computer Science & Engineering student at Presidency University, Bengaluru, specialising in networks. Most of what I build sits where networks, security and applied AI meet: agents that are checked before they act, devices that have to keep earning trust, traffic that is analysed without being decrypted.",
    "I learn by shipping. Hackathons are where a lot of my projects start, and I like the people side of them as much as the code — so I organise them too, from InnovateX to club events at my university.",
  ],
  focus: ["Network security", "Applied AI", "Distributed systems", "Embedded systems"],
  currentlyLearning: ["Threat management", "Intrusion detection systems", "Advanced networking concepts"],
  /** Short, true lines for the journey's narration. */
  lesson: "Never give up.",
} as const;

export const education = {
  degree: "B.Tech, Computer Science & Engineering (Networks)",
  institution: "Presidency University, Bengaluru",
  period: "2024 – 2028 (expected)",
  cgpa: "7.56 / 10",
  coursework: ["Computer Networks", "Network Security", "Artificial Intelligence", "Database Management Systems", "Data Structures & Algorithms"],
} as const;
