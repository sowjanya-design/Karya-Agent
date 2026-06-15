import React, { useState, useEffect } from 'react';
// Removed firebase
import { 
  User,
  FileText, 
  ExternalLink, 
  Plus, 
  Briefcase, 
  Clock, 
  Trash2, 
  UserCheck, 
  ShieldAlert,
  Loader2,
  Terminal,
  ChevronDown,
  ChevronUp,
  MapPin,
  Linkedin,
  Phone,
  DollarSign,
  Link2,
  Send,
  Zap,
  Globe,
  Target,
  Copy,
  Check,
  Building,
  BriefcaseBusiness,
  Database,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface ClientWorkspaceProps {
  clientId: string;
  onDelete?: () => void;
}

const CopyButton = ({ value, label }: { value: string; label?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label || 'Value'} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-300 hover:text-blue-600 border border-transparent hover:border-gray-200"
      title={`Copy ${label || ''}`}
    >
      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

export const ClientWorkspace: React.FC<ClientWorkspaceProps> = ({ clientId, onDelete }) => {
  const [clientDoc, setClientDoc] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [entryMode, setEntryMode] = useState<'link' | 'manual'>('link');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleAutoFill = async () => {
    if (!jobUrl || !jobUrl.startsWith('http')) {
      toast.error("Please provide a valid job URL first.");
      return;
    }

    setIsParsing(true);
    
    try {
      // 1. Try backend scraping (Puppeteer + Cheerio + Gemini)
      const response = await fetch('/api/scrape-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Scraping failed");
      }
      
      const data = await response.json();
      
      if (data.company) setCompany(data.company.toUpperCase());
      if (data.title) setRole(data.title.toUpperCase());
      if (data.location) setLocation(data.location.toUpperCase());
      
      if (data.company || data.title) {
        toast.success("Details extracted successfully!");
      } else {
        toast.error("Could not auto-extract. Please type the details manually.");
      }
    } catch (err) {
      console.error(err);
      
      // Secondary fallback: Client-side parsing for known patterns (e.g., Naukri)
      if (jobUrl.includes('naukri.com')) {
        try {
          const path = new URL(jobUrl).pathname;
          const meat = path.split('job-listings-')[1];
          if (meat) {
            const parts = meat.split('-');
            const bIndex = parts.indexOf('b');
            if (bIndex !== -1) {
              const extractedTitle = parts.slice(0, bIndex).join(' ');
              const extractedCompany = parts[bIndex + 1];
              setRole(extractedTitle.toUpperCase());
              setCompany(extractedCompany.toUpperCase());
              toast.success("Details extracted via local parser.");
              setIsParsing(false);
              return;
            }
          }
        } catch (e) {}
      }
      
      const errMsg = err instanceof Error ? err.message : "Could not auto-extract";
      toast.error(`${errMsg}. Please type the details manually.`);
    } finally {
      setIsParsing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const [clientRes, jobsRes] = await Promise.all([
          fetch(`/api/clients`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/jobs/${clientId}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (clientRes.ok) {
          const allClients = await clientRes.json();
          const foundClient = allClients.find((c: any) => c.id === clientId || c.uid === clientId);
          if (isMounted) setClientDoc(foundClient || {});
        }

        if (jobsRes.ok) {
          const jobList = await jobsRes.json();
          if (isMounted) setApplications(jobList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [clientId]);

  const handleApprove = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'approved' })
      });
      toast.success("Candidate account approved successfully.");
    } catch (err: any) {
      toast.error("Approval failed: " + err.message);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !role) { toast.error("Company and role are required."); return; }
    try {
      const token = localStorage.getItem('jwt_token');
      // Get the Prisma numeric id for this client
      const prismaId = clientDoc?.id;
      if (!prismaId) { toast.error("Client record not found."); return; }
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientId: prismaId, company, role, location, salary, jobUrl: jobUrl || null, status: 'Applied' })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const newJob = await res.json();
      setApplications(prev => [newJob, ...prev]);
      setCompany(''); setRole(''); setLocation(''); setSalary(''); setJobUrl('');
      toast.success("Application logged successfully!");
    } catch (err: any) {
      toast.error("Failed to add application: " + err.message);
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`/api/jobs/${appId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setApplications(prev => prev.filter(a => a.id !== appId));
      toast.success("Application removed.");
    } catch (err: any) {
      toast.error("Failed to delete: " + err.message);
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
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      toast.success(`Status updated to ${status}`);
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message);
    }
  };

  const [isConfirmingPurge, setIsConfirmingPurge] = useState(false);

  const handlePurge = async () => {
    if (!isConfirmingPurge) { setIsConfirmingPurge(true); return; }
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`/api/users/${clientId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      toast.success("Candidate deleted.");
      onDelete?.();
    } catch (err: any) {
      toast.error("Purge failed: " + err.message);
      setIsConfirmingPurge(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const appData = clientDoc?.applicationData ?? clientDoc?.application_data ?? {};

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Workspace Header */}
      <div className="h-20 border-b border-gray-200 bg-white flex items-center justify-between px-10 shrink-0">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center shadow-sm">
            <BriefcaseBusiness className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 leading-none">
              {appData.firstName} {appData.lastName}
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-2 tracking-widest flex items-center gap-2">
              Candidate Record // {clientDoc?.status}
              {(clientDoc?.assigned_employee_id || clientDoc?.assignedEmployeeId) && (
                <>
                  <span className="text-gray-200">|</span>
                  <span className="text-blue-600">Assigned: {clientDoc.assigned_employee_id || clientDoc.assignedEmployeeId}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {clientDoc.status === 'pending_approval' && (
            <button 
              onClick={handleApprove}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
            >
              <UserCheck className="w-4 h-4" /> Approve Candidate
            </button>
          )}
          
          <button 
            onClick={handlePurge}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border",
              isConfirmingPurge 
                ? "bg-red-600 text-white border-red-500" 
                : "bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 border-gray-200 hover:border-red-200"
            )}
          >
            <ShieldAlert className="w-4 h-4" /> 
            {isConfirmingPurge ? "CONFIRM DELETE" : "Delete Candidate"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Col: Dossier */}
        <div className="w-[400px] border-r border-gray-200 bg-gray-50 overflow-y-auto p-10 space-y-12 custom-scrollbar shrink-0">
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2.5">
                <Target className="w-4 h-4 text-blue-600" /> Candidate Details
              </h4>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest font-mono">v6.0.0</span>
            </div>
            
            <div className="space-y-6">
              {/* Data Rows */}
              {[
                { label: 'Full Name', value: `${appData.firstName} ${appData.lastName}`, icon: User },
                { label: 'Date of Birth', value: appData.dob, icon: Clock },
                { label: 'Phone Number', value: appData.phone, icon: Phone },
                { label: 'Email Address', value: clientDoc?.email || appData.email, icon: Globe },
                { label: 'Current Company', value: appData.currentCompany, icon: Building },
                { label: 'Skills / Expertise', value: appData.domain, icon: Briefcase },
                { label: 'Total Experience', value: appData.experience, icon: Clock },
                { label: 'Current CTC', value: appData.currentCTC, icon: DollarSign },
                { label: 'Expected CTC', value: appData.expectedCTC, icon: DollarSign, isMoney: true },
                { label: 'Permanent Address', value: appData.permanentAddress, icon: MapPin },
                { label: 'Preferred Location', value: appData.preferredLocation, icon: MapPin },
                { label: 'LinkedIn Profile', value: appData.linkedinUrl, icon: Linkedin },
                { label: 'Portfolio URL', value: appData.portfolioUrl, icon: Globe }
              ].map((row, i) => (
                <div key={i} className="group/row space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.1em]">{row.label}</span>
                    <CopyButton value={row.value} label={row.label} />
                  </div>
                  <div className="flex items-center gap-3.5 text-gray-900 p-4 bg-white border border-gray-200 rounded-2xl group-hover/row:border-blue-200 group-hover/row:shadow-md transition-all shadow-sm">
                    {row.icon && <row.icon className="w-4 h-4 text-gray-300 group-hover/row:text-blue-500 transition-colors" />}
                    <span className={cn(
                      "text-sm truncate flex-1 font-semibold capitalize",
                      row.isMoney ? "text-blue-600" : "text-gray-900"
                    )}>
                      {row.value || 'NOT SPECIFIED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
             <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2.5 border-b border-gray-200 pb-4">
              <Zap className="w-4 h-4 text-blue-600" /> Professional Skills
            </h4>
            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm italic text-xs text-gray-600 leading-relaxed font-medium">
              {appData.skills || 'NO SKILLS DEFINED'}
            </div>
          </section>

          <section className="space-y-4">
             <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2.5 border-b border-gray-200 pb-4">
              <FileText className="w-4 h-4 text-emerald-600" /> Work History (Resume)
            </h4>
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm text-xs text-gray-600 whitespace-pre-wrap leading-loose font-medium max-h-96 overflow-y-auto custom-scrollbar">
              {appData.workHistory || 'NO HISTORY DATA PROVIDED'}
            </div>
          </section>

          <section className="space-y-4">
             <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2.5 border-b border-gray-200 pb-4">
              <GraduationCap className="w-4 h-4 text-purple-600" /> Education
            </h4>
            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-1">
              <p className="text-xs font-black text-gray-900 uppercase">{appData.education?.degree} // {appData.education?.college}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Class of {appData.education?.year}</p>
            </div>
          </section>

          <section className="space-y-4">
             <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2.5 border-b border-gray-200 pb-4">
              <Target className="w-4 h-4 text-amber-500" /> Market Preferences
            </h4>
            <div className="flex flex-wrap gap-2">
              {appData.targetRoles?.map((role: string) => (
                <span key={role} className="px-4 py-2 bg-white border border-gray-200 text-[10px] font-bold text-gray-600 uppercase tracking-widest rounded-xl hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all shadow-sm">
                  {role}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Right Col: Operations */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          {/* Dispatch Engine Form */}
          <div className="p-10 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-1">Add New Application</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Log a job you have applied for on behalf of this candidate.</p>
               </div>
               
               {/* Mode Toggle */}
               <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                  {[
                    { id: 'link', label: 'Paste Link', icon: Link2 },
                    { id: 'manual', label: 'Type Manually', icon: Terminal }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setEntryMode(mode.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        entryMode === mode.id 
                          ? "bg-gray-100 text-gray-900 shadow-inner" 
                          : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      <mode.icon className="w-3.5 h-3.5" />
                      {mode.label}
                    </button>
                  ))}
               </div>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Company Name</label>
                  <div className="relative group">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text" placeholder="E.G. GOOGLE" value={company} onChange={e => setCompany(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-gray-900 uppercase focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-gray-300 shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Job Title</label>
                  <div className="relative group">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text" placeholder="JOB TITLE" value={role} onChange={e => setRole(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-gray-900 uppercase focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-gray-300 shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Location</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text" placeholder="LOCATION" value={location} onChange={e => setLocation(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-gray-900 uppercase focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-gray-300 shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Expected Salary</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text" placeholder="SALARY RANGE" value={salary} onChange={e => setSalary(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-gray-900 uppercase focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-gray-300 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Job Link</label>
                   <div className="relative group">
                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                      <input 
                        type="url" placeholder="HTTPS://VACANCY-LINK.COM/ID" value={jobUrl} onChange={e => setJobUrl(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-12 py-3.5 text-sm font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-gray-300 shadow-sm"
                      />
                      {jobUrl && jobUrl.startsWith('http') && (
                        <button
                          type="button"
                          onClick={handleAutoFill}
                          disabled={isParsing}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-50"
                          title="Auto-fill details from link"
                        >
                          {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </button>
                      )}
                   </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isAdding}
                  className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center disabled:opacity-50 h-[52px] group"
                >
                  {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  <span className="ml-3 text-xs font-black uppercase tracking-widest">Save Application</span>
                </button>
              </div>
            </form>
          </div>

          {/* History Feed */}
          <div className="flex-1 overflow-hidden flex flex-col">
             <div className="flex items-center justify-between px-10 py-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-6">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Past Applications</h4>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-mono">{applications.length} Total Applied</span>
                </div>
                <div className="flex gap-6">
                  {['Applied', 'Interview', 'Assessment', 'Selected', 'Rejected'].map(s => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        s === 'Applied' ? 'bg-blue-500' : s === 'Interview' ? 'bg-amber-500' : s === 'Assessment' ? 'bg-purple-500' : s === 'Selected' ? 'bg-emerald-500' : s === 'Rejected' ? 'bg-red-500' : 'bg-gray-300'
                      )} />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s}</span>
                    </div>
                  ))}
                </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-gray-50/30">
                <div className="grid grid-cols-1 gap-4">
                  {applications.map((app, idx) => (
                    <div 
                      key={app.id} 
                      className="group flex items-center justify-between p-6 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 rounded-3xl transition-all shadow-sm"
                    >
                       <div className="flex items-center gap-8 flex-1 min-w-0">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all shrink-0",
                            app.status === 'Applied'    ? 'bg-blue-50 border-blue-100 text-blue-600' :
                            app.status === 'Interview'  ? 'bg-amber-50 border-amber-100 text-amber-600' :
                            app.status === 'Assessment' ? 'bg-purple-50 border-purple-100 text-purple-600' :
                            app.status === 'Selected'   ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                            app.status === 'Rejected'   ? 'bg-red-50 border-red-100 text-red-600' :
                            'bg-gray-50 border-gray-100 text-gray-400'
                          )}>
                            <Monitor className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0 grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="min-w-0">
                              <h5 className="text-sm font-black text-gray-900 uppercase truncate">{app.role}</h5>
                              <p className="text-[10px] font-bold text-gray-400 uppercase truncate mt-1">@ {app.company}</p>
                            </div>
                            <div className="hidden lg:block">
                              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest block mb-1">Region</span>
                              <p className="text-xs font-bold text-gray-600 uppercase truncate">{app.location || appData.location || 'REMOTE'}</p>
                            </div>
                            <div className="hidden lg:block">
                              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest block mb-1">Dispatch Date</span>
                              <p className="text-xs font-bold text-gray-600 uppercase tabular-nums">{app.applied_date}</p>
                            </div>
                            <div className="flex items-center gap-3">
                               <a 
                                href={app.job_url} 
                                target="_blank" 
                                className="p-2.5 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-xl text-gray-400 hover:text-blue-600 transition-all"
                                title="Source Document"
                               >
                                  <ExternalLink className="w-4 h-4" />
                               </a>
                               <CopyButton value={app.job_url} label="Job URL" />
                            </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-6 ml-10">
                        <div className="relative group/status">
                          <select 
                            value={app.status} 
                            onChange={(e) => updateAppStatus(app.id, e.target.value)}
                            className={cn(
                              "appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-gray-200 cursor-pointer transition-all",
                              app.status === 'Applied'    ? 'text-blue-600 border-blue-200 bg-blue-50' :
                              app.status === 'Interview'  ? 'text-amber-600 border-amber-200 bg-amber-50' :
                              app.status === 'Assessment' ? 'text-purple-600 border-purple-200 bg-purple-50' :
                              app.status === 'Selected'   ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                              app.status === 'Rejected'   ? 'text-red-600 border-red-200 bg-red-50' :
                              'text-gray-600 hover:text-gray-900 border-gray-200 bg-white'
                            )}
                          >
                            <option>Applied</option>
                            <option>Interview</option>
                            <option>Assessment</option>
                            <option>Selected</option>
                            <option>Rejected</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <button 
                          onClick={() => handleDeleteApplication(app.id)}
                          className="p-3 text-gray-300 hover:text-red-600 transition-all rounded-2xl hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                       </div>
                    </div>
                  ))}

                  {applications.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center justify-center space-y-6">
                       <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                        <Database className="w-10 h-10 text-gray-200" />
                       </div>
                       <div className="space-y-2">
                        <p className="text-sm font-black text-gray-900 uppercase tracking-widest">No Applications Yet</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Paste a link or type details above to save your first application for this candidate.</p>
                       </div>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Monitor = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>
  </svg>
);
