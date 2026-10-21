import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  History as HistoryIcon,
  Trash2,
  Inbox,
} from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { api } from "../lib/api";

export const History: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => api.getHistory(100, 0),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteHistory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this prediction record?")) {
      deleteMutation.mutate(id);
    }
  };

  const items = data?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-2">
          <HistoryIcon className="w-3.5 h-3.5 text-teal-600" />
          <span>Auditable Prediction Records</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Clinical Prediction History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review previously evaluated patient records stored securely in the local SQLite database.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Retrieving prediction history records...</p>
        </div>
      ) : items.length === 0 ? (
        <GlassCard glowColor="none" className="p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Assessment History Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Completed patient risk evaluations will automatically be logged here with complete biometric snapshots.
          </p>
        </GlassCard>
      ) : (
        <GlassCard glowColor="none" className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Patient ID</th>
                  <th className="py-3 px-3">Age / BMI</th>
                  <th className="py-3 px-3">Salt / Sleep / Stress</th>
                  <th className="py-3 px-3">BP History</th>
                  <th className="py-3 px-3">Probability</th>
                  <th className="py-3 px-3">Risk Tier</th>
                  <th className="py-3 px-3">Model</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {row.patient_id || "Anonymous"}
                    </td>
                    <td className="py-3 px-3">
                      {row.age} yrs / {row.bmi}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                      {row.salt_intake}g / {row.sleep_duration}h / {row.stress_score}/10
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {row.bp_history || "Unspecified"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      {(row.probability * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          row.risk_level === "High"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : row.risk_level === "Moderate"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {row.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {row.model_used}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
