import React from "react";
import { motion } from "framer-motion";

interface RiskGaugeProps {
  probability: number; // 0.0 to 1.0
  riskLevel: "Low" | "Moderate" | "High";
  size?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  probability,
  riskLevel,
  size = 220,
}) => {
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Semi-circle or 240 degree gauge
  const progress = Math.min(Math.max(probability, 0), 1);
  const strokeDashoffset = circumference - progress * circumference;

  const getColor = () => {
    if (riskLevel === "Low") return { stroke: "#10B981", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Low Risk (<35%)" };
    if (riskLevel === "Moderate") return { stroke: "#F59E0B", bg: "bg-amber-50 text-amber-700 border-amber-200", label: "Moderate Risk (35-65%)" };
    return { stroke: "#EF4444", bg: "bg-rose-50 text-rose-700 border-rose-200", label: "High Risk (>65%)" };
  };

  const currentTheme = getColor();

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
          />
          {/* Animated Progress Track */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={currentTheme.stroke}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            className="text-4xl font-extrabold text-slate-800 tracking-tight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {(progress * 100).toFixed(1)}%
          </motion.span>
          <span className="text-xs uppercase font-semibold text-slate-400 mt-0.5 tracking-wider">
            Probability
          </span>
        </div>
      </div>

      {/* Risk Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`mt-3 px-4 py-1.5 rounded-full text-xs font-bold border tracking-wide uppercase shadow-sm ${currentTheme.bg}`}
      >
        {riskLevel} Risk Tier
      </motion.div>
    </div>
  );
};
