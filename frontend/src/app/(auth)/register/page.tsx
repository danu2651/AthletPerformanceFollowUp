"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
// FIXED PATH FOR YOUR STRUCTURE
import api from "../../../lib/axios";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Sends data to your Node.js /api/auth/register route
      await api.post("/auth/register", formData);
      // If successful, send to login so they can enter
      router.push("/login");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Registration failed. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-primary/15 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md px-8 py-12 glass-card relative z-10 border border-white/10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 shadow-glow">
            <Activity className="text-primary w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white">
            Join APTS
          </h2>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-[10px] py-3 px-4 rounded-xl mb-6 text-center italic font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-1">
              Full Name
            </label>
            <input
              type="text"
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 outline-none focus:border-primary/50 text-white text-sm"
              placeholder="Dani"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-1">
              Email
            </label>
            <input
              type="email"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 outline-none focus:border-primary/50 text-white text-sm"
              placeholder="dani@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-1">
              Password
            </label>
            <input
              type="password"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 outline-none focus:border-primary/50 text-white text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            disabled={isLoading}
            className="w-full bg-primary text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-glow-strong transition-all mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Create Account <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-[10px] text-gray-500 font-bold uppercase tracking-tight">
          Already a member?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
