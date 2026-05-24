import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Users, CalendarCheck, ClipboardList, ShieldCheck, Plus, HardHat } from "lucide-react";

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

export default function SVWorkers() {
  const { user } = useAuth();
  const [siteId, setSiteId] = useState(null);
  const [supervisorId, setSupervisorId] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [stats, setStats] = useState({ workers: 0, present: 0, tasks: 0, inspections: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [workerCode, setWorkerCode] = useState("WG-001");

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
      supabase.from("workers").select("id, worker_code, status, profiles!workers_profile_id_fkey(full_name, email)").eq("site_id", sid).eq("is_deleted", false),
      supabase.from("tasks").select("id", { count: "exact" }).eq("site_id", sid).eq("is_completed", false).eq("is_deleted", false),
      supabase.from("site_inspections").select("id", { count: "exact" }).eq("site_id", sid).eq("is_deleted", false),
      supabase.from("attendance").select("id", { count: "exact" }).eq("site_id", sid).eq("attendance_date", today),
    ]);

    setWorkers(wRes.data || []);
    setStats({
      workers: (wRes.data || []).length,
      present: presentRes.count || 0,
      tasks: taskRes.count || 0,
      inspections: inspRes.count || 0,
    });
    setLoading(false);
  };

  const handleRegisterWorker = async (e) => {
    e.preventDefault();
    if (!siteId || !fullName.trim() || !email.trim() || !tempPassword.trim()) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const SUPABASE_URL = "https://dxtbakphqiopympgewqy.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dGJha3BocWlvcHltcGdld3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzY4NzMsImV4cCI6MjA5NDQxMjg3M30.RAJZgvdB1HWuoCFcBezRBXgNc_AgpAoNMLyiumdcHZM";

    // Create auth user via direct fetch
    const signupRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
      },
      body: JSON.stringify({
        email: email.trim(),
        password: tempPassword,
        data: { full_name: fullName.trim(), role: "worker" }
      }),
    });

    const authData = await signupRes.json();
    if (!signupRes.ok) {
      setError(authData.msg || authData.error_description || "Failed to create account");
      setSubmitting(false);
      return;
    }

    const newUserId = authData?.id || authData?.user?.id;
    if (!newUserId) {
      setError("Failed to get user ID");
      setSubmitting(false);
      return;
    }

    // Get supervisor's current session token to make authenticated REST calls
    const { data: { session } } = await supabase.auth.getSession();
    const supervisorToken = session?.access_token || SUPABASE_KEY;

    // Wait briefly for the DB trigger to fire and create the profile row
    await new Promise(r => setTimeout(r, 1500));

    // Check if profile was created by the trigger
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${newUserId}&select=id`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${supervisorToken}` },
    });
    const checkRows = await checkRes.json();
    const profileExists = Array.isArray(checkRows) && checkRows.length > 0;

    if (profileExists) {
      // Update the trigger-created profile with full details
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${newUserId}`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${supervisorToken}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim() || null, role: "worker" }),
      });
    } else {
      // Trigger didn't fire — insert profile manually using supervisor token
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${supervisorToken}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ id: newUserId, full_name: fullName.trim(), phone: phone.trim() || null, role: "worker" }),
      });
      if (!insertRes.ok) {
        const errBody = await insertRes.json().catch(() => ({}));
        setError(`Could not create profile: ${errBody.message || insertRes.status}. Check Supabase RLS policies on profiles table.`);
        setSubmitting(false);
        return;
      }
    }

    // Insert worker record
    const { error: workerErr } = await supabase.from("workers").insert({
      profile_id: newUserId,
      site_id: siteId,
      supervisor_id: supervisorId,
      worker_code: workerCode.trim() || "WG-001",
      status: "active",
      is_deleted: false,
    });

    if (workerErr) {
      setError(workerErr.message);
      setSubmitting(false);
      return;
    }

    setSuccess(`Worker "${fullName}" registered! Login: ${email} / ${tempPassword}`);
    setFullName(""); setEmail(""); setPhone(""); setTempPassword(""); setWorkerCode("WG-001");
    loadAll(siteId);
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
        {/* Register worker form */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
          <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">REGISTER NEW</div>
          <div className="text-white font-bold text-base mb-5">Add worker</div>

          <form onSubmit={handleRegisterWorker} className="space-y-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="worker@example.com"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <label className={labelClass}>Temporary Password</label>
              <input
                type="password"
                className={inputClass}
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Worker Code (optional)</label>
              <input
                className={inputClass}
                value={workerCode}
                onChange={(e) => setWorkerCode(e.target.value)}
                placeholder="WG-001"
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
              disabled={submitting || loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wider"
            >
              <Plus size={14} />
              {submitting ? "REGISTERING..." : "+ REGISTER WORKER"}
            </button>
          </form>
        </div>

        {/* Workers list */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
          <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-1">
            {workers.length} REGISTERED
          </div>
          <div className="text-white font-bold text-base mb-5">Workers on site</div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : workers.length === 0 ? (
            <div className="text-center py-10">
              <HardHat size={32} className="text-[#21262d] mx-auto mb-2" />
              <div className="text-[#484f58] text-sm">No workers registered yet.</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {workers.map((w) => (
                <div key={w.id} className="bg-[#0d1117] border border-[#21262d] rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {w.profiles?.full_name || "Unknown"}
                      </div>
                      <div className="text-[#484f58] text-xs mt-0.5">
                        {w.worker_code} · {w.profiles?.email}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold tracking-widest border rounded px-2 py-0.5 flex-shrink-0 ${
                        w.status === "active" || !w.status
                          ? "text-green-400 bg-green-500/10 border-green-500/30"
                          : "text-[#8b949e] bg-[#21262d] border-[#30363d]"
                      }`}
                    >
                      {(w.status || "ACTIVE").toUpperCase()}
                    </span>
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
