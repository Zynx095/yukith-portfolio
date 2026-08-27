export interface SkillCategory {
  title: string;
  skills: string[];
}

export const skillsData: SkillCategory[] = [
  {
    title: "Cybersecurity & Networking",
    skills: [
      "TCP/IP Networking",
      "Network Security",
      "TLS",
      "JA3",
      "JA3S",
      "JA4 Fingerprinting",
      "Encrypted Traffic Analysis",
      "Access Control",
      "DLP",
      "Insider-Threat Monitoring",
      "System Hardening",
      "Breach-Response Protocols"
    ]
  },
  {
    title: "Programming & Systems",
    skills: [
      "Python",
      "C",
      "Embedded C",
      "SQL",
      "Git",
      "JavaScript/TypeScript",
      "IoT Architecture"
    ]
  },
  {
    title: "AI/ML & Computer Vision",
    skills: [
      "YOLOv8 / Ultralytics",
      "scikit-learn",
      "XGBoost",
      "OpenCV",
      "Whisper AI",
      "Ollama",
      "Google Gemini API"
    ]
  },
  {
    title: "Web & Backend",
    skills: [
      "FastAPI",
      "Next.js",
      "React",
      "WebSockets",
      "SQLite",
      "JWT",
      "bcrypt"
    ]
  },
  {
    title: "Hardware / Tools",
    skills: [
      "Arduino",
      "ESP32",
      "Unity Engine",
      "Microsoft Office Suite"
    ]
  }
];

export const certificationsData: string[] = [
  "Microsoft Azure AI Fundamentals (AZ-900)"
];
