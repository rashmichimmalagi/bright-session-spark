import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import AdminDashboard from "@/components/AdminDashboard";

export const Route = createFileRoute("/dashboard/admin")({
  component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && (!user || user.type !== 'admin')) navigate({ to: '/login/admin' });
  }, [loading, user, navigate]);
  if (loading || !user || user.type !== 'admin') return null;
  return <AdminDashboard />;
}
