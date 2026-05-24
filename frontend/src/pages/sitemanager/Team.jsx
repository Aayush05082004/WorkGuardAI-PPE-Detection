import { useState, useEffect } from "react";
import { supabase, apiFetch } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Plus, HardHat } from "lucide-react";

export default function SMTeam() {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => { if (user) loadSites(); }, [user]);
  useEffect(() => { if (selectedSite) loadTeam(selectedSite.id); }, [selectedSite]);

  const loadSites = async () => {
    const data = await apiFetch(`sites?select=id,site_name&manager_id=eq.${user.id}&is_deleted=eq.false`);
    const list = Array.isArray(data) ? data : [];
    setSites(list);
    if (list.length > 0) setSelectedSite(list[0]);
    else setLoading(false);
  };

  const loadTeam = async (siteId) => {
    setLoading(true);
    const [svData, wkData] = await Promise.all([
      apiFetch(`supervisors?select=id,profile_id&site_id=eq.${siteId}&is_deleted=eq.false`),
      apiFetch(`workers?select=id,worker_code,status,profile_id&site_id=eq.${siteId}&is_deleted=eq.false`),
    ]);

    const svList = Array.isArray(svData) ? svData : [];
    const wkList = Array.isArray(wkData) ? wkData : [];

    // Fetch profiles separately
    const allIds = [...svList.map(s => s.profile_id), ...wkList.map(w => w.profile_id)].filter(Boolean);
    let profileMap = {};
    if (allIds.length > 0) {
      const pData = await apiFetch(`profiles?select=id,full_name,email&id=in.(${allIds.join(",")})`);
      (Array.isArray(pData) ? pData : []).forEach(p => { profileMap[p.id] = p; });
    }

    setSupervisors(svList.map(s => ({ ...s, profiles: profileMap[s.profile_id] || null })));
    setWorkers(wkList.map(w => ({ ...w, profiles: profileMap[w.profile_id] || null })));
    setLoading(false);
  };

  const handleAssignSupervisor = async (e) => {
    e.preventDefault();
    if (!profileId.trim() || !selectedSite) return;
    setAssigning(true);
    setError(null);
    setSuccess(null);

    // Check profile exists and is a supervisor
    const profiles = await apiFetch(`profiles?select=id,full_name,role&id=eq.${profileId.trim()}`);
    const profile = Array.isArray(profiles) ? profiles[0] : null;

    if (!profile) {
      setError("Profile ID not found. Make sure the supervisor has registered.");
      setAssigning(false);
      return;
    }
    if (profile.role !== "supervisor") {
      setError(`This profile has role "${profile.role}", not supervisor.`);
      setAssigning(false);
      return;
    }

    // Check not already assigned
    const existing = await apiFetch(`supervisors?select=id&profile_id=eq.${profileId.trim()}&site_id=eq.${selectedSite.id}&is_deleted=eq.false`);
    if (Array.isArray(existing) && existing.length > 0) {
      setError("This supervisor is already assigned to this site.");
      setAssigning(false);
      return;
    }

    // Insert supervisor record
    const { error: err } = await supabase.from("supervisors").insert({
      profile_id: profileId.trim(),
      site_id: selectedSite.id,
      is_deleted: false,
    });

    if (err) {
      setError(err.message);
    } else {
      setSuccess(`${profile.full_name || "Supervisor"} assigned successfully!`);
      setProfileId("");
      loadTeam(selectedSite.id);
    }
    setAssigning(false);
  };

  const inputClass = "w-full bg-[#0d1117] border border-[#30363d] focus:border-orange-500 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder-[#484f58]";

  return (
    <div className="space-y-4">
      {/* Site tabs */}
      {sites.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {sites.map(s => (
            <button key={s.id} onClick={() => setSelectedSite(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedSite?.id === s.id
                  ? "bg-orange-500 text-white"
                  : "bg-[#161b22] border border-[#21262d] text-[#8b949e] hover:text-white"
              }`}>
              {s.site_name}
            </button>
          ))}
        </div>
      )}
      {selectedSite && sites.length === 1 && (
        <div className="inline-block px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold">
          {selectedSite.site_name}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left — Add Supervisor */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
          <div className="text-[10px] font-bold tracking-widest text-orange-400 mb-1">
            ASSIGN TO {selectedSite?.site_name?.toUpperCase() || "SITE"}
          </div>
          <div className="text-white font-bold text-xl mb-5">Add supervisor</div>

          <form onSubmit={handleAssignSupervisor} className="space-y-4">
            <div>
              <label className="block text-xs font-bold tracking-widest text-[#484f58] mb-1.5 uppercase">
                Supervisor Profile ID
              </label>
              <input
                className={inputClass}
                value={profileId}
                onChange={e => setProfileId(e.target.value)}
                placeholder="Paste supervisor's user ID"
                required
              />
              <p className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mt-2">
                Supervisor must register first. Their Profile ID shows on their dashboard after login.
              </p>
            </div>

            {error && <div className="bg-red-950 border border-red-700 rounded-lg px-3 py-2"><p className="text-red-300 text-xs">{error}</p></div>}
            {success && <div className="bg-green-950 border border-green-700 rounded-lg px-3 py-2"><p className="text-green-300 text-xs">{success}</p></div>}

            <button type="submit" disabled={assigning || !selectedSite}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wider">
              <Plus size={14} />
              {assigning ? "ASSIGNING..." : "+ ASSIGN SUPERVISOR"}
            </button>
          </form>

          {/* Assigned supervisors list */}
          <div className="mt-6">
            <div className="text-[10px] font-bold tracking-widest text-orange-400 mb-1">ASSIGNED</div>
            <div className="text-white font-bold text-base mb-3">Supervisors</div>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : supervisors.length === 0 ? (
              <p className="text-[#484f58] text-sm">No supervisors assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {supervisors.map(sv => (
                  <div key={sv.id} className="bg-[#0d1117] border border-[#21262d] rounded-lg px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold text-sm">{sv.profiles?.full_name || "Supervisor"}</div>
                      <div className="text-[#484f58] text-xs mt-0.5">{sv.profiles?.email}</div>
                    </div>
                    <span className="text-[10px] font-bold tracking-widest text-green-400 bg-green-500/10 border border-green-500/30 rounded px-2 py-0.5">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Workers on site */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
          <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">
            {workers.length} WORKERS
          </div>
          <div className="text-white font-bold text-xl mb-5">Workers on site</div>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : workers.length === 0 ? (
            <div className="text-center py-10">
              <HardHat size={32} className="text-[#21262d] mx-auto mb-2" />
              <p className="text-[#484f58] text-sm">No workers on this site yet.</p>
              <p className="text-[#484f58] text-xs mt-1">Supervisors can register workers from their dashboard.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {workers.map(w => (
                <div key={w.id} className="bg-[#0d1117] border border-[#21262d] rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold text-sm">{w.profiles?.full_name || "Worker"}</div>
                    <div className="text-[#484f58] text-xs mt-0.5">· {w.worker_code}</div>
                  </div>
                  <span className={`text-[10px] font-bold tracking-widest border rounded px-2 py-0.5 ${
                    w.status === "active" || !w.status
                      ? "text-green-400 bg-green-500/10 border-green-500/30"
                      : "text-[#8b949e] bg-[#21262d] border-[#30363d]"
                  }`}>
                    {(w.status || "ACTIVE").toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
