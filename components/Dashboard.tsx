import React, { useEffect, useState } from 'react';
import { Plus, Upload, Wand2, Layout, FileText, User, LogOut, Clock, Trash2, Edit, FileSignature, AlertTriangle } from 'lucide-react';
import { Resume } from '../types';
import { firebaseService } from '../services/firebaseService';
import { storageService } from '../services/storageService';
import { Button } from './ui/Button';
import { Logo } from './Logo';

interface DashboardProps {
  isGuest: boolean;
  onCreateNew: () => void;
  onLoadSample: () => void;
  onImport: () => void;
  onGenerate: () => void;
  onEditResume: (resume: Resume) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onCoverLetter: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  isGuest,
  onCreateNew, 
  onLoadSample, 
  onImport, 
  onGenerate, 
  onEditResume,
  onOpenProfile,
  onLogout,
  onCoverLetter
}) => {
  const [savedResumes, setSavedResumes] = useState<Resume[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (isGuest) {
          // Guest Mode
          // Initialize guest user if not exists (simulated login)
          const guestUser = storageService.login('guest@local', 'Guest User');
          setUserEmail(guestUser.email);
          const resumes = storageService.getResumes();
          setSavedResumes(resumes);
        } else {
          // Firebase Mode
          const user = firebaseService.getCurrentUser();
          if (user) {
            setUserEmail(user.email || '');
            const resumes = await firebaseService.fetchResumes();
            setSavedResumes(resumes);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isGuest]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this resume?')) {
      try {
        if (isGuest) {
          storageService.deleteResume(id);
          setSavedResumes(storageService.getResumes());
        } else {
          await firebaseService.deleteResume(id);
          const resumes = await firebaseService.fetchResumes();
          setSavedResumes(resumes);
        }
      } catch (error) {
        console.error('Error deleting resume:', error);
        alert('Failed to delete resume');
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-30 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-white/50 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3 group cursor-pointer">
           <div className="transform transition-transform group-hover:scale-110 duration-300">
             <Logo size={42} />
           </div>
           <span className="font-bold text-2xl text-slate-800 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">ResumeAI</span>
           {isGuest && (
             <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-amber-200 shadow-sm ml-2">
               <AlertTriangle size={12} /> Guest Mode
             </span>
           )}
        </div>

        <div className="relative">
           <button 
             onClick={() => setShowMenu(!showMenu)}
             className="flex items-center gap-3 hover:bg-white p-1.5 pr-4 rounded-full transition-all border border-transparent hover:border-slate-200 hover:shadow-md group"
           >
             <div className="h-10 w-10 bg-gradient-to-br from-brand-100 to-brand-50 rounded-full flex items-center justify-center text-brand-700 font-bold border border-brand-200 group-hover:scale-105 transition-transform shadow-inner">
               {userEmail.charAt(0).toUpperCase()}
             </div>
             <div className="text-right hidden md:block">
               <p className="text-sm font-bold text-slate-700 group-hover:text-brand-700 transition-colors">{userEmail.split('@')[0]}</p>
               <p className="text-xs text-slate-500">{isGuest ? 'Local Storage' : userEmail}</p>
             </div>
           </button>

           {showMenu && (
             <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 origin-top-right z-50">
               {!isGuest && (
                 <>
                   <button onClick={onOpenProfile} className="w-full text-left px-5 py-3 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-3 transition-colors font-medium">
                     <User size={18} /> My Profile
                   </button>
                   <div className="border-t border-slate-100 my-1"></div>
                 </>
               )}
               <button onClick={onLogout} className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium">
                 <LogOut size={18} /> {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
               </button>
             </div>
           )}
        </div>
      </header>

      <div className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        
        {/* Welcome Section */}
        <div className="mb-10 relative">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-accent-500">{userEmail.split('@')[0]}</span> 👋
              </h1>
              <p className="text-slate-500 text-lg">
                {isGuest 
                  ? 'Ready to build something amazing? Your data is saved locally.' 
                  : 'Manage your professional profile and create stunning resumes.'}
              </p>
            </div>
            <div className="hidden md:block">
               <p className="text-sm font-medium text-slate-400 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/50">
                 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
               </p>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-14">
           {/* Create New - Primary Action */}
           <button onClick={onCreateNew} className="glass-card p-6 bg-gradient-to-br from-brand-600 to-brand-500 text-white rounded-2xl hover:brightness-110 flex flex-col items-center text-center gap-4 group border-0 shadow-brand-500/30">
              <div className="bg-white/20 p-4 rounded-full group-hover:scale-110 transition-transform backdrop-blur-sm shadow-inner">
                <Plus size={28} className="text-white" />
              </div>
              <div>
                <span className="block font-bold text-lg">Create New</span>
                <span className="text-brand-100 text-sm opacity-90">Start from scratch</span>
              </div>
           </button>

           <button onClick={onImport} className="glass-card p-6 bg-white/80 rounded-2xl flex flex-col items-center text-center gap-4 group">
              <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <Upload size={28} />
              </div>
              <div>
                <span className="block font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">Import Text</span>
                <span className="text-slate-500 text-sm">Paste content</span>
              </div>
           </button>

           <button onClick={onGenerate} className="glass-card p-6 bg-white/80 rounded-2xl flex flex-col items-center text-center gap-4 group">
              <div className="bg-brand-100 p-4 rounded-full text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
                <Wand2 size={28} />
              </div>
              <div>
                <span className="block font-bold text-slate-800 text-lg group-hover:text-brand-700 transition-colors">AI Generator</span>
                <span className="text-slate-500 text-sm">By Job Role</span>
              </div>
           </button>

           <button onClick={onCoverLetter} className="glass-card p-6 bg-white/80 rounded-2xl flex flex-col items-center text-center gap-4 group">
              <div className="bg-pink-100 p-4 rounded-full text-pink-600 group-hover:bg-pink-500 group-hover:text-white transition-all duration-300">
                <FileSignature size={28} />
              </div>
              <div>
                <span className="block font-bold text-slate-800 text-lg group-hover:text-pink-700 transition-colors">Cover Letter</span>
                <span className="text-slate-500 text-sm">Tailored to Job</span>
              </div>
           </button>

           <button onClick={onLoadSample} className="glass-card p-6 bg-white/80 rounded-2xl flex flex-col items-center text-center gap-4 group">
              <div className="bg-amber-100 p-4 rounded-full text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                <Layout size={28} />
              </div>
              <div>
                <span className="block font-bold text-slate-800 text-lg group-hover:text-amber-700 transition-colors">Templates</span>
                <span className="text-slate-500 text-sm">View samples</span>
              </div>
           </button>
        </div>

        {/* Saved Resumes List */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Clock size={24} className="text-brand-600" /> Recent Resumes
          </h2>
          
          {loading ? (
             <div className="text-center py-12">
               <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-brand-600 mx-auto"></div>
             </div>
          ) : savedResumes.length === 0 ? (
            <div className="glass-panel text-center py-20 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                <FileText className="text-slate-300" size={40} />
              </div>
              <p className="text-slate-600 font-bold text-lg mb-1">No resumes found</p>
              <p className="text-slate-400">Create your first resume above to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedResumes.map((resume) => (
                <div 
                  key={resume.id} 
                  onClick={() => onEditResume(resume)}
                  className="glass-card bg-white p-6 rounded-2xl border border-slate-200 cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                     <button 
                        onClick={(e) => handleDelete(e, resume.id)}
                        className="bg-white text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full border border-slate-100 shadow-sm transition-all hover:scale-110"
                        title="Delete Resume"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                     <div className="h-12 w-12 min-w-[3rem] bg-gradient-to-br from-blue-50 to-indigo-50 text-brand-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <FileText size={24} />
                     </div>
                     <div>
                       <h3 className="font-bold text-slate-800 text-lg group-hover:text-brand-600 transition-colors line-clamp-1">
                         {resume.name || 'Untitled Resume'}
                       </h3>
                       <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Last updated just now
                       </p>
                     </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <User size={14} className="text-slate-400" /> 
                      <span className="truncate">{resume.personalInfo.fullName || 'No Name'}</span>
                    </div>
                    {(resume.personalInfo.jobTitle) && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <div className="w-3.5 flex justify-center"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div></div>
                        <span className="truncate">{resume.personalInfo.jobTitle}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-400 group-hover:text-brand-500 transition-colors flex items-center gap-1">
                      <Edit size={12} /> Click to edit
                    </span>
                    <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-brand-500 w-0 group-hover:w-full transition-all duration-500"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-200/60 bg-white/60 backdrop-blur-sm mt-auto">
        ResumeAI © 2025. Built with Google Gemini.
      </footer>
    </div>
  );
};

export default Dashboard;