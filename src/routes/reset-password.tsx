import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ParticleBackground } from "@/components/ParticleBackground";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase places a recovery session in the URL hash; the SDK consumes it on load.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (!password || !confirm) { toast.error('Please fill all fields'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated. Please sign in.');
    await supabase.auth.signOut();
    navigate({ to: '/login/student' });
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <ParticleBackground />
      <div className="relative z-10 w-full max-w-md">
        <h1 className="text-3xl font-heading font-bold gradient-text mb-6 text-center fade-in-up">Reset Password</h1>
        <GlassCard className="fade-in-up-delay-1">
          {!ready ? (
            <p className="text-sm text-muted-foreground text-center">Validating reset link…</p>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>New Password</Label>
                <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="mt-1 bg-secondary/50 border-border/50" />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <PasswordInput value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter Password" className="mt-1 bg-secondary/50 border-border/50" />
              </div>
              <Button variant="glow" className="w-full" onClick={handleReset} disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}