import type { ContributingFactor } from "../lib/api";
import { Info, TrendingUp, TrendingDown } from "lucide-react";

interface ContributingFactorsChartProps {
  factors: ContributingFactor[];
}

export const ContributingFactorsChart: React.FC<ContributingFactorsChartProps> = ({ factors }) => {
  if (!factors || factors.length === 0) {
    return <p className="text-slate-500 text-sm italic">No contributing factors available.</p>;
  }

  // Find max absolute contribution for bar normalization
  const maxAbs = Math.max(...factors.map((f) => Math.abs(f.signed_contribution)), 0.1);

  return (
    <div className="space-y-4">
      {factors.map((factor, idx) => {
        const isRiskIncrease = factor.signed_contribution > 0;
        const widthPct = Math.min((Math.abs(factor.signed_contribution) / maxAbs) * 100, 100);

        return (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-white/70 border border-slate-100/80 shadow-xs hover:border-slate-200 transition-colors"
          >
            <div className="flex items-center justify-between text-sm mb-1.5">
              <div className="flex items-center gap-2">
                {isRiskIncrease ? (
                  <TrendingUp className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span className="font-semibold text-slate-800">{factor.display_name}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                  {String(factor.value)}
                </span>
              </div>
              <span
                className={`text-xs font-bold font-mono ${
                  isRiskIncrease ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {factor.signed_contribution > 0 ? "+" : ""}
                {(factor.signed_contribution * 100).toFixed(1)}%
              </span>
            </div>

            {/* Bar Track */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${widthPct}%` }}
                className={`h-full rounded-full transition-all duration-700 ${
                  isRiskIncrease
                    ? "bg-gradient-to-r from-rose-400 to-rose-500"
                    : "bg-gradient-to-r from-emerald-400 to-teal-500"
                }`}
              />
            </div>

            {/* Clinical narrative */}
            <p className="text-xs text-slate-500 mt-2 leading-relaxed flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{factor.human_readable}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
};
