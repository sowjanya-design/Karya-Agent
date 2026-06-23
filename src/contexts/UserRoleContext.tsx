import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'employee' | 'client';

export interface ApplicationData {
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string;
  permanentAddress: string;
  preferredLocation: string;
  education: {
    degree: string;
    college: string;
    year: string;
  };
  domain: string;
  experience: string;
  currentCompany: string;
  currentCTC: string;
  expectedCTC: string;
  linkedinUrl: string;
  portfolioUrl?: string;
  skills: string;
  workHistory: string;
  targetRoles: string[];
  updatedAt?: string;
}

export interface ClientProfile {
  id: string;
  assigned_employee_id: string;
  status: 'incomplete' | 'active' | 'completed' | 'banned' | 'pending_approval';
  master_resume_storage_url?: string;
  onboardingSkipped?: boolean;
  onboarding_completed?: boolean;
  application_data?: ApplicationData;
  createdAt: string;
}

interface UserRoleContextType {
  user: any | null;
  userProfile: {
    uid: string;
    email: string;
    role: UserRole;
    assigned_clients?: string[];
  } | null;
  clientProfile: ClientProfile | null;
  loading: boolean;
  setRole: (role: UserRole) => Promise<void>;
  updateClientIntake: (data: Partial<ApplicationData>, masterResumeUrl?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  login: (token: string, user: any, clientProfile?: any) => void;
  logout: () => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserRoleContextType['userProfile'] | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await res.json();
      setUser(data.user);
      setUserProfile({
        uid: data.user.uid,
        email: data.user.email,
        role: data.user.role as UserRole,
        assigned_clients: data.user.assignedClients || []
      });

      if (data.clientProfile) {
        setClientProfile({
          id: data.clientProfile.uid,
          assigned_employee_id: data.clientProfile.assignedEmployeeId || 'default_employee',
          status: data.clientProfile.status,
          application_data: data.clientProfile.applicationData || {},
          master_resume_storage_url: data.clientProfile.masterResumeStorageUrl,
          onboardingSkipped: data.clientProfile.onboardingSkipped,
          createdAt: data.clientProfile.createdAt
        });
      }
    } catch (err) {
      console.error("Error loading user context:", err);
      localStorage.removeItem('jwt_token');
      setUser(null);
      setUserProfile(null);
      setClientProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const login = (token: string, userData: any, clientProfileData?: any) => {
    localStorage.setItem('jwt_token', token);
    setUser(userData);
    setUserProfile({
      uid: userData.uid,
      email: userData.email,
      role: userData.role as UserRole,
      assigned_clients: userData.assignedClients || []
    });
    if (clientProfileData) {
      setClientProfile({
        id: clientProfileData.uid,
        assigned_employee_id: clientProfileData.assignedEmployeeId || 'default_employee',
        status: clientProfileData.status,
        application_data: clientProfileData.applicationData || {},
        master_resume_storage_url: clientProfileData.masterResumeStorageUrl,
        onboardingSkipped: clientProfileData.onboardingSkipped,
        createdAt: clientProfileData.createdAt
      });
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setUser(null);
    setUserProfile(null);
    setClientProfile(null);
  };

  const setRole = async (newRole: UserRole) => {
    toast.error("Role switching not fully implemented via REST API yet.");
  };

  const updateClientIntake = async (formData: Partial<ApplicationData>, masterResumeUrl?: string) => {
    if (!user) return;
    const token = localStorage.getItem('jwt_token');
    try {
      const payload = {
        applicationData: { ...(clientProfile?.application_data || {}), ...formData },
        status: 'pending_approval' as const,
        ...(masterResumeUrl && { masterResumeStorageUrl: masterResumeUrl })
      };

      const res = await fetch(`/api/clients/${user.uid}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Update failed');
      await fetchProfileData();
      toast.success("Intake profile submitted successfully!");
    } catch (err: any) {
      toast.error(`Failed to submit intake form: ${err.message}`);
    }
  };

  const refreshProfile = async () => {
    await fetchProfileData();
  };

  return (
    <UserRoleContext.Provider value={{
      user,
      userProfile,
      clientProfile,
      loading,
      setRole,
      updateClientIntake,
      refreshProfile,
      login,
      logout
    }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}
