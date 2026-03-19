"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

// FIX: Changed from '@/lib/axios' to a relative path based on your folder image
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
      // Connects to your Node.js backend
      const res = await api.post("/auth/login", { email, password });

      // Save the JWT token
      localStorage.setItem("token", res.data.token);

      // Send the athlete to the dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-primary/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md px-8 py-12 glass-card relative z-10 border border-white/10 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 shadow-glow">
            <Activity className="text-primary w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white text-center">
            Athlete Login
          </h2>
          <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-medium">
            Access your stats
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/10 border border-red-500/50 text-red-500 text-[10px] py-3 px-4 rounded-xl mb-6 text-center font-bold uppercase"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 ml-1">
              Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm text-white placeholder:text-gray-800"
                placeholder="athlete@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 ml-1">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm text-white placeholder:text-gray-800"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            disabled={isLoading}
            className="w-full bg-primary text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-glow-strong transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group uppercase italic tracking-tighter"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Enter Dashboard
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            New to APTS?
            <Link
              href="/register"
              className="text-primary ml-2 hover:underline"
            >
              Create Profile
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
