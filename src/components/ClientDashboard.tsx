import React, { useState, useEffect } from 'react';
import { useUserRole } from '../contexts/UserRoleContext';
import { 
  LayoutDashboard, 
  User, 
  Loader2,
  FileText,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

// Modular Components
import { TrackerTab } from './client/TrackerTab';
import { ProfileTab } from './client/ProfileTab';
import { ProfileDigest } from './client/ProfileDigest';

// Shared Types
import { TrackedJob } from '../types/client';

export default function ClientDashboard() {
  const { user, clientProfile, refreshProfile, logout } = useUserRole();
  const [activeTab, setActiveTab] = useState<'profile' | 'tracker'>('tracker');
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Poll jobs
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const res = await fetch(`/api/jobs/${(user as any).uid || user.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const jobList = await res.json();
          if (isMounted) {
            setJobs(jobList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Error reading jobs:", err);
        if (isMounted) setLoading(false);
      }
    };
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const isApproved = clientProfile?.status === 'approved' || clientProfile?.status === 'active';
  const isProfileEmpty = !clientProfile?.application_data?.firstName;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans karya-dashboard-font">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden shadow-2xl p-6"
            >
              <SidebarContent 
                activeTab={activeTab} 
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setIsMobileMenuOpen(false);
                }} 
                clientProfile={clientProfile}
                userEmail={user?.email || ''}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col p-6 overflow-y-auto">
        <SidebarContent 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          clientProfile={clientProfile}
          userEmail={user?.email || ''}
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 lg:hidden bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-bold text-slate-800">
              {activeTab === 'tracker' ? 'Application Tracker' : 'My Information'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {isApproved ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-bold border border-amber-100">
                <Clock className="w-3.5 h-3.5" /> Pending Review
              </div>
            )}
            
            <button 
              onClick={() => logout()}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-6xl mx-auto">
          {!isApproved && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-4"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-900">
                  {isProfileEmpty ? 'Complete Your Profile' : 'Account Pending Approval'}
                </h3>
                <p className="text-xs text-amber-700 leading-relaxed">
                  {isProfileEmpty 
                    ? 'You skipped the initial setup. To start tracking dispatches and getting verified, please complete your professional profile.' 
                    : 'Our team is currently reviewing your profile and credentials. You will be notified via email once your account is fully operational.'}
                </p>
                {isProfileEmpty && (
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="mt-2 text-xs font-bold text-amber-900 hover:underline flex items-center gap-1"
                  >
                    Go to Profile <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'tracker' ? (
                <>
                  {clientProfile?.application_data && (
                    <ProfileDigest data={clientProfile.application_data} />
                  )}
                  <TrackerTab jobs={jobs} />
                </>
              ) : (
                <ProfileTab />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarContent({ activeTab, setActiveTab, clientProfile, userEmail }: any) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-10 px-2">
        <h1 className="text-2xl font-black text-blue-600 tracking-tight">KARYA</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Tracking</p>
      </div>

      <nav className="space-y-1 flex-1">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'tracker' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          Live Tracker
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'profile' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5" />
          My Profile
        </button>
      </nav>

      <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-blue-600 uppercase">
            {clientProfile?.application_data?.firstName?.[0] || userEmail?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              {clientProfile?.application_data?.firstName} {clientProfile?.application_data?.lastName}
            </p>
            <p className="text-[10px] font-medium text-slate-400 truncate uppercase tracking-wider">Candidate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
