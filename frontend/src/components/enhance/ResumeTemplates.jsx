import React from 'react';

// Platform labels
const PLATFORM_LABELS = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  portfolio: 'Portfolio',
};

export default function ResumeTemplates({ resumeData, templateId }) {
  if (!resumeData) return null;

  const {
    personalInfo = {},
    education = [],
    experience = [],
    skills = { technical: [], soft: [], languages: [], certifications: [] },
    projects = [],
  } = resumeData;

  const renderContacts = (isAts = false) => {
    const parts = [
      personalInfo.email,
      personalInfo.phone,
      personalInfo.location,
      personalInfo.linkedin && `linkedin.com/in/${personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}`,
      personalInfo.github && `github.com/${personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}`,
      personalInfo.portfolioWebsite && personalInfo.portfolioWebsite.replace(/^https?:\/\/(www\.)?/, ''),
    ].filter(Boolean);

    return parts.join(isAts ? '  |  ' : '   ·   ');
  };

  // 1. MODERN PROFESSIONAL TEMPLATE
  const renderModern = () => (
    <div className="p-8 bg-white text-slate-800 font-sans min-h-[842px] max-w-[595pt] shadow-inner border border-slate-200/50 rounded-md text-xs leading-relaxed">
      {/* Header */}
      <div className="border-b-2 border-blue-600 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{personalInfo.fullName || 'Your Name'}</h1>
        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mt-1">{personalInfo.professionalTitle || 'Professional Title'}</p>
        <div className="text-slate-500 mt-2 text-[10px] sm:text-xs">
          {renderContacts()}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.professionalSummary && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Professional Summary</h2>
          <p className="text-slate-600">{personalInfo.professionalSummary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Experience</h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-slate-900 text-xs">{exp.jobTitle} <span className="text-slate-400 font-normal">at</span> {exp.company}</h3>
                  <span className="text-slate-500 text-[10px] font-medium">{exp.startDate} – {exp.endDate || (exp.current ? 'Present' : '')}</span>
                </div>
                {exp.location && <p className="text-slate-400 text-[10px] -mt-0.5">{exp.location}</p>}
                <div className="mt-1.5 text-slate-600 space-y-1">
                  {exp.responsibilities && exp.responsibilities.split('\n').map((line, idx) => (
                    <p key={idx} className="pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-blue-500">{line}</p>
                  ))}
                  {exp.achievements && (
                    <p className="pl-3 relative before:content-['★'] before:absolute before:left-0 before:text-amber-500 font-medium text-slate-700 italic">Key Achievement: {exp.achievements}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Projects</h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-slate-900 text-xs">{proj.projectName}</h3>
                  <div className="flex gap-2 text-[10px]">
                    {proj.githubLink && <a href={proj.githubLink} className="text-blue-600 hover:underline">GitHub</a>}
                    {proj.liveDemoLink && <a href={proj.liveDemoLink} className="text-blue-600 hover:underline">Live Demo</a>}
                  </div>
                </div>
                {proj.technologies && proj.technologies.length > 0 && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Tech: {proj.technologies.join(', ')}</p>
                )}
                <p className="text-slate-600 mt-1">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Education */}
        {education.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Education</h2>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-900 text-xs">{edu.degree}</h3>
                    <span className="text-slate-500 text-[10px]">{edu.startDate} – {edu.endDate}</span>
                  </div>
                  <p className="text-slate-600">{edu.institution} {edu.gpa && `· GPA: ${edu.gpa}`}</p>
                  {edu.description && <p className="text-slate-500 text-[10px] mt-0.5">{edu.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Skills</h2>
          <div className="space-y-2 text-[11px]">
            {skills.technical?.length > 0 && (
              <p className="text-slate-600"><strong className="text-slate-900">Technical:</strong> {skills.technical.join(', ')}</p>
            )}
            {skills.soft?.length > 0 && (
              <p className="text-slate-600"><strong className="text-slate-900">Soft Skills:</strong> {skills.soft.join(', ')}</p>
            )}
            {skills.languages?.length > 0 && (
              <p className="text-slate-600"><strong className="text-slate-900">Languages:</strong> {skills.languages.join(', ')}</p>
            )}
            {skills.certifications?.length > 0 && (
              <p className="text-slate-600"><strong className="text-slate-900">Certifications:</strong> {skills.certifications.join(', ')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // 2. ATS FRIENDLY TEMPLATE
  const renderAts = () => (
    <div className="p-8 bg-white text-black font-serif min-h-[842px] max-w-[595pt] shadow-inner border border-slate-200/50 rounded-md text-xs leading-normal">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold uppercase tracking-wide">{personalInfo.fullName || 'Your Name'}</h1>
        <p className="text-xs font-medium italic mt-0.5">{personalInfo.professionalTitle || 'Professional Title'}</p>
        <p className="text-[10.5px] mt-1.5 tracking-tight font-sans">
          {renderContacts(true)}
        </p>
      </div>

      <hr className="border-t border-black mb-4" />

      {/* Summary */}
      {personalInfo.professionalSummary && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1">Professional Summary</h2>
          <p className="text-justify font-sans">{personalInfo.professionalSummary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2">Work Experience</h2>
          <div className="space-y-3.5">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between font-bold">
                  <span>{exp.jobTitle} — {exp.company}</span>
                  <span>{exp.startDate} – {exp.endDate || (exp.current ? 'Present' : '')}</span>
                </div>
                {exp.location && <p className="text-[10px] italic font-sans text-neutral-600">{exp.location}</p>}
                <ul className="list-disc list-inside mt-1 font-sans text-neutral-800 pl-1">
                  {exp.responsibilities && exp.responsibilities.split('\n').map((line, idx) => (
                    <li key={idx} className="pl-1 mb-0.5">{line}</li>
                  ))}
                  {exp.achievements && (
                    <li className="pl-1 list-none font-bold text-black mt-1">Key Achievement: {exp.achievements}</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2">Projects</h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between font-bold">
                  <span>{proj.projectName}</span>
                  {proj.githubLink && <span className="text-[10px] font-sans font-normal text-neutral-600">{proj.githubLink.replace(/^https?:\/\/(www\.)?/, '')}</span>}
                </div>
                {proj.technologies && proj.technologies.length > 0 && (
                  <p className="text-[10px] font-sans font-medium text-neutral-600 mt-0.5">Technologies: {proj.technologies.join(', ')}</p>
                )}
                <p className="font-sans text-neutral-850 mt-1">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2">Education</h2>
          <div className="space-y-2.5">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between">
                  <span className="font-bold">{edu.degree} — {edu.institution}</span>
                  <span className="font-bold">{edu.startDate} – {edu.endDate}</span>
                </div>
                <p className="font-sans text-neutral-700">{edu.description || 'Graduated'} {edu.gpa && `· Cumulative GPA: ${edu.gpa}`}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5">Skills & Credentials</h2>
        <div className="space-y-1 font-sans text-neutral-800">
          {skills.technical?.length > 0 && (
            <p><strong>Technical Skills:</strong> {skills.technical.join(', ')}</p>
          )}
          {skills.soft?.length > 0 && (
            <p><strong>Soft Skills:</strong> {skills.soft.join(', ')}</p>
          )}
          {skills.languages?.length > 0 && (
            <p><strong>Languages:</strong> {skills.languages.join(', ')}</p>
          )}
          {skills.certifications?.length > 0 && (
            <p><strong>Certifications:</strong> {skills.certifications.join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );

  // 3. MINIMAL TEMPLATE
  const renderMinimal = () => (
    <div className="p-10 bg-white text-zinc-700 font-sans min-h-[842px] max-w-[595pt] shadow-inner border border-slate-200/50 rounded-md text-xs leading-relaxed">
      {/* Centered clean head */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-normal text-zinc-900 tracking-wide lowercase">{personalInfo.fullName || 'Your Name'}</h1>
        <p className="text-[10px] tracking-[0.2em] font-medium text-zinc-400 uppercase mt-1.5">{personalInfo.professionalTitle || 'Professional Title'}</p>
        <div className="text-zinc-400 text-[9.5px] mt-4 flex items-center justify-center gap-3 flex-wrap">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>·</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>·</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.linkedin && <span>·</span>}
          {personalInfo.linkedin && <span>li/{personalInfo.linkedin.split('/').pop()}</span>}
        </div>
      </div>

      <div className="space-y-6">
        {/* Summary */}
        {personalInfo.professionalSummary && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <span className="md:col-span-3 text-[10px] tracking-widest font-bold uppercase text-zinc-400">Profile</span>
            <p className="md:col-span-9 text-zinc-600 font-light text-justify">{personalInfo.professionalSummary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <span className="md:col-span-3 text-[10px] tracking-widest font-bold uppercase text-zinc-400">Experience</span>
            <div className="md:col-span-9 space-y-4">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline font-medium text-zinc-900">
                    <span>{exp.jobTitle} <span className="text-zinc-400 font-light">— {exp.company}</span></span>
                    <span className="text-[10px] text-zinc-400">{exp.startDate} – {exp.endDate || 'Present'}</span>
                  </div>
                  <div className="mt-1 text-zinc-500 font-light space-y-0.5">
                    {exp.responsibilities && exp.responsibilities.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <span className="md:col-span-3 text-[10px] tracking-widest font-bold uppercase text-zinc-400">Projects</span>
            <div className="md:col-span-9 space-y-3">
              {projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline font-medium text-zinc-900">
                    <span>{proj.projectName}</span>
                    <span className="text-[9.5px] font-light text-zinc-400">{proj.technologies?.join(', ')}</span>
                  </div>
                  <p className="text-zinc-500 font-light mt-0.5">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <span className="md:col-span-3 text-[10px] tracking-widest font-bold uppercase text-zinc-400">Education</span>
            <div className="md:col-span-9 space-y-3">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between font-medium text-zinc-900">
                    <span>{edu.degree}</span>
                    <span className="text-[10px] font-light text-zinc-400">{edu.startDate} – {edu.endDate}</span>
                  </div>
                  <p className="text-zinc-500 font-light">{edu.institution} {edu.gpa && `· GPA: ${edu.gpa}`}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <span className="md:col-span-3 text-[10px] tracking-widest font-bold uppercase text-zinc-400">Skills</span>
          <div className="md:col-span-9 grid grid-cols-2 gap-4 text-[10.5px]">
            {skills.technical?.length > 0 && (
              <div>
                <strong className="block text-zinc-800 font-semibold mb-0.5">Technical</strong>
                <p className="font-light text-zinc-500">{skills.technical.join(', ')}</p>
              </div>
            )}
            {skills.soft?.length > 0 && (
              <div>
                <strong className="block text-zinc-800 font-semibold mb-0.5">Soft Skills</strong>
                <p className="font-light text-zinc-500">{skills.soft.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // 4. CORPORATE TEMPLATE
  const renderCorporate = () => (
    <div className="p-8 bg-white text-gray-800 font-sans min-h-[842px] max-w-[595pt] shadow-inner border border-slate-200/50 rounded-md text-xs leading-relaxed">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-300 pb-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{personalInfo.fullName || 'Your Name'}</h1>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-0.5">{personalInfo.professionalTitle || 'Professional Title'}</p>
        </div>
        <div className="text-right text-[10px] text-gray-500 space-y-0.5">
          <p>{personalInfo.location}</p>
          <p>{personalInfo.phone}</p>
          <p className="text-blue-800 font-medium">{personalInfo.email}</p>
        </div>
      </div>

      {/* Summary */}
      {personalInfo.professionalSummary && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">Executive Summary</h2>
          <p className="text-gray-700 leading-normal">{personalInfo.professionalSummary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2.5">Professional Experience</h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="group">
                <div className="flex justify-between items-baseline font-bold text-gray-900">
                  <span>{exp.jobTitle} | <span className="text-blue-800 font-semibold">{exp.company}</span></span>
                  <span className="text-[10px] font-normal text-gray-500">{exp.startDate} – {exp.endDate || 'Present'}</span>
                </div>
                {exp.location && <p className="text-[10px] text-gray-400 -mt-0.5">{exp.location}</p>}
                <ul className="list-disc pl-4 mt-1.5 space-y-1 text-gray-600">
                  {exp.responsibilities && exp.responsibilities.split('\n').map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                  {exp.achievements && (
                    <li className="list-none font-bold text-gray-800 mt-1 pl-0">Significant Achievement: {exp.achievements}</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Education</h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-gray-900">{edu.degree}</span>
                  <span className="text-gray-500"> — {edu.institution}</span>
                </div>
                <span className="text-[10px] text-gray-500">{edu.startDate} – {edu.endDate} {edu.gpa && `(GPA: ${edu.gpa})`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Key Projects</h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline font-bold text-gray-900">
                  <span>{proj.projectName}</span>
                  <span className="text-[9.5px] font-normal text-gray-500">{proj.technologies?.join(', ')}</span>
                </div>
                <p className="text-gray-600 mt-1">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      <div>
        <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">Skills & Expertise</h2>
        <div className="grid grid-cols-2 gap-3 text-gray-700">
          {skills.technical?.length > 0 && (
            <p><strong>Technical Skills:</strong> {skills.technical.join(', ')}</p>
          )}
          {skills.soft?.length > 0 && (
            <p><strong>Management & Soft:</strong> {skills.soft.join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );

  // 5. DEVELOPER TEMPLATE
  const renderDeveloper = () => (
    <div className="p-8 bg-zinc-950 text-zinc-300 font-mono min-h-[842px] max-w-[595pt] shadow-inner border border-zinc-800 rounded-md text-[11px] leading-relaxed">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5 mb-5">
        <h1 className="text-xl font-bold text-white uppercase tracking-tight">&gt; {personalInfo.fullName || 'candidate'}</h1>
        <p className="text-zinc-500 text-[10px] mt-1">$ title: {personalInfo.professionalTitle || 'Software Engineer'}</p>
        <div className="text-zinc-400 mt-3 text-[10px] flex gap-x-4 gap-y-1 flex-wrap">
          {personalInfo.email && <span>email: {personalInfo.email}</span>}
          {personalInfo.phone && <span>phone: {personalInfo.phone}</span>}
          {personalInfo.location && <span>loc: {personalInfo.location}</span>}
          {personalInfo.github && <span>github: {personalInfo.github.split('/').pop()}</span>}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.professionalSummary && (
        <div className="mb-5">
          <span className="text-zinc-500 block mb-1"># about_me</span>
          <p className="text-zinc-350">{personalInfo.professionalSummary}</p>
        </div>
      )}

      {/* Skills */}
      <div className="mb-5 border border-zinc-800/80 p-3 rounded-lg bg-zinc-900/40">
        <span className="text-zinc-500 block mb-1"># core_skills</span>
        <div className="space-y-1 text-[10px]">
          {skills.technical?.length > 0 && (
            <p><span className="text-emerald-400 font-bold">techStack</span> = [{skills.technical.map(s => `"${s}"`).join(', ')}]</p>
          )}
          {skills.soft?.length > 0 && (
            <p><span className="text-emerald-400 font-bold">softSkills</span> = [{skills.soft.map(s => `"${s}"`).join(', ')}]</p>
          )}
          {skills.languages?.length > 0 && (
            <p><span className="text-emerald-400 font-bold">languages</span> = [{skills.languages.map(s => `"${s}"`).join(', ')}]</p>
          )}
        </div>
      </div>

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-5">
          <span className="text-zinc-500 block mb-2"># experience_log</span>
          <div className="space-y-3">
            {experience.map((exp) => (
              <div key={exp.id} className="pl-3 border-l border-zinc-800">
                <div className="flex justify-between items-baseline text-white">
                  <span className="font-bold">&gt;&gt; {exp.jobTitle} @ {exp.company}</span>
                  <span className="text-[10px] text-zinc-500">{exp.startDate} - {exp.endDate || 'present'}</span>
                </div>
                <div className="mt-1 text-zinc-400 space-y-0.5">
                  {exp.responsibilities && exp.responsibilities.split('\n').map((line, idx) => (
                    <p key={idx}>* {line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-5">
          <span className="text-zinc-500 block mb-2"># project_portfolio</span>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="pl-3 border-l border-zinc-800">
                <div className="flex justify-between items-baseline text-white">
                  <span>&gt;&gt; {proj.projectName}</span>
                  {proj.githubLink && <a href={proj.githubLink} className="text-zinc-500 hover:text-emerald-400 text-[10px]">url</a>}
                </div>
                {proj.technologies && (
                  <p className="text-[10px] text-zinc-500 mt-0.5">deps: {proj.technologies.join(', ')}</p>
                )}
                <p className="text-zinc-450 mt-1">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div>
          <span className="text-zinc-500 block mb-2"># education_credentials</span>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between">
                <span>{edu.degree} | {edu.institution}</span>
                <span className="text-zinc-500">{edu.startDate} - {edu.endDate} {edu.gpa && `(GPA: ${edu.gpa})`}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  switch (templateId) {
    case 'ats_friendly':
      return renderAts();
    case 'minimal':
      return renderMinimal();
    case 'corporate':
      return renderCorporate();
    case 'developer':
      return renderDeveloper();
    case 'modern_professional':
    default:
      return renderModern();
  }
}
