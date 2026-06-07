import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Features from './pages/Features';
import About from './pages/About';
import Settings from './pages/Settings';
import HowToUse from './pages/HowToUse';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import StudentDossierPage from './pages/StudentDossierPage';
import Banned from './pages/Banned';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Security from './pages/Security';
import { Toaster } from 'sonner';
import { ThemeProvider } from './lib/ThemeContext';
import { UserRoleProvider, useUserRole } from './contexts/UserRoleContext';

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, userProfile } = useUserRole();
  const isBanned = (userProfile as any)?.isBanned || false;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-black uppercase tracking-widest">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs">Authenticating...</span>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (isBanned) {
    return <Navigate to="/banned" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/features" element={<Features />} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/security" element={<Security />} />
      <Route path="/guide" element={<HowToUse />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/banned" element={<Banned />} />
      
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin/candidate/:clientId" element={
        <ProtectedRoute>
          <StudentDossierPage />
        </ProtectedRoute>
      } />

      <Route path="/onboarding" element={
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <UserRoleProvider>
        <Toaster theme="dark" position="bottom-right" />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </UserRoleProvider>
    </ThemeProvider>
  );
}
