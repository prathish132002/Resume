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
import { firebaseService } from './services/firebaseService';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [resume, setResume] = useState<Resume>(INITIAL_RESUME);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user) {
        setIsGuest(false);
        setCurrentView(AppView.DASHBOARD);
      } else if (!isGuest) {
        setCurrentView(AppView.LOGIN);
      }
    }
  }, [user, loading, isGuest]);

  const handleLoginSuccess = () => {
    setIsGuest(false);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleGuestLogin = () => {
    setIsGuest(true);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = async () => {
    if (!isGuest) {
      await firebaseService.logout();
    }
    setIsGuest(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="font-sans text-slate-900">
      {currentView === AppView.LOGIN && (
        <Login onLogin={handleLoginSuccess} />
      )}

      {currentView === AppView.DASHBOARD && (
        <Dashboard 
          isGuest={isGuest}
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
        <UserProfileView isGuest={isGuest} onBack={handleBackToDashboard} />
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
          isGuest={isGuest}
          resume={resume} 
          setResume={setResume} 
          onBack={handleBackToDashboard} 
        />
      )}
    </div>
  );
};

export default App;