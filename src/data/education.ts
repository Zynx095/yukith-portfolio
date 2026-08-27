export interface Education {
  degree: string;
  institution: string;
  period: string;
  cgpa: string;
  coursework: string[];
}

export const educationData: Education[] = [
  {
    degree: "B.Tech — Computer Science & Engineering (Networks)",
    institution: "Presidency University, Bengaluru",
    period: "2024–2028 expected",
    cgpa: "7.56 / 10",
    coursework: [
      "Computer Networks",
      "Network Security",
      "Artificial Intelligence",
      "Database Management Systems",
      "Data Structures & Algorithms"
    ]
  }
];
