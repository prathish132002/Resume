import React, { useState } from 'react';
import { Resume, TemplateType, Experience } from '../types';
import { TEMPLATES } from '../constants';
import ResumePreview from './ResumePreview';
import { Button } from './ui/Button';
import { Plus, Trash2, Wand2, ChevronDown, ChevronUp, Download, ArrowLeft, Save, X, Printer, Layout, Lightbulb, PlusCircle, History, Loader2, Scissors, FileText } from 'lucide-react';
import { generateSummary, improveDescription, getSkillSuggestions, fitResumeToOnePage, analyzeResumeFormATS, improveResumeWithAI } from '../services/geminiService';
import { firebaseService } from '../services/firebaseService';
import { storageService } from '../services/storageService';
import HistoryModal from './HistoryModal';

interface EditorProps {
  emailVerified: boolean;
  resume: Resume;
  setResume: React.Dispatch<React.SetStateAction<Resume>>;
  onBack: () => void;
}

const Editor: React.FC<EditorProps> = ({ emailVerified, resume, setResume, onBack }) => {
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>(TemplateType.ATS_CLASSIC);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.8);
  const [isSaving, setIsSaving] = useState(false);
  const [isFitting, setIsFitting] = useState(false);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [atsMatchedKeywords, setAtsMatchedKeywords] = useState<string[]>([]);
  const [atsMissingKeywords, setAtsMissingKeywords] = useState<string[]>([]);
  const [atsWeakSections, setAtsWeakSections] = useState<string[]>([]);
  const [atsSuggestion, setAtsSuggestion] = useState<string>('');
  const [isCheckingATS, setIsCheckingATS] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isImprovingWithAI, setIsImprovingWithAI] = useState(false);
  const [atsScoreChecked, setAtsScoreChecked] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  
  // Improved Resume State
  const [improvedResume, setImprovedResume] = useState<Resume | null>(null);
  const [improvedAtsScore, setImprovedAtsScore] = useState<number | null>(null);
  
  // Skill Suggestion State
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false);

  // Hash state to track changes
  const getResumeHash = (r: Resume) => {
    const { atsResult, ...rest } = r;
    return JSON.stringify(rest);
  };
  const [lastAtsCheckedHash, setLastAtsCheckedHash] = useState<string>('');
  const [lastAiImprovedHash, setLastAiImprovedHash] = useState<string>('');

  // Form Section State management (Collapsed/Expanded)
  const [expandedSection, setExpandedSection] = useState<string | null>('personal');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Handlers for Personal Info
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setResume(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [name]: value }
    }));
  };

  const handleFitToOnePage = async () => {
    setIsFitting(true);
    try {
      const jsonString = await fitResumeToOnePage(JSON.stringify(resume));
      const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      const fittedResume = JSON.parse(cleanJson);
      
      setResume(prev => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, summary: fittedResume.personalInfo.summary },
        experience: fittedResume.experience.map((e: Experience, idx: number) => ({
             ...e, 
             id: prev.experience[idx]?.id || Math.random().toString(36).substr(2, 9) 
        })),
        projects: fittedResume.projects.map((p: any, idx: number) => ({
             ...p,
             id: prev.projects[idx]?.id || Math.random().toString(36).substr(2, 9)
        }))
      }));
    } catch (e) {
      alert("Failed to fit resume to one page. Please try again.");
    }
    setIsFitting(false);
  };

  const handleSaveResume = async () => {
    setIsSaving(true);
    try {
      await firebaseService.saveResume(resume);
      alert('Resume saved to your account!');
    } catch (error) {
      console.error('Failed to save resume:', error);
      alert('Failed to save resume.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleGetSkillSuggestions = async () => {
    setIsSuggestingSkills(true);
    const jobTitle = resume.personalInfo.location; 
    const suggestions = await getSkillSuggestions(jobTitle, resume.skills);
    // Filter out skills already present (case-insensitive check)
    const existingLower = resume.skills.map(rs => rs.toLowerCase());
    const newSuggestions = suggestions.filter(s => !existingLower.includes(s.toLowerCase()));
    
    setSuggestedSkills(newSuggestions);
    setIsSuggestingSkills(false);
  };

  const addSuggestedSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    // Case-insensitive check for existing skills
    const existingSkills = resume.skills.map(s => s.trim().toLowerCase());
    
    if (trimmedSkill && !existingSkills.includes(trimmedSkill.toLowerCase())) {
       setResume(prev => {
           // Filter out any empty strings and add the new skill
           const currentSkills = prev.skills.filter(s => s.trim() !== "");
           return {
               ...prev,
               skills: [...currentSkills, trimmedSkill]
           };
       });
       // Remove from suggestions once added
       setSuggestedSkills(prev => prev.filter(s => s.trim().toLowerCase() !== trimmedSkill.toLowerCase()));
    }
  };

  // Generic List Handlers (Education, Experience, Projects)
  const addItem = (section: 'education' | 'experience' | 'projects') => {
    const newId = Math.random().toString(36).substr(2, 9);
    setResume(prev => {
      const newItem = section === 'education' 
        ? { id: newId, institution: '', degree: '', startDate: '', endDate: '' }
        : section === 'experience'
        ? { id: newId, company: '', role: '', startDate: '', endDate: '', description: '' }
        : { id: newId, name: '', technologies: '', description: '' };
      return { ...prev, [section]: [...prev[section], newItem] };
    });
  };

  const removeItem = (section: 'education' | 'experience' | 'projects', id: string) => {
    setResume(prev => ({
      ...prev,
      [section]: (prev[section] as any[]).filter((item: any) => item.id !== id)
    }));
  };

  const updateItem = (section: 'education' | 'experience' | 'projects', id: string, field: string, value: string) => {
    setResume(prev => ({
      ...prev,
      [section]: (prev[section] as any[]).map((item: any) => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // List Handlers (Skills, Certs, Achievements)
  const handleListChange = (e: React.ChangeEvent<HTMLTextAreaElement>, field: 'skills' | 'certifications' | 'achievements') => {
    const separator = field === 'skills' ? ',' : '\n';
    // RAW SPLIT: We do not trim or filter here. This allows the user to type "Skill 1, " 
    // without the space or comma being eaten by the state update logic.
    const itemsArray = e.target.value.split(separator);
    setResume(prev => ({ ...prev, [field]: itemsArray }));
  };

  const getListDisplayValue = (field: 'skills' | 'certifications' | 'achievements') => {
    // We join with the EXACT separator used to split (no extra spaces) to ensure
    // what the user types is preserved in the textarea (e.g., if they type a space, they see a space).
    const separator = field === 'skills' ? ',' : '\n';
    return (resume[field] || []).join(separator);
  }

  const handlePrint = () => {
    setShowExportModal(false);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const resumeToText = (resume: Resume): string => {
    return `
      Name: ${resume.personalInfo.fullName}
      Title: ${resume.personalInfo.location}
      Skills: ${resume.skills.join(', ')}
      Experience: ${resume.experience.map(e => `${e.company} - ${e.role}: ${e.description}`).join('\n')}
      Projects: ${resume.projects.map(p => `${p.name}: ${p.description}`).join('\n')}
      Education: ${resume.education.map(e => `${e.institution} - ${e.degree}`).join('\n')}
      Certifications: ${resume.certifications.join(', ')}
    `;
  };

  // Initialize ATS state from resume if it exists
  React.useEffect(() => {
    if (resume.atsResult) {
      setAtsScore(resume.atsResult.score);
      setAtsMatchedKeywords(resume.atsResult.matchedKeywords);
      setAtsMissingKeywords(resume.atsResult.missingKeywords);
      setAtsWeakSections(resume.atsResult.weakSections);
      setAtsSuggestion(resume.atsResult.suggestion);
      setAtsScoreChecked(true);
      setShowResults(true);
      
      // Initialize hashes so buttons are disabled until changes are made
      const initialHash = getResumeHash(resume);
      setLastAtsCheckedHash(initialHash);
      setLastAiImprovedHash(initialHash);
    } else {
      setAtsScore(null);
      setAtsMatchedKeywords([]);
      setAtsMissingKeywords([]);
      setAtsWeakSections([]);
      setAtsSuggestion('');
      setAtsScoreChecked(false);
      setShowResults(false);
    }
  }, [resume.id]);

  const handleCheckATSScore = async () => {
    setIsCheckingATS(true);
    try {
      const resumeText = resumeToText(resume);
      const result = await analyzeResumeFormATS(resumeText);
      
      const atsResult = {
        score: result.score,
        matchedKeywords: result.matched_keywords,
        missingKeywords: result.missing_keywords,
        weakSections: result.weak_sections,
        suggestion: result.suggestion,
        timestamp: Date.now()
      };

      const updatedResume = { ...resume, atsResult };
      setResume(updatedResume);
      await firebaseService.saveResume(updatedResume);
      
      setAtsScore(result.score);
      setAtsMatchedKeywords(result.matched_keywords);
      setAtsMissingKeywords(result.missing_keywords);
      setAtsWeakSections(result.weak_sections);
      setAtsSuggestion(result.suggestion);
      setAtsScoreChecked(true);
      setShowResults(true);
      setLastAtsCheckedHash(getResumeHash(updatedResume));
    } catch (e) {
      alert("Failed to check ATS score. Please try again.");
    } finally {
      setIsCheckingATS(false);
    }
  };

  const handleImproveWithAI = async () => {
    setIsImprovingWithAI(true);
    try {
      const resumeText = resumeToText(resume);
      console.log("Starting AI improvement and ATS analysis...");
      const result = await improveResumeWithAI(resumeText);
      console.log("AI improvement complete.");
      
      const improvedData = result.improvedResume;
      const atsData = result.atsAnalysis;

      if (!improvedData || !atsData) {
        throw new Error("Invalid response format from AI");
      }
      
      const atsResult = {
        score: atsData.score,
        matchedKeywords: atsData.matched_keywords,
        missingKeywords: atsData.missing_keywords,
        weakSections: atsData.weak_sections,
        suggestion: atsData.suggestion,
        timestamp: Date.now()
      };

      const newResume: Resume = {
        ...resume,
        personalInfo: {
          ...resume.personalInfo,
          fullName: improvedData.name || resume.personalInfo.fullName,
          location: improvedData.title || resume.personalInfo.location,
          summary: improvedData.summary || resume.personalInfo.summary,
        },
        skills: improvedData.skills || resume.skills,
        experience: improvedData.experience ? improvedData.experience.map((e: any, i: number) => ({
          ...resume.experience[i],
          ...e,
          id: resume.experience[i]?.id || Math.random().toString(36).substr(2, 9)
        })) : resume.experience,
        projects: improvedData.projects ? improvedData.projects.map((p: any, i: number) => ({
          ...resume.projects[i],
          ...p,
          id: resume.projects[i]?.id || Math.random().toString(36).substr(2, 9)
        })) : resume.projects,
        education: improvedData.education ? improvedData.education.map((e: any, i: number) => ({
          ...resume.education[i],
          ...e,
          id: resume.education[i]?.id || Math.random().toString(36).substr(2, 9)
        })) : resume.education,
        certifications: improvedData.certifications || resume.certifications,
        atsResult: atsResult
      };

      setImprovedResume(newResume);
      
      // Update ATS UI state
      setImprovedAtsScore(atsResult.score);
      
      setViewMode('preview');
    } catch (e) {
      console.error("Error in handleImproveWithAI:", e);
      alert("Failed to improve resume with AI. Please try again.");
    } finally {
      setIsImprovingWithAI(false);
    }
  };

  const handleAcceptImproved = () => {
    if (improvedResume) {
      setResume(improvedResume);
      setAtsScore(improvedAtsScore);
      setImprovedResume(null);
      setImprovedAtsScore(null);
      
      const newHash = getResumeHash(improvedResume);
      setLastAtsCheckedHash(newHash);
      setLastAiImprovedHash(newHash);
    }
  };

  // Update resume name/title
  const handleNameChange = (newName: string) => {
      setResume(prev => ({ ...prev, name: newName }));
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 overflow-hidden">
      
      {/* Mobile View Toggle */}
      <div className="lg:hidden flex border-b border-slate-200 bg-white p-1 sticky top-0 z-40 shadow-sm">
        <button 
          onClick={() => setViewMode('edit')}
          className={`flex-1 py-2.5 text-sm font-bold transition-all rounded-md flex items-center justify-center gap-2 ${viewMode === 'edit' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <FileText size={16} />
          Edit Details
        </button>
        <button 
          onClick={() => setViewMode('preview')}
          className={`flex-1 py-2.5 text-sm font-bold transition-all rounded-md flex items-center justify-center gap-2 ${viewMode === 'preview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Layout size={16} />
          Preview Resume
        </button>
      </div>

      {/* Sidebar - Form Editor */}
      <div className={`${viewMode === 'edit' ? 'flex' : 'hidden'} lg:flex lg:w-1/2 flex-col h-full border-r border-slate-200 bg-white shadow-xl z-10 overflow-hidden`}>
        
        {/* Top Bar */}
        <div className="p-3 md:p-4 border-b border-slate-200 bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 md:gap-3">
                    <button onClick={onBack} className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft size={18} md:size={20} />
                    </button>
                    <input 
                        value={resume.name} 
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="font-bold text-base md:text-lg text-slate-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded px-2 -ml-2 outline-none transition-all w-full md:w-64 truncate"
                        placeholder="Resume Name"
                    />
                </div>
                <div className="flex gap-2 justify-between md:justify-end">
                    <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={<History size={14}/>} 
                    onClick={() => setShowHistoryModal(true)}
                    title="Version History"
                    className="flex-1 md:flex-none"
                    >
                    History
                    </Button>
                    <Button 
                    variant="outline" 
                    size="sm" 
                    icon={<Save size={14}/>} 
                    onClick={handleSaveResume}
                    isLoading={isSaving}
                    className="flex-1 md:flex-none"
                    >
                    Save
                    </Button>
                    <Button variant="primary" size="sm" icon={<Download size={14}/>} onClick={() => setShowExportModal(true)} className="flex-1 md:flex-none">
                    Export
                    </Button>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                variant="secondary" 
                size="sm" 
                icon={<Scissors size={14}/>} 
                onClick={handleFitToOnePage}
                className="w-full text-center justify-center text-xs"
                disabled={!emailVerified || isFitting}
                isLoading={isFitting}
                title={!emailVerified ? "Verify email to use AI features" : "Intelligently trim content to fit on one page"}
                >
                Fit to 1 Page
                </Button>
            </div>
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          
          {/* Personal Info */}
          <div className="border rounded-lg p-4 bg-slate-50">
             <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('personal')}>
                <h3 className="font-bold text-slate-700">Personal Details</h3>
                {expandedSection === 'personal' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
             </div>
             
             {expandedSection === 'personal' && (
               <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input className="border p-2 rounded" placeholder="Full Name" name="fullName" value={resume.personalInfo.fullName || ''} onChange={handlePersonalInfoChange} />
                 <input className="border p-2 rounded" placeholder="Job Title (e.g. Software Engineer)" name="location" value={resume.personalInfo.location || ''} onChange={handlePersonalInfoChange} />
                 <input className="border p-2 rounded" placeholder="Email" name="email" value={resume.personalInfo.email || ''} onChange={handlePersonalInfoChange} />
                 <input className="border p-2 rounded" placeholder="Phone" name="phone" value={resume.personalInfo.phone || ''} onChange={handlePersonalInfoChange} />
                 <input className="border p-2 rounded" placeholder="LinkedIn URL" name="linkedin" value={resume.personalInfo.linkedin || ''} onChange={handlePersonalInfoChange} />
                 <input className="border p-2 rounded" placeholder="Portfolio URL" name="portfolio" value={resume.personalInfo.portfolio || ''} onChange={handlePersonalInfoChange} />
                 <input className="border p-2 rounded" placeholder="GitHub URL" name="githubUrl" value={resume.personalInfo.githubUrl || ''} onChange={handlePersonalInfoChange} />
                  <div className="col-span-full">
                    <div className="flex justify-between mb-1">
                      <label className="text-sm text-slate-600">Professional Summary</label>
                    </div>
                    <textarea 
                      className="w-full border p-2 rounded h-24 text-sm" 
                      placeholder="Brief overview of your career..." 
                      name="summary" 
                      value={resume.personalInfo.summary} 
                      onChange={handlePersonalInfoChange} 
                      maxLength={1000}
                    />
                    <div className="text-right text-[10px] text-slate-400">
                      {resume.personalInfo.summary.length} / 1000
                    </div>
                 </div>
               </div>
             )}
          </div>

          {/* Experience */}
          <div className="border rounded-lg p-4 bg-slate-50">
             <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('experience')}>
                <h3 className="font-bold text-slate-700">Experience</h3>
                {expandedSection === 'experience' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
             </div>
             
             {expandedSection === 'experience' && (
               <div className="mt-4 space-y-4">
                 {resume.experience.map((exp, index) => (
                   <div key={exp.id} className="p-3 bg-white border rounded shadow-sm relative group">
                      <button onClick={() => removeItem('experience', exp.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input className="border p-1.5 rounded text-sm" placeholder="Company" value={exp.company} onChange={(e) => updateItem('experience', exp.id, 'company', e.target.value)} />
                        <input className="border p-1.5 rounded text-sm" placeholder="Role" value={exp.role} onChange={(e) => updateItem('experience', exp.id, 'role', e.target.value)} />
                        <input className="border p-1.5 rounded text-sm" placeholder="Start Date" value={exp.startDate} onChange={(e) => updateItem('experience', exp.id, 'startDate', e.target.value)} />
                        <input className="border p-1.5 rounded text-sm" placeholder="End Date" value={exp.endDate} onChange={(e) => updateItem('experience', exp.id, 'endDate', e.target.value)} />
                      </div>
                      <div className="relative">
                        <textarea 
                          className="w-full border p-2 rounded text-sm h-24" 
                          placeholder="• Achieved X by doing Y..." 
                          value={exp.description} 
                          onChange={(e) => updateItem('experience', exp.id, 'description', e.target.value)} 
                          maxLength={1500}
                        />
                        <div className="text-right text-[10px] text-slate-400 mb-1">
                          {exp.description.length} / 1500
                        </div>
                      </div>
                   </div>
                 ))}
                 <Button variant="outline" size="sm" onClick={() => addItem('experience')} className="w-full">
                   <Plus size={14} className="mr-1"/> Add Position
                 </Button>
               </div>
             )}
          </div>

          {/* Education */}
          <div className="border rounded-lg p-4 bg-slate-50">
             <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('education')}>
                <h3 className="font-bold text-slate-700">Education</h3>
                {expandedSection === 'education' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
             </div>
             
             {expandedSection === 'education' && (
               <div className="mt-4 space-y-4">
                 {resume.education.map((edu) => (
                   <div key={edu.id} className="p-3 bg-white border rounded shadow-sm relative group">
                      <button onClick={() => removeItem('education', edu.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                      <div className="grid grid-cols-1 gap-2">
                        <input className="border p-1.5 rounded text-sm" placeholder="Institution" value={edu.institution} onChange={(e) => updateItem('education', edu.id, 'institution', e.target.value)} />
                        <input className="border p-1.5 rounded text-sm" placeholder="Degree" value={edu.degree} onChange={(e) => updateItem('education', edu.id, 'degree', e.target.value)} />
                        <div className="grid grid-cols-2 gap-2">
                          <input className="border p-1.5 rounded text-sm" placeholder="Start Date" value={edu.startDate} onChange={(e) => updateItem('education', edu.id, 'startDate', e.target.value)} />
                          <input className="border p-1.5 rounded text-sm" placeholder="End Date" value={edu.endDate} onChange={(e) => updateItem('education', edu.id, 'endDate', e.target.value)} />
                        </div>
                        {/* New Grade Input */}
                         <input className="border p-1.5 rounded text-sm" placeholder="Grade/Marks (e.g. 3.8 GPA)" value={edu.gpa || ''} onChange={(e) => updateItem('education', edu.id, 'gpa', e.target.value)} />
                      </div>
                   </div>
                 ))}
                 <Button variant="outline" size="sm" onClick={() => addItem('education')} className="w-full">
                   <Plus size={14} className="mr-1"/> Add Education
                 </Button>
               </div>
             )}
          </div>
          
           {/* Projects */}
           <div className="border rounded-lg p-4 bg-slate-50">
             <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('projects')}>
                <h3 className="font-bold text-slate-700">Projects</h3>
                {expandedSection === 'projects' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
             </div>
             
             {expandedSection === 'projects' && (
               <div className="mt-4 space-y-4">
                 {resume.projects.map((proj) => (
                   <div key={proj.id} className="p-3 bg-white border rounded shadow-sm relative group">
                      <button onClick={() => removeItem('projects', proj.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                      <div className="grid grid-cols-1 gap-2 mb-2">
                        <input className="border p-1.5 rounded text-sm" placeholder="Project Name" value={proj.name} onChange={(e) => updateItem('projects', proj.id, 'name', e.target.value)} />
                        <input className="border p-1.5 rounded text-sm" placeholder="Tech Stack (e.g. React, Node)" value={proj.technologies} onChange={(e) => updateItem('projects', proj.id, 'technologies', e.target.value)} />
                        <input className="border p-1.5 rounded text-sm" placeholder="Link (Optional)" value={proj.link} onChange={(e) => updateItem('projects', proj.id, 'link', e.target.value)} />
                        <div className="relative">
                          <textarea 
                            className="w-full border p-2 rounded text-sm h-24" 
                            placeholder="Brief description..." 
                            value={proj.description} 
                            onChange={(e) => updateItem('projects', proj.id, 'description', e.target.value)} 
                            maxLength={1500}
                          />
                          <div className="text-right text-[10px] text-slate-400 mb-1">
                            {proj.description.length} / 1500
                          </div>
                        </div>
                      </div>
                   </div>
                 ))}
                 <Button variant="outline" size="sm" onClick={() => addItem('projects')} className="w-full">
                   <Plus size={14} className="mr-1"/> Add Project
                 </Button>
               </div>
             )}
          </div>

           {/* Skills */}
           <div className="border rounded-lg p-4 bg-slate-50">
             <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('skills')}>
                <h3 className="font-bold text-slate-700">Skills</h3>
                {expandedSection === 'skills' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
             </div>
             
             {expandedSection === 'skills' && (
               <div className="mt-4">
                 <div className="flex justify-between items-end mb-2">
                    <p className="text-xs text-slate-500">Comma separated list</p>
                    <button 
                        onClick={handleGetSkillSuggestions} 
                        disabled={isSuggestingSkills || !emailVerified}
                        className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors disabled:opacity-50"
                        title={!emailVerified ? "Verify email to use AI features" : ""}
                    >
                        {isSuggestingSkills ? (
                            <span className="animate-pulse">Generating...</span>
                        ) : (
                            <>
                                <Lightbulb size={12} /> Suggest based on Role
                            </>
                        )}
                    </button>
                 </div>
                 
                 <textarea 
                  className="w-full border p-2 rounded mb-2" 
                  value={getListDisplayValue('skills')} 
                  onChange={(e) => handleListChange(e, 'skills')}
                  placeholder="Java, Python, Leadership, Communication..."
                  maxLength={1000}
                />
                <div className="text-right text-[10px] text-slate-400 mt-1 mb-2">
                  {getListDisplayValue('skills').length} / 1000
                </div>

                 {/* Suggested Skills Chips */}
                 {suggestedSkills.length > 0 && (
                     <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                         <p className="text-xs font-semibold text-purple-800 mb-2 flex items-center gap-1">
                             <Lightbulb size={10} /> Suggested Skills (Click to add)
                         </p>
                         <div className="flex flex-wrap gap-2">
                             {suggestedSkills.map((skill, idx) => (
                                 <button
                                    key={idx}
                                    onClick={() => addSuggestedSkill(skill)}
                                    className="text-xs bg-white border border-purple-200 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all flex items-center gap-1 group"
                                 >
                                     {skill} <PlusCircle size={10} className="text-purple-400 group-hover:text-purple-100"/>
                                 </button>
                             ))}
                         </div>
                     </div>
                 )}
               </div>
             )}
          </div>

           {/* Certifications */}
           <div className="border rounded-lg p-4 bg-slate-50">
             <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('certifications')}>
                <h3 className="font-bold text-slate-700">Certifications</h3>
                {expandedSection === 'certifications' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
             </div>
             
             {expandedSection === 'certifications' && (
               <div className="mt-4">
                 <p className="text-xs text-slate-500 mb-2">One per line</p>
                 <textarea 
                  className="w-full border p-2 rounded h-24" 
                  value={getListDisplayValue('certifications')} 
                  onChange={(e) => handleListChange(e, 'certifications')}
                  placeholder="AWS Certified Solution Architect&#10;Google Project Management"
                  maxLength={1000}
                />
                <div className="text-right text-[10px] text-slate-400 mt-1">
                  {getListDisplayValue('certifications').length} / 1000
                </div>
               </div>
             )}
          </div>

           {/* Achievements */}
           <div className="border rounded-lg p-4 bg-slate-50 mb-10">
             <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('achievements')}>
                <h3 className="font-bold text-slate-700">Achievements</h3>
                {expandedSection === 'achievements' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
             </div>
             
             {expandedSection === 'achievements' && (
               <div className="mt-4">
                 <p className="text-xs text-slate-500 mb-2">One per line</p>
                 <textarea 
                  className="w-full border p-2 rounded h-24" 
                  value={getListDisplayValue('achievements')} 
                  onChange={(e) => handleListChange(e, 'achievements')}
                  placeholder="Employee of the month - June 2023&#10;1st Place in Hackathon"
                  maxLength={1000}
                />
                <div className="text-right text-[10px] text-slate-400 mt-1">
                  {getListDisplayValue('achievements').length} / 1000
                </div>
               </div>
             )}
          </div>

           {/* ATS and AI Actions */}
           <div className="border rounded-lg p-4 bg-slate-50 mb-10">
             <div className="flex gap-3 mb-4">
               <Button 
                 variant="primary" 
                 size="sm" 
                 onClick={handleCheckATSScore}
                 isLoading={isCheckingATS}
                 disabled={!!improvedResume || getResumeHash(resume) === lastAtsCheckedHash}
                 className="flex-1"
               >
                 Check ATS Score
               </Button>
               <Button 
                 variant="secondary" 
                 size="sm" 
                 onClick={handleImproveWithAI}
                 isLoading={isImprovingWithAI}
                 disabled={!atsScoreChecked || !!improvedResume || getResumeHash(resume) === lastAiImprovedHash}
                 className="flex-1"
               >
                 Improve with AI
               </Button>
             </div>
             
             {showResults && (
               <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mt-4">
                 <div className="flex items-center gap-4 mb-4">
                   <div className={`text-4xl font-bold ${
                     (atsScore || 0) <= 50 ? 'text-red-500' : 
                     (atsScore || 0) <= 74 ? 'text-orange-500' : 
                     'text-green-500'
                   }`}>
                     {atsScore}
                   </div>
                   <div className="text-sm text-slate-500">/ 100 ATS Score</div>
                 </div>
                 
                 {atsMatchedKeywords.length > 0 && (
                   <div className="mb-4">
                     <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Matched Keywords</h5>
                     <div className="flex flex-wrap gap-2">
                       {atsMatchedKeywords.map((kw, i) => (
                         <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{kw}</span>
                       ))}
                     </div>
                   </div>
                 )}

                 {atsMissingKeywords.length > 0 && (
                   <div className="mb-4">
                     <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Missing Keywords</h5>
                     <div className="flex flex-wrap gap-2">
                       {atsMissingKeywords.map((kw, i) => (
                         <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">{kw}</span>
                       ))}
                     </div>
                   </div>
                 )}

                 {atsWeakSections.length > 0 && (
                   <div className="mb-4">
                     <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Weak Sections</h5>
                     <ul className="list-disc list-inside text-sm text-slate-600">
                       {atsWeakSections.map((section, i) => (
                         <li key={i}>{section}</li>
                       ))}
                     </ul>
                   </div>
                 )}

                 {atsSuggestion && (
                   <div className="mt-4 pt-4 border-t border-slate-100">
                     <p className="text-sm text-slate-700 italic">"{atsSuggestion}"</p>
                   </div>
                 )}

                 {improvedResume && improvedAtsScore !== null && (
                   <div className="mt-6 pt-4 border-t border-slate-200">
                     <h4 className="font-bold text-slate-800 mb-2">AI Improvement Results</h4>
                     <div className="flex items-center gap-3 mb-4">
                       <span className="text-slate-500 font-medium">Before: {atsScore}/100</span>
                       <span className="text-slate-400">→</span>
                       <span className="text-green-600 font-bold">After: {improvedAtsScore}/100 ✅</span>
                     </div>
                     <div className="flex gap-3">
                       <Button 
                         variant="primary" 
                         size="sm" 
                         onClick={handleAcceptImproved}
                         className="flex-1"
                       >
                         Accept Changes
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         onClick={handleImproveWithAI}
                         isLoading={isImprovingWithAI}
                         className="flex-1"
                       >
                         Re-improve
                       </Button>
                     </div>
                   </div>
                 )}
               </div>
             )}
           </div>

        </div>
      </div>

      {/* Preview Area */}
      <div className={`${viewMode === 'preview' ? 'flex' : 'hidden'} lg:flex lg:w-1/2 bg-slate-500 h-full flex-col overflow-hidden`}>
        {/* Toolbar */}
        <div className="bg-slate-800 text-white p-2 md:p-3 flex flex-col sm:flex-row justify-between items-center gap-2 shadow-md z-20">
           <div className="flex gap-1 md:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
             {TEMPLATES.map(t => (
               <button 
                key={t.id}
                onClick={() => setActiveTemplate(t.id as TemplateType)}
                className={`text-[10px] md:text-xs px-2 md:px-3 py-1 rounded transition-colors whitespace-nowrap ${activeTemplate === t.id ? 'bg-blue-500 text-white font-bold' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
               >
                 {t.name}
               </button>
             ))}
           </div>
           <div className="flex items-center gap-2 text-[10px] md:text-xs ml-auto sm:ml-0">
              <span className="text-slate-400">Zoom</span>
              <button onClick={() => setPreviewScale(Math.max(0.4, previewScale - 0.1))} className="px-2 py-1 bg-slate-700 rounded">-</button>
              <span className="w-8 text-center">{Math.round(previewScale * 100)}%</span>
              <button onClick={() => setPreviewScale(Math.min(1.5, previewScale + 0.1))} className="px-2 py-1 bg-slate-700 rounded">+</button>
           </div>
        </div>

        {/* Live Preview Canvas */}
        <div className="flex-1 overflow-auto flex justify-center p-4 md:p-8 bg-slate-500 print:bg-white print:p-0 relative">
          <div className="print:w-full">
             <ResumePreview resume={improvedResume || resume} template={activeTemplate} scale={previewScale} />
          </div>
          
          {/* Floating Action Bar for Improved Resume */}
          {improvedResume && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-2xl border border-slate-200 p-2 flex items-center gap-4 z-30">
              <div className="px-4 text-sm font-bold text-slate-700 hidden sm:block">
                AI Improved Resume (Score: {improvedAtsScore})
              </div>
              <Button size="sm" variant="primary" onClick={handleAcceptImproved}>
                Accept Changes
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setImprovedResume(null); setImprovedAtsScore(null); setViewMode('edit'); }}>
                Discard
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* AI Tailor Modal */}
      {/* Removed Tailor Modal */}

      {/* History Modal */}
      {showHistoryModal && (
        <HistoryModal 
            resumeId={resume.id} 
            onRestore={(v) => { setResume(v); setShowHistoryModal(false); }}
            onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Printer className="text-slate-700" size={24} />
                    <h3 className="text-xl font-bold text-slate-800">Export PDF Options</h3>
                </div>
                <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} /> 
                </button>
            </div>
            
            <div className="mb-4">
                <h4 className="font-semibold text-slate-700 mb-3 text-sm flex items-center gap-2">
                    <Layout size={16}/> Select Template
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {TEMPLATES.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTemplate(t.id as TemplateType)}
                            className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                                activeTemplate === t.id 
                                ? 'border-blue-600 bg-blue-50' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className={`w-full h-20 mb-2 rounded ${t.color} opacity-80 shadow-sm`}></div>
                            <span className={`text-sm font-medium ${activeTemplate === t.id ? 'text-blue-700' : 'text-slate-600'}`}>
                                {t.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">
                    <strong>Tip:</strong> For best ATS compatibility, we recommend the <strong>ATS Standard</strong> or <strong>Modern Clean</strong> templates. 
                    Ensure "Background graphics" is enabled in your print settings if using Modern/Executive templates.
                </p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setShowExportModal(false)}>Cancel</Button>
              <Button onClick={handlePrint} icon={<Download size={18} />}>
                Print / Save as PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;