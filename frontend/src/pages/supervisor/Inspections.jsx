import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Users, CalendarCheck, ClipboardList, ShieldCheck, Upload, ShieldAlert } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CLASS_COLORS = {
  Hardhat: "bg-green-500/10 text-green-400 border-green-500/30",
  Mask: "bg-green-500/10 text-green-400 border-green-500/30",
  "Safety Vest": "bg-green-500/10 text-green-400 border-green-500/30",
  "Safety Cone": "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Person: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  machinery: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  vehicle: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  "NO-Hardhat": "bg-red-500/10 text-red-400 border-red-500/30",
  "NO-Mask": "bg-red-500/10 text-red-400 border-red-500/30",
  "NO-Safety Vest": "bg-red-500/10 text-red-400 border-red-500/30",
};

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold tracking-widest text-[#484f58]">{label}</span>
        <Icon size={14} className="text-blue-400" />
      </div>
      <div className="text-3xl font-black text-white">{value ?? "—"}</div>
    </div>
  );
}

export default function SVInspections() {
  const { user } = useAuth();
  const [siteId, setSiteId] = useState(null);
  const [supervisorId, setSupervisorId] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [stats, setStats] = useState({ workers: 0, present: 0, tasks: 0, inspections: 0 });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) loadSite();
  }, [user]);

  const loadSite = async () => {
    const { data } = await supabase
      .from("supervisors")
      .select("id, site_id")
      .eq("profile_id", user.id)
      .eq("is_deleted", false)
      .single();
    if (data?.site_id) {
      setSiteId(data.site_id);
      setSupervisorId(data.id);
      loadAll(data.site_id);
    } else {
      setLoading(false);
    }
  };

  const loadAll = async (sid) => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const [wRes, taskRes, inspRes, presentRes] = await Promise.all([
      supabase.from("workers").select("id", { count: "exact" }).eq("site_id", sid).eq("is_deleted", false),
      supabase.from("tasks").select("id", { count: "exact" }).eq("site_id", sid).eq("is_completed", false).eq("is_deleted", false),
      supabase.from("site_inspections").select("*").eq("site_id", sid).eq("is_deleted", false).order("created_at", { ascending: false }),
      supabase.from("attendance").select("id", { count: "exact" }).eq("site_id", sid).eq("attendance_date", today),
    ]);

    setInspections(inspRes.data || []);
    setStats({
      workers: wRes.count || 0,
      present: presentRes.count || 0,
      tasks: taskRes.count || 0,
      inspections: (inspRes.data || []).length,
    });
    setLoading(false);
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setScanError("Only JPG/PNG images are supported.");
      return;
    }
    setScanError(null);
    setResult(null);
    setPreview(URL.createObjectURL(file));
    runScan(file);
  };

  const runScan = async (file) => {
    setScanning(true);
    setScanError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_URL}/detect`, { method: "POST", body: formData });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Detection failed");
      }
      const data = await response.json();
      setResult(data);

      // Save to DB
      if (siteId) {
        const { error: insertErr } = await supabase.from("site_inspections").insert({
          site_id:        siteId,
          supervisor_id:  supervisorId,
          image_path:     data.original_url || "uploaded",
          ai_result:      data.has_violation ? "violation" : "safe",
          has_violation:  data.has_violation,
          detections:     data.detections || [],
          violations:     data.violations || [],
          total_detected: data.total || 0,
          annotated_url:  data.annotated_image || null,
          original_url:   data.original_url || null,
          status:         "completed",
          review_status:  "pending",
          is_deleted:     false,
        });
        if (insertErr) console.error("Inspection save error:", insertErr.message);
        loadAll(siteId);
      }
    } catch (err) {
      setScanError(err.message || "Detection failed. Is the API running?");
    } finally {
      setScanning(false);
    }
  };

  const resetScan = () => {
    setPreview(null);
    setResult(null);
    setScanError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!siteId && !loading) {
    return (
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-10 text-center">
        <div className="text-[#484f58] text-sm">You are not assigned to any site yet.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="WORKERS" value={stats.workers} icon={Users} />
        <StatCard label="PRESENT TODAY" value={stats.present} icon={CalendarCheck} />
        <StatCard label="OPEN TASKS" value={stats.tasks} icon={ClipboardList} />
        <StatCard label="INSPECTIONS" value={stats.inspections} icon={ShieldCheck} />
      </div>

      {/* PPE Scanner */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
        <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">PPE SCAN</div>
        <div className="text-white font-bold text-base mb-4">Upload image for detection</div>

        {!preview ? (
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-blue-400 bg-blue-500/5"
                : "border-[#30363d] hover:border-[#484f58] bg-[#0d1117]"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <Upload size={28} className="text-[#484f58] mx-auto mb-3" />
            <p className="text-[#8b949e] text-sm">Drag & drop an image here</p>
            <p className="text-[#484f58] text-xs mt-1">or click to browse — JPG, PNG</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {scanning && (
              <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span className="text-blue-300 text-sm">Running PPE detection...</span>
              </div>
            )}

            {scanError && (
              <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-3">
                <p className="text-red-300 text-sm">⚠️ {scanError}</p>
              </div>
            )}

            {result && (
              <>
                {result.has_violation ? (
                  <div className="flex items-center gap-3 bg-red-950/40 border border-red-500/40 rounded-lg px-4 py-3">
                    <ShieldAlert size={18} className="text-red-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-300 text-sm">Safety Violation Detected</p>
                      <p className="text-red-400/70 text-xs mt-0.5">{(result.violations || []).join(", ")}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-green-950/40 border border-green-500/40 rounded-lg px-4 py-3">
                    <ShieldCheck size={18} className="text-green-400 flex-shrink-0" />
                    <p className="font-semibold text-green-300 text-sm">All PPE requirements met</p>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0d1117] border border-[#21262d] rounded-lg overflow-hidden">
                <div className="text-[10px] font-bold tracking-widest text-[#484f58] px-3 py-2 border-b border-[#21262d]">ORIGINAL</div>
                <img src={preview} alt="Original" className="w-full object-contain max-h-48" />
              </div>
              <div className="bg-[#0d1117] border border-[#21262d] rounded-lg overflow-hidden">
                <div className="text-[10px] font-bold tracking-widest text-[#484f58] px-3 py-2 border-b border-[#21262d]">
                  ANNOTATED {result ? `— ${result.total} detected` : ""}
                </div>
                {result?.annotated_image ? (
                  <img src={result.annotated_image} alt="Annotated" className="w-full object-contain max-h-48" />
                ) : (
                  <div className="h-32 flex items-center justify-center text-[#484f58] text-xs">
                    {scanning ? "Processing..." : "No result"}
                  </div>
                )}
              </div>
            </div>

            {result?.detections?.length > 0 && (
              <div>
                <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-2">DETECTIONS</div>
                <div className="flex flex-wrap gap-2">
                  {result.detections.map((d, i) => (
                    <span
                      key={i}
                      className={`text-xs border rounded px-2 py-0.5 ${CLASS_COLORS[d.class] || "bg-[#21262d] text-[#8b949e] border-[#30363d]"}`}
                    >
                      {d.class} — {(d.confidence * 100).toFixed(0)}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={resetScan}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wider"
            >
              SCAN ANOTHER IMAGE
            </button>
          </div>
        )}
      </div>

      {/* Inspection history */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
        <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">HISTORY</div>
        <div className="text-white font-bold text-base mb-4">Past inspections</div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : inspections.length === 0 ? (
          <div className="text-center py-8 text-[#484f58] text-sm">No inspections yet.</div>
        ) : (
          <div className="space-y-2">
            {inspections.map((insp) => (
              <div key={insp.id} className="bg-[#0d1117] border border-[#21262d] rounded-lg px-4 py-3 flex items-center gap-3">
                {insp.annotated_url ? (
                  <img src={insp.annotated_url} alt="" className="w-12 h-12 object-cover rounded border border-[#21262d] flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 bg-[#161b22] border border-[#21262d] rounded flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={16} className="text-[#484f58]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold">
                    {insp.total_detected || 0} objects detected
                  </div>
                  <div className="text-[#484f58] text-xs mt-0.5">
                    {insp.created_at ? new Date(insp.created_at).toLocaleString() : "—"}
                  </div>
                </div>
                {insp.has_violation ? (
                  <span className="text-[10px] font-bold tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-0.5 flex-shrink-0">
                    VIOLATION
                  </span>
                ) : (
                  <span className="text-[10px] font-bold tracking-widest text-green-400 bg-green-500/10 border border-green-500/30 rounded px-2 py-0.5 flex-shrink-0">
                    CLEAR
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
