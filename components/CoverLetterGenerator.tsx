import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { ArrowLeft, Building, User, FileText, Sparkles, Download, Printer, Layout, X, Mail, Phone, MapPin, Linkedin } from 'lucide-react';
import { generateCoverLetter } from '../services/geminiService';
import { Resume, TemplateType } from '../types';
import { TEMPLATES } from '../constants';
import { useReactToPrint } from 'react-to-print';

interface CoverLetterGeneratorProps {
  resume: Resume;
  onBack: () => void;
}

const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({ resume, onBack }) => {
  const [step, setStep] = useState<'input' | 'preview'>('input');
  
  // Input State
  const [companyName, setCompanyName] = useState('');
  const [jobRole, setJobRole] = useState(resume.personalInfo.location || ''); 
  const [hiringManager, setHiringManager] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  
  // Output State
  const [coverLetterText, setCoverLetterText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastProcessedInputs, setLastProcessedInputs] = useState<{
    companyName: string;
    jobRole: string;
    hiringManager: string;
    jobDescription: string;
  } | null>(null);
  
  // Template & Export State
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>(TemplateType.ATS_CLASSIC);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleGenerate = async () => {
    if (!companyName || !jobRole) return;
    
    setIsGenerating(true);
    
    // Prepare context from resume
    const context = `
      Name: ${resume.personalInfo.fullName}
      Current Title: ${resume.personalInfo.location}
      Summary: ${resume.personalInfo.summary}
      Top Skills: ${resume.skills.join(', ')}
      Key Experience: ${resume.experience.map(e => `${e.role} at ${e.company} (${e.description})`).join('; ')}
    `;

    const letter = await generateCoverLetter(context, companyName, jobRole, hiringManager, jobDescription);
    setCoverLetterText(letter);
    setLastProcessedInputs({ companyName, jobRole, hiringManager, jobDescription });
    setStep('preview');
    setIsGenerating(false);
  };

  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `cover-letter-${companyName || 'cover-letter'}`,
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
      }
    `,
  });

  const handleBodyChange = (e: React.FormEvent<HTMLDivElement>) => {
    setCoverLetterText(e.currentTarget.innerText);
  };

  const renderTemplate = () => {
    const { personalInfo } = resume;
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    switch (activeTemplate) {
        case TemplateType.MODERN:
            return (
                <div className="text-slate-800 font-sans h-full flex flex-col">
                    <header className="border-b-4 border-blue-600 pb-6 mb-8">
                        <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tight mb-3">{personalInfo.fullName}</h1>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                            {personalInfo.email && <div className="flex items-center gap-1"><Mail size={14} className="text-blue-600"/> {personalInfo.email}</div>}
                            {personalInfo.phone && <div className="flex items-center gap-1"><Phone size={14} className="text-blue-600"/> {personalInfo.phone}</div>}
                            {personalInfo.linkedin && <div className="flex items-center gap-1"><Linkedin size={14} className="text-blue-600"/> {personalInfo.linkedin.replace(/^https?:\/\//, '')}</div>}
                        </div>
                    </header>
                    <div className="mb-8 font-medium text-slate-500">
                        {dateStr}
                    </div>
                    <div className="mb-8">
                        {hiringManager && <p className="font-semibold text-slate-900">{hiringManager}</p>}
                        <p className="text-slate-700 font-bold">{companyName}</p>
                    </div>
                    <div 
                        className="whitespace-pre-line text-justify leading-relaxed text-slate-700 outline-none focus:bg-blue-50/30 p-2 -ml-2 rounded"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={handleBodyChange}
                    >
                        {coverLetterText}
                    </div>
                </div>
            );
         
         case TemplateType.EXECUTIVE:
            return (
                <div className="text-slate-800 font-serif h-full flex flex-col">
                    <header className="bg-slate-900 text-white p-8 -mx-12 -mt-12 mb-12">
                        <h1 className="text-3xl font-bold uppercase tracking-widest mb-2 text-center">{personalInfo.fullName}</h1>
                        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
                            <span>{personalInfo.email}</span>
                            <span>{personalInfo.phone}</span>
                            <span>{personalInfo.location}</span>
                        </div>
                    </header>
                    <div className="mb-8 text-right font-medium text-slate-600 border-b border-slate-200 pb-2">
                        {dateStr}
                    </div>
                    <div className="mb-8">
                        {hiringManager && <p className="font-bold text-slate-900">{hiringManager}</p>}
                        <p className="text-slate-700">{companyName}</p>
                    </div>
                    <div 
                        className="whitespace-pre-line text-justify leading-loose outline-none focus:bg-slate-50 p-2 -ml-2 rounded"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={handleBodyChange}
                    >
                        {coverLetterText}
                    </div>
                </div>
            );

         case TemplateType.MINIMAL:
             return (
                <div className="text-slate-900 font-sans h-full flex flex-col px-4">
                    <header className="text-center mb-12">
                        <h1 className="text-2xl font-light uppercase tracking-[0.2em] mb-4">{personalInfo.fullName}</h1>
                        <div className="text-xs text-slate-500 uppercase tracking-wider flex justify-center gap-4">
                            {personalInfo.email && <span>{personalInfo.email}</span>}
                            {personalInfo.phone && <span>{personalInfo.phone}</span>}
                        </div>
                        <div className="w-12 h-0.5 bg-slate-900 mx-auto mt-6"></div>
                    </header>
                    <div className="mb-8 text-sm font-medium text-slate-500">
                        {dateStr}
                    </div>
                    <div className="mb-8 text-sm">
                        {hiringManager && <p>{hiringManager}</p>}
                        <p className="font-semibold">{companyName}</p>
                    </div>
                    <div 
                        className="whitespace-pre-line text-justify leading-7 text-sm outline-none focus:bg-slate-50 p-2 -ml-2 rounded"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={handleBodyChange}
                    >
                        {coverLetterText}
                    </div>
                </div>
             );

        case TemplateType.ATS_CLASSIC:
        default:
            return (
                <div className="text-slate-800 font-serif h-full flex flex-col">
                    <div className="mb-8 border-b border-slate-900 pb-4">
                        <h1 className="text-2xl font-bold uppercase tracking-wide mb-1">{personalInfo.fullName}</h1>
                        <div className="text-sm text-slate-600 flex flex-wrap gap-4">
                            <span>{personalInfo.email}</span>
                            <span>{personalInfo.phone}</span>
                            {personalInfo.linkedin && <span>{personalInfo.linkedin.replace(/^https?:\/\//, '')}</span>}
                        </div>
                    </div>
                    <div className="mb-8">
                        {dateStr}
                    </div>
                    <div className="mb-8">
                        {hiringManager && <p>{hiringManager}</p>}
                        <p className="font-bold">{companyName}</p>
                    </div>
                    <div 
                        className="whitespace-pre-line text-justify outline-none focus:bg-slate-50 p-2 -ml-2 rounded"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={handleBodyChange}
                    >
                        {coverLetterText}
                    </div>
                </div>
            );
    }
  }

  const isInputsChanged = !lastProcessedInputs || 
    companyName !== lastProcessedInputs.companyName ||
    jobRole !== lastProcessedInputs.jobRole ||
    hiringManager !== lastProcessedInputs.hiringManager ||
    jobDescription !== lastProcessedInputs.jobDescription;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-6">
      
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 md:mb-8 print:hidden">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <ArrowLeft size={20} md:size={24} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">Cover Letter Generator</h1>
            <p className="text-slate-500 text-xs md:text-sm">Tailored for {resume.name}</p>
          </div>
        </div>
      </div>

      {step === 'input' ? (
        <div className="w-full max-w-lg bg-white rounded-xl shadow-xl p-5 md:p-8 animate-in fade-in slide-in-from-bottom-4">
           <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Sparkles className="text-purple-600" size={20}/> Job Details
           </h2>
           
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
               <div className="relative">
                 <Building className="absolute left-3 top-2.5 text-slate-400" size={18} />
                 <input 
                   className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                   placeholder="e.g. Google, Amazon"
                   value={companyName || ''}
                   onChange={(e) => setCompanyName(e.target.value)}
                 />
               </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Job Role</label>
               <div className="relative">
                 <FileText className="absolute left-3 top-2.5 text-slate-400" size={18} />
                 <input 
                   className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                   placeholder="e.g. Senior Frontend Engineer"
                   value={jobRole || ''}
                   onChange={(e) => setJobRole(e.target.value)}
                 />
               </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Hiring Manager Name (Optional)</label>
               <div className="relative">
                 <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                 <input 
                   className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                   placeholder="e.g. Jane Doe (or leave blank)"
                   value={hiringManager || ''}
                   onChange={(e) => setHiringManager(e.target.value)}
                 />
               </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Job Description (Optional)</label>
               <textarea 
                 className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                 placeholder="Paste the job description or requirements here to tailor the cover letter..."
                 value={jobDescription || ''}
                 onChange={(e) => setJobDescription(e.target.value)}
                 maxLength={3000}
               />
               <div className="text-right text-xs text-slate-400 mt-1">
                 {jobDescription.length} / 3000
               </div>
             </div>

             <Button 
               onClick={handleGenerate} 
               isLoading={isGenerating} 
               disabled={!companyName || !jobRole} 
               className="w-full mt-4 !bg-purple-600 hover:!bg-purple-700"
               size="lg"
               icon={<Sparkles size={18}/>}
             >
               Generate Cover Letter
             </Button>
           </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6">
           
           {/* Sidebar Controls */}
           <div className="w-full md:w-64 space-y-4 print:hidden animate-in fade-in slide-in-from-left-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2">Actions</h3>
                <div className="space-y-2">
                  <Button onClick={() => setStep('input')} variant="outline" className="w-full justify-start" icon={<ArrowLeft size={16}/>}>
                    Edit Details
                  </Button>
                  <Button 
                    onClick={handleGenerate} 
                    isLoading={isGenerating} 
                    disabled={!isInputsChanged}
                    variant="secondary" 
                    className="w-full justify-start" 
                    icon={<Sparkles size={16}/>}
                  >
                    {!isInputsChanged ? 'Already Generated' : 'Regenerate'}
                  </Button>
                  <Button onClick={() => setShowExportModal(true)} variant="primary" className="w-full justify-start" icon={<Printer size={16}/>}>
                    Export PDF
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                <p><strong>Tip:</strong> You can edit the text directly on the page before exporting.</p>
              </div>
           </div>

            <div className="flex-1 animate-in fade-in slide-in-from-bottom-4">
               <div 
                 ref={componentRef}
                 className="a4-paper bg-white shadow-2xl mx-auto p-12 print:shadow-none print-area"
               >
                  {renderTemplate()}
               </div>
            </div>
        </div>
      )}

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 md:p-4 print:hidden overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl p-5 md:p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                    <Printer className="text-slate-700" size={24} />
                    <h3 className="text-xl font-bold text-slate-800">Export Options</h3>
                </div>
                <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} /> 
                </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
                <h4 className="font-semibold text-slate-700 mb-3 text-sm flex items-center gap-2">
                    <Layout size={16}/> Select Template
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
                            <div className={`w-full h-16 md:h-20 mb-2 rounded ${t.color} opacity-80 shadow-sm`}></div>
                            <span className={`text-xs md:text-sm font-medium ${activeTemplate === t.id ? 'text-blue-700' : 'text-slate-600'}`}>
                                {t.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 mt-4 border-t border-slate-100 shrink-0">
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

export default CoverLetterGenerator;
