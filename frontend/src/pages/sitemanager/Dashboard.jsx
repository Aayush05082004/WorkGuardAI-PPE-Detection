import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Copy, Check, Building2, Users, ClipboardList, ShieldCheck } from "lucide-react";

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold tracking-widest text-[#484f58]">{label}</span>
        <Icon size={14} className={color} />
      </div>
      <div className="text-3xl font-black text-white">{value ?? "—"}</div>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-[#8b949e] hover:text-white transition-colors"
    >
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      {copied ? "COPIED" : "COPY ID"}
    </button>
  );
}

export default function SMDashboard() {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [focusSite, setFocusSite] = useState(null);
  const [stats, setStats] = useState({ workers: 0, tasks: 0, reviews: 0 });
  const [siteStats, setSiteStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    // Load sites
    const { data: sitesData } = await supabase
      .from("sites")
      .select("*")
      .eq("manager_id", user.id)
      .eq("is_deleted", false);

    const siteList = sitesData || [];
    setSites(siteList);
    if (siteList.length > 0) setFocusSite(siteList[0]);

    // Global stats
    const siteIds = siteList.map((s) => s.id);
    if (siteIds.length > 0) {
      const [workersRes, tasksRes, reviewsRes] = await Promise.all([
        supabase.from("workers").select("id", { count: "exact" }).in("site_id", siteIds).eq("is_deleted", false),
        supabase.from("tasks").select("id", { count: "exact" }).in("site_id", siteIds).eq("is_completed", false).eq("is_deleted", false),
        supabase.from("site_inspections").select("id", { count: "exact" }).in("site_id", siteIds).eq("review_status", "pending"),
      ]);
      setStats({
        workers: workersRes.count || 0,
        tasks: tasksRes.count || 0,
        reviews: reviewsRes.count || 0,
      });

      // Per-site stats
      const perSite = {};
      for (const site of siteList) {
        const [wRes, svRes, tRes] = await Promise.all([
          supabase.from("workers").select("id", { count: "exact" }).eq("site_id", site.id).eq("is_deleted", false),
          supabase.from("supervisors").select("id", { count: "exact" }).eq("site_id", site.id).eq("is_deleted", false),
          supabase.from("tasks").select("id", { count: "exact" }).eq("site_id", site.id).eq("is_completed", false).eq("is_deleted", false),
        ]);
        perSite[site.id] = {
          workers: wRes.count || 0,
          supervisors: svRes.count || 0,
          tasks: tRes.count || 0,
        };
      }
      setSiteStats(perSite);
    }
    setLoading(false);
  };

  const fs = focusSite ? siteStats[focusSite.id] || {} : {};

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="SITES" value={sites.length} icon={Building2} color="text-orange-400" />
        <StatCard label="WORKERS" value={stats.workers} icon={Users} color="text-orange-400" />
        <StatCard label="OPEN TASKS" value={stats.tasks} icon={ClipboardList} color="text-orange-400" />
        <StatCard label="PENDING REVIEWS" value={stats.reviews} icon={ShieldCheck} color="text-orange-400" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Focus site panel */}
          <div className="lg:col-span-2 bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">FOCUS SITE</div>
                <div className="text-white font-bold text-lg">
                  {focusSite?.site_name || "No site selected"}
                </div>
              </div>
            </div>

            {focusSite ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
                    <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">LOCATION</div>
                    <div className="text-[#c9d1d9] text-sm font-medium">{focusSite.location || "—"}</div>
                  </div>
                  <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
                    <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">WORKERS</div>
                    <div className="text-[#c9d1d9] text-sm font-bold">{fs.workers ?? "—"}</div>
                  </div>
                  <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
                    <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">SUPERVISORS</div>
                    <div className="text-[#c9d1d9] text-sm font-bold">{fs.supervisors ?? "—"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
                    <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">OPEN TASKS</div>
                    <div className="text-[#c9d1d9] text-sm font-bold">{fs.tasks ?? "—"}</div>
                  </div>
                  <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
                    <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">STATUS</div>
                    <div className="text-green-400 text-sm font-bold">ACTIVE</div>
                  </div>
                </div>

                {focusSite.description && (
                  <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 mb-4">
                    <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">DESCRIPTION</div>
                    <div className="text-[#8b949e] text-xs leading-relaxed">{focusSite.description}</div>
                  </div>
                )}

                <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
                  <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-2">
                    SITE ID — SHARE WITH SUPERVISOR
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="text-orange-400 text-xs font-mono flex-1 truncate">{focusSite.id}</code>
                    <CopyButton text={focusSite.id} />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-[#484f58] text-sm">
                No sites yet. Create one in the Sites page.
              </div>
            )}
          </div>

          {/* Sites list */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">YOUR SITES</div>
            <div className="text-[#8b949e] text-xs mb-4">Switch site</div>
            <div className="space-y-2">
              {sites.length === 0 ? (
                <div className="text-center py-8 text-[#484f58] text-xs">No sites created yet.</div>
              ) : (
                sites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => setFocusSite(site)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      focusSite?.id === site.id
                        ? "bg-orange-500/10 border-orange-500/40 text-white"
                        : "bg-[#0d1117] border-[#21262d] text-[#8b949e] hover:border-[#30363d] hover:text-[#c9d1d9]"
                    }`}
                  >
                    <div className="font-semibold text-sm">{site.site_name}</div>
                    <div className="text-xs mt-0.5 opacity-70">{site.location}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
