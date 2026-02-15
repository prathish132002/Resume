import { Resume, UserProfile, ResumeVersion } from '../types';
import { INITIAL_RESUME } from '../constants';

const KEYS = {
  CURRENT_USER: 'resumeai_current_user',
  USERS: 'resumeai_users',
  RESUMES: 'resumeai_resumes',
  VERSIONS: 'resumeai_versions_', // Prefix
};

export const storageService = {
  // --- Auth / User Management ---

  login: (email: string, fullName: string): UserProfile => {
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '{}');
    let user = users[email];

    if (!user) {
      // Register new user
      user = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        fullName,
        createdAt: Date.now(),
      };
      users[email] = user;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }

    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
  },

  getCurrentUser: (): UserProfile | null => {
    const userStr = localStorage.getItem(KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  updateProfile: (updatedProfile: UserProfile) => {
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '{}');
    users[updatedProfile.email] = updatedProfile;
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(updatedProfile));
  },

  // --- Resume Management ---

  saveResume: (resume: Resume) => {
    const user = storageService.getCurrentUser();
    if (!user) return;

    // 1. Get existing resumes
    const allResumes = JSON.parse(localStorage.getItem(KEYS.RESUMES) || '{}');
    const userResumes = allResumes[user.id] || [];

    // 2. Update or Add
    const existingIndex = userResumes.findIndex((r: Resume) => r.id === resume.id);
    if (existingIndex >= 0) {
      userResumes[existingIndex] = resume;
    } else {
      userResumes.push(resume);
    }

    // 3. Save back
    allResumes[user.id] = userResumes;
    localStorage.setItem(KEYS.RESUMES, JSON.stringify(allResumes));

    // 4. Create a history version automatically on save
    storageService.saveVersion(resume);
  },

  getResumes: (): Resume[] => {
    const user = storageService.getCurrentUser();
    if (!user) return [];
    const allResumes = JSON.parse(localStorage.getItem(KEYS.RESUMES) || '{}');
    return allResumes[user.id] || [];
  },

  getResume: (id: string): Resume | null => {
    const resumes = storageService.getResumes();
    return resumes.find(r => r.id === id) || null;
  },

  deleteResume: (id: string) => {
    const user = storageService.getCurrentUser();
    if (!user) return;

    const allResumes = JSON.parse(localStorage.getItem(KEYS.RESUMES) || '{}');
    const userResumes = allResumes[user.id] || [];
    
    allResumes[user.id] = userResumes.filter((r: Resume) => r.id !== id);
    localStorage.setItem(KEYS.RESUMES, JSON.stringify(allResumes));
    
    // Clean up versions
    localStorage.removeItem(`${KEYS.VERSIONS}${id}`);
  },

  // --- History / Version Control ---

  saveVersion: (resume: Resume) => {
    const key = `${KEYS.VERSIONS}${resume.id}`;
    const versions: ResumeVersion[] = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Max 10 versions to save space
    const newVersion: ResumeVersion = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      resume: JSON.parse(JSON.stringify(resume)), // Deep copy
    };

    const updatedVersions = [newVersion, ...versions].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(updatedVersions));
  },

  getVersions: (resumeId: string): ResumeVersion[] => {
    const key = `${KEYS.VERSIONS}${resumeId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
};
