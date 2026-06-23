import React, { useState, useEffect } from 'react';
import { useUserRole, ClientProfile } from '../contexts/UserRoleContext';
import { StatusDropdown } from './ui/StatusDropdown';
import { LoginBanner } from './ui/LoginBanner';
import {
  Users,
  Loader2,
  LogOut,
  Search,
  Briefcase,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Activity,
  Plus,
  RefreshCcw,
  Mail,
  Phone,
  MapPin,
  Target,
  Clock,
  Sparkles,
  Send,
  Zap,
  Building,
  GraduationCap,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  TrendingUp,
  History,
  Database,
  XCircle,
  CalendarDays,
  CalendarRange,
  Calendar,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function EmployeeDashboard() {
  const { user, logout } = useUserRole();
  const [activeView, setActiveView] = useState<'roster' | 'stats' | 'interviews'>('roster');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'list' | 'detail'>('list');
  const [interviewsFilter, setInterviewsFilter] = useState<'day' | 'week' | 'month'>('week');
  const [allClientApps, setAllClientApps] = useState<any[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Candidate State for Dossier
  const [selectedClientApps, setSelectedClientApps] = useState<any[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [dossierTab, setDossierTab] = useState<'details' | 'applications' | 'pipeline'>('details');

  // Overview popup modals
  const [overviewPopup, setOverviewPopup] = useState<'candidates' | 'pending' | null>(null);

  // Pipeline search & sort
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [pipelineSort, setPipelineSort] = useState<'latest' | 'oldest' | 'az'>('latest');

  // Job Application Form State
  const [entryMode, setEntryMode] = useState<'link' | 'manual'>('link');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isAddingApp, setIsAddingApp] = useState(false);

  // Access Restriction — any employee or admin role is authorized
  const isAuthorized = user && (user.role === 'employee' || user.role === 'admin');
  const isAdmin = user?.role === 'admin';

  const employeeId = (user as any)?.uid || null;

  // 1. Polling for all clients
  useEffect(() => {
    if (!user || !isAuthorized) return;

    let isMounted = true;
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        // Single request — server already includes jobs via Prisma include
        const res = await fetch('/api/clients', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const rawClients = await res.json();
        const allClients = rawClients.map((c: any) => ({
          ...c,
          application_data: c.application_data ?? c.applicationData ?? {},
          assigned_employee_id: c.assigned_employee_id ?? c.assignedEmployeeId ?? '',
        }));

        if (!isMounted) return;
        setClients(allClients);
        setLoading(false);

        // Auto-select first matching client if none selected
        if (allClients.length > 0 && !selectedClientId) {
          const matches = allClients.filter((c: any) => {
            if (!isAdmin && employeeId) return c.assignedEmployeeId === employeeId && c.status !== 'pending_approval' && c.status;
            return c.status !== 'pending_approval' && c.status;
          });
          const first = matches[0] || allClients[0];
          setSelectedClientId((first as any).uid || first.id);
        }

        // Derive allClientApps from embedded jobs — no extra requests
        const assignedClients = allClients.filter((c: any) => {
          if (!isAdmin && employeeId) return c.assignedEmployeeId === employeeId;
          return true;
        }).filter((c: any) => c.status !== 'pending_approval' && c.status);

        const appsFlat = assignedClients.flatMap((c: any) => {
          const cid = c.uid || c.id;
          const name = `${c.application_data?.firstName || ''} ${c.application_data?.lastName || ''}`.trim() || c.email || cid;
          return (c.jobs || []).map((a: any) => ({ ...a, clientName: name, clientId: cid }));
        });
        setAllClientApps(appsFlat);
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };

    fetchClients();
    // No polling — data only reloaded when user switches candidates
    return () => { isMounted = false; };
  }, [user, isAuthorized]);

  // 2. Derive selected candidate's apps from already-loaded clients — no extra fetch
  useEffect(() => {
    if (!selectedClientId) { setSelectedClientApps([]); return; }
    const client = clients.find((c: any) => (c as any).uid === selectedClientId || c.id === selectedClientId);
    if (client) {
      const apps = (client as any).jobs || [];
      setSelectedClientApps(
        [...apps].sort((a: any, b: any) =>
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        )
      );
      setIsLoadingApps(false);
    }
  }, [selectedClientId, clients]);

  if (!isAuthorized) {
    return (
      <div className="h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-10 font-sans karya-dashboard-theme border-t-4 border-cyan-500">
        <ShieldCheck className="w-16 h-16 mb-6 text-cyan-400" />
        <h1 className="text-2xl font-bold mb-2 tracking-tight text-white uppercase">Access Denied</h1>
        <p className="text-sm text-slate-400 font-medium text-center max-w-sm">
          Please contact the system administrator to unlock access privileges.
        </p>
        <button 
          onClick={() => logout()}
          className="mt-8 px-8 py-3 bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-cyan-500/10 cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // Filter candidates list based on search and roles
  const filteredCandidates = clients.filter(c => {
    if (!isAdmin && employeeId) {
      if (c.assigned_employee_id !== employeeId) return false;
    }
    const fullName = ((c.application_data?.firstName || "") + " " + (c.application_data?.lastName || "")).toLowerCase();
    const queryMatch = fullName.includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase());
    return c.status !== 'pending_approval' && c.status && queryMatch;
  });

  const pendingCount = clients.filter(c => c.status === 'pending_approval' || !c.status).length;
  const approvedCount = clients.filter(c => c.status === 'approved' || c.status === 'active').length;

  const handleApprove = async (clientId: string) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'approved' })
      });
      if (!res.ok) throw new Error("Approval failed on server");
      toast.success("Candidate record approved successfully.");
    } catch (err: any) {
      toast.error("Approval failed: " + err.message);
    }
  };

  // Job scrapers
  const handleAutoFill = async () => {
    if (!jobUrl || !jobUrl.startsWith('http')) {
      toast.error("Please provide a valid job link first.");
      return;
    }
    setIsParsing(true);
    try {
      const response = await fetch('/api/scrape-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl })
      });

      if (!response.ok) {
        throw new Error("Link scraping failed");
      }
      
      const data = await response.json();
      if (data.company) setCompany(data.company.toUpperCase());
      if (data.title) setRole(data.title.toUpperCase());
      if (data.location) setLocation(data.location.toUpperCase());
      
      if (data.company || data.title) {
        toast.success("Details extracted successfully!");
      } else {
        toast.error("Unable to extract. Please enter manually.");
      }
    } catch (err) {
      if (jobUrl.includes('naukri.com')) {
        try {
          const path = new URL(jobUrl).pathname;
          const meat = path.split('job-listings-')[1];
          if (meat) {
            const parts = meat.split('-');
            const bIndex = parts.indexOf('b');
            if (bIndex !== -1) {
              setRole(parts.slice(0, bIndex).join(' ').toUpperCase());
              setCompany(parts[bIndex + 1].toUpperCase());
              toast.success("Scraped via fallback parser.");
              setIsParsing(false);
              return;
            }
          }
        } catch (e) {}
      }
      toast.error("Could not auto-fill. Please type manually.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !company || !role) { toast.error("Company and role are required."); return; }
    setIsAddingApp(true);
    try {
      const token = localStorage.getItem('jwt_token');
      const selectedClient = clients.find(c => (c as any).uid === selectedClientId || c.id === selectedClientId);
      const clientPrismaId = (selectedClient as any)?.id;
      if (!clientPrismaId) throw new Error("Client record not found");
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clientId: clientPrismaId,
          company,
          role,
          status: 'Applied',
          appliedDate: new Date().toISOString().split('T')[0],
          jobUrl: jobUrl || null,
          location,
          salary,
        })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      const saved = await res.json();
      setSelectedClientApps(prev => [saved, ...prev]);
      setCompany(''); setRole(''); setLocation(''); setSalary(''); setJobUrl('');
      toast.success("Application saved successfully!");
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setIsAddingApp(false);
    }
  };

  const updateAppStatus = async (appId: string, status: string) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`/api/jobs/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Update failed');
      setSelectedClientApps(prev => prev.map(a => a.id === appId ? { ...a, status, updatedAt: new Date().toISOString() } : a));
      toast.success("Status updated.");
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message);
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!confirm("Delete this application record?")) return;
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`/api/jobs/${appId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Delete failed');
      setSelectedClientApps(prev => prev.filter(a => a.id !== appId));
      toast.success("Application removed.");
    } catch (err: any) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  const deleteClient = async (clientId: string) => {
    if (!confirm("Are you sure you want to permanently delete this candidate profile?")) return;
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`/api/users/${clientId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Delete failed'); }
      setClients(prev => prev.filter(c => (c as any).uid !== clientId && c.id !== clientId));
      setSelectedClientId(null);
      toast.success("Candidate deleted successfully.");
    } catch (err: any) {
      toast.error("Delete failed: " + err.message);
    }
  };

  const selectedClient = clients.find(c => (c as any).uid === selectedClientId || c.id === selectedClientId);
  const appData = selectedClient?.application_data || {};

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 font-sans karya-dashboard-theme overflow-hidden flex flex-col">

      {/* Interview notification banner */}
      <LoginBanner
        role="employee"
        userName={user?.displayName || user?.email || ''}
        token={localStorage.getItem('jwt_token')}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* COLUMN 1: LEFT NAVIGATION */}
      <aside className={`${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative inset-y-0 left-0 w-64 bg-white border-r border-slate-100 flex flex-col shrink-0 z-50 transition-transform duration-300`}>

        {/* Brand Logo */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-black text-sm">K</div>
            <div>
              <h1 className="text-xl font-black text-indigo-600 tracking-tight leading-none font-display">KARYA</h1>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1 block">Consultant Space</span>
            </div>
          </div>
          <button onClick={() => setMobileNavOpen(false)} className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700">✕</button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {([
            { id: 'stats', label: 'Overview', icon: TrendingUp, badge: 0 },
            { id: 'roster', label: 'Candidate Roster', icon: Users, badge: 0 },
            { id: 'interviews', label: 'Interviews', icon: CalendarDays, badge: allClientApps.filter(a => a.status === 'Interview').length }
          ] as { id: string; label: string; icon: any; badge: number }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveView(tab.id as any);
                if (tab.id !== 'interviews') {
                  const matches = clients.filter(c => {
                    if (!isAdmin && employeeId && c.assigned_employee_id !== employeeId) return false;
                    return c.status !== 'pending_approval' && c.status;
                  });
                  if (matches.length > 0) {
                    setSelectedClientId((matches[0] as any).uid || matches[0].id);
                  } else {
                    setSelectedClientId(null);
                  }
                }
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all",
                activeView === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-sm'
                  : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-700'
              )}
            >
              <div className="flex items-center gap-3">
                <tab.icon className={cn("w-4 h-4", activeView === tab.id ? "text-white" : "text-slate-400")} />
                <span>{tab.label}</span>
              </div>
              {tab.badge > 0 && (
                <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-md text-[9px] font-black font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-0.5 leading-none">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Consultant</span>
                {employeeId && (
                  <span className="text-[9px] text-indigo-500 font-bold font-mono">ID: {employeeId}</span>
                )}
              </div>
            </div>
            <button 
              onClick={() => logout()}
              className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* RENDER VIEW 1: STATS OVERVIEW */}
      {activeView === 'stats' && (
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8 space-y-8 custom-scrollbar">
          {/* Mobile hamburger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setMobileNavOpen(true)} className="p-2 bg-white border border-slate-200 rounded-lg">
              <span className="text-lg leading-none">☰</span>
            </button>
            <span className="font-black text-slate-700 text-sm uppercase tracking-widest">Overview</span>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">System Metrics Overview</h2>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Telemetry details for Karya operational network</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setOverviewPopup('candidates')}
              className="p-6 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-2xl space-y-4 shadow-xl transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Candidates Registered</span>
                <div className="p-2 bg-slate-950 rounded-lg text-cyan-400 group-hover:bg-cyan-500/10 transition-all"><Users className="w-4 h-4" /></div>
              </div>
              <p className="text-3xl font-black text-white tracking-tight tabular-nums">{filteredCandidates.length}</p>
              <span className="text-[10px] font-bold text-cyan-400 font-mono">Click to view assigned candidates</span>
            </button>

            <button
              onClick={() => setOverviewPopup('pending')}
              className={cn(
                "p-6 bg-slate-900 border rounded-2xl space-y-4 shadow-xl transition-all text-left group cursor-pointer",
                pendingCount > 0 ? "border-yellow-500/30 hover:border-yellow-400/60 animate-pulse" : "border-slate-800 hover:border-yellow-500/40"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pending Approvals</span>
                <div className="p-2 bg-slate-950 rounded-lg text-yellow-400 group-hover:bg-yellow-500/10 transition-all"><Clock className="w-4 h-4" /></div>
              </div>
              <p className="text-3xl font-black text-white tracking-tight tabular-nums">{pendingCount}</p>
              <span className="text-[10px] font-bold text-yellow-400 font-mono">Click to view awaiting approvals</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Activity className="w-4 h-4 text-cyan-400" /> System Integrity Status
              </h3>
              <div className="space-y-3">
                 <SystemCheckItem label="Karya Candidate Profile Manager" active />
                 <SystemCheckItem label="Job Application Pipeline Feed" active />
                 <SystemCheckItem label="Scrapper Auto-Extraction Service" active />
              </div>
            </div>

            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-center items-center text-center space-y-6">
               <div className="w-16 h-16 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800">
                 <Briefcase className="w-8 h-8 text-slate-600" />
               </div>
               <div className="space-y-1">
                 <h4 className="text-sm font-black text-white uppercase tracking-wider">Dual Core Dispatch CRM</h4>
                 <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                   Karya integrates scraping capabilities with simple interface forms to optimize candidates pipeline workflows.
                 </p>
               </div>
            </div>
          </div>
        </main>
      )}

      {/* RENDER VIEW: INTERVIEWS */}
      {activeView === 'interviews' && (() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now); monthStart.setDate(monthStart.getDate() - 30);

        const interviewApps = allClientApps.filter(a => a.status === 'Interview');
        const filterDate = interviewsFilter === 'day' ? todayStart : interviewsFilter === 'week' ? weekStart : monthStart;
        const filteredInterviews = interviewApps.filter(a => {
          const d = new Date(a.updatedAt || a.createdAt || now);
          return d >= filterDate;
        });

        const grouped: Record<string, any[]> = {};
        filteredInterviews.forEach(app => {
          const dateKey = new Date(app.updatedAt || app.createdAt || now).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(app);
        });

        return (
          <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8 space-y-8 custom-scrollbar">
            <div className="flex items-center gap-3 lg:hidden mb-2">
              <button onClick={() => setMobileNavOpen(true)} className="p-2 bg-white border border-slate-200 rounded-lg">
                <span className="text-lg leading-none">☰</span>
              </button>
              <span className="font-black text-slate-700 text-sm uppercase tracking-widest">Interviews</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Interviews</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  {filteredInterviews.length} interview{filteredInterviews.length !== 1 ? 's' : ''} · {interviewsFilter === 'day' ? 'Today' : interviewsFilter === 'week' ? 'Last 7 days' : 'Last 30 days'}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                {(['day', 'week', 'month'] as const).map(f => (
                  <button key={f} onClick={() => setInterviewsFilter(f)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
                      interviewsFilter === f ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-indigo-600'
                    )}>
                    {f === 'day' ? 'Today' : f === 'week' ? 'Week' : 'Month'}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-purple-100 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Interviews</p>
                <p className="text-3xl font-black text-slate-800">{interviewApps.length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-indigo-100 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">In This Period</p>
                <p className="text-3xl font-black text-slate-800">{filteredInterviews.length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-cyan-100 p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Today</p>
                <p className="text-3xl font-black text-slate-800">
                  {interviewApps.filter(a => new Date(a.updatedAt || a.createdAt || now) >= todayStart).length}
                </p>
              </div>
            </div>

            {/* Day-grouped interview list */}
            {Object.keys(grouped).length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No interviews in this period</p>
                {allClientApps.length === 0 && (
                  <p className="text-slate-300 text-[10px] mt-2 font-mono">Loading candidate data...</p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([date, apps]) => (
                  <div key={date} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-indigo-500" />
                        <h3 className="text-sm font-black text-indigo-800">{date}</h3>
                      </div>
                      <span className="text-xs font-black text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">{apps.length}</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {apps.map(app => (
                        <div key={app.id} className="px-6 py-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                              <Briefcase className="w-4 h-4 text-purple-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-sm truncate">{app.role}</p>
                              <p className="text-xs text-slate-500 font-mono truncate">{app.company} · <span className="text-indigo-600">{app.clientName}</span></p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {app.location && (
                              <span className="text-xs text-slate-400 hidden sm:block">{app.location}</span>
                            )}
                            <select
                              value={app.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                try {
                                  const token = localStorage.getItem('jwt_token');
                                  const res = await fetch(`/api/jobs/${app.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                    body: JSON.stringify({ status: newStatus })
                                  });
                                  if (!res.ok) throw new Error('Update failed');
                                  setAllClientApps(prev => prev.map(a => a.id === app.id ? { ...a, status: newStatus } : a));
                                  toast.success(`Status updated to ${newStatus}`);
                                } catch {
                                  toast.error('Failed to update status');
                                }
                              }}
                              className="appearance-none bg-purple-50 border border-purple-200 text-purple-700 rounded-xl pl-3 pr-8 py-1.5 text-xs font-black uppercase tracking-wider cursor-pointer outline-none"
                            >
                              <option value="Applied"    style={{background:'#1e3a5f',color:'#60a5fa'}}>Applied</option>
                              <option value="Interview"  style={{background:'#451a03',color:'#fbbf24'}}>Interview</option>
                              <option value="Assessment" style={{background:'#2e1065',color:'#c084fc'}}>Assessment</option>
                              <option value="Selected"   style={{background:'#052e16',color:'#34d399'}}>Selected</option>
                              <option value="Rejected"   style={{background:'#450a0a',color:'#f87171'}}>Rejected</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        );
      })()}

      {/* RENDER DUAL VIEWS: ROSTER */}
      {(activeView === 'roster') && (
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* COLUMN 2: CANDIDATE LIST — hidden on mobile when detail is open */}
          <aside className={`${mobilePanel === 'detail' ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 bg-slate-900 border-r border-slate-800 flex-col shrink-0`}>

            <div className="p-4 lg:p-6 border-b border-slate-800 bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setMobileNavOpen(true)} className="lg:hidden p-1.5 bg-slate-800 rounded-lg text-slate-400">☰</button>
                  <span className="text-xs font-black text-white uppercase tracking-widest">Candidate Profiles</span>
                </div>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-bold px-2 py-0.5 rounded-full font-mono">
                  {filteredCandidates.length}
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search candidate name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            {/* Candidates Lists */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <div className="p-10 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="text-center p-10 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                    No candidates found.
                  </div>
                ) : (
                  filteredCandidates.map(candidate => {
                    const candidateKey = (candidate as any).uid || candidate.id;
                    const isSelected = selectedClientId === candidateKey;
                    return (
                      <motion.button
                        key={candidate.id}
                        layoutId={`candidate-${candidate.id}`}
                        onClick={() => { setSelectedClientId(candidateKey); setMobilePanel('detail'); }}
                        className={cn(
                          "w-full text-left p-4 rounded-xl transition-all border shrink-0 text-slate-200",
                          isSelected 
                            ? "bg-slate-800/80 border-cyan-500 shadow-lg shadow-cyan-500/5 text-white" 
                            : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border transition-all shrink-0",
                            isSelected 
                              ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 font-bold" 
                              : "bg-slate-950 border-slate-800 text-slate-400"
                          )}>
                            {candidate.application_data?.firstName?.[0] || 'C'}{candidate.application_data?.lastName?.[0] || 'K'}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold truncate text-white leading-tight">
                              {candidate.application_data?.firstName} {candidate.application_data?.lastName}
                            </h4>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 tracking-wider font-mono">
                              <span className="truncate max-w-[120px]">{candidate.id.slice(0, 10)}</span>
                              {candidate.assigned_employee_id && (
                                <span className={cn(
                                  "font-bold uppercase rounded px-1.5 py-0.5 border",
                                  isSelected ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" : "text-slate-500 bg-slate-950 border-slate-800"
                                )}>
                                  ID: {candidate.assigned_employee_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </aside>

          {/* COLUMN 3: CANDIDATE DOSSIER — hidden on mobile when list is shown */}
          <section className={`${mobilePanel === 'list' ? 'hidden lg:flex' : 'flex'} flex-1 overflow-hidden bg-slate-950 flex-col`}>
            {selectedClient ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">

                {/* Dossier Header */}
                <div className="p-4 lg:p-6 border-b border-slate-900 bg-slate-950 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3 lg:gap-4">
                    {/* Mobile back button */}
                    <button onClick={() => setMobilePanel('list')} className="lg:hidden p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white shrink-0">
                      ←
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-lg font-mono">
                      {appData.firstName?.[0] || 'C'}{appData.lastName?.[0] || 'K'}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white leading-none">
                        {appData.firstName} {appData.lastName}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold leading-none">
                        <span>Profile // {selectedClient.status || 'Active'}</span>
                        <span className="text-slate-700">|</span>
                        <span>Salary Target: {appData.expectedCTC ? `${appData.expectedCTC}` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Approve button if pending approvals view */}
                    {activeView === 'approvals' && (
                      <button 
                        onClick={() => handleApprove((selectedClient as any).uid || selectedClient.id)}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 outline-none text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                      >
                        Approve Candidate
                      </button>
                    )}

                    <button 
                      onClick={() => deleteClient((selectedClient as any).uid || selectedClient.id)}
                      className="p-2 bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-slate-800 rounded-xl transition-all"
                      title="Permanently remove candidate profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-slate-900 bg-slate-950 shrink-0 flex gap-4">
                  {[
                    { id: 'details', label: 'Candidate Profile' },
                    { id: 'applications', label: 'Job Applications' },
                    { id: 'pipeline', label: 'Application Pipeline' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDossierTab(tab.id as any)}
                      className={cn(
                        "py-3.5 px-2 text-xs font-bold border-b-2 tracking-wide transition-all outline-none",
                        dossierTab === tab.id 
                          ? "border-cyan-500 text-cyan-400 font-extrabold" 
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950">
                  <div className="p-8">
                    <AnimatePresence mode="wait">
                      
                      {dossierTab === 'details' && (
                        <motion.div
                          key="dossier-tab-details"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                          {/* Main Info Card */}
                          <div className="space-y-6">
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                              <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800/80 pb-3">
                                Candidate Contact
                              </h4>

                              <div className="space-y-4">
                                <DetailColumn label="Email Address" value={selectedClient.email || appData.email} icon={<Mail className="w-4 h-4" />} />
                                <DetailColumn label="Phone Number" value={appData.phone} icon={<Phone className="w-4 h-4" />} />
                                <DetailColumn label="Date of Birth" value={appData.dob} icon={<Calendar className="w-4 h-4" />} />
                                <DetailColumn label="Aadhar Number" value={appData.aadharNumber} icon={<CreditCard className="w-4 h-4" />} />
                                <DetailColumn label="PAN Number" value={appData.panNumber} icon={<CreditCard className="w-4 h-4" />} />
                                <DetailColumn label="Permanent Address" value={appData.permanentAddress} icon={<MapPin className="w-4 h-4" />} />
                                <DetailColumn label="Preferred Job Location" value={appData.preferredLocation} icon={<MapPin className="w-4 h-4" />} />
                                <DetailColumn label="Target Job Roles" value={appData.targetRoles?.join(', ')} icon={<Target className="w-4 h-4" />} />
                              </div>
                            </div>

                            {/* Skills/Experience Grid (Small metric boxes with white text) */}
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                              <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800/80 pb-3">
                                Professional Insights
                              </h4>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <InsightCard label="Total Experience" value={appData.experience || 'N/A'} desc="Industry Experience" />
                                <InsightCard label="Current Domain" value={appData.domain || 'N/A'} desc="Expertise Sector" />
                                <InsightCard label="Current Salary" value={appData.currentCTC || 'N/A'} desc="CTC Statistics" />
                                <InsightCard label="Expected Salary" value={appData.expectedCTC || 'N/A'} desc="Demanded Package" />
                              </div>
                            </div>

                            {/* Professional Skills segment */}
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
                              <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800/80 pb-3">
                                core skills & Tech stack
                              </h4>
                              <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                                {appData.skills || "No specific skillset listed."}
                              </p>
                            </div>
                          </div>

                          {/* Secondary Dossier Info */}
                          <div className="space-y-6">
                            {/* Academic history */}
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                              <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800/80 pb-3 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-purple-400" /> Education Background
                              </h4>
                              <div className="space-y-2">
                                <p className="text-sm font-bold text-white uppercase tracking-wide leading-snug">
                                  {appData.education?.degree || 'No Degree Listed'}
                                </p>
                                {appData.education?.department && (
                                  <p className="text-xs text-blue-400 font-black uppercase tracking-widest">
                                    {appData.education.department}
                                  </p>
                                )}
                                <p className="text-xs text-slate-400 font-mono">
                                  {appData.education?.college || 'No University/College'}
                                </p>
                                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mt-1">
                                  Class of {appData.education?.year || 'N/A'}
                                </p>
                                {appData.education?.cgpa && (
                                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                    CGPA / Score: {appData.education.cgpa}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Resume / Work history */}
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                              <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800/80 pb-3">
                                Detailed Work History
                              </h4>
                              <div className="text-xs font-mono text-slate-400 leading-relaxed max-h-[350px] overflow-y-auto custom-scrollbar whitespace-pre-wrap p-3 bg-slate-950 rounded-lg border border-slate-800/55">
                                {appData.workHistory || "No detailed work history provided."}
                              </div>
                            </div>
                          </div>

                        </motion.div>
                      )}

                      {dossierTab === 'applications' && (
                        <motion.div
                          key="dossier-tab-apps"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="grid grid-cols-1 lg:grid-cols-1 gap-8"
                        >
                          {/* Create vacancy log form */}
                          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                              <div>
                                <h4 className="text-xs font-black text-white uppercase tracking-widest">
                                  Add Job Application
                                </h4>
                                <span className="text-[10px] text-slate-500 uppercase mt-0.5 block">Log new vacancy tracks and auto-fill details</span>
                              </div>

                              <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
                                <button
                                  type="button" onClick={() => setEntryMode('link')}
                                  className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", entryMode === 'link' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-400")}
                                >
                                  Paste Link
                                </button>
                                <button
                                  type="button" onClick={() => setEntryMode('manual')}
                                  className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", entryMode === 'manual' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-400")}
                                >
                                  Manual
                                </button>
                              </div>
                            </div>

                            <form onSubmit={handleCreateApplication} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Company Name</label>
                                  <input 
                                    type="text" placeholder="E.G. GOOGLE" value={company} onChange={e => setCompany(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white uppercase focus:border-cyan-500 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Job Title / Role</label>
                                  <input 
                                    type="text" placeholder="E.G. SOFTWARE ENGINEER" value={role} onChange={e => setRole(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white uppercase focus:border-cyan-500 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Region / Location</label>
                                  <input 
                                    type="text" placeholder="E.G. LONDON, UK" value={location} onChange={e => setLocation(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white uppercase focus:border-cyan-500 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Offered Salary</label>
                                  <input 
                                    type="text" placeholder="E.G. $140,000" value={salary} onChange={e => setSalary(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white uppercase focus:border-cyan-500 focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-4 items-end">
                                <div className="flex-1 space-y-1.5">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Job Link / Source URL</label>
                                  <div className="relative">
                                    <input 
                                      type="url" placeholder="https://external-careers.com/vacancy-job" value={jobUrl} onChange={e => setJobUrl(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-2.5 text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                    {jobUrl && jobUrl.startsWith('http') && (
                                      <button
                                        type="button" onClick={handleAutoFill} disabled={isParsing}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                                      >
                                        {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="submit" disabled={isAddingApp}
                                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 outline-none text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center transition-all h-[38px] cursor-pointer disabled:opacity-50"
                                >
                                  {isAddingApp ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Send className="w-4 h-4" />}
                                  <span className="ml-2">Save Application</span>
                                </button>
                              </div>
                            </form>
                          </div>


                        </motion.div>
                      )}

                      {dossierTab === 'pipeline' && (
                        <motion.div
                          key="dossier-tab-pipeline"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between gap-3 px-1">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">
                              Application Pipeline — {selectedClientApps.length} {selectedClientApps.length === 1 ? 'Application' : 'Applications'}
                            </h4>
                            <select
                              value={pipelineSort}
                              onChange={e => setPipelineSort(e.target.value as any)}
                              className="text-[9px] font-black uppercase tracking-widest bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 cursor-pointer outline-none focus:border-cyan-500/50"
                            >
                              <option value="latest">Latest First</option>
                              <option value="oldest">Oldest First</option>
                              <option value="az">A → Z (Company)</option>
                            </select>
                          </div>

                          {/* Search bar */}
                          <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              placeholder="Search by company, role, status..."
                              value={pipelineSearch}
                              onChange={e => setPipelineSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500/50 transition-colors"
                            />
                            {pipelineSearch && (
                              <button onClick={() => setPipelineSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                <span className="text-xs">✕</span>
                              </button>
                            )}
                          </div>

                          {isLoadingApps ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                              <p className="text-slate-500 uppercase font-bold text-[11px] tracking-widest">Loading applications...</p>
                            </div>
                          ) : selectedClientApps.length > 0 ? (
                            <div className="space-y-3">
                              {(() => {
                                const q = pipelineSearch.toLowerCase();
                                const sorted = [...selectedClientApps].sort((a, b) => {
                                  if (pipelineSort === 'az')     return (a.company || '').localeCompare(b.company || '');
                                  if (pipelineSort === 'oldest') return new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime();
                                  return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
                                });
                                const filtered = sorted.filter(a => !q || a.company?.toLowerCase().includes(q) || a.role?.toLowerCase().includes(q) || a.status?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q));
                                if (filtered.length === 0) return (
                                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                                    <Search className="w-8 h-8 text-slate-700" />
                                    <p className="text-slate-500 uppercase font-bold text-[11px] tracking-widest">{q ? `No results for "${pipelineSearch}"` : 'No applications'}</p>
                                  </div>
                                );
                                return filtered.map(app => (
                                <div key={app.id} className={cn(
                                  "p-5 border rounded-2xl flex items-center justify-between gap-4 shadow-xl",
                                  app.status === 'Applied'    ? 'bg-slate-900 border-blue-500/30' :
                                  app.status === 'Interview'  ? 'bg-slate-900 border-amber-500/30' :
                                  app.status === 'Assessment' ? 'bg-slate-900 border-purple-500/30' :
                                  app.status === 'Selected'   ? 'bg-slate-900 border-emerald-500/30' :
                                  app.status === 'Rejected'   ? 'bg-slate-900 border-red-500/30' :
                                  'bg-slate-900 border-slate-800'
                                )}>
                                  <div className="flex-1 min-w-0 grid grid-cols-2 lg:grid-cols-5 gap-6 items-center">
                                    <div className="lg:col-span-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={cn(
                                          "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                          app.status === 'Applied'    ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' :
                                          app.status === 'Interview'  ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                                          app.status === 'Assessment' ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' :
                                          app.status === 'Selected'   ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                                          app.status === 'Rejected'   ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                                          'text-slate-400 bg-slate-800 border-slate-700'
                                        )}>
                                          <span className={cn(
                                            "w-1.5 h-1.5 rounded-full mr-1.5",
                                            app.status === 'Applied'    ? 'bg-blue-400' :
                                            app.status === 'Interview'  ? 'bg-amber-400' :
                                            app.status === 'Assessment' ? 'bg-purple-400' :
                                            app.status === 'Selected'   ? 'bg-emerald-400' :
                                            app.status === 'Rejected'   ? 'bg-red-400' :
                                            'bg-slate-500'
                                          )} />
                                          {app.status}
                                        </span>
                                      </div>
                                      <h5 className="font-bold text-white uppercase truncate text-sm leading-tight">{app.role}</h5>
                                      <p className="text-[11px] text-cyan-400 uppercase font-black font-mono mt-1 leading-none">{app.company}</p>
                                    </div>
                                    <div>
                                      <span className="block text-[9px] text-slate-500 uppercase tracking-wider leading-none">Location</span>
                                      <span className="text-xs font-semibold text-slate-300 block mt-1.5 truncate">{app.location || '—'}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[9px] text-slate-500 uppercase tracking-wider leading-none">Salary</span>
                                      <span className="text-xs font-semibold text-slate-300 block mt-1.5">{app.salary || '—'}</span>
                                      <span className="text-[10px] font-mono text-slate-500 block mt-0.5">{app.appliedDate || app.applied_date || ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {(app.jobUrl || app.job_url) && (
                                        <a href={app.jobUrl || app.job_url} target="_blank" rel="noreferrer"
                                          className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 rounded-lg transition-all"
                                          title="Open job posting">
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 border-l border-slate-800 pl-4 shrink-0">
                                    <StatusDropdown
                                      value={app.status}
                                      onChange={val => updateAppStatus(app.id, val)}
                                    />
                                    <button
                                      onClick={() => handleDeleteApplication(app.id)}
                                      className="p-2 bg-slate-950 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-slate-800 rounded-xl transition-all"
                                      title="Remove application"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ));
                              })()}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                                <Briefcase className="w-8 h-8 text-slate-700" />
                              </div>
                              <p className="text-slate-500 uppercase font-bold text-[11px] tracking-widest">No applications logged yet for this candidate.</p>
                            </div>
                          )}
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4 bg-slate-950">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <Database className="w-8 h-8 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">No Profile Selected</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 uppercase tracking-widest font-mono">Select a candidate index from the left roster list</p>
                </div>
              </div>
            )}
          </section>

        </div>
      )}

      {/* OVERVIEW POPUPS */}
      <AnimatePresence>
        {overviewPopup && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setOverviewPopup(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className={`p-6 border-b flex items-center justify-between ${overviewPopup === 'candidates' ? 'bg-indigo-500 border-indigo-400' : 'border-slate-800'}`}>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: '#ffffff' }}>
                    {overviewPopup === 'candidates' ? 'Assigned Candidates' : 'Pending Approvals'}
                  </h3>
                  <p className="text-[10px] uppercase tracking-widest font-mono mt-1" style={{ color: overviewPopup === 'candidates' ? 'rgba(255,255,255,0.75)' : undefined }}>
                    {overviewPopup === 'candidates'
                      ? `${filteredCandidates.length} candidate${filteredCandidates.length !== 1 ? 's' : ''} assigned to you`
                      : `${pendingCount} awaiting approval`}
                  </p>
                </div>
                <button onClick={() => setOverviewPopup(null)} className="p-2 rounded-xl transition-all hover:bg-white/20" style={{ color: overviewPopup === 'candidates' ? 'rgba(255,255,255,0.8)' : undefined }}>
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2">
                {overviewPopup === 'candidates' && (
                  filteredCandidates.length === 0 ? (
                    <p className="text-center py-10 text-slate-500 uppercase text-xs font-bold tracking-widest">No candidates assigned yet.</p>
                  ) : filteredCandidates.map(c => (
                    <button
                      key={(c as any).uid || c.id}
                      onClick={() => { setSelectedClientId((c as any).uid || c.id); setActiveView('roster'); setOverviewPopup(null); }}
                      className="w-full flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 hover:border-cyan-500/40 rounded-2xl transition-all text-left group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-black shrink-0">
                        {c.application_data?.firstName?.[0] || '?'}{c.application_data?.lastName?.[0] || ''}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                          {c.application_data?.firstName} {c.application_data?.lastName}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{(c as any).email || 'No email'}</p>
                      </div>
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded border",
                        c.status === 'active' || c.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-800 border-slate-700'
                      )}>{c.status || 'Active'}</span>
                    </button>
                  ))
                )}
                {overviewPopup === 'pending' && (
                  (() => {
                    const pending = clients.filter(c => {
                      if (!isAdmin && employeeId && (c as any).assigned_employee_id !== employeeId) return false;
                      return c.status === 'pending_approval' || !c.status;
                    });
                    return pending.length === 0 ? (
                      <p className="text-center py-10 text-slate-500 uppercase text-xs font-bold tracking-widest">No pending approvals.</p>
                    ) : pending.map(c => (
                      <div key={(c as any).uid || c.id} className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                        <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 text-xs font-black shrink-0">
                          {c.application_data?.firstName?.[0] || '?'}{c.application_data?.lastName?.[0] || ''}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white truncate">
                            {c.application_data?.firstName} {c.application_data?.lastName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{(c as any).email || 'No email'}</p>
                        </div>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border text-yellow-400 bg-yellow-500/10 border-yellow-500/20">Pending</span>
                      </div>
                    ));
                  })()
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div> {/* end inner flex row */}
    </div>
  );
}

// Helpers components
function StatBox({ label, value, icon, color, trend, isDanger }: any) {
  return (
    <div className={cn(
      "p-6 bg-slate-900 border rounded-2xl space-y-4 shadow-xl transition-all relative overflow-hidden",
      isDanger ? "border-red-500/20 animate-pulse bg-red-950/10" : "border-slate-800 hover:border-slate-700"
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
        <div className={cn("p-2 bg-slate-950 rounded-lg w-fit", color)}>{icon}</div>
      </div>
      <div>
        <p className="text-3xl font-black text-white tracking-tight tabular-nums">{value}</p>
        {trend && <span className="text-[10px] font-bold text-cyan-400 mt-2 block font-mono">{trend}</span>}
      </div>
    </div>
  );
}

function DetailColumn({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="space-y-1.5 group">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">{label}</span>
      <div className="p-3 bg-slate-950 border border-slate-800/80 hover:border-cyan-500/30 rounded-xl flex items-center gap-3 transition-colors">
        <div className="text-slate-500 group-hover:text-cyan-400 transition-colors">{icon}</div>
        <span className="text-xs font-bold font-mono text-slate-200 truncate flex-1 select-all">{value || 'NOT SPECIFIED'}</span>
        {value && <CopyLinkBtn value={value} />}
      </div>
    </div>
  );
}

function InsightCard({ label, value, desc }: { label: string; value: string; desc?: string }) {
  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1 hover:border-cyan-500/20 transition-colors">
      <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block leading-none">{label}</span>
      <span className="text-xs font-black text-white uppercase truncate block leading-snug">{value}</span>
      {desc && <span className="text-[7px] text-slate-600 uppercase font-mono block leading-none mt-1">{desc}</span>}
    </div>
  );
}

function SystemCheckItem({ label, active }: { label: string, active: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800/80 hover:border-cyan-500/10 transition-all shadow-sm">
      <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest font-mono">operational</span>
      </div>
    </div>
  );
}

function CopyLinkBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button 
      type="button" onClick={handleCopy}
      className="p-1 px-1.5 rounded bg-slate-900 border border-slate-800/80 hover:border-cyan-500/30 text-slate-500 hover:text-cyan-400 transition-all cursor-pointer"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400 animate-bounce" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}
