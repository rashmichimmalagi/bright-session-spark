import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'ISE', 'AIML', 'DS'];

// ============ TYPES (mapped from DB rows) ============
export interface Student {
  id: string; name: string; usn: string; department: string;
  email: string; status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Session {
  id: string; name: string; date: string; time: string;
  venue: string; hostedBy: string; resourcePerson: string;
  description: string; volunteerCount: number; volunteerNames: string[];
  maxCapacity: number;
  status: 'upcoming' | 'live' | 'closed';
  createdBy: string | null; createdAt: string;
}

export interface AttendanceRecord {
  id: string; sessionId: string; studentId: string;
  studentName: string; studentUsn: string; department: string;
  markedBy: string | null; markedAt: string;
}

export interface Assignment {
  id: string; sessionId: string; sessionName?: string;
  title: string; description: string;
  fileUrl: string | null; fileName: string | null;
  deadlineAt: string | null; allowResubmit: boolean;
  createdBy: string | null; createdAt: string;
}

export interface Submission {
  id: string; assignmentId: string; studentId: string;
  fileUrl: string | null; fileName: string | null;
  links: string[]; reviewed: boolean;
  submittedAt: string; updatedAt: string;
}

export interface Resource {
  id: string; sessionId: string; title: string;
  fileUrl: string | null; fileName: string | null;
  linkUrl: string | null; createdBy: string | null; createdAt: string;
}

export interface SessionSummary {
  id: string; sessionId: string; studentId: string;
  content: string; createdAt: string; updatedAt: string;
}

// ============ MAPPERS ============
const mapSession = (r: any): Session => ({
  id: r.id, name: r.name, date: r.date, time: r.time,
  venue: r.venue, hostedBy: r.hosted_by ?? '', resourcePerson: r.resource_person ?? '',
  description: r.description ?? '', volunteerCount: r.volunteer_count ?? 0,
  volunteerNames: r.volunteer_names ?? [], maxCapacity: r.max_capacity ?? 100,
  status: r.status, createdBy: r.created_by, createdAt: r.created_at,
});
const mapAttendance = (r: any): AttendanceRecord => ({
  id: r.id, sessionId: r.session_id, studentId: r.student_id,
  studentName: r.student_name ?? '', studentUsn: r.student_usn ?? '', department: r.department ?? '',
  markedBy: r.marked_by, markedAt: r.marked_at,
});
const mapAssignment = (r: any): Assignment => ({
  id: r.id, sessionId: r.session_id, title: r.title, description: r.description ?? '',
  fileUrl: r.file_url, fileName: r.file_name, deadlineAt: r.deadline_at,
  allowResubmit: r.allow_resubmit, createdBy: r.created_by, createdAt: r.created_at,
});
const mapSubmission = (r: any): Submission => ({
  id: r.id, assignmentId: r.assignment_id, studentId: r.student_id,
  fileUrl: r.file_url, fileName: r.file_name, links: r.links ?? [],
  reviewed: r.reviewed, submittedAt: r.submitted_at, updatedAt: r.updated_at,
});
const mapResource = (r: any): Resource => ({
  id: r.id, sessionId: r.session_id, title: r.title,
  fileUrl: r.file_url, fileName: r.file_name, linkUrl: r.link_url,
  createdBy: r.created_by, createdAt: r.created_at,
});
const mapSummary = (r: any): SessionSummary => ({
  id: r.id, sessionId: r.session_id, studentId: r.student_id,
  content: r.content, createdAt: r.created_at, updatedAt: r.updated_at,
});
const mapStudent = (p: any): Student => ({
  id: p.id, name: p.name, usn: p.usn ?? '', department: p.department ?? '',
  email: p.email, status: p.status, createdAt: p.created_at,
});

// ============ SERVICES ============
export const sessionsService = {
  async list(): Promise<Session[]> {
    const { data } = await supabase.from('sessions').select('*').order('date', { ascending: false }).order('time', { ascending: false });
    return (data ?? []).map(mapSession);
  },
  async create(input: Omit<Session, 'id' | 'createdAt' | 'createdBy'> & { createdBy?: string | null }) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('sessions').insert({
      name: input.name, date: input.date, time: input.time, venue: input.venue,
      hosted_by: input.hostedBy, resource_person: input.resourcePerson,
      description: input.description, volunteer_count: input.volunteerCount,
      volunteer_names: input.volunteerNames, max_capacity: input.maxCapacity,
      status: input.status, created_by: user?.id ?? null,
    }).select().single();
    if (error) throw error;
    return mapSession(data);
  },
  async update(id: string, patch: Partial<Session>) {
    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.date !== undefined) dbPatch.date = patch.date;
    if (patch.time !== undefined) dbPatch.time = patch.time;
    if (patch.venue !== undefined) dbPatch.venue = patch.venue;
    if (patch.hostedBy !== undefined) dbPatch.hosted_by = patch.hostedBy;
    if (patch.resourcePerson !== undefined) dbPatch.resource_person = patch.resourcePerson;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.volunteerCount !== undefined) dbPatch.volunteer_count = patch.volunteerCount;
    if (patch.volunteerNames !== undefined) dbPatch.volunteer_names = patch.volunteerNames;
    if (patch.maxCapacity !== undefined) dbPatch.max_capacity = patch.maxCapacity;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    const { error } = await supabase.from('sessions').update(dbPatch).eq('id', id);
    if (error) throw error;
  },
  async remove(id: string) {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) throw error;
  },
};

export const attendanceService = {
  async list(): Promise<AttendanceRecord[]> {
    const { data } = await supabase
      .from('attendance')
      .select('*, profiles:student_id(name, usn, department)')
      .order('marked_at', { ascending: false });
    return (data ?? []).map((r: any) => ({
      id: r.id, sessionId: r.session_id, studentId: r.student_id,
      studentName: r.profiles?.name ?? '', studentUsn: r.profiles?.usn ?? '',
      department: r.profiles?.department ?? '',
      markedBy: r.marked_by, markedAt: r.marked_at,
    }));
  },
  async getBySession(sessionId: string): Promise<AttendanceRecord[]> {
    const all = await this.list();
    return all.filter(a => a.sessionId === sessionId);
  },
  async hasAttended(studentId: string, sessionId: string): Promise<boolean> {
    const { data } = await supabase.from('attendance').select('id').eq('student_id', studentId).eq('session_id', sessionId).maybeSingle();
    return !!data;
  },
  async mark(sessionId: string, studentId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('attendance').insert({ session_id: sessionId, student_id: studentId, marked_by: user?.id ?? null });
    if (error) throw error;
  },
};

export const assignmentsService = {
  async list(): Promise<Assignment[]> {
    const { data } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
    return (data ?? []).map(mapAssignment);
  },
  async create(input: { sessionId: string; title: string; description?: string; fileUrl?: string | null; fileName?: string | null; deadlineAt?: string | null; allowResubmit?: boolean; }) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('assignments').insert({
      session_id: input.sessionId, title: input.title, description: input.description ?? '',
      file_url: input.fileUrl ?? null, file_name: input.fileName ?? null,
      deadline_at: input.deadlineAt ?? null, allow_resubmit: input.allowResubmit ?? true,
      created_by: user?.id ?? null,
    });
    if (error) throw error;
  },
  async remove(id: string) {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) throw error;
  },
};

export const submissionsService = {
  async list(): Promise<Submission[]> {
    const { data } = await supabase.from('submissions').select('*').order('submitted_at', { ascending: false });
    return (data ?? []).map(mapSubmission);
  },
  async getByStudent(studentId: string): Promise<Submission[]> {
    const { data } = await supabase.from('submissions').select('*').eq('student_id', studentId);
    return (data ?? []).map(mapSubmission);
  },
  async upsert(input: { assignmentId: string; studentId: string; fileUrl?: string | null; fileName?: string | null; links?: string[]; }) {
    const { error } = await supabase.from('submissions').upsert({
      assignment_id: input.assignmentId, student_id: input.studentId,
      file_url: input.fileUrl ?? null, file_name: input.fileName ?? null,
      links: input.links ?? [],
    }, { onConflict: 'assignment_id,student_id' });
    if (error) throw error;
  },
  async setReviewed(id: string, reviewed: boolean) {
    const { error } = await supabase.from('submissions').update({ reviewed }).eq('id', id);
    if (error) throw error;
  },
};

export const resourcesService = {
  async list(): Promise<Resource[]> {
    const { data } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
    return (data ?? []).map(mapResource);
  },
  async create(input: { sessionId: string; title: string; fileUrl?: string | null; fileName?: string | null; linkUrl?: string | null; }) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('resources').insert({
      session_id: input.sessionId, title: input.title,
      file_url: input.fileUrl ?? null, file_name: input.fileName ?? null,
      link_url: input.linkUrl ?? null, created_by: user?.id ?? null,
    });
    if (error) throw error;
  },
  async remove(id: string) {
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) throw error;
  },
};

export const summariesService = {
  async list(): Promise<SessionSummary[]> {
    const { data } = await supabase.from('session_summaries').select('*').order('updated_at', { ascending: false });
    return (data ?? []).map(mapSummary);
  },
  async getByStudent(studentId: string): Promise<SessionSummary[]> {
    const { data } = await supabase.from('session_summaries').select('*').eq('student_id', studentId);
    return (data ?? []).map(mapSummary);
  },
  async upsert(sessionId: string, studentId: string, content: string) {
    const { error } = await supabase.from('session_summaries').upsert({
      session_id: sessionId, student_id: studentId, content,
    }, { onConflict: 'session_id,student_id' });
    if (error) throw error;
  },
};

export const qrTokensService = {
  async isUsed(token: string): Promise<boolean> {
    const { data } = await supabase.from('qr_tokens_used').select('token').eq('token', token).maybeSingle();
    return !!data;
  },
  async markUsed(token: string, sessionId: string) {
    await supabase.from('qr_tokens_used').insert({ token, session_id: sessionId });
  },
};

export const studentsService = {
  async list(): Promise<Student[]> {
    const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'student');
    const ids = new Set((roles ?? []).map((r: any) => r.user_id));
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    return (profiles ?? []).filter((p: any) => ids.has(p.id)).map(mapStudent);
  },
  async setStatus(id: string, status: 'approved' | 'rejected' | 'pending') {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (error) throw error;
  },
  async findByUsn(usn: string): Promise<Student | null> {
    const { data } = await supabase.from('profiles').select('*').ilike('usn', usn).maybeSingle();
    return data ? mapStudent(data) : null;
  },
};

// ============ REALTIME HOOK ============
type AnyTable =
  | 'sessions' | 'attendance' | 'assignments' | 'submissions'
  | 'resources' | 'session_summaries' | 'profiles' | 'user_roles';

export function useRealtimeRefresh(tables: AnyTable[], onChange: () => void) {
  useEffect(() => {
    const channel = supabase.channel(`realtime-${tables.join('-')}-${Math.random()}`);
    tables.forEach(t => {
      channel.on('postgres_changes' as any, { event: '*', schema: 'public', table: t }, () => onChange());
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useLiveSession() {
  const [session, setSession] = useState<Session | null>(null);
  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('status', 'live')
      .order('updated_at', { ascending: false })
      .limit(1);
    const row = data && data.length > 0 ? data[0] : null;
    setSession(row ? mapSession(row) : null);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useRealtimeRefresh(['sessions'], refresh);
  return session;
}
