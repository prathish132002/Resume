import React, { useEffect, useState } from 'react';
import { Plus, Upload, Wand2, Layout, FileText, User, LogOut, Clock, Trash2, Edit, FileSignature } from 'lucide-react';
import { Resume, UserProfile } from '../types';
import { storageService } from '../services/storageService';
import { Button } from './ui/Button';
import { Logo } from './Logo';

interface DashboardProps {
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setSavedResumes(storageService.getResumes());
    setUser(storageService.getCurrentUser());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this resume?')) {
      storageService.deleteResume(id);
      setSavedResumes(storageService.getResumes());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
           <Logo size={40} />
           <span className="font-bold text-xl text-slate-800 tracking-tight">ResumeAI</span>
        </div>

        <div className="relative">
           <button 
             onClick={() => setShowMenu(!showMenu)}
             className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-full transition-colors border border-transparent hover:border-slate-200"
           >
             <div className="text-right hidden md:block">
               <p className="text-sm font-bold text-slate-700">{user?.fullName}</p>
               <p className="text-xs text-slate-500">{user?.email}</p>
             </div>
             <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
               {user?.fullName.charAt(0)}
             </div>
           </button>

           {showMenu && (
             <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2">
               <button onClick={onOpenProfile} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                 <User size={16} /> My Profile
               </button>
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome back, {user?.fullName.split(' ')[0]} 👋</h1>
          <p className="text-slate-500">Manage your resumes or create a new one to get started.</p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
           <button onClick={onCreateNew} className="p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex flex-col items-center text-center gap-3 group">
              <div className="bg-white/20 p-3 rounded-full group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <div>
                <span className="block font-bold">Create New</span>
                <span className="text-blue-100 text-xs">Start from scratch</span>
              </div>
           </button>

           <button onClick={onImport} className="p-6 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-emerald-500 hover:text-emerald-600 hover:shadow-md transition-all flex flex-col items-center text-center gap-3 group">
              <div className="bg-emerald-50 p-3 rounded-full text-emerald-600 group-hover:scale-110 transition-transform">
                <Upload size={24} />
              </div>
              <div>
                <span className="block font-bold">Import Resume</span>
                <span className="text-slate-400 text-xs group-hover:text-emerald-500">From text</span>
              </div>
           </button>

           <button onClick={onGenerate} className="p-6 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-purple-500 hover:text-purple-600 hover:shadow-md transition-all flex flex-col items-center text-center gap-3 group">
              <div className="bg-purple-50 p-3 rounded-full text-purple-600 group-hover:scale-110 transition-transform">
                <Wand2 size={24} />
              </div>
              <div>
                <span className="block font-bold">AI Generator</span>
                <span className="text-slate-400 text-xs group-hover:text-purple-500">By Job Role</span>
              </div>
           </button>

           <button onClick={onCoverLetter} className="p-6 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-pink-500 hover:text-pink-600 hover:shadow-md transition-all flex flex-col items-center text-center gap-3 group">
              <div className="bg-pink-50 p-3 rounded-full text-pink-600 group-hover:scale-110 transition-transform">
                <FileSignature size={24} />
              </div>
              <div>
                <span className="block font-bold">Cover Letter</span>
                <span className="text-slate-400 text-xs group-hover:text-pink-500">Tailored to Job</span>
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
        </div>

        {/* Saved Resumes List */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-slate-400" /> Recent Resumes
          </h2>
          
          {savedResumes.length === 0 ? (
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
                        onClick={(e) => handleDelete(e, resume.id)}
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
        ResumeAI © 2025. Built with Google Gemini.
      </footer>
    </div>
  );
};

export default Dashboard;