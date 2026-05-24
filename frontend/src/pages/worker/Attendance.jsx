import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { CheckSquare, CalendarCheck, ClipboardList, FileText } from "lucide-react";

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold tracking-widest text-[#484f58]">{label}</span>
        <Icon size={14} className="text-green-400" />
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

export default function WKAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, daysLogged: 0, leaveRequests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);

    // Get the worker's row ID first
    const { data: workerRow } = await supabase
      .from("workers")
      .select("id")
      .eq("profile_id", user.id)
      .eq("is_deleted", false)
      .maybeSingle();

    const workerId = workerRow?.id;

    const [taskRes, attRes, leaveRes] = await Promise.all([
      workerId
        ? supabase.from("tasks").select("id, is_completed").eq("assigned_worker", workerId).eq("is_deleted", false)
        : Promise.resolve({ data: [] }),
      workerId
        ? supabase.from("attendance").select("*").eq("worker_id", workerId).order("attendance_date", { ascending: false })
        : Promise.resolve({ data: [] }),
      workerId
        ? supabase.from("leave_requests").select("id", { count: "exact" }).eq("worker_id", workerId)
        : Promise.resolve({ count: 0 }),
    ]);

    const taskList = taskRes.data || [];
    const attList = attRes.data || [];
    setRecords(attList);
    setStats({
      total: taskList.length,
      completed: taskList.filter((t) => t.is_completed).length,
      daysLogged: attList.length,
      leaveRequests: leaveRes.count || 0,
    });
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="TOTAL TASKS" value={stats.total} icon={ClipboardList} />
        <StatCard label="COMPLETED" value={stats.completed} icon={CheckSquare} />
        <StatCard label="DAYS LOGGED" value={stats.daysLogged} icon={CalendarCheck} />
        <StatCard label="LEAVE REQUESTS" value={stats.leaveRequests} icon={FileText} />
      </div>

      {/* Attendance records */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
        <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">MY RECORDS</div>
        <div className="text-white font-bold text-base mb-4">Attendance history</div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <CalendarCheck size={36} className="text-[#21262d] mx-auto mb-3" />
            <div className="text-[#484f58] text-sm">No attendance records yet.</div>
            <div className="text-[#484f58] text-xs mt-1">Your supervisor marks your attendance.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((rec) => (
              <div key={rec.id} className="bg-[#0d1117] border border-[#21262d] rounded-lg px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-white font-semibold text-sm">{rec.attendance_date}</div>
                    {rec.notes && (
                      <div className="text-[#8b949e] text-xs mt-0.5">{rec.notes}</div>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold tracking-widest border rounded px-2 py-0.5 flex-shrink-0 ${
                      STATUS_COLORS[(rec.status || "").toLowerCase()] || "text-[#8b949e] bg-[#21262d] border-[#30363d]"
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
  );
}
