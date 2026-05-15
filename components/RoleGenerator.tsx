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
  const [showInfo, setShowInfo] = useState(false);
  const [showTransformInfo, setShowTransformInfo] = useState(false);

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
            <div className="flex-1 relative flex items-center">
              <button 
                  onClick={() => setActiveTab('scratch')}
                  className={`w-full py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'scratch' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <Sparkles size={16} /> From Scratch
              </button>
              
              {/* Info Icon with Tooltip & Popover */}
              <div className="absolute right-2 group/info">
                <button 
                  className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInfo(!showInfo);
                  }}
                  title="Click for instructions"
                >
                  <AlertCircle size={14} />
                </button>
                
                {/* Hover Tooltip: Hidden on touch devices, wraps on small screens */}
                <div className="absolute bottom-full mb-2 right-0 hidden sm:group-hover/info:block z-50 pointer-events-none">
                   <div className="bg-slate-800 text-white text-[10px] py-2 px-3 rounded-lg shadow-xl w-64 leading-tight">
                      Want to bypass ATS machine? Write content in input fields and get a powerful resume which can bypass ATS machine, then edit the required fields.
                   </div>
                   <div className="w-2 h-2 bg-slate-800 rotate-45 mx-auto -mt-1 mr-2"></div>
                </div>

                {/* Detailed Instructions Popover - Responsive Positioning */}
                {showInfo && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowInfo(false)}></div>
                    <div className="fixed sm:absolute top-24 sm:top-full mt-2 inset-x-4 sm:inset-auto sm:right-0 w-auto sm:w-[400px] max-w-[400px] bg-white border border-slate-200 rounded-xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200 mx-auto">
                      <div className="bg-purple-600 p-4 text-white">
                        <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                          <Sparkles size={18} /> How "From Scratch" Works
                        </h4>
                        <p className="text-[11px] text-purple-100 mt-1">AI-Powered Job-First Resume Generation</p>
                      </div>
                      
                      <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                        <div className="space-y-5">
                          {/* Step 1 */}
                          <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-sm">The Input Phase</h5>
                              <p className="text-xs text-slate-500 mt-1">Provide your target role, experience level, and optional JD.</p>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-sm">AI Generation</h5>
                              <p className="text-xs text-slate-500 mt-1">AI acts as an <b>Expert Writer</b> to generate realistic bullet points and technical skills tailored to the industry standards.</p>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-sm">Data Transformation</h5>
                              <p className="text-xs text-slate-500 mt-1">The AI output is converted into <b>Smart Data</b> with unique IDs, making every section instantly editable.</p>
                            </div>
                          </div>

                          {/* Step 4 */}
                          <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">4</div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-sm">The Smart Draft</h5>
                              <p className="text-xs text-slate-500 mt-1">You get a <b>fully-populated resume</b> with professional ATS phrasing. Just swap placeholders with your actual details!</p>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                             <p className="text-[10px] text-slate-500 italic">
                               "This feature gives you a 90% head start by handling the professional writing and formatting for you."
                             </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border-t border-slate-100">
                        <button 
                          onClick={() => setShowInfo(false)}
                          className="w-full py-2 text-xs font-bold text-purple-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-purple-200"
                        >
                          Got it, let's build!
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 relative flex items-center">
              <button 
                  onClick={() => setActiveTab('transform')}
                  className={`w-full py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'transform' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <RefreshCw size={16} /> Adapt Existing
              </button>

              {/* Info Icon with Tooltip & Popover */}
              <div className="absolute right-2 group/info">
                <button 
                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTransformInfo(!showTransformInfo);
                  }}
                  title="Click for instructions"
                >
                  <AlertCircle size={14} />
                </button>
                
                {/* Hover Tooltip */}
                <div className="absolute bottom-full mb-2 right-0 hidden sm:group-hover/info:block z-50 pointer-events-none">
                   <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap">
                      Learn about resume transformation
                   </div>
                   <div className="w-2 h-2 bg-slate-800 rotate-45 mx-auto -mt-1 mr-2"></div>
                </div>

                {/* Detailed Instructions Popover */}
                {showTransformInfo && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowTransformInfo(false)}></div>
                    <div className="fixed sm:absolute top-24 sm:top-full mt-2 inset-x-4 sm:inset-auto sm:right-0 w-auto sm:w-[400px] max-w-[400px] bg-white border border-slate-200 rounded-xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200 mx-auto">
                      <div className="bg-indigo-600 p-4 text-white">
                        <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                          <RefreshCw size={18} /> How "Adapt Existing" Works
                        </h4>
                        <p className="text-[11px] text-indigo-100 mt-1">Smart AI-Powered Resume Transformation</p>
                      </div>
                      
                      <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                        <div className="space-y-5">
                          {/* Step 1 */}
                          <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-sm">Input Phase</h5>
                              <p className="text-xs text-slate-500 mt-1">Paste your current resume and enter your new **Target Role**.</p>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-sm">AI Skill Mapping</h5>
                              <p className="text-xs text-slate-500 mt-1">AI analyzes your background to find **transferable skills** relevant to the new role.</p>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-sm">Contextual Rewriting</h5>
                              <p className="text-xs text-slate-500 mt-1">AI rewrites your bullet points to highlight the exact keywords and achievements required for the target job.</p>
                            </div>
                          </div>

                          {/* Step 4 */}
                          <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">4</div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-sm">The Transformed Result</h5>
                              <p className="text-xs text-slate-500 mt-1">You get a resume that looks like it was written specifically for the new role, using your actual history.</p>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                             <p className="text-[10px] text-slate-500 italic">
                               "Great for switching career paths or optimizing your resume for a specific job title."
                             </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border-t border-slate-100">
                        <button 
                          onClick={() => setShowTransformInfo(false)}
                          className="w-full py-2 text-xs font-bold text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-indigo-200"
                        >
                          Got it, let's adapt!
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        {activeTab === 'scratch' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            
            <div>
                <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                  Target Job Role
                  <div className="relative group/tooltip inline-block ml-1.5">
                    <div className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-help">
                      <AlertCircle size={14} />
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
                      <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap">
                        What job are you applying for? (e.g., "Frontend Developer")
                      </div>
                      <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 mx-auto -mt-1"></div>
                    </div>
                  </div>
                </label>
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
                <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                  Experience Level
                  <div className="relative group/tooltip inline-block ml-1.5">
                    <div className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-help">
                      <AlertCircle size={14} />
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
                      <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap">
                        How senior are you? (Internship, Junior, Senior, etc.)
                      </div>
                      <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 mx-auto -mt-1"></div>
                    </div>
                  </div>
                </label>
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
                <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                  Job Description (Optional)
                  <div className="relative group/tooltip inline-block ml-1.5">
                    <div className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-help">
                      <AlertCircle size={14} />
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
                      <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap">
                        Specific requirements from a job posting you want to target
                      </div>
                      <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 mx-auto -mt-1"></div>
                    </div>
                  </div>
                </label>
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
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                      Paste Existing Resume
                      <div className="relative group/tooltip inline-block ml-1.5">
                        <div className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-help">
                          <AlertCircle size={14} />
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
                          <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap">
                            Paste your current resume content here as plain text
                          </div>
                          <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 mx-auto -mt-1"></div>
                        </div>
                      </div>
                    </label>
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
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                      Convert to Job Role
                      <div className="relative group/tooltip inline-block ml-1.5">
                        <div className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-help">
                          <AlertCircle size={14} />
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
                          <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap">
                            The role you want the AI to rewrite your resume for
                          </div>
                          <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 mx-auto -mt-1"></div>
                        </div>
                      </div>
                    </label>
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
                    <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                      Job Description (Optional)
                      <div className="relative group/tooltip inline-block ml-1.5">
                        <div className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-help">
                          <AlertCircle size={14} />
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
                          <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap">
                            Specific requirements from a job posting you want to target
                          </div>
                          <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 mx-auto -mt-1"></div>
                        </div>
                      </div>
                    </label>
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
