/** Work experience — exactly as the current resume states it (October 2026). */

export interface Experience {
  organisation: string;
  role: string;
  period: string;
  /** What was built. */
  project: string;
  points: string[];
  stack: string[];
  link?: { label: string; href: string };
}

export const experience: Experience[] = [
  {
    organisation: "Elevance Skills",
    role: "Full-Stack Development Intern",
    period: "Jun 2026 · 1 month",
    project: "YukithHub — a full-stack community platform",
    points: [
      "Built YukithHub with Next.js, React, TypeScript, Node.js / Express and MongoDB: JWT and bcrypt auth, email and SMS OTP verification and password recovery.",
      "Implemented device-based login rules with login history, Razorpay subscription tiers with emailed invoices, a reward-points system and six-language support with OTP-gated switching.",
    ],
    stack: ["Next.js", "React", "TypeScript", "Express", "MongoDB", "Razorpay"],
    link: { label: "Source", href: "https://github.com/Zynx095/ElevanceSkills-internship-project" },
  },
  {
    organisation: "Presidency University × NVIDIA",
    role: "Capstone project",
    period: "1 – 10 Jun 2026",
    project: "AUTOHIRE — a local-first AI hiring platform",
    points: [
      "Built AUTOHIRE: PyMuPDF resume parsing and Sentence Transformers (all-MiniLM-L6-v2, CUDA with CPU fallback) for semantic job matching, plus deterministic ATS scoring — no external APIs.",
      "Delivered a candidate portal (job recommendations, multi-step assessments) and a recruiter console (applicant pipeline, AI reports, offer-letter generation).",
    ],
    stack: ["Python", "PyTorch", "Hugging Face", "Streamlit"],
    link: { label: "Source", href: "https://github.com/Zynx095/NvidiaProject" },
  },
];
