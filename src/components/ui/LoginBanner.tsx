import React, { useEffect, useState } from 'react';
import { X, Calendar } from 'lucide-react';

interface InterviewAlert {
  id: string;
  role: string;
  company: string;
  updatedAt: string;
  candidateName?: string; // for counselor/admin
}

interface Props {
  role: 'client' | 'employee' | 'admin';
  userName: string;
  token: string | null;
  clientUid?: string; // for candidate: fetch own jobs
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function LoginBanner({ role, userName, token, clientUid }: Props) {
  const [alerts, setAlerts] = useState<InterviewAlert[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!token) return;

    const storageKey = `karya_dismissed_${role}_${userName}`;
    const savedDismissed: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    setDismissed(savedDismissed);

    const fetchAlerts = async () => {
      try {
        let found: InterviewAlert[] = [];

        if (role === 'client' && clientUid) {
          const res = await fetch(`/api/jobs/${clientUid}`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const jobs = await res.json();
            found = jobs
              .filter((j: any) => j.status === 'Interview')
              .map((j: any) => ({ id: j.id, role: j.role, company: j.company, updatedAt: j.updatedAt || j.createdAt }));
          }
        } else {
          // counselor / admin: fetch all clients they can see
          const res = await fetch('/api/clients', { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const clients = await res.json();
            for (const client of clients) {
              const jobs: any[] = client.jobs || [];
              const name = [client.applicationData?.firstName, client.applicationData?.lastName].filter(Boolean).join(' ') || client.email || 'A candidate';
              for (const j of jobs) {
                if (j.status === 'Interview') {
                  found.push({ id: j.id, role: j.role, company: j.company, updatedAt: j.updatedAt || j.createdAt, candidateName: name });
                }
              }
            }
          }
        }

        const newAlerts = found.filter(a => !savedDismissed.includes(a.id));
        if (newAlerts.length > 0) {
          setAlerts(newAlerts);
          setVisible(true);
        }
      } catch {
        // silent fail
      }
    };

    fetchAlerts();
  }, [token, role, userName, clientUid]);

  const dismiss = (id: string) => {
    const storageKey = `karya_dismissed_${role}_${userName}`;
    const next = [...dismissed, id];
    localStorage.setItem(storageKey, JSON.stringify(next));
    setDismissed(next);
    setAlerts(prev => prev.filter(a => a.id !== id));
    if (alerts.length <= 1) setVisible(false);
  };

  const dismissAll = () => {
    const storageKey = `karya_dismissed_${role}_${userName}`;
    const next = [...dismissed, ...alerts.map(a => a.id)];
    localStorage.setItem(storageKey, JSON.stringify(next));
    setDismissed(next);
    setAlerts([]);
    setVisible(false);
  };

  if (!visible || alerts.length === 0) return null;

  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <div className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 shadow-md z-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black">Hey {firstName}! 👋</p>
            <div className="mt-1 space-y-1">
              {alerts.slice(0, 3).map(a => (
                <div key={a.id} className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium leading-snug">
                    {role === 'client'
                      ? <>You have an <strong>Interview</strong> stage active for <strong>{a.role}</strong> at <strong>{a.company}</strong> — updated {formatDate(a.updatedAt)}</>
                      : <><strong>{a.candidateName}</strong> has an <strong>Interview</strong> for <strong>{a.role}</strong> at <strong>{a.company}</strong> — updated {formatDate(a.updatedAt)}</>
                    }
                  </p>
                  <button onClick={() => dismiss(a.id)} className="shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {alerts.length > 3 && (
                <p className="text-xs font-bold opacity-80">+{alerts.length - 3} more interview alerts</p>
              )}
            </div>
          </div>
          <button onClick={dismissAll} className="shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors text-xs font-bold">
            Dismiss all
          </button>
        </div>
      </div>
    </div>
  );
}
