import React, { useEffect, useState } from 'react';
import { Plus, Upload, Wand2, Layout, FileText, User, LogOut, Clock, Trash2, Edit, FileSignature, AlertTriangle, ShieldAlert, MailWarning, BarChart2 } from 'lucide-react';
import { Resume } from '../types';
import { firebaseService } from '../services/firebaseService';
import { storageService } from '../services/storageService';
import { Button } from './ui/Button';
import { Logo } from './Logo';
import OnboardingTour from './OnboardingTour';

interface DashboardProps {
  isAdmin?: boolean;
  onCreateNew: () => void;
  onLoadSample: () => void;
  onImport: () => void;
  onGenerate: () => void;
  onEditResume: (resume: Resume) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onCoverLetter: () => void;
  onATSScore: () => void;
  onAdminDashboard?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  isAdmin,
  onCreateNew, 
  onLoadSample, 
  onImport, 
  onGenerate, 
  onEditResume,
  onOpenProfile,
  onLogout,
  onCoverLetter,
  onATSScore,
  onAdminDashboard
}) => {
  const [savedResumes, setSavedResumes] = useState<Resume[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(true);
  const [resendStatus, setResendStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Show tour to first-time users
    const hasSeenTour = localStorage.getItem('resumeforge_tour_seen');
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Firebase Mode
        const user = firebaseService.getCurrentUser();
        if (user) {
          setUserEmail(user.email || '');
          setEmailVerified(user.emailVerified);
          const resumes = await firebaseService.fetchResumes();
          setSavedResumes(resumes);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const checkVerification = async () => {
      const user = firebaseService.getCurrentUser();
      if (user && !user.emailVerified) {
        try {
          await user.reload();
          setEmailVerified(user.emailVerified);
        } catch (e) {
          console.error(e);
        }
      }
    };
    
    if (!emailVerified) {
      const interval = setInterval(checkVerification, 5000);
      return () => clearInterval(interval);
    }
  }, [emailVerified]);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setResumeToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!resumeToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await firebaseService.deleteResume(resumeToDelete);
      const resumes = await firebaseService.fetchResumes();
      setSavedResumes(resumes);
      setShowDeleteModal(false);
      setResumeToDelete(null);
    } catch (error) {
      console.error('Error deleting resume:', error);
      setDeleteError('Failed to delete resume. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setResendStatus('sending');
      await firebaseService.resendVerificationEmail();
      setResendStatus('sent');
      setTimeout(() => setResendStatus(''), 5000);
    } catch (error) {
      console.error('Error resending verification:', error);
      setResendStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {!emailVerified && (
        <div className="bg-amber-100 border-b border-amber-200 px-6 py-3 flex items-center justify-between text-amber-800 text-sm">
          <div className="flex items-center gap-2">
            <MailWarning size={18} className="text-amber-600" />
            <span>Please verify your email address to unlock all features. Check your inbox (and spam folder).</span>
          </div>
          <button 
            onClick={handleResendVerification}
            disabled={resendStatus === 'sending' || resendStatus === 'sent'}
            className="font-medium underline hover:text-amber-900 disabled:opacity-50"
          >
            {resendStatus === 'sending' ? 'Sending...' : resendStatus === 'sent' ? 'Sent!' : 'Resend Email'}
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 md:gap-3">
           <Logo className="w-8 h-8 md:w-10 md:h-10" />
           <span className="font-bold text-lg md:text-xl text-slate-800 tracking-tight">ResumeForge</span>
        </div>

        <div className="relative">
           <button 
             onClick={() => setShowMenu(!showMenu)}
             className="flex items-center gap-2 md:gap-3 hover:bg-slate-50 p-1 md:p-2 rounded-full transition-colors border border-transparent hover:border-slate-200"
           >
             <div className="text-right hidden md:block">
               <p className="text-sm font-bold text-slate-700">{userEmail.split('@')[0]}</p>
               <p className="text-xs text-slate-500">{userEmail}</p>
             </div>
             <div className="h-8 w-8 md:h-10 md:w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-200 text-sm md:text-base">
               {userEmail.charAt(0).toUpperCase()}
             </div>
           </button>

           {showMenu && (
             <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2">
               <button onClick={onOpenProfile} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                 <User size={16} /> My Profile
               </button>
               {isAdmin && onAdminDashboard && (
                 <button onClick={onAdminDashboard} className="w-full text-left px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50 flex items-center gap-2">
                   <ShieldAlert size={16} /> Admin Dashboard
                 </button>
               )}
               <div className="border-t border-slate-100 my-1"></div>
               <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                 <LogOut size={16} /> Sign Out
               </button>
             </div>
           )}
        </div>
      </header>

      <div className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome back, {userEmail.split('@')[0]} 👋</h1>
          <p className="text-slate-500">
            Manage your resumes or create a new one to get started.
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-12">
           <button onClick={onCreateNew} className="p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex flex-col items-center text-center gap-3 group">
              <div className="bg-white/20 p-3 rounded-full group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <div>
                <span className="block font-bold">Create New</span>
                <span className="text-blue-100 text-xs">Start from scratch</span>
              </div>
           </button>

           {/* Hiding Import Resume feature for now as requested */}
           {false && (
             <button onClick={onImport} className="p-6 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-emerald-500 hover:text-emerald-600 hover:shadow-md transition-all flex flex-col items-center text-center gap-3 group">
                <div className="bg-emerald-50 p-3 rounded-full text-emerald-600 group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <div>
                  <span className="block font-bold">Import Resume</span>
                  <span className="text-slate-400 text-xs group-hover:text-emerald-500">From text</span>
                </div>
             </button>
           )}

           <button 
             onClick={onGenerate} 
             disabled={!emailVerified}
             className={`p-6 bg-white border border-slate-200 text-slate-700 rounded-xl transition-all flex flex-col items-center text-center gap-3 group ${!emailVerified ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-500 hover:text-purple-600 hover:shadow-md'}`}
           >
              <div className={`bg-purple-50 p-3 rounded-full text-purple-600 ${!emailVerified ? '' : 'group-hover:scale-110'} transition-transform`}>
                <Wand2 size={24} />
              </div>
              <div>
                <span className="block font-bold">AI Generator</span>
                <span className={`text-xs ${!emailVerified ? 'text-slate-400' : 'text-slate-400 group-hover:text-purple-500'}`}>
                  {emailVerified ? 'By Job Role' : 'Verify email to use'}
                </span>
              </div>
           </button>

           <button 
             onClick={onCoverLetter} 
             disabled={!emailVerified}
             className={`p-6 bg-white border border-slate-200 text-slate-700 rounded-xl transition-all flex flex-col items-center text-center gap-3 group ${!emailVerified ? 'opacity-50 cursor-not-allowed' : 'hover:border-pink-500 hover:text-pink-600 hover:shadow-md'}`}
           >
              <div className={`bg-pink-50 p-3 rounded-full text-pink-600 ${!emailVerified ? '' : 'group-hover:scale-110'} transition-transform`}>
                <FileSignature size={24} />
              </div>
              <div>
                <span className="block font-bold">Cover Letter</span>
                <span className={`text-xs ${!emailVerified ? 'text-slate-400' : 'text-slate-400 group-hover:text-pink-500'}`}>
                  {emailVerified ? 'Tailored to Job' : 'Verify email to use'}
                </span>
              </div>
           </button>

           <button onClick={onLoadSample} className="p-6 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-amber-500 hover:text-amber-600 hover:shadow-md transition-all flex flex-col items-center text-center gap-3 group">
              <div className="bg-amber-50 p-3 rounded-full text-amber-600 group-hover:scale-110 transition-transform">
                <Layout size={24} />
              </div>
              <div>
                <span className="block font-bold">Templates</span>
                <span className="text-slate-400 text-xs group-hover:text-amber-500">View samples</span>
              </div>
           </button>

           <button onClick={onATSScore} className="p-6 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md transition-all flex flex-col items-center text-center gap-3 group">
              <div className="bg-indigo-50 p-3 rounded-full text-indigo-600 group-hover:scale-110 transition-transform">
                <BarChart2 size={24} />
              </div>
              <div>
                <span className="block font-bold">ATS Score</span>
                <span className="text-slate-400 text-xs group-hover:text-indigo-500">Scan PDF</span>
              </div>
           </button>
        </div>

        {/* Saved Resumes List */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-slate-400" /> Recent Resumes
          </h2>
          
          {loading ? (
             <div className="text-center py-10">
               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
             </div>
          ) : savedResumes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 border-dashed">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-slate-300" size={32} />
              </div>
              <p className="text-slate-500 font-medium">No resumes found</p>
              <p className="text-slate-400 text-sm">Create your first resume above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedResumes.map((resume) => (
                <div 
                  key={resume.id} 
                  onClick={() => onEditResume(resume)}
                  className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group relative"
                >
                  <div className="flex justify-between items-start mb-4">
                     <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <FileText size={20} />
                     </div>
                     <button 
                        onClick={(e) => handleDeleteClick(e, resume.id)}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {resume.name || 'Untitled Resume'}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-1">
                    {resume.personalInfo.location || 'No location set'} • {resume.personalInfo.phone || 'No phone'}
                  </p>
                  
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Edit size={12} /> Click to edit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-200 bg-white mt-auto">
        ResumeForge © 2025. Built with Google Gemini.
      </footer>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="bg-red-50 p-2 rounded-full">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold">Delete Resume?</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this resume? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle size={16} />
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button 
                variant="ghost" 
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setResumeToDelete(null);
                  setDeleteError(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                className="bg-red-600 hover:bg-red-700"
                onClick={confirmDelete}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Onboarding Tour */}
      {showTour && (
        <OnboardingTour 
          onComplete={() => {
            setShowTour(false);
            localStorage.setItem('resumeforge_tour_seen', 'true');
          }} 
        />
      )}
    </div>
  );
};

export default Dashboard;