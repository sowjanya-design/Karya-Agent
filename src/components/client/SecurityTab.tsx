import React from 'react';
import { 
  KeyRound, 
  ShieldAlert, 
  Loader2, 
  Eye, 
  EyeOff, 
  Target 
} from 'lucide-react';

interface SecurityTabProps {
  onSave: (e: React.FormEvent) => void;
  isSaving: boolean;
  oldPass: string;
  setOldPass: (v: string) => void;
  newPass: string;
  setNewPass: (v: string) => void;
  confirmPass: string;
  setConfirmPass: (v: string) => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  onSave, isSaving, oldPass, setOldPass, newPass, setNewPass, confirmPass, setConfirmPass
}) => {
  const [showOldPass, setShowOldPass] = React.useState(false);
  const [showNewPass, setShowNewPass] = React.useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-12 space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-black uppercase tracking-tighter text-white">Security</h3>
            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">Change your password</p>
          </div>
        </div>

        <form onSubmit={onSave} className="space-y-8 relative z-10">
          <div className="space-y-4">
            <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">Current Password</label>
            <div className="relative">
              <input 
                type={showOldPass ? 'text' : 'password'} 
                value={oldPass} 
                onChange={e => setOldPass(e.target.value)} 
                className="w-full bg-[#070707] border border-white/5 rounded-2xl py-5 px-6 text-[10px] font-black tracking-widest text-white/70 focus:border-white focus:outline-none transition-all" 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowOldPass(!showOldPass)} 
                className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
              >
                {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">New Password</label>
              <div className="relative">
                <input 
                  type={showNewPass ? 'text' : 'password'} 
                  value={newPass} 
                  onChange={e => setNewPass(e.target.value)} 
                  className="w-full bg-[#070707] border border-white/5 rounded-2xl py-5 px-6 text-[10px] font-black tracking-widest text-white/70 focus:border-white focus:outline-none transition-all" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowNewPass(!showNewPass)} 
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">Type New Password Again</label>
              <input 
                type={showNewPass ? 'text' : 'password'} 
                value={confirmPass} 
                onChange={e => setConfirmPass(e.target.value)} 
                className="w-full bg-[#070707] border border-white/5 rounded-2xl py-5 px-6 text-[10px] font-black tracking-widest text-white/70 focus:border-white focus:outline-none transition-all" 
                required 
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving} 
              className="px-10 py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:opacity-90 disabled:opacity-20 transition-all font-display shadow-[0_10px_40px_rgba(255,255,255,0.05)]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 blur-3xl rounded-full" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
            <Target className="w-5 h-5" />
          </div>
          <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Keep your account safe</h4>
        </div>
        <p className="text-[9px] font-bold text-white/20 uppercase leading-relaxed tracking-widest relative z-10 max-w-lg">
          Change your password every few months. If you forget it, let us know.
        </p>
      </div>
    </div>
  );
};
