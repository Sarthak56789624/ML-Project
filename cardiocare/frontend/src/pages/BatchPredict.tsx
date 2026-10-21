import { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { api, type BatchResponse } from "../lib/api";

const SAMPLE_CSV = `Age,BMI,Salt_Intake,Stress_Score,Sleep_Duration,Family_History,Exercise_Level,Smoking_Status,BP_History,Medication,patient_id
68,31.5,11.0,8,5.0,Yes,Low,Smoker,Hypertension,Diuretic,PT_101
27,22.0,6.0,2,8.0,No,High,Non-Smoker,Normal,None,PT_102
54,27.8,9.5,7,6.0,Yes,Moderate,Non-Smoker,Prehypertension,None,PT_103
42,24.1,5.0,4,7.5,No,Moderate,Non-Smoker,,,PT_104
61,34.2,14.0,9,4.5,Yes,Low,Smoker,Hypertension,ACE Inhibitor,PT_105`;

export const BatchPredict: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchData, setBatchData] = useState<BatchResponse | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith(".csv")) {
        setFile(dropped);
        setError(null);
      } else {
        setError("Only .csv files are supported.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const downloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "cardiocare_batch_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadAndPredict = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictBatch(file);
      setBatchData(res);
    } catch (err: any) {
      setError(err.message || "Failed to process batch screening file.");
    } finally {
      setLoading(false);
    }
  };

  const downloadResultsCsv = () => {
    if (!batchData?.download_csv) return;
    const blob = new Blob([batchData.download_csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `predictions_${batchData.filename}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = (batchData?.results || []).filter((item) => {
    const matchesRisk = filterRisk === "ALL" || item.risk_level === filterRisk;
    const matchesSearch =
      !searchTerm || item.patient_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-2">
            <UploadCloud className="w-3.5 h-3.5 text-teal-600" />
            <span>High-Throughput Clinical Screening</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Batch CSV Hypertension Prediction
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Screen large patient populations up to 5,000 records. Automatically handles missing BP records by lifestyle routing.
          </p>
        </div>

        <button
          onClick={downloadSampleTemplate}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-2 shadow-xs transition-colors"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Download Sample Template</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Upload Error</div>
            <div className="text-xs mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Drag and Drop Upload Card */}
      <GlassCard glowColor="teal" className="p-8">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/30 rounded-2xl p-10 text-center cursor-pointer transition-all space-y-4"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-full bg-teal-100/70 text-teal-600 flex items-center justify-center mx-auto">
            <UploadCloud className="w-7 h-7 animate-bounce [animation-duration:3s]" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800">
              {file ? file.name : "Drag and drop your patient CSV file here"}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Supports standard UTF-8 encoded .csv files up to 5 MB (max 5,000 records).
            </p>
          </div>
          {file && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <FileText className="w-3.5 h-3.5" />
              <span>{(file.size / 1024).toFixed(1)} KB selected</span>
            </div>
          )}
        </div>

        {file && (
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setFile(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleUploadAndPredict}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Cohort Records...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Execute Batch Prediction</span>
                </>
              )}
            </button>
          </div>
        )}
      </GlassCard>

      {/* Batch Results Section */}
      {batchData && (
        <div className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Batch Screening Results ({batchData.successful_predictions} Analyzed)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Failed rows: {batchData.failed_rows} | Total: {batchData.total_rows}
              </p>
            </div>

            <button
              onClick={downloadResultsCsv}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 flex items-center gap-2 shadow-md shadow-teal-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Download Enriched CSV</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Filter Risk:</span>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
              >
                <option value="ALL">All Tiers</option>
                <option value="Low">Low Risk</option>
                <option value="Moderate">Moderate Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-teal-500"
              />
            </div>
          </div>

          {/* Table */}
          <GlassCard glowColor="none" className="p-6">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Row</th>
                    <th className="py-2.5 px-3">Patient ID</th>
                    <th className="py-2.5 px-3">Probability</th>
                    <th className="py-2.5 px-3">Risk Level</th>
                    <th className="py-2.5 px-3">Label</th>
                    <th className="py-2.5 px-3">Model Used</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredResults.map((item) => (
                    <tr key={item.row_index} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{item.row_index}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{item.patient_id}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {item.probability !== null ? `${(item.probability * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        {item.risk_level ? (
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.risk_level === "High"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : item.risk_level === "Moderate"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {item.risk_level}
                          </span>
                        ) : (
                          <span className="text-rose-500 text-xs">Error</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{item.label || "—"}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{item.model_used || "—"}</td>
                      <td className="py-2.5 px-3">
                        {item.status === "success" ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="text-rose-600 text-[11px] font-semibold">{item.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
