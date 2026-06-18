import React, { useState, useEffect } from 'react';
import { useUserRole, ClientProfile } from '../contexts/UserRoleContext';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  Database,
  Search,
  Activity,
  Trash2,
  ChevronRight,
  ChevronDown,
  LogOut,
  AlertTriangle,
  ExternalLink,
  Target,
  Clock,
  Filter,
  User,
  Zap,
  Link2,
  Briefcase,
  TrendingUp,
  History,
  Phone,
  Mail,
  MapPin,
  Building,
  GraduationCap,
  Sparkles,
  Send,
  Plus,
  RefreshCcw,
  Check,
  Copy,
  BarChart2,
  Award,
  Calendar,
  CalendarDays,
  CalendarRange
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const { user, logout } = useUserRole();
  const navigate = useNavigate();
  
  // App States
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'approvals' | 'analytics' | 'interviews'>('overview');
  const [interviewsFilter, setInterviewsFilter] = useState<'day' | 'week' | 'month'>('week');
  const [analyticsFilter, setAnalyticsFilter] = useState<'day' | 'week' | 'month' | 'all'>('all');
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [globalApps, setGlobalApps] = useState<any[]>([]);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [isCreatingCounselor, setIsCreatingCounselor] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCounselorName, setNewCounselorName] = useState("");
  const [newCounselorEmail, setNewCounselorEmail] = useState("");
  const [newCounselorPassword, setNewCounselorPassword] = useState("");
  const [newCounselorCredentials, setNewCounselorCredentials] = useState<any>(null);
  const [expandedCounselorId, setExpandedCounselorId] = useState<string | null>(null);
  
  // Selected Candidate State for Dossier
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientApps, setSelectedClientApps] = useState<any[]>([]);
  const [dossierTab, setDossierTab] = useState<'details' | 'applications'>('details');

  // Approve + Assign Counselor Popup
  const [approvePopupUid, setApprovePopupUid] = useState<string | null>(null);
  const [approvePopupAssignId, setApprovePopupAssignId] = useState('');

  // Job Application Form State
  const [entryMode, setEntryMode] = useState<'link' | 'manual'>('link');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isAddingApp, setIsAddingApp] = useState(false);

  const [clientStats, setClientStats] = useState<Record<string, any>>({});

  // Global Analytics
  const [globalStats, setGlobalStats] = useState({
    totalApplied: 0,
    totalCandidates: 0,
    totalInterviews: 0,
    appliedToday: 0
  });

  // Access Restriction
  const authorizedEmails = ["karya.ai.admin@gmail.com", "karya.secret.admin@gmail.com", "avinashmurari3@gmail.com", "mkarthikeya24@gmail.com", "kbsn1170@gmail.com"];
  const isAuthorized = user && authorizedEmails.includes(user.email?.toLowerCase() || "");

  // Auto-assign to counselor with fewest candidates (uses real UIDs from counselors state)
  const calculateAssignment = () => {
    if (counselors.length === 0) return null;
    const counts = counselors.map((c: any) => ({
      uid: c.uid,
      count: clients.filter(cl => (cl as any).assignedEmployeeId === c.uid || cl.assigned_employee_id === c.uid).length
    }));
    counts.sort((a, b) => a.count - b.count);
    return counts[0].uid;
  };

  // 1. Polling for Clients
  useEffect(() => {
    if (!user || !isAuthorized) return;

    let isMounted = true;
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const res = await fetch('/api/clients', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to fetch clients');
        const rawList = await res.json();
        // Normalize camelCase Prisma fields → snake_case expected by render code
        const clientList = rawList.map((c: any) => ({
          ...c,
          application_data: c.application_data ?? c.applicationData ?? {},
          assigned_employee_id: c.assigned_employee_id ?? c.assignedEmployeeId ?? '',
        }));

        if (!isMounted) return;
        setClients(clientList);
        setLoading(false);

        // Auto-select first non-incomplete client if none selected
        if (clientList.length > 0 && !selectedClientId) {
          const approvedClients = clientList.filter((c: any) => c.status !== 'incomplete' && c.status !== 'pending_approval');
          if (approvedClients.length > 0) {
            setSelectedClientId(approvedClients[0].uid || approvedClients[0].id);
          } else {
            setSelectedClientId(clientList[0].uid || clientList[0].id);
          }
        }

        let applied = 0, interviews = 0, appliedToday = 0;
        const stats: Record<string, any> = {};
        const allApps: any[] = [];
        const today = new Date().toISOString().split('T')[0];
        
        for (const client of clientList) {
          const cid = client.uid || client.id;
          const jobsRes = await fetch(`/api/jobs/${cid}`, { headers: { Authorization: `Bearer ${token}` } });
          const trackersSnap = jobsRes.ok ? await jobsRes.json() : [];
          
          const cStats = { applied: 0, interviews: 0, selected: 0 };

          trackersSnap.forEach((data: any) => {
            const appData = client.application_data || client.applicationData || {};
            const clientName = `${appData.firstName || ''} ${appData.lastName || ''}`.trim() || client.email || cid;
            const app = { ...data, clientName, clientId: cid };
            allApps.push(app);

            if (data.status === 'Applied') { applied++; cStats.applied++; }
            if (data.status === 'Interview') { interviews++; cStats.interviews++; }
            if (data.status === 'Selected') cStats.selected++;
            if (data.appliedDate === today) appliedToday++;
          });

          stats[cid] = cStats;
        }
        
        setClientStats(stats);
        setGlobalApps(allApps.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setGlobalStats({
          totalApplied: applied,
          totalCandidates: clientList.length,
          totalInterviews: interviews,
          appliedToday
        });

        if (user?.role === 'admin') {
          const cRes = await fetch('/api/users/counselors', { headers: { Authorization: `Bearer ${token}` } });
          if (cRes.ok) {
            setCounselors(await cRes.json());
          }
        }
        
        if (isMounted) setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        if (isMounted) setLoading(false);
      }
    };

    fetchClients();
    const interval = setInterval(fetchClients, 15000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [user, isAuthorized, selectedClientId]);

  // 2. Polling Listener for Selected Client Applications
  useEffect(() => {
    if (!selectedClientId) {
      setSelectedClientApps([]);
      return;
    }
    
    let isMounted = true;
    const fetchApps = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const res = await fetch(`/api/jobs/${selectedClientId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const apps = await res.json();
        if (isMounted) {
          setSelectedClientApps(apps.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchApps();
    const interval = setInterval(fetchApps, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [selectedClientId]);

  const handleStatusUpdate = async (clientUid: string, status: string, forcedAssignId?: string) => {
    try {
      const updateData: any = { status };

      if (status === 'active' || status === 'approved') {
        if (forcedAssignId) {
          updateData.assignedEmployeeId = forcedAssignId;
        } else {
          const client = clients.find(c => (c as any).uid === clientUid || c.id === clientUid);
          if (!client?.assigned_employee_id && !(client as any)?.assignedEmployeeId) {
            const assignedId = calculateAssignment();
            updateData.assignedEmployeeId = assignedId;
          }
        }
      }

      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`/api/clients/${clientUid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updateData)
      });
      if (!res.ok) throw new Error("Update failed on server");
      toast.success(`Candidate approved${updateData.assignedEmployeeId ? ` — assigned to ${updateData.assignedEmployeeId}` : ''}`);
      setClients(prev => prev.map((c: any) =>
        c.uid === clientUid || c.id === clientUid
          ? { ...c, status: status as any, ...(updateData.assignedEmployeeId ? { assigned_employee_id: updateData.assignedEmployeeId, assignedEmployeeId: updateData.assignedEmployeeId } : {}) }
          : c
      ));
      // Advance to next pending candidate (or clear the dossier panel)
      if (status === 'approved' || status === 'active') {
        const remaining = clients.filter((c: any) =>
          c.uid !== clientUid && c.id !== clientUid &&
          (c.status === 'pending_approval' || !c.status)
        );
        setSelectedClientId(remaining.length > 0 ? ((remaining[0] as any).uid || remaining[0].id) : null);
      }
    } catch (err: any) {
      toast.error("Update failed: " + err.message);
    }
  };

  const changeConsultant = async (clientUid: string, consultantId: string) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`/api/clients/${clientUid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignedEmployeeId: consultantId })
      });
      if (!res.ok) throw new Error("Assignment failed on server");
      setClients(prev => prev.map((c: any) => c.uid === clientUid || c.id === clientUid ? { ...c, assignedEmployeeId: consultantId, assigned_employee_id: consultantId } : c));
      toast.success(`Candidate assigned to Consultant ${consultantId}`);
    } catch (err: any) {
      toast.error("Assignment failed");
    }
  };

  const syncExistingAssignments = async () => {
    try {
      const currentClients = [...clients] as any[];
      const unassigned = currentClients.filter(c => {
        const id = (c.assignedEmployeeId || c.assigned_employee_id || "").toString().trim();
        return !id || id === 'DEFAULT_EMPLOYEE' || id === 'none' || id === 'default_employee';
      });

      if (unassigned.length === 0) {
        const confirmAll = confirm("All candidates are assigned. Re-balance workload equally (50/50)?");
        if (!confirmAll) return;
        unassigned.push(...currentClients);
      }

      toast.loading(`Balancing workload for ${unassigned.length} candidates...`);

      const assignedClients = currentClients.filter(c => !unassigned.find((u: any) => u.uid === c.uid));
      let count31604 = assignedClients.filter((c: any) => (c.assignedEmployeeId || c.assigned_employee_id) === '31604').length;
      let count32282 = assignedClients.filter((c: any) => (c.assignedEmployeeId || c.assigned_employee_id) === '32282').length;

      const token = localStorage.getItem('jwt_token');
      const updatedClients = [...currentClients];

      for (const client of unassigned) {
        const assignedId = count31604 < count32282 ? '31604' : '32282';
        if (assignedId === '31604') count31604++; else count32282++;

        await fetch(`/api/clients/${client.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ assignedEmployeeId: assignedId })
        });

        const idx = updatedClients.findIndex(c => (c as any).uid === client.uid);
        if (idx !== -1) updatedClients[idx] = { ...updatedClients[idx], assignedEmployeeId: assignedId, assigned_employee_id: assignedId };
      }

      setClients(updatedClients as any);
      toast.dismiss();
      toast.success(`Balanced workload across consultants successfully.`);
    } catch (err: any) {
      toast.dismiss();
      toast.error("Sync failed: " + err.message);
    }
  };


  const deleteClient = async (clientUid: string) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`/api/users/${clientUid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      setClients(prev => prev.filter((c: any) => c.uid !== clientUid && c.id !== clientUid));
      toast.success("Candidate record deleted.");
      if (selectedClientId === clientUid) setSelectedClientId(null);
    } catch (err: any) {
      toast.error("Deletion failed: " + err.message);
    }
  };

  // Job Scraping & Insertion
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
      // Naukri fallback
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
    if (!selectedClientId) return;
    if (!company || !role) {
      toast.error("Company Name and Job Title are required.");
      return;
    }

    setIsAddingApp(true);
    try {
      const token = localStorage.getItem('jwt_token');
      const selectedClientObj = clients.find((c: any) => c.uid === selectedClientId || c.id === selectedClientId) as any;
      const clientUid = selectedClientObj?.uid || selectedClientId;
      const clientPrismaId = selectedClientObj?.id;

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
        })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');

      setCompany(''); setRole(''); setJobUrl(''); setLocation(''); setSalary('');
      toast.success("Application logged successfully.");
    } catch (err: any) {
      toast.error("Failed to save application: " + err.message);
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
      if (!res.ok) throw new Error('Failed');
      setSelectedClientApps(prev => prev.map((a: any) => a.id === appId ? { ...a, status } : a));
      toast.success(`Status updated to ${status}`);
    } catch (err: any) {
      toast.error("Failed to update status.");
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!confirm("Delete this application record?")) return;
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`/api/jobs/${appId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      setSelectedClientApps(prev => prev.filter((a: any) => a.id !== appId));
      toast.success("Record deleted.");
    } catch (err: any) {
      toast.error("Deletion failed.");
    }
  };

  const handleCreateCounselorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCounselorName || !newCounselorEmail) return;

    setIsCreatingCounselor(true);
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch('/api/users/counselor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: newCounselorName, email: newCounselorEmail, password: newCounselorPassword || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Creation failed");

      const cRes = await fetch('/api/users/counselors', { headers: { Authorization: `Bearer ${token}` } });
      if (cRes.ok) setCounselors(await cRes.json());

      setNewCounselorCredentials(data);
      setNewCounselorName("");
      setNewCounselorEmail("");
      setNewCounselorPassword("");
      toast.success("Counselor created successfully.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreatingCounselor(false);
    }
  };

  const deleteCounselor = async (uid: string, name: string) => {
    if (!confirm(`Permanently delete counselor "${name}"? Their assigned candidates will become unassigned.`)) return;
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`/api/users/${uid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      setCounselors(prev => prev.filter((c: any) => c.uid !== uid));
      toast.success("Counselor deleted.");
    } catch (err: any) {
      toast.error("Deletion failed: " + err.message);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="h-screen flex items-center justify-center text-cyan-400 font-bold uppercase tracking-widest bg-slate-950 font-sans karya-dashboard-theme">
        Access Denied
      </div>
    );
  }

  // Normalise a raw Prisma client object to the shape the UI expects
  const norm = (c: any) => ({
    ...c,
    application_data: c.application_data ?? c.applicationData ?? {},
    assigned_employee_id: c.assigned_employee_id ?? c.assignedEmployeeId ?? '',
  });

  const filteredCandidates = (clients as any[]).filter(raw => {
    const c = norm(raw);
    const fullName = ((c.application_data?.firstName || "") + " " + (c.application_data?.lastName || "")).toLowerCase();
    const queryMatch = fullName.includes(searchTerm.toLowerCase()) || (c.uid || c.id || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'approvals') {
      return (c.status === 'pending_approval' || !c.status) && queryMatch;
    } else {
      return c.status !== 'pending_approval' && c.status && queryMatch;
    }
  }).map(norm);

  const selectedClient = activeTab === 'approvals'
    ? filteredCandidates.find((c: any) => c.uid === selectedClientId || c.id === selectedClientId)
    : (filteredCandidates.find((c: any) => c.uid === selectedClientId || c.id === selectedClientId)
        ?? (clients as any[]).map(norm).find((c: any) => c.uid === selectedClientId || c.id === selectedClientId));
  const appData = selectedClient?.application_data || {};

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 font-sans karya-dashboard-theme overflow-hidden flex">

      {/* COLUMN 1: LEFT NAVIGATION (Smallest Width) */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shrink-0">

        {/* Brand Logo */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-black text-sm">
            K
          </div>
          <div>
            <h1 className="text-xl font-black text-indigo-600 tracking-tight leading-none font-display">KARYA</h1>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1 block">Admin Terminal</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'roster', label: 'Candidate Roster', icon: Users },
            { id: 'approvals', label: 'Pending Approvals', icon: ShieldAlert, badge: clients.filter(c => c.status === 'pending_approval' || !c.status).length },
            { id: 'interviews', label: 'Interviews', icon: CalendarDays, badge: globalApps.filter(a => a.status === 'Interview').length },
            { id: 'analytics', label: 'Analytics', icon: BarChart2 },
            ...(user?.role === 'admin' ? [{ id: 'counselors', label: 'Counselors Data', icon: Users }] : [])
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                // When selecting a view, reset selectedCandidate to first match of that view
                const matches = clients.filter(c => {
                  if (tab.id === 'approvals') return c.status === 'pending_approval' || !c.status;
                  return c.status !== 'pending_approval' && c.status;
                });
                if (matches.length > 0) {
                  setSelectedClientId((matches[0] as any).uid || matches[0].id);
                } else {
                  setSelectedClientId(null);
                }
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all",
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-sm'
                  : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-700'
              )}
            >
              <div className="flex items-center gap-3">
                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-white" : "text-slate-400")} />
                <span>{tab.label}</span>
              </div>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md text-[9px] font-black font-mono">
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
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">Role // Admin</p>
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

      {/* RENDER VIEW 1: GENERAL OVERVIEW */}
      {activeTab === 'overview' && (
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8 space-y-8 custom-scrollbar">
          
          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">System Performance Overview</h2>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Operations metrics / Live telemetry data</p>
          </div>

          {/* Cards metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatBox label="Candidate Profiles" value={globalStats.totalCandidates} icon={<Users />} color="text-cyan-400 border-cyan-500/10" trend="+12% weekly" />
            <StatBox label="Awaiting Approval" value={clients.filter(c => c.status === 'pending_approval' || !c.status).length} icon={<ShieldAlert />} color="text-yellow-400 border-yellow-500/10" isDanger={clients.filter(c => c.status === 'pending_approval' || !c.status).length > 0} />
            <StatBox label="Applications Placed" value={globalStats.totalApplied} icon={<Briefcase />} color="text-emerald-400 border-emerald-500/10" />
            <StatBox label="Interviews Booked" value={globalStats.totalInterviews} icon={<Zap />} color="text-purple-400 border-purple-500/10" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            
            {/* Candidate Matrix table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.1em]">Candidate Performance Matrix</h3>
                  <p className="text-[10px] text-slate-500 uppercase mt-1">Real-time throughput metrics per candidate</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950/40 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/80">
                      <th className="px-6 py-4">Candidate Profiles</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Applications Logged</th>
                      <th className="px-6 py-4 text-center">Interviews Setup</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {clients.filter(c => c.status !== 'pending_approval' && c.status !== 'incomplete').map(client => (
                      <tr 
                        key={client.id} 
                        className="hover:bg-slate-800/30 transition-colors group cursor-pointer text-sm"
                        onClick={() => {
                          setSelectedClientId((client as any).uid || client.id);
                          setActiveTab('roster');
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-black uppercase">
                              {client.application_data?.firstName?.[0]}{client.application_data?.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                                {client.application_data?.firstName} {client.application_data?.lastName}
                              </div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">{client.email || 'No email'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 uppercase tracking-wider border border-cyan-500/20">
                            {client.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-white tabular-nums">
                          {clientStats[(client as any).uid || client.id]?.applied || 0}
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-purple-400 tabular-nums">
                          {clientStats[(client as any).uid || client.id]?.interviews || 0}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all inline-block" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Global application feeding log */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 bg-slate-900/60">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.1em]">Recent Job Applications</h3>
                <p className="text-[10px] text-slate-500 uppercase mt-1">Historical ledger of all application submissions</p>
              </div>
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950/40 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                      <th className="px-6 py-4">Submission Date</th>
                      <th className="px-6 py-4">Candidate Name</th>
                      <th className="px-6 py-4">Company & Target Role</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {globalApps.map((app, i) => (
                      <tr key={i} className="text-sm">
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-white font-bold">
                          {app.clientName}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                            <span>{app.role}</span>
                            <span className="text-slate-500">at</span>
                            <span className="text-cyan-400 font-bold">{app.company}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                            app.status === 'Applied'    ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                            app.status === 'Interview'  ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                            app.status === 'Assessment' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                            app.status === 'Selected'   ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                            app.status === 'Rejected'   ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                            'text-slate-400 bg-slate-800 border-slate-700'
                          )}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {globalApps.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-slate-500 font-bold uppercase text-xs">
                          No recent applications found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      )}

      {/* RENDER VIEWS: ROSTER & APPROVALS SPLIT (Three Columns layout) */}
      {(activeTab === 'roster' || activeTab === 'approvals') && (
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* COLUMN 2: CANDIDATE LIST (Medium Width) */}
          <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
            
            {/* Search Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white uppercase tracking-widest">
                  {activeTab === 'roster' ? 'Candidate Profiles' : 'Awaiting Approval'}
                </span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-bold px-2 py-0.5 rounded-full font-mono">
                  {filteredCandidates.length}
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search name / email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-sans karya-dashboard-theme"
                />
              </div>
            </div>

            {/* Candidates list wrapper */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <div className="p-10 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 gap-3 text-center">
                    {activeTab === 'approvals' ? (
                      <>
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="text-slate-700 font-black uppercase text-[10px] tracking-widest">No Pending Approvals</p>
                        <p className="text-slate-400 text-[10px]">All candidates have been reviewed.</p>
                      </>
                    ) : (
                      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No matching candidates.</p>
                    )}
                  </div>
                ) : (
                  filteredCandidates.map(candidate => {
                    const isSelected = selectedClientId === candidate.id;
                    return (
                      <motion.button
                        key={candidate.id}
                        layoutId={`candidate-${candidate.id}`}
                        onClick={() => setSelectedClientId(candidate.uid || candidate.id)}
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

          {/* COLUMN 3: CANDIDATE DOSSIER (Largest Width) */}
          <section className="flex-1 overflow-hidden bg-slate-950 flex flex-col">
            {selectedClient ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                
                {/* Dossier Header banner */}
                <div className="p-6 border-b border-slate-900 bg-slate-950 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-lg font-mono">
                      {appData.firstName?.[0] || 'C'}{appData.lastName?.[0] || 'K'}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white leading-none">
                        {appData.firstName} {appData.lastName}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 uppercase tracking-widest font-medium leading-none">
                        <span>Profile // {selectedClient.status || 'Active'}</span>
                        <span className="text-slate-700">|</span>
                        <span>Salary Target: {appData.expectedCTC ? `${appData.expectedCTC}` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    
                    {/* Consultant Assignment Controls */}
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1 text-xs">
                      <span className="text-slate-400 text-[10px] font-black uppercase font-mono">Assign ID:</span>
                      <div className="relative">
                        <select 
                          value={selectedClient.assigned_employee_id || ''}
                          onChange={(e) => changeConsultant(selectedClient.uid, e.target.value)}
                          className="appearance-none bg-transparent pr-6 font-bold text-cyan-400 uppercase tracking-widest outline-none text-[11px] cursor-pointer"
                        >
                          <option value="" className="bg-slate-900 text-slate-400">Unassigned</option>
                          {counselors.map(c => (
                            <option key={c.uid} value={c.uid} className="bg-slate-900 text-slate-200">{c.uid} ({c.displayName})</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                      </div>
                    </div>

                    {/* Action Approved controls if pending */}
                    {activeTab === 'approvals' && (
                      <button
                        onClick={() => {
                          setApprovePopupAssignId(
                            selectedClient.assigned_employee_id || (selectedClient as any).assignedEmployeeId ||
                            (counselors.length > 0 ? counselors[0].uid : '')
                          );
                          setApprovePopupUid((selectedClient as any).uid || selectedClient.id);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                      >
                        Approve Candidate
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const name = [appData.firstName, appData.lastName].filter(Boolean).join(' ') || (selectedClient as any).uid || 'this candidate';
                          if (confirm(`Are you sure you want to permanently delete ${name}?`)) {
                          deleteClient((selectedClient as any).uid || (selectedClient as any).id);
                        }
                      }}
                      className="p-2 bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-slate-800 rounded-xl transition-all"
                      title="Permanently remove candidate profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dossier Tabs navigation */}
                <div className="px-6 border-b border-slate-900 bg-slate-950 shrink-0 flex gap-4">
                  {[
                    { id: 'details', label: 'Candidate Profile' },
                    ...(user?.role !== 'admin' ? [{ id: 'add-job', label: 'Add Job Application' }] : []),
                    { id: 'applied-jobs', label: 'Applied Jobs' }
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

                {/* Tab content area */}
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
                          
                          {/* Main Info Card (Left side of dossier) */}
                          <div className="space-y-6">
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                              <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800/80 pb-3">
                                Candidate Contact
                              </h4>

                              <div className="space-y-4">
                                <DetailRow label="Email Address" value={selectedClient.email || appData.email} icon={<Mail className="w-4 h-4" />} />
                                <DetailRow label="Phone Number" value={appData.phone} icon={<Phone className="w-4 h-4" />} />
                                <DetailRow label="Preferred Job Location" value={appData.preferredLocation} icon={<MapPin className="w-4 h-4" />} />
                                <DetailRow label="Target Job Roles" value={appData.targetRoles?.join(', ')} icon={<Target className="w-4 h-4" />} />
                              </div>
                            </div>

                            {/* Skills/Experience Grid (Small boxes with white text) */}
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                              <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800/80 pb-3">
                                Professional Insights
                              </h4>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <InsightBox label="Total Experience" value={appData.experience || 'N/A'} desc="Industry Experience" />
                                <InsightBox label="Current Domain" value={appData.domain || 'N/A'} desc="Expertise Sector" />
                                <InsightBox label="Current Salary" value={appData.currentCTC || 'N/A'} desc="CTC Statistics" />
                                <InsightBox label="Expected Salary" value={appData.expectedCTC || 'N/A'} desc="Demanded Package" />
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

                          {/* Secondary Dossier Info (Right side of details tab) */}
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
                                <p className="text-xs text-slate-400 font-mono">
                                  {appData.education?.college || 'No University/College'}
                                </p>
                                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mt-1">
                                  Class of {appData.education?.year || 'N/A'}
                                </p>
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

                      {dossierTab === 'add-job' && user?.role !== 'admin' && (
                        <motion.div
                          key="dossier-tab-add-job"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="grid grid-cols-1 lg:grid-cols-1 gap-8"
                        >
                          
                          {/* Create dispatcher job record form */}
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

                      {dossierTab === 'applied-jobs' && (
                        <motion.div
                          key="dossier-tab-applied-jobs"
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className="space-y-8"
                        >
                          {/* Client specific Job tracker pipeline cards list */}
                          <div className="space-y-4">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest px-1">
                              Application Pipeline Status
                            </h4>

                            <div className="space-y-3">
                              {selectedClientApps.map(app => (
                                <div
                                  key={app.id}
                                  className={cn(
                                    "p-5 border rounded-xl flex items-center justify-between gap-4 shadow-xl text-sm",
                                    app.status === 'Applied'    ? 'bg-slate-900 border-blue-500/30' :
                                    app.status === 'Interview'  ? 'bg-slate-900 border-amber-500/30' :
                                    app.status === 'Assessment' ? 'bg-slate-900 border-purple-500/30' :
                                    app.status === 'Selected'   ? 'bg-slate-900 border-emerald-500/30' :
                                    app.status === 'Rejected'   ? 'bg-slate-900 border-red-500/30' :
                                    'bg-slate-900 border-slate-800'
                                  )}
                                >
                                  <div className="flex-1 min-w-0 grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div>
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
                                      <p className="text-[10px] text-slate-500 uppercase font-mono mt-1 leading-none">{app.company}</p>
                                    </div>

                                    <div>
                                      <span className="block text-[9px] text-slate-500 uppercase tracking-wider leading-none">Location</span>
                                      <span className="text-xs font-semibold text-slate-300 block mt-1.5 truncate leading-none">{app.location || 'Remote'}</span>
                                    </div>

                                    <div>
                                      <span className="block text-[9px] text-slate-500 uppercase tracking-wider leading-none">Salary</span>
                                      <span className="text-xs font-semibold text-slate-300 block mt-1.5 truncate leading-none">{app.salary || '—'}</span>
                                    </div>

                                    <div>
                                      <span className="block text-[9px] text-slate-500 uppercase tracking-wider leading-none">Logged Date</span>
                                      <span className="text-xs font-semibold text-slate-300 block mt-1.5 font-mono leading-none">{app.appliedDate || app.applied_date || 'N/A'}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {app.job_url && (
                                        <a 
                                          href={app.job_url} target="_blank" rel="noreferrer"
                                          className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 rounded-lg transition-all"
                                          title="Open original job posting link"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                      <CopyLinkBtn value={app.job_url} />
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 border-l border-slate-800/80 pl-4">
                                    
                                    {/* Action dropdown for CRM Status */}
                                    <div className="relative shrink-0">
                                      <select 
                                        value={app.status} 
                                        onChange={(e) => updateAppStatus(app.id, e.target.value)}
                                        className={cn(
                                          "appearance-none bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-9 py-2 text-xs font-black uppercase tracking-wider cursor-pointer outline-none transition-all",
                                          app.status === 'Applied'    ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' :
                                          app.status === 'Interview'  ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                                          app.status === 'Assessment' ? 'text-purple-400 border-purple-500/20 bg-purple-500/10' :
                                          app.status === 'Selected'   ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                                          app.status === 'Rejected'   ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                                          'text-slate-300'
                                        )}
                                      >
                                        <option value="Applied"    style={{background:'#1e3a5f',color:'#60a5fa'}}>Applied</option>
                                        <option value="Interview"  style={{background:'#451a03',color:'#fbbf24'}}>Interview</option>
                                        <option value="Assessment" style={{background:'#2e1065',color:'#c084fc'}}>Assessment</option>
                                        <option value="Selected"   style={{background:'#052e16',color:'#34d399'}}>Selected</option>
                                        <option value="Rejected"   style={{background:'#450a0a',color:'#f87171'}}>Rejected</option>
                                      </select>
                                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    </div>

                                    <button 
                                      onClick={() => handleDeleteApplication(app.id)}
                                      className="p-2 bg-slate-950 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-slate-800 rounded-xl transition-all"
                                      title="Remove application log"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {selectedClientApps.length === 0 && (
                                <div className="text-center py-10 bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-6 text-slate-500 uppercase font-bold text-[10px] tracking-widest">
                                  No track applications logged. Use the form above to add one.
                                </div>
                              )}
                            </div>
                          </div>

                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4 bg-slate-50">
                {activeTab === 'approvals' ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">No Pending Approvals</h3>
                      <p className="text-xs text-slate-500 max-w-sm mt-2 uppercase tracking-widest font-mono">All candidates have been reviewed</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <Database className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">No Profile Selected</h3>
                      <p className="text-xs text-slate-500 max-w-sm mt-2 uppercase tracking-widest font-mono">Select a candidate from the left roster list</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

        </div>
      )}

      {/* RENDER VIEW: COUNSELORS DATA */}
      {activeTab === 'counselors' && user?.role === 'admin' && (
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8 space-y-8 custom-scrollbar">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Counselors Data</h2>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">Manage Agency Consultants and Assignments</p>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              disabled={isCreatingCounselor}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 outline-none text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
            >
              {isCreatingCounselor ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Users className="w-4 h-4" />}
              <span className="ml-2">Create New Counselor</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950/40 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-800/80">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Full Name</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4 text-center">Candidates</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {counselors.map((c: any) => (
                    <React.Fragment key={c.uid}>
                      <tr
                        className="hover:bg-slate-800/30 transition-colors text-sm cursor-pointer"
                        onClick={() => setExpandedCounselorId(expandedCounselorId === c.uid ? null : c.uid)}
                      >
                        <td className="px-6 py-4 font-mono font-bold text-cyan-400">{c.uid}</td>
                        <td className="px-6 py-4 font-bold text-white">{c.displayName}</td>
                        <td className="px-6 py-4 text-slate-400 text-xs font-mono">{c.email}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-black tabular-nums", c.assignedClientsCount > 0 ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-500")}>
                            {c.assignedClientsCount || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.assignedClientsCount > 0 && (
                              <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", expandedCounselorId === c.uid && "rotate-180")} />
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteCounselor(c.uid, c.displayName); }}
                              className="p-1.5 bg-slate-950 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-slate-800 rounded-lg transition-all"
                              title="Delete counselor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedCounselorId === c.uid && c.assignedClients?.length > 0 && (
                        <tr className="bg-slate-950/60">
                          <td colSpan={5} className="px-8 py-4">
                            <div className="space-y-2">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Assigned Candidates</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {c.assignedClients.map((cl: any) => (
                                  <div key={cl.uid} className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px] font-black shrink-0">
                                      {cl.name?.[0] || '?'}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-white truncate">{cl.name}</p>
                                      <p className="text-[10px] text-slate-500 font-mono truncate">{cl.email || 'No email'}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {counselors.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-500 font-bold uppercase text-xs">
                        No counselors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      )}

      {/* ── INTERVIEWS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'interviews' && (() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now); monthStart.setDate(monthStart.getDate() - 30);

        const interviewApps = globalApps.filter(a => a.status === 'Interview');

        const filterDate = interviewsFilter === 'day' ? todayStart : interviewsFilter === 'week' ? weekStart : monthStart;
        const filteredInterviews = interviewApps.filter(a => {
          const d = new Date(a.updatedAt || a.createdAt || now);
          return d >= filterDate;
        });

        // Group by date
        const grouped: Record<string, any[]> = {};
        filteredInterviews.forEach(app => {
          const dateKey = new Date(app.updatedAt || app.createdAt || now).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(app);
        });

        return (
          <main className="flex-1 overflow-y-auto bg-slate-50 p-8 space-y-8 custom-scrollbar">
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
                              <p className="text-xs text-slate-500 font-mono truncate">{app.company} · {app.clientName || 'Unknown Candidate'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {app.location && (
                              <span className="text-xs text-slate-400 hidden sm:block">{app.location}</span>
                            )}
                            <select
                              value={app.status}
                              onChange={(e) => updateAppStatus(app.id, e.target.value)}
                              className="appearance-none bg-purple-50 border border-purple-200 text-purple-700 rounded-xl pl-3 pr-8 py-1.5 text-xs font-black uppercase tracking-wider cursor-pointer outline-none"
                            >
                              <option value="Applied">Applied</option>
                              <option value="Interview">Interview</option>
                              <option value="Assessment">Assessment</option>
                              <option value="Selected">Selected</option>
                              <option value="Rejected">Rejected</option>
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

      {/* ── ANALYTICS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (() => {
        const now = new Date();
        const filterFn = (app: any) => {
          const d = new Date(app.createdAt || app.appliedDate || now);
          if (analyticsFilter === 'day') return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (analyticsFilter === 'week') { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w; }
          if (analyticsFilter === 'month') { const m = new Date(now); m.setDate(m.getDate() - 30); return d >= m; }
          return true;
        };
        const filtered = globalApps.filter(filterFn);

        // per-counselor stats
        const counselorMap: Record<string, { name: string; email: string; candidates: Set<string>; applied: number; interview: number; assessment: number; selected: number; rejected: number }> = {};
        for (const c of counselors) {
          counselorMap[c.uid] = { name: c.displayName || c.email, email: c.email, candidates: new Set(), applied: 0, interview: 0, assessment: 0, selected: 0, rejected: 0 };
        }
        counselorMap['unassigned'] = { name: 'Unassigned', email: '', candidates: new Set(), applied: 0, interview: 0, assessment: 0, selected: 0, rejected: 0 };

        for (const app of filtered) {
          const cl = (clients as any[]).find(c => (c.uid || c.id) === app.clientId);
          const cid = cl?.assignedEmployeeId || cl?.assigned_employee_id || 'unassigned';
          const bucket = counselorMap[cid] || counselorMap['unassigned'];
          bucket.candidates.add(app.clientId);
          if (app.status === 'Applied') bucket.applied++;
          else if (app.status === 'Interview') bucket.interview++;
          else if (app.status === 'Assessment') bucket.assessment++;
          else if (app.status === 'Selected') bucket.selected++;
          else if (app.status === 'Rejected') bucket.rejected++;
        }

        // per-candidate stats
        const candidateRows = (clients as any[])
          .filter(c => c.status !== 'pending_approval')
          .map(c => {
            const uid = c.uid || c.id;
            const apps = globalApps.filter(a => a.clientId === uid);
            const filteredApps = filtered.filter(a => a.clientId === uid);
            const counselorId = c.assignedEmployeeId || c.assigned_employee_id;
            const counselor = counselors.find((co: any) => co.uid === counselorId);
            const appData = c.application_data || c.applicationData || {};
            const name = `${appData.firstName || ''} ${appData.lastName || ''}`.trim() || c.email || uid;
            return {
              uid, name,
              counselorName: counselor?.displayName || counselor?.email || 'Unassigned',
              total: filteredApps.length,
              applied: filteredApps.filter(a => a.status === 'Applied').length,
              interview: filteredApps.filter(a => a.status === 'Interview').length,
              assessment: filteredApps.filter(a => a.status === 'Assessment').length,
              selected: filteredApps.filter(a => a.status === 'Selected').length,
              rejected: filteredApps.filter(a => a.status === 'Rejected').length,
            };
          })
          .filter(r => !analyticsSearch || r.name.toLowerCase().includes(analyticsSearch.toLowerCase()) || r.counselorName.toLowerCase().includes(analyticsSearch.toLowerCase()))
          .sort((a, b) => b.total - a.total);

        const statBox = (label: string, value: number, color: string) => (
          <div className={`bg-white rounded-2xl border ${color} p-4 space-y-1`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-3xl font-black text-slate-800">{value}</p>
          </div>
        );

        const statusBadge = (status: string, count: number) => {
          const colors: Record<string, string> = { Applied: 'bg-blue-50 text-blue-600', Interview: 'bg-amber-50 text-amber-600', Assessment: 'bg-purple-50 text-purple-600', Selected: 'bg-emerald-50 text-emerald-600', Rejected: 'bg-red-50 text-red-600' };
          return <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${colors[status] || 'bg-slate-100 text-slate-500'}`}>{count}</span>;
        };

        return (
          <main className="flex-1 overflow-y-auto bg-slate-50 p-8 space-y-8 custom-scrollbar">

            {/* Header + Time Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Analytics</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">{filtered.length} applications · {analyticsFilter === 'day' ? 'Today' : analyticsFilter === 'week' ? 'Last 7 days' : analyticsFilter === 'month' ? 'Last 30 days' : 'All time'}</p>
              </div>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                {(['day', 'week', 'month', 'all'] as const).map(f => (
                  <button key={f} onClick={() => setAnalyticsFilter(f)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
                      analyticsFilter === f ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-indigo-600'
                    )}>
                    {f === 'day' ? 'Today' : f === 'week' ? 'Week' : f === 'month' ? 'Month' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Stat Boxes */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {statBox('Total Applications', filtered.length, 'border-slate-200')}
              {statBox('Interviews', filtered.filter(a => a.status === 'Interview').length, 'border-purple-100')}
              {statBox('Assessments', filtered.filter(a => a.status === 'Assessment').length, 'border-yellow-100')}
              {statBox('Selected', filtered.filter(a => a.status === 'Selected').length, 'border-emerald-100')}
              {statBox('Active Counselors', Object.values(counselorMap).filter(c => c.candidates.size > 0 && c.name !== 'Unassigned').length, 'border-indigo-100')}
            </div>

            {/* Counselor-wise Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                <Award className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Counselor Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Counselor', 'Candidates', 'Applied', 'Interview', 'Assessment', 'Selected', 'Rejected'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(counselorMap).filter(([, v]) => v.candidates.size > 0).map(([cid, v]) => (
                      <tr key={cid} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800 text-xs">{v.name}</p>
                          {v.email && <p className="text-[10px] text-slate-400 font-mono">{v.email}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-600">{v.candidates.size}</td>
                        <td className="px-4 py-3">{statusBadge('Applied', v.applied)}</td>
                        <td className="px-4 py-3">{statusBadge('Interview', v.interview)}</td>
                        <td className="px-4 py-3">{statusBadge('Assessment', v.assessment)}</td>
                        <td className="px-4 py-3">{statusBadge('Selected', v.selected)}</td>
                        <td className="px-4 py-3">{statusBadge('Rejected', v.rejected)}</td>
                      </tr>
                    ))}
                    {Object.values(counselorMap).every(v => v.candidates.size === 0) && (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-xs font-bold uppercase">No data for this period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Candidate Roster */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Candidate Applications</h3>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate or counselor..."
                    value={analyticsSearch}
                    onChange={e => setAnalyticsSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-300"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Candidate', 'Counselor', 'Total', 'Applied', 'Interview', 'Assessment', 'Selected', 'Rejected'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {candidateRows.map(r => (
                      <tr key={r.uid} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800 text-xs">{r.name}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-semibold">{r.counselorName}</td>
                        <td className="px-4 py-3 text-xs font-black text-slate-700">{r.total}</td>
                        <td className="px-4 py-3">{statusBadge('Applied', r.applied)}</td>
                        <td className="px-4 py-3">{statusBadge('Interview', r.interview)}</td>
                        <td className="px-4 py-3">{statusBadge('Assessment', r.assessment)}</td>
                        <td className="px-4 py-3">{statusBadge('Selected', r.selected)}</td>
                        <td className="px-4 py-3">{statusBadge('Rejected', r.rejected)}</td>
                      </tr>
                    ))}
                    {candidateRows.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-xs font-bold uppercase">
                        {analyticsSearch ? `No results for "${analyticsSearch}"` : 'No data for this period'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </main>
        );
      })()}

      {/* Create Counselor Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Add Counselor</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Generate new credentials</p>
                </div>
                <button 
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewCounselorCredentials(null);
                  }}
                  className="text-slate-500 hover:text-white p-2 transition-colors rounded-xl hover:bg-slate-800"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                {newCounselorCredentials ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                      <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                      <h4 className="text-emerald-400 font-black uppercase tracking-widest">Success</h4>
                      <p className="text-xs text-slate-400 font-mono">Please securely save these credentials. They will not be shown again.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <DetailRow label="Counselor ID" value={newCounselorCredentials.uid} icon={<Users className="w-4 h-4" />} />
                      <DetailRow label="Display Name" value={newCounselorCredentials.displayName} icon={<Users className="w-4 h-4" />} />
                      <DetailRow label="Email Address" value={newCounselorCredentials.email} icon={<Users className="w-4 h-4" />} />
                      <DetailRow label="Temporary Password" value={newCounselorCredentials.password} icon={<ShieldAlert className="w-4 h-4" />} />
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setNewCounselorCredentials(null);
                      }}
                      className="w-full mt-4 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateCounselorSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Full Name</label>
                      <input 
                        type="text" required
                        value={newCounselorName} onChange={e => setNewCounselorName(e.target.value)}
                        placeholder="E.G. JANE DOE"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Email Address</label>
                      <input
                        type="email" required
                        value={newCounselorEmail} onChange={e => setNewCounselorEmail(e.target.value)}
                        placeholder="JANE@AGENCY.COM"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Password <span className="text-slate-600">(leave blank to auto-generate)</span></label>
                      <input
                        type="text"
                        value={newCounselorPassword} onChange={e => setNewCounselorPassword(e.target.value)}
                        placeholder="SET A CUSTOM PASSWORD"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit" disabled={isCreatingCounselor || !newCounselorName || !newCounselorEmail}
                        className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 outline-none text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isCreatingCounselor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                        <span className="ml-2">Generate Credentials</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Approve & Assign Counselor Popup */}
      <AnimatePresence>
        {approvePopupUid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18 }}
              className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 w-full max-w-sm p-6 space-y-5 pointer-events-auto"
            >
              {(() => {
                const pendingClient: any = clients.find((c: any) => c.uid === approvePopupUid || c.id === approvePopupUid);
                const candidateName = pendingClient?.application_data
                  ? [pendingClient.application_data.firstName, pendingClient.application_data.lastName].filter(Boolean).join(' ')
                  : pendingClient?.uid || '';
                return (
                  <>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Assign & Approve</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Approving <span className="font-bold text-slate-800">{candidateName || 'this candidate'}</span>
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Assign Counselor</label>
                      <select
                        value={approvePopupAssignId}
                        onChange={(e: any) => setApprovePopupAssignId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400 transition-all"
                      >
                        <option value="">— No Assignment —</option>
                        {counselors.map((c: any) => (
                          <option key={c.uid} value={c.uid}>{c.uid} — {c.displayName}</option>
                        ))}
                      </select>
                      {counselors.length === 0 && (
                        <p className="text-[10px] text-amber-500 font-semibold mt-1">No counselors found. Candidate will be approved without assignment.</p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => setApprovePopupUid(null)}
                        className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          const uid = approvePopupUid;
                          setApprovePopupUid(null);
                          await handleStatusUpdate(uid, 'approved', approvePopupAssignId || undefined);
                        }}
                        className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black tracking-wide transition-all"
                      >
                        Approve
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Helpers components mapped
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

function DetailRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
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

function InsightBox({ label, value, desc }: { label: string; value: string; desc?: string }) {
  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1 hover:border-cyan-500/20 transition-colors">
      <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block leading-none">{label}</span>
      <span className="text-xs font-black text-white uppercase truncate block leading-snug">{value}</span>
      {desc && <span className="text-[7px] text-slate-600 uppercase font-mono block leading-none mt-1">{desc}</span>}
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
