import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { CheckSquare, CalendarCheck, ClipboardList, FileText, CheckCircle, Clock } from "lucide-react";

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

export default function WKMyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, daysLogged: 0, leaveRequests: 0 });
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);

    // Get the worker's row ID (tasks.assigned_worker is FK to workers.id, not profile id)
    const { data: workerRow } = await supabase
      .from("workers")
      .select("id")
      .eq("profile_id", user.id)
      .eq("is_deleted", false)
      .maybeSingle();

    const workerId = workerRow?.id;

    const [taskRes, attRes, leaveRes] = await Promise.all([
      workerId
        ? supabase
            .from("tasks")
            .select("*")
            .eq("assigned_worker", workerId)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase
        .from("attendance")
        .select("id", { count: "exact" })
        .eq("worker_id", workerId || user.id),
      supabase
        .from("leave_requests")
        .select("id", { count: "exact" })
        .eq("worker_id", workerId || user.id),
    ]);

    const taskList = taskRes.data || [];
    setTasks(taskList);
    setStats({
      total: taskList.length,
      completed: taskList.filter((t) => t.is_completed).length,
      daysLogged: attRes.count || 0,
      leaveRequests: leaveRes.count || 0,
    });
    setLoading(false);
  };

  const markDone = async (taskId) => {
    setMarking(taskId);
    await supabase.from("tasks").update({ is_completed: true }).eq("id", taskId);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, is_completed: true } : t))
    );
    setStats((prev) => ({ ...prev, completed: prev.completed + 1 }));
    setMarking(null);
  };

  const open = tasks.filter((t) => !t.is_completed).length;
  const done = tasks.filter((t) => t.is_completed).length;

  return (
    <div className="space-y-5">
      {/* Header badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1.5">
          {open} open · {done} done
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="TOTAL TASKS" value={stats.total} icon={ClipboardList} />
        <StatCard label="COMPLETED" value={stats.completed} icon={CheckSquare} />
        <StatCard label="DAYS LOGGED" value={stats.daysLogged} icon={CalendarCheck} />
        <StatCard label="LEAVE REQUESTS" value={stats.leaveRequests} icon={FileText} />
      </div>

      {/* Tasks list */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
        <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">MY TASKS</div>
        <div className="text-white font-bold text-base mb-4">{tasks.length} total</div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList size={36} className="text-[#21262d] mx-auto mb-3" />
            <div className="text-[#484f58] text-sm">No tasks assigned yet.</div>
            <div className="text-[#484f58] text-xs mt-1">Your supervisor will assign tasks to you.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-[#0d1117] border rounded-lg p-4 ${
                  task.is_completed ? "border-[#21262d] opacity-70" : "border-[#21262d]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm mb-1 ${task.is_completed ? "text-[#8b949e] line-through" : "text-white"}`}>
                      {task.title}
                    </div>
                    {task.description && (
                      <p className="text-[#8b949e] text-xs leading-relaxed mb-2">{task.description}</p>
                    )}
                    {task.due_date && (
                      <div className="text-[#484f58] text-xs">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {task.is_completed ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-green-400 bg-green-500/10 border border-green-500/30 rounded px-2 py-0.5">
                        <CheckCircle size={10} /> DONE
                      </span>
                    ) : (
                      <>
                        <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-0.5">
                          <Clock size={10} /> OPEN
                        </span>
                        <button
                          onClick={() => markDone(task.id)}
                          disabled={marking === task.id}
                          className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={11} />
                          {marking === task.id ? "..." : "MARK DONE"}
                        </button>
                      </>
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
