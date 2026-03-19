"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import {
  Activity,
  Zap,
  LogOut,
  X,
  TrendingUp,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  MapPin,
  Mountain,
  Thermometer,
  Notebook,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../lib/axios";

// --- TYPES ---
interface Session {
  id: number;
  distance_km: number;
  duration_seconds: number;
  training_date: string;
  start_point?: string;
  end_point?: string;
  altitude?: number;
  temperature?: number;
  notes?: string;
}

interface AnalyticsData {
  summary: {
    total_sessions: number;
    avg_speed_all_time: number;
    weekly_dist: number;
    monthly_dist: number;
    best_pace_secs: number;
  };
  performance_diff: number;
  chart_data: { speed: number; date: string }[];
}

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("Athlete");
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const [formData, setFormData] = useState({
    distance_km: "",
    duration_seconds: "",
    training_date: new Date().toISOString().split("T")[0],
    start_point: "",
    end_point: "",
    altitude: "",
    temperature: "",
    notes: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [analyticsRes, sessionsRes] = await Promise.all([
        api.get("/sessions/analytics/summary"),
        api.get("/sessions"),
      ]);
      setData(analyticsRes.data.data);
      setSessions(sessionsRes.data.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setUserName(localStorage.getItem("userName") || "Athlete");
      fetchData();
    }
  }, [router, fetchData]);

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/sessions", formData);
      setIsModalOpen(false);
      setFormData({
        distance_km: "",
        duration_seconds: "",
        training_date: new Date().toISOString().split("T")[0],
        start_point: "",
        end_point: "",
        altitude: "",
        temperature: "",
        notes: "",
      });
      fetchData();
    } catch (err) {
      alert("Error saving session. Check backend connection.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this training record?")) return;
    try {
      await api.delete(`/sessions/${id}`);
      fetchData();
    } catch (err) {
      alert("Error deleting session");
    }
  };

  // Prevent hydration mismatch
  if (!mounted) return null;

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center text-cyan-500 font-black italic">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <span className="animate-pulse tracking-tighter text-3xl uppercase">
          APTS_SYNCING_CORE...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-white p-4 md:p-10 font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-2">
            <Activity className="text-cyan-500 w-8 h-8 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">
              APTS
            </h1>
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
            className="text-gray-500 hover:text-red-500 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* HERO STATS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#0A0A0A] to-[#050505] border border-white/5 p-8 rounded-[32px] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em]">
                  Athlete: {userName}
                </span>
                {data.performance_diff !== 0 && (
                  <div
                    className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full border ${
                      data.performance_diff > 0
                        ? "text-green-400 border-green-400/20 bg-green-400/5"
                        : "text-red-400 border-red-400/20 bg-red-400/5"
                    }`}
                  >
                    {data.performance_diff > 0 ? (
                      <ArrowUpRight size={12} />
                    ) : (
                      <ArrowDownRight size={12} />
                    )}
                    {Math.abs(data.performance_diff).toFixed(1)}% PACE TREND
                  </div>
                )}
              </div>
              <h2 className="text-5xl font-black italic uppercase mb-8 leading-none">
                Global <br /> Performance
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <StatItem
                  label="Total Runs"
                  val={data.summary.total_sessions}
                  unit="Sess"
                />
                <StatItem
                  label="Avg Speed"
                  val={data.summary.avg_speed_all_time?.toFixed(1)}
                  unit="km/h"
                />
                <StatItem
                  label="Weekly"
                  val={data.summary.weekly_dist?.toFixed(1)}
                  unit="km"
                />
                <StatItem
                  label="Monthly"
                  val={data.summary.monthly_dist?.toFixed(1)}
                  unit="km"
                />
              </div>
            </motion.div>

            {/* CHART */}
            <div className="bg-[#050505] border border-white/5 rounded-[32px] p-8 h-[350px]">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-gray-500">
                <TrendingUp size={14} className="text-cyan-500" /> Speed
                Evolution
              </h3>
              {data.chart_data && data.chart_data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chart_data}>
                    <defs>
                      <linearGradient
                        id="colorSpeed"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#06b6d4"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#06b6d4"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0A0A0A",
                        borderRadius: "12px",
                        border: "1px solid #333",
                        fontSize: "10px",
                        color: "#fff",
                      }}
                      itemStyle={{ color: "#06b6d4" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="speed"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSpeed)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-700 uppercase font-black italic text-[10px] tracking-widest">
                  No data points yet.
                </div>
              )}
            </div>

            {/* RECENT SESSIONS */}
            <div className="bg-[#050505] border border-white/5 rounded-[32px] p-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 text-gray-500">
                Recent Sessions
              </h3>
              <div className="space-y-3">
                {sessions.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="group flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-black flex items-center justify-center rounded-xl border border-white/10 group-hover:text-cyan-500 group-hover:border-cyan-500/50">
                        <Zap size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase italic tracking-tight">
                          {s.distance_km} KM • {s.start_point || "Route"} to{" "}
                          {s.end_point || "Finish"}
                        </p>
                        <p className="text-[9px] text-gray-600 uppercase font-bold flex gap-3">
                          <span>
                            {new Date(s.training_date).toLocaleDateString()}
                          </span>
                          {s.temperature && (
                            <span className="text-cyan-500/50">
                              {s.temperature}°C
                            </span>
                          )}
                          {s.altitude && (
                            <span className="text-white/30">
                              {s.altitude}m Alt
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-2 text-gray-700 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-cyan-500 p-8 rounded-[32px] text-black h-fit flex flex-col justify-between shadow-[0_20px_50px_rgba(6,182,212,0.15)]">
              <div>
                <TrendingUp size={32} className="mb-4" />
                <h3 className="text-3xl font-black italic uppercase leading-none">
                  Ready to <br /> Level Up?
                </h3>
                <p className="text-sm font-bold uppercase opacity-70 mt-4 leading-tight">
                  Best Pace:{" "}
                  {data.summary.best_pace_secs
                    ? (data.summary.best_pace_secs / 60).toFixed(2)
                    : "0.00"}{" "}
                  min/km
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-8 bg-black text-white py-5 rounded-2xl font-black uppercase italic hover:scale-[1.02] transition-all active:scale-95 shadow-xl"
              >
                Record New Session
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0A0A0A] border border-white/10 p-8 rounded-[40px] w-full max-w-2xl relative overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white"
              >
                <X />
              </button>

              <h2 className="text-3xl font-black italic uppercase mb-6 flex items-center gap-3">
                <Zap className="text-cyan-500" /> Log Training
              </h2>

              <form onSubmit={handleSaveSession} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    icon={<MapPin size={12} className="text-cyan-500" />}
                    label="Start Point"
                    placeholder="Origin"
                    value={formData.start_point}
                    onChange={(v: string) =>
                      setFormData({ ...formData, start_point: v })
                    }
                    required
                  />
                  <FormInput
                    icon={<MapPin size={12} className="text-red-500" />}
                    label="End Point"
                    placeholder="Destination"
                    value={formData.end_point}
                    onChange={(v: string) =>
                      setFormData({ ...formData, end_point: v })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FormInput
                    label="Distance (KM)"
                    type="number"
                    step="0.1"
                    placeholder="5.0"
                    value={formData.distance_km}
                    onChange={(v: string) =>
                      setFormData({ ...formData, distance_km: v })
                    }
                    required
                  />
                  <FormInput
                    label="Duration (Sec)"
                    type="number"
                    placeholder="1800"
                    value={formData.duration_seconds}
                    onChange={(v: string) =>
                      setFormData({ ...formData, duration_seconds: v })
                    }
                    required
                  />
                  <FormInput
                    label="Date"
                    type="date"
                    value={formData.training_date}
                    onChange={(v: string) =>
                      setFormData({ ...formData, training_date: v })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    icon={<Mountain size={12} />}
                    label="Altitude (m)"
                    type="number"
                    placeholder="2400"
                    value={formData.altitude}
                    onChange={(v: string) =>
                      setFormData({ ...formData, altitude: v })
                    }
                  />
                  <FormInput
                    icon={<Thermometer size={12} />}
                    label="Temp (°C)"
                    type="number"
                    placeholder="22"
                    value={formData.temperature}
                    onChange={(v: string) =>
                      setFormData({ ...formData, temperature: v })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 italic tracking-widest">
                    <Notebook size={12} /> Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:border-cyan-500 outline-none transition-all text-sm h-24 resize-none"
                    placeholder="Performance notes..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-cyan-500 text-black py-5 rounded-2xl font-black uppercase italic hover:bg-white transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
                >
                  Complete Session Sync
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function StatItem({
  label,
  val,
  unit,
}: {
  label: string;
  val: any;
  unit: string;
}) {
  return (
    <div>
      <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-2xl font-black italic">
        {val ?? 0}
        <span className="text-[10px] ml-1 text-gray-500 uppercase">{unit}</span>
      </p>
    </div>
  );
}

function FormInput({
  label,
  icon,
  value,
  onChange,
  type = "text",
  ...props
}: any) {
  return (
    <div className="space-y-2 text-left">
      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 italic tracking-widest">
        {icon} {label}
      </label>
      <input
        {...props}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:border-cyan-500 outline-none transition-all text-sm placeholder:text-white/20"
      />
    </div>
  );
}
