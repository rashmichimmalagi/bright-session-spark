import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { toast } from 'sonner';
const QRCode = lazy(() => import('react-qr-code'));
import { GlassCard } from './GlassCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '@/lib/auth-context';
import {
  sessionsService, attendanceService, assignmentsService, submissionsService,
  resourcesService, summariesService, useRealtimeRefresh,
  type Session, type AttendanceRecord, type Assignment, type Submission, type Resource, type SessionSummary,
} from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';

export default function StudentDashboard() {
  const { user } = useAuth();
  const studentId = user?.id || '';
  const [tab, setTab] = useState('overview');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [mySummaries, setMySummaries] = useState<SessionSummary[]>([]);
  const [qrData, setQrData] = useState('');
  const [qrExpiry, setQrExpiry] = useState(0);

  const refresh = useCallback(async () => {
    if (!studentId) return;
    const [se, at, as, su, re, sm] = await Promise.all([
      sessionsService.list(),
      attendanceService.list().then(all => all.filter(a => a.studentId === studentId)),
      assignmentsService.list(),
      submissionsService.getByStudent(studentId),
      resourcesService.list(),
      summariesService.getByStudent(studentId),
    ]);
    setSessions(se); setMyAttendance(at); setAssignments(as);
    setMySubmissions(su); setResources(re); setMySummaries(sm);
  }, [studentId]);

  useEffect(() => { refresh(); }, [refresh]);
  useRealtimeRefresh(['sessions','attendance','assignments','submissions','resources','session_summaries'], refresh);

  const liveSession = sessions.find(s => s.status === 'live');
  const attendedSessionIds = new Set(myAttendance.map(a => a.sessionId));
  const myAssignments = assignments.filter(a => attendedSessionIds.has(a.sessionId));
  const myResources = resources.filter(r => attendedSessionIds.has(r.sessionId));
  const closedCount = sessions.filter(s => s.status === 'closed').length;
  const attendanceRate = closedCount > 0 ? Math.round((myAttendance.length / closedCount) * 100) : 0;

  const generateQR = useCallback(() => {
    if (!liveSession || !studentId) return;
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const data = JSON.stringify({ u: studentId, s: liveSession.id, t: token, ts: Date.now(), ex: Date.now() + 30000 });
    setQrData(data);
    setQrExpiry(30);
  }, [liveSession, studentId]);

  useEffect(() => {
    if (qrExpiry <= 0) return;
    const iv = setInterval(() => {
      setQrExpiry(p => {
        if (p <= 1) { generateQR(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [qrExpiry, generateQR]);

  return (
    <div className="fade-in-up">
      <h1 className="text-2xl font-heading font-bold mb-6">Welcome, {user?.name}</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="glass mb-6 p-1 flex-wrap h-auto">
          {['overview','qr','sessions','assignments','resources','summaries'].map(t => (
            <TabsTrigger key={t} value={t} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground capitalize">{t === 'qr' ? 'My QR' : t}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Sessions Attended', value: myAttendance.length },
              { label: 'Attendance Rate', value: `${attendanceRate}%` },
              { label: 'Assignments Due', value: myAssignments.filter(a => !a.deadlineAt || new Date(a.deadlineAt) > new Date()).length },
              { label: 'Submissions', value: mySubmissions.length },
            ].map(s => (
              <GlassCard key={s.label} className="text-center">
                <p className="text-3xl font-heading font-bold text-primary mb-1">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </GlassCard>
            ))}
          </div>
          {liveSession ? (
            <GlassCard glow="success" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-success animate-pulse" />
                <div>
                  <p className="font-semibold">SESSION LIVE NOW: {liveSession.name}</p>
                  <p className="text-sm text-muted-foreground">{liveSession.venue} • {liveSession.resourcePerson}</p>
                </div>
              </div>
              <Button variant="glow" size="sm" onClick={() => { setTab('qr'); generateQR(); }}>View My QR</Button>
            </GlassCard>
          ) : (
            <GlassCard className="text-center py-6"><p className="text-muted-foreground">No Session Live Currently</p></GlassCard>
          )}
        </TabsContent>

        <TabsContent value="qr">
          {liveSession ? (
            <div className="max-w-sm mx-auto text-center">
              <GlassCard glow="primary">
                <h2 className="text-lg font-heading font-semibold mb-2">Your Attendance QR</h2>
                <p className="text-sm text-muted-foreground mb-4">{liveSession.name}</p>
                {qrData ? (
                  <>
                    <div className="bg-white p-4 rounded-xl inline-block mb-4">
                      <Suspense fallback={<div className="w-[200px] h-[200px] bg-muted animate-pulse rounded" />}>
                        <QRCode value={qrData} size={200} />
                      </Suspense>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">Refreshes in</span>
                      <span className="text-lg font-mono font-bold text-primary">{qrExpiry}s</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(qrExpiry / 30) * 100}%` }} />
                    </div>
                  </>
                ) : (
                  <Button variant="glow" onClick={generateQR}>Generate QR Code</Button>
                )}
              </GlassCard>
            </div>
          ) : (
            <GlassCard className="text-center py-12">
              <p className="text-muted-foreground">No live session. QR will be available when a session is live.</p>
            </GlassCard>
          )}
        </TabsContent>

        <TabsContent value="sessions">
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <GlassCard className="text-center py-8"><p className="text-muted-foreground">No sessions yet</p></GlassCard>
            ) : sessions.map(s => (
              <GlassCard key={s.id}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{s.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'live' ? 'bg-success/20 text-success' : s.status === 'upcoming' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{s.status}</span>
                    </div>
                    <p className="text-sm"><span className="text-muted-foreground">Date:</span> {s.date} • <span className="text-muted-foreground">Timing:</span> {s.time}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Venue:</span> {s.venue}</p>
                    {s.hostedBy && <p className="text-sm"><span className="text-muted-foreground">Hosted By:</span> {s.hostedBy}</p>}
                    {s.resourcePerson && <p className="text-sm"><span className="text-muted-foreground">Resource Person:</span> {s.resourcePerson}</p>}
                    {s.volunteerNames.length > 0 && <p className="text-sm"><span className="text-muted-foreground">Volunteers:</span> {s.volunteerNames.join(', ')}</p>}
                    {s.description && <p className="text-sm mt-2 text-muted-foreground">{s.description}</p>}
                  </div>
                  {attendedSessionIds.has(s.id) && <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full whitespace-nowrap">✓ Attended</span>}
                </div>
              </GlassCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          <div className="space-y-3">
            {myAssignments.length === 0 ? (
              <GlassCard className="text-center py-8"><p className="text-muted-foreground">No assignments for attended sessions</p></GlassCard>
            ) : myAssignments.map(a => (
              <AssignmentCard key={a.id} assignment={a}
                sessionName={sessions.find(s => s.id === a.sessionId)?.name ?? '—'}
                studentId={studentId}
                existing={mySubmissions.find(s => s.assignmentId === a.id) ?? null}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <div className="space-y-2">
            {myResources.length === 0 ? <GlassCard className="text-center py-8"><p className="text-muted-foreground">No resources for attended sessions</p></GlassCard> :
              myResources.map(r => {
                const sn = sessions.find(s => s.id === r.sessionId)?.name ?? '—';
                return (
                  <GlassCard key={r.id} className="py-3">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{sn}</p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {r.fileUrl && <a href={r.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">📎 Download {r.fileName}</a>}
                      {r.linkUrl && <a href={r.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">🔗 Open Link</a>}
                    </div>
                  </GlassCard>
                );
              })
            }
          </div>
        </TabsContent>

        <TabsContent value="summaries">
          <div className="space-y-3">
            {myAttendance.length === 0 ? (
              <GlassCard className="text-center py-8"><p className="text-muted-foreground">Attend a session to write summaries.</p></GlassCard>
            ) : myAttendance.map(a => {
              const se = sessions.find(s => s.id === a.sessionId);
              const existing = mySummaries.find(s => s.sessionId === a.sessionId);
              return <SummaryCard key={a.id} sessionName={se?.name ?? '—'} sessionId={a.sessionId} studentId={studentId} existing={existing ?? null} />;
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function uploadSubmission(studentId: string, file: File): Promise<{ url: string | null; name: string }> {
  const path = `${studentId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await supabase.storage.from('submissions').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = await supabase.storage.from('submissions').createSignedUrl(path, 60 * 60 * 24 * 365);
  return { url: data?.signedUrl ?? null, name: file.name };
}

function AssignmentCard({ assignment: a, sessionName, studentId, existing }: { assignment: Assignment; sessionName: string; studentId: string; existing: Submission | null }) {
  const [links, setLinks] = useState<string[]>(existing?.links?.length ? existing.links : ['']);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const deadline = a.deadlineAt ? new Date(a.deadlineAt) : null;
  const isPast = !!deadline && deadline < new Date();
  const canEdit = !existing || (a.allowResubmit && !isPast);

  const handleSubmit = async () => {
    const validLinks = links.filter(l => l.trim());
    if (!file && validLinks.length === 0 && !existing?.fileUrl) { toast.error('Please upload a file or add a link'); return; }
    setUploading(true);
    try {
      let fileUrl = existing?.fileUrl ?? null, fileName = existing?.fileName ?? null;
      if (file) { const r = await uploadSubmission(studentId, file); fileUrl = r.url; fileName = r.name; }
      await submissionsService.upsert({ assignmentId: a.id, studentId, fileUrl, fileName, links: validLinks });
      toast.success('Assignment submitted');
      setFile(null); if (fileRef.current) fileRef.current.value = '';
    } catch (e: any) { toast.error(e?.message ?? 'Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
        <div>
          <h3 className="font-semibold">{a.title}</h3>
          {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
          <p className="text-xs text-muted-foreground mt-1">Session: {sessionName}{deadline ? ` • Due: ${deadline.toLocaleString()}` : ''}</p>
          {a.fileUrl && <a href={a.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">📎 {a.fileName}</a>}
        </div>
        {existing && <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">Submitted{existing.reviewed ? ' • Reviewed' : ''}</span>}
      </div>
      {canEdit ? (
        <div className="space-y-3 border-t border-border/30 pt-3">
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
            className={`border-2 border-dashed rounded-lg p-4 text-center text-sm cursor-pointer transition-colors ${drag ? 'border-primary bg-primary/5' : 'border-border/50'}`}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} className="hidden" />
            {file ? <p className="text-primary">📎 {file.name}</p> :
              existing?.fileName ? <p className="text-muted-foreground">Current: {existing.fileName} (drop or click to replace)</p> :
              <p className="text-muted-foreground">Drag &amp; drop or click to upload (PDF, DOC, PPT, images)</p>}
          </div>
          <div>
            <Label className="text-xs">Links (GitHub, Drive, deployed URL)</Label>
            {links.map((l, i) => (
              <Input key={i} value={l} onChange={e => { const n = [...links]; n[i] = e.target.value; setLinks(n); }} placeholder="https://…" autoComplete="off" className="mt-1 bg-secondary/50" />
            ))}
            <button onClick={() => setLinks([...links, ''])} className="text-xs text-primary hover:underline mt-1">+ Add link</button>
          </div>
          <Button variant="glow" size="sm" onClick={handleSubmit} disabled={uploading}>{uploading ? 'Uploading…' : existing ? 'Re-submit' : 'Submit Assignment'}</Button>
        </div>
      ) : isPast ? (
        <div className="bg-destructive/10 rounded-lg p-3 text-center"><span className="text-destructive text-sm">Deadline passed</span></div>
      ) : null}
    </GlassCard>
  );
}

function SummaryCard({ sessionName, sessionId, studentId, existing }: { sessionName: string; sessionId: string; studentId: string; existing: SessionSummary | null }) {
  const [content, setContent] = useState(existing?.content ?? '');
  const [saving, setSaving] = useState(false);
  const max = 1000;
  const handleSave = async () => {
    if (!content.trim()) { toast.error('Write something first'); return; }
    setSaving(true);
    try { await summariesService.upsert(sessionId, studentId, content.trim()); toast.success(existing ? 'Summary updated' : 'Summary submitted'); }
    catch (e: any) { toast.error(e?.message ?? 'Failed'); }
    finally { setSaving(false); }
  };
  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{sessionName}</h3>
        {existing && <span className="text-xs text-muted-foreground">Updated {new Date(existing.updatedAt).toLocaleString()}</span>}
      </div>
      <textarea value={content} onChange={e => setContent(e.target.value.slice(0, max))} rows={4}
        placeholder="Reflections, what you learned, suggestions for improvement…"
        className="w-full rounded-md border border-border/50 bg-secondary/50 px-3 py-2 text-sm" />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">{content.length}/{max}</span>
        <Button variant="glow" size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : existing ? 'Update' : 'Submit'}</Button>
      </div>
    </GlassCard>
  );
}
