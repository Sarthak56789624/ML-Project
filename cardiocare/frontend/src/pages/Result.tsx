import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Activity,
  Sparkles,
  Sliders,
  Printer,
  RotateCcw,
} from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { RiskGauge } from "../components/RiskGauge";
import { ContributingFactorsChart } from "../components/ContributingFactorsChart";
import { type PredictionResponse, type PatientInput, api } from "../lib/api";

export const Result: React.FC = () => {
  const location = useLocation();

  const state = location.state as { prediction: PredictionResponse; patient: PatientInput } | undefined;

  // Fallback if accessed directly without submitting
  const [patientData] = useState<PatientInput>(
    state?.patient || {
      Age: 52,
      BMI: 28.5,
      Salt_Intake: 9.0,
      Stress_Score: 7,
      Sleep_Duration: 5.5,
      Family_History: "Yes",
      Exercise_Level: "Low",
      Smoking_Status: "Smoker",
      BP_History: "Prehypertension",
      Medication: "None",
    }
  );

  const [currentPrediction, setCurrentPrediction] = useState<PredictionResponse>(
    state?.prediction || {
      probability: 0.824,
      risk_level: "High",
      label: "Hypertension",
      threshold_used: 0.5,
      model_used: "model_full",
      model_version: "1.0.0",
      routing_explanation: "Evaluated using Full Gradient Boosting Model.",
      contributing_factors: [],
      recommendations: [],
      timestamp: new Date().toISOString(),
    }
  );

  // What-If Simulator Overrides State
  const [simOverrides, setSimOverrides] = useState({
    Salt_Intake: patientData.Salt_Intake,
    Sleep_Duration: patientData.Sleep_Duration,
    Stress_Score: patientData.Stress_Score,
    Smoking_Status: patientData.Smoking_Status,
    Exercise_Level: patientData.Exercise_Level,
  });

  const [simulating, setSimulating] = useState(false);
  const [whatIfResult, setWhatIfResult] = useState<any>(null);

  const runWhatIf = async (newOverrides: typeof simOverrides) => {
    setSimulating(true);
    try {
      const res = await api.whatIf(patientData, newOverrides);
      setWhatIfResult(res);
      // Update gauge with changed probability
      setCurrentPrediction((prev) => ({
        ...prev,
        probability: res.changed_probability,
        risk_level: res.changed_risk_level,
        label: res.changed_probability >= 0.5 ? "Hypertension" : "No Hypertension",
      }));
    } catch (err) {
      console.error("What-if calculation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  const handleSliderChange = (field: keyof typeof simOverrides, value: any) => {
    const updated = { ...simOverrides, [field]: value };
    setSimOverrides(updated);
    runWhatIf(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-2">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>Screening Summary & Diagnostic Inference</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Patient Risk Assessment Report
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generated on {new Date(currentPrediction.timestamp).toLocaleString()} • {currentPrediction.model_used.toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-2 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>

          <Link
            to="/assessment"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 flex items-center gap-2 shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Assessment</span>
          </Link>
        </div>
      </div>

      {/* Routing Model Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-white to-cyan-50 border border-teal-200/80 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-teal-900">Inference Pipeline: </span>
          {currentPrediction.routing_explanation}
        </div>
      </div>

      {/* Main Grid: Gauge & Contributing Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gauge & Risk Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard glowColor={currentPrediction.risk_level === "High" ? "coral" : currentPrediction.risk_level === "Moderate" ? "amber" : "mint"} className="text-center p-8">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">
              Predicted Probability
            </h3>

            <RiskGauge
              probability={currentPrediction.probability}
              riskLevel={currentPrediction.risk_level}
              size={240}
            />

            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-left">
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">
                  Class Label
                </span>
                <span className="text-sm font-extrabold text-slate-800">
                  {currentPrediction.label}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">
                  Threshold
                </span>
                <span className="text-sm font-extrabold text-slate-800">
                  {(currentPrediction.threshold_used * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Patient Quick Summary Snapshot */}
          <GlassCard glowColor="none" className="p-6">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Submitted Clinical Snapshot
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-slate-500">Age: <strong className="text-slate-800">{patientData.Age}</strong></div>
              <div className="text-slate-500">BMI: <strong className="text-slate-800">{patientData.BMI}</strong></div>
              <div className="text-slate-500">Daily Salt: <strong className="text-slate-800">{patientData.Salt_Intake}g</strong></div>
              <div className="text-slate-500">Sleep: <strong className="text-slate-800">{patientData.Sleep_Duration}h</strong></div>
              <div className="text-slate-500">Stress: <strong className="text-slate-800">{patientData.Stress_Score}/10</strong></div>
              <div className="text-slate-500">Smoking: <strong className="text-slate-800">{patientData.Smoking_Status}</strong></div>
              <div className="text-slate-500">BP History: <strong className="text-slate-800">{patientData.BP_History || "Unspecified"}</strong></div>
              <div className="text-slate-500">Medication: <strong className="text-slate-800">{patientData.Medication || "None"}</strong></div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Top Contributing Factors */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard glowColor="teal" className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Top Contributing Risk Factors
                </h3>
                <p className="text-xs text-slate-500">
                  Features driving the model's prediction higher (Red) or lower (Teal) relative to baseline.
                </p>
              </div>
            </div>

            <ContributingFactorsChart factors={currentPrediction.contributing_factors} />
          </GlassCard>
        </div>
      </div>

      {/* What-If Counterfactual Simulator */}
      <section className="pt-6">
        <GlassCard glowColor="amber" className="p-8 sm:p-10 border-amber-200/60 shadow-xl">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-xs mb-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Counterfactual Risk Simulator {simulating ? "(Calculating...)" : ""}</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Simulate Targeted Lifestyle Interventions
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Adjust lifestyle parameters in real time. The neural ensemble recalculates probability
                instantly to illustrate the power of preventative behavioral modifications.
              </p>
            </div>

            {whatIfResult && (
              <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-xs text-right">
                <span className="block text-[11px] font-bold text-slate-500 uppercase">
                  Simulated Impact
                </span>
                <span
                  className={`text-base font-extrabold ${
                    whatIfResult.probability_delta < 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {whatIfResult.probability_delta < 0 ? "" : "+"}
                  {(whatIfResult.probability_delta * 100).toFixed(1)}% (
                  {whatIfResult.percentage_change.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>

          {/* Interactive Simulation Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* 1. Salt Intake */}
            <div className="p-4 rounded-xl bg-white/80 border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Reduce Salt Intake</span>
                <span className="font-mono text-teal-600">{simOverrides.Salt_Intake} g</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={simOverrides.Salt_Intake}
                onChange={(e) => handleSliderChange("Salt_Intake", Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <span className="block text-[10px] text-slate-400">Baseline: {patientData.Salt_Intake}g</span>
            </div>

            {/* 2. Sleep Duration */}
            <div className="p-4 rounded-xl bg-white/80 border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Extend Sleep Duration</span>
                <span className="font-mono text-blue-600">{simOverrides.Sleep_Duration} hrs</span>
              </div>
              <input
                type="range"
                min={4}
                max={10}
                step={0.5}
                value={simOverrides.Sleep_Duration}
                onChange={(e) => handleSliderChange("Sleep_Duration", Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="block text-[10px] text-slate-400">Baseline: {patientData.Sleep_Duration}h</span>
            </div>

            {/* 3. Stress Score */}
            <div className="p-4 rounded-xl bg-white/80 border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Mitigate Stress Score</span>
                <span className="font-mono text-amber-600">{simOverrides.Stress_Score} / 10</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={simOverrides.Stress_Score}
                onChange={(e) => handleSliderChange("Stress_Score", Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="block text-[10px] text-slate-400">Baseline: {patientData.Stress_Score}/10</span>
            </div>

            {/* 4. Smoking Toggle */}
            <div className="p-4 rounded-xl bg-white/80 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Smoking Status</span>
              <div className="grid grid-cols-2 gap-2">
                {(["Non-Smoker", "Smoker"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSliderChange("Smoking_Status", s)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                      simOverrides.Smoking_Status === s
                        ? "bg-teal-50 border-teal-600 text-teal-800"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Exercise Level */}
            <div className="p-4 rounded-xl bg-white/80 border border-slate-200 space-y-2 md:col-span-2">
              <span className="text-xs font-bold text-slate-700 block">Physical Activity</span>
              <div className="grid grid-cols-3 gap-2">
                {(["Low", "Moderate", "High"] as const).map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => handleSliderChange("Exercise_Level", ex)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                      simOverrides.Exercise_Level === ex
                        ? "bg-teal-50 border-teal-600 text-teal-800"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {whatIfResult?.summary && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{whatIfResult.summary}</span>
            </div>
          )}
        </GlassCard>
      </section>

      {/* Personalized Clinical Recommendations */}
      <section className="space-y-6 pt-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">
            Personalized Clinical & Lifestyle Recommendations
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Evidence-based non-pharmacological interventions aligned with AHA & ACC cardiovascular prevention protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPrediction.recommendations.map((rec, i) => (
            <GlassCard key={i} glowColor="teal" className="p-6">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
                  {rec.category}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Impact: <strong className="text-slate-800">{rec.impact_potential}</strong>
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">{rec.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
};
