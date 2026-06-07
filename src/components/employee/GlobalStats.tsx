import React from 'react';
import { ClientProfile } from '../../contexts/UserRoleContext';
import { 
  Users, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Briefcase
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface GlobalStatsProps {
  clients: ClientProfile[];
}

export const GlobalStats: React.FC<GlobalStatsProps> = ({ clients }) => {
  const approved = clients.filter(c => c.status === 'approved' || c.status === 'active').length;
  const pending = clients.filter(c => c.status === 'pending_approval' || !c.status).length;
  
  return (
    <div className="flex-1 overflow-y-auto p-12 bg-white custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h2>
          <p className="text-sm font-medium text-gray-400">High-level view of all candidates and system status.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard 
            icon={<Users className="w-8 h-8" />} 
            label="Total Candidates" 
            value={clients.length} 
            color="text-blue-600" 
            bg="bg-blue-50"
            border="border-blue-100"
          />
          <StatCard 
            icon={<CheckCircle2 className="w-8 h-8" />} 
            label="Approved" 
            value={approved} 
            color="text-emerald-600" 
            bg="bg-emerald-50"
            border="border-emerald-100"
          />
          <StatCard 
            icon={<Clock className="w-8 h-8" />} 
            label="Pending" 
            value={pending} 
            color="text-amber-600" 
            bg="bg-amber-50"
            border="border-amber-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10">
          <div className="p-10 bg-gray-50 border border-gray-200 rounded-[2.5rem] space-y-8 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-4">
              <Activity className="w-5 h-5 text-blue-600" /> System Status
            </h3>
            <div className="space-y-4">
               <ProtocolItem label="Job Tracker" active />
               <ProtocolItem label="Profile Manager" active />
               <ProtocolItem label="Candidate Records" active />
               <ProtocolItem label="Admin Controls" active />
            </div>
          </div>

          <div className="p-10 bg-white border border-gray-200 rounded-[2.5rem] flex flex-col justify-center items-center text-center space-y-8 shadow-sm">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
               <Briefcase className="w-10 h-10 text-gray-300" />
             </div>
             <div className="space-y-3">
               <h4 className="text-xl font-bold text-gray-900 tracking-tight">Karya System</h4>
               <p className="text-sm font-medium text-gray-400 leading-relaxed max-w-xs">
                 Karya is designed for efficient candidate management and job tracking.
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, bg, border }: any) => (
  <div className={`p-10 ${bg} border ${border} rounded-[2.5rem] space-y-6 shadow-sm hover:shadow-md transition-all group`}>
    <div className={cn(color, "group-hover:scale-110 transition-transform w-fit")}>{icon}</div>
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{label}</p>
      <p className="text-5xl font-bold text-gray-900 tracking-tighter tabular-nums">{value}</p>
    </div>
  </div>
);

const ProtocolItem = ({ label, active }: { label: string, active: boolean }) => (
  <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-200 transition-all shadow-sm">
    <span className={`text-xs font-bold uppercase tracking-tight ${active ? 'text-gray-900' : 'text-gray-300'}`}>
      {label}
    </span>
    {active ? (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Disabled</span>
      </div>
    )}
  </div>
);
