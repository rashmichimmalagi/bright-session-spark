import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { GlassCard } from './GlassCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '@/lib/auth-context';
import {
  sessionsService, attendanceService, assignmentsService, submissionsService,
  resourcesService, summariesService, qrTokensService, studentsService,
  useRealtimeRefresh, DEPARTMENTS,
  type Student, type Session, type Assignment, type AttendanceRecord,
  type Submission, type Resource, type SessionSummary,
} from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#f87171', '#4ade80'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [summaries, setSummaries] = useState<SessionSummary[]>([]);

  const refresh = useCallback(async () => {
    const [st, se, as, at, su, re, sm] = await Promise.all([
      studentsService.list(), sessionsService.list(), assignmentsService.list(),
      attendanceService.list(), submissionsService.list(), resourcesService.list(), summariesService.list(),
    ]);
    setStudents(st); setSessions(se); setAssignments(as);
    setAttendance(at); setSubmissions(su); setResources(re); setSummaries(sm);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useRealtimeRefresh(['sessions','attendance','assignments','submissions','resources','session_summaries','profiles'], refresh);

  const pending = students.filter(s => s.status === 'pending');

  return (
    <div className="fade-in-up">
      <h1 className="text-2xl font-heading font-bold mb-6">Admin Dashboard</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="glass mb-6 p-1 flex-wrap h-auto">
          {['overview','students','sessions','scanner','assignments','resources','summaries','analytics'].map(t => (
            <TabsTrigger key={t} value={t} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground capitalize">
              {t}{t === 'students' && pending.length > 0 ? ` (${pending.length})` : ''}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { l: 'Total Students', v: students.length },
              { l: 'Pending Approvals', v: pending.length },
              { l: 'Total Sessions', v: sessions.length },
              { l: 'Attendance Records', v: attendance.length },
            ].map(s => (
              <GlassCard key={s.l} className="text-center">
                <p className="text-3xl font-heading font-bold text-primary">{s.v}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.l}</p>
              </GlassCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="students"><StudentsTab students={students} /></TabsContent>
        <TabsContent value="sessions"><SessionsTab sessions={sessions} attendance={attendance} /></TabsContent>
        <TabsContent value="scanner"><ScannerTab sessions={sessions} attendance={attendance} students={students} /></TabsContent>
        <TabsContent value="assignments"><AssignmentsTab sessions={sessions} assignments={assignments} submissions={submissions} students={students} /></TabsContent>
        <TabsContent value="resources"><ResourcesTab sessions={sessions} resources={resources} /></TabsContent>
        <TabsContent value="summaries"><SummariesTab sessions={sessions} summaries={summaries} students={students} /></TabsContent>
        <TabsContent value="analytics"><AnalyticsTab sessions={sessions} students={students} attendance={attendance} /></TabsContent>
      </Tabs>
    </div>
  );
}

function StudentsTab({ students }: { students: Student[] }) {
  const pending = students.filter(s => s.status === 'pending');
  const approved = students.filter(s => s.status === 'approved');
  const rejected = students.filter(s => s.status === 'rejected');

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try { await studentsService.setStatus(id, status); toast.success(`Student ${status}`); }
    catch (e: any) { toast.error(e?.message ?? 'Failed'); }
  };

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="font-heading font-semibold mb-3 text-warning">Pending Approvals ({pending.length})</h3>
          <div className="space-y-2">
            {pending.map(s => (
              <GlassCard key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.usn} • {s.department} • {s.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="success" size="sm" onClick={() => handleAction(s.id, 'approved')}>Approve</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleAction(s.id, 'rejected')}>Reject</Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
      <div>
        <h3 className="font-heading font-semibold mb-3">Approved ({approved.length})</h3>
        {approved.length === 0 ? <GlassCard className="text-center py-6"><p className="text-muted-foreground">No approved students</p></GlassCard> :
          <div className="space-y-2">{approved.map(s => (
            <GlassCard key={s.id} className="py-3 flex items-center justify-between">
              <div><p className="font-medium">{s.name}</p><p className="text-sm text-muted-foreground">{s.usn} • {s.department}</p></div>
              <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">Approved</span>
            </GlassCard>
          ))}</div>
        }
      </div>
      {rejected.length > 0 && (
        <div>
          <h3 className="font-heading font-semibold mb-3 text-destructive">Rejected ({rejected.length})</h3>
          <div className="space-y-2">{rejected.map(s => (
            <GlassCard key={s.id} className="py-3 opacity-60">
              <p className="font-medium">{s.name}</p><p className="text-sm text-muted-foreground">{s.usn} • {s.department}</p>
            </GlassCard>
          ))}</div>
        </div>
      )}
    </div>
  );
}

function SessionsTab({ sessions, attendance }: { sessions: Session[]; attendance: AttendanceRecord[] }) {
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const empty = {
    name: '', date: '', time: '', venue: '', hostedBy: '', resourcePerson: '',
    volunteerCount: 0, volunteerNames: [] as string[], description: '', maxCapacity: 100,
  };
  const [form, setForm] = useState(empty);

  const openCreate = () => { setForm(empty); setEditing(null); setShow(true); };
  const openEdit = (s: Session) => {
    setForm({
      name: s.name, date: s.date, time: s.time, venue: s.venue,
      hostedBy: s.hostedBy, resourcePerson: s.resourcePerson,
      volunteerCount: s.volunteerCount, volunteerNames: s.volunteerNames,
      description: s.description, maxCapacity: s.maxCapacity,
    });
    setEditing(s); setShow(true);
  };

  const setVolCount = (n: number) => {
    const safe = Math.max(0, Math.min(50, n || 0));
    const names = [...form.volunteerNames];
    while (names.length < safe) names.push('');
    names.length = safe;
    setForm({ ...form, volunteerCount: safe, volunteerNames: names });
  };
  const setVolName = (i: number, v: string) => {
    const names = [...form.volunteerNames]; names[i] = v;
    setForm({ ...form, volunteerNames: names });
  };

  const handleSave = async () => {
    if (!form.name || !form.date || !form.time || !form.venue) { toast.error('Fill required fields'); return; }
    const today = new Date(); today.setHours(0,0,0,0);
    const selectedDate = new Date(form.date + 'T00:00:00');
    if (isNaN(selectedDate.getTime())) { toast.error('Invalid date'); return; }
    if (selectedDate < today) { toast.error('Past dates are not allowed'); return; }
    const now = new Date();
    const isToday = selectedDate.getTime() === today.getTime();
    if (isToday) {
      const [hh, mm] = form.time.split(':').map(Number);
      const sessionDateTime = new Date();
      sessionDateTime.setHours(hh || 0, mm || 0, 0, 0);
      if (sessionDateTime < now) { toast.error('Selected session time has already passed'); return; }
    }
    try {
      const cleanVols = form.volunteerNames.map(v => v.trim()).filter(Boolean);
      if (editing) {
        await sessionsService.update(editing.id, { ...form, volunteerNames: cleanVols, volunteerCount: form.volunteerCount });
        toast.success('Session updated');
      } else {
        await sessionsService.create({ ...form, volunteerNames: cleanVols, status: 'upcoming' });
        toast.success('Session created');
      }
      setShow(false);
    } catch (e: any) { toast.error(e?.message ?? 'Failed'); }
  };

  const handleStatus = async (id: string, status: Session['status']) => {
    if (status === 'live') {
      const existing = sessions.find(s => s.status === 'live');
      if (existing && existing.id !== id) { toast.error('Another session is already live. Close it first.'); return; }
    }
    try { await sessionsService.update(id, { status }); toast.success(`Session ${status}`); }
    catch (e: any) { toast.error(e?.message ?? 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    try { await sessionsService.remove(id); toast.success('Session deleted'); }
    catch (e: any) { toast.error(e?.message ?? 'Failed'); }
  };

  const u = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-heading font-semibold">Sessions ({sessions.length})</h3>
        <Button variant="glow" size="sm" onClick={openCreate}>+ Create Session</Button>
      </div>

      {show && (
        <GlassCard className="mb-6">
          <h4 className="font-semibold mb-4">{editing ? 'Edit Session' : 'New Session'}</h4>
          <div className="flex flex-col gap-4">
            <div><Label>Session Name *</Label><Input value={form.name} onChange={e => u('name', e.target.value)} placeholder="e.g. Intro to Machine Learning" autoComplete="off" className="mt-1.5 bg-secondary/50" /></div>
            <div><Label>Date *</Label><Input type="date" min={new Date().toISOString().split('T')[0]} value={form.date} onChange={e => u('date', e.target.value)} className="mt-1.5 bg-secondary/50" /></div>
            <div><Label>Timing *</Label><Input type="time" min={form.date === new Date().toISOString().split('T')[0] ? new Date().toTimeString().slice(0,5) : undefined} value={form.time} onChange={e => u('time', e.target.value)} className="mt-1.5 bg-secondary/50" /></div>
            <div><Label>Venue *</Label><Input value={form.venue} onChange={e => u('venue', e.target.value)} placeholder="e.g. Seminar Hall A" autoComplete="off" className="mt-1.5 bg-secondary/50" /></div>
            <div><Label>Hosted By</Label><Input value={form.hostedBy} onChange={e => u('hostedBy', e.target.value)} placeholder="Department or club" autoComplete="off" className="mt-1.5 bg-secondary/50" /></div>
            <div><Label>Resource Person</Label><Input value={form.resourcePerson} onChange={e => u('resourcePerson', e.target.value)} placeholder="Name of speaker" autoComplete="off" className="mt-1.5 bg-secondary/50" /></div>
            <div>
              <Label>Number of Volunteers</Label>
              <Input type="number" min={0} max={50} value={form.volunteerCount}
                onChange={e => setVolCount(parseInt(e.target.value || '0'))}
                className="mt-1.5 bg-secondary/50" />
            </div>
            {form.volunteerCount > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: form.volunteerCount }).map((_, i) => (
                  <div key={i}>
                    <Label>Volunteer {i + 1} Name</Label>
                    <Input value={form.volunteerNames[i] ?? ''} onChange={e => setVolName(i, e.target.value)}
                      placeholder={`Volunteer ${i + 1}`} autoComplete="off" className="mt-1.5 bg-secondary/50" />
                  </div>
                ))}
              </div>
            )}
            <div><Label>Session Description</Label><textarea value={form.description} onChange={e => u('description', e.target.value)} rows={3} placeholder="Brief description of what the session covers" className="mt-1.5 w-full rounded-md border border-border/50 bg-secondary/50 px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="glow" size="sm" onClick={handleSave}>Save</Button>
            <Button variant="ghost" size="sm" onClick={() => setShow(false)}>Cancel</Button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-3">
        {sessions.length === 0 ? <GlassCard className="text-center py-8"><p className="text-muted-foreground">No sessions created</p></GlassCard> :
          sessions.map(s => {
            const count = attendance.filter(a => a.sessionId === s.id).length;
            return (
              <GlassCard key={s.id} className="py-4" glow={s.status === 'live' ? 'success' : undefined}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-lg">{s.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'live' ? 'bg-success/20 text-success animate-pulse' : s.status === 'upcoming' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{s.status}</span>
                    </div>
                    <p className="text-sm"><span className="text-muted-foreground">Date:</span> {s.date}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Timing:</span> {s.time}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Venue:</span> {s.venue}</p>
                    {s.hostedBy && <p className="text-sm"><span className="text-muted-foreground">Hosted By:</span> {s.hostedBy}</p>}
                    {s.resourcePerson && <p className="text-sm"><span className="text-muted-foreground">Resource Person:</span> {s.resourcePerson}</p>}
                    {s.volunteerNames.length > 0 && <p className="text-sm"><span className="text-muted-foreground">Volunteers:</span> {s.volunteerNames.join(', ')}</p>}
                    {s.description && <p className="text-sm mt-2"><span className="text-muted-foreground">Description:</span> {s.description}</p>}
                    <p className="text-xs text-muted-foreground mt-2">Attendance: {count}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {s.status === 'upcoming' && <Button variant="success" size="sm" onClick={() => handleStatus(s.id, 'live')}>Start</Button>}
                    {s.status === 'live' && <Button variant="destructive" size="sm" onClick={() => handleStatus(s.id, 'closed')}>Close</Button>}
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive">Delete</Button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
      </div>
    </div>
  );
}

function ScannerTab({ sessions, attendance, students }: { sessions: Session[]; attendance: AttendanceRecord[]; students: Student[] }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const scannerRef = useRef<any>(null);
  const liveSession = sessions.find(s => s.status === 'live');

  const handleScan = async (data: string) => {
    try {
      const qr = JSON.parse(data);
      if (!qr.u || !qr.s || !qr.t || !qr.ex) return setResult({ success: false, message: 'Invalid QR format' });
      if (Date.now() > qr.ex) { setResult({ success: false, message: 'QR code expired' }); toast.error('QR expired'); return; }
      if (await qrTokensService.isUsed(qr.t)) { setResult({ success: false, message: 'QR already used (anti-proxy)' }); toast.error('Duplicate QR'); return; }
      const session = sessions.find(s => s.id === qr.s);
      if (!session || session.status !== 'live') return setResult({ success: false, message: 'Session not live' });
      const student = students.find(s => s.id === qr.u);
      if (!student) return setResult({ success: false, message: 'Student not found' });
      if (student.status !== 'approved') return setResult({ success: false, message: 'Student not approved' });
      if (attendance.some(a => a.studentId === student.id && a.sessionId === session.id)) {
        setResult({ success: false, message: 'Already marked' });
        toast.warning('Already marked'); return;
      }
      await qrTokensService.markUsed(qr.t, session.id);
      await attendanceService.mark(session.id, student.id);
      setResult({ success: true, message: `✓ ${student.name} (${student.usn}) marked present` });
      toast.success(`Attendance marked for ${student.name}`);
    } catch (e: any) {
      setResult({ success: false, message: e?.message ?? 'Invalid QR data' });
    }
  };

  const startScan = async () => {
    setScanning(true); setResult(null);
    try {
      // Permission preflight (mobile-friendly)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        stream.getTracks().forEach(t => t.stop());
        setPermissionState('granted');
      } catch {
        setPermissionState('denied');
        toast.error('Camera permission denied. Enable it in your browser settings.');
        setScanning(false); return;
      }
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      const w = Math.min(window.innerWidth - 80, 280);
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: w, height: w } },
        (text) => { handleScan(text); scanner.stop().then(() => setScanning(false)).catch(() => {}); },
        () => {}
      );
    } catch (e: any) {
      toast.error(e?.message ?? 'Camera not available');
      setScanning(false);
    }
  };

  const stopScan = () => { scannerRef.current?.stop?.().then(() => setScanning(false)).catch(() => setScanning(false)); };
  useEffect(() => () => { scannerRef.current?.stop?.().catch(() => {}); }, []);

  const recent = liveSession ? attendance.filter(a => a.sessionId === liveSession.id).slice(0, 10) : [];
  const isHttps = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

  return (
    <div className="max-w-lg mx-auto">
      <GlassCard glow={liveSession ? 'success' : undefined}>
        <h3 className="font-heading font-semibold mb-4 text-center">QR Scanner</h3>
        {!isHttps && <p className="text-center text-warning text-sm mb-3">⚠ Camera requires HTTPS on mobile.</p>}
        {!liveSession ? (
          <p className="text-center text-muted-foreground py-8">No live session. Start a session first to scan QR codes.</p>
        ) : (
          <>
            <p className="text-sm text-center text-muted-foreground mb-4">Scanning for: <span className="text-primary font-medium">{liveSession.name}</span></p>
            <div className="flex justify-center mb-4">
              {!scanning ? <Button variant="glow" onClick={startScan}>Start Scanner</Button> : <Button variant="destructive" onClick={stopScan}>Stop Scanner</Button>}
            </div>
            <div id="qr-reader" className="rounded-xl overflow-hidden mb-4" />
            {permissionState === 'denied' && (
              <p className="text-center text-destructive text-sm mb-3">Camera access denied. Please allow camera in your browser settings and reload.</p>
            )}
            {result && (
              <div className={`rounded-lg p-4 text-center ${result.success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                <p className="font-medium">{result.message}</p>
              </div>
            )}
          </>
        )}
      </GlassCard>

      {liveSession && recent.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Recent Attendance ({recent.length})</h4>
          {recent.map(a => (
            <GlassCard key={a.id} className="py-3 mb-2">
              <p className="font-medium">{a.studentName}</p>
              <p className="text-xs text-muted-foreground">{a.studentUsn} • {a.department} • {new Date(a.markedAt).toLocaleTimeString()}</p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

async function uploadToBucket(bucket: string, file: File, prefix = ''): Promise<{ url: string | null; name: string }> {
  const path = `${prefix}${prefix ? '/' : ''}${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
  return { url: data?.signedUrl ?? null, name: file.name };
}

function AssignmentsTab({ sessions, assignments, submissions, students }: { sessions: Session[]; assignments: Assignment[]; submissions: Submission[]; students: Student[] }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ sessionId: '', title: '', description: '', deadline: '', allowResubmit: true });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!form.sessionId || !form.title) { toast.error('Session and title are required'); return; }
    if (form.deadline) {
      const dl = new Date(form.deadline);
      if (isNaN(dl.getTime())) { toast.error('Invalid deadline'); return; }
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dlDay = new Date(dl.getFullYear(), dl.getMonth(), dl.getDate());
      if (dlDay < today) { toast.error('Past dates are not allowed'); return; }
      if (dl.getTime() <= now.getTime()) { toast.error('Selected deadline time has already passed'); return; }
    }
    setUploading(true);
    try {
      let fileUrl: string | null = null, fileName: string | null = null;
      if (file) {
        const r = await uploadToBucket('assignments', file);
        fileUrl = r.url; fileName = r.name;
      }
      await assignmentsService.create({
        sessionId: form.sessionId, title: form.title, description: form.description,
        fileUrl, fileName,
        deadlineAt: form.deadline ? new Date(form.deadline).toISOString() : null,
        allowResubmit: form.allowResubmit,
      });
      toast.success('Assignment created');
      setShow(false); setForm({ sessionId: '', title: '', description: '', deadline: '', allowResubmit: true }); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: any) { toast.error(e?.message ?? 'Failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    try { await assignmentsService.remove(id); toast.success('Assignment deleted'); }
    catch (e: any) { toast.error(e?.message ?? 'Failed'); }
  };

  const u = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-heading font-semibold">Assignments ({assignments.length})</h3>
        <Button variant="glow" size="sm" onClick={() => setShow(!show)}>+ Create</Button>
      </div>
      {show && (
        <GlassCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Session *</Label>
              <select value={form.sessionId} onChange={e => u('sessionId', e.target.value)} className="mt-1 w-full rounded-md border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground">
                <option value="">Select session</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><Label>Title *</Label><Input value={form.title} onChange={e => u('title', e.target.value)} autoComplete="off" className="mt-1 bg-secondary/50" /></div>
            <div><Label>Deadline</Label><Input type="datetime-local" min={new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)} value={form.deadline} onChange={e => u('deadline', e.target.value)} className="mt-1 bg-secondary/50" /></div>
            <div className="flex items-end gap-2">
              <input id="allow-resub" type="checkbox" checked={form.allowResubmit} onChange={e => u('allowResubmit', e.target.checked)} />
              <label htmlFor="allow-resub" className="text-sm">Allow re-submissions before deadline</label>
            </div>
            <div className="md:col-span-2"><Label>Description</Label><textarea value={form.description} onChange={e => u('description', e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-border/50 bg-secondary/50 px-3 py-2 text-sm" /></div>
            <div className="md:col-span-2">
              <Label>Attachment</Label>
              <div className="mt-1 flex items-center gap-2">
                <input ref={fileRef} type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} className="hidden" />
                <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>Choose File</Button>
                <span className="text-xs text-muted-foreground">{file ? file.name : 'No file selected'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="glow" size="sm" onClick={handleCreate} disabled={uploading}>{uploading ? 'Uploading…' : 'Create'}</Button>
            <Button variant="ghost" size="sm" onClick={() => setShow(false)}>Cancel</Button>
          </div>
        </GlassCard>
      )}
      <div className="space-y-2">
        {assignments.length === 0 ? <GlassCard className="text-center py-8"><p className="text-muted-foreground">No assignments</p></GlassCard> :
          assignments.map(a => {
            const subs = submissions.filter(s => s.assignmentId === a.id);
            const sessionName = sessions.find(s => s.id === a.sessionId)?.name ?? '—';
            return (
              <GlassCard key={a.id} className="py-4">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-semibold">{a.title}</h4>
                    <p className="text-sm text-muted-foreground">{sessionName}{a.deadlineAt ? ` • Due ${new Date(a.deadlineAt).toLocaleString()}` : ''}</p>
                    {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                    {a.fileUrl && <a href={a.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">📎 {a.fileName}</a>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setOpenId(openId === a.id ? null : a.id)} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">{subs.length} submissions</button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} className="text-destructive">Delete</Button>
                  </div>
                </div>
                {openId === a.id && (
                  <div className="mt-4 border-t border-border/30 pt-3 space-y-2">
                    {subs.length === 0 ? <p className="text-sm text-muted-foreground">No submissions yet</p> :
                      subs.map(s => {
                        const st = students.find(x => x.id === s.studentId);
                        return (
                          <div key={s.id} className="bg-secondary/30 rounded-md p-3 text-sm">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <p className="font-medium">{st?.name ?? 'Student'} <span className="text-muted-foreground text-xs">{st?.usn}</span></p>
                                <p className="text-xs text-muted-foreground">{new Date(s.submittedAt).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs flex items-center gap-1">
                                  <input type="checkbox" checked={s.reviewed} onChange={e => submissionsService.setReviewed(s.id, e.target.checked).catch(err => toast.error(err.message))} />
                                  Reviewed
                                </label>
                              </div>
                            </div>
                            {s.fileUrl && <a href={s.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline block mt-1">📎 {s.fileName}</a>}
                            {s.links.length > 0 && (
                              <ul className="mt-1 text-xs space-y-0.5">
                                {s.links.map((l, i) => <li key={i}><a href={l} target="_blank" rel="noreferrer" className="text-primary hover:underline">{l}</a></li>)}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </GlassCard>
            );
          })}
      </div>
    </div>
  );
}

function ResourcesTab({ sessions, resources }: { sessions: Session[]; resources: Resource[] }) {
  const [form, setForm] = useState({ sessionId: '', title: '', linkUrl: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!form.sessionId || !form.title) { toast.error('Session and title required'); return; }
    if (!file && !form.linkUrl) { toast.error('Add a file or link'); return; }
    setUploading(true);
    try {
      let fileUrl: string | null = null, fileName: string | null = null;
      if (file) { const r = await uploadToBucket('resources', file); fileUrl = r.url; fileName = r.name; }
      await resourcesService.create({ sessionId: form.sessionId, title: form.title, fileUrl, fileName, linkUrl: form.linkUrl || null });
      toast.success('Resource added');
      setForm({ sessionId: '', title: '', linkUrl: '' }); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: any) { toast.error(e?.message ?? 'Failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    try { await resourcesService.remove(id); toast.success('Deleted'); }
    catch (e: any) { toast.error(e?.message ?? 'Failed'); }
  };

  const u = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <GlassCard className="mb-6">
        <h3 className="font-heading font-semibold mb-3">Add Resource</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Session *</Label>
            <select value={form.sessionId} onChange={e => u('sessionId', e.target.value)} className="mt-1 w-full rounded-md border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground">
              <option value="">Select session</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><Label>Title *</Label><Input value={form.title} onChange={e => u('title', e.target.value)} autoComplete="off" className="mt-1 bg-secondary/50" /></div>
          <div className="md:col-span-2">
            <Label>Attach</Label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input ref={fileRef} type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} className="hidden" />
              <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>Choose File</Button>
              <span className="text-xs text-muted-foreground">{file ? file.name : 'No file selected'}</span>
              <div className="flex-1 min-w-[180px]">
                <Input value={form.linkUrl} onChange={e => u('linkUrl', e.target.value)} placeholder="Or paste a link (Drive, GitHub, …)" autoComplete="off" className="bg-secondary/50" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="glow" size="sm" onClick={handleCreate} disabled={uploading}>{uploading ? 'Uploading…' : 'Add Resource'}</Button>
        </div>
      </GlassCard>

      <div className="space-y-2">
        {resources.length === 0 ? <GlassCard className="text-center py-8"><p className="text-muted-foreground">No resources</p></GlassCard> :
          resources.map(r => {
            const sessionName = sessions.find(s => s.id === r.sessionId)?.name ?? '—';
            return (
              <GlassCard key={r.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{sessionName}</p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {r.fileUrl && <a href={r.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">📎 {r.fileName}</a>}
                      {r.linkUrl && <a href={r.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">🔗 {r.linkUrl}</a>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-destructive">Delete</Button>
                </div>
              </GlassCard>
            );
          })}
      </div>
    </div>
  );
}

function SummariesTab({ sessions, summaries, students }: { sessions: Session[]; summaries: SessionSummary[]; students: Student[] }) {
  const [filter, setFilter] = useState<string>('all');
  const list = filter === 'all' ? summaries : summaries.filter(s => s.sessionId === filter);
  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-heading font-semibold">Student Summaries ({summaries.length})</h3>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-md border border-border/50 bg-secondary/50 px-3 py-1.5 text-sm text-foreground">
          <option value="all">All sessions</option>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        {list.length === 0 ? <GlassCard className="text-center py-8"><p className="text-muted-foreground">No summaries yet</p></GlassCard> :
          list.map(sm => {
            const st = students.find(x => x.id === sm.studentId);
            const se = sessions.find(x => x.id === sm.sessionId);
            return (
              <GlassCard key={sm.id} className="py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{st?.name ?? 'Student'} <span className="text-xs text-muted-foreground">{st?.usn}</span></p>
                  <p className="text-xs text-muted-foreground">{new Date(sm.updatedAt).toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{se?.name}</p>
                <p className="text-sm whitespace-pre-wrap">{sm.content}</p>
              </GlassCard>
            );
          })}
      </div>
    </div>
  );
}

function AnalyticsTab({ sessions, students, attendance }: { sessions: Session[]; students: Student[]; attendance: AttendanceRecord[] }) {
  const approved = students.filter(s => s.status === 'approved');
  const sessionData = sessions.filter(s => s.status === 'closed' || s.status === 'live').map(s => ({
    name: s.name.length > 15 ? s.name.slice(0, 15) + '…' : s.name,
    attendance: attendance.filter(a => a.sessionId === s.id).length,
    capacity: s.maxCapacity,
  }));
  const deptData = DEPARTMENTS.map(d => ({
    name: d, count: attendance.filter(a => a.department === d).length,
  })).filter(d => d.count > 0);
  const closedCount = sessions.filter(s => s.status === 'closed').length;
  const avgAttendance = closedCount > 0 ? Math.round(attendance.length / closedCount) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: 'Total Sessions', v: sessions.length },
          { l: 'Avg Attendance', v: avgAttendance },
          { l: 'Total Records', v: attendance.length },
          { l: 'Approved Students', v: approved.length },
        ].map(s => (
          <GlassCard key={s.l} className="text-center">
            <p className="text-3xl font-heading font-bold text-primary">{s.v}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.l}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="font-heading font-semibold mb-4">Attendance per Session</h3>
          {sessionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sessionData}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'rgba(15,15,30,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="attendance" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-8">No data yet</p>}
        </GlassCard>

        <GlassCard>
          <h3 className="font-heading font-semibold mb-4">Department Distribution</h3>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={deptData} cx="50%" cy="50%" outerRadius={80} dataKey="count" label={((props: any) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`) as any}>
                  {deptData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15,15,30,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-8">No data yet</p>}
        </GlassCard>
      </div>
    </div>
  );
}
