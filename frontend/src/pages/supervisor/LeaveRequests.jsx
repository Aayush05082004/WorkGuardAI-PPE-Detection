import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Users, CalendarCheck, ClipboardList, ShieldCheck, RefreshCw, FileText, Check, X } from "lucide-react";

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
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  approved: "text-green-400 bg-green-500/10 border-green-500/30",
  rejected: "text-red-400 bg-red-500/10 border-red-500/30",
};

// Normalize status to lowercase for consistent comparisons
const norm = (s) => (s || "").toLowerCase();

export default function SVLeaveRequests() {
  const { user } = useAuth();
  const [siteId, setSiteId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ workers: 0, present: 0, tasks: 0, inspections: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (user) loadSite();
  }, [user]);

  const loadSite = async () => {
    const { data } = await supabase
      .from("supervisors")
      .select("site_id")
      .eq("profile_id", user.id)
      .eq("is_deleted", false)
      .single();
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

    const [wRes, taskRes, inspRes, presentRes, leaveRes] = await Promise.all([
      supabase.from("workers").select("id", { count: "exact" }).eq("site_id", sid).eq("is_deleted", false),
      supabase.from("tasks").select("id", { count: "exact" }).eq("site_id", sid).eq("is_completed", false).eq("is_deleted", false),
      supabase.from("site_inspections").select("id", { count: "exact" }).eq("site_id", sid).eq("is_deleted", false),
      supabase.from("attendance").select("id", { count: "exact" }).eq("site_id", sid).eq("attendance_date", today),
      supabase
        .from("leave_requests")
        .select("*, workers(worker_code, profiles!workers_profile_id_fkey(full_name))")
        .eq("site_id", sid)
        .order("created_at", { ascending: false }),
    ]);

    setRequests(leaveRes.data || []);
    setStats({
      workers: wRes.count || 0,
      present: presentRes.count || 0,
      tasks: taskRes.count || 0,
      inspections: inspRes.count || 0,
    });
    setLoading(false);
  };

  const handleAction = async (id, status) => {
    setUpdating(id);
    await supabase
      .from("leave_requests")
      .update({ status, reviewed_by: user.id })
      .eq("id", id);
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, reviewed_by: user.id } : r))
    );
    setUpdating(null);
  };

  const pending = requests.filter((r) => norm(r.status) === "pending").length;

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

      {/* Leave requests */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">LEAVE REQUESTS</div>
            <div className="text-white font-bold text-base">
              {requests.length} total · {pending} pending
            </div>
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
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={36} className="text-[#21262d] mx-auto mb-3" />
            <div className="text-[#484f58] text-sm">No leave requests</div>
            <div className="text-[#484f58] text-xs mt-1">Workers haven't submitted any requests yet.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-[#0d1117] border border-[#21262d] rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-sm">
                        {req.workers?.profiles?.full_name || "Unknown Worker"}
                      </span>
                      <span className="text-[#484f58] text-xs">{req.workers?.worker_code}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#8b949e] mb-2">
                      <span>{req.leave_date}</span>
                      {req.leave_type && (
                        <span className="text-blue-400/70">{req.leave_type}</span>
                      )}
                    </div>
                    {req.reason && (
                      <p className="text-[#484f58] text-xs leading-relaxed">{req.reason}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold tracking-widest border rounded px-2 py-0.5 ${
                        STATUS_COLORS[norm(req.status)] || "text-[#8b949e] bg-[#21262d] border-[#30363d]"
                      }`}
                    >
                      {req.status?.toUpperCase()}
                    </span>
                    {norm(req.status) === "pending" && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleAction(req.id, "Approved")}
                          disabled={updating === req.id}
                          className="flex items-center gap-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Check size={11} /> APPROVE
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "Rejected")}
                          disabled={updating === req.id}
                          className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <X size={11} /> REJECT
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
