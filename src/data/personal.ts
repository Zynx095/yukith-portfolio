export interface School {
  name: string;
  years: string;
  memory?: string;
  achievement?: string;
}

export interface Hackathon {
  name: string;
  result: string;
  year?: string;
}

export interface ProjectInfo {
  name: string;
  description: string;
  technologies?: string[];
  role?: string;
}

export interface Internship {
  company: string;
  role: string;
  dates?: string;
  team?: string;
  project?: string;
}

export interface Leadership {
  organization: string;
  role: string;
  start?: string;
  status?: string;
  details?: string;
}

export const personalStory = {
  identity: {
    name: "Yukith M Joseph",
    preferredName: "Yukith",
    focus: "Aspiring Network Security / Applied AI Engineer",
    dateOfBirth: "09/07/2006",
    currentCity: "Bengaluru",
    grewUpIn: "Bengaluru",
  },
  
  childhood: {
    description: "I had a really interesting childhood. I used to dream of growing up and playing all the games I used to watch on YouTube or at my friend's home.",
    importantMemory: "When my entire family attended my birthday party. That day is a core memory for me.",
    familyMembers: "I have 3 members in my family.",
    siblings: "None, but I do have a cute lil dog (shih tzu), her name is Bella.",
    influences: "My counselor in my 8th grade really helped guide my perspective.",
    languages: ["English", "Telugu", "Hindi", "Kannada", "French"],
    hobbies: ["Reading"],
    obsessions: "Constantly pushing myself to be better and learn faster.",
    definingMoment: "There was a period where I felt a little lost, like I was always trying to catch up. Eventually, I realized I just needed to lock in and focus on my own path.",
    privateNote: {
      public: true,
      text: "I have a very supportive girlfriend and she motivates me to keep growing and becoming a better version of myself."
    }
  },

  firstTechnology: {
    device: "A custom built PC from scraps",
    year: "2023",
    firstGame: "Elden Ring / CSGO",
    firstBuild: "A Bus navigation app",
    firstLanguage: "Python",
    realization: "Getting into a hackathon because my pitch was good and building a realtime project for the first time.",
    whatMadeItInteresting: "The innovation and the fact that it could make an impact on the world.",
    firstSeriousProject: "ETTH (Encrypted Traffic Threat Hunter) - still in development.",
    feelings: "Very thrilled. It was a solid idea that came to me after noticing how packets and data are transferred across the world."
  },

  education: {
    schools: [
      {
        name: "NCFE",
        years: "5",
        memory: "A time of finding my footing and learning what mattered to me.",
        achievement: "100 in 4/7 subjects."
      },
      {
        name: "Orchids The International School",
        years: "7",
        memory: "Friends that soon became close like family.",
        achievement: "Still holding the highest number of medals, trophies, and certificates earned up to today."
      }
    ] as School[],
    academics: {
      tenth: "78.6%",
      twelfth: "79.9%"
    },
    university: {
      name: "Presidency University, Bengaluru",
      degree: "B.Tech Computer Science & Engineering",
      focus: "Networks / Cybersecurity",
      expectedGraduation: "2028",
      cgpa: "7.56",
      whyPresidency: "I studied my 11th and 12th in Presidency University and had gotten really attached to the campus. It felt like a dream to attend, so I locked in on getting into this college.",
      whyCSE: "Networks and cybersecurity always felt super interesting, so choosing this path just felt right.",
      expectation: "I expected it to be stressful.",
      reality: "It actually became another home.",
      biggestLesson: "Never Give Up.",
      memorableExperience: "Organizing 10 events, attending a 24-hour hackathon, and participating in 2 other hackathons and a project expo in under 4 days while having fun with friends.",
      howInterestsChanged: "I started liking things I never liked before. I learned to enjoy the pressure, and I genuinely started liking the work.",
      currentlyLearning: "Threat managing and intrusion detection systems",
      currentCourses: "Advanced Network concepts"
    }
  },

  engineeringIdentity: {
    directions: ["Computer Networks", "Cybersecurity", "Applied AI", "Intelligent systems", "Software engineering", "Hardware/robotics", "Full-stack development"]
  },

  projects: [
    {
      name: "ETTH",
      description: "Encrypted Traffic Threat Hunter"
    },
    {
      name: "AURA",
      description: "Autonomous Unified Recognition Assistant"
    },
    {
      name: "ShadowGuard",
      description: "Cybersecurity / Shadow AI security concept/prototype."
    },
    {
      name: "Sugar AI",
      description: "Offline voice assistant using technologies including Whisper/faster-whisper, local LLM/Ollama and TTS."
    },
    {
      name: "STP BOT",
      description: "Autonomous robotics project"
    },
    {
      name: "EDITH AR",
      description: "AR / ESP32 / IoT concept"
    },
    {
      name: "NIDS ENGINE",
      description: "Intrusion detection project"
    }
  ] as ProjectInfo[],

  internships: [
    {
      company: "Elevance",
      role: "Full-Stack Development Intern"
    },
    {
      company: "NVIDIA × Presidency University Capstone",
      role: "AutoHire System Builder",
      dates: "1/6/2006",
      team: "Solo",
      project: "AutoHire System"
    }
  ] as Internship[],

  leadership: [
    {
      organization: "InTech Club",
      role: "Social Media Head",
      start: "June 2026",
      status: "Present",
      details: "Posting content given and ensuring reach across LinkedIn and Instagram."
    },
    { organization: "InnovateX Tech Fest", role: "Leader/Member" },
    { organization: "Build Club", role: "Leader/Member" },
    { organization: "One-O-One Club", role: "Leader/Member" },
    { organization: "Informatica Club", role: "Leader/Member" },
    { organization: "Magic Shop", role: "Leader/Member" }
  ] as Leadership[],

  hackathons: [
    { name: "Smart India Hackathon 2025", result: "TOP 30 FINALIST" },
    { name: "Nirmith 2026 National Level Hackathon", result: "NATIONAL FINALIST" },
    { name: "Hardware Hackathon, InnovateX 4.0", result: "RUNNER-UP" },
    { name: "Hardware Expo", result: "RUNNER-UP" }
  ] as Hackathon[],

  interests: {
    games: ["Elden Ring", "Valorant"],
    anime: ["Tomodachi Game", "Bleach"],
    manga: ["Jujutsu Kaisen"],
    manhwa: ["Lookism"],
    tvShows: ["Dark"],
    fictionalCharacter: "Shingen Yamazaki from Lookism",
    music: ["R n B"],
    hobbies: ["Reading", "Writing novels/Books", "Storytelling"],
    geekOut: ["Video Games", "Manhwas"],
    dislikes: ["Loud and messy things"]
  },

  personality: {
    howITalk: "Really humble",
    humor: "AMAZINGLY BAD",
    sayOften: "I'd rather not tell it",
    inWords: "Very Outgoing, kind. I've been called egoistic tho.",
    excitesMe: "FOOOD",
    frustratesMe: "Hunger",
    friendsSay: "Perfect, Home",
    badAt: "Everything",
    goodAt: "Nothing (BUT NO ONE BELIEVES ME)"
  },

  future: {
    goal3Year: "A well settled job offer letter as well as a nice Future plan for masters in canada after a few years of job.",
    companies: ["Cisco", "SAP", "NTT Data", "IBM"],
    technologiesToMaster: ["Python", "Cisco", "Cloud Services"],
    researchInterests: ["Network Threat detection", "Intrusion Detection Systems", "IOT embedded projects"]
  }
};
