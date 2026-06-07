import React from 'react';
import { 
  X, 
  ExternalLink, 
  Download, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Award,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

interface StudentDossierProps {
  client: any;
  jobs: any[];
  onClose?: () => void;
  isPage?: boolean;
}

export default function StudentDossier({ client, jobs, onClose, isPage = false }: StudentDossierProps) {
  const clientJobs = jobs.filter(j => j.clientId === client.id);
  const appliedCount = clientJobs.filter(j => ['Applied', 'Interview', 'Assessment', 'Selected', 'Rejected'].includes(j.status)).length;
  const assessmentCount = clientJobs.filter(j => j.status === 'Assessment').length;
  const interviewCount = clientJobs.filter(j => j.status === 'Interview').length;
  const selectedCount = clientJobs.filter(j => j.status === 'Selected').length;

  return (
    <div className={`flex flex-col h-full bg-[#050505] text-white ${isPage ? 'min-h-screen' : ''}`}>
      {/* Header section with profile overview */}
      <div className="relative border-b border-white/5 bg-black/40 overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="p-8 md:p-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-accent/20 to-brand-primary/20 border border-brand-accent/30 flex items-center justify-center text-2xl font-black text-brand-accent">
                  {client.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-6">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight font-display">{client.name}</h1>
                    <span className={`text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border ${
                      client.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                    }`}>
                      {client.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 mt-6">
                    <div className="flex items-center gap-2.5 text-brand-muted text-sm font-bold">
                      <Mail className="w-4 h-4" />
                      {client.email}
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2.5 text-brand-muted text-sm font-bold">
                        <Phone className="w-4 h-4" />
                        {client.phone}
                      </div>
                    )}
                    {client.application_data?.permanentAddress && (
                      <div className="flex items-center gap-2.5 text-brand-muted text-sm font-bold">
                        <MapPin className="w-4 h-4" />
                        {client.application_data.permanentAddress}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onClose && (
                <button 
                  onClick={onClose}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer group"
                >
                  <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>
          </div>
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] group hover:border-brand-accent/30 transition-all">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent mb-3 block">Total Applications</span>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-black font-mono">{appliedCount}</p>
                <TrendingUp className="w-6 h-6 text-brand-accent/40" />
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] group hover:border-purple-400/30 transition-all">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-3 block">Live Assessments</span>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-black font-mono">{assessmentCount}</p>
                <Award className="w-6 h-6 text-purple-400/40" />
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] group hover:border-cyan-400/30 transition-all">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-3 block">Interview Calls</span>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-black font-mono">{interviewCount}</p>
                <Briefcase className="w-6 h-6 text-cyan-400/40" />
              </div>
            </div>
            <div className="bg-emerald-500/[0.02] border border-emerald-500/20 p-8 rounded-[2rem] group hover:border-emerald-400/50 transition-all">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-3 block">Placement Offers</span>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-black font-mono text-emerald-400">{selectedCount}</p>
                <ShieldCheck className="w-6 h-6 text-emerald-400/40" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-8 md:p-12 overflow-y-auto flex-1 space-y-12 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          {/* Sidebar Metrics/Details (4 cols) */}
          <div className="xl:col-span-4 space-y-10">
            <section className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-accent flex items-center gap-2">
                <span className="w-8 h-[1px] bg-brand-accent/40" />
                Dossier Analysis
              </h3>
              
              <div className="bg-white/[0.01] border border-white/5 p-10 rounded-[3rem] space-y-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase text-white/30 tracking-widest">Date of Birth</span>
                    <p className="text-base font-bold uppercase tracking-tight">{client.application_data?.dob || 'Not Declared'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase text-white/30 tracking-widest">Preferred Location</span>
                    <p className="text-base font-bold uppercase tracking-tight">{client.application_data?.preferredLocation || 'Not Declared'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase text-white/30 tracking-widest">Domain & Specialization</span>
                    <p className="text-base font-bold uppercase tracking-tight text-brand-accent">{client.application_data?.domain || 'Not Declared'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase text-white/30 tracking-widest">Experience</span>
                    <p className="text-base font-bold uppercase tracking-tight">{client.application_data?.experience || 'Not Declared'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase text-white/30 tracking-widest">Current Company</span>
                    <p className="text-base font-bold uppercase tracking-tight">{client.application_data?.currentCompany || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase text-white/30 tracking-widest">Compensation (Current / Expected)</span>
                    <p className="text-lg font-black font-mono text-brand-accent">
                      {client.application_data?.currentCTC || '-'} / {client.application_data?.expectedCTC || '-'}
                    </p>
                  </div>
                </div>

                <div className="pt-10 border-t border-white/5 space-y-6">
                  <span className="text-[11px] font-black uppercase text-white/30 tracking-widest block">Target Specializations</span>
                  <div className="flex flex-wrap gap-3">
                    {client.application_data?.targetRoles?.map((role: string, idx: number) => (
                      <span key={idx} className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider text-white/80">
                        {role}
                      </span>
                    )) || <span className="text-xs italic text-white/20">None identified</span>}
                  </div>
                </div>

                <div className="pt-10 border-t border-white/5 grid grid-cols-2 gap-6">
                  <a 
                    href={client.application_data?.linkedinUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all ${
                      client.application_data?.linkedinUrl 
                        ? 'border-brand-accent/20 bg-brand-accent/5 text-brand-accent hover:bg-brand-accent/10' 
                        : 'border-white/5 bg-white/[0.02] text-white/20 cursor-not-allowed'
                    }`}
                  >
                    <ExternalLink className="w-6 h-6 mb-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">LinkedIn</span>
                  </a>
                  <a 
                    href={client.application_data?.portfolioUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all ${
                      client.application_data?.portfolioUrl 
                        ? 'border-white/20 bg-white/5 text-white hover:bg-white/10' 
                        : 'border-white/5 bg-white/[0.02] text-white/20 cursor-not-allowed'
                    }`}
                  >
                    <ExternalLink className="w-6 h-6 mb-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Portfolio</span>
                  </a>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-accent flex items-center gap-2">
                <span className="w-8 h-[1px] bg-brand-accent/40" />
                Professional Summary
              </h3>
              <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[2rem] space-y-6">
                {client.application_data?.skills && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Top Skills</span>
                    <p className="text-sm text-white/80 leading-relaxed font-medium">{client.application_data.skills}</p>
                  </div>
                )}
                {client.application_data?.workHistory && (
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Work History</span>
                    <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{client.application_data.workHistory}</p>
                  </div>
                )}
                {client.application_data?.education && (
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Education</span>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-bold text-white/90">{client.application_data.education.degree}</p>
                      <p className="text-xs text-white/60">{client.application_data.education.college} | {client.application_data.education.year}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Main Opportunities Log (8 cols) */}
          <div className="xl:col-span-8 space-y-10">
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-brand-accent flex items-center gap-2">
                  <span className="w-12 h-[1px] bg-brand-accent/40" />
                  Dispatch Tracker Timeline
                </h3>
                <span className="text-xs font-mono text-white/30 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                  {clientJobs.length} Vacancies Tracked
                </span>
              </div>

              <div className="space-y-8">
                {clientJobs.length > 0 ? (
                  clientJobs.map((job, idx) => (
                    <motion.div 
                      key={job.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group relative bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-brand-accent/30 p-10 rounded-[3rem] transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${
                              job.status === 'Selected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              job.status === 'Interview' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              job.status === 'Assessment' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                              job.status === 'Saved Draft' ? 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' :
                              job.status === 'Applied' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {job.status}
                            </span>
                            <span className="text-xs font-mono text-white/30">
                              {job.applied_date ? new Date(job.applied_date).toLocaleDateString() : 'Pending Date'}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-2xl font-black uppercase tracking-tight text-white group-hover:text-brand-accent transition-colors">{job.role}</h4>
                            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/60 mt-2">{job.company}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 self-start md:self-center">
                          {job.tailored_resume_url && (
                            <a 
                              href={job.tailored_resume_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-3 px-6 py-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all"
                            >
                              <Download className="w-5 h-5" />
                              Application CV
                            </a>
                          )}
                          {job.job_url && (
                            <a 
                              href={job.job_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-white transition-all"
                            >
                              <ExternalLink className="w-6 h-6" />
                            </a>
                          )}
                          <button className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-white/20 hover:text-white hover:border-white/20 transition-all">
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-40 border-2 border-dashed border-white/5 rounded-[4rem] text-center space-y-6">
                    <Briefcase className="w-16 h-16 text-white/5 mx-auto" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-white/20">No Opportunities Logged in Tracker</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
