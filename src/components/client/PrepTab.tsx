import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  CheckCircle2, 
  Target, 
  Loader2, 
  RefreshCw, 
  BookOpen, 
  MessageSquare, 
  Award,
  HelpCircle,
  TrendingUp,
  CheckCheck
} from 'lucide-react';
import { PrepTask, AtsScanResult, InterviewFeedback, TrackedJob } from '../../types/client';

interface PrepTabProps {
  prepTasks: PrepTask[];
  onToggleTask: (id: string) => void;
  isScanning: boolean;
  scanJobId: string;
  setScanJobId: (id: string) => void;
  jobs: TrackedJob[];
  onRunAtsScan: () => void;
  scanResult: AtsScanResult | null;
  mockCategory: 'behavioral' | 'technical' | 'systems';
  setMockCategory: (cat: 'behavioral' | 'technical' | 'systems') => void;
  mockAnswerInput: string;
  setMockAnswerInput: (val: string) => void;
  onEvalMockInterview: () => void;
  isEvaluatingMock: boolean;
  mockFeedback: InterviewFeedback | null;
  selectedCompRole: string;
  setSelectedCompRole: (role: any) => void;
  basePayComp: number;
  setBasePayComp: (val: number) => void;
  bonusComp: number;
  setBonusComp: (val: number) => void;
  equityComp: number;
  setEquityComp: (val: number) => void;
}

export const PrepTab: React.FC<PrepTabProps> = ({
  prepTasks, onToggleTask, isScanning, scanJobId, setScanJobId, jobs, onRunAtsScan, scanResult,
  mockCategory, setMockCategory, mockAnswerInput, setMockAnswerInput, onEvalMockInterview,
  isEvaluatingMock, mockFeedback, selectedCompRole, setSelectedCompRole, basePayComp,
  setBasePayComp, bonusComp, setBonusComp, equityComp, setEquityComp
}) => {
  return (
    <div className="space-y-20">
      {/* Prep Dashboard Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-12 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-brand-accent uppercase tracking-[0.4em]">Be Ready</span>
              <div className="h-[1px] w-12 bg-white/10" />
            </div>
            <h3 className="text-4xl lg:text-5xl font-display font-black tracking-tighter text-white leading-[1.1]">Get ready for<br/>your dream job.</h3>
          </div>
          
          <p className="text-[11px] text-white/40 max-w-xl leading-relaxed uppercase font-bold tracking-widest border-l border-white/10 pl-6">
            Use our tools to check if your resume matches a job and practice for your interview.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center relative group">
          <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-8">Your Progress</span>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
              <motion.circle 
                cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="2" 
                fill="transparent" className="text-white" 
                strokeDasharray={377}
                initial={{ strokeDashoffset: 377 }}
                animate={{ strokeDashoffset: 377 - (377 * (prepTasks.filter(t => t.done).length / prepTasks.length)) }}
                transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
              />
            </svg>
            <span className="absolute text-3xl font-display font-black text-white">
              {Math.floor((prepTasks.filter(t => t.done).length / prepTasks.length) * 100)}<span className="text-xs text-white/40 ml-0.5">%</span>
            </span>
          </div>
          <div className="mt-8 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <p className="text-[8px] font-black uppercase text-white/40 tracking-[0.2em]">
              {prepTasks.filter(t => t.done).length} / {prepTasks.length} STEPS DONE
            </p>
          </div>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {prepTasks.map(task => (
          <button 
            key={task.id}
            onClick={() => onToggleTask(task.id)}
            className={`group p-8 border rounded-[2rem] text-left transition-all relative overflow-hidden ${
              task.done ? 'bg-white border-white text-black' : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/[0.04]'
            }`}
          >
            {task.done && <motion.div layoutId="task-bg" className="absolute inset-0 bg-white" />}
            <div className={`relative z-10 flex items-center justify-between mb-10 transition-colors ${task.done ? 'text-black' : 'text-white/20'}`}>
              <CheckCheck className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">+{task.points}</span>
            </div>
            <p className={`relative z-10 text-[10px] font-black uppercase leading-tight tracking-[0.1em] transition-colors ${task.done ? 'text-black' : 'text-white/40'}`}>
              {task.label}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* ATS Audit Section */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] overflow-hidden flex flex-col h-fit">
          <div className="p-10 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-white/40" />
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Resume Matcher</h4>
                <p className="text-[7px] font-black text-brand-accent uppercase tracking-widest mt-1">See how you match a job</p>
              </div>
            </div>
          </div>
          
          <div className="p-10 space-y-8">
            <div className="space-y-4">
              <select 
                value={scanJobId}
                onChange={(e) => setScanJobId(e.target.value)}
                className="w-full bg-[#070707] border border-white/5 rounded-2xl py-5 px-6 text-[10px] font-black uppercase tracking-widest focus:border-white focus:outline-none transition-all appearance-none text-white/70"
              >
                <option value="">Select a Job</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.role} @ {j.company}</option>)}
              </select>
              <button 
                onClick={onRunAtsScan}
                disabled={isScanning || !scanJobId}
                className="w-full py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-20"
              >
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isScanning ? 'Checking resume...' : 'Check Match'}
              </button>
            </div>

            <AnimatePresence>
              {scanResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pt-4">
                  <div className="flex items-end justify-between border-b border-white/5 pb-8">
                    <div className="space-y-2">
                      <span className="text-[8px] font-black uppercase text-white/30 tracking-[0.4em]">Match Level</span>
                      <h5 className="text-3xl font-display font-black text-white uppercase tracking-tighter">{scanResult.level}</h5>
                    </div>
                    <div className="text-6xl font-display font-black text-white tracking-tighter leading-none">
                      {scanResult.score}<span className="text-lg text-white/30">%</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[8px] font-black uppercase text-brand-accent tracking-[0.4em]">Matching Words</span>
                    <div className="flex flex-wrap gap-2">
                      {scanResult.matched.map(m => (
                        <span key={m} className="text-[8px] font-black uppercase bg-white/5 border border-white/10 text-white/60 px-4 py-2 rounded-xl">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5 p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <span className="text-[8px] font-black uppercase text-white/30 tracking-[0.4em]">Tips to improve</span>
                    <ul className="space-y-4">
                      {scanResult.recommendations.map((r, i) => (
                        <li key={i} className="text-[9px] font-bold text-white/60 uppercase flex items-start gap-3 leading-relaxed">
                          <span className="w-1 h-1 bg-white/20 rounded-full mt-1.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* AI Coach Section */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] overflow-hidden flex flex-col h-fit">
          <div className="p-10 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white/40" />
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Interview Practice</h4>
                <p className="text-[7px] font-black text-brand-accent uppercase tracking-widest mt-1">Talk to our AI helper</p>
              </div>
            </div>
          </div>

          <div className="p-10 space-y-10">
            <div className="flex gap-2 p-1 bg-[#070707] border border-white/5 rounded-2xl">
              {['behavioral', 'technical', 'systems'].map(cat => (
                <button 
                  key={cat} onClick={() => setMockCategory(cat as any)}
                  className={`flex-1 py-3 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${mockCategory === cat ? 'bg-white text-black' : 'text-white/30 hover:text-white/60'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <textarea 
              value={mockAnswerInput}
              onChange={(e) => setMockAnswerInput(e.target.value)}
              placeholder="Tell us your story. Mention: What happened, What was your task, What you did, and What was the result..."
              className="w-full h-56 bg-[#070707] border border-white/5 rounded-[2rem] p-8 text-[11px] font-medium text-white/80 focus:border-white focus:outline-none transition-all resize-none custom-scrollbar uppercase tracking-wider leading-relaxed"
            />

            <button 
              onClick={onEvalMockInterview}
              disabled={isEvaluatingMock || !mockAnswerInput.trim()}
              className="w-full py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-20"
            >
              {isEvaluatingMock ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              {isEvaluatingMock ? 'Thinking...' : 'Check my answer'}
            </button>

            <AnimatePresence>
              {mockFeedback && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] mb-2 block">Our Verdict</span>
                      <h5 className="text-3xl font-display font-black text-white uppercase tracking-tighter">{mockFeedback.badge}</h5>
                    </div>
                    <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center text-3xl font-display font-black text-white">
                      {mockFeedback.score}<span className="text-xs text-white/30">/10</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] block">Checklist</span>
                    <div className="grid grid-cols-2 gap-3">
                      {['Situation', 'Task', 'Action', 'Result'].map((part, i) => {
                        const ok = mockFeedback.passedArgs.length > i; // Rough mapping for now
                        return (
                          <div key={part} className={`px-5 py-3 rounded-2xl border flex items-center gap-3 ${ok ? 'bg-white/[0.03] border-white/10 text-white/80' : 'bg-white/[0.01] border-white/5 text-white/20'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-brand-accent shadow-[0_0_8px_brand-accent]' : 'bg-white/10'}`} />
                            <span className="text-[8px] font-black uppercase tracking-widest">{part}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl relative">
                    <div className="absolute top-6 left-6 text-brand-accent/20 font-black text-4xl">"</div>
                    <p className="text-[10px] font-bold text-white/50 uppercase leading-relaxed italic relative z-10 px-4">
                      {mockFeedback.suggestions}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
