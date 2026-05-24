// Legacy stub - redirects to new dashboard
import { Navigate } from "react-router-dom";
export default function WorkerDashboard() {
  return <Navigate to="/dashboard" replace />;
}
