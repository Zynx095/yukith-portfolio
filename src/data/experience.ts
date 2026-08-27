export interface Experience {
  company: string;
  type: string;
  dates?: string;
  projectName?: string;
  team?: string;
  division?: string;
  responsibilities?: string[];
  technologies?: string[];
  outcomes?: string[];
  metrics?: string[];
}

export const experienceData: Experience[] = [
  {
    company: "NVIDIA × Presidency University",
    type: "Capstone Project Internship"
  },
  {
    company: "Elevance",
    type: "Full-Stack Development Intern"
  }
];
