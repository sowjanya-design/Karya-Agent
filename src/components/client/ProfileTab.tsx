import React, { useState } from 'react';
import { useUserRole } from '../../contexts/UserRoleContext';
import { 
  CheckCircle2, 
  Loader2, 
  User,
  Phone,
  MapPin,
  Briefcase,
  Target,
  Link2,
  DollarSign,
  Globe,
  Plus,
  X,
  Save,
  Clock,
  GraduationCap,
  Building
} from 'lucide-react';
import { toast } from 'sonner';

export const ProfileTab: React.FC = () => {
  const { user, clientProfile, refreshProfile } = useUserRole();
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form State
  const [formData, setFormData] = useState({
    firstName: clientProfile?.application_data?.firstName || '',
    lastName: clientProfile?.application_data?.lastName || '',
    dob: clientProfile?.application_data?.dob || '',
    phone: clientProfile?.application_data?.phone || '',
    email: clientProfile?.application_data?.email || '',
    permanentAddress: clientProfile?.application_data?.permanentAddress || '',
    preferredLocation: clientProfile?.application_data?.preferredLocation || '',
    domain: clientProfile?.application_data?.domain || '',
    experience: clientProfile?.application_data?.experience || '',
    currentCompany: clientProfile?.application_data?.currentCompany || '',
    currentCTC: clientProfile?.application_data?.currentCTC || '',
    expectedCTC: clientProfile?.application_data?.expectedCTC || '',
    linkedinUrl: clientProfile?.application_data?.linkedinUrl || '',
    portfolioUrl: clientProfile?.application_data?.portfolioUrl || '',
    skills: clientProfile?.application_data?.skills || '',
    workHistory: clientProfile?.application_data?.workHistory || '',
    degree: clientProfile?.application_data?.education?.degree || '',
    college: clientProfile?.application_data?.education?.college || '',
    year: clientProfile?.application_data?.education?.year || ''
  });

  const [targetRoles, setTargetRoles] = useState<string[]>(clientProfile?.application_data?.targetRoles || []);
  const [roleInput, setRoleInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddRole = () => {
    if (roleInput.trim() && !targetRoles.includes(roleInput.trim())) {
      setTargetRoles(prev => [...prev, roleInput.trim()]);
      setRoleInput('');
    }
  };

  const handleRemoveRole = (role: string) => {
    setTargetRoles(prev => prev.filter(r => r !== role));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: formData.dob,
        phone: formData.phone,
        email: formData.email,
        permanentAddress: formData.permanentAddress,
        preferredLocation: formData.preferredLocation,
        domain: formData.domain,
        experience: formData.experience,
        currentCompany: formData.currentCompany,
        currentCTC: formData.currentCTC,
        expectedCTC: formData.expectedCTC,
        linkedinUrl: formData.linkedinUrl,
        portfolioUrl: formData.portfolioUrl,
        skills: formData.skills,
        workHistory: formData.workHistory,
        education: {
          degree: formData.degree,
          college: formData.college,
          year: formData.year
        },
        targetRoles,
        updatedAt: new Date().toISOString()
      };

      const token = localStorage.getItem('jwt_token');
      const userId = (user as any).uid || user.id;
      const res = await fetch(`/api/clients/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ applicationData: payload })
      });
      if (!res.ok) throw new Error("Failed to update profile");

      await refreshProfile();
      toast.success("Profile saved successfully!");
    } catch (err: any) {
      toast.error("Failed to save changes: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 lg:p-10">
        <header className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-headline-md text-gray-900">My Professional Profile</h3>
            <p className="text-body-md text-gray-500">Manage your credentials and application settings</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Identity Section */}
          <section className="space-y-6">
            <h4 className="text-label text-gray-400 border-b border-slate-100 pb-3">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 flex items-center gap-2">
                  <User className="w-3 h-3" /> First Name
                </label>
                <input 
                  type="text" name="firstName" value={formData.firstName} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 flex items-center gap-2">
                  <User className="w-3 h-3" /> Last Name
                </label>
                <input 
                  type="text" name="lastName" value={formData.lastName} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Phone Number
                </label>
                <input 
                  type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Permanent Address
                </label>
                <input 
                  type="text" name="permanentAddress" value={formData.permanentAddress} onChange={handleInputChange}
                  placeholder="Street, City, State, Country"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Preferred Job Location
                </label>
                <input 
                  type="text" name="preferredLocation" value={formData.preferredLocation} onChange={handleInputChange}
                  placeholder="E.G. NEW YORK, REMOTE"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all font-bold"
                />
              </div>
            </div>
          </section>

          {/* New Sections */}
          <section className="space-y-6">
            <h4 className="text-label text-gray-400 border-b border-slate-100 pb-3">Professional Links</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 flex items-center gap-2">
                  <Link2 className="w-3 h-3" /> LinkedIn Profile
                </label>
                <input 
                  type="url" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 flex items-center gap-2">
                  <Link2 className="w-3 h-3" /> Portfolio / GitHub
                </label>
                <input 
                  type="url" name="portfolioUrl" value={formData.portfolioUrl} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all"
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h4 className="text-label text-gray-400 border-b border-slate-100 pb-3">Professional Context</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Professional Domain
                </label>
                <input 
                  type="text" name="domain" value={formData.domain} onChange={handleInputChange}
                  placeholder="Full Stack, Data Science, etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 flex items-center gap-2">
                  <Briefcase className="w-3 h-3" /> Total Experience
                </label>
                <input 
                  type="text" name="experience" value={formData.experience} onChange={handleInputChange}
                  placeholder="E.G. 5 YEARS"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 flex items-center gap-2">
                  <Building className="w-3 h-3" /> Current Company
                </label>
                <input 
                  type="text" name="currentCompany" value={formData.currentCompany} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> Current CTC
                </label>
                <input 
                  type="text" name="currentCTC" value={formData.currentCTC} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> Expected CTC
                </label>
                <input 
                  type="text" name="expectedCTC" value={formData.expectedCTC} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all font-bold"
                />
              </div>
            </div>
          </section>

          {/* Resume Equivalent Section */}
          <section className="space-y-6">
            <h4 className="text-label text-gray-400 border-b border-slate-100 pb-3">Experience & Skills</h4>
            <div className="space-y-4">
              <label className="text-[12px] font-medium text-gray-500 block">Top Skills</label>
              <textarea 
                name="skills" value={formData.skills} onChange={(e: any) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm focus:ring-4 focus:ring-blue-100 transition-all min-h-[100px]"
                placeholder="List your key technical skills..."
              />
            </div>
            <div className="space-y-4">
              <label className="text-[12px] font-medium text-gray-500 block">Work Experience History</label>
              <textarea 
                name="workHistory" value={formData.workHistory} onChange={(e: any) => setFormData(prev => ({ ...prev, workHistory: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-6 text-sm focus:ring-4 focus:ring-blue-100 transition-all min-h-[200px] leading-relaxed"
                placeholder="Paste your past job responsibilities and achievements..."
              />
            </div>
          </section>

          {/* Education Section */}
          <section className="space-y-6">
            <h4 className="text-label text-gray-400 border-b border-slate-100 pb-3">Education</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 block">Highest Degree</label>
                <input 
                  type="text" name="degree" value={formData.degree} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 block">College/University</label>
                <input 
                  type="text" name="college" value={formData.college} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-500 block">Graduation Year</label>
                <input 
                  type="text" name="year" value={formData.year} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Target Roles Section - Added opening tag */}
          <section className="space-y-6">
            <h4 className="text-label text-gray-400 border-b border-slate-100 pb-3">Target Career Path</h4>
            <div className="space-y-4 pt-2">
              <label className="text-[12px] font-medium text-gray-500 flex items-center gap-2">
                <Target className="w-3 h-3" /> Target Roles
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="e.g. Senior Backend Developer..." value={roleInput} onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 transition-all"
                />
                <button type="button" onClick={handleAddRole} className="px-4 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
                  <Plus className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {targetRoles.map(role => (
                  <div key={role} className="flex items-center gap-1 pl-3 pr-1 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
                    <span className="text-[12px] font-medium text-blue-700">{role}</span>
                    <button type="button" onClick={() => handleRemoveRole(role)} className="p-1 hover:bg-blue-100 rounded-full transition-colors text-blue-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="pt-6 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile Changes
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
