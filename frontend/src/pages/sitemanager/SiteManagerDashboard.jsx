// Legacy stub - redirects to new dashboard
import { Navigate } from "react-router-dom";
export default function SiteManagerDashboard() {
  return <Navigate to="/dashboard" replace />;
}
