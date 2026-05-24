import { useState, useEffect } from "react";
import { supabase, apiFetch } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Plus, CheckCircle, Clock } from "lucide-react";

export default function SMTasks() {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [selectedSite, setSelectedSite] = useState("");
  const [selectedWorker, setSelectedWorker] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => { if (user) loadData(); }, [user]);

  useEffect(() => {
    if (selectedSite) { loadWorkers(selectedSite); loadSupervisors(selectedSite); }
    else { setWorkers([]); setSupervisors([]); }
  }, [selectedSite]);

  const loadData = async () => {
    setLoading(true);
    const { data: sitesData } = await supabase
      .from("sites").select("id, site_name")
      .eq("manager_id", user.id).eq("is_deleted", false);
    const siteList = sitesData || [];
    setSites(siteList);
    if (siteList.length > 0) {
      const { data: tasksData } = await supabase
        .from("tasks").select("*, sites(site_name)")
        .in("site_id", siteList.map(s => s.id))
        .eq("is_deleted", false).order("created_at", { ascending: false });
      setTasks(tasksData || []);
    }
    setLoading(false);
  };

  const loadWorkers = async (siteId) => {
    const data = await apiFetch(`workers?select=id,profile_id,worker_code&site_id=eq.${siteId}&is_deleted=eq.false`);
    const list = Array.isArray(data) ? data : [];
    if (list.length > 0) {
      const ids = list.map(w => w.profile_id).filter(Boolean);
      const pData = await apiFetch(`profiles?select=id,full_name&id=in.(${ids.join(",")})`);
      const pMap = {};
      (Array.isArray(pData) ? pData : []).forEach(p => { pMap[p.id] = p; });
      setWorkers(list.map(w => ({ ...w, profiles: pMap[w.profile_id] || null })));
    } else setWorkers([]);
  };

  const loadSupervisors = async (siteId) => {
    const data = await apiFetch(`supervisors?select=id,profile_id&site_id=eq.${siteId}&is_deleted=eq.false`);
    const list = Array.isArray(data) ? data : [];
    if (list.length > 0) {
      const ids = list.map(s => s.profile_id).filter(Boolean);
      const pData = await apiFetch(`profiles?select=id,full_name&id=in.(${ids.join(",")})`);
      const pMap = {};
      (Array.isArray(pData) ? pData : []).forEach(p => { pMap[p.id] = p; });
      setSupervisors(list.map(s => ({ ...s, profiles: pMap[s.profile_id] || null })));
    } else setSupervisors([]);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!selectedSite || !title.trim()) return;
    setSubmitting(true);
    setError(null);
    const workerRecord = workers.find(w => w.id === selectedWorker);
    const supervisorRecord = supervisors.find(s => s.id === selectedSupervisor);
    const { error: err } = await supabase.from("tasks").insert({
      site_id:             selectedSite,
      assigned_worker:     workerRecord?.id || null,
      assigned_supervisor: supervisorRecord?.id || null,
      title:               title.trim(),
      description:         description.trim(),
      due_date:            dueDate || null,
      is_completed:        false,
      is_deleted:          false,
      created_by:          user.id,
    });
    if (err) setError(err.message);
    else { setTitle(""); setDescription(""); setDueDate(""); setSelectedWorker(""); setSelectedSupervisor(""); loadData(); }
    setSubmitting(false);
  };

  const inputClass = "w-full bg-[#0d1117] border border-[#30363d] focus:border-orange-500 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder-[#484f58]";
  const labelClass = "block text-xs font-bold tracking-widest text-[#484f58] mb-1.5 uppercase";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
        <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">CREATE WORK</div>
        <div className="text-white font-bold text-base mb-5">Add task</div>
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className={labelClass}>Site</label>
            <select className={inputClass} value={selectedSite} onChange={e => setSelectedSite(e.target.value)} required>
              <option value="">Select a site...</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Assign to Supervisor (optional)</label>
            <select className={inputClass} value={selectedSupervisor} onChange={e => setSelectedSupervisor(e.target.value)} disabled={!selectedSite}>
              <option value="">— Select supervisor —</option>
              {supervisors.map(s => <option key={s.id} value={s.id}>{s.profiles?.full_name || "Supervisor"}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Assign to Worker (optional)</label>
            <select className={inputClass} value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)} disabled={!selectedSite}>
              <option value="">— Select worker —</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.profiles?.full_name || "Unknown"} ({w.worker_code})</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Task Title</label>
            <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Install scaffolding on floor 3" required />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Task details..." />
          </div>
          <div>
            <label className={labelClass}>Due Date</label>
            <input type="date" className={inputClass} value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          {error && <div className="bg-red-950 border border-red-700 rounded-lg px-3 py-2"><p className="text-red-300 text-xs">{error}</p></div>}
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wider">
            <Plus size={14} />{submitting ? "ADDING..." : "+ ADD TASK"}
          </button>
        </form>
      </div>

      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
        <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">ALL TASKS</div>
        <div className="text-white font-bold text-base mb-5">{tasks.length} total</div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 text-[#484f58] text-sm">No tasks yet.</div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {tasks.map(task => (
              <div key={task.id} className="bg-[#0d1117] border border-[#21262d] rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-semibold text-sm text-white">{task.title}</div>
                  {task.is_completed ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-green-400 bg-green-500/10 border border-green-500/30 rounded px-2 py-0.5 flex-shrink-0">
                      <CheckCircle size={10} /> DONE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded px-2 py-0.5 flex-shrink-0">
                      <Clock size={10} /> OPEN
                    </span>
                  )}
                </div>
                {task.description && <p className="text-[#8b949e] text-xs mb-2 leading-relaxed">{task.description}</p>}
                <div className="flex items-center gap-3 text-xs text-[#484f58]">
                  {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                  {task.sites?.site_name && <span className="text-orange-400/70">{task.sites.site_name}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
