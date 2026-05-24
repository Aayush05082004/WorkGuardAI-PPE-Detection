import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";

import SMDashboard from "./pages/sitemanager/Dashboard";
import SMSites from "./pages/sitemanager/Sites";
import SMTeam from "./pages/sitemanager/Team";
import SMTasks from "./pages/sitemanager/Tasks";
import SMInspections from "./pages/sitemanager/Inspections";
import SMNotifications from "./pages/sitemanager/Notifications";

import SVAttendance from "./pages/supervisor/Attendance";
import SVTasks from "./pages/supervisor/Tasks";
import SVWorkers from "./pages/supervisor/Workers";
import SVInspections from "./pages/supervisor/Inspections";
import SVLeaveRequests from "./pages/supervisor/LeaveRequests";
import SVNotifications from "./pages/supervisor/Notifications";

import WKMyTasks from "./pages/worker/MyTasks";
import WKAttendance from "./pages/worker/Attendance";
import WKLeaveRequest from "./pages/worker/LeaveRequest";
import WKNotifications from "./pages/worker/Notifications";

export default function App() {
  const { user, role, loading, signOut } = useAuth();
  const [roleTimeout, setRoleTimeout] = useState(false);

  useEffect(() => {
    if (user && !role) {
      const t = setTimeout(() => setRoleTimeout(true), 4000);
      return () => clearTimeout(t);
    }
    setRoleTimeout(false);
  }, [user, role]);

  // Checking session
  if (loading) {
    return <div className="min-h-screen bg-[#0d1117]" />;
  }

  // Not logged in
  if (!user) {
    return (
      <Routes>
        <Route path="/login/:role" element={<LoginPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  // Logged in but role not loaded yet
  if (!role) {
    if (roleTimeout) {
      // Profile missing — show error with logout option
      return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-8 text-center max-w-sm">
            <p className="text-white font-bold mb-2">Profile not found</p>
            <p className="text-[#8b949e] text-sm mb-4">
              Your account exists but has no role assigned. Contact your administrator.
            </p>
            <button
              onClick={signOut}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Site Manager
  if (role === "site_manager") {
    return (
      <Layout role={role}>
        <Routes>
          <Route path="*" element={<SMDashboard />} />
          <Route path="/dashboard" element={<SMDashboard />} />
          <Route path="/dashboard/sites" element={<SMSites />} />
          <Route path="/dashboard/team" element={<SMTeam />} />
          <Route path="/dashboard/tasks" element={<SMTasks />} />
          <Route path="/dashboard/inspections" element={<SMInspections />} />
          <Route path="/dashboard/notifications" element={<SMNotifications />} />
        </Routes>
      </Layout>
    );
  }

  // Supervisor
  if (role === "supervisor") {
    return (
      <Layout role={role}>
        <Routes>
          <Route path="*" element={<SVAttendance />} />
          <Route path="/dashboard" element={<SVAttendance />} />
          <Route path="/dashboard/tasks" element={<SVTasks />} />
          <Route path="/dashboard/workers" element={<SVWorkers />} />
          <Route path="/dashboard/inspections" element={<SVInspections />} />
          <Route path="/dashboard/leave-requests" element={<SVLeaveRequests />} />
          <Route path="/dashboard/notifications" element={<SVNotifications />} />
        </Routes>
      </Layout>
    );
  }

  // Worker
  if (role === "worker") {
    return (
      <Layout role={role}>
        <Routes>
          <Route path="*" element={<WKMyTasks />} />
          <Route path="/dashboard" element={<WKMyTasks />} />
          <Route path="/dashboard/attendance" element={<WKAttendance />} />
          <Route path="/dashboard/leave-request" element={<WKLeaveRequest />} />
          <Route path="/dashboard/notifications" element={<WKNotifications />} />
        </Routes>
      </Layout>
    );
  }

  // Unknown role
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-center">
        <p className="text-white mb-4">Unknown role: {role}</p>
        <button onClick={signOut} className="text-red-400 text-sm">Sign Out</button>
      </div>
    </div>
  );
}
