import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  ShieldCheck,
  Bell,
  CalendarCheck,
  HardHat,
  FileText,
  LogOut,
  CheckSquare,
} from "lucide-react";

const NAV_CONFIG = {
  site_manager: {
    label: "Site Manager",
    color: "#f97316",
    badgeBg: "bg-orange-500",
    textColor: "text-orange-400",
    activeBg: "bg-orange-500/10",
    workspace: "MANAGER WORKSPACE",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { label: "Sites", icon: Building2, path: "/dashboard/sites" },
      { label: "Team", icon: Users, path: "/dashboard/team" },
      { label: "Tasks", icon: ClipboardList, path: "/dashboard/tasks" },
      { label: "Inspections", icon: ShieldCheck, path: "/dashboard/inspections" },
      { label: "Notifications", icon: Bell, path: "/dashboard/notifications" },
    ],
  },
  supervisor: {
    label: "Supervisor",
    color: "#3b82f6",
    badgeBg: "bg-blue-500",
    textColor: "text-blue-400",
    activeBg: "bg-blue-500/10",
    workspace: "SUPERVISOR WORKSPACE",
    items: [
      { label: "Attendance", icon: CalendarCheck, path: "/dashboard" },
      { label: "Tasks", icon: ClipboardList, path: "/dashboard/tasks" },
      { label: "Workers", icon: HardHat, path: "/dashboard/workers" },
      { label: "Inspections", icon: ShieldCheck, path: "/dashboard/inspections" },
      { label: "Leave Requests", icon: FileText, path: "/dashboard/leave-requests" },
      { label: "Notifications", icon: Bell, path: "/dashboard/notifications" },
    ],
  },
  worker: {
    label: "Worker",
    color: "#22c55e",
    badgeBg: "bg-green-500",
    textColor: "text-green-400",
    activeBg: "bg-green-500/10",
    workspace: "WORKER WORKSPACE",
    items: [
      { label: "My Tasks", icon: CheckSquare, path: "/dashboard" },
      { label: "Attendance", icon: CalendarCheck, path: "/dashboard/attendance" },
      { label: "Leave Request", icon: FileText, path: "/dashboard/leave-request" },
      { label: "Notifications", icon: Bell, path: "/dashboard/notifications" },
    ],
  },
};

const PAGE_TITLES = {
  "/dashboard": { site_manager: "Dashboard", supervisor: "Attendance", worker: "My Tasks" },
  "/dashboard/sites": { site_manager: "Sites" },
  "/dashboard/team": { site_manager: "Team" },
  "/dashboard/tasks": { site_manager: "Tasks", supervisor: "Tasks" },
  "/dashboard/inspections": { site_manager: "Inspections", supervisor: "Inspections" },
  "/dashboard/notifications": { site_manager: "Notifications", supervisor: "Notifications", worker: "Notifications" },
  "/dashboard/workers": { supervisor: "Workers" },
  "/dashboard/leave-requests": { supervisor: "Leave Requests" },
  "/dashboard/attendance": { worker: "Attendance" },
  "/dashboard/leave-request": { worker: "Leave Request" },
};

export default function Layout({ children, role, todayStatus }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const config = NAV_CONFIG[role] || NAV_CONFIG.worker;

  const pageTitle =
    PAGE_TITLES[location.pathname]?.[role] ||
    PAGE_TITLES[location.pathname]?.site_manager ||
    "Dashboard";

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-[#0d1117]">
      {/* Sidebar */}
      <aside className="w-[180px] min-w-[180px] bg-[#161b22] border-r border-[#21262d] flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-[#21262d]">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-7 h-7 ${config.badgeBg} rounded-md flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-black text-xs tracking-tight">WG</span>
            </div>
            <span className="text-white font-bold text-sm tracking-widest">WORKGUARD</span>
          </div>
          <div className={`text-xs font-semibold tracking-widest pl-9 ${config.textColor}`}>
            {config.label}
          </div>
        </div>

        {/* Worker today status */}
        {role === "worker" && (
          <div className="mx-3 mt-3 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
            <div className="text-[10px] font-bold text-green-400 tracking-widest">TODAY</div>
            <div className="text-[10px] text-[#8b949e] mt-0.5">
              {todayStatus || "Not marked yet"}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {config.items.map(({ label, icon: Icon, path }) => {
            const active = isActive(path);
            return (
              <NavLink
                key={path}
                to={path}
                end={path === "/dashboard"}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? `${config.activeBg} ${config.textColor}`
                    : "text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]"
                }`}
              >
                <Icon size={14} />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-[#21262d]">
          <div className={`text-[10px] font-bold tracking-widest mb-2 ${config.textColor}`}>
            {config.label.toUpperCase()}
          </div>
          {/* Show Profile ID for supervisor so they can share with manager */}
          {role === "supervisor" && profile?.id && (
            <div className="mb-3">
              <div className="text-[10px] text-[#484f58] mb-1">YOUR PROFILE ID</div>
              <div className="flex items-center gap-1">
                <code className="text-[10px] text-blue-400 font-mono truncate flex-1">{profile.id.slice(0, 18)}...</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(profile.id); }}
                  className="text-[10px] text-[#484f58] hover:text-white bg-[#21262d] rounded px-1.5 py-0.5 transition-colors"
                  title="Copy full ID"
                >
                  COPY
                </button>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-[#8b949e] hover:text-red-400 text-xs transition-colors font-medium"
          >
            LOGOUT <LogOut size={12} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-[#21262d] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-[#484f58] mb-0.5">
              {config.workspace}
            </div>
            <div className="text-white font-bold text-lg">
              {pageTitle || "Dashboard"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#161b22] border border-[#21262d] rounded-lg px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
              <span className="text-[#8b949e] text-xs">Supabase connected</span>
            </div>
            {profile?.full_name && (
              <div className="bg-[#161b22] border border-[#21262d] rounded-lg px-3 py-1.5">
                <span className="text-[#8b949e] text-xs">{profile.full_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
