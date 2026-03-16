import React, { useState } from 'react';
import { Button } from './ui/Button';
import { ArrowLeft, Sparkles, Briefcase, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { generateResumeByRole, parseResumeContent, transformResumeForRole } from '../services/geminiService';
import { Resume } from '../types';

interface RoleGeneratorProps {
  onGenerate: (resume: Resume) => void;
  onBack: () => void;
}

const RoleGenerator: React.FC<RoleGeneratorProps> = ({ onGenerate, onBack }) => {
  const [activeTab, setActiveTab] = useState<'scratch' | 'transform'>('scratch');

  // Scratch Mode State
  const [role, setRole] = useState('');
  const [level, setLevel] = useState('Entry Level');
  const [jobDescription, setJobDescription] = useState('');
  
  // Transform Mode State
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const cleanJson = (text: string) => text.replace(/```json/g, '').replace(/```/g, '').trim();

  const handleGenerateFromScratch = async () => {
    if (!role.trim()) return;
    setIsGenerating(true);
    setError('');

    try {
      const jsonString = await generateResumeByRole(role, level, jobDescription);
      const parsedData = JSON.parse(cleanJson(jsonString));

      const newResume: Resume = {
        id: `gen-${Date.now()}`,
        name: `${role} Resume`,
        personalInfo: parsedData.personalInfo || {},
        education: parsedData.education || [],
        experience: parsedData.experience || [],
        projects: parsedData.projects || [],
        skills: parsedData.skills || [],
        certifications: parsedData.certifications || [],
        achievements: parsedData.achievements || []
      };

      onGenerate(newResume);
    } catch (err) {
      console.error(err);
      setError('Failed to generate resume. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTransformExisting = async () => {
    if (!resumeText.trim() || !targetRole.trim()) {
        setError("Please provide both resume content and target role.");
        return;
    }
    setIsGenerating(true);
    setError('');

    try {
        // Step 1: Parse the input text
        const parsedJsonString = await parseResumeContent(resumeText);
        const parsedData = JSON.parse(cleanJson(parsedJsonString));

        // Step 2: Transform the parsed data for the target role
        const transformedJsonString = await transformResumeForRole(JSON.stringify(parsedData), targetRole, jobDescription);
        const transformedData = JSON.parse(cleanJson(transformedJsonString));

        const newResume: Resume = {
            id: `trans-${Date.now()}`,
            name: `${targetRole} Resume`,
            personalInfo: transformedData.personalInfo || {},
            education: transformedData.education || [],
            experience: transformedData.experience || [],
            projects: transformedData.projects || [],
            skills: transformedData.skills || [],
            certifications: transformedData.certifications || [],
            achievements: transformedData.achievements || []
        };

        onGenerate(newResume);
    } catch (err) {
        console.error(err);
        setError('Failed to transform resume. Ensure the text is readable and try again.');
    } finally {
        setIsGenerating(false);
    }
  };

  const levels = ['Internship', 'Entry Level', 'Junior', 'Mid-Level', 'Senior'];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl p-5 md:p-8">
        
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">AI Resume Generator</h1>
            <p className="text-slate-500 text-sm">Create a new resume or adapt an existing one.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
            <button 
                onClick={() => setActiveTab('scratch')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'scratch' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Sparkles size={16} /> From Scratch
            </button>
            <button 
                onClick={() => setActiveTab('transform')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'transform' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <RefreshCw size={16} /> Adapt Existing
            </button>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        {activeTab === 'scratch' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Job Role</label>
                <div className="relative">
                <Briefcase className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    placeholder="e.g. Frontend Developer, Marketing Manager"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Experience Level</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {levels.map((l) => (
                    <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`text-sm py-2 px-3 rounded-lg border transition-all ${level === l ? 'bg-purple-100 border-purple-500 text-purple-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                    {l}
                    </button>
                ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Job Description (Optional)</label>
                <textarea
                    className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    placeholder="Paste the job description or requirements here to tailor the resume..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    maxLength={3000}
                />
                <div className="text-right text-xs text-slate-400 mt-1">
                    {jobDescription.length} / 3000
                </div>
            </div>

            <div className="pt-4">
                <Button 
                onClick={handleGenerateFromScratch} 
                isLoading={isGenerating} 
                disabled={!role.trim()} 
                className="w-full !bg-purple-600 hover:!bg-purple-700"
                size="lg"
                icon={<Sparkles size={18} />}
                >
                Generate Draft Resume
                </Button>
                <p className="text-center text-xs text-slate-400 mt-4">
                This process usually takes 5-10 seconds.
                </p>
            </div>

            </div>
        ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Paste Existing Resume</label>
                    <textarea
                        className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                        placeholder="Paste your current resume content here..."
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        maxLength={3000}
                    />
                    <div className="text-right text-xs text-slate-400 mt-1">
                        {resumeText.length} / 3000
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Convert to Job Role</label>
                    <div className="relative">
                    <Briefcase className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        placeholder="e.g. DevOps Engineer, Product Owner"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                    />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Job Description (Optional)</label>
                    <textarea
                        className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                        placeholder="Paste the job description or requirements here to tailor the resume..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        maxLength={3000}
                    />
                    <div className="text-right text-xs text-slate-400 mt-1">
                        {jobDescription.length} / 3000
                    </div>
                </div>

                <div className="pt-2">
                    <Button 
                    onClick={handleTransformExisting} 
                    isLoading={isGenerating} 
                    disabled={!resumeText.trim() || !targetRole.trim()} 
                    className="w-full !bg-indigo-600 hover:!bg-indigo-700"
                    size="lg"
                    icon={<RefreshCw size={18} />}
                    >
                    Transform Resume
                    </Button>
                    <p className="text-center text-xs text-slate-400 mt-4">
                    AI will rewrite your experience to match the new role.
                    </p>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default RoleGenerator;
