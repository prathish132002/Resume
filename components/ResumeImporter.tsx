import React, { useState } from 'react';
import { Button } from './ui/Button';
import { ArrowLeft, Upload, AlertCircle, Wand2, CheckCircle, ArrowRight } from 'lucide-react';
import { parseResumeContent, transformResumeForRole } from '../services/geminiService';
import { Resume } from '../types';

interface ResumeImporterProps {
  onImport: (resume: Resume) => void;
  onBack: () => void;
}

const ResumeImporter: React.FC<ResumeImporterProps> = ({ onImport, onBack }) => {
  const [step, setStep] = useState<'input' | 'configure'>('input');
  const [text, setText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [parsedResume, setParsedResume] = useState<Resume | null>(null);

  // Step 1: Parse the text into a Resume object
  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please paste your resume content first.');
      return;
    }
    setError('');
    setIsProcessing(true);

    try {
      const jsonString = await parseResumeContent(text);
      const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      
      const newResume: Resume = {
        id: 'imported-resume',
        name: 'Imported Resume',
        personalInfo: parsedData.personalInfo || {},
        education: parsedData.education || [],
        experience: parsedData.experience || [],
        projects: parsedData.projects || [],
        skills: parsedData.skills || [],
        certifications: parsedData.certifications || [],
        achievements: parsedData.achievements || []
      };

      setParsedResume(newResume);
      setStep('configure');
    } catch (err) {
      console.error(err);
      setError('Failed to analyze resume. Please ensure the text is readable and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Optimize for role or skip
  const handleFinalImport = async (optimize: boolean) => {
    if (!parsedResume) return;

    if (optimize && targetRole.trim()) {
      setIsProcessing(true);
      try {
        const jsonString = await transformResumeForRole(JSON.stringify(parsedResume), targetRole);
        const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        const optimizedData = JSON.parse(cleanJson);
        
        // Merge optimized data with IDs from parsed resume to keep structure stability if needed
        // But the AI returns a full object, so we can use it.
        // We ensure the ID is preserved.
        const finalResume: Resume = {
          ...optimizedData,
          id: 'optimized-resume',
          name: `${targetRole} Resume`,
          // Ensure arrays exist even if AI returns null for them
          education: optimizedData.education || [],
          experience: optimizedData.experience || [],
          projects: optimizedData.projects || [],
          skills: optimizedData.skills || [],
          certifications: optimizedData.certifications || [],
          achievements: optimizedData.achievements || []
        };

        onImport(finalResume);
      } catch (err) {
        console.error(err);
        alert('Failed to optimize resume. Importing original version instead.');
        onImport(parsedResume);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Just import parsed resume
      onImport(parsedResume);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-8">
        
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {step === 'input' ? 'Import Existing Resume' : 'Resume Transformation'}
            </h1>
            <p className="text-slate-500 text-sm">
              {step === 'input' 
                ? 'Paste your resume text below. Gemini AI will format it for the builder.' 
                : 'We extracted your details. Now, let\'s tailor it for your next role.'}
            </p>
          </div>
        </div>

        {step === 'input' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <textarea
                className="w-full h-64 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700 placeholder:text-slate-400"
                placeholder="Paste your full resume content here (text from PDF or Word)..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              {error && (
                <div className="mt-2 text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500 max-w-xs">
                <p><strong>Note:</strong> We analyze text only. Images or complex tables might not import perfectly.</p>
              </div>
              <Button 
                onClick={handleAnalyze} 
                isLoading={isProcessing} 
                disabled={!text.trim()} 
                icon={<Upload size={18} />}
                size="lg"
              >
                Analyze Content
              </Button>
            </div>
          </div>
        )}

        {step === 'configure' && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <h3 className="font-bold text-green-800">Resume Analyzed Successfully</h3>
                <p className="text-sm text-green-700">We identified your sections. Do you want to optimize it for a specific job?</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Job Role (Optional)</label>
              <input
                type="text"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="e.g. Senior Product Manager, DevOps Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-2">
                If provided, AI will rewrite your summary and experience to highlight skills relevant to this role.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={() => handleFinalImport(true)} 
                isLoading={isProcessing} 
                disabled={!targetRole.trim()} 
                variant="primary"
                className="w-full !bg-purple-600 hover:!bg-purple-700 py-4"
                icon={<Wand2 size={18} />}
              >
                Optimize & Import Resume
              </Button>
              
              <Button 
                onClick={() => handleFinalImport(false)} 
                disabled={isProcessing}
                variant="ghost"
                className="w-full"
                icon={<ArrowRight size={16} />}
              >
                Skip & Import Original
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ResumeImporter;