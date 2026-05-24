import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Copy, Check, Plus, MapPin } from "lucide-react";

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
      className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg px-2.5 py-1 text-xs text-[#8b949e] hover:text-white transition-colors"
    >
      {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
      {copied ? "COPIED" : "COPY ID"}
    </button>
  );
}

export default function SMSites() {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [siteName, setSiteName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (user) loadSites();
  }, [user]);

  const loadSites = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("sites")
      .select("*")
      .eq("manager_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });
    setSites(data || []);
    setLoading(false);
  };

  const handleAddSite = async (e) => {
    e.preventDefault();
    if (!siteName.trim()) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await supabase.from("sites").insert({
      site_name: siteName.trim(),
      location: location.trim(),
      description: description.trim(),
      manager_id: user.id,
      is_deleted: false,
    });
    if (err) {
      setError(err.message);
    } else {
      setSiteName("");
      setLocation("");
      setDescription("");
      loadSites();
    }
    setSubmitting(false);
  };

  const inputClass =
    "w-full bg-[#0d1117] border border-[#30363d] focus:border-orange-500 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder-[#484f58]";
  const labelClass = "block text-xs font-bold tracking-widest text-[#484f58] mb-1.5 uppercase";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Add site form */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
        <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">ADD NEW</div>
        <div className="text-white font-bold text-base mb-5">Create site</div>

        <form onSubmit={handleAddSite} className="space-y-4">
          <div>
            <label className={labelClass}>Site Name</label>
            <input
              className={inputClass}
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. Downtown Tower Block A"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input
              className={inputClass}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 123 Main St, City"
            />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the site..."
            />
          </div>

          {error && (
            <div className="bg-red-950 border border-red-700 rounded-lg px-3 py-2">
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wider"
          >
            <Plus size={14} />
            {submitting ? "ADDING..." : "+ ADD SITE"}
          </button>
        </form>
      </div>

      {/* Sites list */}
      <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
        <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">YOUR SITES</div>
        <div className="text-white font-bold text-base mb-5">{sites.length} site{sites.length !== 1 ? "s" : ""}</div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-[#484f58] text-sm">No sites yet.</div>
            <div className="text-[#484f58] text-xs mt-1">Create your first site using the form.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {sites.map((site) => (
              <div
                key={site.id}
                className="bg-[#0d1117] border border-[#21262d] rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-white font-semibold text-sm">{site.site_name}</div>
                    {site.location && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={11} className="text-[#484f58]" />
                        <span className="text-[#8b949e] text-xs">{site.location}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-green-400 bg-green-500/10 border border-green-500/30 rounded px-2 py-0.5 flex-shrink-0">
                    ACTIVE
                  </span>
                </div>
                {site.description && (
                  <p className="text-[#484f58] text-xs mb-3 leading-relaxed">{site.description}</p>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-[#21262d]">
                  <code className="text-orange-400 text-xs font-mono flex-1 truncate">{site.id}</code>
                  <CopyButton text={site.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
