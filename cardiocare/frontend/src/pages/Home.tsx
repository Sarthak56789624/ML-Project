import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  FileSpreadsheet,
  CheckCircle2,
  HeartPulse,
  BrainCircuit,
  TrendingDown,
  Droplet,
} from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export const Home: React.FC = () => {
  const { data: modelInfo } = useQuery({
    queryKey: ["modelInfo"],
    queryFn: api.getModelInfo,
  });

  const fullAcc = modelInfo?.metrics_summary?.model_full?.accuracy
    ? (modelInfo.metrics_summary.model_full.accuracy * 100).toFixed(1)
    : "99.5";

  const lifeAuc = modelInfo?.metrics_summary?.model_lifestyle?.roc_auc
    ? (modelInfo.metrics_summary.model_lifestyle.roc_auc * 100).toFixed(1)
    : "87.5";

  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & CTA */}
            <motion.div
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold tracking-wide shadow-xs">
                <Sparkles className="w-4 h-4 text-teal-600 animate-spin [animation-duration:8s]" />
                <span>Next-Gen Hypertension Risk Engine</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Prevent Hypertension with{" "}
                <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Precision AI
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                CardioCare pairs clinically-engineered demographic, lifestyle, and biometric markers
                with dual tuned Gradient Boosting pipelines. Discover your personalized risk level,
                key contributing factors, and simulate lifestyle interventions in real time.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/assessment"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 group transition-all transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Start Dual Assessment</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/assessment?mode=diabetes"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100 border border-indigo-200/80 shadow-xs flex items-center justify-center gap-2 transition-all transform active:scale-95"
                >
                  <Droplet className="w-4 h-4 text-indigo-600" />
                  <span>Diabetes Mode</span>
                </Link>

                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-slate-700 bg-white/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Explore Insights</span>
                </Link>
              </div>

              {/* Quick Trust Badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/70 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <div className="text-2xl font-black text-slate-900">{fullAcc}%</div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Full Model Test Acc
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{lifeAuc}%</div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Lifestyle ROC-AUC
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">1,985</div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Records Evaluated
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Hero Visual Illustration */}
            <motion.div
              className="lg:col-span-5 relative flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative w-full max-w-md aspect-square rounded-3xl p-8 bg-gradient-to-br from-white/90 via-white/80 to-teal-50/60 border border-white/80 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden">
                {/* Background decorative circles */}
                <div className="absolute inset-0 bg-radial from-teal-400/10 via-transparent to-transparent pointer-events-none" />

                {/* Floating Heart / ECG Visual */}
                <div className="relative z-10 w-36 h-36 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-teal-500/30 animate-pulse-subtle">
                  <HeartPulse className="w-20 h-20 text-white" />
                </div>

                {/* Pulsing ECG line SVG */}
                <svg
                  className="w-full h-16 mt-6 text-teal-600"
                  viewBox="0 0 300 60"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0,30 L60,30 L75,10 L90,50 L105,5 L120,40 L135,30 L300,30"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                {/* Dynamic Floating Badges */}
                <motion.div
                  className="absolute top-6 left-6 px-3.5 py-1.5 rounded-xl bg-white/95 border border-slate-200/80 shadow-md text-xs font-bold text-slate-800 flex items-center gap-1.5"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Dual Model Routing</span>
                </motion.div>

                <motion.div
                  className="absolute bottom-6 right-6 px-3.5 py-1.5 rounded-xl bg-white/95 border border-slate-200/80 shadow-md text-xs font-bold text-slate-800 flex items-center gap-1.5"
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <SlidersHorizontal className="w-4 h-4 text-teal-500" />
                  <span>Interactive What-If</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Shining Feature Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Comprehensive Clinical Intelligence
          </h2>
          <p className="text-sm text-slate-600">
            Engineered with modern full-stack medicine: rigorous data preprocessing, model interpretability, and actionable lifestyle simulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <GlassCard glowColor="teal">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-600 mb-5">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Dual-Model Routing
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Equipped with both a Full Model (99.5% accuracy incorporating prior BP records) and an autonomous Lifestyle Model (87.5% ROC-AUC for patients without prior clinical measurements).
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-teal-600 gap-1">
              <span>Automatic inference switching</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            </div>
          </GlassCard>

          {/* Card 2 */}
          <GlassCard glowColor="amber">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 mb-5">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              What-If Intervention Simulator
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Modify salt intake, sleep duration, exercise, or smoking status on interactive sliders to visualize projected risk reduction before making actual lifestyle changes.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-amber-600 gap-1">
              <span>Real-time counterfactual analysis</span>
              <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </GlassCard>

          {/* Card 3 */}
          <GlassCard glowColor="coral">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 mb-5">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Batch CSV Screening
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload institutional patient cohorts (up to 5,000 rows, 5 MB). Validates data integrity row-by-row and exports risk scores and labels directly to CSV.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-rose-600 gap-1">
              <span>Population-scale health screening</span>
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
            </div>
          </GlassCard>
        </div>
      </section>

      {/* How It Works Timeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-8 sm:p-14 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl mb-12">
            <span className="text-teal-400 font-bold uppercase tracking-wider text-xs">
              Workflow Overview
            </span>
            <h2 className="text-3xl font-extrabold mt-2 tracking-tight">
              Three-Step Risk Prediction Pathway
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {/* Step 1 */}
            <div className="space-y-3 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-400 text-teal-300 font-bold flex items-center justify-center">
                1
              </div>
              <h4 className="text-base font-bold text-white">Biometric Submission</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter age, BMI, sodium intake, sleep duration, stress levels, exercise, and optional blood pressure history through our guided wizard.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold flex items-center justify-center">
                2
              </div>
              <h4 className="text-base font-bold text-white">Ensemble Inference</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tuned Gradient Boosting classifiers evaluate non-linear feature interactions and determine your precise hypertension risk tier and top drivers.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400 text-blue-300 font-bold flex items-center justify-center">
                3
              </div>
              <h4 className="text-base font-bold text-white">Intervention & Guidance</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Explore personalized lifestyle recommendations (DASH diet, circadian sleep hygiene), test what-if scenarios, and download your clinical summary.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
