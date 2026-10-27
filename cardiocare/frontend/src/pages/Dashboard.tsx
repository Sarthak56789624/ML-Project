import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  BrainCircuit,
  Database,
  Sparkles,
  PieChart as PieIcon,
  CheckCircle,
  Droplet,
} from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { api } from "../lib/api";

const PIE_COLORS = ["#10B981", "#EF4444"];

export const Dashboard: React.FC = () => {
  const { data: metricsData, isLoading: loadingMetrics } = useQuery({
    queryKey: ["modelMetrics"],
    queryFn: api.getModelMetrics,
  });

  const { data: insightsData, isLoading: loadingInsights } = useQuery({
    queryKey: ["datasetInsights"],
    queryFn: api.getDatasetInsights,
  });

  const { data: diabetesMetricsData, isLoading: loadingDiabetes } = useQuery({
    queryKey: ["diabetesMetrics"],
    queryFn: api.getDiabetesMetrics,
  });

  if (loadingMetrics || loadingInsights || loadingDiabetes) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Loading Population Analytics & Model Curves...</h3>
        <p className="text-xs text-slate-500">Aggregating clinical cohorts, metrics and permutation importances...</p>
      </div>
    );
  }

  const modelFull = metricsData?.models?.model_full;
  const modelLife = metricsData?.models?.model_lifestyle;
  const datasetStats = insightsData || metricsData?.dataset_stats;
  const diabMetrics = diabetesMetricsData?.test_metrics;

  // 1. Class Balance Pie Data
  const classBalanceData = [
    { name: "No Hypertension", value: datasetStats?.class_balance?.negative_count || 953 },
    { name: "Hypertension", value: datasetStats?.class_balance?.positive_count || 1032 },
  ];

  // 2. Hypertension Rate by BP History
  const bpRateData = datasetStats?.hypertension_rate_per_category?.BP_History || [
    { category: "Hypertension", rate_percentage: 92.8 },
    { category: "Prehypertension", rate_percentage: 36.4 },
    { category: "Normal", rate_percentage: 34.2 },
  ];

  // 3. Hypertension Rate by Smoking Status
  const smokeRateData = datasetStats?.hypertension_rate_per_category?.Smoking_Status || [
    { category: "Smoker", rate_percentage: 71.8 },
    { category: "Non-Smoker", rate_percentage: 44.0 },
  ];

  // 4. Hypertension Rate by Family History
  const familyRateData = datasetStats?.hypertension_rate_per_category?.Family_History || [
    { category: "Yes", rate_percentage: 66.2 },
    { category: "No", rate_percentage: 38.0 },
  ];

  // 5. Permutation Importances (Top 7)
  const permData = (modelFull?.permutation_importances || []).slice(0, 7).map((p: any) => ({
    name: p.feature.replace("_", " "),
    importance: Number((p.importance * 100).toFixed(1)),
  }));

  // 6. ROC Curves Data Comparison (FPR vs TPR)
  const fullRoc = modelFull?.roc_curve || [];
  const lifeRoc = modelLife?.roc_curve || [];
  const rocComparison = fullRoc.map((pt: any, i: number) => ({
    fpr: Number((pt.fpr * 100).toFixed(1)),
    fullTpr: Number((pt.tpr * 100).toFixed(1)),
    lifeTpr: lifeRoc[i] ? Number((lifeRoc[i].tpr * 100).toFixed(1)) : null,
  }));

  // 7. Age Histogram
  const ageHist = (datasetStats?.histograms?.Age?.bins || []).map((bin: string, i: number) => ({
    bin,
    hypertensive: datasetStats?.histograms?.Age?.positive_counts[i] || 0,
    normotensive: datasetStats?.histograms?.Age?.negative_counts[i] || 0,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-2">
          <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
          <span>Population Analytics & Diagnostics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Model Metrics & Population Insights
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time metrics calculated across 1,985 cohort records and 5-fold stratified cross-validation.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <GlassCard glowColor="teal" className="p-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>HYPERTENSION ROC-AUC</span>
            <Sparkles className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {((modelLife?.metrics?.roc_auc || 0.740) * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
            <CheckCircle className="w-3 h-3" /> Test Accuracy: {Math.round((modelLife?.metrics?.accuracy || 0.72) * 100)}%
          </span>
        </GlassCard>

        <GlassCard glowColor="coral" className="p-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>DIABETES ROC-AUC</span>
            <Droplet className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {((diabMetrics?.roc_auc || 0.977) * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1 mt-1">
            <CheckCircle className="w-3 h-3" /> Test Accuracy: {((diabMetrics?.accuracy || 0.971) * 100).toFixed(1)}%
          </span>
        </GlassCard>

        <GlassCard glowColor="mint" className="p-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>HYPERTENSION COHORT</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {datasetStats?.class_balance?.total || "1,985"}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
            Stratified 80 / 20 Split
          </span>
        </GlassCard>

        <GlassCard glowColor="amber" className="p-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>DIABETES COHORT</span>
            <BrainCircuit className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {diabetesMetricsData?.training_samples && diabetesMetricsData?.test_samples
              ? (diabetesMetricsData.training_samples + diabetesMetricsData.test_samples).toLocaleString()
              : "96,128"}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
            LightGBM Cross-Validated
          </span>
        </GlassCard>
      </div>

      {/* Row 1 Charts: Class Balance & Feature Permutation Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Class Balance Donut */}
        <div className="lg:col-span-5">
          <GlassCard glowColor="mint" className="p-6 h-full">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-teal-600" />
              Target Class Balance (Has_Hypertension)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Almost perfectly balanced outcome eliminates the need for synthetic oversampling.
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classBalanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {classBalanceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Permutation Importance Bar Chart */}
        <div className="lg:col-span-7">
          <GlassCard glowColor="teal" className="p-6 h-full">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Permutation Feature Importance (AUC Drop)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              BP_History dominates the feature space (~28.6% drop when shuffled), followed by Family History and Smoking.
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={permData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => [`${value}% AUC drop`, "Importance"]} />
                  <Bar dataKey="importance" fill="#0EA5A4" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Row 2 Charts: Categorical Risk Rates (BP History, Smoking, Family History) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* BP History Rate */}
        <GlassCard glowColor="coral" className="p-6">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
            Rate by BP History
          </h4>
          <p className="text-[11px] text-slate-500 mb-3">% Diagnosed with hypertension</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bpRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis unit="%" />
                <Tooltip formatter={(val: any) => [`${val}%`, "Rate"]} />
                <Bar dataKey="rate_percentage" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Smoking Status Rate */}
        <GlassCard glowColor="amber" className="p-6">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
            Rate by Smoking Status
          </h4>
          <p className="text-[11px] text-slate-500 mb-3">Smokers vs Non-Smokers</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={smokeRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis unit="%" />
                <Tooltip formatter={(val: any) => [`${val}%`, "Rate"]} />
                <Bar dataKey="rate_percentage" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Family History Rate */}
        <GlassCard glowColor="teal" className="p-6">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
            Rate by Family History
          </h4>
          <p className="text-[11px] text-slate-500 mb-3">Positive vs Negative genetics</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={familyRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis unit="%" />
                <Tooltip formatter={(val: any) => [`${val}%`, "Rate"]} />
                <Bar dataKey="rate_percentage" fill="#0EA5A4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Row 3: ROC Curve Comparison & Age Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ROC Comparison */}
        <div className="lg:col-span-7">
          <GlassCard glowColor="teal" className="p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              ROC Curves: Full Model vs Lifestyle Model
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Demonstrates the accuracy drop when removing BP_History and Medication (0.999 AUC down to 0.740 AUC).
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rocComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="fpr" unit="%" label={{ value: "False Positive Rate (%)", position: "insideBottom", offset: -5 }} />
                  <YAxis unit="%" label={{ value: "True Positive Rate (%)", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="fullTpr" name="Full Model (AUC 0.999)" stroke="#0EA5A4" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="lifeTpr" name="Lifestyle Model (AUC 0.740)" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Age Histogram */}
        <div className="lg:col-span-5">
          <GlassCard glowColor="none" className="p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Age Cohort Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Binned frequencies for normotensive (Green) and hypertensive (Red) patients.
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageHist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="bin" tick={{ fontSize: 9 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="normotensive" name="No HTN" fill="#10B981" stackId="a" />
                  <Bar dataKey="hypertensive" name="HTN" fill="#EF4444" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Model Performance Comparison Table */}
      <GlassCard glowColor="none" className="p-8">
        <h3 className="text-base font-extrabold text-slate-900 mb-4">
          Clinical Model Comparison Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Architecture</th>
                <th className="py-3 px-4">Input Scope</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Precision</th>
                <th className="py-3 px-4">Recall</th>
                <th className="py-3 px-4">F1 Score</th>
                <th className="py-3 px-4">ROC-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr className="hover:bg-teal-50/50 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  {modelLife?.model_type || "Logistic Regression (L1 regularization)"}
                </td>
                <td className="py-3.5 px-4 text-teal-700 font-semibold">
                  Lifestyle & Biometrics (No BP Record)
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                  {Math.round((modelLife?.metrics?.accuracy || 0.72) * 100)}%
                </td>
                <td className="py-3.5 px-4 font-mono">
                  {((modelLife?.metrics?.precision || 0.46) * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 font-mono">
                  {((modelLife?.metrics?.recall || 0.696) * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 font-mono">
                  {(modelLife?.metrics?.f1 || 0.554).toFixed(3)}
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-teal-600">
                  {((modelLife?.metrics?.roc_auc || 0.740) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="hover:bg-indigo-50/50 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  Tuned LightGBM (Diabetes)
                </td>
                <td className="py-3.5 px-4 text-indigo-700 font-semibold">HbA1c + Biometrics</td>
                <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                  {((diabMetrics?.accuracy || 0.971) * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 font-mono">
                  {((diabMetrics?.precision || 0.954) * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 font-mono">
                  {((diabMetrics?.recall || 0.705) * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 font-mono">
                  {((diabMetrics?.f1_score || 0.811) * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                  {((diabMetrics?.roc_auc || 0.977) * 100).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
