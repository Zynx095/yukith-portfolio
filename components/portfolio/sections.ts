/** The written portfolio's sections, in page order (index, top bar, skip links). */
export const SECTIONS = [
  { id: "record", label: "Introduction", nav: false },
  { id: "about", label: "About", nav: true },
  { id: "work", label: "Projects", nav: true },
  { id: "experience", label: "Experience", nav: true },
  { id: "leadership", label: "Leadership", nav: false },
  { id: "achievements", label: "Achievements", nav: true },
  { id: "skills", label: "Skills", nav: true },
  { id: "education", label: "Education", nav: false },
  { id: "contact", label: "Contact", nav: true },
] as const;
