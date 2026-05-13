import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ParticleBackground } from "@/components/ParticleBackground";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ role: z.enum(['student', 'admin']).default('student') });

export const Route = createFileRoute("/forgot-password")({
  validateSearch: (s) => searchSchema.parse(s),
  component: ForgotPassword,
});

function ForgotPassword() {
  const { role } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const loginPath = role === 'student' ? '/login/student' : '/login/admin';

  const handleUpdate = async () => {
    if (!email || !password || !confirm) return toast.error('Please fill all fields');
    if (password !== confirm) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('direct-password-reset', {
      body: { email: email.trim().toLowerCase(), password },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || 'Failed to update password');
      return;
    }
    toast.success('Password updated. Please sign in.');
    navigate({ to: loginPath });
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <ParticleBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 fade-in-up">
          <Link to={loginPath} className="text-muted-foreground hover:text-foreground transition-colors text-sm">← Back to login</Link>
          <h1 className="text-3xl font-heading font-bold gradient-text mt-4">Forgot Password</h1>
          <p className="text-sm text-muted-foreground mt-2">{role === 'student' ? 'Student' : 'Admin'} account recovery</p>
        </div>
        <GlassCard className="fade-in-up-delay-1">
          <div className="space-y-4">
            <div>
              <Label>Registered Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your registered email" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} className="mt-1 bg-secondary/50 border-border/50" />
            </div>
            <div>
              <Label>New Password</Label>
              <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="mt-1 bg-secondary/50 border-border/50" />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <PasswordInput value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter new password" className="mt-1 bg-secondary/50 border-border/50" onKeyDown={e => e.key === 'Enter' && handleUpdate()} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="glow" className="flex-1" onClick={handleUpdate} disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate({ to: loginPath })} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}