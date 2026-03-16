import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { storageService } from '../services/storageService';
import { firebaseService } from '../services/firebaseService';
import { Button } from './ui/Button';
import { ArrowLeft, User, Briefcase, Save, Check, Mail } from 'lucide-react';

interface UserProfileProps {
  onBack: () => void;
}

const UserProfileView: React.FC<UserProfileProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', jobTitle: '' });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [emailChangeSent, setEmailChangeSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const user = await firebaseService.getUserProfile();
        
        if (user) {
          setProfile(user);
          setFormData({
            fullName: user.fullName,
            email: user.email,
            jobTitle: user.jobTitle || ''
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setError('');
    setEmailChangeSent(false);
    
    const emailChanged = formData.email !== profile.email;

    const updatedProfile: UserProfile = {
      ...profile,
      fullName: formData.fullName,
      // We don't update the email in the profile object immediately if it changed,
      // because it needs verification first.
      email: emailChanged ? profile.email : formData.email,
      jobTitle: formData.jobTitle
    };

    try {
      // Firebase mode
      if (emailChanged) {
        try {
          await firebaseService.updateEmailAddress(formData.email);
          setEmailChangeSent(true);
        } catch (err: any) {
          console.error("Error updating email:", err);
          if (err.code === 'auth/requires-recent-login') {
            setError("Changing your email requires a recent login. Please log out and log back in, then try again.");
            return; // Stop the save process if email update fails due to auth
          } else {
            setError(err.message || "Failed to initiate email change.");
            return;
          }
        }
      }

      await firebaseService.updateUserProfile(updatedProfile);
      setProfile(updatedProfile);
      
      if (!emailChanged) {
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Failed to save profile");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (!profile) return <div>Failed to load profile.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32 relative">
             <div className="absolute -bottom-10 left-8">
                <div className="w-24 h-24 bg-white rounded-full p-2 shadow-lg">
                  <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <User size={40} />
                  </div>
                </div>
             </div>
          </div>

          <div className="pt-14 p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{profile.fullName}</h1>
                <p className="text-slate-500">{profile.email}</p>
              </div>
              {!isEditing && (
                 <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                   Edit Profile
                 </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded text-sm mb-4">
                    {error}
                  </div>
                )}
                {emailChangeSent && (
                  <div className="p-3 bg-amber-50 text-amber-700 rounded text-sm mb-4 border border-amber-200">
                    <strong>Verification Required:</strong> A verification link has been sent to <strong>{formData.email}</strong>. 
                    Your email address will not be updated until you click the link.
                  </div>
                )}
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                   <div className="relative">
                      <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        className="w-full pl-10 p-2 border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.fullName}
                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                      />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                   <div className="relative">
                      <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        type="email"
                        className="w-full pl-10 p-2 border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Default Job Title</label>
                   <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        className="w-full pl-10 p-2 border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.jobTitle}
                        onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                        placeholder="e.g. Software Engineer"
                      />
                   </div>
                   <p className="text-xs text-slate-400 mt-1">This will be used when generating new resumes.</p>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="ghost" onClick={() => {
                    setIsEditing(false);
                    setError('');
                    setEmailChangeSent(false);
                    setFormData({
                      fullName: profile.fullName,
                      email: profile.email,
                      jobTitle: profile.jobTitle || ''
                    });
                  }}>Cancel</Button>
                  <Button onClick={handleSave} icon={<Save size={16} />}>Save Changes</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                 <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Member Since</h3>
                    <p className="text-slate-700 font-medium">{new Date(profile.createdAt).toLocaleDateString()}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Type</h3>
                    <p className="text-indigo-600 font-medium bg-indigo-50 inline-block px-2 py-0.5 rounded text-sm">Free Tier</p>
                 </div>
                 {profile.jobTitle && (
                   <div className="col-span-full bg-slate-50 p-4 rounded-lg">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Role</h3>
                      <p className="text-slate-700 font-medium">{profile.jobTitle}</p>
                   </div>
                 )}
              </div>
            )}
            
            {saveSuccess && (
               <div className="mt-4 p-3 bg-green-50 text-green-700 rounded flex items-center gap-2">
                 <Check size={16} /> Profile updated successfully
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
