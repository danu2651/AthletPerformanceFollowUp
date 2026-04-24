"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import {
  Activity,
  Zap,
  LogOut,
  X,
  TrendingUp,
  TrendingDown,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Mountain,
  Thermometer,
  Notebook,
  Calendar,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Target,
  Clock,
  Flame,
  Shield,
  BarChart2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../../lib/axios";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Session {
  id: number;
  distance_km: any;
  duration_seconds: number;
  training_date: string;
  start_point?: string;
  end_point?: string;
  altitude?: any;
  temperature?: any;
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

interface FormErrors {
  distance_km?: string;
  duration_seconds?: string;
  training_date?: string;
  altitude?: string;
  temperature?: string;
}

interface PerformanceInsight {
  type: "warning" | "success" | "info" | "action";
  title: string;
  detail: string;
  icon: React.ReactNode;
}

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

const safeFloat = (v: any): number => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((x) => String(x).padStart(2, "0")).join(":");
};

const calcPaceSecs = (distanceKm: number, durationSecs: number): number => {
  if (!distanceKm || !durationSecs || distanceKm <= 0) return 0;
  return durationSecs / distanceKm;
};

const formatPace = (paceSecs: number): string => {
  if (!paceSecs || paceSecs <= 0) return "--:--";
  const mins = Math.floor(paceSecs / 60);
  const secs = Math.floor(paceSecs % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const calcSpeed = (distanceKm: number, durationSecs: number): number => {
  if (!distanceKm || !durationSecs || durationSecs <= 0) return 0;
  return (distanceKm / durationSecs) * 3600;
};

const getSpeedZone = (
  speedKmh: number,
): { label: string; color: string; bg: string } => {
  if (speedKmh < 8)
    return {
      label: "Easy",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    };
  if (speedKmh < 13)
    return {
      label: "Moderate",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    };
  return { label: "Fast", color: "text-red-400", bg: "bg-red-400/10" };
};

const getSessionType = (distKm: number): { label: string; color: string } => {
  if (distKm < 3) return { label: "Short", color: "text-blue-400" };
  if (distKm <= 8) return { label: "Medium", color: "text-amber-400" };
  return { label: "Long", color: "text-red-400" };
};

const generateInsights = (sessions: Session[]): PerformanceInsight[] => {
  if (!sessions || sessions.length === 0) return [];
  const insights: PerformanceInsight[] = [];
  const sorted = [...sessions].sort(
    (a, b) =>
      new Date(a.training_date).getTime() - new Date(b.training_date).getTime(),
  );

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
  const thisWeekSessions = sessions.filter(
    (s) => new Date(s.training_date) >= oneWeekAgo,
  );
  const lastWeekSessions = sessions.filter(
    (s) =>
      new Date(s.training_date) >= twoWeeksAgo &&
      new Date(s.training_date) < oneWeekAgo,
  );

  if (thisWeekSessions.length < 3) {
    insights.push({
      type: "action",
      title: "Build Consistency",
      detail: `${thisWeekSessions.length} session${thisWeekSessions.length !== 1 ? "s" : ""} this week. Elite runners average 5–6 sessions/week.`,
      icon: <Target size={16} />,
    });
  } else {
    insights.push({
      type: "success",
      title: "Strong Consistency",
      detail: `${thisWeekSessions.length} sessions this week. Keep this rhythm going.`,
      icon: <CheckCircle size={16} />,
    });
  }

  if (sorted.length >= 4) {
    const half = Math.floor(sorted.length / 2);
    const recent = sorted.slice(half);
    const earlier = sorted.slice(0, half);
    const avgPaceRecent =
      recent.reduce(
        (acc, s) =>
          acc + calcPaceSecs(safeFloat(s.distance_km), s.duration_seconds),
        0,
      ) / recent.length;
    const avgPaceEarlier =
      earlier.reduce(
        (acc, s) =>
          acc + calcPaceSecs(safeFloat(s.distance_km), s.duration_seconds),
        0,
      ) / earlier.length;
    if (avgPaceRecent > 0 && avgPaceEarlier > 0) {
      const paceChange =
        ((avgPaceEarlier - avgPaceRecent) / avgPaceEarlier) * 100;
      if (paceChange > 2) {
        insights.push({
          type: "success",
          title: "Improving Trend",
          detail: `Pace improved ${paceChange.toFixed(1)}% over last ${sorted.length} sessions. You're getting faster.`,
          icon: <TrendingUp size={16} />,
        });
      } else if (paceChange < -3) {
        insights.push({
          type: "warning",
          title: "Pace Declining",
          detail: `Pace has slowed ${Math.abs(paceChange).toFixed(1)}%. Consider a recovery week.`,
          icon: <TrendingDown size={16} />,
        });
      } else {
        insights.push({
          type: "info",
          title: "Plateau Detected",
          detail: "Pace is stable. Time to add intervals or increase distance.",
          icon: <BarChart2 size={16} />,
        });
      }
    }
  }

  if (sorted.length >= 3) {
    const recent3 = sorted.slice(-3);
    const recent3Dist = recent3.reduce(
      (a, s) => a + safeFloat(s.distance_km),
      0,
    );
    const recent3Pace = recent3
      .map((s) => calcPaceSecs(safeFloat(s.distance_km), s.duration_seconds))
      .filter((p) => p > 0);
    const paceIncreasing =
      recent3Pace.length === 3 && recent3Pace[2] > recent3Pace[0] * 1.05;
    if (paceIncreasing && recent3Dist > 20) {
      insights.push({
        type: "warning",
        title: "Fatigue Signal",
        detail:
          "High volume + slowing pace in last 3 sessions. Prioritise rest and nutrition.",
        icon: <AlertTriangle size={16} />,
      });
    }
  }

  const withPace = sessions
    .map((s) => ({
      ...s,
      pace: calcPaceSecs(safeFloat(s.distance_km), s.duration_seconds),
    }))
    .filter((s) => s.pace > 0);
  if (withPace.length > 0) {
    const best = withPace.reduce((a, b) => (a.pace < b.pace ? a : b));
    insights.push({
      type: "success",
      title: "Personal Best",
      detail: `${formatPace(best.pace)} /km on ${new Date(best.training_date).toLocaleDateString()} — ${safeFloat(best.distance_km).toFixed(1)} km`,
      icon: <Flame size={16} />,
    });
  }

  const suggestedAction = (() => {
    const hasWarning = insights.some((i) => i.type === "warning");
    const hasPlateau = insights.some((i) => i.title === "Plateau Detected");
    if (hasWarning) return "Focus on recovery";
    if (hasPlateau) return "Increase intensity";
    return "Maintain consistency";
  })();
  insights.push({
    type: "action",
    title: "Recommended Action",
    detail: suggestedAction,
    icon: <Shield size={16} />,
  });

  return insights;
};

const buildPaceChartData = (sessions: Session[]) => {
  return [...sessions]
    .sort(
      (a, b) =>
        new Date(a.training_date).getTime() -
        new Date(b.training_date).getTime(),
    )
    .map((s) => {
      const dist = safeFloat(s.distance_km);
      const pace = calcPaceSecs(dist, s.duration_seconds);
      return {
        date: new Date(s.training_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        pace: pace > 0 ? parseFloat((pace / 60).toFixed(2)) : null,
        distance: dist,
        sessionId: s.id,
      };
    })
    .filter((d) => d.pace !== null);
};

const validateForm = (form: any): FormErrors => {
  const errors: FormErrors = {};
  const dist = parseFloat(form.distance_km);
  const dur = parseFloat(form.duration_seconds);
  const alt = parseFloat(form.altitude);
  const temp = parseFloat(form.temperature);
  if (!form.distance_km || isNaN(dist) || dist <= 0)
    errors.distance_km = "Distance must be greater than 0";
  if (dist > 500) errors.distance_km = "Distance seems unrealistic (>500km)";
  if (!form.duration_seconds || isNaN(dur) || dur <= 0)
    errors.duration_seconds = "Duration must be greater than 0";
  if (dur > 86400) errors.duration_seconds = "Duration cannot exceed 24 hours";
  if (!form.training_date) errors.training_date = "Date is required";
  if (form.altitude && (isNaN(alt) || alt < 0))
    errors.altitude = "Altitude cannot be negative";
  if (alt > 9000) errors.altitude = "Altitude exceeds Mt. Everest height";
  if (form.temperature && (isNaN(temp) || temp < -60 || temp > 60))
    errors.temperature = "Temperature out of realistic range";
  return errors;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  // useRef instead of useState — tracking mount status must never itself
  // cause a state update, which is exactly what triggered the console error.
  const isMountedRef = useRef(false);
  const [clientReady, setClientReady] = useState(false);
  const [userName, setUserName] = useState("Athlete");
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [activeChart, setActiveChart] = useState<"speed" | "pace" | "distance">(
    "pace",
  );
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState<string>("");

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
    const token = localStorage.getItem("athlete_token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const [analyticsRes, sessionsRes] = await Promise.all([
        api.get("/sessions/analytics/summary"),
        api.get("/sessions"),
      ]);
      // Guard: only update state if still mounted. This prevents the warning
      // that appears during HMR when the callback resolves after unmount.
      if (!isMountedRef.current) return;
      setData(analyticsRes.data.data || analyticsRes.data);
      setSessions(sessionsRes.data.data || sessionsRes.data || []);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      if (err.response?.status === 401) {
        localStorage.removeItem("athlete_token");
        router.push("/login");
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Mark mounted FIRST, before any async work or state updates.
    isMountedRef.current = true;
    setClientReady(true);

    const token = localStorage.getItem("athlete_token");
    if (!token) {
      router.push("/login");
      return;
    }
    setUserName(localStorage.getItem("userName") || "Athlete");
    fetchData();

    // Cleanup: mark unmounted so any in-flight fetchData calls are ignored.
    return () => {
      isMountedRef.current = false;
    };
  }, [router, fetchData]);

  const insights = useMemo(() => generateInsights(sessions), [sessions]);
  const paceChartData = useMemo(() => buildPaceChartData(sessions), [sessions]);

  const weeklyLoad = useMemo(() => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const thisWeek = sessions.filter(
      (s) => new Date(s.training_date) >= oneWeekAgo,
    );
    return {
      km: thisWeek.reduce((a, s) => a + safeFloat(s.distance_km), 0),
      sessions: thisWeek.length,
      time: thisWeek.reduce((a, s) => a + (s.duration_seconds || 0), 0),
    };
  }, [sessions]);

  const lastWeekLoad = useMemo(() => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000);
    return sessions
      .filter(
        (s) =>
          new Date(s.training_date) >= twoWeeksAgo &&
          new Date(s.training_date) < oneWeekAgo,
      )
      .reduce((a, s) => a + safeFloat(s.distance_km), 0);
  }, [sessions]);

  const lastSession = sessions[0] ?? null;

  const bestPaceSession = useMemo(() => {
    return sessions.reduce(
      (best, s) => {
        const pace = calcPaceSecs(safeFloat(s.distance_km), s.duration_seconds);
        if (pace <= 0) return best;
        if (!best || pace < best.pace) return { ...s, pace };
        return best;
      },
      null as (Session & { pace: number }) | null,
    );
  }, [sessions]);

  const bestPaceIdx = useMemo(() => {
    if (!bestPaceSession) return -1;
    return paceChartData.findIndex((d) => d.sessionId === bestPaceSession.id);
  }, [paceChartData, bestPaceSession]);

  const weekVsLastWeek =
    lastWeekLoad > 0
      ? ((weeklyLoad.km - lastWeekLoad) / lastWeekLoad) * 100
      : 0;

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      await api.post("/sessions", {
        training_type_id: 1,
        training_date: formData.training_date,
        duration_seconds: Number(formData.duration_seconds),
        distance_km: Number(formData.distance_km),
        altitude: formData.altitude ? Number(formData.altitude) : 0,
        temperature_c: formData.temperature
          ? Number(formData.temperature)
          : null,
        start_point: formData.start_point,
        end_point: formData.end_point,
        notes: formData.notes,
      });
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
      setFormErrors({});
      fetchData();
    } catch (err: any) {
      setSaveError(
        err.response?.data?.errors?.[0]?.message ||
          "Failed to save session. Please try again.",
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Permanently delete this training record?")) return;
    try {
      await api.delete(`/sessions/${id}`);
      if (selectedSession?.id === id) setSelectedSession(null);
      fetchData();
    } catch {}
  };

  if (!clientReady) return null;

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center text-cyan-500 font-black italic">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="mb-6"
        >
          <Activity className="w-12 h-12 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
        </motion.div>
        <span className="animate-pulse tracking-[0.2em] text-xl uppercase">
          Initializing_Systems...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-white p-4 md:p-10 font-sans selection:bg-cyan-500 selection:text-black">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500 rounded-lg">
              <Activity className="text-black w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">
              APTS <span className="text-cyan-500">v3.0</span>
            </h1>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("athlete_token");
              localStorage.removeItem("userName");
              router.push("/login");
            }}
            className="group text-gray-500 hover:text-red-500 transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
          >
            <LogOut
              size={14}
              className="group-hover:-translate-x-1 transition-transform"
            />{" "}
            Sign Out
          </button>
        </header>

        {/* QUICK STATS BAR */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <QuickStat
              label="Last Session"
              value={
                lastSession
                  ? `${safeFloat(lastSession.distance_km).toFixed(1)} km`
                  : "—"
              }
              sub={
                lastSession
                  ? new Date(lastSession.training_date).toLocaleDateString()
                  : "No sessions yet"
              }
              icon={<Zap size={14} className="text-cyan-500" />}
            />
            <QuickStat
              label="This Week"
              value={`${weeklyLoad.km.toFixed(1)} km`}
              sub={`${weeklyLoad.sessions} sessions`}
              icon={<Calendar size={14} className="text-cyan-500" />}
            />
            <QuickStat
              label="vs Last Week"
              value={
                lastWeekLoad > 0
                  ? `${weekVsLastWeek >= 0 ? "+" : ""}${weekVsLastWeek.toFixed(0)}%`
                  : "—"
              }
              sub={`${lastWeekLoad.toFixed(1)} km last week`}
              icon={
                weekVsLastWeek >= 0 ? (
                  <ArrowUpRight size={14} className="text-emerald-400" />
                ) : (
                  <ArrowDownRight size={14} className="text-red-400" />
                )
              }
              highlight={weekVsLastWeek >= 0 ? "emerald" : "red"}
            />
            <QuickStat
              label="Weekly Time"
              value={formatDuration(weeklyLoad.time)}
              sub="total run time"
              icon={<Clock size={14} className="text-cyan-500" />}
            />
          </motion.div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* HERO STATS */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-[#0A0A0A] to-[#050505] border border-white/5 p-8 md:p-12 rounded-[40px] relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full group-hover:bg-cyan-500/15 transition-colors" />
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <span className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.5em] block">
                    CORE_BIOMETRICS
                  </span>
                  <h3 className="text-gray-400 font-bold uppercase text-xs italic">
                    User: {userName}
                  </h3>
                </div>
                {data.performance_diff !== 0 && (
                  <div
                    className={`flex items-center gap-1 text-[11px] font-black px-4 py-2 rounded-full border ${data.performance_diff > 0 ? "text-green-400 border-green-400/20 bg-green-400/5" : "text-red-400 border-red-400/20 bg-red-400/5"}`}
                  >
                    {data.performance_diff > 0 ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}
                    {Math.abs(data.performance_diff).toFixed(1)}% PACE VARIANCE
                  </div>
                )}
              </div>
              <h2 className="text-5xl md:text-7xl font-black italic uppercase mb-10 leading-[0.9] tracking-tighter">
                Global <br /> <span className="text-cyan-500">Analytics</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                <StatItem
                  label="Total Sessions"
                  val={data.summary?.total_sessions}
                  unit="Runs"
                />
                <StatItem
                  label="Avg Velocity"
                  val={data.summary?.avg_speed_all_time?.toFixed(1)}
                  unit="km/h"
                />
                <StatItem
                  label="Weekly Vol"
                  val={data.summary?.weekly_dist?.toFixed(1)}
                  unit="km"
                />
                <StatItem
                  label="Monthly Vol"
                  val={data.summary?.monthly_dist?.toFixed(1)}
                  unit="km"
                />
              </div>
            </motion.div>

            {/* PERFORMANCE INSIGHTS */}
            {sessions.length > 0 && (
              <div className="bg-[#050505] border border-white/5 rounded-[40px] p-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                  <Zap size={14} className="text-cyan-500" /> Performance
                  Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((insight, idx) => (
                    <InsightCard key={idx} insight={insight} />
                  ))}
                </div>
              </div>
            )}

            {/* CHARTS */}
            <div className="bg-[#050505] border border-white/5 rounded-[40px] p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <TrendingUp size={14} className="text-cyan-500" />
                  {activeChart === "pace"
                    ? "Pace Over Time (min/km)"
                    : activeChart === "distance"
                      ? "Distance Over Time (km)"
                      : "Speed Over Time (km/h)"}
                </h3>
                <div className="flex gap-2">
                  {(["pace", "distance", "speed"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveChart(tab)}
                      className={`text-[9px] uppercase font-black px-3 py-1.5 rounded-full transition-all ${activeChart === tab ? "bg-cyan-500 text-black" : "text-gray-600 hover:text-gray-400"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[280px]">
                {paceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {activeChart === "pace" ? (
                      <LineChart data={paceChartData}>
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#555", fontSize: 10, fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#555", fontSize: 10, fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                          reversed
                          tickFormatter={(v) => `${v}m`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0F0F0F",
                            borderRadius: "16px",
                            border: "1px solid #222",
                            fontSize: "12px",
                            fontWeight: "900",
                            color: "#fff",
                          }}
                          formatter={(v: any) => [
                            `${Number(v).toFixed(2)} min/km`,
                            "Pace",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="pace"
                          stroke="#06b6d4"
                          strokeWidth={3}
                          dot={{ fill: "#06b6d4", strokeWidth: 0, r: 4 }}
                          activeDot={{ r: 7, fill: "#fff", stroke: "#06b6d4" }}
                          connectNulls
                        />
                        {bestPaceIdx >= 0 && paceChartData[bestPaceIdx] && (
                          <ReferenceDot
                            x={paceChartData[bestPaceIdx].date}
                            y={paceChartData[bestPaceIdx].pace!}
                            r={8}
                            fill="#facc15"
                            stroke="#000"
                            strokeWidth={2}
                            label={{
                              value: "PB",
                              fill: "#facc15",
                              fontSize: 9,
                              fontWeight: 900,
                            }}
                          />
                        )}
                      </LineChart>
                    ) : activeChart === "distance" ? (
                      <AreaChart data={paceChartData}>
                        <defs>
                          <linearGradient
                            id="distGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#06b6d4"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor="#06b6d4"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#555", fontSize: 10, fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#555", fontSize: 10, fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0F0F0F",
                            borderRadius: "16px",
                            border: "1px solid #222",
                            fontSize: "12px",
                            fontWeight: "900",
                            color: "#fff",
                          }}
                          formatter={(v: any) => [
                            `${Number(v).toFixed(2)} km`,
                            "Distance",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="distance"
                          stroke="#06b6d4"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#distGrad)"
                        />
                      </AreaChart>
                    ) : (
                      <AreaChart data={data.chart_data}>
                        <defs>
                          <linearGradient
                            id="speedGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#06b6d4"
                              stopOpacity={0.4}
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
                            backgroundColor: "#0F0F0F",
                            borderRadius: "16px",
                            border: "1px solid #222",
                            fontSize: "12px",
                            fontWeight: "900",
                            color: "#fff",
                          }}
                          formatter={(v: any) => [
                            `${Number(v).toFixed(1)} km/h`,
                            "Speed",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="speed"
                          stroke="#06b6d4"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#speedGrad)"
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Log your first session to see charts" />
                )}
              </div>
            </div>

            {/* SESSIONS LIST */}
            <div className="bg-[#050505] border border-white/5 rounded-[40px] p-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-8">
                Activity Feed
              </h3>
              {sessions.length === 0 ? (
                <EmptyState
                  message="Start by logging your first run"
                  icon={<Zap size={32} className="text-gray-700 mb-4" />}
                />
              ) : (
                <div className="space-y-4">
                  {sessions.slice(0, 8).map((s, idx) => {
                    const dist = safeFloat(s.distance_km);
                    const pace = calcPaceSecs(dist, s.duration_seconds);
                    const speed = calcSpeed(dist, s.duration_seconds);
                    const zone = getSpeedZone(speed);
                    const sessionType = getSessionType(dist);
                    const altitude = safeFloat(s.altitude);
                    const isHighAlt = altitude > 2000;
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedSession(s)}
                        className="group flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-[24px] hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-black flex items-center justify-center rounded-2xl border border-white/10 group-hover:scale-110 transition-transform shrink-0">
                            <Zap size={20} className="text-cyan-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-sm font-black uppercase italic tracking-tight">
                                {dist.toFixed(2)} KM
                              </p>
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${zone.bg} ${zone.color}`}
                              >
                                {zone.label}
                              </span>
                              <span
                                className={`text-[9px] font-bold uppercase ${sessionType.color}`}
                              >
                                {sessionType.label}
                              </span>
                              {isHighAlt && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400 flex items-center gap-1">
                                  <Mountain size={9} /> {altitude}m
                                </span>
                              )}
                            </div>
                            <div className="flex gap-4 items-center flex-wrap">
                              <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
                                <Calendar size={10} />{" "}
                                {new Date(s.training_date).toLocaleDateString()}
                              </p>
                              {pace > 0 && (
                                <p className="text-[10px] text-cyan-500 uppercase font-bold">
                                  {formatPace(pace)} /km
                                </p>
                              )}
                              {s.start_point && (
                                <p className="text-[10px] text-gray-600 uppercase font-bold flex items-center gap-1">
                                  <MapPin size={9} /> {s.start_point}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <ChevronRight
                            size={14}
                            className="text-gray-700 group-hover:text-cyan-500 transition-colors"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(s.id);
                            }}
                            className="p-3 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-cyan-500 p-10 rounded-[40px] text-black flex flex-col justify-between shadow-[0_30px_60px_-15px_rgba(6,182,212,0.3)] relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 opacity-20 rotate-12">
                <Activity size={180} />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-black flex items-center justify-center rounded-2xl mb-6">
                  <TrendingUp size={24} className="text-cyan-500" />
                </div>
                <h3 className="text-4xl font-black italic uppercase leading-[0.85] mb-6">
                  Forge <br /> Your Path
                </h3>
                <div className="bg-black/10 p-4 rounded-2xl border border-black/5 backdrop-blur-sm mb-3">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">
                    Personal Best Pace
                  </p>
                  <p className="text-2xl font-black italic">
                    {bestPaceSession
                      ? formatPace(bestPaceSession.pace)
                      : "--:--"}
                    <span className="text-[10px] ml-1 uppercase">/km</span>
                  </p>
                </div>
                <div className="bg-black/10 p-4 rounded-2xl border border-black/5 backdrop-blur-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">
                    Weekly Distance
                  </p>
                  <p className="text-2xl font-black italic">
                    {weeklyLoad.km.toFixed(1)}
                    <span className="text-[10px] ml-1 uppercase">km</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-10 bg-black text-white py-6 rounded-2xl font-black uppercase italic hover:scale-[1.03] active:scale-95 transition-all shadow-2xl relative z-10"
              >
                Log New Session
              </button>
            </div>
            {sessions.length > 0 && (
              <div className="bg-[#050505] border border-white/5 rounded-[40px] p-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">
                  Speed Zone Distribution
                </h3>
                <ZoneBreakdown sessions={sessions} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* SESSION DETAIL MODAL */}
      <AnimatePresence>
        {selectedSession && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0A0A] border border-white/10 p-10 rounded-[48px] w-full max-w-lg relative overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => setSelectedSession(null)}
                className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>
              <SessionDetail session={selectedSession} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOG SESSION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="bg-[#0A0A0A] border border-white/10 p-10 rounded-[48px] w-full max-w-2xl relative overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormErrors({});
                  setSaveError("");
                }}
                className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
              >
                <X size={32} />
              </button>
              <div className="mb-10">
                <h2 className="text-4xl font-black italic uppercase flex items-center gap-4">
                  <Zap className="text-cyan-500" /> Log Session
                </h2>
              </div>
              {saveError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle size={14} /> {saveError}
                </div>
              )}
              <form onSubmit={handleSaveSession} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    icon={<MapPin size={14} className="text-cyan-500" />}
                    label="Departure"
                    placeholder="E.g. Addis Ababa"
                    value={formData.start_point}
                    onChange={(v: string) =>
                      setFormData({ ...formData, start_point: v })
                    }
                  />
                  <FormInput
                    icon={<MapPin size={14} className="text-red-500" />}
                    label="Arrival"
                    placeholder="E.g. Bonga"
                    value={formData.end_point}
                    onChange={(v: string) =>
                      setFormData({ ...formData, end_point: v })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <FormInput
                    label="Dist (KM)"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.distance_km}
                    onChange={(v: string) =>
                      setFormData({ ...formData, distance_km: v })
                    }
                    required
                    error={formErrors.distance_km}
                  />
                  <FormInput
                    label="Time (Sec)"
                    type="number"
                    min="1"
                    placeholder="0"
                    value={formData.duration_seconds}
                    onChange={(v: string) =>
                      setFormData({ ...formData, duration_seconds: v })
                    }
                    required
                    error={formErrors.duration_seconds}
                  />
                  <FormInput
                    label="Sync Date"
                    type="date"
                    value={formData.training_date}
                    onChange={(v: string) =>
                      setFormData({ ...formData, training_date: v })
                    }
                    error={formErrors.training_date}
                  />
                </div>
                {formData.distance_km && formData.duration_seconds && (
                  <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[9px] uppercase font-black text-gray-600 mb-1">
                        Pace
                      </p>
                      <p className="text-lg font-black text-cyan-400">
                        {formatPace(
                          calcPaceSecs(
                            parseFloat(formData.distance_km),
                            parseFloat(formData.duration_seconds),
                          ),
                        )}
                        <span className="text-[9px] ml-1">/km</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-black text-gray-600 mb-1">
                        Speed
                      </p>
                      <p className="text-lg font-black text-cyan-400">
                        {calcSpeed(
                          parseFloat(formData.distance_km),
                          parseFloat(formData.duration_seconds),
                        ).toFixed(1)}
                        <span className="text-[9px] ml-1">km/h</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-black text-gray-600 mb-1">
                        Duration
                      </p>
                      <p className="text-lg font-black text-cyan-400">
                        {formatDuration(parseFloat(formData.duration_seconds))}
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-6">
                  <FormInput
                    icon={<Mountain size={14} />}
                    label="Alt (m)"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.altitude}
                    onChange={(v: string) =>
                      setFormData({ ...formData, altitude: v })
                    }
                    error={formErrors.altitude}
                  />
                  <FormInput
                    icon={<Thermometer size={14} />}
                    label="Temp (°C)"
                    type="number"
                    placeholder="20"
                    value={formData.temperature}
                    onChange={(v: string) =>
                      setFormData({ ...formData, temperature: v })
                    }
                    error={formErrors.temperature}
                  />
                </div>
                {formData.altitude && parseFloat(formData.altitude) > 2000 && (
                  <div className="flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase bg-purple-400/10 rounded-2xl px-4 py-3">
                    <Mountain size={12} /> High altitude run (
                    {formData.altitude}m) — expect adjusted effort perception
                  </div>
                )}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2 italic">
                    <Notebook size={14} /> Session Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full bg-white/[0.03] border border-white/10 p-6 rounded-3xl focus:border-cyan-500/50 outline-none transition-all text-sm h-32 resize-none"
                    placeholder="How was the session?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-cyan-500 text-black py-6 rounded-[24px] font-black uppercase italic hover:bg-white transition-all active:scale-95"
                >
                  Confirm_Upload_Protocol
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function QuickStat({
  label,
  value,
  sub,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: React.ReactNode;
  highlight?: "emerald" | "red";
}) {
  return (
    <div className="bg-[#050505] border border-white/5 rounded-[20px] p-5">
      <div className="flex items-center gap-1.5 mb-2 text-gray-600">
        {icon}
        <span className="text-[9px] uppercase font-black tracking-widest">
          {label}
        </span>
      </div>
      <p
        className={`text-xl font-black italic ${highlight === "emerald" ? "text-emerald-400" : highlight === "red" ? "text-red-400" : "text-white"}`}
      >
        {value}
      </p>
      <p className="text-[9px] text-gray-600 uppercase font-bold mt-1">{sub}</p>
    </div>
  );
}

function InsightCard({ insight }: { insight: PerformanceInsight }) {
  const colorMap = {
    warning: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    info: "border-blue-500/30 bg-blue-500/5 text-blue-400",
    action: "border-cyan-500/30 bg-cyan-500/5 text-cyan-400",
  };
  return (
    <div className={`border rounded-[20px] p-5 ${colorMap[insight.type]}`}>
      <div className="flex items-center gap-2 mb-2">
        {insight.icon}
        <span className="text-[10px] uppercase font-black tracking-widest">
          {insight.title}
        </span>
      </div>
      <p className="text-xs text-gray-400 font-medium leading-relaxed">
        {insight.detail}
      </p>
    </div>
  );
}

function SessionDetail({ session }: { session: Session }) {
  const dist = safeFloat(session.distance_km);
  const pace = calcPaceSecs(dist, session.duration_seconds);
  const speed = calcSpeed(dist, session.duration_seconds);
  const zone = getSpeedZone(speed);
  const sessionType = getSessionType(dist);
  const altitude = safeFloat(session.altitude);
  const temp = safeFloat(session.temperature);
  return (
    <div>
      <div className="mb-8">
        <span className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.5em] block mb-2">
          Session Detail
        </span>
        <h2 className="text-3xl font-black italic uppercase">
          {dist.toFixed(2)} <span className="text-cyan-500">km</span>
        </h2>
        <p className="text-gray-500 text-xs uppercase font-bold mt-1">
          {new Date(session.training_date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <DetailMetric
          label="Pace"
          value={formatPace(pace)}
          unit="/km"
          color="text-cyan-400"
        />
        <DetailMetric
          label="Speed"
          value={speed.toFixed(1)}
          unit="km/h"
          color="text-white"
        />
        <DetailMetric
          label="Duration"
          value={formatDuration(session.duration_seconds)}
          unit=""
          color="text-white"
        />
        <div className="bg-white/[0.03] border border-white/5 rounded-[16px] p-4">
          <p className="text-[9px] text-gray-600 uppercase font-black mb-1">
            Zone
          </p>
          <span className={`text-sm font-black uppercase ${zone.color}`}>
            {zone.label}
          </span>
          <br />
          <span className={`text-[9px] font-bold ${sessionType.color}`}>
            {sessionType.label} Run
          </span>
        </div>
      </div>
      {(altitude > 0 || temp !== 0) && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {altitude > 0 && (
            <div
              className={`border rounded-[16px] p-4 flex items-center gap-3 ${altitude > 2000 ? "border-purple-500/30 bg-purple-500/5" : "border-white/5 bg-white/[0.02]"}`}
            >
              <Mountain
                size={16}
                className={
                  altitude > 2000 ? "text-purple-400" : "text-gray-600"
                }
              />
              <div>
                <p className="text-[9px] text-gray-600 uppercase font-black">
                  Altitude
                </p>
                <p className="font-black text-sm">{altitude}m</p>
                {altitude > 2000 && (
                  <p className="text-[9px] text-purple-400 font-bold">
                    High Altitude
                  </p>
                )}
              </div>
            </div>
          )}
          {temp !== 0 && (
            <div className="border border-white/5 bg-white/[0.02] rounded-[16px] p-4 flex items-center gap-3">
              <Thermometer size={16} className="text-gray-600" />
              <div>
                <p className="text-[9px] text-gray-600 uppercase font-black">
                  Temperature
                </p>
                <p className="font-black text-sm">{temp}°C</p>
              </div>
            </div>
          )}
        </div>
      )}
      {(session.start_point || session.end_point) && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 font-bold uppercase">
          <MapPin size={12} className="text-cyan-500" />
          {session.start_point}
          {session.start_point && session.end_point && " → "}
          {session.end_point}
        </div>
      )}
      {session.notes && (
        <div className="bg-white/[0.02] border border-white/5 rounded-[16px] p-5">
          <p className="text-[9px] text-gray-600 uppercase font-black mb-2 flex items-center gap-1">
            <Notebook size={10} /> Notes
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            {session.notes}
          </p>
        </div>
      )}
    </div>
  );
}

function DetailMetric({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-[16px] p-4">
      <p className="text-[9px] text-gray-600 uppercase font-black mb-1">
        {label}
      </p>
      <p className={`text-xl font-black italic ${color}`}>
        {value}
        {unit && (
          <span className="text-[10px] ml-1 font-bold text-gray-600 not-italic">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

function ZoneBreakdown({ sessions }: { sessions: Session[] }) {
  const zones = { Easy: 0, Moderate: 0, Fast: 0 };
  sessions.forEach((s) => {
    const speed = calcSpeed(safeFloat(s.distance_km), s.duration_seconds);
    if (speed <= 0) return;
    const zone = getSpeedZone(speed);
    zones[zone.label as keyof typeof zones]++;
  });
  const total = Object.values(zones).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const zoneColors: Record<string, string> = {
    Easy: "bg-emerald-500",
    Moderate: "bg-amber-500",
    Fast: "bg-red-500",
  };
  return (
    <div className="space-y-4">
      {Object.entries(zones).map(([zone, count]) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={zone}>
            <div className="flex justify-between text-[9px] uppercase font-black mb-1.5">
              <span className="text-gray-500">{zone}</span>
              <span className="text-gray-400">
                {count} sessions ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${zoneColors[zone]}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({
  message,
  icon,
}: {
  message: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon}
      <p className="text-gray-700 uppercase font-black italic text-xs tracking-[0.3em]">
        {message}
      </p>
    </div>
  );
}

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
    <div className="relative">
      <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest mb-2 italic">
        {label}
      </p>
      <p className="text-3xl font-black italic tracking-tighter">
        {val ?? "---"}
        <span className="text-[11px] ml-1 text-cyan-500/50 uppercase font-bold not-italic">
          {unit}
        </span>
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
  error,
  ...props
}: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2 italic tracking-widest">
        {icon} {label}
      </label>
      <input
        {...props}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-white/[0.03] border p-4 rounded-2xl focus:border-cyan-500/50 outline-none transition-all text-sm ${error ? "border-red-500/50 bg-red-500/5" : "border-white/10"}`}
      />
      {error && (
        <p className="text-[10px] text-red-400 font-bold uppercase flex items-center gap-1">
          <AlertTriangle size={10} /> {error}
        </p>
      )}
    </div>
  );
}
