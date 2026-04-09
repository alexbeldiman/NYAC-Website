'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import StaffLayout from '@/components/staff/StaffLayout';

// ─── Types ────────────────────────────────────────────────────
interface Profile { id: string; first_name: string; last_name: string; role: string; }
interface Lesson {
  id: string; start_time: string; duration_minutes: number;
  status: string; is_recurring: boolean; recurrence_id: string | null;
  court_id: string | null; confirmed_by_member: boolean; booked_via: string;
  member: { id: string; first_name: string; last_name: string; audit_number: string; is_child: boolean } | null;
}
interface Recurrence {
  id: string; coach_id: string; day_of_week: string; start_time: string;
  duration_minutes: number; active: boolean;
  member: { first_name: string; last_name: string; audit_number: string } | null;
}
interface AvailabilityEntry {
  id: string; coach_id: string; unavailable_from: string; unavailable_to: string;
  reason: string | null; status: string; approved_at: string | null;
}
interface ProgramSession {
  id: string; program: string; start_time: string;
  attendance: { child_id: string; checked_in_at: string | null; age_exception: boolean; child: { first_name: string; last_name: string; date_of_birth: string } | null }[];
}
interface Member { id: string; first_name: string; last_name: string; audit_number: string; is_child: boolean; parent_id: string | null; }

const TABS = [
  { id: 'schedule',    label: 'My Schedule'  },
  { id: 'recurring',   label: 'Recurring'    },
  { id: 'availability',label: 'Availability' },
  { id: 'programs',    label: 'Programs'     },
  { id: 'book',        label: 'Book Lesson'  },
];

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
function fmtDate(d: string) { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
function addDays(date: string, n: number) { const d = new Date(date); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; }

const DOW_OPTIONS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export default function CoachPage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [initLoading, setInitLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');

  // Schedule tab
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [lessonMsg, setLessonMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Recurring tab
  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [recurLoading, setRecurLoading] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [showNewRecur, setShowNewRecur] = useState(false);
  const [recurForm, setRecurForm] = useState({ member_id: '', day_of_week: 'monday', start_time: '', duration_minutes: 60, memberQuery: '' });
  const [recurMemberResults, setRecurMemberResults] = useState<Member[]>([]);
  const [recurMsg, setRecurMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recurSubmitting, setRecurSubmitting] = useState(false);

  // Availability tab
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availForm, setAvailForm] = useState({ unavailable_from: '', unavailable_to: '', reason: '' });
  const [availSubmitting, setAvailSubmitting] = useState(false);
  const [availMsg, setAvailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Programs tab
  const [progDate, setProgDate] = useState(todayStr());
  const [progSessions, setProgSessions] = useState<ProgramSession[]>([]);
  const [progLoading, setProgLoading] = useState(false);
  const [checkingInChildId, setCheckingInChildId] = useState<string | null>(null);
  const [progMsg, setProgMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Book lesson tab
  const [bookMemberQuery, setBookMemberQuery] = useState('');
  const [bookMemberResults, setBookMemberResults] = useState<Member[]>([]);
  const [bookSelected, setBookSelected] = useState<Member | null>(null);
  const [bookForm, setBookForm] = useState({ start_time: '', duration_minutes: 60 });
  const [bookLoading, setBookLoading] = useState(false);
  const [bookMsg, setBookMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── Init ─────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase.from('profiles').select('id, first_name, last_name, role').eq('id', session.user.id).single();
      setUser(profile);
      setInitLoading(false);
    }
    init();
  }, []);

  // ─── Fetch own lessons ────────────────────────────────────
  const fetchLessons = useCallback(async (date: string) => {
    if (!user) return;
    setLessonsLoading(true);
    try {
      const res = await fetch(`/api/lessons?coach_id=${user.id}&date=${date}`);
      const data = await res.json();
      setLessons(Array.isArray(data) ? data : []);
    } catch { setLessons([]); }
    finally { setLessonsLoading(false); }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'schedule' && user) fetchLessons(selectedDate);
  }, [activeTab, selectedDate, fetchLessons, user]);

  // ─── Fetch recurring ──────────────────────────────────────
  const fetchRecurrences = useCallback(async () => {
    if (!user) return;
    setRecurLoading(true);
    try {
      const res = await fetch('/api/lessons/recurring');
      const data = await res.json();
      const all: Recurrence[] = Array.isArray(data) ? data : [];
      setRecurrences(all.filter(r => r.coach_id === user.id));
    } catch { setRecurrences([]); }
    finally { setRecurLoading(false); }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'recurring' && user) fetchRecurrences();
  }, [activeTab, fetchRecurrences, user]);

  // ─── Fetch availability ───────────────────────────────────
  const fetchAvailability = useCallback(async () => {
    setAvailLoading(true);
    try {
      const res = await fetch('/api/coaches/availability');
      const data = await res.json();
      setAvailability(Array.isArray(data) ? data : []);
    } catch { setAvailability([]); }
    finally { setAvailLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'availability') fetchAvailability();
  }, [activeTab, fetchAvailability]);

  // ─── Fetch programs ───────────────────────────────────────
  const fetchPrograms = useCallback(async (date: string) => {
    setProgLoading(true);
    try {
      const res = await fetch(`/api/programs/sessions?date=${date}`);
      const data = await res.json();
      setProgSessions(Array.isArray(data) ? data : []);
    } catch { setProgSessions([]); }
    finally { setProgLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'programs') fetchPrograms(progDate);
  }, [activeTab, progDate, fetchPrograms]);

  // ─── Cancel lesson ────────────────────────────────────────
  async function cancelLesson(id: string) {
    setCancelError(null);
    try {
      const res = await fetch(`/api/lessons/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); setCancelError(d.error ?? 'Failed'); return; }
      setCancellingId(null);
      setLessonMsg({ type: 'success', text: 'Lesson cancelled.' });
      fetchLessons(selectedDate);
    } catch { setCancelError('Failed to cancel lesson'); }
  }

  // ─── Deactivate recurrence ────────────────────────────────
  async function deactivateRecurrence(id: string) {
    setDeactivatingId(id);
    try {
      const res = await fetch(`/api/lessons/recurring/${id}`, { method: 'DELETE' });
      if (!res.ok) { setRecurMsg({ type: 'error', text: 'Failed to deactivate.' }); return; }
      setRecurMsg({ type: 'success', text: 'Series deactivated.' });
      fetchRecurrences();
    } catch { setRecurMsg({ type: 'error', text: 'Failed to deactivate.' }); }
    finally { setDeactivatingId(null); }
  }

  // ─── Search members for recurring ────────────────────────
  async function searchRecurMembers() {
    if (!recurForm.memberQuery.trim()) return;
    try {
      const res = await fetch(`/api/members?search=${encodeURIComponent(recurForm.memberQuery)}`);
      const data = await res.json();
      setRecurMemberResults(Array.isArray(data) ? data : []);
    } catch { setRecurMemberResults([]); }
  }

  // ─── Create recurrence ────────────────────────────────────
  async function createRecurrence() {
    if (!user || !recurForm.member_id || !recurForm.start_time) return;
    setRecurSubmitting(true);
    setRecurMsg(null);
    try {
      const res = await fetch('/api/lessons/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: recurForm.member_id,
          coach_id: user.id,
          day_of_week: recurForm.day_of_week,
          start_time: recurForm.start_time,
          duration_minutes: recurForm.duration_minutes,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setRecurMsg({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setRecurMsg({ type: 'success', text: `Series created — ${d.lessons?.length ?? 0} lessons generated.` });
      setShowNewRecur(false);
      setRecurForm({ member_id: '', day_of_week: 'monday', start_time: '', duration_minutes: 60, memberQuery: '' });
      setRecurMemberResults([]);
      fetchRecurrences();
    } catch { setRecurMsg({ type: 'error', text: 'Failed to create series' }); }
    finally { setRecurSubmitting(false); }
  }

  // ─── Submit availability ──────────────────────────────────
  async function submitAvailability() {
    setAvailSubmitting(true);
    setAvailMsg(null);
    try {
      const res = await fetch('/api/coaches/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unavailable_from: availForm.unavailable_from,
          unavailable_to: availForm.unavailable_to,
          reason: availForm.reason || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setAvailMsg({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setAvailMsg({ type: 'success', text: 'Availability request submitted.' });
      setAvailForm({ unavailable_from: '', unavailable_to: '', reason: '' });
      fetchAvailability();
    } catch { setAvailMsg({ type: 'error', text: 'Submission failed' }); }
    finally { setAvailSubmitting(false); }
  }

  // ─── Check in child ───────────────────────────────────────
  async function checkInChild(sessionId: string, childId: string) {
    setCheckingInChildId(childId);
    setProgMsg(null);
    try {
      const res = await fetch('/api/programs/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, child_id: childId, date: progDate }),
      });
      const d = await res.json();
      if (!res.ok) {
        setProgMsg({ type: 'error', text: d.error ?? 'Check-in failed' });
      } else {
        setProgMsg({ type: 'success', text: `${d.child?.first_name ?? 'Child'} checked in.` });
        fetchPrograms(progDate);
      }
    } catch { setProgMsg({ type: 'error', text: 'Check-in failed' }); }
    finally { setCheckingInChildId(null); }
  }

  // ─── Book lesson ──────────────────────────────────────────
  async function bookLesson() {
    if (!bookSelected || !user) return;
    setBookLoading(true);
    setBookMsg(null);
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_name: bookSelected.last_name,
          audit_number: bookSelected.audit_number,
          member_id: bookSelected.id,
          start_time: bookForm.start_time,
          duration_minutes: bookForm.duration_minutes,
          coach_id: user.id,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setBookMsg({ type: 'error', text: d.error ?? 'Booking failed' }); return; }
      setBookMsg({ type: 'success', text: `Lesson booked for ${bookSelected.first_name} ${bookSelected.last_name}.` });
      setBookSelected(null);
      setBookMemberResults([]);
      setBookMemberQuery('');
      setBookForm({ start_time: '', duration_minutes: 60 });
    } catch { setBookMsg({ type: 'error', text: 'Booking failed' }); }
    finally { setBookLoading(false); }
  }

  async function searchBookMembers() {
    if (!bookMemberQuery.trim()) return;
    try {
      const res = await fetch(`/api/members?search=${encodeURIComponent(bookMemberQuery)}`);
      const data = await res.json();
      setBookMemberResults(Array.isArray(data) ? data : []);
    } catch { setBookMemberResults([]); }
  }

  if (initLoading) return <div style={{ background: 'var(--staff-bg)', minHeight: '100vh' }} />;
  const userName = user ? `${user.first_name} ${user.last_name}` : '';

  return (
    <StaffLayout role={user?.role ?? ''} userName={userName} tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="staff-content">

        {/* ══════════════════════════════════════════════════════
            TAB: MY SCHEDULE
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'schedule' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Coach</span>
                <h1 className="staff-page-title">My Schedule</h1>
              </div>
              <div className="date-controls">
                <button onClick={() => setSelectedDate(d => addDays(d, -1))}>‹</button>
                <span className="date-display">{fmtDate(selectedDate)}</span>
                <button onClick={() => setSelectedDate(d => addDays(d, 1))}>›</button>
                <input type="date" className="staff-input" style={{ width: 'auto' }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              </div>
            </div>

            {lessonMsg && <div className={lessonMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{lessonMsg.text}</div>}
            {cancelError && <div className="staff-error">{cancelError}</div>}

            {lessonsLoading ? (
              <div className="staff-empty">Loading lessons…</div>
            ) : lessons.length === 0 ? (
              <div className="staff-empty">No lessons scheduled for {fmtDate(selectedDate)}.</div>
            ) : (
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Duration</th>
                    <th>Member</th>
                    <th>Status</th>
                    <th>Recurring</th>
                    <th>Confirmed</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map(lesson => (
                    <tr key={lesson.id}>
                      <td className="td-primary">{fmtTime(lesson.start_time)}</td>
                      <td>{lesson.duration_minutes} min</td>
                      <td className="td-primary">
                        {lesson.member ? `${lesson.member.first_name} ${lesson.member.last_name}` : '—'}
                        {lesson.member?.is_child && <span className="badge badge-pending" style={{ marginLeft: 6, fontSize: 9 }}>Child</span>}
                      </td>
                      <td><span className={`badge badge-${lesson.status}`}>{lesson.status.replace('_', ' ')}</span></td>
                      <td>{lesson.is_recurring ? <span className="badge badge-available">Series</span> : '—'}</td>
                      <td>{lesson.confirmed_by_member ? <span className="badge badge-confirmed">Yes</span> : <span style={{ color: 'var(--staff-dim)', fontSize: 11 }}>Pending</span>}</td>
                      <td style={{ textAlign: 'right' }}>
                        {cancellingId === lesson.id ? (
                          <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn-staff-danger" onClick={() => cancelLesson(lesson.id)}>Confirm Cancel</button>
                            <button className="btn-staff-ghost" style={{ padding: '6px 10px' }} onClick={() => setCancellingId(null)}>No</button>
                          </span>
                        ) : (
                          lesson.status !== 'cancelled' && lesson.status !== 'completed' &&
                          <button className="btn-staff-ghost" style={{ padding: '5px 12px', fontSize: 11, color: '#f87171', borderColor: 'rgba(200,16,46,0.2)' }} onClick={() => setCancellingId(lesson.id)}>Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: RECURRING SERIES
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'recurring' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Coach</span>
                <h1 className="staff-page-title">Recurring Series</h1>
              </div>
              <button className="btn-staff-primary" onClick={() => setShowNewRecur(v => !v)}>
                {showNewRecur ? 'Cancel' : '+ New Series'}
              </button>
            </div>

            {recurMsg && <div className={recurMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{recurMsg.text}</div>}

            {showNewRecur && (
              <div className="staff-card" style={{ maxWidth: 560, marginBottom: 28 }}>
                <div className="staff-card-title">New Recurring Series</div>
                <div className="form-group">
                  <label className="staff-label-text">Find Member</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input className="staff-input" placeholder="Last name" value={recurForm.memberQuery} onChange={e => setRecurForm(p => ({ ...p, memberQuery: e.target.value }))} onKeyDown={e => e.key === 'Enter' && searchRecurMembers()} />
                    <button className="btn-staff-ghost" onClick={searchRecurMembers}>Find</button>
                  </div>
                  {recurMemberResults.length > 0 && !recurForm.member_id && (
                    <div style={{ marginTop: 4 }}>
                      {recurMemberResults.map(m => (
                        <button key={m.id} className="btn-staff-ghost" style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 6, padding: '9px 14px' }} onClick={() => setRecurForm(p => ({ ...p, member_id: m.id, memberQuery: `${m.first_name} ${m.last_name}` }))}>
                          {m.first_name} {m.last_name} — #{m.audit_number}
                        </button>
                      ))}
                    </div>
                  )}
                  {recurForm.member_id && <div style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>✓ {recurForm.memberQuery}</div>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="staff-label-text">Day of Week</label>
                    <select className="staff-input" value={recurForm.day_of_week} onChange={e => setRecurForm(p => ({ ...p, day_of_week: e.target.value }))}>
                      {DOW_OPTIONS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="staff-label-text">Start Time</label>
                    <input type="time" className="staff-input" value={recurForm.start_time} onChange={e => setRecurForm(p => ({ ...p, start_time: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group" style={{ maxWidth: 200 }}>
                  <label className="staff-label-text">Duration</label>
                  <select className="staff-input" value={recurForm.duration_minutes} onChange={e => setRecurForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) }))}>
                    <option value={30}>30 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
                <button className="btn-staff-primary" disabled={recurSubmitting || !recurForm.member_id || !recurForm.start_time} onClick={createRecurrence}>
                  {recurSubmitting ? 'Creating…' : 'Create Series'}
                </button>
              </div>
            )}

            {recurLoading ? (
              <div className="staff-empty">Loading series…</div>
            ) : recurrences.length === 0 ? (
              <div className="staff-empty">No active recurring series.</div>
            ) : (
              <table className="staff-table">
                <thead>
                  <tr><th>Member</th><th>Audit #</th><th>Day</th><th>Time</th><th>Duration</th><th></th></tr>
                </thead>
                <tbody>
                  {recurrences.map(r => (
                    <tr key={r.id}>
                      <td className="td-primary">{r.member ? `${r.member.first_name} ${r.member.last_name}` : '—'}</td>
                      <td>{r.member?.audit_number ?? '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{r.day_of_week}</td>
                      <td>{r.start_time}</td>
                      <td>{r.duration_minutes} min</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-staff-danger" disabled={deactivatingId === r.id} onClick={() => deactivateRecurrence(r.id)}>
                          {deactivatingId === r.id ? 'Deactivating…' : 'Deactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: AVAILABILITY
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'availability' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Coach</span>
                <h1 className="staff-page-title">Availability Requests</h1>
              </div>
            </div>

            {availMsg && <div className={availMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{availMsg.text}</div>}

            <div className="staff-card" style={{ maxWidth: 560, marginBottom: 32 }}>
              <div className="staff-card-title">Submit Unavailability</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="staff-label-text">From</label>
                  <input type="date" className="staff-input" value={availForm.unavailable_from} onChange={e => setAvailForm(p => ({ ...p, unavailable_from: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="staff-label-text">To</label>
                  <input type="date" className="staff-input" value={availForm.unavailable_to} onChange={e => setAvailForm(p => ({ ...p, unavailable_to: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="staff-label-text">Reason (optional)</label>
                <input className="staff-input" placeholder="Vacation, injury, etc." value={availForm.reason} onChange={e => setAvailForm(p => ({ ...p, reason: e.target.value }))} />
              </div>
              <button className="btn-staff-primary" disabled={availSubmitting || !availForm.unavailable_from || !availForm.unavailable_to} onClick={submitAvailability}>
                {availSubmitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>

            {availLoading ? (
              <div className="staff-empty">Loading requests…</div>
            ) : availability.length === 0 ? (
              <div className="staff-empty">No availability requests submitted.</div>
            ) : (
              <table className="staff-table">
                <thead>
                  <tr><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Approved</th></tr>
                </thead>
                <tbody>
                  {availability.map(a => (
                    <tr key={a.id}>
                      <td className="td-primary">{a.unavailable_from.split('T')[0]}</td>
                      <td>{a.unavailable_to.split('T')[0]}</td>
                      <td>{a.reason ?? '—'}</td>
                      <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                      <td>{a.approved_at ? new Date(a.approved_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: PROGRAMS
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'programs' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Coach</span>
                <h1 className="staff-page-title">MITL &amp; Academy</h1>
              </div>
              <div className="date-controls">
                <button onClick={() => setProgDate(d => addDays(d, -1))}>‹</button>
                <span className="date-display">{fmtDate(progDate)}</span>
                <button onClick={() => setProgDate(d => addDays(d, 1))}>›</button>
                <input type="date" className="staff-input" style={{ width: 'auto' }} value={progDate} onChange={e => setProgDate(e.target.value)} />
              </div>
            </div>

            {progMsg && <div className={progMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{progMsg.text}</div>}

            {progLoading ? (
              <div className="staff-empty">Loading sessions…</div>
            ) : progSessions.length === 0 ? (
              <div className="staff-empty">No program sessions for {fmtDate(progDate)}.</div>
            ) : (
              progSessions.map(session => (
                <div key={session.id} className="staff-card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ fontFamily: 'var(--font-label)', fontSize: 18, color: 'var(--staff-text)' }}>
                      {session.program} — {fmtTime(session.start_time)}
                    </div>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--staff-muted)' }}>{session.attendance.length} enrolled</span>
                  </div>
                  {session.attendance.length === 0 ? (
                    <div style={{ color: 'var(--staff-dim)', fontSize: 12 }}>No attendance records.</div>
                  ) : (
                    <table className="staff-table">
                      <thead><tr><th>Name</th><th>DOB</th><th>Checked In</th><th>Age Exception</th><th></th></tr></thead>
                      <tbody>
                        {session.attendance.map((a, i) => (
                          <tr key={i}>
                            <td className="td-primary">{a.child?.first_name} {a.child?.last_name}</td>
                            <td>{a.child?.date_of_birth ?? '—'}</td>
                            <td>{a.checked_in_at ? <span className="badge badge-confirmed">{fmtTime(a.checked_in_at)}</span> : <span style={{ color: 'var(--staff-dim)', fontSize: 11 }}>Not yet</span>}</td>
                            <td>{a.age_exception ? <span className="badge badge-pending">Yes</span> : '—'}</td>
                            <td style={{ textAlign: 'right' }}>
                              {!a.checked_in_at && (
                                <button className="btn-staff-primary" style={{ padding: '5px 12px', fontSize: 10 }} disabled={checkingInChildId === a.child_id} onClick={() => checkInChild(session.id, a.child_id)}>
                                  {checkingInChildId === a.child_id ? '…' : 'Check In'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: BOOK LESSON
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'book' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Coach</span>
                <h1 className="staff-page-title">Book Lesson</h1>
              </div>
            </div>

            {bookMsg && <div className={bookMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{bookMsg.text}</div>}

            <div style={{ maxWidth: 560 }}>
              {!bookSelected ? (
                <div className="staff-card">
                  <div className="staff-card-title">Find Member</div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <input className="staff-input" placeholder="Search by last name" value={bookMemberQuery} onChange={e => setBookMemberQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchBookMembers()} />
                    <button className="btn-staff-primary" onClick={searchBookMembers}>Search</button>
                  </div>
                  {bookMemberResults.length > 0 && (
                    <table className="staff-table">
                      <thead><tr><th>Name</th><th>Audit #</th><th></th></tr></thead>
                      <tbody>
                        {bookMemberResults.map(m => (
                          <tr key={m.id}>
                            <td className="td-primary">{m.first_name} {m.last_name}{m.is_child && <span className="badge badge-pending" style={{ marginLeft: 6, fontSize: 9 }}>Child</span>}</td>
                            <td>{m.audit_number}</td>
                            <td><button className="btn-staff-ghost" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setBookSelected(m)}>Select</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div className="staff-card">
                  <div className="staff-card-title">
                    Booking for {bookSelected.first_name} {bookSelected.last_name}
                    <button className="btn-staff-ghost" style={{ float: 'right', padding: '3px 10px', fontSize: 10 }} onClick={() => { setBookSelected(null); setBookMemberResults([]); }}>← Back</button>
                  </div>
                  <div className="form-group">
                    <label className="staff-label-text">Start Time</label>
                    <input type="datetime-local" className="staff-input" value={bookForm.start_time} onChange={e => setBookForm(p => ({ ...p, start_time: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ maxWidth: 200 }}>
                    <label className="staff-label-text">Duration</label>
                    <select className="staff-input" value={bookForm.duration_minutes} onChange={e => setBookForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) }))}>
                      <option value={30}>30 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                      <option value={120}>120 min</option>
                    </select>
                  </div>
                  <button className="btn-staff-primary" disabled={bookLoading || !bookForm.start_time} onClick={bookLesson}>
                    {bookLoading ? 'Booking…' : 'Book Lesson'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </StaffLayout>
  );
}
