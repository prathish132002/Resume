import { Resume, TemplateType } from "./types";

export const INITIAL_RESUME: Resume = {
  id: 'new-resume',
  name: 'Untitled Resume',
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    portfolio: '',
    githubUrl: '',
    location: '',
    summary: '',
  },
  education: [],
  experience: [],
  projects: [],
  skills: [],
  certifications: [],
  achievements: [],
};

export const SAMPLE_RESUME: Resume = {
  id: 'sample-resume',
  name: 'John Doe - Software Engineer',
  personalInfo: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    linkedin: 'linkedin.com/in/johndoe',
    portfolio: 'johndoe.com',
    githubUrl: 'github.com/johndoe',
    location: 'San Francisco, CA',
    summary: 'Motivated Software Engineer with a passion for building scalable web applications. Experienced in React, TypeScript, and Node.js. Eager to contribute to innovative projects and solve complex problems.',
  },
  education: [
    {
      id: 'edu-1',
      institution: 'University of Technology',
      degree: 'Bachelor of Science in Computer Science',
      startDate: '2019',
      endDate: '2023',
      gpa: '3.8/4.0'
    }
  ],
  experience: [
    {
      id: 'exp-1',
      company: 'Tech Solutions Inc.',
      role: 'Junior Frontend Developer',
      startDate: '2023-06',
      endDate: 'Present',
      description: '• Developed responsive user interfaces using React and Tailwind CSS.\n• Collaborated with backend teams to integrate RESTful APIs.\n• Improved site performance by 20% through code optimization.'
    }
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'E-commerce Platform',
      technologies: 'React, Node.js, MongoDB',
      link: 'github.com/johndoe/shop',
      description: 'Built a full-stack e-commerce application with user authentication, product search, and payment processing integration.'
    }
  ],
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'HTML/CSS', 'Git', 'SQL'],
  certifications: ['AWS Certified Cloud Practitioner', 'Meta Frontend Developer Certificate'],
  achievements: ['Dean\'s List 2021-2023', 'Winner of Campus Hackathon 2022'],
};

export const TEMPLATES = [
  { id: TemplateType.ATS_CLASSIC, name: 'ATS Standard', color: 'bg-slate-900' },
  { id: TemplateType.MODERN, name: 'Modern Clean', color: 'bg-blue-600' },
  { id: TemplateType.MINIMAL, name: 'Minimalist', color: 'bg-slate-800' },
  { id: TemplateType.EXECUTIVE, name: 'Executive', color: 'bg-emerald-700' },
];