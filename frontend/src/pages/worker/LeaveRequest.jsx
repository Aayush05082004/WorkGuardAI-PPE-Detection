import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { FileText } from "lucide-react";

const STATUS_COLORS = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  approved: "text-green-400 bg-green-500/10 border-green-500/30",
  rejected: "text-red-400 bg-red-500/10 border-red-500/30",
};

const LEAVE_TYPES = ["Sick Leave", "Personal Leave", "Emergency Leave", "Vacation", "Other"];

export default function WKLeaveRequest() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [workerRecord, setWorkerRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [leaveDate, setLeaveDate] = useState("");
  const [leaveType, setLeaveType] = useState("Sick Leave");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [workerRes, requestsRes] = await Promise.all([
      supabase
        .from("workers")
        .select("id, site_id")
        .eq("profile_id", user.id)
        .eq("is_deleted", false)
        .single(),
      // Temporary fetch — will re-query with correct worker_id below
      Promise.resolve({ data: [] }),
    ]);

    const wr = workerRes.data || null;
    setWorkerRecord(wr);

    if (wr?.id) {
      const { data: reqs } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("worker_id", wr.id)
        .order("created_at", { ascending: false });
      setRequests(reqs || []);
    }

    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workerRecord) {
      setError("You are not registered as a worker yet.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const { error: err } = await supabase.from("leave_requests").insert({
      worker_id: workerRecord.id,
      site_id: workerRecord.site_id,
      leave_date: leaveDate,
      leave_type: leaveType,
      reason: reason.trim(),
      status: "Pending",
    });

    if (err) {
      setError(err.message);
    } else {
      setSuccess("Leave request submitted successfully!");
      setLeaveDate("");
      setReason("");
      loadData();
    }
    setSubmitting(false);
  };

  const inputClass =
    "w-full bg-[#0d1117] border border-[#30363d] focus:border-green-500 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder-[#484f58]";
  const labelClass = "block text-xs font-bold tracking-widest text-[#484f58] mb-1.5 uppercase";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Apply form */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
        <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">APPLY FOR LEAVE</div>
        <div className="text-white font-bold text-base mb-5">New request</div>

        {!workerRecord && !loading && (
          <div className="mb-4 bg-yellow-950/30 border border-yellow-500/30 rounded-lg px-4 py-3">
            <p className="text-yellow-300 text-xs">
              You are not registered as a worker yet. Contact your supervisor.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Leave Date</label>
            <input
              type="date"
              className={inputClass}
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Leave Type</label>
            <select
              className={inputClass}
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Reason</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe your reason..."
              required
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
            disabled={submitting || loading || !workerRecord}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wider"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/70"></span>
            {submitting ? "SUBMITTING..." : "SUBMIT REQUEST"}
          </button>
        </form>
      </div>

      {/* Requests list */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
        <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">MY REQUESTS</div>
        <div className="text-white font-bold text-base mb-4">{requests.length} total</div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={36} className="text-[#21262d] mx-auto mb-3" />
            <div className="text-[#484f58] text-sm">No requests yet.</div>
            <div className="text-[#484f58] text-xs mt-1">Submit your first leave request.</div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {requests.map((req) => (
              <div key={req.id} className="bg-[#0d1117] border border-[#21262d] rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-white font-semibold text-sm">{req.leave_date}</div>
                    <div className="text-[#8b949e] text-xs mt-0.5">{req.leave_type}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold tracking-widest border rounded px-2 py-0.5 flex-shrink-0 ${
                      STATUS_COLORS[(req.status || "").toLowerCase()] || "text-[#8b949e] bg-[#21262d] border-[#30363d]"
                    }`}
                  >
                    {req.status?.toUpperCase()}
                  </span>
                </div>
                {req.reason && (
                  <p className="text-[#484f58] text-xs leading-relaxed">{req.reason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
