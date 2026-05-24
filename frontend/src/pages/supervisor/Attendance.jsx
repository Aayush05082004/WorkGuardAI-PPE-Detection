import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Users, CalendarCheck, ClipboardList, ShieldCheck, RefreshCw } from "lucide-react";

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

const STATUS_COLORS = {
  present: "text-green-400 bg-green-500/10 border-green-500/30",
  absent: "text-red-400 bg-red-500/10 border-red-500/30",
  late: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  half_day: "text-orange-400 bg-orange-500/10 border-orange-500/30",
};

export default function SVAttendance() {
  const { user } = useAuth();
  const [siteId, setSiteId] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ workers: 0, present: 0, tasks: 0, inspections: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [selectedWorker, setSelectedWorker] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("present");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (user) loadSite();
  }, [user]);

  const loadSite = async () => {
    const { data, error } = await supabase
      .from("supervisors")
      .select("site_id")
      .eq("profile_id", user.id)
      .eq("is_deleted", false)
      .single();
    console.log("[Attendance] loadSite → data:", data, "error:", error, "user.id:", user.id);
    if (data?.site_id) {
      setSiteId(data.site_id);
      loadAll(data.site_id);
    } else {
      setLoading(false);
    }
  };

  const loadAll = async (sid) => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const [wRes, attRes, taskRes, inspRes, presentRes] = await Promise.all([
      supabase.from("workers").select("id, profile_id, worker_code, profiles!workers_profile_id_fkey(full_name)").eq("site_id", sid).eq("is_deleted", false),
      supabase.from("attendance").select("*, workers(worker_code, profiles!workers_profile_id_fkey(full_name))").eq("site_id", sid).order("attendance_date", { ascending: false }).limit(50),
      supabase.from("tasks").select("id", { count: "exact" }).eq("site_id", sid).eq("is_completed", false).eq("is_deleted", false),
      supabase.from("site_inspections").select("id", { count: "exact" }).eq("site_id", sid).eq("is_deleted", false),
      supabase.from("attendance").select("id", { count: "exact" }).eq("site_id", sid).eq("attendance_date", today),
    ]);

    console.log("[Attendance] loadAll → site_id:", sid, "workers:", wRes.data, "wRes.error:", wRes.error);
    setWorkers(wRes.data || []);
    setRecords(attRes.data || []);
    setStats({
      workers: (wRes.data || []).length,
      present: presentRes.count || 0,
      tasks: taskRes.count || 0,
      inspections: inspRes.count || 0,
    });
    setLoading(false);
  };

  const handleMark = async (e) => {
    e.preventDefault();
    if (!selectedWorker || !siteId) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const worker = workers.find((w) => w.id === selectedWorker);
    const { error: err } = await supabase.from("attendance").insert({
      worker_id: selectedWorker,
      site_id: siteId,
      marked_by: user.id,
      attendance_date: date,
      status,
      notes: notes.trim() || null,
    });

    if (err) {
      setError(err.message);
    } else {
      setSuccess(`Attendance marked for ${worker?.profiles?.full_name || "worker"}`);
      setNotes("");
      loadAll(siteId);
    }
    setSubmitting(false);
  };

  const inputClass =
    "w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder-[#484f58]";
  const labelClass = "block text-xs font-bold tracking-widest text-[#484f58] mb-1.5 uppercase";

  if (!siteId && !loading) {
    return (
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-10 text-center">
        <div className="text-[#484f58] text-sm">You are not assigned to any site yet.</div>
        <div className="text-[#484f58] text-xs mt-1">Ask your site manager to assign you using your Profile ID.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-1.5">
          {stats.workers} workers · {stats.present} present today
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="WORKERS" value={stats.workers} icon={Users} />
        <StatCard label="PRESENT TODAY" value={stats.present} icon={CalendarCheck} />
        <StatCard label="OPEN TASKS" value={stats.tasks} icon={ClipboardList} />
        <StatCard label="INSPECTIONS" value={stats.inspections} icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Mark attendance form */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
          <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">MARK ATTENDANCE</div>
          <div className="text-white font-bold text-base mb-5">Record today</div>

          <form onSubmit={handleMark} className="space-y-4">
            <div>
              <label className={labelClass}>Worker</label>
              <select
                className={inputClass}
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                required
              >
                <option value="">Select worker...</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.profiles?.full_name || "Unknown"} ({w.worker_code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                className={inputClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>

            {error && (
              <div className="bg-red-950 border border-red-700 rounded-lg px-3 py-2">
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-950 border border-green-700 rounded-lg px-3 py-2">
                <p className="text-green-300 text-xs">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wider"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/70"></span>
              {submitting ? "MARKING..." : "MARK ATTENDANCE"}
            </button>
          </form>
        </div>

        {/* Records */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">RECORDS</div>
              <div className="text-white font-bold text-base">Attendance log</div>
            </div>
            <button
              onClick={() => siteId && loadAll(siteId)}
              className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-white bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg px-3 py-1.5 transition-colors"
            >
              <RefreshCw size={12} /> REFRESH
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 text-[#484f58] text-sm">No records yet.</div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {records.map((rec) => (
                <div key={rec.id} className="bg-[#0d1117] border border-[#21262d] rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {rec.workers?.profiles?.full_name || "Unknown"}
                      </div>
                      <div className="text-[#484f58] text-xs mt-0.5">
                        {rec.workers?.worker_code} · {rec.attendance_date}
                      </div>
                      {rec.notes && (
                        <div className="text-[#8b949e] text-xs mt-1">{rec.notes}</div>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold tracking-widest border rounded px-2 py-0.5 flex-shrink-0 ${
                        STATUS_COLORS[rec.status] || "text-[#8b949e] bg-[#21262d] border-[#30363d]"
                      }`}
                    >
                      {rec.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
