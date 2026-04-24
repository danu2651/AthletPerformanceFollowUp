"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";


import api from "../../../lib/axios";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Send request to backend
      const res = await api.post("/auth/login", { email, password });

      // 2. Check if the backend returned success
      if (res.data.success && res.data.token) {
        // PROFESSIONAL TIP: Always use 'athlete_token' to avoid conflicts
        localStorage.setItem("athlete_token", res.data.token);
        localStorage.setItem("user_data", JSON.stringify(res.data.user));

        // 3. Navigate to dashboard
        router.push("/dashboard");
      } else {
        setError(res.data.message || "Login failed.");
      }
    } catch (err: any) {
      console.error("Frontend Login Error:", err);
      // Captures the message sent by our fixed controller
      const message =
        err.response?.data?.message || "Connection to server failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden px-4">
      {/* Visual background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#FC4C02]/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-8 py-10 bg-[#141414] border border-white/5 rounded-3xl relative z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#FC4C02]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#FC4C02]/20">
            <Activity className="text-[#FC4C02] w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white italic">
            Athlete Login
          </h2>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] py-3 px-4 rounded-xl mb-6 text-center font-black uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 ml-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-[#FC4C02]/50 text-white transition-all"
                placeholder="athlete@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-[#FC4C02]/50 text-white transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            disabled={isLoading}
            className="w-full bg-[#FC4C02] hover:bg-[#e34402] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 uppercase italic tracking-tight"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Enter Dashboard <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            New Athlete?{" "}
            <Link href="/register" className="text-[#FC4C02] ml-1">
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
