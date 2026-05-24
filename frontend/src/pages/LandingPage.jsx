import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const roles = [
  {
    key: "site_manager",
    label: "SITE MANAGER",
    color: "#f97316",
    borderColor: "border-orange-500",
    textColor: "text-orange-400",
    hoverBg: "hover:bg-orange-500/10",
    description: "Manage sites, assign supervisors, and monitor overall progress.",
  },
  {
    key: "supervisor",
    label: "SUPERVISOR",
    color: "#3b82f6",
    borderColor: "border-blue-500",
    textColor: "text-blue-400",
    hoverBg: "hover:bg-blue-500/10",
    description: "Track attendance, assign tasks to workers, and report daily progress.",
  },
  {
    key: "worker",
    label: "WORKER",
    color: "#22c55e",
    borderColor: "border-green-500",
    textColor: "text-green-400",
    hoverBg: "hover:bg-green-500/10",
    description: "View your assigned tasks, mark work done, and check attendance.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Top bar */}
      <div className="px-8 py-5 flex items-center gap-3">
        <div className="w-9 h-9 bg-orange-500 rounded-md flex items-center justify-center">
          <span className="text-white font-black text-sm tracking-tight">WG</span>
        </div>
        <span className="text-white font-bold text-lg tracking-widest">WORKGUARD</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl">
          {/* Heading */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Who are you?</h1>
            <p className="text-[#8b949e] text-base">Select your role to register or log in.</p>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {roles.map((role) => (
              <button
                key={role.key}
                onClick={() => navigate(`/login/${role.key}`)}
                className={`bg-[#161b22] border ${role.borderColor} rounded-xl p-6 text-left transition-all duration-200 ${role.hoverBg} hover:scale-[1.02] group`}
              >
                <div className={`text-xs font-bold tracking-widest mb-4 ${role.textColor}`}>
                  {role.label}
                </div>
                <p className="text-[#c9d1d9] text-sm leading-relaxed mb-6">
                  {role.description}
                </p>
                <div className={`flex items-center gap-2 text-sm font-semibold ${role.textColor} group-hover:gap-3 transition-all`}>
                  ENTER <ArrowRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-5 text-center">
        <p className="text-[#484f58] text-xs tracking-widest font-medium">
          SUPABASE · 3 ROLES · REAL-TIME DATA
        </p>
      </div>
    </div>
  );
}
