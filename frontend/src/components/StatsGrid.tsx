"use client";
import { motion } from "framer-motion";
import {
  Timer,
  Zap,
  Map,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export const StatsGrid = ({ data }: { data: any }) => {
  const stats = [
    {
      label: "TOTAL DISTANCE",
      val: data?.summary?.total_dist || 0,
      unit: "KM",
      icon: <Map className="text-cyan-500" />,
      trend: `${data?.summary?.monthly_dist || 0} this month`,
    },
    {
      label: "BEST PACE",
      val: data?.summary?.best_pace || "0.00",
      unit: "MIN/KM",
      icon: <Timer className="text-purple-500" />,
      trend: "All-time Record",
    },
    {
      label: "AVG SPEED",
      val: data?.summary?.avg_speed_all_time
        ? parseFloat(data.summary.avg_speed_all_time).toFixed(1)
        : "0.0",
      unit: "KM/H",
      icon: <Zap className="text-yellow-500" />,
      trend:
        data?.performance_diff >= 0
          ? `+${data.performance_diff}% UP`
          : `${data.performance_diff}% DOWN`,
    },
    {
      label: "WEEKLY GAIN",
      val: data?.summary?.weekly_dist || 0,
      unit: "KM",
      icon: <Activity className="text-green-500" />,
      trend: "Past 7 Days",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-[#0A0A0A] border border-white/5 p-5 rounded-[24px] group hover:border-cyan-500/30 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
              {stat.icon}
            </div>
            <span
              className={`text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded-full border ${
                stat.label === "AVG SPEED" && data?.performance_diff > 0
                  ? "text-green-400 border-green-400/10 bg-green-400/5"
                  : "text-gray-500 border-white/5 bg-white/5"
              }`}
            >
              {stat.trend}
            </span>
          </div>

          <p className="text-gray-600 text-[9px] font-black uppercase tracking-[0.2em] mb-1">
            {stat.label}
          </p>

          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black italic tracking-tighter text-white">
              {stat.val}
            </p>
            <span className="text-[10px] font-bold text-gray-500 uppercase">
              {stat.unit}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
