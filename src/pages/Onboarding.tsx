import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Link2,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Globe,
  DollarSign,
  Calendar,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUserRole } from '../contexts/UserRoleContext';
import { cn } from '../lib/utils';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, userProfile, clientProfile } = useUserRole();

  React.useEffect(() => {
    if (userProfile && userProfile.role !== 'client') {
      const role = userProfile.role;
      const email = userProfile.email?.toLowerCase();
      if (role === 'admin' || email === 'mkarthikeya24@gmail.com' || email === 'kbsn1170@gmail.com') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [userProfile, navigate]);

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 1. NAME
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // 2. DOB
  const [dob, setDob] = useState('');
  // 3. PHONE NUMBER
  const [phone, setPhone] = useState('');
  // 4. MAIL ID
  const [email, setEmail] = useState('');

  // 5. PERMANENT ADDRESS
  const [permanentAddress, setPermanentAddress] = useState('');
  // 6. PREFERRED LOCATION
  const [preferredLocation, setPreferredLocation] = useState('');

  // 7. EDUCATION BACKGROUND & 8. PASSED OUT YEAR
  const [degree, setDegree] = useState('');
  const [college, setCollege] = useState('');
  const [gradYear, setGradYear] = useState('');
  // 9. DOMAIN
  const [domain, setDomain] = useState('');

  // 10. EXPERIENCE, 11. CURRENT COMPANY, 12. CURRENT CTC, 13. EXPECTED CTC
  const [experience, setExperience] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentCTC, setCurrentCTC] = useState('');
  const [expectedCTC, setExpectedCTC] = useState('');

  // Professional Links & Meta
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [skills, setSkills] = useState('');
  const [workHistory, setWorkHistory] = useState('');
  const [targetRole1, setTargetRole1] = useState('');
  const [targetRole2, setTargetRole2] = useState('');
  const [targetRole3, setTargetRole3] = useState('');

  const nextStep = () => {
    if (step === 1) {
      if (!firstName || !lastName || !dob || !phone || !email) {
        toast.error("Please fill out all identity information.");
        return;
      }
    }
    if (step === 2) {
      if (!permanentAddress || !preferredLocation) {
        toast.error("Please provide your location details.");
        return;
      }
    }
    if (step === 3) {
      if (!degree || !college || !gradYear || !domain) {
        toast.error("Please provide your education and domain details.");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  // Assignment handled on backend/approval phase

  const handleSubmit = async () => {
    if (!experience || !currentCTC || !expectedCTC) {
      toast.error("Please complete your professional details.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const userUid = user?.id || (user as any)?.uid;
      if (!userUid) throw new Error("User not authenticated.");

      const applicationData = {
        firstName,
        lastName,
        dob,
        phone,
        email,
        permanentAddress,
        preferredLocation,
        education: {
          degree,
          college,
          year: gradYear
        },
        domain,
        experience,
        currentCompany,
        currentCTC,
        expectedCTC,
        linkedinUrl,
        portfolioUrl,
        targetRoles: [targetRole1, targetRole2, targetRole3].filter(Boolean),
        skills,
        workHistory,
        updatedAt: new Date().toISOString()
      };

      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`/api/clients/${userUid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          applicationData,
          onboardingCompleted: true,
          status: clientProfile?.status && clientProfile.status !== 'incomplete' ? clientProfile.status : 'pending_approval'
        })
      });
      if (!res.ok) throw new Error("Update failed");

      toast.success("Profile initialized successfully!");
      navigate('/dashboard');
    } catch (err: any) {
      toast.error("Update failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col selection:bg-blue-100">
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-100 z-50">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)] transition-all duration-500"
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6">
        <div className="w-full max-w-2xl space-y-12">
          {/* Header */}
          <header className="space-y-4 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                <Sparkles className="w-3 h-3 text-blue-500" /> System Initialization
              </div>
              {step === 1 && (
                <button 
                  onClick={async () => {
                    try {
                      const userUid = user?.id || (user as any)?.uid;
                      if (userUid) {
                        const token = localStorage.getItem('jwt_token');
                        await fetch(`/api/clients/${userUid}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ onboardingSkipped: true })
                        });
                      }
                      toast.info("Onboarding paused. You can complete this later in your profile.");
                      navigate('/dashboard');
                    } catch (e) {
                      navigate('/dashboard');
                    }
                  }}
                  className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors tracking-widest text-shadow-sm"
                >
                  Skip for now
                </button>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Setup Profile</h1>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">Step {step} of 4: {
              step === 1 ? 'Personal Identity' : 
              step === 2 ? 'Location Details' : 
              step === 3 ? 'Academic & Domain' : 
              'Professional Context'
            }</p>
          </header>

          {/* Form Content */}
          <main className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] selection:bg-blue-600 selection:text-white">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="First Name" value={firstName} onChange={setFirstName} placeholder="ALEX" icon={<User className="w-4 h-4" />} />
                    <FormField label="Last Name" value={lastName} onChange={setLastName} placeholder="CHEN" icon={<User className="w-4 h-4" />} />
                    <FormField label="Date of Birth" type="date" value={dob} onChange={setDob} placeholder="YYYY-MM-DD" icon={<Calendar className="w-4 h-4" />} />
                    <FormField label="Phone Number" value={phone} onChange={setPhone} placeholder="+1 (555) 000-0000" icon={<Phone className="w-4 h-4" />} />
                    <FormField label="Mail ID" type="email" value={email} onChange={setEmail} placeholder="alex.chen@example.com" icon={<Globe className="w-4 h-4" />} />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <FormField 
                      label="Permanent Address" value={permanentAddress} onChange={setPermanentAddress} 
                      placeholder="123 Street, City, State, Country, Zip" 
                      icon={<MapPin className="w-4 h-4" />}
                    />
                    <FormField 
                      label="Preferred Location" value={preferredLocation} onChange={setPreferredLocation} 
                      placeholder="E.G. NEW YORK, REMOTE, BANGALORE" 
                      icon={<MapPin className="w-4 h-4" />}
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Highest Degree" value={degree} onChange={setDegree} placeholder="E.G. B.TECH, MS" icon={<GraduationCap className="w-4 h-4" />} />
                      <FormField label="College / University" value={college} onChange={setCollege} placeholder="E.G. STANFORD" icon={<GraduationCap className="w-4 h-4" />} />
                      <FormField label="Passed Out Year" value={gradYear} onChange={setGradYear} placeholder="E.G. 2024" icon={<Calendar className="w-4 h-4" />} />
                      <FormField label="Domain" value={domain} onChange={setDomain} placeholder="E.G. FULL STACK, DATA SCIENCE" icon={<Layers className="w-4 h-4" />} />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div 
                  key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Experience (Years)" value={experience} onChange={setExperience} placeholder="E.G. 5 YEARS" icon={<Briefcase className="w-4 h-4" />} />
                      <FormField label="Current Company" value={currentCompany} onChange={setCurrentCompany} placeholder="E.G. GOOGLE" icon={<Briefcase className="w-4 h-4" />} />
                      <FormField label="Current CTC" value={currentCTC} onChange={setCurrentCTC} placeholder="E.G. 15 LPA" icon={<DollarSign className="w-4 h-4" />} />
                      <FormField label="Expected CTC" value={expectedCTC} onChange={setExpectedCTC} placeholder="E.G. 25 LPA" icon={<DollarSign className="w-4 h-4" />} />
                    </div>

                    <div className="pt-6 border-t border-slate-100 space-y-6">
                      <FormField label="LinkedIn Profile" value={linkedinUrl} onChange={setLinkedinUrl} placeholder="LINKEIN.COM/IN/NAME" icon={<Link2 className="w-4 h-4" />} />
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                          <Layers className="w-3 h-3" /> Key Skills
                        </label>
                        <textarea 
                          value={skills} onChange={e => setSkills(e.target.value)} 
                          placeholder="TYPESCRIPT, REACT, PROJECT MANAGEMENT..."
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300 min-h-[80px] resize-none"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                          <Briefcase className="w-3 h-3" /> Experience Details
                        </label>
                        <textarea 
                          value={workHistory} onChange={e => setWorkHistory(e.target.value)} 
                          placeholder="PASTE BULLET POINTS FROM YOUR RESUME HERE..."
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-6 text-sm font-medium focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300 min-h-[150px] leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Actions */}
            <footer className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center gap-4">
              {step > 1 && (
                <button
                  onClick={prevStep}
                  className="w-full md:w-auto px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center gap-3"
                >
                  <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
              )}
              
              <button
                onClick={step === 4 ? handleSubmit : nextStep}
                disabled={isProcessing}
                className={cn(
                  "flex-1 w-full bg-blue-600 text-white py-5 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-blue-200/50 hover:shadow-none",
                  step === 4 ? "bg-emerald-600 shadow-emerald-200/50" : ""
                )}
              >
                {step === 4 ? (
                  <>
                    Initialize Profile <CheckCircle2 className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next Segment <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </footer>
          </main>

          {/* Secure Branding */}
          <div className="text-center pt-8">
            <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.4em] flex items-center justify-center gap-4">
              <span className="w-12 h-px bg-slate-100" />
              Karya Protocol v6.0 Secure Enrollment 
              <span className="w-12 h-px bg-slate-100" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const FormField = ({ label, value, onChange, placeholder, icon, description, type = "text" }: any) => (
  <div className="space-y-3 group">
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 group-focus-within:text-blue-600 transition-colors">
      {icon} {label}
    </label>
    <div className="relative">
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder:text-slate-300 outline-none"
      />
    </div>
    {description && (
      <p className="text-[9px] font-medium text-slate-400 italic px-2">
        {description}
      </p>
    )}
  </div>
);
