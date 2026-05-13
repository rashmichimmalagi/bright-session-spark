import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ParticleBackground } from "@/components/ParticleBackground";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { DEPARTMENTS } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [form, setForm] = useState({ name: '', usn: '', department: 'CSE', email: '', password: '', confirmPassword: '', adminId: '' });
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('Please fill all fields'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (role === 'student' && !form.usn) { toast.error('USN is required'); return; }
    if (role === 'admin' && !form.adminId) { toast.error('Admin ID is required'); return; }

    setLoading(true);
    const metadata: Record<string, string> = { name: form.name, role };
    if (role === 'student') { metadata.usn = form.usn.toUpperCase(); metadata.department = form.department; }
    else { metadata.admin_id = form.adminId; }

    const { error } = await supabase.auth.signUp({
      email: form.email.toLowerCase(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login/${role}`,
        data: metadata,
      },
    });
    if (error) {
      setLoading(false);
      const msg = error.message.toLowerCase();
      if (msg.includes('already') || msg.includes('registered')) toast.error('Email already registered');
      else if (msg.includes('duplicate') && msg.includes('usn')) toast.error('USN already registered');
      else if (msg.includes('duplicate') && msg.includes('admin')) toast.error('Admin ID already registered');
      else toast.error(error.message);
      return;
    }
    // Auto-confirm enabled — sign in immediately
    await supabase.auth.signInWithPassword({ email: form.email.toLowerCase(), password: form.password });
    await refresh();
    setLoading(false);
    toast.success('Account created!');
    if (role === 'admin') navigate({ to: '/dashboard/admin' });
    else {
      // students must wait for approval — sign out and route to login
      await supabase.auth.signOut();
      toast.info('Awaiting admin approval before you can sign in.');
      navigate({ to: '/login/student' });
    }
  };

  const updateForm = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <ParticleBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 fade-in-up">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-heading font-bold gradient-text">Create Account</h1>
        </div>

        <GlassCard className="fade-in-up-delay-1">
            {/* Role Tabs */}
            <div className="flex gap-2 mb-6 p-1 rounded-lg bg-secondary/50">
              {(['student', 'admin'] as const).map(r => (
                <button key={r} onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${role === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {r === 'student' ? 'Student' : 'Admin'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="Enter your name" autoComplete="off" className="mt-1 bg-secondary/50 border-border/50" />
              </div>

              {role === 'student' ? (
                <>
                  <div>
                    <Label>USN (University Serial Number)</Label>
                    <Input value={form.usn} onChange={e => updateForm('usn', e.target.value)} placeholder="e.g. 1XX21CS001" autoComplete="off" autoCapitalize="characters" spellCheck={false} className="mt-1 bg-secondary/50 border-border/50" />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <select value={form.department} onChange={e => updateForm('department', e.target.value)}
                      className="mt-1 w-full rounded-md border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <Label>Admin ID</Label>
                  <Input value={form.adminId} onChange={e => updateForm('adminId', e.target.value)} placeholder="e.g. CSE_HOD, EventAdmin, Faculty123" autoComplete="off" spellCheck={false} className="mt-1 bg-secondary/50 border-border/50" />
                  <p className="text-xs text-muted-foreground mt-1">Choose any unique admin identifier.</p>
                </div>
              )}

              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="your@email.com" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} className="mt-1 bg-secondary/50 border-border/50" />
              </div>
              <div>
                <Label>Password</Label>
                <PasswordInput value={form.password} onChange={e => updateForm('password', e.target.value)} placeholder="Min 6 characters" className="mt-1 bg-secondary/50 border-border/50" />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <PasswordInput value={form.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} placeholder="Re-enter Password" className="mt-1 bg-secondary/50 border-border/50" />
              </div>

              <Button variant="glow" className="w-full" onClick={handleSignup} disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link to={role === 'student' ? '/login/student' : '/login/admin'} className="text-primary hover:underline">Sign in</Link>
            </p>
        </GlassCard>
      </div>
    </div>
  );
}
