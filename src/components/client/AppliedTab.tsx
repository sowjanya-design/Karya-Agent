import React from 'react';
import { motion } from 'motion/react';
import { 
  Building, 
  Briefcase, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Download,
  AlertCircle
} from 'lucide-react';
import { TrackedJob } from '../../types/client';

interface AppliedTabProps {
  jobs: TrackedJob[];
}

export const AppliedTab: React.FC<AppliedTabProps> = ({ jobs }) => {
  // Filter out any job that isn't draft (meaning they are already applied/screened/progressing)
  const appliedJobs = jobs.filter(j => 
    j.status && j.status !== 'Saved Draft' && j.status !== 'wishlist'
  );

  // Helper to format Date + Time beautifully
  const formatDateTime = (isoString?: string, fallbackDate?: string) => {
    if (!isoString && !fallbackDate) return { date: 'N/A', time: '' };
    try {
      const dateObj = new Date(isoString || fallbackDate || '');
      if (isNaN(dateObj.getTime())) {
        return { date: fallbackDate || 'N/A', time: '' };
      }
      const dateStr = dateObj.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const timeStr = dateObj.toLocaleTimeString(undefined, { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
      return { date: dateStr, time: timeStr };
    } catch {
      return { date: fallbackDate || 'N/A', time: '' };
    }
  };

  return (
    <div className="space-y-10" id="applied-jobs-tab-stage">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h3 className="text-xl font-bold uppercase tracking-tight text-white flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-brand-accent" />
            Applied Trackers & Dispatches
          </h3>
          <p className="text-[9px] font-black text-brand-muted uppercase tracking-[0.3em] mt-1">Real-time chronicle of submitted opportunities and timeline dispatches</p>
        </div>
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl px-5 py-3 text-right">
          <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block">Total Opportunities</span>
          <span className="text-xl font-mono font-black text-brand-accent">{appliedJobs.length}</span>
        </div>
      </div>

      {appliedJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="client-applied-cards-grid">
          {appliedJobs.map((job) => {
            const { date, time } = formatDateTime(job.createdAt, job.applied_date);
            
            return (
              <motion.div 
                key={job.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-[#0A0A0A]/40 border border-white/5 rounded-[2rem] hover:border-white/10 transition-all duration-300 relative overflow-hidden group hover:shadow-[0_0_30px_rgba(255,255,255,0.01)]"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] group-hover:bg-brand-accent/[0.02] blur-xl rounded-full transition-colors pointer-events-none" />
                
                <div className="space-y-5">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-brand-muted" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest truncate">{job.company}</span>
                      </div>
                      <h4 className="text-base font-black text-white uppercase tracking-tight truncate">{job.role}</h4>
                    </div>

                    <span className={`text-[7px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      job.status === 'Selected' || job.status === 'offer' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      job.status === 'Interview' || job.status === 'interview' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      job.status === 'Assessment' || job.status === 'assessment' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      job.status === 'Applied' || job.status === 'applied' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {job.status}
                    </span>
                  </div>

                  {/* Timing metadata */}
                  <div className="grid grid-cols-2 gap-4 bg-[#050505]/40 border border-white/[0.02] p-4 rounded-xl">
                    <div className="space-y-1">
                      <span className="text-[7px] font-black text-white/20 uppercase tracking-widest flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-brand-accent/50" />
                        Date Applied
                      </span>
                      <p className="text-[10px] font-mono text-white/70 font-semibold">{date}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[7px] font-black text-white/20 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3 text-brand-accent/50" />
                        Time Applied
                      </span>
                      <p className="text-[10px] font-mono text-white/70 font-semibold">{time || '10:00 AM'}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                    {job.job_url && (
                      <a 
                        href={job.job_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-brand-muted hover:text-white transition-all flex items-center gap-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Vacancy Board
                      </a>
                    )}
                    {job.tailored_resume_url && (
                      <a 
                        href={job.tailored_resume_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="px-4 py-2 bg-brand-accent/10 hover:bg-brand-accent/20 border border-brand-accent/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-brand-accent hover:shadow-[0_0_15px_rgba(33,211,238,0.15)] transition-all flex items-center gap-2"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Tailored Resume
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center border border-dashed border-white/5 rounded-[3rem] space-y-4 bg-white/[0.01]">
          <AlertCircle className="w-10 h-10 mx-auto text-white/20" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Zero dispatches submitted</p>
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">Active applications will propagate here as soon as they transition past Saved drafts</p>
          </div>
        </div>
      )}
    </div>
  );
};
