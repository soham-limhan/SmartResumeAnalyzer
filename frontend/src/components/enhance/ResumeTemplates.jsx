import React, { useRef, useState, useEffect } from 'react';

// Platform labels
const PLATFORM_LABELS = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  portfolio: 'Portfolio',
};

export function AutoSizedPreview({ children, pageBudget = 1 }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);

  const targetHeight = pageBudget * 842;
  const resumeWidth = 793; // 595pt in pixels at standard DPI

  useEffect(() => {
    const el = contentRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const updateScale = () => {
      // 1. Calculate height scale
      const H = el.scrollHeight || el.offsetHeight || targetHeight;
      const heightScale = H > targetHeight ? targetHeight / H : 1;

      // 2. Calculate width scale based on parent wrapper width
      const parent = container.parentElement;
      const W_wrapper = parent ? parent.offsetWidth - 12 : resumeWidth;
      const widthScale = W_wrapper < resumeWidth ? W_wrapper / resumeWidth : 1;

      // 3. Final scale is the minimum of height and width scales to fit both dimensions
      setScale(Math.min(heightScale, widthScale));
    };

    updateScale();

    const observer = new ResizeObserver(() => {
      updateScale();
    });
    observer.observe(el);
    if (container.parentElement) {
      observer.observe(container.parentElement);
    }

    return () => {
      observer.disconnect();
    };
  }, [children, pageBudget, targetHeight]);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden border border-border bg-white rounded-md shadow-lg mx-auto"
      style={{ 
        width: `${resumeWidth * scale}px`,
        height: `${targetHeight * scale}px`,
        transition: 'height 0.15s ease-out, width 0.15s ease-out'
      }}
    >
      <div 
        ref={contentRef} 
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'top left',
          width: `${resumeWidth}px`,
          minHeight: `${targetHeight}px`,
        }}
      >
        {children}
      </div>
      
      {/* Page break line indicator (only visible on 2-page budget in preview) */}
      {pageBudget === 2 && (
        <div 
          className="absolute left-0 right-0 border-t border-dashed border-red-400 pointer-events-none z-50 flex items-center justify-center"
          style={{ top: `${842 * scale}px` }}
        >
          <span 
            className="bg-red-500/10 text-red-500 font-bold rounded-b backdrop-blur-sm uppercase tracking-wider text-center"
            style={{ fontSize: `${Math.max(6, 8 * scale)}px`, padding: `${2 * scale}px ${6 * scale}px` }}
          >
            Page 1 / Page 2 Break
          </span>
        </div>
      )}
    </div>
  );
}

const getDraftClass = (isDraft, isDark = false) => {
  if (!isDraft) return "";
  return `border border-dashed ${isDark ? 'border-emerald-500/40 bg-emerald-500/5 text-zinc-300' : 'border-blue-500/40 bg-blue-50/20 text-slate-800'} p-2 rounded relative opacity-85 transition-all`;
};

export default function ResumeTemplates({ resumeData, templateId, isBuilderMode = true }) {
  if (!resumeData) return null;

  const { personalInfo = {} } = resumeData;

  const education = resumeData.education || [];
  const experience = resumeData.experience || [];
  const projects = resumeData.projects || [];
  const rawSkills = resumeData.skills || {};
  const skills = {
    technical: rawSkills.technical || [],
    soft: rawSkills.soft || [],
    languages: rawSkills.languages || [],
    certifications: rawSkills.certifications || [],
  };

  const hasEducation = education.length > 0;
  const hasExperience = experience.length > 0;
  const hasProjects = projects.length > 0;
  const hasSkills = skills.technical.length > 0 || skills.soft.length > 0 || skills.languages.length > 0 || skills.certifications.length > 0;

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
      {(personalInfo.professionalSummary || isBuilderMode) && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Professional Summary</h2>
          {personalInfo.professionalSummary ? (
            <p className="text-slate-600">{personalInfo.professionalSummary}</p>
          ) : (
            <div className="py-2 px-3 border border-dashed border-slate-200 text-slate-400 text-[10px] italic rounded">
              No summary added. Start typing in the form to preview.
            </div>
          )}
        </div>
      )}

      {/* Experience */}
      {(hasExperience || isBuilderMode) && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Experience</h2>
          {hasExperience ? (
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id} className={getDraftClass(exp.isDraft)}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-900 text-xs">{exp.jobTitle || 'Job Role'} <span className="text-slate-400 font-normal">at</span> {exp.company || 'Company'}</h3>
                    <span className="text-slate-500 text-[10px] font-medium">{exp.startDate || 'Start Date'} – {exp.endDate || (exp.current ? 'Present' : 'End Date')}</span>
                  </div>
                  {exp.location && <p className="text-slate-400 text-[10px] -mt-0.5">{exp.location}</p>}
                  <div className="mt-1.5 text-slate-600 space-y-1">
                    {exp.responsibilities && exp.responsibilities.split('\n').filter(Boolean).map((line, idx) => (
                      <p key={idx} className="pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-blue-500">{line}</p>
                    ))}
                    {exp.achievements && (
                      <p className="pl-3 relative before:content-['★'] before:absolute before:left-0 before:text-amber-500 font-medium text-slate-700 italic">Key Achievement: {exp.achievements}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2 px-3 border border-dashed border-slate-200 text-slate-400 text-[10px] italic rounded">
              No work experience added. Start typing in the form to preview.
            </div>
          )}
        </div>
      )}

      {/* Projects */}
      {(hasProjects || isBuilderMode) && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Projects</h2>
          {hasProjects ? (
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id} className={getDraftClass(proj.isDraft)}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-900 text-xs">{proj.projectName || 'Project Name'}</h3>
                    <div className="flex gap-2 text-[10px]">
                      {proj.githubLink && <a href={proj.githubLink} className="text-blue-600 hover:underline">GitHub</a>}
                      {proj.liveDemoLink && <a href={proj.liveDemoLink} className="text-blue-600 hover:underline">Live Demo</a>}
                    </div>
                  </div>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Tech: {proj.technologies.join(', ')}</p>
                  )}
                  {proj.description && <p className="text-slate-600 mt-1">{proj.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2 px-3 border border-dashed border-slate-200 text-slate-400 text-[10px] italic rounded">
              No projects added. Start typing in the form to preview.
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Education */}
        {(hasEducation || isBuilderMode) && (
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Education</h2>
            {hasEducation ? (
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id} className={getDraftClass(edu.isDraft)}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-slate-900 text-xs">{edu.degree || 'Degree Title'}</h3>
                      <span className="text-slate-500 text-[10px]">{edu.startDate} – {edu.endDate}</span>
                    </div>
                    <p className="text-slate-650">{edu.institution} {edu.gpa && `· GPA: ${edu.gpa}`}</p>
                    {edu.description && <p className="text-slate-500 text-[10px] mt-0.5">{edu.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2 px-3 border border-dashed border-slate-200 text-slate-400 text-[10px] italic rounded">
                No education entries added.
              </div>
            )}
          </div>
        )}

        {/* Skills */}
        {(hasSkills || isBuilderMode) && (
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Skills</h2>
            {hasSkills ? (
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
            ) : (
              <div className="py-2 px-3 border border-dashed border-slate-200 text-slate-400 text-[10px] italic rounded">
                No skills added. Enter tags in the form.
              </div>
            )}
          </div>
        )}
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
      {(personalInfo.professionalSummary || isBuilderMode) && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1">Professional Summary</h2>
          {personalInfo.professionalSummary ? (
            <p className="text-justify font-sans">{personalInfo.professionalSummary}</p>
          ) : (
            <div className="py-1 px-2 border border-dashed border-neutral-300 text-neutral-400 text-[10px] italic">
              [Summary empty. Add details in form]
            </div>
          )}
        </div>
      )}

      {/* Experience */}
      {(hasExperience || isBuilderMode) && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2">Work Experience</h2>
          {hasExperience ? (
            <div className="space-y-3.5">
              {experience.map((exp) => (
                <div key={exp.id} className={getDraftClass(exp.isDraft)}>
                  <div className="flex justify-between font-bold">
                    <span>{exp.jobTitle || 'Job Role'} — {exp.company || 'Company'}</span>
                    <span>{exp.startDate || 'Start'} – {exp.endDate || (exp.current ? 'Present' : 'End')}</span>
                  </div>
                  {exp.location && <p className="text-[10px] italic font-sans text-neutral-650">{exp.location}</p>}
                  <ul className="list-disc list-inside mt-1 font-sans text-neutral-800 pl-1">
                    {exp.responsibilities && exp.responsibilities.split('\n').filter(Boolean).map((line, idx) => (
                      <li key={idx} className="pl-1 mb-0.5">{line}</li>
                    ))}
                    {exp.achievements && (
                      <li className="pl-1 list-none font-bold text-black mt-1">Key Achievement: {exp.achievements}</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-1 px-2 border border-dashed border-neutral-300 text-neutral-400 text-[10px] italic">
              [No experience entries added. Details will show here]
            </div>
          )}
        </div>
      )}

      {/* Projects */}
      {(hasProjects || isBuilderMode) && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2">Projects</h2>
          {hasProjects ? (
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id} className={getDraftClass(proj.isDraft)}>
                  <div className="flex justify-between font-bold">
                    <span>{proj.projectName || 'Project Name'}</span>
                    {proj.githubLink && <span className="text-[10px] font-sans font-normal text-neutral-600">{proj.githubLink.replace(/^https?:\/\/(www\.)?/, '')}</span>}
                  </div>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <p className="text-[10px] font-sans font-medium text-neutral-600 mt-0.5">Technologies: {proj.technologies.join(', ')}</p>
                  )}
                  {proj.description && <p className="font-sans text-neutral-850 mt-1">{proj.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-1 px-2 border border-dashed border-neutral-300 text-neutral-400 text-[10px] italic">
              [No projects added. Details will show here]
            </div>
          )}
        </div>
      )}

      {/* Education */}
      {(hasEducation || isBuilderMode) && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2">Education</h2>
          {hasEducation ? (
            <div className="space-y-2.5">
              {education.map((edu) => (
                <div key={edu.id} className={getDraftClass(edu.isDraft)}>
                  <div className="flex justify-between">
                    <span className="font-bold">{edu.degree || 'Degree'} — {edu.institution || 'Institution'}</span>
                    <span className="font-bold">{edu.startDate} – {edu.endDate}</span>
                  </div>
                  <p className="font-sans text-neutral-700">{edu.description || 'Graduated'} {edu.gpa && `· Cumulative GPA: ${edu.gpa}`}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-1 px-2 border border-dashed border-neutral-300 text-neutral-400 text-[10px] italic">
              [No education entries added. Details will show here]
            </div>
          )}
        </div>
      )}

      {/* Skills */}
      {(hasSkills || isBuilderMode) && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5">Skills & Credentials</h2>
          {hasSkills ? (
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
          ) : (
            <div className="py-1 px-2 border border-dashed border-neutral-300 text-neutral-400 text-[10px] italic">
              [No skills added. Details will show here]
            </div>
          )}
        </div>
      )}
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
        {(personalInfo.professionalSummary || isBuilderMode) && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <span className="md:col-span-3 text-[10px] tracking-widest font-bold uppercase text-zinc-400">Profile</span>
            <div className="md:col-span-9">
              {personalInfo.professionalSummary ? (
                <p className="text-zinc-650 font-light text-justify">{personalInfo.professionalSummary}</p>
              ) : (
                <span className="text-zinc-400 font-light italic text-[10px]">no profile summary added yet.</span>
              )}
            </div>
          </div>
        )}

        {/* Experience */}
        {(hasExperience || isBuilderMode) && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <span className="md:col-span-3 text-[10px] tracking-widest font-bold uppercase text-zinc-400">Experience</span>
            <div className="md:col-span-9 space-y-4">
              {hasExperience ? (
                experience.map((exp) => (
                  <div key={exp.id} className={getDraftClass(exp.isDraft)}>
                    <div className="flex justify-between items-baseline font-medium text-zinc-900">
                      <span>{exp.jobTitle || 'Job Role'} <span className="text-zinc-400 font-light">— {exp.company || 'Company'}</span></span>
                      <span className="text-[10px] text-zinc-400">{exp.startDate} – {exp.endDate || 'Present'}</span>
                    </div>
                    <div className="mt-1 text-zinc-500 font-light space-y-0.5">
                      {exp.responsibilities && exp.responsibilities.split('\n').filter(Boolean).map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-zinc-400 font-light italic text-[10px]">no work experience details added yet.</span>
              )}
            </div>
          </div>
        )}

        {/* Projects */}
        {(hasProjects || isBuilderMode) && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <span className="md:col-span-3 text-[10px] tracking-widest font-bold uppercase text-zinc-400">Projects</span>
            <div className="md:col-span-9 space-y-3">
              {hasProjects ? (
                projects.map((proj) => (
                  <div key={proj.id} className={getDraftClass(proj.isDraft)}>
                    <div className="flex justify-between items-baseline font-medium text-zinc-900">
                      <span>{proj.projectName || 'Project Name'}</span>
                      <span className="text-[9.5px] font-light text-zinc-400">{proj.technologies?.join(', ')}</span>
                    </div>
                    {proj.description && <p className="text-zinc-500 font-light mt-0.5">{proj.description}</p>}
                  </div>
                ))
              ) : (
                <span className="text-zinc-400 font-light italic text-[10px]">no projects details added yet.</span>
              )}
            </div>
          </div>
        )}

        {/* Education */}
        {(hasEducation || isBuilderMode) && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <span className="md:col-span-3 text-[10px] tracking-widest font-bold uppercase text-zinc-400">Education</span>
            <div className="md:col-span-9 space-y-3">
              {hasEducation ? (
                education.map((edu) => (
                  <div key={edu.id} className={getDraftClass(edu.isDraft)}>
                    <div className="flex justify-between font-medium text-zinc-900">
                      <span>{edu.degree || 'Degree'}</span>
                      <span className="text-[10px] font-light text-zinc-400">{edu.startDate} – {edu.endDate}</span>
                    </div>
                    <p className="text-zinc-500 font-light">{edu.institution} {edu.gpa && `· GPA: ${edu.gpa}`}</p>
                  </div>
                ))
              ) : (
                <span className="text-zinc-400 font-light italic text-[10px]">no education credentials added yet.</span>
              )}
            </div>
          </div>
        )}

        {/* Skills */}
        {(hasSkills || isBuilderMode) && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <span className="md:col-span-3 text-[10px] tracking-widest font-bold uppercase text-zinc-400">Skills</span>
            <div className="md:col-span-9 grid grid-cols-2 gap-4 text-[10.5px]">
              {hasSkills ? (
                <>
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
                </>
              ) : (
                <span className="text-zinc-400 font-light italic text-[10px]">no skills or keywords added yet.</span>
              )}
            </div>
          </div>
        )}
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
      {(personalInfo.professionalSummary || isBuilderMode) && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">Executive Summary</h2>
          {personalInfo.professionalSummary ? (
            <p className="text-gray-750 leading-normal">{personalInfo.professionalSummary}</p>
          ) : (
            <div className="py-2 px-3 border border-dashed border-gray-300 text-gray-400 text-[10px] italic rounded">
              No summary provided.
            </div>
          )}
        </div>
      )}

      {/* Experience */}
      {(hasExperience || isBuilderMode) && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2.5">Professional Experience</h2>
          {hasExperience ? (
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id} className={getDraftClass(exp.isDraft)}>
                  <div className="flex justify-between items-baseline font-bold text-gray-900">
                    <span>{exp.jobTitle || 'Role'} | <span className="text-blue-800 font-semibold">{exp.company || 'Company'}</span></span>
                    <span className="text-[10px] font-normal text-gray-500">{exp.startDate} – {exp.endDate || 'Present'}</span>
                  </div>
                  {exp.location && <p className="text-[10px] text-gray-400 -mt-0.5">{exp.location}</p>}
                  <ul className="list-disc pl-4 mt-1.5 space-y-1 text-gray-600">
                    {exp.responsibilities && exp.responsibilities.split('\n').filter(Boolean).map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                    {exp.achievements && (
                      <li className="list-none font-bold text-gray-800 mt-1 pl-0">Significant Achievement: {exp.achievements}</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2 px-3 border border-dashed border-gray-300 text-gray-400 text-[10px] italic rounded">
              No work experience added. Use form controls to add.
            </div>
          )}
        </div>
      )}

      {/* Education */}
      {(hasEducation || isBuilderMode) && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Education</h2>
          {hasEducation ? (
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id} className={getDraftClass(edu.isDraft)}>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-gray-900">{edu.degree || 'Degree'}</span>
                      <span className="text-gray-500"> — {edu.institution || 'School'}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">{edu.startDate} – {edu.endDate} {edu.gpa && `(GPA: ${edu.gpa})`}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2 px-3 border border-dashed border-gray-300 text-gray-400 text-[10px] italic rounded">
              No education credentials added.
            </div>
          )}
        </div>
      )}

      {/* Projects */}
      {(hasProjects || isBuilderMode) && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Key Projects</h2>
          {hasProjects ? (
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id} className={getDraftClass(proj.isDraft)}>
                  <div className="flex justify-between items-baseline font-bold text-gray-900">
                    <span>{proj.projectName || 'Project Name'}</span>
                    <span className="text-[9.5px] font-normal text-gray-500">{proj.technologies?.join(', ')}</span>
                  </div>
                  {proj.description && <p className="text-gray-650 mt-1">{proj.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2 px-3 border border-dashed border-gray-300 text-gray-400 text-[10px] italic rounded">
              No projects added.
            </div>
          )}
        </div>
      )}

      {/* Skills */}
      {(hasSkills || isBuilderMode) && (
        <div>
          <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">Skills & Expertise</h2>
          {hasSkills ? (
            <div className="grid grid-cols-2 gap-3 text-gray-700">
              {skills.technical?.length > 0 && (
                <p><strong>Technical Skills:</strong> {skills.technical.join(', ')}</p>
              )}
              {skills.soft?.length > 0 && (
                <p><strong>Management & Soft:</strong> {skills.soft.join(', ')}</p>
              )}
            </div>
          ) : (
            <div className="py-2 px-3 border border-dashed border-gray-300 text-gray-400 text-[10px] italic rounded">
              No skills added.
            </div>
          )}
        </div>
      )}
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
      {(personalInfo.professionalSummary || isBuilderMode) && (
        <div className="mb-5">
          <span className="text-zinc-500 block mb-1"># about_me</span>
          {personalInfo.professionalSummary ? (
            <p className="text-zinc-350">{personalInfo.professionalSummary}</p>
          ) : (
            <div className="text-zinc-650 text-[10px] italic">
              // summary is empty. start typing...
            </div>
          )}
        </div>
      )}

      {/* Skills */}
      {(hasSkills || isBuilderMode) && (
        <div className="mb-5 border border-zinc-800/80 p-3 rounded-lg bg-zinc-900/40">
          <span className="text-zinc-500 block mb-1"># core_skills</span>
          {hasSkills ? (
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
          ) : (
            <div className="text-zinc-600 text-[10px] italic">
              // no skills records registered.
            </div>
          )}
        </div>
      )}

      {/* Experience */}
      {(hasExperience || isBuilderMode) && (
        <div className="mb-5">
          <span className="text-zinc-500 block mb-2"># experience_log</span>
          {hasExperience ? (
            <div className="space-y-3">
              {experience.map((exp) => (
                <div key={exp.id} className={getDraftClass(exp.isDraft, true) + " pl-3 border-l border-zinc-800"}>
                  <div className="flex justify-between items-baseline text-white">
                    <span className="font-bold">&gt;&gt; {exp.jobTitle || 'Title'} @ {exp.company || 'Company'}</span>
                    <span className="text-[10px] text-zinc-500">{exp.startDate} - {exp.endDate || 'present'}</span>
                  </div>
                  <div className="mt-1 text-zinc-400 space-y-0.5">
                    {exp.responsibilities && exp.responsibilities.split('\n').filter(Boolean).map((line, idx) => (
                      <p key={idx}>* {line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-zinc-600 text-[10px] italic">
              // experience log is empty. start typing...
            </div>
          )}
        </div>
      )}

      {/* Projects */}
      {(hasProjects || isBuilderMode) && (
        <div className="mb-5">
          <span className="text-zinc-500 block mb-2"># project_portfolio</span>
          {hasProjects ? (
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id} className={getDraftClass(proj.isDraft, true) + " pl-3 border-l border-zinc-800"}>
                  <div className="flex justify-between items-baseline text-white">
                    <span>&gt;&gt; {proj.projectName || 'Project'}</span>
                    {proj.githubLink && <a href={proj.githubLink} className="text-zinc-500 hover:text-emerald-400 text-[10px]">url</a>}
                  </div>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <p className="text-[10px] text-zinc-500 mt-0.5">deps: {proj.technologies.join(', ')}</p>
                  )}
                  {proj.description && <p className="text-zinc-400 mt-1">{proj.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-zinc-650 text-[10px] italic">
              // projects list is empty. start typing...
            </div>
          )}
        </div>
      )}

      {/* Education */}
      {(hasEducation || isBuilderMode) && (
        <div>
          <span className="text-zinc-500 block mb-2"># education_credentials</span>
          {hasEducation ? (
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id} className={getDraftClass(edu.isDraft, true)}>
                  <div className="flex justify-between">
                    <span>{edu.degree || 'Degree'} | {edu.institution || 'School'}</span>
                    <span className="text-zinc-500">{edu.startDate} - {edu.endDate} {edu.gpa && `(GPA: ${edu.gpa})`}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-zinc-600 text-[10px] italic">
              // education records empty.
            </div>
          )}
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
