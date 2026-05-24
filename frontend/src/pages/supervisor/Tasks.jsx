import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Users, CalendarCheck, ClipboardList, ShieldCheck, Plus, CheckCircle, Clock } from "lucide-react";

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

export default function SVTasks() {
  const { user } = useAuth();
  const [siteId, setSiteId] = useState(null);
  const [supervisorId, setSupervisorId] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ workers: 0, present: 0, tasks: 0, inspections: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [selectedWorker, setSelectedWorker] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

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
      supabase.from("workers").select("id, profile_id, worker_code, profiles!workers_profile_id_fkey(full_name)").eq("site_id", sid).eq("is_deleted", false),
      supabase.from("tasks").select("*, assigned_worker").eq("site_id", sid).eq("is_deleted", false).order("created_at", { ascending: false }),
      supabase.from("site_inspections").select("id", { count: "exact" }).eq("site_id", sid).eq("is_deleted", false),
      supabase.from("attendance").select("id", { count: "exact" }).eq("site_id", sid).eq("attendance_date", today),
    ]);

    setWorkers(wRes.data || []);
    setTasks(taskRes.data || []);
    setStats({
      workers: (wRes.data || []).length,
      present: presentRes.count || 0,
      tasks: (taskRes.data || []).filter((t) => !t.is_completed).length,
      inspections: inspRes.count || 0,
    });
    setLoading(false);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!siteId || !title.trim()) return;
    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase.from("tasks").insert({
      site_id: siteId,
      assigned_worker: selectedWorker || null,
      assigned_supervisor: supervisorId,
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate || null,
      is_completed: false,
      is_deleted: false,
      created_by: user.id,
    });

    if (err) {
      setError(err.message);
    } else {
      setTitle("");
      setDescription("");
      setDueDate("");
      setSelectedWorker("");
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Add task form */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
          <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">ASSIGN WORK</div>
          <div className="text-white font-bold text-base mb-5">New task</div>

          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label className={labelClass}>Assign to Worker</label>
              <select
                className={inputClass}
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
              >
                <option value="">Select worker (optional)...</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.profiles?.full_name || "Unknown"} ({w.worker_code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Task Title</label>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Install safety barriers"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task details..."
              />
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                className={inputClass}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-950 border border-red-700 rounded-lg px-3 py-2">
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wider"
            >
              <Plus size={14} />
              {submitting ? "ADDING..." : "+ ADD TASK"}
            </button>
          </form>
        </div>

        {/* Tasks list */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
          <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">
            {tasks.length} TOTAL
          </div>
          <div className="text-white font-bold text-base mb-5">All tasks</div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10 text-[#484f58] text-sm">No tasks yet.</div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {tasks.map((task) => (
                <div key={task.id} className="bg-[#0d1117] border border-[#21262d] rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-semibold text-sm text-white">{task.title}</div>
                    {task.is_completed ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-green-400 bg-green-500/10 border border-green-500/30 rounded px-2 py-0.5 flex-shrink-0">
                        <CheckCircle size={10} /> DONE
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded px-2 py-0.5 flex-shrink-0">
                        <Clock size={10} /> OPEN
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-[#8b949e] text-xs mb-2 leading-relaxed">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[#484f58]">
                    {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                    {task.assigned_worker && (() => {
                      const w = workers.find((w) => w.id === task.assigned_worker);
                      return w ? <span>→ {w.profiles?.full_name || w.worker_code}</span> : null;
                    })()}
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
