import {
  BrainCircuit,
  CheckCircle2,
  Database,
  Layers,
  Cpu,
} from "lucide-react";
import { GlassCard } from "../components/GlassCard";

export const About: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-2">
          <BrainCircuit className="w-3.5 h-3.5 text-teal-600" />
          <span>Machine Learning Methodology</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About CardioCare Architecture & Clinical Evidence
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed documentation on data engineering, dual-model architecture, validation, and ethical limitations.
        </p>
      </div>

      {/* Section 1: Dual-Model Strategy */}
      <GlassCard glowColor="teal" className="p-8 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-600" />
          1. The Dual-Model Routing Architecture
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          During rigorous exploratory data analysis, permutation importance revealed that <strong>BP_History</strong> dominates
          the feature importance hierarchy (dropping ~0.29 in ROC-AUC when shuffled). Because a prior diagnosis of hypertension
          essentially provides the outcome label, relying strictly on it causes leakage when screening asymptomatic individuals
          who have never visited a clinic.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80">
            <h4 className="text-xs font-bold text-teal-900 mb-1">Model Full (Precision Screening)</h4>
            <p className="text-xs text-teal-800 leading-relaxed">
              Incorporates BP_History along with demographic and lifestyle metrics. Achieves <strong>99.5% test accuracy</strong> and
              0.999 ROC-AUC. Used when patients know their prior blood pressure status.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <h4 className="text-xs font-bold text-amber-900 mb-1">Model Lifestyle (Primary Prevention)</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Completely excludes BP_History and Medication. Achieves <strong>74.0% ROC-AUC</strong> (~72% accuracy). Evaluates
              hypertension risk strictly through modifiable diet, sleep, exercise, smoking, and stress behaviors.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Section 2: Clinical Feature Engineering */}
      <GlassCard glowColor="none" className="p-8 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-600" />
          2. Zero-Skew Feature Engineering
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          The feature engineering module is implemented in a single shared file (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-[11px]">ml/features.py</code>)
          imported by both model training and the FastAPI inference service, guaranteeing zero train/serve skew:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 font-medium">
          <li className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong>BMI_Category:</strong> Binned into WHO standard brackets (Underweight &lt;18.5, Normal 18.5–24.9, Overweight 25–29.9, Obese &gt;=30).
            </div>
          </li>
          <li className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong>Age_Group:</strong> Stratified life stages (18–34, 35–49, 50–64, 65+).
            </div>
          </li>
          <li className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong>Poor_Sleep & High_Stress:</strong> Binary threshold indicators (&lt;6 hours sleep and stress &gt;=7/10).
            </div>
          </li>
          <li className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong>Lifestyle_Risk_Score:</strong> Composite cumulative score (0 to 5) tracking smoker status, low exercise, poor sleep, high stress, and overweight BMI.
            </div>
          </li>
        </ul>
      </GlassCard>

      {/* Section 3: Engineering Stack */}
      <GlassCard glowColor="teal" className="p-8 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-teal-600" />
          3. Production Technology Stack
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 space-y-1">
            <span className="font-bold text-slate-800 block">Machine Learning Core</span>
            <p className="text-slate-500">Python 3.12, scikit-learn 1.9.0, GradientBoostingClassifier, ColumnTransformer Pipelines, Joblib serialization.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 space-y-1">
            <span className="font-bold text-slate-800 block">Backend Framework</span>
            <p className="text-slate-500">FastAPI, Pydantic v2, SQLAlchemy 2.0 (asyncio + aiosqlite), SlowAPI Rate Limiting, CORS, Pytest.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 space-y-1">
            <span className="font-bold text-slate-800 block">Frontend Experience</span>
            <p className="text-slate-500">React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Recharts, TanStack Query, Lucide Icons.</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
