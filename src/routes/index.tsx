import { createFileRoute, Link } from "@tanstack/react-router";
import { ParticleBackground } from "@/components/ParticleBackground";
import { GlassCard } from "@/components/GlassCard";
import { useEffect, useState } from "react";
import { useLiveSession } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { user } = useAuth();
  const liveSession = useLiveSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      <ParticleBackground />
      <div className="relative z-10">
        {/* Nav */}
        <nav className="glass-strong border-b border-border/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">SA</span>
            </div>
            <span className="font-heading font-semibold text-lg">Smart Attendance Hub</span>
          </div>
          {user && (
            <Link to={user.type === 'admin' ? '/dashboard/admin' : '/dashboard/student'}>
              <Button variant="glow" size="sm">Dashboard</Button>
            </Link>
          )}
        </nav>

        {/* Hero */}
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          {/* Session Status */}
          {mounted && (
            <div className="fade-in-up mb-8 flex justify-center">
              {liveSession ? (
                <GlassCard className="pulse-glow max-w-xl w-full text-left border-success/40">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                    <span className="text-sm font-bold tracking-wide text-success">SESSION LIVE NOW</span>
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-2">{liveSession.name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div><span className="text-foreground/80">Timing:</span> {liveSession.time}</div>
                    <div><span className="text-foreground/80">Venue:</span> {liveSession.venue}</div>
                    {liveSession.hostedBy && <div><span className="text-foreground/80">Hosted By:</span> {liveSession.hostedBy}</div>}
                    {liveSession.resourcePerson && <div><span className="text-foreground/80">Resource Person:</span> {liveSession.resourcePerson}</div>}
                  </div>
                </GlassCard>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
                  <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
                  <span className="text-sm text-muted-foreground">No Sessions Live Currently</span>
                </div>
              )}
            </div>
          )}

          <h1 className="fade-in-up-delay-1 text-5xl md:text-7xl font-heading font-bold tracking-tight mb-6">
            <span className="gradient-text">Smart Attendance</span>
            <br />
            <span className="text-foreground">Hub</span>
          </h1>

          <p className="fade-in-up-delay-2 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Next-generation attendance management powered by QR technology.
            Real-time tracking, intelligent analytics, and seamless experience.
          </p>

          {/* Role Selection */}
          <div className="fade-in-up-delay-3 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
            <Link to="/login/student" className="block">
              <GlassCard className="hover-scale cursor-pointer text-center py-10 group transition-all duration-300 hover:border-primary/30">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 7l-9-5 9 5 9-5-9 5zm0-7v7" />
                  </svg>
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">Student</h3>
                <p className="text-sm text-muted-foreground">View sessions, scan QR, submit assignments</p>
              </GlassCard>
            </Link>

            <Link to="/login/admin" className="block">
              <GlassCard className="hover-scale cursor-pointer text-center py-10 group transition-all duration-300 hover:border-accent/30">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">Admin</h3>
                <p className="text-sm text-muted-foreground">Manage sessions, scan QR, view analytics</p>
              </GlassCard>
            </Link>
          </div>

          {/* Features */}
          <div className="fade-in-up-delay-4 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { label: 'QR Attendance', icon: '📱' },
              { label: 'Real-time Analytics', icon: '📊' },
              { label: 'Session Management', icon: '📋' },
              { label: 'Assignment Tracking', icon: '📝' },
            ].map(f => (
              <div key={f.label} className="glass rounded-lg p-4 text-center">
                <span className="text-2xl mb-2 block">{f.icon}</span>
                <span className="text-xs text-muted-foreground">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
