import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import StudentDashboard from "@/components/StudentDashboard";

export const Route = createFileRoute("/dashboard/student")({
  component: StudentDashboardRoute,
});

function StudentDashboardRoute() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && (!user || user.type !== 'student')) navigate({ to: '/login/student' });
  }, [loading, user, navigate]);
  if (loading || !user || user.type !== 'student') return null;
  return <StudentDashboard />;
}
