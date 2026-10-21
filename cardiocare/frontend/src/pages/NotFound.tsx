import React from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowLeft } from "lucide-react";
import { GlassCard } from "../components/GlassCard";

export const NotFound: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <GlassCard glowColor="teal" className="p-10 space-y-5">
        <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-4xl font-black text-slate-900">404</h2>
        <h3 className="text-base font-bold text-slate-800">Page Not Found</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested clinical view or page does not exist or has been relocated.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </GlassCard>
    </div>
  );
};
