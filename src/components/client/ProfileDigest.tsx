import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Link2, 
  MapPin, 
  Layers,
  DollarSign
} from 'lucide-react';
import { ApplicationData } from '../../contexts/UserRoleContext';

interface ProfileDigestProps {
  data: ApplicationData;
}

export const ProfileDigest: React.FC<ProfileDigestProps> = ({ data }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-[2.5rem] p-10 shadow-sm mb-10"
    >
      <div className="flex flex-col md:flex-row justify-between gap-8">
        <div className="space-y-6 flex-1">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-headline-lg text-gray-900">
                {data.firstName} {data.lastName}
              </h3>
              <p className="text-label text-gray-400 mt-2">
                {data.domain || 'Professional Profile'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <InfoItem icon={<Briefcase />} label="Experience" value={data.experience} />
            <InfoItem icon={<BuildingIcon />} label="Current Company" value={data.currentCompany} />
            <InfoItem icon={<DollarSign />} label="Expectation" value={data.expectedCTC} />
            <InfoItem icon={<MapPin />} label="Preferred Location" value={data.preferredLocation} />
          </div>
        </div>

        <div className="w-full md:w-px bg-gray-100 hidden md:block" />

        <div className="space-y-6 flex-1">
          <div>
            <h4 className="text-label text-gray-400 mb-4 flex items-center gap-2">
              <Layers className="w-3 h-3" /> Target Roles
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.targetRoles?.map((role, idx) => (
                <span key={idx} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-xs font-semibold border border-gray-100">
                  {role}
                </span>
              )) || <span className="text-body-sm text-gray-400">No target roles specified</span>}
            </div>
          </div>

          <div>
            <h4 className="text-label text-gray-400 mb-4 flex items-center gap-2">
              <GraduationCap className="w-3 h-3" /> Academic
            </h4>
            <div className="space-y-1">
              <p className="text-title-sm text-gray-900">{data.education?.degree}</p>
              <p className="text-label text-gray-500 mt-1">{data.education?.college} • {data.education?.year}</p>
            </div>
          </div>

          <div>
            <h4 className="text-label text-gray-400 mb-4 flex items-center gap-2">
              <Link2 className="w-3 h-3" /> Professional Presence
            </h4>
            <div className="flex gap-4">
              {data.linkedinUrl && (
                <a href={data.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                  <span className="text-label text-blue-600 border-b-2 border-blue-100 pb-0.5">LinkedIn</span>
                </a>
              )}
              {data.portfolioUrl && (
                <a href={data.portfolioUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                  <span className="text-label text-blue-600 border-b-2 border-blue-100 pb-0.5">Portfolio</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const InfoItem = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
      {React.cloneElement(icon, { className: "w-4 h-4" })}
    </div>
    <div>
      <p className="text-label text-gray-400">{label}</p>
      <p className="text-title-sm text-gray-900">{value || 'N/A'}</p>
    </div>
  </div>
);

const BuildingIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
