// Pre-stored common skills for popular job roles to save AI token usage.

export const ROLE_SKILLS: Record<string, string[]> = {
  "software engineer": [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", "Git", "REST APIs",
    "Data Structures", "Algorithms", "SQL", "Docker", "CI/CD", "Unit Testing", "System Design", "Agile"
  ],
  "frontend developer": [
    "React", "TypeScript", "JavaScript", "HTML5", "CSS3/Tailwind", "Next.js", "Redux",
    "REST APIs", "GraphQL", "Web Performance", "Jest", "Git", "Responsive Design", "Webpack/Vite", "UI/UX Concepts"
  ],
  "backend developer": [
    "Node.js", "Python", "Java", "Express.js", "PostgreSQL", "MongoDB", "REST APIs",
    "GraphQL", "Docker", "Redis", "Microservices", "System Design", "AWS", "Git", "CI/CD"
  ],
  "full stack developer": [
    "React", "Node.js", "TypeScript", "Express.js", "MongoDB", "PostgreSQL", "JavaScript",
    "REST APIs", "Tailwind CSS", "Docker", "Git", "AWS", "GraphQL", "CI/CD", "Agile"
  ],
  "data scientist": [
    "Python", "R", "SQL", "Machine Learning", "Deep Learning", "Pandas", "NumPy",
    "Scikit-Learn", "TensorFlow", "PyTorch", "Data Visualization", "Statistics", "Tableau", "Git", "Big Data"
  ],
  "data analyst": [
    "SQL", "Python", "Excel", "Tableau", "Power BI", "Data Visualization", "Statistics",
    "R", "ETL Processes", "Google Analytics", "Business Intelligence", "Problem Solving", "Communication", "Jira", "A/B Testing"
  ],
  "devops engineer": [
    "Docker", "Kubernetes", "AWS", "Terraform", "Jenkins", "CI/CD", "Linux",
    "Bash/Shell Scripting", "Python", "Ansible", "Git", "Prometheus", "Grafana", "Networking", "Security"
  ],
  "cloud engineer": [
    "AWS", "Azure", "Google Cloud (GCP)", "Terraform", "Kubernetes", "Docker", "Linux",
    "Networking", "Python", "CI/CD", "Cloud Security", "IAM", "Serverless", "Bash", "Cost Optimization"
  ],
  "mobile developer": [
    "React Native", "Flutter", "Swift", "Kotlin", "Android Studio", "Xcode", "iOS Development",
    "REST APIs", "Mobile UI Design", "State Management", "Git", "App Store Deployment", "Firebase", "TypeScript", "GraphQL"
  ],
  "ui/ux designer": [
    "Figma", "Adobe XD", "Wireframing", "Prototyping", "User Research", "Usability Testing",
    "Design Systems", "Information Architecture", "User Personas", "Visual Design", "Accessibility (WCAG)", "CSS", "Micro-interactions", "Design Thinking", "Agile"
  ],
  "product manager": [
    "Product Strategy", "Roadmapping", "Agile/Scrum", "User Research", "A/B Testing", "Data Analytics",
    "Jira", "Wireframing", "PRD Writing", "Stakeholder Management", "SQL", "Market Research", "Feature Prioritization", "Customer Success", "KPI Tracking"
  ],
  "qa engineer": [
    "Selenium", "Cypress", "Playwright", "Postman", "API Testing", "Manual Testing", "Automated Testing",
    "JavaScript/Python", "Jest/Mocha", "Jira", "CI/CD Integration", "Test Planning", "Bug Reporting", "Git", "Load Testing"
  ],
  "cybersecurity analyst": [
    "Network Security", "SIEM", "Penetration Testing", "Vulnerability Assessment", "Incident Response", "Firewalls",
    "Wireshark", "Python", "Linux", "Ethical Hacking", "SOC Operations", "Threat Intelligence", "ISO 27001", "OWASP", "Encryption"
  ],
  "ai/ml engineer": [
    "Python", "PyTorch", "TensorFlow", "Machine Learning", "Deep Learning", "NLP",
    "Computer Vision", "Scikit-Learn", "MLOps", "Docker", "REST APIs", "CUDA", "Model Deployment", "Git", "Mathematics"
  ],
  "system administrator": [
    "Linux (Ubuntu/CentOS)", "Windows Server", "Active Directory", "Bash Scripting", "Networking (TCP/IP)",
    "DNS/DHCP", "VMware/Hyper-V", "Backup & Recovery", "System Security", "Troubleshooting", "Powershell", "Firewalls", "Docker", "Monitoring", "Cloud Basics"
  ],
  "database administrator": [
    "PostgreSQL", "MySQL", "Oracle", "SQL Server", "Query Optimization", "Database Indexing",
    "Backup & Recovery", "ETL", "Data Security", "Replication", "Performance Tuning", "MongoDB", "NoSQL", "Python", "Linux"
  ],
  "blockchain developer": [
    "Solidity", "Ethereum", "Smart Contracts", "Web3.js", "Ethers.js", "Hardhat", "Rust",
    "Cryptography", "JavaScript", "TypeScript", "DeFi", "NFT Standards", "Git", "Testing", "Security Auditing"
  ],
  "game developer": [
    "Unity", "Unreal Engine", "C#", "C++", "3D Math/Physics", "Game Design", "Shader Programming",
    "Version Control (Git/Perforce)", "Animation", "Multiplayer Systems", "UI Design", "Performance Optimization", "Sound Integration", "Artificial Intelligence", "Scripting"
  ],
  "digital marketer": [
    "SEO", "Google Ads", "Social Media Marketing", "Content Strategy", "Google Analytics",
    "Email Marketing", "Copywriting", "A/B Testing", "Conversion Rate Optimization (CRO)", "Semrush", "Meta Ads", "Brand Strategy", "CRM", "WordPress", "Canva"
  ],
  "graphic designer": [
    "Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "Typography", "Branding & Identity",
    "Layout Design", "Color Theory", "Figma", "Logo Design", "Print Design", "Digital Illustration", "Photo Editing", "Creative Thinking", "Visual Communication", "Client Management"
  ]
};

/**
 * Searches the pre-stored role skills dictionary for a matching or partial role name.
 * Returns the list of skills if a match is found, otherwise null.
 */
export const findRoleSkills = (jobTitle: string): string[] | null => {
  if (!jobTitle || !jobTitle.trim()) return null;

  const normalized = jobTitle.trim().toLowerCase();

  // 1. Direct exact or substring match
  for (const [role, skills] of Object.entries(ROLE_SKILLS)) {
    if (normalized.includes(role) || role.includes(normalized)) {
      return skills;
    }
  }

  // 2. Word token overlap match
  const tokens = normalized.split(/\s+/).filter(t => t.length > 2);
  for (const [role, skills] of Object.entries(ROLE_SKILLS)) {
    const roleTokens = role.split(/\s+/);
    if (tokens.some(token => roleTokens.includes(token))) {
      return skills;
    }
  }

  return null;
};
