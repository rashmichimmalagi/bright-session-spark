import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/' });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen gradient-bg">
      <ParticleBackground />
      <nav className="glass-strong border-b border-border/30 px-6 py-3 flex items-center justify-between relative z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">SA</span>
            </div>
            <span className="font-heading font-semibold hidden sm:inline">Smart Attendance Hub</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.type === 'student' ? user.usn : user.adminId}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">{user.name.charAt(0)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            Logout
          </Button>
        </div>
      </nav>
      <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
