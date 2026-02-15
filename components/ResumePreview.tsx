import React from 'react';
import { Resume, TemplateType } from '../types';
import { Mail, Phone, MapPin, Linkedin, Globe, ExternalLink } from 'lucide-react';

interface ResumePreviewProps {
  resume: Resume;
  template: TemplateType;
  scale?: number;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ resume, template, scale = 1 }) => {
  const { personalInfo, education, experience, projects, skills, certifications, achievements } = resume;

  // ATS Classic Template - Strictly text based, no icons, standard hierarchy
  const AtsTemplate = () => (
    <div className="h-full w-full bg-white text-black p-12 font-serif text-sm leading-relaxed">
      <header className="text-center mb-6 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold uppercase mb-1 tracking-wide">{personalInfo.fullName || 'YOUR NAME'}</h1>
        {personalInfo.jobTitle && <p className="text-lg font-medium mb-3">{personalInfo.jobTitle}</p>}
        <div className="flex flex-wrap justify-center gap-x-2 text-sm">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>| {personalInfo.phone}</span>}
          {personalInfo.location && <span>| {personalInfo.location}</span>}
          {personalInfo.linkedin && <span>| {personalInfo.linkedin.replace(/^https?:\/\//, '')}</span>}
          {personalInfo.portfolio && <span>| {personalInfo.portfolio.replace(/^https?:\/\//, '')}</span>}
        </div>
      </header>

      {personalInfo.summary && (
        <section className="mb-6">
          <h2 className="text-base font-bold uppercase border-b border-black mb-2">Professional Summary</h2>
          <p>{personalInfo.summary}</p>
        </section>
      )}

      {skills && skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-bold uppercase border-b border-black mb-2">Technical Skills</h2>
          <p>{skills.join(', ')}</p>
        </section>
      )}

      {experience && experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-bold uppercase border-b border-black mb-3">Professional Experience</h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline font-bold">
                  <span>{exp.company}</span>
                  <span>{exp.startDate} – {exp.endDate}</span>
                </div>
                <div className="italic mb-1">{exp.role}</div>
                <p className="whitespace-pre-line pl-4">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects && projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-bold uppercase border-b border-black mb-3">Projects</h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="font-bold">
                  {proj.name}
                  {proj.link && <span className="font-normal text-xs ml-2">({proj.link})</span>}
                </div>
                {proj.technologies && <div className="text-xs italic mb-1">Technologies: {proj.technologies}</div>}
                <p className="pl-4">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {education && education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-bold uppercase border-b border-black mb-3">Education</h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between font-bold">
                  <span>{edu.institution}</span>
                  <span>{edu.startDate} – {edu.endDate}</span>
                </div>
                <div>{edu.degree}</div>
                {edu.gpa && <div className="text-xs">GPA: {edu.gpa}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {certifications && certifications.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-bold uppercase border-b border-black mb-2">Certifications</h2>
          <ul className="list-disc list-inside pl-2">
            {certifications.map((cert, idx) => (
              <li key={idx}>{cert}</li>
            ))}
          </ul>
        </section>
      )}

      {achievements && achievements.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-bold uppercase border-b border-black mb-2">Achievements</h2>
          <ul className="list-disc list-inside pl-2">
            {achievements.map((ach, idx) => (
              <li key={idx}>{ach}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );

  // Modern Template
  const ModernTemplate = () => (
    <div className="h-full w-full bg-white text-slate-800 p-8 flex flex-col">
      <header className="border-b-2 border-blue-600 pb-4 mb-6">
        <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tight mb-1">{personalInfo.fullName || 'Your Name'}</h1>
        {personalInfo.jobTitle && <p className="text-xl font-semibold text-blue-600 mb-2">{personalInfo.jobTitle}</p>}
        <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-2">
          {personalInfo.email && <div className="flex items-center gap-1"><Mail size={14} /> {personalInfo.email}</div>}
          {personalInfo.phone && <div className="flex items-center gap-1"><Phone size={14} /> {personalInfo.phone}</div>}
          {personalInfo.location && <div className="flex items-center gap-1"><MapPin size={14} /> {personalInfo.location}</div>}
          {personalInfo.linkedin && <div className="flex items-center gap-1"><Linkedin size={14} /> {personalInfo.linkedin.replace(/^https?:\/\//, '')}</div>}
          {personalInfo.portfolio && <div className="flex items-center gap-1"><Globe size={14} /> {personalInfo.portfolio.replace(/^https?:\/\//, '')}</div>}
        </div>
      </header>

      {personalInfo.summary && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-blue-700 uppercase mb-2">Professional Summary</h2>
          <p className="text-sm leading-relaxed text-slate-700">{personalInfo.summary}</p>
        </section>
      )}

      {skills && skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-blue-700 uppercase mb-2">Technical Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <span key={idx} className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold text-slate-700 border border-slate-200">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {experience && experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-blue-700 uppercase mb-3">Work Experience</h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-slate-900">{exp.role}</h3>
                  <span className="text-xs font-medium text-slate-500 whitespace-nowrap">{exp.startDate} – {exp.endDate}</span>
                </div>
                <div className="text-sm font-semibold text-blue-600 mb-1">{exp.company}</div>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects && projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-blue-700 uppercase mb-3">Key Projects</h2>
          <div className="space-y-4">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-slate-900">{proj.name}</h3>
                  {proj.link && (
                    <a href={`https://${proj.link.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="text-blue-500 text-xs flex items-center hover:underline">
                      View <ExternalLink size={10} className="ml-1" />
                    </a>
                  )}
                </div>
                <div className="text-xs font-mono text-slate-500 mb-1">{proj.technologies}</div>
                <p className="text-sm text-slate-700 leading-relaxed">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {education && education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-blue-700 uppercase mb-3">Education</h2>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-slate-900">{edu.institution}</h3>
                  <span className="text-xs font-medium text-slate-500">{edu.startDate} – {edu.endDate}</span>
                </div>
                <div className="text-sm text-slate-700">{edu.degree}</div>
                {edu.gpa && <div className="text-xs text-slate-500 mt-0.5">GPA: {edu.gpa}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {((certifications && certifications.length > 0) || (achievements && achievements.length > 0)) && (
        <div className="grid grid-cols-2 gap-4">
          {certifications && certifications.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-blue-700 uppercase mb-2">Certifications</h2>
              <ul className="list-disc list-inside text-sm text-slate-700">
                {certifications.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </section>
          )}
          {achievements && achievements.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-blue-700 uppercase mb-2">Achievements</h2>
              <ul className="list-disc list-inside text-sm text-slate-700">
                {achievements.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );

  // Minimal Template (Clean, serif, very simple)
  const MinimalTemplate = () => (
    <div className="h-full w-full bg-white text-black p-10 flex flex-col font-serif">
      <header className="text-center border-b border-gray-300 pb-6 mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-widest mb-3">{personalInfo.fullName || 'Your Name'}</h1>
        <div className="flex justify-center flex-wrap gap-4 text-sm">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
          {personalInfo.linkedin && <span>• {personalInfo.linkedin.replace(/^https?:\/\//, '')}</span>}
        </div>
      </header>

      {personalInfo.summary && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 mb-3 pb-1">Profile</h2>
          <p className="text-sm leading-relaxed">{personalInfo.summary}</p>
        </section>
      )}

      {experience && experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 mb-4 pb-1">Experience</h2>
          <div className="space-y-5">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between font-bold text-sm mb-1">
                  <span>{exp.company}</span>
                  <span>{exp.startDate} – {exp.endDate}</span>
                </div>
                <div className="text-sm italic mb-2">{exp.role}</div>
                <p className="text-sm leading-relaxed whitespace-pre-line">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects && projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 mb-4 pb-1">Projects</h2>
          <div className="space-y-4">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm">{proj.name}</span>
                </div>
                <div className="text-xs italic text-gray-600 mb-1">{proj.technologies}</div>
                <p className="text-sm leading-relaxed">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-8">
        {education && education.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 mb-4 pb-1">Education</h2>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="font-bold text-sm">{edu.institution}</div>
                  <div className="text-sm">{edu.degree}</div>
                  <div className="text-xs text-gray-500">{edu.startDate} – {edu.endDate}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {skills && skills.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 mb-4 pb-1">Skills</h2>
            <div className="text-sm leading-relaxed">
              {skills.join(', ')}
            </div>
          </section>
        )}
      </div>

      {((certifications && certifications.length > 0) || (achievements && achievements.length > 0)) && (
        <div className="grid grid-cols-2 gap-8 mt-6">
          {certifications && certifications.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 mb-4 pb-1">Certifications</h2>
              <ul className="list-disc list-inside text-sm">
                {certifications.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </section>
          )}
          {achievements && achievements.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 mb-4 pb-1">Achievements</h2>
              <ul className="list-disc list-inside text-sm">
                {achievements.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );

  // Executive Template (Sidebar style)
  const ExecutiveTemplate = () => (
    <div className="h-full w-full bg-white flex">
      {/* Sidebar */}
      <div className="w-1/3 bg-slate-900 text-white p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-tight mb-1">{personalInfo.fullName || 'Your Name'}</h1>
          {personalInfo.jobTitle && <p className="text-sm font-medium text-slate-400 mb-3">{personalInfo.jobTitle}</p>}
          <div className="text-xs text-slate-300 space-y-2">
            {personalInfo.email && <div className="flex items-center gap-2"><Mail size={12} /> {personalInfo.email}</div>}
            {personalInfo.phone && <div className="flex items-center gap-2"><Phone size={12} /> {personalInfo.phone}</div>}
            {personalInfo.location && <div className="flex items-center gap-2"><MapPin size={12} /> {personalInfo.location}</div>}
            {personalInfo.linkedin && <div className="flex items-center gap-2"><Linkedin size={12} /> LinkedIn Profile</div>}
            {personalInfo.portfolio && <div className="flex items-center gap-2"><Globe size={12} /> Portfolio</div>}
          </div>
        </div>

        {skills && skills.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-700 pb-1">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <span key={idx} className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-200">{skill}</span>
              ))}
            </div>
          </section>
        )}

        {education && education.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-700 pb-1">Education</h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="text-sm font-bold">{edu.institution}</div>
                  <div className="text-xs text-slate-400">{edu.degree}</div>
                  <div className="text-xs text-slate-500 mt-1">{edu.startDate} – {edu.endDate}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {certifications && certifications.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-700 pb-1">Certifications</h2>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
              {certifications.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </section>
        )}
      </div>

      {/* Main Content */}
      <div className="w-2/3 p-8 bg-white text-slate-800">
        {personalInfo.summary && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 mb-3 pb-1">Profile</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{personalInfo.summary}</p>
          </section>
        )}

        {experience && experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 mb-4 pb-1">Experience</h2>
            <div className="space-y-6">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-900 text-base">{exp.role}</h3>
                    <span className="text-xs font-semibold text-slate-500">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <div className="text-sm text-slate-700 font-medium mb-2">{exp.company}</div>
                  <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {projects && projects.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 mb-4 pb-1">Projects</h2>
            <div className="space-y-5">
              {projects.map((proj) => (
                <div key={proj.id}>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    {proj.name}
                    {proj.link && <ExternalLink size={12} className="text-slate-400" />}
                  </div>
                  <div className="text-xs font-mono text-slate-500 mb-1">{proj.technologies}</div>
                  <p className="text-sm text-slate-600">{proj.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {achievements && achievements.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 mb-4 pb-1">Achievements</h2>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              {achievements.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </section>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="origin-top shadow-2xl print:shadow-none print-area print:!transform-none print:!m-0 print:!w-full print:!h-auto bg-white"
      style={{
        width: '210mm',
        minHeight: '297mm',
        transform: `scale(${scale})`,
        marginBottom: `${(297 * (scale - 1))}mm`, // Adjust for scale taking up less space flow-wise
        marginRight: `${(210 * (scale - 1))}mm`
      }}
    >
      {template === TemplateType.ATS_CLASSIC && <AtsTemplate />}
      {template === TemplateType.MODERN && <ModernTemplate />}
      {template === TemplateType.MINIMAL && <MinimalTemplate />}
      {template === TemplateType.EXECUTIVE && <ExecutiveTemplate />}
    </div>
  );
};

export default ResumePreview;