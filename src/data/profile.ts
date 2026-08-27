export interface Profile {
  name: string;
  degree: string;
  university: string;
  expectedGraduation: string;
  cgpa: string;
  primaryFocus: string[];
}

export const profileData: Profile = {
  name: "Yukith M Joseph",
  degree: "B.Tech — Computer Science & Engineering (Networks)",
  university: "Presidency University, Bengaluru",
  expectedGraduation: "2028",
  cgpa: "7.56 / 10",
  primaryFocus: [
    "Cybersecurity",
    "Networking",
    "Applied AI/ML",
    "Secure Systems",
    "Computer Vision",
    "Intelligent Hardware / IoT"
  ]
};
