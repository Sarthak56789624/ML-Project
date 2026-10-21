/**
 * CardioCare Typed API Client.
 * Connects to the FastAPI backend with error handling and environment fallback.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export interface PatientInput {
  Age: number;
  BMI: number;
  Salt_Intake: number;
  Stress_Score: number;
  Sleep_Duration: number;
  Family_History: "Yes" | "No";
  Exercise_Level: "Low" | "Moderate" | "High";
  Smoking_Status: "Smoker" | "Non-Smoker";
  BP_History?: "Normal" | "Prehypertension" | "Hypertension" | null;
  Medication?: "ACE Inhibitor" | "Beta Blocker" | "Diuretic" | "Other" | "None" | null;
  patient_id?: string;
}

export interface ContributingFactor {
  feature: string;
  display_name: string;
  value: any;
  signed_contribution: number;
  impact: "increases_risk" | "decreases_risk";
  human_readable: string;
}

export interface LifestyleRecommendation {
  category: string;
  title: string;
  description: string;
  impact_potential: "High" | "Moderate" | "Low";
  priority: number;
}

export interface PredictionResponse {
  probability: number;
  risk_level: "Low" | "Moderate" | "High";
  label: "Hypertension" | "No Hypertension";
  threshold_used: number;
  model_used: "model_full" | "model_lifestyle";
  model_version: string;
  routing_explanation: string;
  contributing_factors: ContributingFactor[];
  recommendations: LifestyleRecommendation[];
  timestamp: string;
  prediction_id?: string;
}

export interface WhatIfResponse {
  baseline_probability: number;
  baseline_risk_level: "Low" | "Moderate" | "High";
  changed_probability: number;
  changed_risk_level: "Low" | "Moderate" | "High";
  probability_delta: number;
  percentage_change: number;
  summary: string;
  top_impact_changes: string[];
  baseline_factors: ContributingFactor[];
  changed_factors: ContributingFactor[];
}

export interface DiabetesInput {
  gender: "Female" | "Male";
  age: number;
  hypertension: number;
  heart_disease: number;
  smoking_history: "never" | "No Info" | "current" | "former" | "ever" | "not current";
  bmi: number;
  HbA1c_level: number;
  blood_glucose_level: number;
  patient_id?: string;
}

export interface DiabetesPredictionResponse {
  probability: number;
  risk_level: "Low" | "Moderate" | "High";
  is_diabetic: boolean;
  label: string;
  threshold_used: number;
  model_used: string;
  contributing_factors: ContributingFactor[];
  recommendations: LifestyleRecommendation[];
  hba1c_category: string;
  glucose_category: string;
  cardiometabolic_risk_score: number;
  timestamp: string;
  patient_id?: string;
}

export interface UnifiedPatientInput {
  patient_id?: string;
  age: number;
  gender: "Female" | "Male";
  bmi: number;
  smoking_habit: "never" | "former" | "current" | "No Info";
  bp_status?: "Normal" | "Prehypertension" | "Hypertension" | "Unknown" | null;
  family_history_htn: "Yes" | "No";
  heart_disease: number;
  salt_intake: number;
  stress_score: number;
  sleep_duration: number;
  exercise_level: "Low" | "Moderate" | "High";
  medication?: "ACE Inhibitor" | "Beta Blocker" | "Diuretic" | "Other" | "None" | null;
  hba1c_level: number;
  blood_glucose_level: number;
}

export interface CardiometabolicPredictionResponse {
  hypertension: PredictionResponse;
  diabetes: DiabetesPredictionResponse;
  combined_risk_score: number;
  combined_risk_level: "Low" | "Moderate" | "High";
  synergy_headline: string;
  synergy_description: string;
  top_combined_factors: ContributingFactor[];
  unified_recommendations: LifestyleRecommendation[];
  timestamp: string;
  patient_id?: string;
}


export interface HistoryItem {
  id: string;
  created_at: string;
  age: number;
  bmi: number;
  salt_intake: number;
  stress_score: number;
  sleep_duration: number;
  family_history: string;
  exercise_level: string;
  smoking_status: string;
  bp_history?: string;
  medication?: string;
  probability: number;
  risk_level: "Low" | "Moderate" | "High";
  label: string;
  model_used: string;
  patient_id?: string;
}

export interface HistoryResponse {
  total: number;
  items: HistoryItem[];
  limit: number;
  offset: number;
}

export interface HealthResponse {
  status: string;
  model_full_loaded: boolean;
  model_lifestyle_loaded: boolean;
  model_full_version: string;
  model_lifestyle_version: string;
  uptime_seconds: number;
  timestamp: string;
}

export interface ModelInfoResponse {
  name: string;
  version: string;
  sklearn_version: string;
  trained_at: string;
  models_available: string[];
  features_full: string[];
  features_lifestyle: string[];
  metrics_summary: {
    model_full: {
      accuracy: number;
      precision: number;
      recall: number;
      f1: number;
      roc_auc: number;
    };
    model_lifestyle: {
      accuracy: number;
      precision: number;
      recall: number;
      f1: number;
      roc_auc: number;
    };
  };
  synthetic_data_note: string;
}

export interface BatchItemResult {
  row_index: number;
  patient_id: string;
  status: "success" | "error";
  probability: number | null;
  risk_level: string | null;
  label: string | null;
  model_used: string | null;
  error: string | null;
}

export interface BatchResponse {
  filename: string;
  total_rows: number;
  successful_predictions: number;
  failed_rows: number;
  results: BatchItemResult[];
  has_more: boolean;
  download_csv: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        errorDetail = Array.isArray(errJson.detail) ? errJson.detail.join("; ") : errJson.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<HealthResponse>(res);
  },

  async predict(patient: PatientInput): Promise<PredictionResponse> {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patient),
    });
    return handleResponse<PredictionResponse>(res);
  },

  async whatIf(patient: PatientInput, overrides: Record<string, any>): Promise<WhatIfResponse> {
    const res = await fetch(`${API_BASE}/what-if`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient, overrides }),
    });
    return handleResponse<WhatIfResponse>(res);
  },

  async getModelInfo(): Promise<ModelInfoResponse> {
    const res = await fetch(`${API_BASE}/model/info`);
    return handleResponse<ModelInfoResponse>(res);
  },

  async getModelMetrics(): Promise<any> {
    const res = await fetch(`${API_BASE}/model/metrics`);
    return handleResponse<any>(res);
  },

  async getDatasetInsights(): Promise<any> {
    const res = await fetch(`${API_BASE}/insights/dataset`);
    return handleResponse<any>(res);
  },

  async getHistory(limit = 50, offset = 0): Promise<HistoryResponse> {
    const res = await fetch(`${API_BASE}/history?limit=${limit}&offset=${offset}`);
    return handleResponse<HistoryResponse>(res);
  },

  async deleteHistory(id: string): Promise<{ success: boolean; message: string; deleted_id: string }> {
    const res = await fetch(`${API_BASE}/history/${id}`, {
      method: "DELETE",
    });
    return handleResponse<{ success: boolean; message: string; deleted_id: string }>(res);
  },

  async predictBatch(file: File): Promise<BatchResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/predict/batch`, {
      method: "POST",
      body: formData,
    });
    return handleResponse<BatchResponse>(res);
  },

  async predictDiabetes(patient: DiabetesInput): Promise<DiabetesPredictionResponse> {
    const res = await fetch(`${API_BASE}/predict/diabetes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patient),
    });
    return handleResponse<DiabetesPredictionResponse>(res);
  },

  async getDiabetesMetrics(): Promise<any> {
    const res = await fetch(`${API_BASE}/diabetes/metrics`);
    return handleResponse<any>(res);
  },

  async predictCardiometabolic(patient: UnifiedPatientInput): Promise<CardiometabolicPredictionResponse> {
    try {
      const res = await fetch(`${API_BASE}/predict/cardiometabolic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patient),
      });
      return await handleResponse<CardiometabolicPredictionResponse>(res);
    } catch {
      // Automatic client fallback
      const htnPayload: PatientInput = {
        Age: patient.age,
        BMI: patient.bmi,
        Salt_Intake: patient.salt_intake,
        Stress_Score: patient.stress_score,
        Sleep_Duration: patient.sleep_duration,
        Family_History: patient.family_history_htn,
        Exercise_Level: patient.exercise_level,
        Smoking_Status: patient.smoking_habit === "current" ? "Smoker" : "Non-Smoker",
        BP_History: patient.bp_status === "Unknown" ? null : (patient.bp_status as any),
        Medication: patient.bp_status === "Unknown" ? "None" : patient.medication,
        patient_id: patient.patient_id,
      };

      const diabPayload: DiabetesInput = {
        gender: patient.gender,
        age: patient.age,
        hypertension: patient.bp_status === "Hypertension" ? 1 : 0,
        heart_disease: patient.heart_disease,
        smoking_history: patient.smoking_habit,
        bmi: patient.bmi,
        HbA1c_level: patient.hba1c_level,
        blood_glucose_level: patient.blood_glucose_level,
        patient_id: patient.patient_id,
      };

      const [htn, diab] = await Promise.all([
        api.predict(htnPayload),
        api.predictDiabetes(diabPayload),
      ]);

      const combined_risk_score = Number((((htn.probability * 0.5) + (diab.probability * 0.5)) * 100).toFixed(1));
      const combined_risk_level = combined_risk_score < 30 ? "Low" : combined_risk_score < 60 ? "Moderate" : "High";

      return {
        hypertension: htn,
        diabetes: diab,
        combined_risk_score,
        combined_risk_level,
        synergy_headline: combined_risk_score >= 60 ? "High-Risk Concurrent Cardiometabolic Comorbidity" : "Cardiometabolic Profile Evaluated",
        synergy_description: "Dual AI evaluation combining systemic vascular resistance and metabolic insulin sensitivity.",
        top_combined_factors: [...htn.contributing_factors, ...diab.contributing_factors].slice(0, 6),
        unified_recommendations: [...htn.recommendations, ...diab.recommendations].slice(0, 5),
        timestamp: new Date().toISOString(),
        patient_id: patient.patient_id,
      };
    }
  },
};
