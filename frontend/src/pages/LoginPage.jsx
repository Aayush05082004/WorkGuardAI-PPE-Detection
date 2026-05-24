import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

const ROLE_CONFIG = {
  site_manager: {
    label: "SITE MANAGER",
    color: "#f97316",
    colorClass: "text-orange-400",
    borderClass: "border-orange-500",
    bgClass: "bg-orange-500",
    hoverClass: "hover:bg-orange-600",
    focusClass: "focus:border-orange-500",
    heading: "Manage sites, teams, and track project progress.",
    subtitle: "Full control over your construction sites, supervisors, and workers.",
    infoBoxes: [
      { label: "ROLE", value: "Site Manager" },
      { label: "DB", value: "profiles + sites" },
      { label: "PHASE", value: "Admin" },
    ],
    canRegister: true,
  },
  supervisor: {
    label: "SUPERVISOR",
    color: "#3b82f6",
    colorClass: "text-blue-400",
    borderClass: "border-blue-500",
    bgClass: "bg-blue-500",
    hoverClass: "hover:bg-blue-600",
    focusClass: "focus:border-blue-500",
    heading: "Mark attendance, assign tasks, and track site progress.",
    subtitle: "Oversee workers on your assigned site and report to the site manager.",
    infoBoxes: [
      { label: "ROLE", value: "Supervisor" },
      { label: "REPORTS TO", value: "Site Manager" },
      { label: "MANAGES", value: "Workers" },
    ],
    canRegister: true,
  },
  worker: {
    label: "WORKER",
    color: "#22c55e",
    colorClass: "text-green-400",
    borderClass: "border-green-500",
    bgClass: "bg-green-500",
    hoverClass: "hover:bg-green-600",
    focusClass: "focus:border-green-500",
    heading: "View your tasks and mark work as complete.",
    subtitle: "Stay on top of your daily tasks and attendance records.",
    infoBoxes: [
      { label: "ROLE", value: "Worker" },
      { label: "REPORTS TO", value: "Supervisor" },
      { label: "TASKS", value: "Assigned by Supervisor" },
    ],
    canRegister: false,
  },
};

function InputField({ label, type = "text", value, onChange, placeholder, focusClass, required = true }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label className="block text-xs font-semibold text-[#8b949e] mb-1 tracking-wider uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`w-full bg-[#0d1117] border border-[#30363d] ${focusClass} rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder-[#484f58]`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#8b949e]"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { role } = useParams();
  const navigate = useNavigate();
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.worker;

  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else if (data?.user) {
        window.location.href = "/dashboard";
      } else {
        setError("Login failed.");
        setLoading(false);
      }
    } catch (err) {
      setError("Error: " + err.message);
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: { full_name: regName, role: role }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = data?.user?.id;
    const accessToken = data?.session?.access_token;

    if (userId) {
      // Wait for trigger to create the profile row first
      await new Promise(r => setTimeout(r, 800));

      // Use direct fetch to update profile with correct role
      const updateRes = await fetch(
        `https://dxtbakphqiopympgewqy.supabase.co/rest/v1/profiles?id=eq.${userId}`,
        {
          method: "PATCH",
          headers: {
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dGJha3BocWlvcHltcGdld3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzY4NzMsImV4cCI6MjA5NDQxMjg3M30.RAJZgvdB1HWuoCFcBezRBXgNc_AgpAoNMLyiumdcHZM",
            "Authorization": `Bearer ${accessToken || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dGJha3BocWlvcHltcGdld3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzY4NzMsImV4cCI6MjA5NDQxMjg3M30.RAJZgvdB1HWuoCFcBezRBXgNc_AgpAoNMLyiumdcHZM"}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            full_name: regName,
            phone: regPhone || null,
            role: role,
          }),
        }
      );
      console.log("Profile update status:", updateRes.status);
    }

    if (role === "supervisor") {
      setSuccessMsg(
        `Account created! Ask your manager to assign you to a site using your Profile ID: ${userId}`
      );
      setTab("login");
      setLoading(false);
    } else {
      // For site_manager, go straight to dashboard
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex">
      {/* LEFT HALF */}
      <div className="hidden md:flex w-1/2 flex-col bg-[#161b22] border-r border-[#21262d] p-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center"
            style={{ backgroundColor: config.color }}
          >
            <span className="text-white font-black text-sm tracking-tight">WG</span>
          </div>
          <div>
            <div className="text-white font-bold text-base tracking-widest">WORKGUARD</div>
            <div className={`text-xs font-semibold tracking-widest ${config.colorClass}`}>
              {config.label}
            </div>
          </div>
        </div>

        {/* Role label */}
        <div className={`text-xs font-bold tracking-widest mb-4 ${config.colorClass}`}>
          {config.label}
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-black text-white leading-tight mb-4">
          {config.heading}
        </h2>
        <p className="text-[#8b949e] text-sm leading-relaxed mb-auto">
          {config.subtitle}
        </p>

        {/* Info boxes */}
        <div className="grid grid-cols-3 gap-3 mt-10">
          {config.infoBoxes.map((box) => (
            <div key={box.label} className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
              <div className="text-[#484f58] text-xs font-bold tracking-widest mb-1">{box.label}</div>
              <div className="text-[#c9d1d9] text-xs font-medium">{box.value}</div>
            </div>
          ))}
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="mt-6 flex items-center gap-2 text-[#8b949e] hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={14} /> BACK
        </button>
      </div>

      {/* RIGHT HALF */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Mobile back */}
        <button
          onClick={() => navigate("/")}
          className="md:hidden self-start flex items-center gap-2 text-[#8b949e] hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> BACK
        </button>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center"
              style={{ backgroundColor: config.color }}
            >
              <span className="text-white font-black text-sm">WG</span>
            </div>
            <span className="text-white font-bold tracking-widest">WORKGUARD</span>
          </div>

          {/* Tabs (only for site_manager and supervisor) */}
          {config.canRegister && (
            <div className="flex mb-6 bg-[#161b22] border border-[#21262d] rounded-lg p-1">
              <button
                onClick={() => { setTab("register"); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-2 text-xs font-bold tracking-widest rounded-md transition-colors ${
                  tab === "register"
                    ? `${config.bgClass} text-white`
                    : "text-[#8b949e] hover:text-white"
                }`}
              >
                REGISTER
              </button>
              <button
                onClick={() => { setTab("login"); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-2 text-xs font-bold tracking-widest rounded-md transition-colors ${
                  tab === "login"
                    ? `${config.bgClass} text-white`
                    : "text-[#8b949e] hover:text-white"
                }`}
              >
                LOGIN
              </button>
            </div>
          )}

          {/* Worker info box */}
          {!config.canRegister && (
            <div className="mb-6 bg-[#161b22] border border-[#21262d] rounded-lg p-4">
              <p className="text-[#8b949e] text-xs leading-relaxed">
                Your login is created by your supervisor. Contact them if you don't have credentials.
              </p>
            </div>
          )}

          {/* Success message */}
          {successMsg && (
            <div className="mb-4 bg-green-950 border border-green-700 rounded-lg px-4 py-3">
              <p className="text-green-300 text-xs leading-relaxed">{successMsg}</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 bg-red-950 border border-red-700 rounded-lg px-4 py-3">
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}

          {/* REGISTER FORM */}
          {config.canRegister && tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <InputField
                label="Full Name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="John Doe"
                focusClass={config.focusClass}
              />
              <InputField
                label="Email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="you@example.com"
                focusClass={config.focusClass}
              />
              <InputField
                label="Phone"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                focusClass={config.focusClass}
                required={false}
              />
              <InputField
                label="Password"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                focusClass={config.focusClass}
              />
              <InputField
                label="Confirm Password"
                type="password"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                placeholder="••••••••"
                focusClass={config.focusClass}
              />
              <button
                type="submit"
                disabled={loading}
                className={`w-full ${config.bgClass} ${config.hoverClass} disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wider`}
              >
                {loading ? "CREATING..." : "CREATE ACCOUNT"}
              </button>
            </form>
          )}

          {/* LOGIN FORM */}
          {(tab === "login" || !config.canRegister) && (
            <form onSubmit={handleLogin} className="space-y-4">
              <InputField
                label="Email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                focusClass={config.focusClass}
              />
              <InputField
                label="Password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                focusClass={config.focusClass}
              />
              <button
                type="submit"
                disabled={loading}
                className={`w-full ${config.bgClass} ${config.hoverClass} disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm tracking-wider`}
              >
                {loading ? "LOGGING IN..." : "LOGIN"}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  className="text-[#484f58] hover:text-[#8b949e] text-xs transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
