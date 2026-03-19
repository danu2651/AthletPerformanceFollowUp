"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ChevronRight,
  Zap,
  Award,
  BarChart3,
  Shield,
  Globe,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans">
      {/* 1. STICKY GLASS NAVIGATION */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-cyan-500 w-6 h-6 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="font-black italic uppercase tracking-tighter text-xl">
              APTS
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              href="#stats"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors"
            >
              Analytics
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-white text-black px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-48 pb-32 px-6">
        {/* Dynamic Background Elements */}
        <div className="absolute top-40 -left-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]" />

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <span className="text-cyan-500 font-black tracking-[0.5em] uppercase text-[10px] mb-6 block">
              Engineered for Elite Performance
            </span>
            <h1 className="text-[12vw] md:text-[10vw] leading-[0.8] font-black italic uppercase tracking-tighter mb-8">
              Speed <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-blue-500 drop-shadow-2xl">
                Redefined
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-12 font-medium leading-relaxed uppercase tracking-wide">
              The ultimate high-fidelity tracking system for athletes. No more
              guessing—just pure, data-driven dominance.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/register"
                className="group bg-white text-black px-10 py-5 rounded-2xl font-black uppercase italic flex items-center justify-center gap-3 hover:bg-cyan-400 transition-all shadow-xl"
              >
                Start Training{" "}
                <ChevronRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <Link
                href="/login"
                className="px-10 py-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md font-black uppercase italic text-sm hover:bg-white/10 transition-all"
              >
                Athlete Portal
              </Link>
            </div>
          </motion.div>

          {/* Transparent Athlete Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="relative max-w-5xl mx-auto mt-20 aspect-video rounded-[40px] border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity size={240} className="text-cyan-500/10 animate-pulse" />
              <div className="absolute text-[10px] font-bold uppercase tracking-[1em] text-cyan-500/40 rotate-90 right-10">
                Data Stream Active
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. FEATURE GRID (MERGED TECH STACK) */}
      <section id="features" className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <span className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.5em] mb-4 block">
                Core Tech
              </span>
              <h2 className="text-5xl font-black italic uppercase leading-none">
                The Champion's <br /> Ecosystem
              </h2>
            </div>
            <p className="text-gray-500 max-w-xs text-xs uppercase font-bold leading-relaxed">
              Military grade security meets high-performance analytics.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="text-yellow-400" />}
              title="Instant Splits"
              desc="Real-time kilometer breakdown for every training session at Bonga track."
            />
            <FeatureCard
              icon={<BarChart3 className="text-cyan-400" />}
              title="Deep Analytics"
              desc="Visual trends showing your pace evolution over months with precision."
            />
            <FeatureCard
              icon={<Shield className="text-purple-400" />}
              title="Encrypted Data"
              desc="Bank-level security for your personal performance records and bio-stats."
            />
          </div>
        </div>
      </section>

      {/* 4. ANALYTICS PREVIEW (IMAGE + LIST) */}
      <section className="py-32 px-6 bg-[#050505] border-y border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 items-center gap-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-5xl font-black italic uppercase mb-8">
              Track Every <span className="text-cyan-500">Heartbeat</span>
            </h2>
            <p className="text-gray-400 mb-10 leading-relaxed uppercase text-sm tracking-wide">
              Integrate with your workflow to provide high-fidelity altitude,
              temperature, and speed data. No more guessing—just pure
              performance.
            </p>
            <ul className="space-y-6">
              <li className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest group">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                  <Activity size={18} />
                </div>
                Real-time GPS Integration
              </li>
              <li className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest group">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-black transition-all">
                  <Globe size={18} />
                </div>
                Global Elevation Mapping
              </li>
            </ul>
          </motion.div>

          <div className="relative rounded-[40px] border border-white/10 p-2 bg-white/5">
            <div className="rounded-[38px] overflow-hidden bg-[#0A0A0A] aspect-square flex items-center justify-center">
              <div className="absolute top-10 right-10 bg-cyan-500 px-4 py-2 rounded-full text-black text-[10px] font-black italic animate-bounce">
                NEW RECORD
              </div>
              <BarChart3 size={150} className="text-cyan-500/20" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. STATS COUNTER */}
      <section id="stats" className="py-40 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <StatBox num="1k+" label="Active Athletes" />
          <StatBox num="99.9%" label="Uptime" />
          <StatBox num="50k+" label="Sessions Logged" />
          <StatBox num="24/7" label="Monitoring" />
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="py-20 border-t border-white/5 px-6 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-2">
            <Activity className="text-cyan-500" />
            <span className="font-black italic text-2xl uppercase tracking-tighter">
              APTS
            </span>
          </div>
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em] italic">
            "The only limit is the one you set yourself."
          </p>
          <div className="flex gap-10 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <Link href="#" className="hover:text-cyan-400 transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-cyan-400 transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-cyan-400 transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="p-10 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl hover:border-cyan-500/30 transition-all group"
    >
      <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mb-8 border border-white/5 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all">
        {icon}
      </div>
      <h4 className="text-xl font-black italic uppercase mb-4 tracking-tight">
        {title}
      </h4>
      <p className="text-gray-500 text-xs leading-relaxed uppercase tracking-wider font-semibold">
        {desc}
      </p>
    </motion.div>
  );
}

function StatBox({ num, label }: any) {
  return (
    <div className="text-center group">
      <h4 className="text-6xl font-black mb-2 text-white group-hover:text-cyan-500 transition-colors italic tracking-tighter">
        {num}
      </h4>
      <p className="text-gray-600 uppercase tracking-[0.4em] text-[8px] font-black">
        {label}
      </p>
    </div>
  );
}
