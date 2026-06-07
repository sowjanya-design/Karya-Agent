import React from 'react';
import { motion } from 'motion/react';
import { 
  Building, 
  Calendar, 
  ExternalLink, 
  Download, 
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Monitor,
  MapPin
} from 'lucide-react';
import { TrackedJob } from '../../types/client';

interface TrackerTabProps {
  jobs: TrackedJob[];
}

const statusConfig: Record<string, { color: string, bg: string, icon: any }> = {
  'Applied': { color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle2 },
  'Interview': { color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
  'Assessment': { color: 'text-purple-600', bg: 'bg-purple-50', icon: Monitor },
  'Selected': { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  'Rejected': { color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertCircle },
  'Saved Draft': { color: 'text-gray-400', bg: 'bg-gray-50', icon: Clock }
};

// Normalize job data from backend to frontend format
const normalizeJob = (job: any) => ({
  id: job.id,
  company: job.company,
  role: job.role,
  status: job.status || 'Applied',
  applied_date: job.appliedDate,
  job_url: job.jobUrl,
  tailored_resume_url: job.tailoredResumeUrl,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
  location: job.location,
  salary: job.salary
});

export const TrackerTab: React.FC<TrackerTabProps> = ({ jobs }) => {
  // Normalize and sort jobs
  const normalizedJobs = jobs.map(normalizeJob);
  const sortedJobs = [...normalizedJobs].sort((a, b) => 
    new Date(b.updatedAt || b.createdAt || 0).getTime() - 
    new Date(a.updatedAt || a.createdAt || 0).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 mb-2 px-2">
        <div className="space-y-1">
          <h3 className="text-headline-md text-gray-900">Application Status</h3>
          <p className="text-body-md text-gray-500">Real-time tracker of all jobs being managed for you.</p>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-label text-gray-400 mr-3">Total</span>
          <span className="text-2xl font-bold text-blue-600">{sortedJobs.length}</span>
        </div>
      </div>

      <div className="grid gap-4 px-2 pb-10">
        {sortedJobs.map((job, idx) => {
          const statusInfo = statusConfig[job.status] || statusConfig['Saved Draft'];
          const StatusIcon = statusInfo.icon;

          return (
            <motion.div
              key={job.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-xl hover:shadow-gray-200/50 hover:border-blue-100 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 ${statusInfo.bg} rounded-2xl flex items-center justify-center ${statusInfo.color} shrink-0 border border-transparent group-hover:border-blue-100 transition-all`}>
                    <Building className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-title-md text-gray-900 group-hover:text-blue-600 transition-colors">
                      {job.role}
                    </h4>
                    <p className="text-body-md text-gray-500 flex items-center gap-1.5 mt-0.5">
                      {job.company}
                    </p>
                    {job.location && (
                      <p className="text-body-sm text-gray-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                      </p>
                    )}
                    {job.salary && (
                      <p className="text-body-sm font-semibold text-emerald-600 mt-0.5">
                        {job.salary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className={`px-4 py-2 ${statusInfo.bg} ${statusInfo.color} rounded-full text-label flex items-center gap-2 border ${statusInfo.color.replace('text-', 'border-').replace('-600', '-100')}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {job.status.toUpperCase()}
                  </div>

                  {job.applied_date && (
                    <div className="px-4 py-2 bg-gray-50 text-gray-500 rounded-full text-label flex items-center gap-2 border border-gray-100">
                      <Calendar className="w-3.5 h-3.5" />
                      {job.applied_date}
                    </div>
                  )}

                  <div className="flex items-center gap-2 ml-2">
                    {job.job_url && (
                      <a 
                        href={job.job_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-gray-100"
                        title="View Job Description"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {job.tailored_resume_url && (
                      <a 
                        href={job.tailored_resume_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-100 text-label font-semibold"
                        title="View Submission Resume"
                      >
                        <Download className="w-4 h-4" />
                        View CV
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {sortedJobs.length === 0 && (
          <div className="py-24 bg-white border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-center px-10">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
              <Briefcase className="w-10 h-10" />
            </div>
            <h4 className="text-title-md text-gray-900">No applications tracked yet</h4>
            <p className="text-body-md text-gray-500 max-w-xs mx-auto mt-3 leading-relaxed">
              Once our team starts tracking opportunities for you, they will appear here in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
