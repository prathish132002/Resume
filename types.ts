export interface Resume {
  id: string;
  name: string;
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: string[];
  certifications: string[];
  achievements: string[];
}

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  location: string;
  summary: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string; // Bullet points separated by newlines
}

export interface Project {
  id: string;
  name: string;
  technologies: string;
  link?: string;
  description: string;
}

export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
  IMPORT = 'IMPORT',
  ROLE_GENERATOR = 'ROLE_GENERATOR',
  PROFILE = 'PROFILE',
  COVER_LETTER = 'COVER_LETTER',
}

export enum TemplateType {
  MODERN = 'MODERN',
  MINIMAL = 'MINIMAL',
  EXECUTIVE = 'EXECUTIVE',
  ATS_CLASSIC = 'ATS_CLASSIC',
}

export interface GeminiResponse {
  text: string;
}

// User Account Types

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  jobTitle?: string;
  avatar?: string;
  createdAt: number;
}

export interface ResumeVersion {
  id: string;
  timestamp: number;
  resume: Resume;
}