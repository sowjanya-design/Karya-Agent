import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, LogOut, CheckCircle2, Clock, User } from 'lucide-react';
import { useUserRole } from '../contexts/UserRoleContext';
import { ProfileDigest } from '../components/client/ProfileDigest';
import { TrackerTab } from '../components/client/TrackerTab';
import { toast } from 'sonner';

export default function StudentDossierPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { userProfile, loading: roleLoading } = useUserRole();
  const [client, setClient] = useState<any | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = userProfile?.role === 'admin' || 
                 userProfile?.email?.toLowerCase() === 'mkarthikeya24@gmail.com' || 
                 userProfile?.email?.toLowerCase() === 'kbsn1170@gmail.com';

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Unauthorized: Admin credentials required.");
      navigate('/dashboard');
    }
  }, [roleLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!clientId || !isAdmin) return;
    
    let isMounted = true;
    const loadDossier = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const [clientRes, jobsRes] = await Promise.all([
          fetch(`/api/clients`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/jobs/${clientId}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (!clientRes.ok) throw new Error("Failed to load client");
        const allClients = await clientRes.json();
        const foundClient = allClients.find((c: any) => c.id === clientId || c.uid === clientId);
        if (!foundClient) {
          toast.error("Candidate profile not found.");
          navigate('/admin');
          return;
        }
        if (isMounted) setClient(foundClient);

        if (jobsRes.ok) {
          const jobList = await jobsRes.json();
          if (isMounted) setJobs(jobList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      } catch (err) {
        console.error("Error fetching dossier:", err);
        toast.error("Failed to load dossier data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadDossier();
    return () => { isMounted = false; };
  }, [clientId, isAdmin, navigate]);

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-widest">Loading Candidate Data...</p>
      </div>
    );
  }

  if (!client) return null;

  const isApproved = client.status === 'approved' || client.status === 'active';

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar - Minimalist version for Admin View */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col p-6 overflow-y-auto">
        <div className="mb-10 px-2">
          <h1 className="text-2xl font-black text-blue-600 tracking-tight">KARYA</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center bg-slate-50 py-1 rounded">Admin View</p>
        </div>

        <nav className="space-y-1 flex-1">
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </nav>

        <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-blue-600 uppercase">
              {client.application_data?.firstName?.[0] || 'C'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {client.application_data?.firstName} {client.application_data?.lastName}
              </p>
              <p className="text-[10px] font-medium text-slate-400 truncate uppercase tracking-wider">Candidate ID: {clientId.slice(0, 8)}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button 
              onClick={() => navigate('/admin')}
              className="p-2 lg:hidden bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-bold text-slate-800">
              Candidate Overview
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {client.assigned_employee_id && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold border border-blue-100">
                <User className="w-3.5 h-3.5" /> Consultant: {client.assigned_employee_id}
              </div>
            )}
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
              onClick={() => {
                localStorage.removeItem('jwt_token');
                window.location.href = '/';
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-6xl mx-auto">
          {client.application_data && (
            <ProfileDigest data={client.application_data} />
          )}
          <TrackerTab jobs={jobs} />
        </div>
      </main>
    </div>
  );
}
