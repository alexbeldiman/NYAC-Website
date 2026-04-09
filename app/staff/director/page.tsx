'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import StaffLayout from '@/components/staff/StaffLayout';
import DirectorSchedule from '@/components/staff/DirectorSchedule';

// ─── Types ────────────────────────────────────────────────────
interface Profile { id: string; first_name: string; last_name: string; role: string; }
interface Lesson {
  id: string; start_time: string; duration_minutes: number;
  status: string; is_recurring: boolean; recurrence_id: string | null;
  court_id: string | null; confirmed_by_member: boolean; booked_via: string;
  member: { first_name: string; last_name: string; audit_number: string } | null;
  coach: { first_name: string; last_name: string } | null;
}
interface Recurrence {
  id: string; coach_id: string; day_of_week: string; start_time: string;
  duration_minutes: number; active: boolean;
  member: { first_name: string; last_name: string; audit_number: string } | null;
  coach: { first_name: string; last_name: string } | null;
}
interface BillingSummaryEntry { audit_number: string; family_name: string; clinics: { total_sessions: number; total_guests: number }; lessons: { total_lessons: number; total_minutes: number }; mitl_academy: { total_mitl: number; total_academy: number }; }
interface ClinicBillingEntry { audit_number: string; member_name: string; total_sessions: number; total_guests: number; }
interface LessonBillingEntry { audit_number: string; member_name: string; total_lessons: number; total_minutes: number; }
interface ProgramBillingEntry { audit_number: string; family_name: string; total_mitl: number; total_academy: number; }
interface ClinicSlot { id: string; date: string; hour: number; gender_restriction: string | null; capacity: number; signed_up_count: number; is_full: boolean; access_code: string | null; }
interface AvailabilityEntry {
  id: string; coach_id: string; unavailable_from: string; unavailable_to: string;
  reason: string | null; status: string; approved_by: string | null; approved_at: string | null;
  coach?: { first_name: string; last_name: string };
}
interface Member { id: string; first_name: string; last_name: string; audit_number: string; phone: string | null; is_child: boolean; gender: string | null; date_of_birth: string | null; parent_id: string | null; role: string | null; }
interface MemberDetail { profile: Member; family: Member[]; }
interface CoachOption { id: string; first_name: string; last_name: string; }

const TABS = [
  { id: 'schedule',    label: 'Schedule'    },
  { id: 'lessons',     label: 'Lessons'     },
  { id: 'billing',     label: 'Billing'     },
  { id: 'clinics',     label: 'Clinics'     },
  { id: 'availability',label: 'Availability'},
  { id: 'members',     label: 'Members'     },
  { id: 'staff',       label: 'Staff'       },
  { id: 'tools',       label: 'Tools'       },
];

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
function fmtDate(d: string) { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
function addDays(date: string, n: number) { const d = new Date(date); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; }
function prevMonday(date: string) { const d = new Date(date + 'T12:00:00'); const day = d.getDay(); const diff = (day === 0 ? -6 : 1 - day); d.setDate(d.getDate() + diff); return d.toISOString().split('T')[0]; }

const DOW_OPTIONS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

// ─── Main Component ───────────────────────────────────────────
export default function DirectorPage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [initLoading, setInitLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');

  // Lessons tab
  const [lessonsDate, setLessonsDate] = useState(todayStr());
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [cancellingLessonId, setCancellingLessonId] = useState<string | null>(null);
  const [lessonMsg, setLessonMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [recurLoading, setRecurLoading] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<CoachOption[]>([]);
  const [filterCoachId, setFilterCoachId] = useState('');

  // Billing tab
  const [billingSubTab, setBillingSubTab] = useState<'global' | 'clinics' | 'lessons' | 'programs'>('global');
  const [billingWeek, setBillingWeek] = useState(() => prevMonday(todayStr()));
  const [globalBilling, setGlobalBilling] = useState<BillingSummaryEntry[]>([]);
  const [clinicBilling, setClinicBilling] = useState<ClinicBillingEntry[]>([]);
  const [lessonBilling, setLessonBilling] = useState<LessonBillingEntry[]>([]);
  const [programBilling, setProgramBilling] = useState<ProgramBillingEntry[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);

  // Clinics tab
  const [clinicSlots, setClinicSlots] = useState<ClinicSlot[]>([]);
  const [clinicsLoading, setClinicsLoading] = useState(false);
  const [clinicDate, setClinicDate] = useState(todayStr());
  const [codesGenerating, setCodesGenerating] = useState(false);
  const [clinicMsg, setClinicMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Availability tab
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availMsg, setAvailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Members tab
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [showNewMember, setShowNewMember] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ first_name: '', last_name: '', audit_number: '', phone: '', is_child: false, gender: '', date_of_birth: '', parent_id: '' });
  const [memberMsg, setMemberMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [memberSubmitting, setMemberSubmitting] = useState(false);

  // Staff tab
  const [staffForm, setStaffForm] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'coach', phone: '' });
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffMsg, setStaffMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tools tab
  const [confirmationsResult, setConfirmationsResult] = useState<number | null>(null);
  const [escalationResult, setEscalationResult] = useState<number | null>(null);
  const [toolLoading, setToolLoading] = useState<string | null>(null);
  const [toolMsg, setToolMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // ─── Fetch coaches list ───────────────────────────────────
  const fetchCoaches = useCallback(async () => {
    try {
      const res = await fetch('/api/coaches/public');
      const data = await res.json();
      setCoaches(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  // ─── Fetch lessons ────────────────────────────────────────
  const fetchLessons = useCallback(async (date: string, coachId?: string) => {
    setLessonsLoading(true);
    try {
      let url = `/api/lessons?date=${date}`;
      if (coachId) url += `&coach_id=${coachId}`;
      const res = await fetch(url);
      const data = await res.json();
      setLessons(Array.isArray(data) ? data : []);
    } catch { setLessons([]); }
    finally { setLessonsLoading(false); }
  }, []);

  const fetchRecurrences = useCallback(async () => {
    setRecurLoading(true);
    try {
      const res = await fetch('/api/lessons/recurring');
      const data = await res.json();
      setRecurrences(Array.isArray(data) ? data : []);
    } catch { setRecurrences([]); }
    finally { setRecurLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'schedule' || activeTab === 'lessons') {
      fetchCoaches();
    }
    if (activeTab === 'lessons') {
      fetchLessons(lessonsDate, filterCoachId || undefined);
      if (showRecurring) fetchRecurrences();
    }
  }, [activeTab, lessonsDate, filterCoachId, showRecurring, fetchLessons, fetchRecurrences, fetchCoaches]);

  // ─── Fetch billing ────────────────────────────────────────
  const fetchBilling = useCallback(async (subTab: string, week: string) => {
    setBillingLoading(true);
    try {
      if (subTab === 'global') {
        const res = await fetch(`/api/billing/summary?week_start=${week}`);
        const data = await res.json();
        setGlobalBilling(Array.isArray(data) ? data : []);
      } else if (subTab === 'clinics') {
        // clinic billing requires Saturday — find the Saturday of this week
        const d = new Date(week + 'T12:00:00'); d.setDate(d.getDate() + 5);
        const sat = d.toISOString().split('T')[0];
        const res = await fetch(`/api/billing/clinics?week_start=${sat}`);
        const data = await res.json();
        setClinicBilling(Array.isArray(data) ? data : []);
      } else if (subTab === 'lessons') {
        const res = await fetch(`/api/billing/lessons?week_start=${week}`);
        const data = await res.json();
        setLessonBilling(Array.isArray(data) ? data : []);
      } else if (subTab === 'programs') {
        const res = await fetch(`/api/programs/billing?week_start=${week}`);
        const data = await res.json();
        setProgramBilling(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
    finally { setBillingLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'billing') fetchBilling(billingSubTab, billingWeek);
  }, [activeTab, billingSubTab, billingWeek, fetchBilling]);

  // ─── Fetch clinic slots ───────────────────────────────────
  const fetchClinicSlots = useCallback(async (date: string) => {
    setClinicsLoading(true);
    try {
      const res = await fetch(`/api/clinics/slots?date=${date}`);
      const data = await res.json();
      setClinicSlots(Array.isArray(data) ? data : []);
    } catch { setClinicSlots([]); }
    finally { setClinicsLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'clinics') fetchClinicSlots(clinicDate);
  }, [activeTab, clinicDate, fetchClinicSlots]);

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

  // ─── Cancel lesson ────────────────────────────────────────
  async function cancelLesson(id: string) {
    try {
      const res = await fetch(`/api/lessons/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); setLessonMsg({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setCancellingLessonId(null);
      setLessonMsg({ type: 'success', text: 'Lesson cancelled.' });
      fetchLessons(lessonsDate, filterCoachId || undefined);
    } catch { setLessonMsg({ type: 'error', text: 'Failed to cancel' }); }
  }

  async function deactivateRecurrence(id: string) {
    setDeactivatingId(id);
    try {
      const res = await fetch(`/api/lessons/recurring/${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      fetchRecurrences();
    } catch { /* ignore */ }
    finally { setDeactivatingId(null); }
  }

  // ─── Generate codes ───────────────────────────────────────
  async function generateCodes() {
    setCodesGenerating(true);
    setClinicMsg(null);
    try {
      const res = await fetch('/api/clinics/generate-codes', { method: 'POST' });
      if (!res.ok) { const d = await res.json(); setClinicMsg({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setClinicMsg({ type: 'success', text: 'Access codes generated for the week.' });
      fetchClinicSlots(clinicDate);
    } catch { setClinicMsg({ type: 'error', text: 'Code generation failed' }); }
    finally { setCodesGenerating(false); }
  }

  // ─── Approve / reject availability ───────────────────────
  async function updateAvailability(id: string, status: 'approved' | 'rejected') {
    setAvailMsg(null);
    try {
      const res = await fetch(`/api/coaches/availability/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { const d = await res.json(); setAvailMsg({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setAvailMsg({ type: 'success', text: `Request ${status}.` });
      fetchAvailability();
    } catch { setAvailMsg({ type: 'error', text: 'Update failed' }); }
  }

  // ─── Member search ────────────────────────────────────────
  async function searchMembers() {
    if (!memberSearch.trim()) return;
    setMemberLoading(true);
    try {
      const res = await fetch(`/api/members?search=${encodeURIComponent(memberSearch)}`);
      const data = await res.json();
      setMemberResults(Array.isArray(data) ? data : []);
      setMemberDetail(null);
    } catch { setMemberResults([]); }
    finally { setMemberLoading(false); }
  }

  async function loadMemberDetail(id: string) {
    try {
      const res = await fetch(`/api/members/${id}`);
      const data = await res.json();
      setMemberDetail(data);
    } catch { /* ignore */ }
  }

  // ─── Create member ────────────────────────────────────────
  async function createMember() {
    setMemberSubmitting(true);
    setMemberMsg(null);
    try {
      const body: Record<string, unknown> = { ...newMemberForm };
      if (!body.phone) body.phone = null;
      if (!body.gender) body.gender = null;
      if (!body.date_of_birth) body.date_of_birth = null;
      if (!body.parent_id) body.parent_id = null;
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { setMemberMsg({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setMemberMsg({ type: 'success', text: `${d.first_name} ${d.last_name} created.` });
      setShowNewMember(false);
      setNewMemberForm({ first_name: '', last_name: '', audit_number: '', phone: '', is_child: false, gender: '', date_of_birth: '', parent_id: '' });
    } catch { setMemberMsg({ type: 'error', text: 'Creation failed' }); }
    finally { setMemberSubmitting(false); }
  }

  // ─── Create staff account ─────────────────────────────────
  async function createStaff() {
    setStaffSubmitting(true);
    setStaffMsg(null);
    try {
      const res = await fetch('/api/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      });
      const d = await res.json();
      if (!res.ok) { setStaffMsg({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setStaffMsg({ type: 'success', text: `${d.first_name} ${d.last_name} (${d.role}) account created.` });
      setStaffForm({ first_name: '', last_name: '', email: '', password: '', role: 'coach', phone: '' });
    } catch { setStaffMsg({ type: 'error', text: 'Account creation failed' }); }
    finally { setStaffSubmitting(false); }
  }

  // ─── Tools ────────────────────────────────────────────────
  async function sendConfirmations() {
    setToolLoading('confirmations');
    setToolMsg(null);
    try {
      const res = await fetch('/api/lessons/send-confirmations', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) { setToolMsg({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setConfirmationsResult(d.confirmations_sent ?? 0);
      setToolMsg({ type: 'success', text: `${d.confirmations_sent ?? 0} confirmation(s) sent.` });
    } catch { setToolMsg({ type: 'error', text: 'Failed to send confirmations' }); }
    finally { setToolLoading(null); }
  }

  async function escalatePickup() {
    setToolLoading('escalation');
    setToolMsg(null);
    try {
      const res = await fetch('/api/pickup/escalate', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) { setToolMsg({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setEscalationResult(d.escalated_count ?? 0);
      setToolMsg({ type: 'success', text: `${d.escalated_count ?? 0} pickup request(s) escalated.` });
    } catch { setToolMsg({ type: 'error', text: 'Escalation failed' }); }
    finally { setToolLoading(null); }
  }

  if (initLoading) return <div style={{ background: 'var(--staff-bg)', minHeight: '100vh' }} />;
  const userName = user ? `${user.first_name} ${user.last_name}` : '';

  return (
    <StaffLayout role={user?.role ?? ''} userName={userName} tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="staff-content">

        {/* ══════════════════════════════════════════════════════
            TAB: SCHEDULE
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'schedule' && (
          <DirectorSchedule coaches={coaches} />
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: LESSONS
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'lessons' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Director</span>
                <h1 className="staff-page-title">Lessons</h1>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className={`sub-tab${showRecurring ? '' : ' active'}`} style={{ border: 'none', borderBottom: '2px solid' }} onClick={() => setShowRecurring(false)}>Daily</button>
                <button className={`sub-tab${showRecurring ? ' active' : ''}`} style={{ border: 'none', borderBottom: '2px solid' }} onClick={() => { setShowRecurring(true); fetchRecurrences(); }}>Recurring</button>
              </div>
            </div>

            {lessonMsg && <div className={lessonMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{lessonMsg.text}</div>}

            {!showRecurring && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                  <div className="date-controls">
                    <button onClick={() => setLessonsDate(d => addDays(d, -1))}>‹</button>
                    <span className="date-display">{fmtDate(lessonsDate)}</span>
                    <button onClick={() => setLessonsDate(d => addDays(d, 1))}>›</button>
                    <input type="date" className="staff-input" style={{ width: 'auto' }} value={lessonsDate} onChange={e => setLessonsDate(e.target.value)} />
                  </div>

                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, flexWrap: 'nowrap', scrollbarWidth: 'none' }}>
                    <button 
                      className={`btn-staff-ghost ${filterCoachId === '' ? 'active' : ''}`}
                      style={{ padding: '6px 14px', whiteSpace: 'nowrap', borderColor: filterCoachId === '' ? 'var(--crimson)' : 'var(--staff-border)', background: filterCoachId === '' ? 'rgba(200,16,46,0.08)' : 'transparent', color: filterCoachId === '' ? 'var(--staff-text)' : 'var(--staff-muted)' }}
                      onClick={() => setFilterCoachId('')}
                    >
                      All Lessons
                    </button>
                    {user && (
                      <button 
                        className={`btn-staff-ghost ${filterCoachId === user.id ? 'active' : ''}`}
                        style={{ padding: '6px 14px', whiteSpace: 'nowrap', borderColor: filterCoachId === user.id ? 'var(--crimson)' : 'var(--staff-border)', background: filterCoachId === user.id ? 'rgba(200,16,46,0.08)' : 'transparent', color: filterCoachId === user.id ? 'var(--staff-text)' : 'var(--staff-muted)' }}
                        onClick={() => setFilterCoachId(user.id)}
                      >
                        My Lessons
                      </button>
                    )}
                    {coaches.filter(c => c.id !== user?.id).map(c => (
                      <button
                        key={c.id}
                        className={`btn-staff-ghost ${filterCoachId === c.id ? 'active' : ''}`}
                        style={{ padding: '6px 14px', whiteSpace: 'nowrap', borderColor: filterCoachId === c.id ? 'var(--crimson)' : 'var(--staff-border)', background: filterCoachId === c.id ? 'rgba(200,16,46,0.08)' : 'transparent', color: filterCoachId === c.id ? 'var(--staff-text)' : 'var(--staff-muted)' }}
                        onClick={() => setFilterCoachId(c.id)}
                      >
                        {c.first_name} {c.last_name}
                      </button>
                    ))}
                  </div>
                </div>
                {lessonsLoading ? (
                  <div className="staff-empty">Loading…</div>
                ) : lessons.length === 0 ? (
                  <div className="staff-empty">No lessons for this date.</div>
                ) : (
                  <table className="staff-table">
                    <thead><tr><th>Time</th><th>Duration</th><th>Member</th><th>Coach</th><th>Status</th><th>Via</th><th></th></tr></thead>
                    <tbody>
                      {lessons.map(l => (
                        <tr key={l.id}>
                          <td className="td-primary">{fmtTime(l.start_time)}</td>
                          <td>{l.duration_minutes} min</td>
                          <td className="td-primary">{l.member ? `${l.member.first_name} ${l.member.last_name}` : '—'}</td>
                          <td>{l.coach ? `${l.coach.first_name} ${l.coach.last_name}` : '—'}</td>
                          <td><span className={`badge badge-${l.status}`}>{l.status.replace('_',' ')}</span></td>
                          <td style={{ fontSize: 11, color: 'var(--staff-muted)' }}>{l.booked_via}</td>
                          <td style={{ textAlign: 'right' }}>
                            {cancellingLessonId === l.id ? (
                              <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button className="btn-staff-danger" onClick={() => cancelLesson(l.id)}>Confirm</button>
                                <button className="btn-staff-ghost" style={{ padding: '5px 8px' }} onClick={() => setCancellingLessonId(null)}>No</button>
                              </span>
                            ) : (
                              l.status !== 'cancelled' && l.status !== 'completed' &&
                              <button className="btn-staff-ghost" style={{ padding: '5px 12px', fontSize: 11, color: '#f87171', borderColor: 'rgba(200,16,46,0.2)' }} onClick={() => setCancellingLessonId(l.id)}>Cancel</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {showRecurring && (
              recurLoading ? (
                <div className="staff-empty">Loading series…</div>
              ) : recurrences.length === 0 ? (
                <div className="staff-empty">No active recurring series.</div>
              ) : (
                <table className="staff-table">
                  <thead><tr><th>Member</th><th>Audit #</th><th>Coach</th><th>Day</th><th>Time</th><th>Duration</th><th></th></tr></thead>
                  <tbody>
                    {recurrences.map(r => (
                      <tr key={r.id}>
                        <td className="td-primary">{r.member ? `${r.member.first_name} ${r.member.last_name}` : '—'}</td>
                        <td>{r.member?.audit_number ?? '—'}</td>
                        <td>{r.coach ? `${r.coach.first_name} ${r.coach.last_name}` : '—'}</td>
                        <td style={{ textTransform: 'capitalize' }}>{r.day_of_week}</td>
                        <td>{r.start_time}</td>
                        <td>{r.duration_minutes} min</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-staff-danger" disabled={deactivatingId === r.id} onClick={() => deactivateRecurrence(r.id)}>
                            {deactivatingId === r.id ? '…' : 'Deactivate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: BILLING
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'billing' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Director</span>
                <h1 className="staff-page-title">Billing</h1>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <label className="staff-label-text" style={{ marginBottom: 0 }}>Week of</label>
                <input type="date" className="staff-input" style={{ width: 'auto' }} value={billingWeek} onChange={e => setBillingWeek(e.target.value)} />
              </div>
            </div>

            <div className="sub-tabs">
              {(['global','clinics','lessons','programs'] as const).map(s => (
                <button key={s} className={`sub-tab${billingSubTab === s ? ' active' : ''}`} onClick={() => setBillingSubTab(s)}>
                  {s === 'global' ? 'Global Summary' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {billingLoading ? (
              <div className="staff-empty">Loading billing data…</div>
            ) : billingSubTab === 'global' ? (
              globalBilling.length === 0 ? <div className="staff-empty">No billing data for this week.</div> : (
                <table className="staff-table">
                  <thead><tr><th>Audit #</th><th>Family</th><th>Clinic Sessions</th><th>Clinic Guests</th><th>Lessons</th><th>Lesson Min</th><th>MITL</th><th>Academy</th></tr></thead>
                  <tbody>
                    {globalBilling.map((row, i) => (
                      <tr key={i}>
                        <td className="td-primary">{row.audit_number}</td>
                        <td className="td-primary">{row.family_name}</td>
                        <td>{row.clinics?.total_sessions ?? 0}</td>
                        <td>{row.clinics?.total_guests ?? 0}</td>
                        <td>{row.lessons?.total_lessons ?? 0}</td>
                        <td>{row.lessons?.total_minutes ?? 0}</td>
                        <td>{row.mitl_academy?.total_mitl ?? 0}</td>
                        <td>{row.mitl_academy?.total_academy ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : billingSubTab === 'clinics' ? (
              clinicBilling.length === 0 ? <div className="staff-empty">No clinic billing data.</div> : (
                <table className="staff-table">
                  <thead><tr><th>Audit #</th><th>Member</th><th>Sessions</th><th>Guests</th></tr></thead>
                  <tbody>
                    {clinicBilling.map((row, i) => (
                      <tr key={i}>
                        <td className="td-primary">{row.audit_number}</td>
                        <td className="td-primary">{row.member_name}</td>
                        <td>{row.total_sessions}</td>
                        <td>{row.total_guests}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : billingSubTab === 'lessons' ? (
              lessonBilling.length === 0 ? <div className="staff-empty">No lesson billing data.</div> : (
                <table className="staff-table">
                  <thead><tr><th>Audit #</th><th>Member</th><th>Lessons</th><th>Total Minutes</th></tr></thead>
                  <tbody>
                    {lessonBilling.map((row, i) => (
                      <tr key={i}>
                        <td className="td-primary">{row.audit_number}</td>
                        <td className="td-primary">{row.member_name}</td>
                        <td>{row.total_lessons}</td>
                        <td>{row.total_minutes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              programBilling.length === 0 ? <div className="staff-empty">No program billing data.</div> : (
                <table className="staff-table">
                  <thead><tr><th>Audit #</th><th>Family</th><th>MITL</th><th>Academy</th></tr></thead>
                  <tbody>
                    {programBilling.map((row, i) => (
                      <tr key={i}>
                        <td className="td-primary">{row.audit_number}</td>
                        <td className="td-primary">{row.family_name}</td>
                        <td>{row.total_mitl}</td>
                        <td>{row.total_academy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: CLINICS
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'clinics' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Director</span>
                <h1 className="staff-page-title">Clinics</h1>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="date-controls">
                  <button onClick={() => setClinicDate(d => addDays(d, -1))}>‹</button>
                  <span className="date-display">{fmtDate(clinicDate)}</span>
                  <button onClick={() => setClinicDate(d => addDays(d, 1))}>›</button>
                  <input type="date" className="staff-input" style={{ width: 'auto' }} value={clinicDate} onChange={e => setClinicDate(e.target.value)} />
                </div>
                <button className="btn-staff-primary" disabled={codesGenerating} onClick={generateCodes}>
                  {codesGenerating ? 'Generating…' : '+ Generate Codes'}
                </button>
              </div>
            </div>

            {clinicMsg && <div className={clinicMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{clinicMsg.text}</div>}

            {clinicsLoading ? (
              <div className="staff-empty">Loading slots…</div>
            ) : clinicSlots.length === 0 ? (
              <div className="staff-empty">No clinic slots for this date.</div>
            ) : (
              <table className="staff-table">
                <thead><tr><th>Time</th><th>Restriction</th><th>Signed Up</th><th>Capacity</th><th>Status</th><th>Access Code</th></tr></thead>
                <tbody>
                  {clinicSlots.map(slot => (
                    <tr key={slot.id}>
                      <td className="td-primary">{slot.hour}:00 AM</td>
                      <td>{slot.gender_restriction ?? '—'}</td>
                      <td>{slot.signed_up_count}</td>
                      <td>{slot.capacity}</td>
                      <td><span className={`badge badge-${slot.is_full ? 'cancelled' : 'available'}`}>{slot.is_full ? 'Full' : 'Open'}</span></td>
                      <td>
                        {slot.access_code
                          ? <span style={{ fontFamily: 'monospace', color: '#4ade80', fontSize: 13, letterSpacing: '0.12em' }}>{slot.access_code}</span>
                          : <span style={{ color: 'var(--staff-dim)', fontSize: 11 }}>Not generated</span>
                        }
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
                <span className="staff-section-label">Director</span>
                <h1 className="staff-page-title">Coach Availability</h1>
              </div>
              <button className="btn-staff-ghost" onClick={fetchAvailability}>Refresh</button>
            </div>

            {availMsg && <div className={availMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{availMsg.text}</div>}

            {availLoading ? (
              <div className="staff-empty">Loading requests…</div>
            ) : availability.length === 0 ? (
              <div className="staff-empty">No availability requests.</div>
            ) : (
              <table className="staff-table">
                <thead><tr><th>Coach</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Approved At</th><th></th></tr></thead>
                <tbody>
                  {availability.map(a => (
                    <tr key={a.id}>
                      <td className="td-primary">{a.coach ? `${a.coach.first_name} ${a.coach.last_name}` : '—'}</td>
                      <td>{a.unavailable_from.split('T')[0]}</td>
                      <td>{a.unavailable_to.split('T')[0]}</td>
                      <td style={{ maxWidth: 200, fontSize: 12 }}>{a.reason ?? '—'}</td>
                      <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                      <td>{a.approved_at ? new Date(a.approved_at).toLocaleDateString() : '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        {a.status === 'pending' && (
                          <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn-staff-approve" onClick={() => updateAvailability(a.id, 'approved')}>Approve</button>
                            <button className="btn-staff-danger" onClick={() => updateAvailability(a.id, 'rejected')}>Reject</button>
                          </span>
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
            TAB: MEMBERS
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'members' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Director</span>
                <h1 className="staff-page-title">Members</h1>
              </div>
              <button className="btn-staff-primary" onClick={() => setShowNewMember(v => !v)}>
                {showNewMember ? 'Cancel' : '+ New Member'}
              </button>
            </div>

            {memberMsg && <div className={memberMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{memberMsg.text}</div>}

            {showNewMember && (
              <div className="staff-card" style={{ maxWidth: 580, marginBottom: 28 }}>
                <div className="staff-card-title">Create Member Profile</div>
                <div className="form-row">
                  <div className="form-group"><label className="staff-label-text">First Name</label><input className="staff-input" value={newMemberForm.first_name} onChange={e => setNewMemberForm(p => ({ ...p, first_name: e.target.value }))} /></div>
                  <div className="form-group"><label className="staff-label-text">Last Name</label><input className="staff-input" value={newMemberForm.last_name} onChange={e => setNewMemberForm(p => ({ ...p, last_name: e.target.value }))} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="staff-label-text">Audit Number</label><input className="staff-input" value={newMemberForm.audit_number} onChange={e => setNewMemberForm(p => ({ ...p, audit_number: e.target.value }))} /></div>
                  <div className="form-group"><label className="staff-label-text">Phone</label><input className="staff-input" value={newMemberForm.phone} onChange={e => setNewMemberForm(p => ({ ...p, phone: e.target.value }))} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="staff-label-text">Gender</label>
                    <select className="staff-input" value={newMemberForm.gender} onChange={e => setNewMemberForm(p => ({ ...p, gender: e.target.value }))}>
                      <option value="">—</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="staff-label-text">Date of Birth</label><input type="date" className="staff-input" value={newMemberForm.date_of_birth} onChange={e => setNewMemberForm(p => ({ ...p, date_of_birth: e.target.value }))} /></div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={newMemberForm.is_child} onChange={e => setNewMemberForm(p => ({ ...p, is_child: e.target.checked }))} style={{ accentColor: 'var(--crimson)' }} />
                    <span className="staff-label-text" style={{ marginBottom: 0 }}>Child Account</span>
                  </label>
                </div>
                {newMemberForm.is_child && (
                  <div className="form-group"><label className="staff-label-text">Parent Profile ID</label><input className="staff-input" placeholder="Parent UUID" value={newMemberForm.parent_id} onChange={e => setNewMemberForm(p => ({ ...p, parent_id: e.target.value }))} /></div>
                )}
                <button className="btn-staff-primary" disabled={memberSubmitting || !newMemberForm.first_name || !newMemberForm.last_name || !newMemberForm.audit_number} onClick={createMember}>
                  {memberSubmitting ? 'Creating…' : 'Create Member'}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 24, maxWidth: 480 }}>
              <input className="staff-input" placeholder="Search by last name or audit number" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchMembers()} />
              <button className="btn-staff-primary" disabled={memberLoading} onClick={searchMembers}>Search</button>
            </div>

            {memberDetail ? (
              <div>
                <button className="btn-staff-ghost" style={{ marginBottom: 20 }} onClick={() => setMemberDetail(null)}>← Back</button>
                <div className="staff-card" style={{ maxWidth: 560 }}>
                  <div className="staff-card-title">{memberDetail.profile.first_name} {memberDetail.profile.last_name}</div>
                  <table className="staff-table">
                    <tbody>
                      {[['Audit #', memberDetail.profile.audit_number],['Phone', memberDetail.profile.phone ?? '—'],['Gender', memberDetail.profile.gender ?? '—'],['DOB', memberDetail.profile.date_of_birth ?? '—'],['Type', memberDetail.profile.is_child ? 'Child' : 'Adult'],['Role', memberDetail.profile.role ?? 'Member']].map(([k,v]) => (
                        <tr key={k}><td className="td-primary" style={{ width: 120 }}>{k}</td><td>{v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  {memberDetail.family.length > 0 && (
                    <>
                      <div className="staff-card-title" style={{ marginTop: 20 }}>Family</div>
                      <table className="staff-table">
                        <thead><tr><th>Name</th><th>Audit #</th><th>Type</th></tr></thead>
                        <tbody>
                          {memberDetail.family.map(f => (
                            <tr key={f.id}><td className="td-primary">{f.first_name} {f.last_name}</td><td>{f.audit_number}</td><td>{f.is_child ? 'Child' : 'Adult'}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              </div>
            ) : memberLoading ? (
              <div className="staff-empty">Searching…</div>
            ) : memberResults.length > 0 ? (
              <table className="staff-table">
                <thead><tr><th>Name</th><th>Audit #</th><th>Phone</th><th>Type</th><th>Role</th><th></th></tr></thead>
                <tbody>
                  {memberResults.map(m => (
                    <tr key={m.id}>
                      <td className="td-primary">{m.first_name} {m.last_name}</td>
                      <td>{m.audit_number}</td>
                      <td>{m.phone ?? '—'}</td>
                      <td>{m.is_child ? 'Child' : 'Adult'}</td>
                      <td><span className="badge badge-pending" style={{ fontSize: 9, display: m.role ? 'inline-block' : 'none' }}>{m.role}</span></td>
                      <td><button className="btn-staff-ghost" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => loadMemberDetail(m.id)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: STAFF
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'staff' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Director</span>
                <h1 className="staff-page-title">Staff Accounts</h1>
              </div>
            </div>

            {staffMsg && <div className={staffMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{staffMsg.text}</div>}

            <div className="staff-card" style={{ maxWidth: 540 }}>
              <div className="staff-card-title">Create Staff Account</div>
              <div className="form-row">
                <div className="form-group"><label className="staff-label-text">First Name</label><input className="staff-input" value={staffForm.first_name} onChange={e => setStaffForm(p => ({ ...p, first_name: e.target.value }))} /></div>
                <div className="form-group"><label className="staff-label-text">Last Name</label><input className="staff-input" value={staffForm.last_name} onChange={e => setStaffForm(p => ({ ...p, last_name: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="staff-label-text">Email Address</label><input type="email" className="staff-input" value={staffForm.email} onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="form-row">
                <div className="form-group"><label className="staff-label-text">Password</label><input type="password" className="staff-input" value={staffForm.password} onChange={e => setStaffForm(p => ({ ...p, password: e.target.value }))} /></div>
                <div className="form-group"><label className="staff-label-text">Phone</label><input className="staff-input" value={staffForm.phone} onChange={e => setStaffForm(p => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <div className="form-group" style={{ maxWidth: 200 }}>
                <label className="staff-label-text">Role</label>
                <select className="staff-input" value={staffForm.role} onChange={e => setStaffForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="coach">Coach</option>
                  <option value="tennis_house">Tennis House</option>
                </select>
              </div>
              <button className="btn-staff-primary" disabled={staffSubmitting || !staffForm.first_name || !staffForm.last_name || !staffForm.email || !staffForm.password} onClick={createStaff}>
                {staffSubmitting ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: TOOLS
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'tools' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Director</span>
                <h1 className="staff-page-title">Tools</h1>
              </div>
            </div>

            {toolMsg && <div className={toolMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{toolMsg.text}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, maxWidth: 720 }}>
              <div className="staff-card">
                <div className="staff-card-title">Lesson Confirmations</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--staff-muted)', lineHeight: 1.7, marginBottom: 20 }}>
                  Sends confirmation requests to members with upcoming lessons that haven&apos;t been confirmed yet.
                </p>
                {confirmationsResult !== null && (
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 24, fontWeight: 600, color: 'var(--staff-text)', marginBottom: 12 }}>
                    {confirmationsResult} <span style={{ fontSize: 12, color: 'var(--staff-muted)', fontWeight: 400 }}>sent</span>
                  </div>
                )}
                <button className="btn-staff-primary" disabled={toolLoading === 'confirmations'} onClick={sendConfirmations}>
                  {toolLoading === 'confirmations' ? 'Sending…' : 'Send Confirmations'}
                </button>
              </div>

              <div className="staff-card">
                <div className="staff-card-title">Pickup Escalation</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--staff-muted)', lineHeight: 1.7, marginBottom: 20 }}>
                  Escalates unclaimed pickup lesson requests to the director. Run when requests have been waiting too long.
                </p>
                {escalationResult !== null && (
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 24, fontWeight: 600, color: 'var(--staff-text)', marginBottom: 12 }}>
                    {escalationResult} <span style={{ fontSize: 12, color: 'var(--staff-muted)', fontWeight: 400 }}>escalated</span>
                  </div>
                )}
                <button className="btn-staff-primary" disabled={toolLoading === 'escalation'} onClick={escalatePickup}>
                  {toolLoading === 'escalation' ? 'Escalating…' : 'Escalate Pickup Requests'}
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </StaffLayout>
  );
}
