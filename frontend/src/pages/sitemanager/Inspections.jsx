import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { ShieldCheck, ShieldAlert, ChevronDown, ChevronUp, Check, Flag } from "lucide-react";

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

export default function SMInspections() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (user) loadInspections();
  }, [user]);

  const loadInspections = async () => {
    setLoading(true);
    const { data: sitesData } = await supabase
      .from("sites")
      .select("id")
      .eq("manager_id", user.id)
      .eq("is_deleted", false);

    const siteIds = (sitesData || []).map((s) => s.id);
    if (siteIds.length === 0) {
      setLoading(false);
      return;
    }

    // Get inspections without complex joins
    const { data, error } = await supabase
      .from("site_inspections")
      .select("*, sites(site_name)")
      .in("site_id", siteIds)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    console.log("Inspections:", data?.length, error?.message);

    if (data && data.length > 0) {
      // Get supervisor names separately
      const supIds = [...new Set(data.map(i => i.supervisor_id).filter(Boolean))];
      let supMap = {};
      if (supIds.length > 0) {
        const { data: sups } = await supabase
          .from("supervisors")
          .select("id, profiles(full_name)")
          .in("id", supIds);
        (sups || []).forEach(s => { supMap[s.id] = s.profiles?.full_name || "Supervisor"; });
      }
      setInspections(data.map(i => ({ ...i, supervisorName: supMap[i.supervisor_id] || "Supervisor" })));
    } else {
      setInspections([]);
    }
    setLoading(false);
  };

  const handleReview = async (id, reviewStatus) => {
    setUpdating(id);
    await supabase
      .from("site_inspections")
      .update({ review_status: reviewStatus, reviewed_by: user.id })
      .eq("id", id);
    loadInspections();
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">SITE INSPECTIONS</div>
          <div className="text-white font-bold text-base">{inspections.length} total</div>
        </div>
      </div>

      {inspections.length === 0 ? (
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-10 text-center">
          <ShieldCheck size={40} className="text-[#21262d] mx-auto mb-3" />
          <div className="text-[#484f58] text-sm">No inspections yet.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => {
            const isExpanded = expanded === insp.id;
            const detections = Array.isArray(insp.detections) ? insp.detections : [];
            const violations = Array.isArray(insp.violations) ? insp.violations : [];

            return (
              <div
                key={insp.id}
                className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Thumbnail */}
                  {insp.annotated_url ? (
                    <img
                      src={insp.annotated_url}
                      alt="Inspection"
                      className="w-16 h-16 object-cover rounded-lg border border-[#21262d] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[#0d1117] border border-[#21262d] rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={20} className="text-[#484f58]" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {insp.has_violation ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-0.5">
                          <ShieldAlert size={10} /> VIOLATION
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-green-400 bg-green-500/10 border border-green-500/30 rounded px-2 py-0.5">
                          <ShieldCheck size={10} /> CLEAR
                        </span>
                      )}
                      {insp.review_status && (
                        <span className={`text-[10px] font-bold tracking-widest rounded px-2 py-0.5 ${
                          insp.review_status === "reviewed"
                            ? "text-blue-400 bg-blue-500/10 border border-blue-500/30"
                            : insp.review_status === "flagged"
                            ? "text-red-400 bg-red-500/10 border border-red-500/30"
                            : "text-[#8b949e] bg-[#21262d] border border-[#30363d]"
                        }`}>
                          {(insp.review_status || "PENDING").toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="text-white font-semibold text-sm truncate">
                      {insp.sites?.site_name || "Unknown Site"}
                    </div>
                    <div className="text-[#484f58] text-xs mt-0.5">
                      {insp.supervisorName || "Supervisor"} ·{" "}
                      {insp.created_at ? new Date(insp.created_at).toLocaleDateString() : "—"}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpanded(isExpanded ? null : insp.id)}
                    className="text-[#484f58] hover:text-white transition-colors p-1"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[#21262d] p-4 space-y-4">
                    {/* Images side by side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0d1117] border border-[#21262d] rounded-lg overflow-hidden">
                        <div className="text-[10px] font-bold tracking-widest text-[#484f58] px-3 py-2 border-b border-[#21262d]">
                          ORIGINAL
                        </div>
                        {insp.original_url ? (
                          <img src={insp.original_url} alt="Original" className="w-full object-contain max-h-48" />
                        ) : (
                          <div className="h-32 flex items-center justify-center text-[#484f58] text-xs">No image</div>
                        )}
                      </div>
                      <div className="bg-[#0d1117] border border-[#21262d] rounded-lg overflow-hidden">
                        <div className="text-[10px] font-bold tracking-widest text-[#484f58] px-3 py-2 border-b border-[#21262d]">
                          ANNOTATED
                        </div>
                        {insp.annotated_url ? (
                          <img src={insp.annotated_url} alt="Annotated" className="w-full object-contain max-h-48" />
                        ) : (
                          <div className="h-32 flex items-center justify-center text-[#484f58] text-xs">No image</div>
                        )}
                      </div>
                    </div>

                    {/* Violations */}
                    {violations.length > 0 && (
                      <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-3">
                        <div className="text-[10px] font-bold tracking-widest text-red-400 mb-2">VIOLATIONS</div>
                        <div className="flex flex-wrap gap-2">
                          {violations.map((v, i) => (
                            <span key={i} className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded px-2 py-0.5">
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detections */}
                    {detections.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-2">DETECTIONS</div>
                        <div className="flex flex-wrap gap-2">
                          {detections.map((d, i) => (
                            <span
                              key={i}
                              className={`text-xs border rounded px-2 py-0.5 ${CLASS_COLORS[d.class] || "bg-[#21262d] text-[#8b949e] border-[#30363d]"}`}
                            >
                              {d.class} {d.confidence ? `— ${(d.confidence * 100).toFixed(0)}%` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleReview(insp.id, "reviewed")}
                        disabled={updating === insp.id}
                        className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold tracking-wider px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Check size={12} /> MARK REVIEWED
                      </button>
                      <button
                        onClick={() => handleReview(insp.id, "flagged")}
                        disabled={updating === insp.id}
                        className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold tracking-wider px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Flag size={12} /> FLAG ISSUE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
