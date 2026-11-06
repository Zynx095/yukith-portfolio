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
  intro: "I build working systems across security, applied AI, networking and hardware — and I'm precise about what each one does.",
  /** A few sentences for the about section. */
  about: [
    "I study Computer Science & Engineering, specialising in networks, at Presidency University, Bengaluru. Most of what I build sits where networks, security and applied AI meet: a gateway that keeps re-checking whether an IoT device can still be trusted, a policy layer that inspects an AI agent's actions before they run, a pipeline that looks for threats in encrypted traffic without decrypting it.",
    "Several of these projects began at hackathons, and I compete often: a Top 30 national final at Smart India Hackathon 2025, national finalist at Nirmith 2026, runner-up twice at InnovateX 4.0. I help run them too — I organised the InnovateX Tech Fest and lead events for three university clubs.",
    "Every project here links to its source, and every record says what is simulated, partial or not deployed yet.",
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
