import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Mail, Lock, ShieldAlert, Briefcase, Building2, UserCheck, Eye, EyeOff, Clock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Logo from '../components/Logo';
import { useUserRole } from '../contexts/UserRoleContext';

type LoginType = 'client' | 'employee' | 'admin';

export default function Auth() {
  const [activeTab, setActiveTab] = useState<LoginType>('client');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState('');
  const [showAuthSetupGuide, setShowAuthSetupGuide] = useState(false);
  
  const navigate = useNavigate();
  const { user, userProfile, clientProfile, loading, login, logout } = useUserRole();

  // Pre-warm the server + Neon the moment the auth page loads so login is fast
  useEffect(() => {
    fetch('/api/ping').catch(() => {});
  }, []);

  const loggedInUser = user;
  const loggedInRole = userProfile?.role;
  const isApproved = user?.isApproved ?? false;
  
  const isProfileComplete = clientProfile 
    ? !!clientProfile.application_data?.firstName || !!clientProfile.onboardingSkipped 
    : (loggedInRole !== 'client');

  const checkingActiveSession = loading;

  const proceedToWorkspace = (role: string, profileComplete: boolean, approved: boolean) => {
    if (!approved && role === 'client') {
      toast.error("Your access request is still pending approval.");
      return;
    }
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'employee') {
      navigate('/dashboard');
    } else {
      if (profileComplete) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      logout();
      toast.success("Bye! You logged out.");
    } catch (err: any) {
      toast.error("We couldn't log you out: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password.');
      return;
    }
    if (isSignUp && !name) {
      toast.error('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    setLoginStatus('Connecting...');
    const cleanEmail = email.toLowerCase().trim();

    // Progressive status messages so user knows server is waking up
    const t1 = setTimeout(() => setLoginStatus('Server is starting up, please wait...'), 4000);
    const t2 = setTimeout(() => setLoginStatus('Almost there, waking up the database...'), 10000);
    const t3 = setTimeout(() => setLoginStatus('This is taking a bit longer than usual... still trying'), 18000);

    const clearTimers = () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };

    try {
      if (isSignUp) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password, displayName: name, role: activeTab }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        login(data.token, data.user);
        if (activeTab === 'client') {
          toast.success("Account created! Candidate access is pending review.");
        } else {
          toast.success(`${activeTab.toUpperCase()} account created successfully.`);
        }
        setIsSignUp(false);
      } else {
        let res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        // Auto-retry once if server reports DB cold-start
        if (res.status === 500) {
          const err = await res.json().catch(() => ({}));
          if ((err.error || '').includes('starting up') || (err.error || '').includes('timeout')) {
            setLoginStatus('Database waking up, retrying...');
            await new Promise(r => setTimeout(r, 3000));
            res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: cleanEmail, password }),
            });
          }
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        if (data.user.role !== activeTab) {
          toast.error(`Access Denied: This account is registered as ${data.user.role.toUpperCase()}. Please use the correct tab.`);
          return;
        }

        login(data.token, data.user, data.clientProfile);

        const role = data.user.role;
        const approved = data.user.isApproved ?? false;
        const profileComplete = data.clientProfile
          ? !!(data.clientProfile.applicationData?.firstName) || !!(data.clientProfile.onboardingSkipped)
          : role !== 'client';
        proceedToWorkspace(role, profileComplete, approved);
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      clearTimers();
      setLoginStatus('');
      setIsLoading(false);
    }
  };

  const getThemeColors = () => {
    switch(activeTab) {
      case 'employee':
        return {
          accent: 'text-emerald-400',
          bgAccent: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          buttonBg: 'bg-emerald-500 text-bg-deep',
          shadow: 'shadow-emerald-500/10',
          gColor: 'from-emerald-950/20 via-transparent to-transparent'
        };
      case 'admin':
        return {
          accent: 'text-purple-400',
          bgAccent: 'bg-purple-500/10',
          border: 'border-purple-500/20',
          buttonBg: 'bg-purple-500 text-bg-deep',
          shadow: 'shadow-purple-500/10',
          gColor: 'from-purple-950/20 via-transparent to-transparent'
        };
      case 'client':
      default:
        return {
          accent: 'text-amber-400',
          bgAccent: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          buttonBg: 'bg-amber-500 text-bg-deep',
          shadow: 'shadow-amber-500/10',
          gColor: 'from-amber-950/10 via-transparent to-transparent'
        };
    }
  };

  const currentTheme = getThemeColors();

  return (
    <div className="min-h-screen bg-bg-deep text-brand-primary font-sans selection:bg-brand-accent/30 selection:text-brand-accent flex items-center justify-center relative overflow-hidden p-6">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -top-[10%] -left-[5%] w-[70%] h-[70%] rounded-full bg-brand-accent/5 blur-[140px] h-full ${currentTheme.gColor}`}
        />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-xl bg-bg-card/25 border border-border-subtle rounded-[2.5rem] backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.15)] overflow-hidden"
      >
        {checkingActiveSession ? (
          <div className="p-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-8 h-8 border-2 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
            <p className="text-[10px] uppercase font-black tracking-widest text-brand-muted">Checking account...</p>
          </div>
        ) : loggedInUser && (loggedInRole !== 'client' || isApproved) ? (
          <div className="p-8 sm:p-10 space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="mb-4">
                <Logo size="md" />
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                YOU ARE LOGGED IN
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black font-display text-brand-primary tracking-tight">
                  Welcome to Karya
                </h3>
                <p className="text-brand-muted text-xs font-semibold">
                  You are signed in and ready to go.
                </p>
              </div>
            </div>

            <div className="p-6 bg-bg-deep/50 border border-border-subtle rounded-2xl space-y-1.5 font-mono text-left">
              <p className="text-[9px] uppercase font-black tracking-wider text-brand-muted">EMAIL</p>
              <p className="text-xs font-bold text-brand-primary break-all">{loggedInUser.email}</p>
              <div className="pt-2 border-t border-border-subtle/30 mt-2 flex items-center justify-between">
                <span className="text-[9px] uppercase font-black tracking-wider text-brand-muted">YOUR ROLE</span>
                <span className="text-[9px] uppercase font-black text-brand-accent tracking-widest bg-brand-accent/10 px-2.5 py-0.5 rounded-lg border border-brand-accent/20">
                  {loggedInRole === 'admin' ? 'Admin' : loggedInRole === 'employee' ? 'Consultant' : 'Candidate'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => proceedToWorkspace(loggedInRole || 'client', isProfileComplete, isApproved)}
                className="w-full py-5 rounded-xl bg-brand-accent text-bg-deep font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-brand-accent/30"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full py-5 rounded-xl border border-border-subtle hover:border-brand-primary/40 text-brand-muted hover:text-brand-primary bg-bg-deep/10 font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        ) : loggedInUser && !isApproved ? (
          <div className="p-8 sm:p-10 space-y-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="mb-4">
                <Logo size="md" />
              </div>
              
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                  <ShieldAlert className="w-4 h-4" />
                  Account Being Checked
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black font-display text-brand-primary tracking-tight uppercase">
                    Please Wait
                  </h3>
                  <p className="text-brand-muted text-sm font-semibold max-w-sm mx-auto">
                    Your profile is being reviewed by our administrative team. This usually takes 1-2 business days.
                  </p>
                </div>
              </div>

              {/* Contact Support Section */}
              <div className="w-full max-w-sm mx-auto p-5 bg-bg-deep/50 border border-border-subtle rounded-2xl space-y-3">
                <p className="text-[10px] uppercase font-black tracking-widest text-brand-muted">NEED HELP?</p>
                <a
                  href="https://wa.me/919989780825"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Chat Support
                </a>
              </div>

              <div className="w-full p-8 bg-bg-deep/40 border border-border-subtle rounded-[2rem] space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Clock className="w-20 h-20 text-brand-primary" />
                </div>

                <div className="space-y-1.5 text-left">
                  <p className="text-[9px] uppercase font-black tracking-widest text-brand-muted">YOUR EMAIL</p>
                  <p className="text-xs font-bold text-brand-primary truncate">{loggedInUser.email}</p>
                </div>

                <div className="pt-6 border-t border-border-subtle/30 space-y-4">
                  <div className="flex items-center gap-3 text-brand-muted/60 text-[10px] font-bold uppercase tracking-wider">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Waiting...
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => { toast.success("We asked the team to check again."); }}
                    className="w-full py-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-bg-deep transition-all"
                  >
                    Ask again
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-brand-muted/50 font-bold uppercase tracking-widest px-4">
                We will let you in soon.
              </p>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full py-5 rounded-2xl border border-border-subtle hover:border-brand-primary/40 text-brand-muted hover:text-brand-primary bg-bg-deep/10 font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-8 sm:p-10 pb-0 flex flex-col items-center">
              <div className="mb-8">
                <Logo size="md" />
              </div>

              <div className="flex w-full items-center gap-1.5 p-1 bg-bg-deep/50 border border-border-subtle rounded-2xl mb-8">
                <button
                  type="button"
                  onClick={() => { setActiveTab('client'); setEmail(''); setPassword(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    activeTab === 'client' 
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30 font-black' 
                      : 'text-brand-muted hover:text-brand-primary'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('employee'); setEmail(''); setPassword(''); setIsSignUp(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    activeTab === 'employee' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                      : 'text-brand-muted hover:text-brand-primary'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Consultant
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('admin'); setEmail(''); setPassword(''); setIsSignUp(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    activeTab === 'admin' 
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' 
                      : 'text-brand-muted hover:text-brand-primary'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Admin
                </button>
              </div>

              <div className="text-center mb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${currentTheme.accent}`}>
                      {activeTab === 'client' ? 'Candidate Area' : activeTab === 'employee' ? 'Consultant Area' : 'Admin Area'}
                    </span>
                    <h3 className="text-2xl font-black font-display text-brand-primary tracking-tight">
                      {activeTab === 'client' ? 'Sign In as Candidate' : activeTab === 'employee' ? 'Sign In as Consultant' : 'Sign In as Admin'}
                    </h3>
                    <p className="text-brand-muted text-xs font-semibold leading-relaxed max-w-sm mx-auto">
                      {activeTab === 'client' 
                        ? 'Check your matches and fix your resume.' 
                        : activeTab === 'employee' 
                        ? 'Manage resumes and help candidates.' 
                        : 'Manage everything.'}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <form onSubmit={handleLogin} className="p-8 sm:p-10 pt-0 space-y-6">
              <div className="space-y-4">
                <AnimatePresence>
                  {isSignUp && activeTab === 'client' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-brand-muted/40">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full bg-bg-deep/50 border border-border-subtle focus:border-brand-primary rounded-xl py-4 pl-12 pr-5 text-sm font-bold text-brand-primary focus:outline-none transition-all"
                          required={isSignUp}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-brand-muted/40">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-bg-deep/50 border border-border-subtle hover:border-border-subtle/85 focus:border-brand-primary rounded-xl py-4 pl-12 pr-5 text-sm font-bold text-brand-primary focus:outline-none transition-all placeholder:text-brand-muted/30"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-black tracking-widest text-brand-muted">Password</label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-brand-muted/40">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-bg-deep/50 border border-border-subtle hover:border-border-subtle/85 focus:border-brand-primary rounded-xl py-4 pl-12 pr-12 text-sm font-bold tracking-[0.1em] text-brand-primary focus:outline-none transition-all placeholder:text-brand-muted/30"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-brand-muted/40 hover:text-brand-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full relative overflow-hidden group py-5 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.01] ${currentTheme.buttonBg}`}
                >
                  {isLoading ? (
                    <span className="flex flex-col items-center gap-1">
                      <span className="flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-bg-deep/20 border-t-bg-deep rounded-full animate-spin" />
                        {loginStatus || (isSignUp ? 'Creating account...' : 'Logging in...')}
                      </span>
                    </span>
                  ) : (
                    <>
                      {isSignUp ? 'Create Account' : 'Sign In'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {activeTab === 'client' && (
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : 'New here? Create account'}
                  </button>
                )}
              </div>
            </form>
          </>
        )}

        <div className="p-8 sm:p-10 pt-0 text-center border-t border-border-subtle/20 bg-bg-deep/10">
          <p className="text-[8px] sm:text-[9px] text-brand-muted uppercase tracking-[0.25em] font-semibold flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            We keep your info safe.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
