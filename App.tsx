import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import ResumeImporter from './components/ResumeImporter';
import RoleGenerator from './components/RoleGenerator';
import CoverLetterGenerator from './components/CoverLetterGenerator';
import ATSScoreChecker from './components/ATSScoreChecker';
import Login from './components/Login';
import UserProfileView from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import { Resume, AppView } from './types';
import { INITIAL_RESUME, SAMPLE_RESUME } from './constants';
import { firebaseService } from './services/firebaseService';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [resume, setResume] = useState<Resume>(INITIAL_RESUME);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user) {
        setCurrentView(AppView.DASHBOARD);
        firebaseService.getUserProfile().then(profile => {
          if (profile?.role === 'admin') setIsAdmin(true);
        });
      } else {
        setCurrentView(AppView.LOGIN);
      }
    }
  }, [user, loading]);

  const handleLoginSuccess = () => {
    setCurrentView(AppView.DASHBOARD);
    firebaseService.getUserProfile().then(profile => {
      if (profile?.role === 'admin') setIsAdmin(true);
    });
  };

  const handleLogout = async () => {
    await firebaseService.logout();
    setIsAdmin(false);
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

  const handleATSScore = () => {
    setCurrentView(AppView.ATS_SCORE);
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
          isAdmin={isAdmin}
          onCreateNew={handleCreateNew} 
          onLoadSample={handleLoadSample}
          onImport={handleImport}
          onGenerate={handleRoleGenerate}
          onCoverLetter={handleCoverLetter}
          onATSScore={handleATSScore}
          onAdminDashboard={() => setCurrentView(AppView.ADMIN_DASHBOARD)}
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
      
      {currentView === AppView.ADMIN_DASHBOARD && (
        <AdminDashboard onBack={handleBackToDashboard} />
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

      {currentView === AppView.ATS_SCORE && (
        <ATSScoreChecker onBack={handleBackToDashboard} />
      )}
      
      {currentView === AppView.EDITOR && (
        <Editor 
          emailVerified={user?.emailVerified ?? true}
          resume={resume} 
          setResume={setResume} 
          onBack={handleBackToDashboard} 
        />
      )}
    </div>
  );
};

export default App;