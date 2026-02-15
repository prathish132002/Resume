import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import ResumeImporter from './components/ResumeImporter';
import RoleGenerator from './components/RoleGenerator';
import CoverLetterGenerator from './components/CoverLetterGenerator';
import Login from './components/Login';
import UserProfileView from './components/UserProfile';
import { Resume, AppView } from './types';
import { INITIAL_RESUME, SAMPLE_RESUME } from './constants';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [resume, setResume] = useState<Resume>(INITIAL_RESUME);

  useEffect(() => {
    // Check if user is logged in
    const user = storageService.getCurrentUser();
    if (user) {
      setCurrentView(AppView.DASHBOARD);
      // Try to load the most recent resume to state, so generators have context
      const resumes = storageService.getResumes();
      if(resumes.length > 0) {
        setResume(resumes[0]);
      }
    } else {
      setCurrentView(AppView.LOGIN);
    }
  }, []);

  const handleLogin = (email: string, name: string) => {
    storageService.login(email, name);
    setCurrentView(AppView.DASHBOARD);
    const resumes = storageService.getResumes();
    if(resumes.length > 0) {
        setResume(resumes[0]);
    }
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentView(AppView.LOGIN);
  };

  const handleCreateNew = () => {
    // Generate new ID
    const newResume = { ...INITIAL_RESUME, id: Math.random().toString(36).substr(2, 9) };
    setResume(newResume);
    setCurrentView(AppView.EDITOR);
  };

  const handleLoadSample = () => {
    const sample = { ...SAMPLE_RESUME, id: Math.random().toString(36).substr(2, 9) };
    setResume(sample);
    setCurrentView(AppView.EDITOR);
  };

  const handleImport = () => {
    setCurrentView(AppView.IMPORT);
  };

  const handleRoleGenerate = () => {
    setCurrentView(AppView.ROLE_GENERATOR);
  };

  const handleCoverLetter = () => {
    setCurrentView(AppView.COVER_LETTER);
  }

  const handleResumeLoaded = (newResume: Resume) => {
    setResume(newResume);
    setCurrentView(AppView.EDITOR);
  };

  const handleBackToDashboard = () => {
    setCurrentView(AppView.DASHBOARD);
  };

  return (
    <div className="font-sans text-slate-900">
      {currentView === AppView.LOGIN && (
        <Login onLogin={handleLogin} />
      )}

      {currentView === AppView.DASHBOARD && (
        <Dashboard 
          onCreateNew={handleCreateNew} 
          onLoadSample={handleLoadSample}
          onImport={handleImport}
          onGenerate={handleRoleGenerate}
          onCoverLetter={handleCoverLetter}
          onEditResume={(r) => {
            setResume(r);
            setCurrentView(AppView.EDITOR);
          }}
          onOpenProfile={() => setCurrentView(AppView.PROFILE)}
          onLogout={handleLogout}
        />
      )}
      
      {currentView === AppView.PROFILE && (
        <UserProfileView onBack={handleBackToDashboard} />
      )}
      
      {currentView === AppView.IMPORT && (
        <ResumeImporter 
          onImport={handleResumeLoaded}
          onBack={handleBackToDashboard}
        />
      )}

      {currentView === AppView.ROLE_GENERATOR && (
        <RoleGenerator 
          onGenerate={handleResumeLoaded}
          onBack={handleBackToDashboard}
        />
      )}

      {currentView === AppView.COVER_LETTER && (
        <CoverLetterGenerator
            resume={resume}
            onBack={handleBackToDashboard}
        />
      )}
      
      {currentView === AppView.EDITOR && (
        <Editor 
          resume={resume} 
          setResume={setResume} 
          onBack={handleBackToDashboard} 
        />
      )}
    </div>
  );
};

export default App;