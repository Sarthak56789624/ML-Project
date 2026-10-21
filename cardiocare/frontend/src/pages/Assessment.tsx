import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Calculator,
  AlertTriangle,
  Info,
  CheckCircle2,
  Heart,
  Moon,
  Flame,
  Scale,
  Cigarette,
  Dumbbell,
  Users,
  Droplet,
  Sparkles,
  Zap,
  Printer,
  RotateCcw,
  ShieldAlert,
  ChevronRight,
  Sliders,
  Stethoscope,
} from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { RiskGauge } from "../components/RiskGauge";
import {
  api,
  type UnifiedPatientInput,
  type CardiometabolicPredictionResponse,
} from "../lib/api";

export type ScreeningTarget = "dual" | "hypertension" | "diabetes";

interface PresetProfile {
  name: string;
  tag: string;
  desc: string;
  badgeColor: string;
  data: UnifiedPatientInput;
}

const PRESET_PROFILES: PresetProfile[] = [
  {
    name: "Healthy Young Adult",
    tag: "Low Risk Baseline",
    desc: "Age 26, Normal BMI 22.4, Optimal Blood Pressure & Fasting Glucose (88 mg/dL)",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    data: {
      patient_id: "PT-HEALTHY-01",
      age: 26,
      gender: "Male",
      bmi: 22.4,
      smoking_habit: "never",
      bp_status: "Normal",
      family_history_htn: "No",
      heart_disease: 0,
      salt_intake: 4.5,
      stress_score: 3,
      sleep_duration: 7.5,
      exercise_level: "High",
      medication: "None",
      hba1c_level: 5.1,
      blood_glucose_level: 88,
    },
  },
  {
    name: "Metabolic Syndrome & Prediabetes",
    tag: "Borderline Dual Risk",
    desc: "Age 52, Overweight BMI 28.5, Prehypertension, High Stress, Impaired Glycemia",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    data: {
      patient_id: "PT-PREDIAB-02",
      age: 52,
      gender: "Female",
      bmi: 28.5,
      smoking_habit: "former",
      bp_status: "Prehypertension",
      family_history_htn: "Yes",
      heart_disease: 0,
      salt_intake: 8.5,
      stress_score: 7,
      sleep_duration: 6.0,
      exercise_level: "Moderate",
      medication: "None",
      hba1c_level: 6.2,
      blood_glucose_level: 122,
    },
  },
  {
    name: "High-Risk Senior Comorbidity",
    tag: "High Dual Comorbidity",
    desc: "Age 68, Obese BMI 34.2, Diagnosed HTN on Meds, Elevated HbA1c 7.6%, Heart Disease",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    data: {
      patient_id: "PT-HIGHRISK-03",
      age: 68,
      gender: "Male",
      bmi: 34.2,
      smoking_habit: "current",
      bp_status: "Hypertension",
      family_history_htn: "Yes",
      heart_disease: 1,
      salt_intake: 11.0,
      stress_score: 8,
      sleep_duration: 5.0,
      exercise_level: "Low",
      medication: "ACE Inhibitor",
      hba1c_level: 7.6,
      blood_glucose_level: 210,
    },
  },
];

export const Assessment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Target mode (?mode=dual | hypertension | diabetes)
  const initialMode = (searchParams.get("mode") as ScreeningTarget) || "dual";
  const [screeningMode, setScreeningMode] = useState<ScreeningTarget>(
    ["dual", "hypertension", "diabetes"].includes(initialMode) ? initialMode : "dual"
  );

  // Sync mode with URL param
  const handleModeChange = (mode: ScreeningTarget) => {
    setScreeningMode(mode);
    setSearchParams({ mode });
  };

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unified Form State (Shared features entered ONCE)
  const [formData, setFormData] = useState<UnifiedPatientInput>({
    patient_id: "PT-" + Math.floor(1000 + Math.random() * 9000),
    age: 48,
    gender: "Female",
    bmi: 26.5,
    smoking_habit: "never",
    bp_status: "Prehypertension",
    family_history_htn: "Yes",
    heart_disease: 0,
    salt_intake: 7.5,
    stress_score: 6,
    sleep_duration: 6.5,
    exercise_level: "Moderate",
    medication: "None",
    hba1c_level: 5.8,
    blood_glucose_level: 108,
  });

  // Results State
  const [result, setResult] = useState<CardiometabolicPredictionResponse | null>(null);

  // Height & Weight BMI Helper Calculator
  const [showBmiModal, setShowBmiModal] = useState(false);
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightKg, setWeightKg] = useState<number>(75);

  const calculateBmi = () => {
    if (heightCm > 0 && weightKg > 0) {
      const hM = heightCm / 100;
      const computed = Number((weightKg / (hM * hM)).toFixed(1));
      setFormData((prev) => ({ ...prev, bmi: computed }));
      setShowBmiModal(false);
    }
  };

  // Biomarker helper badges
  const getBmiBadge = (val: number) => {
    if (val < 18.5) return { text: "Underweight (<18.5)", color: "text-sky-700 bg-sky-50 border-sky-200" };
    if (val < 25.0) return { text: "Normal BMI (18.5 - 24.9)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (val < 30.0) return { text: "Overweight (25 - 29.9)", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { text: "Obese (≥30 kg/m²)", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  const getHba1cBadge = (val: number) => {
    if (val < 5.7) return { text: "Normal (< 5.7%)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (val < 6.5) return { text: "Prediabetes (5.7% - 6.4%)", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { text: "Diabetic Range (≥ 6.5%)", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  const getGlucoseBadge = (val: number) => {
    if (val < 100) return { text: "Normal (< 100 mg/dL)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (val < 126) return { text: "Impaired / Prediabetes (100 - 125)", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { text: "Diabetic Threshold (≥ 126 mg/dL)", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  const bmiStatus = getBmiBadge(formData.bmi);
  const hba1cStatus = getHba1cBadge(formData.hba1c_level);
  const glucoseStatus = getGlucoseBadge(formData.blood_glucose_level);

  // Apply quick preset
  const handleSelectPreset = async (preset: PresetProfile) => {
    setFormData(preset.data);
    setError(null);
    setLoading(true);
    try {
      const res = await api.predictCardiometabolic(preset.data);
      setResult(res);
      // Smooth scroll to results
      setTimeout(() => {
        const el = document.getElementById("results-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      setError(err.message || "Failed to evaluate preset.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictCardiometabolic(formData);
      setResult(res);
      setTimeout(() => {
        const el = document.getElementById("results-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      setError(err.message || "Failed to process assessment. Please verify your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      patient_id: "PT-" + Math.floor(1000 + Math.random() * 9000),
      age: 45,
      gender: "Female",
      bmi: 24.8,
      smoking_habit: "never",
      bp_status: "Normal",
      family_history_htn: "No",
      heart_disease: 0,
      salt_intake: 5.0,
      stress_score: 4,
      sleep_duration: 7.0,
      exercise_level: "Moderate",
      medication: "None",
      hba1c_level: 5.4,
      blood_glucose_level: 95,
    });
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-indigo-950 text-white p-8 md:p-12 shadow-2xl border border-teal-500/20">
        <div className="absolute -top-12 -right-12 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CardioCare Integrated Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Integrated Cardiometabolic Assessment
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Unified risk stratification for <strong>Hypertension</strong> and <strong>Type 2 Diabetes</strong>.
            Shared vitals, demographics, and clinical history are entered <strong>once</strong> and evaluated across
            dual Gradient Boosting & LightGBM neural pipelines.
          </p>

          {/* Screening Target Mode Toggle */}
          <div className="pt-2">
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-md gap-1">
              <button
                type="button"
                onClick={() => handleModeChange("dual")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  screeningMode === "dual"
                    ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Complete Dual Assessment (Both)</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("hypertension")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  screeningMode === "hypertension"
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-teal-300" />
                <span>Hypertension Only</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("diabetes")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  screeningMode === "diabetes"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Droplet className="w-3.5 h-3.5 text-indigo-300" />
                <span>Diabetes Only</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Profiles Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Quick-Load Clinical Benchmark Profiles</span>
          </h2>
          <span className="text-[11px] text-slate-400">Click to autofill shared vitals & run evaluation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_PROFILES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="text-left p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-400 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      {preset.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>
                      {preset.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{preset.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Assessment Notice</div>
            <div className="text-xs mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Unified Input Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/90 shadow-sm space-y-8">
          {/* Header & Reset */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <span>Patient Parameters & Biomarkers</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All shared fields automatically synchronize between Hypertension and Diabetes risk pipelines.
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1.5 font-bold self-start sm:self-auto py-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          {/* Section 1: Shared Demographics & Anthropometrics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <Scale className="w-4 h-4 text-teal-600" />
              <span>1. Demographics & Anthropometrics (Entered Once)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Patient ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Patient Identifier</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    placeholder="e.g. PT-2026-01"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-teal-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, patient_id: "PT-" + Math.floor(1000 + Math.random() * 9000) })
                    }
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs"
                    title="Generate Random ID"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Biological Sex */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Biological Sex</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Female", "Male"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g })}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        formData.gender === g
                          ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Age</label>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    {formData.age} yrs
                  </span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="90"
                  step="1"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 18 })}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>18</span>
                  <span>50</span>
                  <span>90</span>
                </div>
              </div>

              {/* Body Mass Index (BMI) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Body Mass Index</label>
                  <button
                    type="button"
                    onClick={() => setShowBmiModal(true)}
                    className="text-[11px] font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Height/Weight</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="60"
                    value={formData.bmi}
                    onChange={(e) => setFormData({ ...formData, bmi: parseFloat(e.target.value) || 20 })}
                    className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-teal-500 bg-white"
                  />
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border whitespace-nowrap ${bmiStatus.color}`}>
                    {bmiStatus.text}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Shared Clinical & Cardiovascular History */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700">
              <Heart className="w-4 h-4 text-rose-600" />
              <span>2. Shared Clinical & Cardiovascular History (Entered Once)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Smoking Habit - Unified selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Cigarette className="w-3.5 h-3.5 text-slate-500" />
                  <span>Smoking Status & History</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "never", label: "Never Smoked", desc: "Non-smoker" },
                    { id: "former", label: "Former Smoker", desc: "Quit tobacco" },
                    { id: "current", label: "Current Smoker", desc: "Active smoker" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, smoking_habit: s.id as any })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formData.smoking_habit === s.id
                          ? s.id === "current"
                            ? "bg-rose-50 border-rose-500 text-rose-800 shadow-xs"
                            : "bg-teal-50 border-teal-500 text-teal-800 shadow-xs"
                          : "bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="text-xs font-bold">{s.label}</div>
                      <div className="text-[10px] text-slate-500">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Blood Pressure History - Unified selector */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-600" />
                    <span>Blood Pressure History & Reading</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "Normal", label: "Normal", desc: "<120/80" },
                    { id: "Prehypertension", label: "Prehypertension", desc: "120-139 / 80-89" },
                    { id: "Hypertension", label: "Diagnosed HTN", desc: "≥140/90" },
                    { id: "Unknown", label: "Not Checked", desc: "Lifestyle Model" },
                  ].map((bp) => (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, bp_status: bp.id as any })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        formData.bp_status === bp.id
                          ? bp.id === "Hypertension"
                            ? "bg-rose-50 border-rose-500 text-rose-800 shadow-xs"
                            : bp.id === "Unknown"
                            ? "bg-amber-50 border-amber-500 text-amber-800 shadow-xs"
                            : "bg-teal-50 border-teal-500 text-teal-800 shadow-xs"
                          : "bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="text-xs font-bold">{bp.label}</div>
                      <div className="text-[10px] text-slate-500">{bp.desc}</div>
                    </button>
                  ))}
                </div>

                {formData.bp_status === "Unknown" && (
                  <p className="text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200 p-2 rounded-lg flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Since BP history is unrecorded, the <strong>Lifestyle Only</strong> gradient booster will be utilized.
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Comorbidity Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Family History of Hypertension?</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["No", "Yes"] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData({ ...formData, family_history_htn: val })}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        formData.family_history_htn === val
                          ? val === "Yes"
                            ? "bg-amber-50 border-amber-500 text-amber-800 shadow-xs"
                            : "bg-teal-50 border-teal-500 text-teal-800 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Personal History of Heart Disease / CAD?</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 0, label: "No (Clear)" },
                    { val: 1, label: "Yes (Diagnosed)" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setFormData({ ...formData, heart_disease: item.val })}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        formData.heart_disease === item.val
                          ? item.val === 1
                            ? "bg-rose-50 border-rose-500 text-rose-800 shadow-xs"
                            : "bg-teal-50 border-teal-500 text-teal-800 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Lifestyle & Behavioral Variables (Hypertension / Dual) */}
          {(screeningMode === "dual" || screeningMode === "hypertension") && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>3. Lifestyle & Behavioral Factors</span>
                </div>
                <span className="text-[11px] text-slate-400">Sodium, Sleep & Stress Dynamics</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Salt Intake */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Salt Intake</label>
                    <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {formData.salt_intake.toFixed(1)} g/d
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="0.5"
                    value={formData.salt_intake}
                    onChange={(e) => setFormData({ ...formData, salt_intake: parseFloat(e.target.value) || 5 })}
                    className="w-full accent-teal-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0g</span>
                    <span className="text-emerald-600 font-bold">5g (WHO)</span>
                    <span>25g</span>
                  </div>
                </div>

                {/* Sleep Duration */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Moon className="w-3.5 h-3.5 text-blue-500" />
                      <span>Sleep Duration</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {formData.sleep_duration.toFixed(1)} h/n
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="14"
                    step="0.5"
                    value={formData.sleep_duration}
                    onChange={(e) => setFormData({ ...formData, sleep_duration: parseFloat(e.target.value) || 7 })}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span className="text-rose-500 font-semibold">&lt;6h</span>
                    <span className="text-emerald-600 font-bold">7-8h</span>
                    <span>14h</span>
                  </div>
                </div>

                {/* Stress Score */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Stress Score</label>
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {formData.stress_score} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={formData.stress_score}
                    onChange={(e) => setFormData({ ...formData, stress_score: parseInt(e.target.value) || 5 })}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0 (Calm)</span>
                    <span>5</span>
                    <span className="text-rose-500 font-semibold">10 (Severe)</span>
                  </div>
                </div>

                {/* Exercise Level */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Dumbbell className="w-3.5 h-3.5 text-teal-600" />
                    <span>Physical Activity</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["Low", "Moderate", "High"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFormData({ ...formData, exercise_level: lvl })}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          formData.exercise_level === lvl
                            ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Medication Selector */}
              {formData.bp_status !== "Unknown" && (
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Current Antihypertensive Medication
                  </label>
                  <select
                    value={formData.medication || "None"}
                    onChange={(e) => setFormData({ ...formData, medication: e.target.value as any })}
                    className="w-full sm:w-1/2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                  >
                    <option value="None">None (No Blood Pressure Medication)</option>
                    <option value="ACE Inhibitor">ACE Inhibitor (e.g. Lisinopril, Enalapril)</option>
                    <option value="Beta Blocker">Beta Blocker (e.g. Metoprolol, Atenolol)</option>
                    <option value="Diuretic">Diuretic (e.g. Hydrochlorothiazide)</option>
                    <option value="Other">Other / Combination</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Glycemic Biomarkers (Diabetes / Dual) */}
          {(screeningMode === "dual" || screeningMode === "diabetes") && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
                  <Droplet className="w-4 h-4 text-indigo-600" />
                  <span>4. Glycemic Biomarkers (Metabolic Health)</span>
                </div>
                <span className="text-[11px] text-slate-400">American Diabetes Association Diagnostic Criteria</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* HbA1c */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-500" />
                      <span>Glycated Hemoglobin (HbA1c %)</span>
                    </label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hba1cStatus.color}`}>
                      {hba1cStatus.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="4.0"
                      max="12.0"
                      step="0.1"
                      value={formData.hba1c_level}
                      onChange={(e) => setFormData({ ...formData, hba1c_level: parseFloat(e.target.value) || 5.5 })}
                      className="flex-1 accent-indigo-600"
                    />
                    <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-xl border border-slate-200">
                      <input
                        type="number"
                        min="4.0"
                        max="14.0"
                        step="0.1"
                        value={formData.hba1c_level}
                        onChange={(e) => setFormData({ ...formData, hba1c_level: parseFloat(e.target.value) || 5.5 })}
                        className="w-14 text-xs font-bold text-slate-900 text-right focus:outline-none"
                      />
                      <span className="text-xs font-semibold text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Optimal (&lt; 5.7%)</span>
                    <span className="text-amber-600 font-bold">Prediabetes (5.7 - 6.4%)</span>
                    <span className="text-rose-600 font-bold">Diabetic (&ge; 6.5%)</span>
                  </div>
                </div>

                {/* Fasting Glucose */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      <span>Fasting Blood Glucose (mg/dL)</span>
                    </label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${glucoseStatus.color}`}>
                      {glucoseStatus.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="60"
                      max="300"
                      step="1"
                      value={formData.blood_glucose_level}
                      onChange={(e) =>
                        setFormData({ ...formData, blood_glucose_level: parseFloat(e.target.value) || 100 })
                      }
                      className="flex-1 accent-indigo-600"
                    />
                    <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-xl border border-slate-200">
                      <input
                        type="number"
                        min="50"
                        max="400"
                        step="1"
                        value={formData.blood_glucose_level}
                        onChange={(e) =>
                          setFormData({ ...formData, blood_glucose_level: parseFloat(e.target.value) || 100 })
                        }
                        className="w-14 text-xs font-bold text-slate-900 text-right focus:outline-none"
                      />
                      <span className="text-xs font-semibold text-slate-400">mg/dL</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Normal (&lt; 100)</span>
                    <span className="text-amber-600 font-bold">Impaired (100 - 125)</span>
                    <span className="text-rose-600 font-bold">Diabetic (&ge; 126)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-teal-600" />
              <span>
                {screeningMode === "dual"
                  ? "Evaluating Hypertension Gradient Booster & Diabetes LightGBM concurrently."
                  : screeningMode === "hypertension"
                  ? "Evaluating Hypertension Risk Engine with active lifestyle parameters."
                  : "Evaluating Diabetes LightGBM biomarker engine."}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-white bg-gradient-to-r from-teal-500 via-cyan-600 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 shadow-xl shadow-teal-500/25 text-xs flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Dual Risk Projections...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {screeningMode === "dual"
                      ? "Run Integrated Risk Assessment"
                      : screeningMode === "hypertension"
                      ? "Calculate Hypertension Risk"
                      : "Calculate Diabetes Risk"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Unified Diagnostic Results Display */}
      {result && (
        <div id="results-section" className="space-y-8 scroll-mt-20">
          {/* Top Banner Card: Combined Cardiometabolic Health Score */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-8 md:p-10 shadow-2xl border border-teal-500/30">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      result.combined_risk_level === "High"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        : result.combined_risk_level === "Moderate"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {result.combined_risk_level} Overall Risk Tier
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Patient ID: {result.patient_id || formData.patient_id || "Anonymous"}
                  </span>
                </div>

                <h3 className="text-2xl md:text-3xl font-black tracking-tight">{result.synergy_headline}</h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
                  {result.synergy_description}
                </p>
              </div>

              {/* Combined Score Donut/Badge */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Cardiometabolic Health Index
                </div>
                <div className="text-5xl font-black my-2 bg-gradient-to-r from-teal-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  {result.combined_risk_score}
                  <span className="text-2xl text-slate-400 font-normal">/100</span>
                </div>
                <div className="text-xs text-slate-300 font-semibold">
                  {result.combined_risk_score >= 60
                    ? "Severe Dual Comorbidity"
                    : result.combined_risk_score >= 30
                    ? "Moderate Interdependent Risk"
                    : "Optimal Vascular & Glycemic Health"}
                </div>
              </div>
            </div>
          </div>

          {/* Dual Gauges Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Card: Hypertension Prediction */}
            <GlassCard glowColor="teal" className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Hypertension Risk Assessment</h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Model: {result.hypertension.model_used === "model_full" ? "Full Clinical Ensemble" : "Lifestyle Only"}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    result.hypertension.risk_level === "High"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : result.hypertension.risk_level === "Moderate"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {result.hypertension.label}
                </span>
              </div>

              {/* Gauge */}
              <div className="flex justify-center py-2">
                <RiskGauge
                  probability={result.hypertension.probability}
                  riskLevel={result.hypertension.risk_level}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                <p>
                  <strong>Routing Protocol:</strong> {result.hypertension.routing_explanation}
                </p>
              </div>

              {/* Action to What-If simulator */}
              <button
                type="button"
                onClick={() =>
                  navigate("/result", {
                    state: {
                      prediction: result.hypertension,
                      patient: {
                        Age: formData.age,
                        BMI: formData.bmi,
                        Salt_Intake: formData.salt_intake,
                        Stress_Score: formData.stress_score,
                        Sleep_Duration: formData.sleep_duration,
                        Family_History: formData.family_history_htn,
                        Exercise_Level: formData.exercise_level,
                        Smoking_Status: formData.smoking_habit === "current" ? "Smoker" : "Non-Smoker",
                        BP_History: formData.bp_status === "Unknown" ? null : (formData.bp_status as any),
                        Medication: formData.bp_status === "Unknown" ? "None" : formData.medication,
                        patient_id: formData.patient_id,
                      },
                    },
                  })
                }
                className="w-full py-2.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Simulate Hypertension What-If Lifestyle Interventions</span>
              </button>
            </GlassCard>

            {/* Right Card: Diabetes Prediction */}
            <GlassCard glowColor="teal" className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Type 2 Diabetes Risk Assessment</h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Model: LightGBM Production Pipeline
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    result.diabetes.risk_level === "High"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : result.diabetes.risk_level === "Moderate"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {result.diabetes.label}
                </span>
              </div>

              {/* Gauge */}
              <div className="flex justify-center py-2">
                <RiskGauge
                  probability={result.diabetes.probability}
                  riskLevel={result.diabetes.risk_level}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">HbA1c Status</div>
                  <div className="font-bold text-slate-800 mt-0.5">{result.diabetes.hba1c_category}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Glucose Tier</div>
                  <div className="font-bold text-slate-800 mt-0.5">{result.diabetes.glucose_category}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                <p>
                  <strong>Glycemic Index:</strong> Calibrated threshold of {result.diabetes.threshold_used} indicates{" "}
                  {result.diabetes.is_diabetic ? "probable diabetic status." : "sub-threshold metabolic risk."}
                </p>
              </div>
            </GlassCard>
          </div>

          {/* Top Contributing Risk Drivers */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Key Risk Drivers Across Both Conditions</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extracted via machine learning Shapley feature importance scores.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.top_combined_factors.map((factor, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    factor.impact === "increases_risk"
                      ? "bg-rose-50/40 border-rose-200/80"
                      : "bg-emerald-50/40 border-emerald-200/80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900">{factor.display_name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        factor.impact === "increases_risk"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {factor.impact === "increases_risk" ? "Raises Risk" : "Protective"}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 font-mono mb-1">
                    Value: {String(factor.value)}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{factor.human_readable}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Unified Clinical Action Plan */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Prioritized Clinical & Lifestyle Action Plan</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synthesized non-pharmacological recommendations to simultaneously mitigate vascular and metabolic risk.
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Report</span>
              </button>
            </div>

            <div className="space-y-3">
              {result.unified_recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-3.5"
                >
                  <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{rec.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                        {rec.category} • {rec.impact_potential} Impact
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BMI Helper Modal */}
      {showBmiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-teal-600" />
              <span>Body Mass Index Calculator</span>
            </h4>
            <p className="text-xs text-slate-500">
              Enter height and weight to automatically apply BMI to both Hypertension and Diabetes models.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Height (Centimeters)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Weight (Kilograms)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowBmiModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={calculateBmi}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md"
              >
                Apply BMI ({((weightKg / ((heightCm / 100) * (heightCm / 100))) || 0).toFixed(1)})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
