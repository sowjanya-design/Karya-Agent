import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, Sparkles, Activity, FileText, ArrowRight, Lock, Award, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useUserRole } from '../contexts/UserRoleContext';

export default function Landing() {
  const { user } = useUserRole();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-deep text-brand-primary font-sans selection:bg-brand-accent/30 selection:text-brand-accent relative overflow-x-hidden">
      {/* Absolute Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.15, 1], 
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] left-[10%] w-[80%] h-[60%] rounded-full bg-brand-accent/5 blur-[150px] pointer-events-none"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
      </div>

      {/* Global Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border-subtle bg-bg-glass/80 backdrop-blur-xl px-6 lg:px-12 py-4 flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <Link 
            to="/auth" 
            className="flex items-center gap-2 px-8 py-3 rounded-xl border border-border-subtle hover:border-brand-primary text-[10px] font-black uppercase tracking-[0.2em] transition-all bg-bg-card/30"
          >
            <Lock className="w-3 h-3 text-brand-accent" />
            LOG IN
          </Link>
        </div>
      </header>

      {/* Hero Presentation */}
      <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto flex flex-col justify-center min-h-[90vh]">
        <div className="text-center max-w-4xl mx-auto mb-20 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] font-black uppercase tracking-[0.25em]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            SMART JOB HELPER
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-8xl font-black font-display text-brand-primary uppercase tracking-tighter leading-[0.9] text-center"
          >
            Fix Your <span className="text-brand-accent">Resume</span> & Get Hired Fast
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="text-lg md:text-xl text-brand-muted max-w-2xl mx-auto font-medium leading-relaxed"
          >
            We help you fix your resume to match the job you want. You will get more interviews and get hired faster.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="pt-6"
          >
            <Link 
              to="/auth" 
              className="inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-brand-accent text-bg-deep font-black text-xs uppercase tracking-[0.25em] hover:scale-105 transition-all shadow-xl hover:shadow-brand-accent/20"
            >
              START NOW
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-6xl mx-auto w-full">
          {/* Column 1 */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 rounded-[2rem] bg-bg-card/25 border border-border-subtle hover:border-brand-accent/20 transition-all flex flex-col h-full group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-8 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-brand-primary uppercase tracking-tight mb-4">
              Step 1: Fix Resume
            </h3>
            <p className="text-brand-muted text-sm font-semibold leading-relaxed mb-6 flex-1">
              Our tool helps you change your resume so it looks exactly like what a boss wants to see.
            </p>
            <div className="text-[10px] font-black text-brand-accent uppercase tracking-widest flex items-center gap-1.5">
              <span>Better Resume</span>
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Column 2 */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 rounded-[2rem] bg-bg-card/25 border border-border-subtle hover:border-brand-accent/20 transition-all flex flex-col h-full group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-8 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-brand-primary uppercase tracking-tight mb-4">
              Step 2: Get a Score
            </h3>
            <p className="text-brand-muted text-sm font-semibold leading-relaxed mb-6 flex-1">
              See how good your resume is for the job. We tell you what to change to make it perfect.
            </p>
            <div className="text-[10px] font-black text-brand-accent uppercase tracking-widest flex items-center gap-1.5">
              <span>Pass the Test</span>
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Column 3 */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 rounded-[2rem] bg-bg-card/25 border border-border-subtle hover:border-brand-accent/20 transition-all flex flex-col h-full group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-8 shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-brand-primary uppercase tracking-tight mb-4">
              Step 3: Find a Job
            </h3>
            <p className="text-brand-muted text-sm font-semibold leading-relaxed mb-6 flex-1">
              We help you find the best job for you and make sure you are ready to talk to the boss.
            </p>
            <div className="text-[10px] font-black text-brand-accent uppercase tracking-widest flex items-center gap-1.5">
              <span>Get Hired!</span>
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-border-subtle bg-bg-surface/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center">
          <p className="text-[10px] font-bold text-brand-muted/60 uppercase tracking-[0.2em]">
            © 2026 KARYA • GETTING YOU HIRED
          </p>
          <p className="text-[8px] font-black text-brand-muted/30 uppercase tracking-widest">
            SAFE & SECURE CAREER TOOLS
          </p>
        </div>
      </footer>
    </div>
  );
}
