import { Navigate } from "react-router";
import { isAdminAuthenticated } from "~/services/adminAuth";

interface Props {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: Props) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
