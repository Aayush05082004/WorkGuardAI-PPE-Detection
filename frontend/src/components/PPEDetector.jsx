import { useState, useRef } from "react";

const API_URL = "http://localhost:8000";

// Color coding for each class
const CLASS_COLORS = {
  "Hardhat":        "bg-green-100 text-green-800 border-green-300",
  "Mask":           "bg-green-100 text-green-800 border-green-300",
  "Safety Vest":    "bg-green-100 text-green-800 border-green-300",
  "Safety Cone":    "bg-blue-100 text-blue-800 border-blue-300",
  "Person":         "bg-blue-100 text-blue-800 border-blue-300",
  "machinery":      "bg-yellow-100 text-yellow-800 border-yellow-300",
  "vehicle":        "bg-yellow-100 text-yellow-800 border-yellow-300",
  "NO-Hardhat":     "bg-red-100 text-red-800 border-red-300",
  "NO-Mask":        "bg-red-100 text-red-800 border-red-300",
  "NO-Safety Vest": "bg-red-100 text-red-800 border-red-300",
};

export default function PPEDetector() {
  const [preview, setPreview]         = useState(null);   // original image preview
  const [result, setResult]           = useState(null);   // API response
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const fileInputRef                  = useRef(null);

  // ── Handle file selection ──────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setError("Only JPG/PNG images are supported.");
      return;
    }
    setError(null);
    setResult(null);
    setPreview(URL.createObjectURL(file));
    runDetection(file);
  };

  const handleFileInput = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Call the API ───────────────────────────────────────────────────────
  const runDetection = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/detect`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Detection failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Is the API running?");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">WorkGuardAI</h1>
          <p className="text-gray-400 mt-1">PPE Detection — Upload an image to scan for safety violations</p>
        </div>

        {/* Upload Area */}
        {!preview && (
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
              ${dragOver ? "border-blue-400 bg-blue-950" : "border-gray-600 hover:border-gray-400 bg-gray-900"}`}
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="text-5xl mb-4">📷</div>
            <p className="text-lg text-gray-300">Drag & drop an image here</p>
            <p className="text-sm text-gray-500 mt-1">or click to browse — JPG, PNG supported</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-900 border border-red-600 rounded-lg text-red-200">
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-gray-400">Running PPE detection...</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="mt-6 space-y-6">

            {/* Violation Banner */}
            {result.has_violation ? (
              <div className="p-4 bg-red-900 border border-red-500 rounded-xl flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <p className="font-semibold text-red-200">Safety Violation Detected</p>
                  <p className="text-sm text-red-300">{result.violations.join(", ")}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-900 border border-green-500 rounded-xl flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <p className="font-semibold text-green-200">All PPE requirements met — No violations found</p>
              </div>
            )}

            {/* Images: Original + Annotated */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <p className="text-xs text-gray-400 px-4 py-2 border-b border-gray-700">Original Image</p>
                <img src={preview} alt="Original" className="w-full object-contain max-h-80" />
              </div>
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <p className="text-xs text-gray-400 px-4 py-2 border-b border-gray-700">
                  Detected — {result.total} object{result.total !== 1 ? "s" : ""} found
                </p>
                <img src={result.annotated_image} alt="Detection result" className="w-full object-contain max-h-80" />
              </div>
            </div>

            {/* Detection Labels */}
            <div className="bg-gray-900 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Detections</h2>
              {result.detections.length === 0 ? (
                <p className="text-gray-500 text-sm">No objects detected.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.detections.map((d, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${CLASS_COLORS[d.class] || "bg-gray-700 text-gray-200 border-gray-500"}`}
                    >
                      {d.class} — {(d.confidence * 100).toFixed(1)}%
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Scan Another */}
            <button
              onClick={reset}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
            >
              Scan Another Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
