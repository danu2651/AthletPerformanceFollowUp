"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/axios";
import {
  Plus,
  X,
  Activity,
  Zap,
  MapPin,
  Clock,
  Navigation,
} from "lucide-react";

export default function RecordSessionModal({ onSave }: { onSave: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/sessions", formData);
      setIsOpen(false);
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
      onSave();
    } catch (err) {
      console.error("Sync Error:", err);
      alert("Sync Failed. Check backend connection.");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-cyan-500 hover:bg-white text-black px-6 py-3 rounded-2xl transition-all font-black uppercase italic shadow-lg shadow-cyan-500/20 active:scale-95"
      >
        <Plus size={18} /> Record Run
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0A0A0A] border border-white/10 p-8 rounded-[40px] w-full max-w-2xl relative overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white"
              >
                <X />
              </button>

              <h2 className="text-3xl font-black italic uppercase mb-6 flex items-center gap-3">
                <Zap className="text-cyan-500" /> Log Training
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 italic tracking-widest">
                      <MapPin size={12} className="text-cyan-500" /> Start Point
                    </label>
                    <input
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:border-cyan-500 outline-none text-sm"
                      placeholder="Origin"
                      value={formData.start_point}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          start_point: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 italic tracking-widest">
                      <MapPin size={12} className="text-red-500" /> End Point
                    </label>
                    <input
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:border-cyan-500 outline-none text-sm"
                      placeholder="Destination"
                      value={formData.end_point}
                      onChange={(e) =>
                        setFormData({ ...formData, end_point: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase italic tracking-widest">
                      Distance (KM)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:border-cyan-500 outline-none text-sm"
                      placeholder="5.0"
                      value={formData.distance_km}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          distance_km: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase italic tracking-widest">
                      Duration (Sec)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:border-cyan-500 outline-none text-sm"
                      placeholder="1800"
                      value={formData.duration_seconds}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_seconds: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase italic tracking-widest">
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:border-cyan-500 outline-none text-sm text-white"
                      value={formData.training_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          training_date: e.target.value,
                        })
                      }
                    />
                  </div>
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
    </>
  );
}
