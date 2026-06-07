import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '../contexts/UserRoleContext';
import ClientDashboard from '../components/ClientDashboard';
import EmployeeDashboard from '../components/EmployeeDashboard';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { userProfile, clientProfile, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-widest">Initialising Terminal...</p>
      </div>
    );
  }

  const role = userProfile?.role || 'client';
  const onboardingCompleted = clientProfile?.onboarding_completed || !!clientProfile?.application_data?.firstName;

  // Redirect clients to onboarding if not completed and not skipped
  if (role === 'client' && !onboardingCompleted && !clientProfile?.onboardingSkipped) {
    return <Navigate to="/onboarding" replace />;
  }

  // Route to professional dashboards
  if (role === 'employee' || role === 'admin') {
    return <EmployeeDashboard />;
  }

  return <ClientDashboard />;
}
