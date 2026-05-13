import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ParticleBackground } from "@/components/ParticleBackground";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login/admin")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    const result = await loginAdmin(identifier, password);
    if (result.success) {
      toast.success('Admin login successful!');
      navigate({ to: '/dashboard/admin' });
    } else {
      toast.error(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <ParticleBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 fade-in-up">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">← Home</Link>
          <h1 className="text-3xl font-heading font-bold gradient-text mt-4">Admin Login</h1>
        </div>
        <GlassCard className="fade-in-up-delay-1">
          <div className="space-y-4">
            <div>
              <Label>Admin ID or Email</Label>
              <Input value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="Enter Admin ID or Email" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} className="mt-1 bg-secondary/50 border-border/50" />
            </div>
            <div>
              <Label>Password</Label>
              <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter Password"
                className="mt-1 bg-secondary/50 border-border/50" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <Button variant="glow" className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
          <div className="text-right mt-3">
            <Link to="/forgot-password" search={{ role: 'admin' }} className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
