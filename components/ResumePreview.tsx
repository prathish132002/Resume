import React from 'react';
import { Resume, TemplateType } from '../types';
import { Mail, Phone, MapPin, Linkedin, Globe, ExternalLink, Github } from 'lucide-react';

interface ResumePreviewProps {
  resume: Resume;
  template: TemplateType;
  scale?: number;
  isExporting?: boolean;
  compactMode?: boolean;
  accentColor?: string;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({
  resume,
  template,
  scale = 1,
  isExporting = false,
  compactMode = false,
  accentColor = '#2563eb'
}) => {
  const { personalInfo, education, experience, projects, skills, certifications, achievements } = resume;
  
  const currentScale = isExporting ? 1 : scale;
  const paddingClass = compactMode ? 'p-4' : 'p-6';
  const sectionMarginClass = compactMode ? 'mb-2' : 'mb-3.5';
  const itemSpaceClass = compactMode ? 'space-y-1.5' : 'space-y-2.5';

  // ATS Classic Template - Strictly text based, no icons, standard hierarchy
  const AtsTemplate = () => (
    <div className={`h-full w-full bg-white text-black ${paddingClass} font-serif ${compactMode ? 'text-xs leading-tight' : 'text-sm leading-snug'}`}>
      <header className="text-center mb-3 border-b-2 border-black pb-2">
        <h1 className="text-3xl font-bold uppercase mb-1.5 tracking-wide">{personalInfo.fullName || 'YOUR NAME'}</h1>
        <div className="contact-info-container text-sm">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>| {personalInfo.phone}</span>}
          {personalInfo.location && <span>| {personalInfo.location}</span>}
          {personalInfo.linkedin && <span>| {personalInfo.linkedin.replace(/^https?:\/\//, '')}</span>}
          {personalInfo.portfolio && <span>| {personalInfo.portfolio.replace(/^https?:\/\//, '')}</span>}
          {personalInfo.githubUrl && <span>| {personalInfo.githubUrl.replace(/^https?:\/\//, '')}</span>}
        </div>
      </header>

      {personalInfo.summary && (
        <section className={`${sectionMarginClass} resume-section`}>
          <h2 className="text-base font-bold uppercase border-b border-black mb-1">Professional Summary</h2>
          <p>{personalInfo.summary}</p>
        </section>
      )}

      {skills && skills.length > 0 && (
        <section className={`${sectionMarginClass} resume-section`}>
          <h2 className="text-base font-bold uppercase border-b border-black mb-1">Technical Skills</h2>
          <p>{skills.join(', ')}</p>
        </section>
      )}

      {experience && experience.length > 0 && (
        <section className={`${sectionMarginClass} resume-section`}>
          <h2 className="text-base font-bold uppercase border-b border-black mb-1.5">Professional Experience</h2>
          <div className={itemSpaceClass}>
            {experience.map((exp) => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline font-bold">
                  <span>{exp.company}</span>
                  <span>{exp.startDate} – {exp.endDate}</span>
                </div>
                <div className="italic mb-0.5">{exp.role}</div>
                <p className="whitespace-pre-line pl-4">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects && projects.length > 0 && (
        <section className={`${sectionMarginClass} resume-section`}>
          <h2 className="text-base font-bold uppercase border-b border-black mb-1.5">Projects</h2>
          <div className={itemSpaceClass}>
            {projects.map((proj) => (
              <div key={proj.id} className="break-inside-avoid">
                <div className="font-bold">
                  {proj.name} 
                  {proj.link && <span className="font-normal text-xs ml-2">({proj.link})</span>}
                </div>
                {proj.technologies && <div className="text-xs italic mb-0.5">Technologies: {proj.technologies}</div>}
                <p className="pl-4">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {education && education.length > 0 && (
        <section className={`${sectionMarginClass} resume-section`}>
          <h2 className="text-base font-bold uppercase border-b border-black mb-1.5">Education</h2>
          <div className="space-y-1">
            {education.map((edu) => (
              <div key={edu.id} className="break-inside-avoid">
                <div className="flex justify-between font-bold">
                  <span>{edu.institution}</span>
                  <span>{edu.startDate} – {edu.endDate}</span>
                </div>
                <div>{edu.degree}</div>
                {edu.gpa && <div className="text-xs" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontVariantNumeric: 'lining-nums tabular-nums' }}>GPA: {edu.gpa}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {certifications && certifications.length > 0 && (
        <section className={`${sectionMarginClass} resume-section`}>
          <h2 className="text-base font-bold uppercase border-b border-black mb-1">Certifications</h2>
          <ul className="list-disc list-inside pl-2">
            {certifications.map((cert, idx) => (
              <li key={idx} className="break-inside-avoid">{cert}</li>
            ))}
          </ul>
        </section>
      )}

      {achievements && achievements.length > 0 && (
        <section className={`${sectionMarginClass} resume-section`}>
          <h2 className="text-base font-bold uppercase border-b border-black mb-1">Achievements</h2>
          <ul className="list-disc list-inside pl-2">
            {achievements.map((ach, idx) => (
              <li key={idx} className="break-inside-avoid">{ach}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );

  // Modern Template
  const ModernTemplate = () => (
    <div className={`h-full w-full bg-white text-slate-800 ${paddingClass} flex flex-col ${compactMode ? 'text-xs' : ''}`}>
      <header className="border-b-2 pb-3 mb-3" style={{ borderColor: accentColor }}>
        <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-tight mb-1">{personalInfo.fullName || 'Your Name'}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-slate-600 mt-1">
          {personalInfo.email && <div className="flex items-center gap-1"><Mail size={14} /> {personalInfo.email}</div>}
          {personalInfo.phone && <div className="flex items-center gap-1"><Phone size={14} /> {personalInfo.phone}</div>}
          {personalInfo.location && <div className="flex items-center gap-1"><MapPin size={14} /> {personalInfo.location}</div>}
          {personalInfo.linkedin && <div className="flex items-center gap-1"><Linkedin size={14} /> {personalInfo.linkedin.replace(/^https?:\/\//, '')}</div>}
          {personalInfo.portfolio && <div className="flex items-center gap-1"><Globe size={14} /> {personalInfo.portfolio.replace(/^https?:\/\//, '')}</div>}
          {personalInfo.githubUrl && <div className="flex items-center gap-1"><Github size={14} /> {personalInfo.githubUrl.replace(/^https?:\/\//, '')}</div>}
        </div>
      </header>

      {personalInfo.summary && (
        <section className={sectionMarginClass}>
          <h2 className="text-base font-bold uppercase mb-1" style={{ color: accentColor }}>Professional Summary</h2>
          <p className="text-sm leading-snug text-slate-700">{personalInfo.summary}</p>
        </section>
      )}

      {skills && skills.length > 0 && (
        <section className={sectionMarginClass}>
          <h2 className="text-base font-bold uppercase mb-1" style={{ color: accentColor }}>Technical Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, idx) => (
              <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold text-slate-700 border border-slate-200">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {experience && experience.length > 0 && (
        <section className={sectionMarginClass}>
          <h2 className="text-base font-bold uppercase mb-1.5" style={{ color: accentColor }}>Work Experience</h2>
          <div className={itemSpaceClass}>
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold text-slate-900">{exp.role}</h3>
                  <span className="text-xs font-medium text-slate-500 whitespace-nowrap">{exp.startDate} – {exp.endDate}</span>
                </div>
                <div className="text-sm font-semibold mb-0.5" style={{ color: accentColor }}>{exp.company}</div>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-snug">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects && projects.length > 0 && (
        <section className={sectionMarginClass}>
          <h2 className="text-base font-bold uppercase mb-1.5" style={{ color: accentColor }}>Key Projects</h2>
          <div className={itemSpaceClass}>
            {projects.map((proj) => (
              <div key={proj.id} className="break-inside-avoid">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className="font-bold text-slate-900">{proj.name}</h3>
                  {proj.link && (
                    <a href={`https://${proj.link.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="text-xs flex items-center hover:underline" style={{ color: accentColor }}>
                      View <ExternalLink size={10} className="ml-1" />
                    </a>
                  )}
                </div>
                <div className="text-xs font-mono text-slate-500 mb-0.5">{proj.technologies}</div>
                <p className="text-sm text-slate-700 leading-snug">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {education && education.length > 0 && (
        <section className={sectionMarginClass}>
          <h2 className="text-base font-bold uppercase mb-1.5" style={{ color: accentColor }}>Education</h2>
          <div className="space-y-1.5">
            {education.map((edu) => (
              <div key={edu.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-slate-900">{edu.institution}</h3>
                  <span className="text-xs font-medium text-slate-500">{edu.startDate} – {edu.endDate}</span>
                </div>
                <div className="text-sm text-slate-700">{edu.degree}</div>
                {edu.gpa && <div className="text-xs text-slate-500" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontVariantNumeric: 'lining-nums tabular-nums' }}>GPA: {edu.gpa}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
      
      {((certifications && certifications.length > 0) || (achievements && achievements.length > 0)) && (
        <div className="grid grid-cols-2 gap-4">
            {certifications && certifications.length > 0 && (
                <section>
                    <h2 className="text-base font-bold uppercase mb-1" style={{ color: accentColor }}>Certifications</h2>
                    <ul className="list-disc list-inside text-sm text-slate-700">
                        {certifications.map((c, i) => <li key={i} className="break-inside-avoid">{c}</li>)}
                    </ul>
                </section>
            )}
             {achievements && achievements.length > 0 && (
                <section>
                    <h2 className="text-base font-bold uppercase mb-1" style={{ color: accentColor }}>Achievements</h2>
                    <ul className="list-disc list-inside text-sm text-slate-700">
                        {achievements.map((a, i) => <li key={i} className="break-inside-avoid">{a}</li>)}
                    </ul>
                </section>
            )}
        </div>
      )}
    </div>
  );

  // Minimal Template (Clean, serif, very simple)
  const MinimalTemplate = () => (
    <div className={`h-full w-full bg-white text-black ${paddingClass} flex flex-col font-serif ${compactMode ? 'text-xs leading-tight' : 'text-sm leading-snug'}`}>
      <header className="text-center border-b pb-3 mb-3" style={{ borderColor: accentColor }}>
        <h1 className="text-3xl font-bold uppercase tracking-widest mb-1.5">{personalInfo.fullName || 'Your Name'}</h1>
        <div className="flex justify-center flex-wrap gap-2 text-xs sm:text-sm">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>• {personalInfo.phone}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
          {personalInfo.linkedin && <span>• {personalInfo.linkedin.replace(/^https?:\/\//, '')}</span>}
          {personalInfo.githubUrl && <span>• {personalInfo.githubUrl.replace(/^https?:\/\//, '')}</span>}
        </div>
      </header>

      {personalInfo.summary && (
        <section className={sectionMarginClass}>
          <h2 className="text-sm font-bold uppercase tracking-wider border-b mb-1 pb-0.5" style={{ borderColor: accentColor, color: accentColor }}>Profile</h2>
          <p className="text-sm leading-snug">{personalInfo.summary}</p>
        </section>
      )}

      {experience && experience.length > 0 && (
        <section className={sectionMarginClass}>
          <h2 className="text-sm font-bold uppercase tracking-wider border-b mb-1 pb-0.5" style={{ borderColor: accentColor, color: accentColor }}>Experience</h2>
          <div className={itemSpaceClass}>
            {experience.map((exp) => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between font-bold text-sm mb-0.5">
                  <span>{exp.company}</span>
                  <span>{exp.startDate} – {exp.endDate}</span>
                </div>
                <div className="text-sm italic mb-0.5">{exp.role}</div>
                <p className="text-sm leading-snug whitespace-pre-line">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

       {projects && projects.length > 0 && (
        <section className={sectionMarginClass}>
           <h2 className="text-sm font-bold uppercase tracking-wider border-b mb-1 pb-0.5" style={{ borderColor: accentColor, color: accentColor }}>Projects</h2>
          <div className={itemSpaceClass}>
            {projects.map((proj) => (
              <div key={proj.id} className="break-inside-avoid">
                 <div className="flex justify-between items-center mb-0.5">
                   <span className="font-bold text-sm">{proj.name}</span>
                 </div>
                 <div className="text-xs italic text-gray-600 mb-0.5">{proj.technologies}</div>
                <p className="text-sm leading-snug">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {education && education.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider border-b mb-1 pb-0.5" style={{ borderColor: accentColor, color: accentColor }}>Education</h2>
            <div className="space-y-1.5">
              {education.map((edu) => (
                <div key={edu.id} className="break-inside-avoid">
                  <div className="font-bold text-sm">{edu.institution}</div>
                  <div className="text-sm">{edu.degree}</div>
                  <div className="text-xs text-gray-500">{edu.startDate} – {edu.endDate}</div>
                  {edu.gpa && <div className="text-xs text-gray-400" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontVariantNumeric: 'lining-nums tabular-nums' }}>GPA: {edu.gpa}</div>}
                </div>
              ))}
            </div>
          </section>
        )}
        
        {skills && skills.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider border-b mb-1 pb-0.5" style={{ borderColor: accentColor, color: accentColor }}>Skills</h2>
            <div className="text-sm leading-snug">
              {skills.join(', ')}
            </div>
          </section>
        )}
      </div>

       {((certifications && certifications.length > 0) || (achievements && achievements.length > 0)) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
             {certifications && certifications.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-wider border-b mb-1 pb-0.5" style={{ borderColor: accentColor, color: accentColor }}>Certifications</h2>
                   <ul className="list-disc list-inside text-sm">
                      {certifications.map((c, i) => <li key={i}>{c}</li>)}
                   </ul>
                </section>
             )}
             {achievements && achievements.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-wider border-b mb-1 pb-0.5" style={{ borderColor: accentColor, color: accentColor }}>Achievements</h2>
                   <ul className="list-disc list-inside text-sm">
                      {achievements.map((a, i) => <li key={i} className="break-inside-avoid">{a}</li>)}
                   </ul>
                </section>
             )}
          </div>
       )}
    </div>
  );

  // Executive Template (Sidebar style)
  const ExecutiveTemplate = () => (
    <div className={`h-full w-full bg-white flex ${compactMode ? 'text-xs' : ''}`}>
      {/* Sidebar */}
      <div className="w-1/3 bg-slate-900 text-white p-3 sm:p-4 flex flex-col">
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight mb-2.5">{personalInfo.fullName || 'Your Name'}</h1>
          <div className="text-xs text-slate-300 space-y-1.5 break-all">
             {personalInfo.email && <div className="flex items-center gap-1.5"><Mail size={12} className="shrink-0" /> <span className="truncate">{personalInfo.email}</span></div>}
             {personalInfo.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="shrink-0" /> {personalInfo.phone}</div>}
             {personalInfo.location && <div className="flex items-center gap-1.5"><MapPin size={12} className="shrink-0" /> {personalInfo.location}</div>}
             {personalInfo.linkedin && <div className="flex items-center gap-1.5"><Linkedin size={12} className="shrink-0" /> <span className="truncate">{personalInfo.linkedin.replace(/^https?:\/\//, '')}</span></div>}
             {personalInfo.portfolio && <div className="flex items-center gap-1.5"><Globe size={12} className="shrink-0" /> <span className="truncate">{personalInfo.portfolio.replace(/^https?:\/\//, '')}</span></div>}
             {personalInfo.githubUrl && <div className="flex items-center gap-1.5"><Github size={12} className="shrink-0" /> <span className="truncate">{personalInfo.githubUrl.replace(/^https?:\/\//, '')}</span></div>}
          </div>
        </div>

        {skills && skills.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-2 border-b pb-1" style={{ borderColor: accentColor, color: accentColor }}>Skills</h2>
            <div className="flex flex-wrap gap-1.5">
               {skills.map((skill, idx) => (
                 <span key={idx} className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-200">{skill}</span>
               ))}
            </div>
          </section>
        )}

        {education && education.length > 0 && (
          <section className="mb-4">
             <h2 className="text-xs font-bold uppercase tracking-widest mb-2 border-b pb-1" style={{ borderColor: accentColor, color: accentColor }}>Education</h2>
             <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="break-inside-avoid">
                    <div className="text-xs font-bold">{edu.institution}</div>
                    <div className="text-[11px] text-slate-400">{edu.degree}</div>
                    <div className="text-[10px] text-slate-500">{edu.startDate} – {edu.endDate}</div>
                    {edu.gpa && <div className="text-[10px] text-slate-400" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontVariantNumeric: 'lining-nums tabular-nums' }}>GPA: {edu.gpa}</div>}
                  </div>
                ))}
             </div>
          </section>
        )}

        {certifications && certifications.length > 0 && (
            <section>
                 <h2 className="text-xs font-bold uppercase tracking-widest mb-2 border-b pb-1" style={{ borderColor: accentColor, color: accentColor }}>Certifications</h2>
                 <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                    {certifications.map((c, i) => <li key={i} className="break-inside-avoid">{c}</li>)}
                 </ul>
            </section>
        )}
      </div>

      {/* Main Content */}
      <div className="w-2/3 p-4 sm:p-6 bg-white text-slate-800">
        {personalInfo.summary && (
          <section className={sectionMarginClass}>
            <h2 className="text-base font-bold border-b-2 mb-2 pb-1" style={{ borderColor: accentColor, color: accentColor }}>Profile</h2>
            <p className="text-sm text-slate-600 leading-snug">{personalInfo.summary}</p>
          </section>
        )}

        {experience && experience.length > 0 && (
          <section className={sectionMarginClass}>
            <h2 className="text-base font-bold border-b-2 mb-2 pb-1" style={{ borderColor: accentColor, color: accentColor }}>Experience</h2>
            <div className={itemSpaceClass}>
              {experience.map((exp) => (
                <div key={exp.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">{exp.role}</h3>
                    <span className="text-xs font-semibold text-slate-500">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <div className="text-sm font-medium mb-1" style={{ color: accentColor }}>{exp.company}</div>
                  <p className="text-sm text-slate-600 whitespace-pre-line leading-snug">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {projects && projects.length > 0 && (
          <section className={sectionMarginClass}>
             <h2 className="text-base font-bold border-b-2 mb-2 pb-1" style={{ borderColor: accentColor, color: accentColor }}>Projects</h2>
             <div className={itemSpaceClass}>
               {projects.map((proj) => (
                 <div key={proj.id} className="break-inside-avoid">
                    <div className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                      {proj.name}
                      {proj.link && <ExternalLink size={12} className="text-slate-400" />}
                    </div>
                    <div className="text-xs font-mono text-slate-500 mb-0.5">{proj.technologies}</div>
                    <p className="text-sm text-slate-600">{proj.description}</p>
                 </div>
               ))}
             </div>
          </section>
        )}

        {achievements && achievements.length > 0 && (
             <section>
                 <h2 className="text-base font-bold border-b-2 mb-2 pb-1" style={{ borderColor: accentColor, color: accentColor }}>Achievements</h2>
                 <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                    {achievements.map((a, i) => <li key={i} className="break-inside-avoid">{a}</li>)}
                 </ul>
             </section>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .resume-section {
          orphans: 3;
          widows: 3;
          break-inside: auto;
        }
        .contact-info-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
      `}</style>
      <div 
        className="origin-top shadow-2xl print:shadow-none print-area print:!transform-none print:!m-0 print:!w-full print:!h-auto bg-white overflow-hidden"
        style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          transform: `scale(${currentScale})`,
          marginBottom: `${(297 * (currentScale - 1))}mm`, // Adjust for scale taking up less space flow-wise
          marginRight: `${(210 * (currentScale - 1))}mm`
        }}
      >
        {template === TemplateType.ATS_CLASSIC && <AtsTemplate />}
        {template === TemplateType.MODERN && <ModernTemplate />}
        {template === TemplateType.MINIMAL && <MinimalTemplate />}
        {template === TemplateType.EXECUTIVE && <ExecutiveTemplate />}
      </div>
    </>
  );
};

export default ResumePreview;