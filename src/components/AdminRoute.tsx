import { Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { Loader2 } from "lucide-react";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
