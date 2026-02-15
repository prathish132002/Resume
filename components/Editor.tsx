import React, { useState } from 'react';
import { Resume, TemplateType, Experience } from '../types';
import { TEMPLATES } from '../constants';
import ResumePreview from './ResumePreview';
import { Button } from './ui/Button';
import { Plus, Trash2, Wand2, ChevronDown, ChevronUp, Download, ArrowLeft, Save, X, Printer, Layout, Lightbulb, PlusCircle, History } from 'lucide-react';
import { generateSummary, improveDescription, tailorResumeToJob, getSkillSuggestions } from '../services/geminiService';
import { supabaseService } from '../services/supabaseService';
import HistoryModal from './HistoryModal';

interface EditorProps {
  resume: Resume;
  setResume: React.Dispatch<React.SetStateAction<Resume>>;
  onBack: () => void;
}

const Editor: React.FC<EditorProps> = ({ resume, setResume, onBack }) => {
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>(TemplateType.ATS_CLASSIC);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tailoringJobDesc, setTailoringJobDesc] = useState('');
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.8);
  const [isSaving, setIsSaving] = useState(false);
  
  // Skill Suggestion State
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false);

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

  // AI Handlers
  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    // Use the field labeled as "Job Title" (mapped to location in UI) as the target role
    const jobTitle = resume.personalInfo.location; 
    
    const context = `
      Target Job Title: ${jobTitle}
      Experience: ${resume.experience.map(e => `${e.role} at ${e.company}: ${e.description}`).join('\n')}
      Skills: ${resume.skills.join(', ')}
      Education: ${resume.education.map(e => `${e.degree} at ${e.institution}`).join('\n')}
    `;
    
    // Pass jobTitle explicitly to the service
    const summary = await generateSummary(context, jobTitle);
    setResume(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, summary } }));
    setIsGenerating(false);
  };

  const handleImproveExperience = async (id: string, text: string) => {
    if(!text) return;
    setIsGenerating(true);
    const improved = await improveDescription(text, 'experience');
    setResume(prev => ({
      ...prev,
      experience: prev.experience.map(e => e.id === id ? { ...e, description: improved } : e)
    }));
    setIsGenerating(false);
  };

  const handleTailorResume = async () => {
    if (!tailoringJobDesc) return;
    setIsGenerating(true);
    try {
      // Need to clean the JSON string to avoid parsing errors from the model sometimes adding markdown
      const jsonString = await tailorResumeToJob(JSON.stringify(resume), tailoringJobDesc);
      
      // Simple cleaning if the model wraps in ```json ... ```
      const cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const tailoredResume = JSON.parse(cleanJson);
      // Preserve ID and Name, update content
      setResume(prev => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, summary: tailoredResume.personalInfo.summary },
        experience: tailoredResume.experience.map((e: Experience, idx: number) => ({
             ...e, 
             // Mapping back IDs if lost, or assuming array order is preserved
             id: prev.experience[idx]?.id || Math.random().toString(36).substr(2, 9) 
        })),
        skills: tailoredResume.skills
      }));
      setShowTailorModal(false);
    } catch (e) {
      alert("Failed to tailor resume. Please try again.");
    }
    setIsGenerating(false);
  };

  const handleSaveResume = async () => {
    setIsSaving(true);
    try {
      await supabaseService.saveResume(resume);
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
    if (!resume.skills.includes(skill)) {
       setResume(prev => ({
           ...prev,
           skills: [...prev.skills, skill]
       }));
       // Remove from suggestions once added
       setSuggestedSkills(prev => prev.filter(s => s !== skill));
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

  // Update resume name/title
  const handleNameChange = (newName: string) => {
      setResume(prev => ({ ...prev, name: newName }));
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      
      {/* Sidebar - Form Editor */}
      <div className="w-1/2 flex flex-col h-full border-r border-slate-200 bg-white shadow-xl z-10">
        
        {/* Top Bar */}
        <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft size={20} />
                    </button>
                    <input 
                        value={resume.name} 
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="font-bold text-lg text-slate-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded px-2 -ml-2 outline-none transition-all w-64 truncate"
                        placeholder="Resume Name"
                    />
                </div>
                <div className="flex gap-2">
                    <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={<History size={16}/>} 
                    onClick={() => setShowHistoryModal(true)}
                    title="Version History"
                    >
                    History
                    </Button>
                    <Button 
                    variant="outline" 
                    size="sm" 
                    icon={<Save size={14}/>} 
                    onClick={handleSaveResume}
                    isLoading={isSaving}
                    >
                    Save
                    </Button>
                    <Button variant="primary" size="sm" icon={<Download size={14}/>} onClick={() => setShowExportModal(true)}>
                    Export
                    </Button>
                </div>
            </div>
            
            <div className="flex gap-2 justify-end">
               <Button 
                variant="secondary" 
                size="sm" 
                icon={<Wand2 size={14}/>} 
                onClick={() => setShowTailorModal(true)}
                className="w-full text-center justify-center"
                >
                Tailor to Job Description
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
                 <input className="border p-2 rounded" placeholder="Full Name" name="fullName" value={resume.personalInfo.fullName} onChange={handlePersonalInfoChange} />
                 <input className="border p-2 rounded" placeholder="Job Title (e.g. Software Engineer)" name="location" value={resume.personalInfo.location} onChange={handlePersonalInfoChange} />
                 <input className="border p-2 rounded" placeholder="Email" name="email" value={resume.personalInfo.email} onChange={handlePersonalInfoChange} />
                 <input className="border p-2 rounded" placeholder="Phone" name="phone" value={resume.personalInfo.phone} onChange={handlePersonalInfoChange} />
                 <input className="border p-2 rounded" placeholder="LinkedIn URL" name="linkedin" value={resume.personalInfo.linkedin} onChange={handlePersonalInfoChange} />
                 <input className="border p-2 rounded" placeholder="Portfolio URL" name="portfolio" value={resume.personalInfo.portfolio} onChange={handlePersonalInfoChange} />
                 <div className="col-span-full">
                    <div className="flex justify-between mb-1">
                      <label className="text-sm text-slate-600">Professional Summary</label>
                      <button onClick={handleGenerateSummary} disabled={isGenerating} className="text-xs flex items-center text-blue-600 hover:text-blue-800">
                         <Wand2 size={12} className="mr-1"/> Generate based on Job Title
                      </button>
                    </div>
                    <textarea 
                      className="w-full border p-2 rounded h-24 text-sm" 
                      placeholder="Brief overview of your career..." 
                      name="summary" 
                      value={resume.personalInfo.summary} 
                      onChange={handlePersonalInfoChange} 
                    />
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
                        />
                         <button 
                            onClick={() => handleImproveExperience(exp.id, exp.description)} 
                            disabled={isGenerating || !exp.description}
                            className="absolute bottom-2 right-2 text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1 hover:bg-indigo-100"
                          >
                           <Wand2 size={10}/> Improve
                         </button>
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
                        <textarea 
                          className="w-full border p-2 rounded text-sm h-16" 
                          placeholder="Brief description..." 
                          value={proj.description} 
                          onChange={(e) => updateItem('projects', proj.id, 'description', e.target.value)} 
                        />
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
                        disabled={isSuggestingSkills}
                        className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors"
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
                 />

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
                 />
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
                 />
               </div>
             )}
          </div>

        </div>
      </div>

      {/* Preview Area */}
      <div className="w-1/2 bg-slate-500 h-full flex flex-col">
        {/* Toolbar */}
        <div className="bg-slate-800 text-white p-3 flex justify-between items-center shadow-md z-20">
           <div className="flex gap-2">
             {TEMPLATES.map(t => (
               <button 
                key={t.id}
                onClick={() => setActiveTemplate(t.id as TemplateType)}
                className={`text-xs px-3 py-1 rounded transition-colors ${activeTemplate === t.id ? 'bg-blue-500 text-white font-bold' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
               >
                 {t.name}
               </button>
             ))}
           </div>
           <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Zoom</span>
              <button onClick={() => setPreviewScale(Math.max(0.4, previewScale - 0.1))} className="px-2 py-1 bg-slate-700 rounded">-</button>
              <span className="w-8 text-center">{Math.round(previewScale * 100)}%</span>
              <button onClick={() => setPreviewScale(Math.min(1.5, previewScale + 0.1))} className="px-2 py-1 bg-slate-700 rounded">+</button>
           </div>
        </div>

        {/* Live Preview Canvas */}
        <div className="flex-1 overflow-auto flex justify-center p-8 bg-slate-500 print:bg-white print:p-0">
          <div className="print:w-full">
             <ResumePreview resume={resume} template={activeTemplate} scale={previewScale} />
          </div>
        </div>
      </div>

      {/* AI Tailor Modal */}
      {showTailorModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Wand2 className="text-blue-600"/> Tailor to Job Description
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Paste the job description below. Gemini AI will rewrite your summary and highlight relevant experience to match the role.
            </p>
            <textarea 
              className="w-full h-40 border p-3 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Paste job description here..."
              value={tailoringJobDesc}
              onChange={(e) => setTailoringJobDesc(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowTailorModal(false)}>Cancel</Button>
              <Button onClick={handleTailorResume} isLoading={isGenerating} disabled={!tailoringJobDesc}>
                Optimize Resume
              </Button>
            </div>
          </div>
        </div>
      )}

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