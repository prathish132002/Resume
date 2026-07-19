import React, { useState, useRef, useEffect } from 'react';
import { Resume, TemplateType, Experience } from '../types';
import { TEMPLATES } from '../constants';
import { findRoleSkills } from '../constants/roleSkills';
import ResumePreview from './ResumePreview';
import { Button } from './ui/Button';
import { Plus, Trash2, Wand2, ChevronDown, ChevronUp, Download, ArrowLeft, Save, X, Layout, Lightbulb, PlusCircle, History, Loader2, Scissors, FileText, GripVertical, ArrowUp, ArrowDown, Palette, Check, AlertTriangle } from 'lucide-react';
import { generateSummary, improveDescription, getSkillSuggestions, analyzeResumeFromATS, improveResumeWithAI } from '../services/geminiService';
import { firebaseService } from '../services/firebaseService';
import { storageService } from '../services/storageService';
import HistoryModal from './HistoryModal';
import { useReactToPrint } from 'react-to-print';
import ResumeSkeleton from './ResumeSkeleton';

interface EditorProps {
  emailVerified: boolean;
  resume: Resume;
  setResume: React.Dispatch<React.SetStateAction<Resume>>;
  onBack: () => void;
}

const ACCENT_COLORS = [
  { name: 'Blue', color: '#2563eb' },
  { name: 'Green', color: '#16a34a' },
  { name: 'Purple', color: '#9333ea' },
  { name: 'Rose', color: '#e11d48' },
  { name: 'Slate', color: '#334155' },
  { name: 'Amber', color: '#d97706' },
];

const Editor: React.FC<EditorProps> = ({ emailVerified, resume, setResume, onBack }) => {
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>(TemplateType.ATS_CLASSIC);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.8);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number | null>(Date.now());
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
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);

  // Styling & Customization state
  const [compactMode, setCompactMode] = useState(false);
  const [accentColor, setAccentColor] = useState('#2563eb');
  
  // Improved Resume State
  const [improvedResume, setImprovedResume] = useState<Resume | null>(null);
  const [improvedAtsScore, setImprovedAtsScore] = useState<number | null>(null);
  
  // Skill Suggestion State
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false);

  // Debounced resume state for 300ms live preview optimization
  const [debouncedResume, setDebouncedResume] = useState<Resume>(resume);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedResume(resume), 300);
    return () => clearTimeout(handler);
  }, [resume]);

  // Drag to reorder state
  const [draggedItem, setDraggedItem] = useState<{ section: 'education' | 'experience' | 'projects'; index: number } | null>(null);

  // Pre-stored role skills auto-populator
  useEffect(() => {
    const jobTitle = resume.personalInfo.location;
    if (jobTitle && jobTitle.trim()) {
      const preStored = findRoleSkills(jobTitle);
      if (preStored && preStored.length > 0) {
        const existingLower = (resume.skills || []).map(s => s.trim().toLowerCase());
        const filtered = preStored.filter(s => !existingLower.includes(s.toLowerCase()));
        if (filtered.length > 0) {
          setSuggestedSkills(filtered);
        }
      }
    }
  }, [resume.personalInfo.location]);

  // Hash state to track changes
  const getResumeHash = (r: Resume) => {
    const { atsResult, ...rest } = r;
    return JSON.stringify(rest);
  };
  const [lastAtsCheckedHash, setLastAtsCheckedHash] = useState<string>('');
  const [lastAiImprovedHash, setLastAiImprovedHash] = useState<string>('');
  const [lastSavedHash, setLastSavedHash] = useState<string>('');

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


  const handleSaveResume = async () => {
    setIsSaving(true);
    try {
      await firebaseService.saveResume(resume);
      setLastSavedHash(getResumeHash(resume));
      alert('Resume saved to your account!');
    } catch (error) {
      console.error('Failed to save resume:', error);
      alert('Failed to save resume.');
    } finally {
      setIsSaving(false);
    }
  };

  // 1-minute Autosave
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      const currentHash = getResumeHash(resume);
      if (currentHash !== lastSavedHash && !isSaving && !isAutosaving) {
        setIsAutosaving(true);
        try {
          await firebaseService.saveResume(resume);
          setLastSavedHash(currentHash);
          setLastSavedTimestamp(Date.now());
        } catch (err) {
          console.error('Autosave error:', err);
        } finally {
          setIsAutosaving(false);
        }
      }
    }, 60000); // 1 minute auto-save

    return () => clearInterval(autoSaveInterval);
  }, [resume, lastSavedHash, isSaving, isAutosaving]);

  // AI Input Validator
  const validateAIInput = (): boolean => {
    const hasName = resume.personalInfo.fullName.trim().length > 0;
    const hasContent = (resume.experience && resume.experience.length > 0) || 
                       (resume.skills && resume.skills.some(s => s.trim().length > 0)) ||
                       (resume.education && resume.education.length > 0);
    if (!hasName && !hasContent) {
      setAiErrorMessage("Please add your name and at least one entry (Experience, Skills, or Education) before using AI.");
      return false;
    }
    setAiErrorMessage(null);
    return true;
  };

  // Reorder handlers (Up/Down + HTML5 Drag)
  const moveItem = (section: 'education' | 'experience' | 'projects', index: number, direction: 'up' | 'down') => {
    setResume(prev => {
      const list = [...prev[section]] as any[];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return { ...prev, [section]: list };
    });
  };

  const handleDragStart = (section: 'education' | 'experience' | 'projects', index: number) => {
    setDraggedItem({ section, index });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (section: 'education' | 'experience' | 'projects', dropIndex: number) => {
    if (!draggedItem || draggedItem.section !== section) return;
    const startIndex = draggedItem.index;
    if (startIndex === dropIndex) return;

    setResume(prev => {
      const list = [...prev[section]] as any[];
      const [removed] = list.splice(startIndex, 1);
      list.splice(dropIndex, 0, removed);
      return { ...prev, [section]: list };
    });
    setDraggedItem(null);
  };

  const calculatePageEstimate = () => {
    const totalChars = JSON.stringify(resume).length;
    const estimated = (totalChars / 2600).toFixed(1);
    return Math.max(1.0, parseFloat(estimated));
  };

  const handleGetSkillSuggestions = async () => {
    if (!validateAIInput()) return;
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

  const componentRef = useRef<HTMLDivElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: resume.personalInfo.fullName || 'resume',
    pageStyle: `
      @page { size: A4; margin: 6mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .resume-section { break-inside: avoid; margin-bottom: 5px; }
      }
    `,
  });

  // FIX: On mobile the preview pane is CSS-hidden when the user is on the "Edit" tab.
  // Calling handlePrint() directly would capture a hidden DOM node → blank PDF.
  // This wrapper switches to preview mode first, waits for a repaint, then prints.
  const handleExportPDF = () => {
    setViewMode('preview');     // make componentRef visible in the DOM
    setShowExportModal(false);  // close the modal so it doesn't appear in print
    setTimeout(() => {
      handlePrint();
    }, 350);                    // allow React to repaint the preview before printing
  };

  const resumeToText = (resume: Resume): string => {
    return `
      Name: ${resume.personalInfo.fullName}
      Title: ${resume.personalInfo.location || ''}
      Summary: ${resume.personalInfo.summary || ''}
      Email: ${resume.personalInfo.email || ''}
      Phone: ${resume.personalInfo.phone || ''}
      Location: ${resume.personalInfo.location || ''}
      Skills: ${resume.skills.join(', ')}
      Experience: ${resume.experience.map(e => `${e.company} - ${e.role} (${e.startDate} - ${e.endDate}): ${e.description}`).join('\n')}
      Projects: ${resume.projects.map(p => `${p.name} (${p.technologies}): ${p.description}`).join('\n')}
      Education: ${resume.education.map(e => `${e.institution} - ${e.degree} (${e.startDate} - ${e.endDate})`).join('\n')}
      Certifications: ${resume.certifications.join(', ')}
      Achievements: ${resume.achievements.join(', ')}
    `;
  };

  const isResumeEmpty = () => {
    const hasName = resume.personalInfo.fullName.trim().length > 0;
    const hasSummary = resume.personalInfo.summary.trim().length > 0;
    const hasExperience = resume.experience.length > 0 && resume.experience.some(exp => exp.company.trim() || exp.role.trim());
    const hasSkills = resume.skills.length > 0 && resume.skills.some(skill => skill.trim());
    
    return !hasName && !hasSummary && !hasExperience && !hasSkills;
  };

  // Initialize ATS state from resume if it exists
  React.useEffect(() => {
    const initialHash = getResumeHash(resume);
    setLastSavedHash(initialHash);

    if (resume.atsResult) {
      setAtsScore(resume.atsResult.score);
      setAtsMatchedKeywords(resume.atsResult.matchedKeywords);
      setAtsMissingKeywords(resume.atsResult.missingKeywords);
      setAtsWeakSections(resume.atsResult.weakSections);
      setAtsSuggestion(resume.atsResult.suggestion);
      setAtsScoreChecked(true);
      setShowResults(true);
      
      // Initialize hashes so buttons are disabled until changes are made
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
      const result = await analyzeResumeFromATS(resumeText);
      
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
      setViewMode('preview');
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
                <div className="flex items-center gap-2 justify-between md:justify-end">
                    <span className="text-xs text-slate-400 font-medium hidden md:inline">
                      {isAutosaving ? '● Autosaving...' : (getResumeHash(resume) === lastSavedHash ? '✓ Saved' : '● Unsaved')}
                    </span>
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
                    disabled={getResumeHash(resume) === lastSavedHash}
                    className="flex-1 md:flex-none"
                    >
                    Save
                    </Button>
                    <Button variant="primary" size="sm" icon={<Download size={14}/>} onClick={() => setShowExportModal(true)} className="flex-1 md:flex-none">
                    Export
                    </Button>
                </div>
            </div>
            
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 scrollbar-hide">

          {/* AI Validation Error Alert Banner */}
          {aiErrorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center justify-between text-xs animate-shake">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                <span>{aiErrorMessage}</span>
              </div>
              <button onClick={() => setAiErrorMessage(null)} className="text-red-400 hover:text-red-600 p-1">
                <X size={14} />
              </button>
            </div>
          )}
          
          {/* Personal Info */}
          <div className="border border-slate-200/90 rounded-xl p-3.5 sm:p-4 bg-slate-50/80 shadow-xs transition-all">
             <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => toggleSection('personal')}>
                <h3 className="font-bold text-sm sm:text-base text-slate-800">Personal Details</h3>
                {expandedSection === 'personal' ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
             </div>
             
             {expandedSection === 'personal' && (
               <div className="mt-3.5 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                 <input className="border border-slate-200 p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all" placeholder="Full Name" name="fullName" value={resume.personalInfo.fullName || ''} onChange={handlePersonalInfoChange} />
                 <input className="border border-slate-200 p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all" placeholder="Job Title (e.g. Software Engineer)" name="location" value={resume.personalInfo.location || ''} onChange={handlePersonalInfoChange} />
                 <input className="border border-slate-200 p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all" placeholder="Email" name="email" value={resume.personalInfo.email || ''} onChange={handlePersonalInfoChange} />
                 <input className="border border-slate-200 p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all" placeholder="Phone" name="phone" value={resume.personalInfo.phone || ''} onChange={handlePersonalInfoChange} />
                 <input className="border border-slate-200 p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all" placeholder="LinkedIn URL" name="linkedin" value={resume.personalInfo.linkedin || ''} onChange={handlePersonalInfoChange} />
                 <input className="border border-slate-200 p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all" placeholder="Portfolio URL" name="portfolio" value={resume.personalInfo.portfolio || ''} onChange={handlePersonalInfoChange} />
                 <input className="border border-slate-200 p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all" placeholder="GitHub URL" name="githubUrl" value={resume.personalInfo.githubUrl || ''} onChange={handlePersonalInfoChange} />
                  <div className="col-span-full">
                    <div className="flex justify-between mb-1">
                      <label className="text-xs sm:text-sm text-slate-600 font-medium">Professional Summary</label>
                    </div>
                    <textarea 
                      className="w-full border border-slate-200 p-2.5 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-24 transition-all" 
                      placeholder="Brief overview of your career..." 
                      name="summary" 
                      value={resume.personalInfo.summary} 
                      onChange={handlePersonalInfoChange} 
                      maxLength={1000}
                    />
                    <div className="text-right text-[10px] text-slate-400 mt-1">
                      {resume.personalInfo.summary.length} / 1000
                    </div>
                 </div>
               </div>
             )}
          </div>

          {/* Experience */}
          <div className="border border-slate-200/90 rounded-xl p-3.5 sm:p-4 bg-slate-50/80 shadow-xs transition-all">
             <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => toggleSection('experience')}>
                <h3 className="font-bold text-sm sm:text-base text-slate-800">Experience</h3>
                {expandedSection === 'experience' ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
             </div>
             
             {expandedSection === 'experience' && (
               <div className="mt-3.5 sm:mt-4 space-y-3.5">
                 {resume.experience.map((exp, index) => (
                   <div 
                     key={exp.id} 
                     draggable 
                     onDragStart={() => handleDragStart('experience', index)}
                     onDragOver={handleDragOver}
                     onDrop={() => handleDrop('experience', index)}
                     className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs relative group hover:border-blue-400 transition-all cursor-move space-y-2.5"
                   >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold truncate">
                          <GripVertical size={16} className="cursor-grab active:cursor-grabbing text-slate-400 shrink-0" />
                          <span className="truncate">Position {index + 1}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveItem('experience', index, 'up'); }}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 rounded-md hover:bg-slate-100 transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveItem('experience', index, 'down'); }}
                            disabled={index === resume.experience.length - 1}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 rounded-md hover:bg-slate-100 transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeItem('experience', exp.id); }}
                            className="p-1 text-red-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors ml-1"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input className="border border-slate-200 p-2 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full" placeholder="Company" value={exp.company} onChange={(e) => updateItem('experience', exp.id, 'company', e.target.value)} />
                        <input className="border border-slate-200 p-2 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full" placeholder="Role" value={exp.role} onChange={(e) => updateItem('experience', exp.id, 'role', e.target.value)} />
                        <input className="border border-slate-200 p-2 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full" placeholder="Start Date" value={exp.startDate} onChange={(e) => updateItem('experience', exp.id, 'startDate', e.target.value)} />
                        <input className="border border-slate-200 p-2 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full" placeholder="End Date" value={exp.endDate} onChange={(e) => updateItem('experience', exp.id, 'endDate', e.target.value)} />
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
          <div className="border border-slate-200/90 rounded-xl p-3.5 sm:p-4 bg-slate-50/80 shadow-xs transition-all">
             <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => toggleSection('education')}>
                <h3 className="font-bold text-sm sm:text-base text-slate-800">Education</h3>
                {expandedSection === 'education' ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
             </div>
             
             {expandedSection === 'education' && (
               <div className="mt-3.5 sm:mt-4 space-y-3.5">
                 {resume.education.map((edu, index) => (
                   <div 
                     key={edu.id} 
                     draggable 
                     onDragStart={() => handleDragStart('education', index)}
                     onDragOver={handleDragOver}
                     onDrop={() => handleDrop('education', index)}
                     className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs relative group hover:border-blue-400 transition-all cursor-move space-y-2.5"
                   >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold truncate">
                          <GripVertical size={16} className="cursor-grab active:cursor-grabbing text-slate-400 shrink-0" />
                          <span className="truncate">Education {index + 1}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveItem('education', index, 'up'); }}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 rounded-md hover:bg-slate-100 transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveItem('education', index, 'down'); }}
                            disabled={index === resume.education.length - 1}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 rounded-md hover:bg-slate-100 transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeItem('education', edu.id); }}
                            className="p-1 text-red-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors ml-1"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        <input className="border border-slate-200 p-2 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all" placeholder="Institution" value={edu.institution} onChange={(e) => updateItem('education', edu.id, 'institution', e.target.value)} />
                        <input className="border border-slate-200 p-2 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all" placeholder="Degree / Course" value={edu.degree} onChange={(e) => updateItem('education', edu.id, 'degree', e.target.value)} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input className="border border-slate-200 p-2 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all" placeholder="Start Date" value={edu.startDate} onChange={(e) => updateItem('education', edu.id, 'startDate', e.target.value)} />
                          <input className="border border-slate-200 p-2 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all" placeholder="End Date" value={edu.endDate} onChange={(e) => updateItem('education', edu.id, 'endDate', e.target.value)} />
                        </div>
                        <input className="border border-slate-200 p-2 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full transition-all" placeholder="Grade/Marks (e.g. 3.8 GPA)" value={edu.gpa || ''} onChange={(e) => updateItem('education', edu.id, 'gpa', e.target.value)} />
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
           <div className="border border-slate-200/90 rounded-xl p-3.5 sm:p-4 bg-slate-50/80 shadow-xs transition-all">
             <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => toggleSection('projects')}>
                <h3 className="font-bold text-sm sm:text-base text-slate-800">Projects</h3>
                {expandedSection === 'projects' ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
             </div>
             
             {expandedSection === 'projects' && (
               <div className="mt-4 space-y-4">
                 {resume.projects.map((proj, index) => (
                   <div 
                     key={proj.id} 
                     draggable 
                     onDragStart={() => handleDragStart('projects', index)}
                     onDragOver={handleDragOver}
                     onDrop={() => handleDrop('projects', index)}
                     className="p-3 bg-white border rounded shadow-sm relative group hover:border-blue-300 transition-all cursor-move"
                   >
                      <div className="flex items-center justify-between border-b pb-2 mb-2">
                        <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                          <GripVertical size={16} className="cursor-grab active:cursor-grabbing text-slate-400" />
                          <span>Project {index + 1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveItem('projects', index, 'up'); }}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 rounded hover:bg-slate-100"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveItem('projects', index, 'down'); }}
                            disabled={index === resume.projects.length - 1}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 rounded hover:bg-slate-100"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeItem('projects', proj.id); }}
                            className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50 ml-1"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

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
                 disabled={!!improvedResume || getResumeHash(resume) === lastAtsCheckedHash || isResumeEmpty()}
                 className="flex-1"
                 title={isResumeEmpty() ? "Please add some details to your resume first" : "Check ATS Score"}
               >
                 Check ATS Score
               </Button>
               <Button 
                 variant="secondary" 
                 size="sm" 
                 onClick={handleImproveWithAI}
                 isLoading={isImprovingWithAI}
                 disabled={!atsScoreChecked || !!improvedResume || getResumeHash(resume) === lastAiImprovedHash || isResumeEmpty()}
                 className="flex-1"
                 title={isResumeEmpty() ? "Please add some details to your resume first" : "Improve with AI"}
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
           <div className="flex items-center gap-1 md:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
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
           
           <div className="flex items-center gap-2 text-[10px] md:text-xs ml-auto sm:ml-0 flex-wrap justify-end">
              {/* Color Preset Selector */}
              <div className="flex items-center gap-1 bg-slate-700 px-1.5 py-1 rounded">
                <Palette size={12} className="text-slate-400" />
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.color}
                    onClick={() => setAccentColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                    className={`w-3.5 h-3.5 rounded-full transition-transform ${accentColor === c.color ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'}`}
                  />
                ))}
              </div>

              {/* Compact Mode Button */}
              <button
                onClick={() => setCompactMode(!compactMode)}
                className={`px-2 py-1 rounded transition-colors text-[10px] font-semibold flex items-center gap-1 ${compactMode ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                title="Toggle Compact Mode to squeeze layout onto 1 page without calling AI"
              >
                📄 Compact {compactMode ? 'ON' : 'OFF'}
              </button>

              {/* Page Count Estimate Badge */}
              <span className="px-2 py-1 bg-slate-700 rounded text-slate-300 font-mono text-[10px]" title="Estimated page count">
                ~{calculatePageEstimate()} {calculatePageEstimate() > 1.1 ? 'Pgs ⚠️' : 'Pg ✅'}
              </span>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                 <button onClick={() => setPreviewScale(Math.max(0.4, previewScale - 0.1))} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded">-</button>
                 <span className="w-7 text-center">{Math.round(previewScale * 100)}%</span>
                 <button onClick={() => setPreviewScale(Math.min(1.5, previewScale + 0.1))} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded">+</button>
              </div>
           </div>
        </div>

        {/* Live Preview Canvas */}
        <div className="flex-1 overflow-auto flex justify-center p-4 md:p-8 bg-slate-500 print:bg-white print:p-0 relative">
          <div className="print:w-full" ref={componentRef}>
              {(isImprovingWithAI || isCheckingATS) ? (
                <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top center', width: '210mm', height: '297mm' }}>
                  <ResumeSkeleton />
                </div>
              ) : (
                <ResumePreview 
                  resume={improvedResume || debouncedResume} 
                  template={activeTemplate} 
                  scale={previewScale} 
                  isExporting={isExporting}
                  compactMode={compactMode}
                  accentColor={accentColor}
                />
              )}
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
                    <FileText className="text-slate-700" size={24} />
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

            {/* Compact Mode Option in Export Modal */}
            <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    📄 Compact Mode (Fit to 1 Page)
                  </h5>
                  <p className="text-xs text-slate-500">
                    Reduces padding and section spacing to fit content on a single page without needing AI calls.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input 
                    type="checkbox" 
                    checked={compactMode} 
                    onChange={(e) => setCompactMode(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed mb-2">
                    <strong>Tip:</strong> For best ATS compatibility, we recommend the <strong>ATS Standard</strong> or <strong>Modern Clean</strong> templates. 
                    Ensure "Background graphics" is enabled in your print settings if using Modern/Executive templates.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                    <strong>Mobile/Tablet Users:</strong> When the print dialog opens, look for the <strong>"Save as PDF"</strong> option in the destination dropdown. If you don't see it, tap the <strong>three dots</strong> in the top right corner and select <strong>"Save as PDF"</strong> to download your file.
                </p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setShowExportModal(false)}>Cancel</Button>
              <Button onClick={handleExportPDF} icon={<Download size={18} />}>
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;