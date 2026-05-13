# Full Supabase Centralization + Feature Rebuild

This is a very large scope (~30+ files, new schema, realtime, storage, UI rebuilds). I'll execute it in **3 phases**. Reply with **1**, **2**, or **3** below — or **"all"** to run everything in one pass (longer, riskier).

---

## Phase 1 — Foundation: schema, services, realtime, auth tweaks

**Database migration**
- `sessions` (name, date, time, venue, hosted_by, resource_person, description, volunteer_count, volunteer_names text[], status: 'upcoming'|'live'|'closed', created_by, created_at)
- `attendance` (session_id, student_id, marked_by, marked_at) UNIQUE(session_id, student_id)
- `assignments` (session_id, title, description, file_url, deadline_at, allow_resubmit, created_by)
- `submissions` (assignment_id, student_id, file_url, links text[], submitted_at, reviewed bool)
- `resources` (session_id, title, file_url, link_url, created_by, created_at)
- `session_summaries` (session_id, student_id, content, updated_at) UNIQUE(session_id, student_id)
- `qr_tokens_used` (token PK, session_id, used_at)
- Storage buckets: `assignments`, `submissions`, `resources` (private + signed URLs)
- RLS: students see approved-only data + own writes; admins full access via `has_role('admin')`
- Realtime publication on all above tables

**Auth config**
- Set `auto_confirm_email = true` (no email verification, no OTP)
- Remove `lookup_email_by_identifier` allowed admin range — already free-form ✓

**Code**
- Replace `src/lib/store.ts` with `src/lib/services/*` Supabase wrappers (`sessionsService`, `attendanceService`, `assignmentsService`, `submissionsService`, `resourcesService`, `summariesService`, `studentsService`)
- Add `useLiveSession()`, `useRealtimeTable()` hooks
- Strip localStorage usage everywhere except auth session (Supabase handles)
- Remove `otpStore` entirely

## Phase 2 — UI rebuilds wired to services

- **Home page**: live banner with realtime subscription, upcoming/recent session lists
- **Admin Dashboard**:
  - Session create form (vertical card, exact field order: Name → Date → Timing → Venue → Hosted By → Resource Person → Volunteers count → dynamic Volunteer N Name fields → Description)
  - Session cards display in same field order
  - Approved students list (realtime from `profiles`)
  - Live attendance counter per session
- **Student Dashboard**:
  - Personal QR generator (signed token: session_id + student_id + nonce)
  - Attendance history
  - Live session card with QR button when live
- **Admin signup**: confirm Department field hidden for admin role (audit existing form)

## Phase 3 — Assignments, Resources, Summaries, Mobile QR

- **Assignments (admin create)**: title, description, file upload, deadline, resubmit toggle
- **Submissions (student)**: drag-drop file upload, multi-link input, progress, toasts, edit-before-deadline
- **Submissions review (admin)**: list per assignment, signed file URLs, reviewed checkbox, timestamps
- **Resources**: separate "Choose File" + "Add Link" buttons (no auto-open picker), student view/download
- **Summaries**: textarea + char counter, only enabled after attendance row exists, edit before deadline; admin read-only list per session
- **QR Scanner mobile**: explicit `getUserMedia` permission preflight, friendly denied UI, HTTPS notice, responsive `qrbox`, environment-facing camera

---

## Risks / notes
- Existing localStorage data won't migrate — old demo accounts/sessions are gone (already true since auth migration)
- Storage signed URLs require buckets to be private; download links expire (default 1 hour, configurable)
- Realtime requires tables added to `supabase_realtime` publication (handled in migration)
- Architecture stays: TanStack Start SPA, Tailwind, glassmorphism — no SSR, no routing changes

---

## Choose:
- **1** → Phase 1 only (foundation; unlocks the sync issues)
- **2** → Phases 1+2 (foundation + UI rebuilds)
- **3** → Phases 1+2+3 (everything, assignments/resources/summaries/QR)
- **all** → same as 3
