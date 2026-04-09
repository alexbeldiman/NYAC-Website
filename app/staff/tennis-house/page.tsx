'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import StaffLayout from '@/components/staff/StaffLayout';

// ─── Types ────────────────────────────────────────────────────
interface Profile { id: string; first_name: string; last_name: string; role: string; }
interface CoachOption { id: string; first_name: string; last_name: string; }
interface LessonOnCourt {
  id: string; start_time: string; duration_minutes: number;
  status: string; court_id: string | null;
  member: { first_name: string; last_name: string } | null;
  coach: { first_name: string; last_name: string } | null;
}
interface CourtScheduleRow {
  id: string; name: string; is_pro_court: boolean;
  status: 'available' | 'blocked' | 'maintenance';
  blocked_reason: string | null; lessons: LessonOnCourt[];
}
interface Court { id: string; name: string; is_pro_court: boolean; status: string; blocked_reason: string | null; }
interface ClinicSlot { id: string; date: string; hour: number; gender_restriction: string | null; capacity: number; signed_up_count: number; is_full: boolean; }
interface Member { id: string; first_name: string; last_name: string; audit_number: string; phone: string | null; is_child: boolean; parent_id: string | null; }
interface MemberDetail { profile: Member; family: Member[]; }
interface ProgramSession {
  id: string; program: string; start_time: string;
  attendance: { child_id: string; checked_in_at: string | null; age_exception: boolean; child: { first_name: string; last_name: string; date_of_birth: string } | null }[];
}

const TABS = [
  { id: 'courts',    label: 'Court Schedule' },
  { id: 'status',    label: 'Court Status'   },
  { id: 'checkin',   label: 'Clinic Check-in'},
  { id: 'walkin',    label: 'Walk-in Booking'},
  { id: 'members',   label: 'Members'        },
  { id: 'programs',  label: 'Programs'       },
];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function addDays(date: string, n: number) {
  const d = new Date(date); d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
function fmtDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── Main Component ───────────────────────────────────────────
export default function TennisHousePage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [initLoading, setInitLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courts');

  // Courts tab
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [courtSchedule, setCourtSchedule] = useState<CourtScheduleRow[]>([]);
  const [courtsLoading, setCourtsLoading] = useState(false);
  const [assigningLesson, setAssigningLesson] = useState<string | null>(null);
  const [assignCourtId, setAssignCourtId] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);

  // Court status tab
  const [allCourts, setAllCourts] = useState<Court[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [editingCourt, setEditingCourt] = useState<string | null>(null);
  const [statusForm, setStatusForm] = useState({ status: 'available', blocked_reason: '' });
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check-in tab
  const [clinicSlots, setClinicSlots] = useState<ClinicSlot[]>([]);
  const [clinicLoading, setClinicLoading] = useState(false);
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});
  const [codeResults, setCodeResults] = useState<Record<string, boolean | null>>({});
  const [verifying, setVerifying] = useState<string | null>(null);

  // Walk-in booking tab
  const [coaches, setCoaches] = useState<CoachOption[]>([]);
  const [walkStep, setWalkStep] = useState<1 | 2>(1);
  const [walkVerifyForm, setWalkVerifyForm] = useState({ last_name: '', audit_number: '' });
  const [walkResults, setWalkResults] = useState<Member[]>([]);
  const [walkSelected, setWalkSelected] = useState<Member | null>(null);
  const [walkBookForm, setWalkBookForm] = useState({ start_time: '', duration_minutes: 60, coach_id: '' });
  const [walkLoading, setWalkLoading] = useState(false);
  const [walkMsg, setWalkMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Members tab
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);

  // Programs tab
  const [progDate, setProgDate] = useState(todayStr());
  const [progSessions, setProgSessions] = useState<ProgramSession[]>([]);
  const [progLoading, setProgLoading] = useState(false);

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

  // ─── Fetch court schedule ─────────────────────────────────
  const fetchCourtSchedule = useCallback(async (date: string) => {
    setCourtsLoading(true);
    try {
      const res = await fetch(`/api/courts/schedule?date=${date}`);
      const data = await res.json();
      setCourtSchedule(Array.isArray(data) ? data : []);
    } catch { setCourtSchedule([]); }
    finally { setCourtsLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'courts') fetchCourtSchedule(selectedDate);
  }, [activeTab, selectedDate, fetchCourtSchedule]);

  // ─── Fetch all courts ─────────────────────────────────────
  const fetchAllCourts = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/courts');
      const data = await res.json();
      setAllCourts(Array.isArray(data) ? data : []);
    } catch { setAllCourts([]); }
    finally { setStatusLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'status') fetchAllCourts();
  }, [activeTab, fetchAllCourts]);

  // ─── Fetch clinic slots ───────────────────────────────────
  const fetchClinicSlots = useCallback(async () => {
    setClinicLoading(true);
    try {
      const res = await fetch(`/api/clinics/slots?date=${todayStr()}`);
      const data = await res.json();
      setClinicSlots(Array.isArray(data) ? data : []);
    } catch { setClinicSlots([]); }
    finally { setClinicLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'checkin') fetchClinicSlots();
  }, [activeTab, fetchClinicSlots]);

  // ─── Fetch coaches ────────────────────────────────────────
  const fetchCoaches = useCallback(async () => {
    try {
      const res = await fetch('/api/coaches/public');
      const data = await res.json();
      setCoaches(Array.isArray(data) ? data : []);
    } catch { setCoaches([]); }
  }, []);

  useEffect(() => {
    if (activeTab === 'walkin') fetchCoaches();
  }, [activeTab, fetchCoaches]);

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

  // ─── Assign court ─────────────────────────────────────────
  async function assignCourt(lessonId: string) {
    if (!assignCourtId) return;
    setAssignError(null);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/court`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ court_id: assignCourtId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setAssignError(d.error ?? 'Failed to assign court');
        return;
      }
      setAssigningLesson(null);
      setAssignCourtId('');
      fetchCourtSchedule(selectedDate);
    } catch { setAssignError('Failed to assign court'); }
  }

  // ─── Update court status ──────────────────────────────────
  async function updateCourtStatus(courtId: string) {
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/courts/${courtId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusForm.status,
          blocked_reason: statusForm.status !== 'available' ? statusForm.blocked_reason : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setStatusMsg({ type: 'error', text: d.error ?? 'Update failed' });
        return;
      }
      setEditingCourt(null);
      setStatusMsg({ type: 'success', text: 'Court status updated.' });
      fetchAllCourts();
    } catch { setStatusMsg({ type: 'error', text: 'Update failed' }); }
  }

  // ─── Verify clinic code ───────────────────────────────────
  async function verifyCode(slotId: string) {
    const code = codeInputs[slotId] ?? '';
    if (!code) return;
    setVerifying(slotId);
    try {
      const res = await fetch('/api/clinics/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, slot_id: slotId }),
      });
      const d = await res.json();
      setCodeResults(prev => ({ ...prev, [slotId]: d.success === true }));
    } catch { setCodeResults(prev => ({ ...prev, [slotId]: false })); }
    finally { setVerifying(null); }
  }

  // ─── Walk-in: verify member ───────────────────────────────
  async function verifyMember() {
    setWalkLoading(true);
    setWalkMsg(null);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walkVerifyForm),
      });
      const d = await res.json();
      if (!res.ok) { setWalkMsg({ type: 'error', text: d.error ?? 'Not found' }); return; }
      const all = [...(d.adults ?? []), ...(d.children ?? [])];
      if (all.length === 0) { setWalkMsg({ type: 'error', text: 'No member found with that name and audit number.' }); return; }
      setWalkResults(all);
      if (all.length === 1) { setWalkSelected(all[0]); setWalkStep(2); }
    } catch { setWalkMsg({ type: 'error', text: 'Verification failed' }); }
    finally { setWalkLoading(false); }
  }

  // ─── Walk-in: book lesson ─────────────────────────────────
  async function bookWalkIn() {
    if (!walkSelected) return;
    setWalkLoading(true);
    setWalkMsg(null);
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_name: walkSelected.last_name,
          audit_number: walkSelected.audit_number,
          member_id: walkSelected.id,
          start_time: walkBookForm.start_time,
          duration_minutes: walkBookForm.duration_minutes,
          coach_id: walkBookForm.coach_id || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setWalkMsg({ type: 'error', text: d.error ?? 'Booking failed' }); return; }
      setWalkMsg({ type: 'success', text: `Lesson booked for ${walkSelected.first_name} ${walkSelected.last_name}.` });
      setWalkStep(1);
      setWalkSelected(null);
      setWalkResults([]);
      setWalkVerifyForm({ last_name: '', audit_number: '' });
      setWalkBookForm({ start_time: '', duration_minutes: 60, coach_id: '' });
    } catch { setWalkMsg({ type: 'error', text: 'Booking failed' }); }
    finally { setWalkLoading(false); }
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

  if (initLoading) return <div style={{ background: 'var(--staff-bg)', minHeight: '100vh' }} />;

  const userName = user ? `${user.first_name} ${user.last_name}` : '';

  return (
    <StaffLayout role={user?.role ?? ''} userName={userName} tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="staff-content">

        {/* ══════════════════════════════════════════════════════
            TAB: COURT SCHEDULE
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'courts' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Tennis House</span>
                <h1 className="staff-page-title">Court Schedule</h1>
              </div>
              <div className="date-controls">
                <button onClick={() => setSelectedDate(d => addDays(d, -1))}>‹</button>
                <span className="date-display">{fmtDate(selectedDate)}</span>
                <button onClick={() => setSelectedDate(d => addDays(d, 1))}>›</button>
                <input type="date" className="staff-input" style={{ width: 'auto' }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              </div>
            </div>

            {courtsLoading ? (
              <div className="staff-empty">Loading schedule…</div>
            ) : courtSchedule.length === 0 ? (
              <div className="staff-empty">No data for this date.</div>
            ) : (
              <>
                {assignError && <div className="staff-error">{assignError}</div>}
                {courtSchedule.map(court => (
                  <div key={court.id} className="court-row">
                    <div>
                      <div className="court-row-name">{court.name}{court.is_pro_court && <span style={{ color: 'var(--crimson)', marginLeft: 6, fontSize: 9 }}>PRO</span>}</div>
                      <span className={`badge badge-${court.status}`} style={{ marginTop: 4, display: 'inline-block' }}>{court.status}</span>
                    </div>
                    <div className="court-row-lessons">
                      {court.status !== 'available' && court.blocked_reason && (
                        <span style={{ color: 'var(--staff-muted)', fontSize: 12 }}>{court.blocked_reason}</span>
                      )}
                      {court.lessons.length === 0 && court.status === 'available' && (
                        <span style={{ color: 'var(--staff-dim)', fontSize: 12 }}>No lessons scheduled</span>
                      )}
                      {court.lessons.map(lesson => (
                        <div key={lesson.id} className={`lesson-chip${!lesson.court_id ? ' lesson-chip-unassigned' : ''}`}>
                          <span className="lesson-chip-time">{fmtTime(lesson.start_time)}</span>
                          <span className="lesson-chip-name">
                            {lesson.member ? `${lesson.member.first_name} ${lesson.member.last_name}` : '—'}
                            {lesson.coach ? ` / ${lesson.coach.last_name}` : ''}
                          </span>
                          {!lesson.court_id && (
                            assigningLesson === lesson.id ? (
                              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <select className="staff-input" style={{ width: 120, padding: '4px 8px', fontSize: 11 }} value={assignCourtId} onChange={e => setAssignCourtId(e.target.value)}>
                                  <option value="">Select court</option>
                                  {courtSchedule.filter(c => c.status === 'available').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button className="btn-staff-primary" style={{ padding: '4px 10px', fontSize: 10 }} onClick={() => assignCourt(lesson.id)}>Assign</button>
                                <button className="btn-staff-ghost" style={{ padding: '4px 8px', fontSize: 10 }} onClick={() => setAssigningLesson(null)}>✕</button>
                              </span>
                            ) : (
                              <button className="btn-staff-ghost" style={{ padding: '3px 8px', fontSize: 10 }} onClick={() => { setAssigningLesson(lesson.id); setAssignCourtId(''); }}>Assign Court</button>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: COURT STATUS
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'status' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Tennis House</span>
                <h1 className="staff-page-title">Court Status</h1>
              </div>
              <button className="btn-staff-ghost" onClick={fetchAllCourts}>Refresh</button>
            </div>

            {statusMsg && <div className={statusMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{statusMsg.text}</div>}

            {statusLoading ? (
              <div className="staff-empty">Loading courts…</div>
            ) : (
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Court</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allCourts.map(court => (
                    <tr key={court.id}>
                      <td className="td-primary">{court.name}</td>
                      <td>{court.is_pro_court ? <span className="badge" style={{ background: 'rgba(200,16,46,0.12)', color: 'var(--crimson)' }}>Pro</span> : '—'}</td>
                      <td>
                        {editingCourt === court.id ? (
                          <select className="staff-input" style={{ width: 130, padding: '5px 8px', fontSize: 12 }} value={statusForm.status} onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))}>
                            <option value="available">Available</option>
                            <option value="blocked">Blocked</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        ) : (
                          <span className={`badge badge-${court.status}`}>{court.status}</span>
                        )}
                      </td>
                      <td>
                        {editingCourt === court.id && statusForm.status !== 'available' ? (
                          <input className="staff-input" style={{ fontSize: 12, padding: '5px 8px' }} placeholder="Reason (optional)" value={statusForm.blocked_reason} onChange={e => setStatusForm(p => ({ ...p, blocked_reason: e.target.value }))} />
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--staff-muted)' }}>{court.blocked_reason ?? '—'}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {editingCourt === court.id ? (
                          <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn-staff-primary" style={{ padding: '6px 14px' }} onClick={() => updateCourtStatus(court.id)}>Save</button>
                            <button className="btn-staff-ghost" style={{ padding: '6px 10px' }} onClick={() => setEditingCourt(null)}>Cancel</button>
                          </span>
                        ) : (
                          <button className="btn-staff-ghost" style={{ padding: '6px 14px' }} onClick={() => { setEditingCourt(court.id); setStatusForm({ status: court.status, blocked_reason: court.blocked_reason ?? '' }); }}>Edit</button>
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
            TAB: CLINIC CHECK-IN
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'checkin' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Tennis House</span>
                <h1 className="staff-page-title">Clinic Check-in</h1>
              </div>
              <span style={{ color: 'var(--staff-muted)', fontFamily: 'var(--font-ui)', fontSize: 12 }}>{fmtDate(todayStr())}</span>
            </div>

            {clinicLoading ? (
              <div className="staff-empty">Loading today&apos;s slots…</div>
            ) : clinicSlots.length === 0 ? (
              <div className="staff-empty">No clinic slots scheduled for today.</div>
            ) : (
              clinicSlots.map(slot => (
                <div key={slot.id} className="staff-card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-label)', fontSize: 18, color: 'var(--staff-text)', marginBottom: 4 }}>
                        {slot.hour}:00 AM {slot.gender_restriction ? `— ${slot.gender_restriction}` : ''}
                      </div>
                      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--staff-muted)', letterSpacing: '0.08em' }}>
                        {slot.signed_up_count} / {slot.capacity} signed up{slot.is_full ? ' · Full' : ''}
                      </div>
                    </div>
                    <span className={`badge badge-${slot.is_full ? 'cancelled' : 'available'}`}>{slot.is_full ? 'Full' : 'Open'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      className="staff-input"
                      style={{ maxWidth: 200 }}
                      placeholder="Enter access code"
                      value={codeInputs[slot.id] ?? ''}
                      onChange={e => setCodeInputs(p => ({ ...p, [slot.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && verifyCode(slot.id)}
                    />
                    <button className="btn-staff-primary" disabled={verifying === slot.id} onClick={() => verifyCode(slot.id)}>
                      {verifying === slot.id ? 'Checking…' : 'Verify'}
                    </button>
                    {codeResults[slot.id] === true && <span className="badge badge-confirmed">✓ Valid</span>}
                    {codeResults[slot.id] === false && <span className="badge badge-cancelled">✗ Invalid</span>}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: WALK-IN BOOKING
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'walkin' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Tennis House</span>
                <h1 className="staff-page-title">Walk-in Booking</h1>
              </div>
            </div>

            {walkMsg && <div className={walkMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{walkMsg.text}</div>}

            {walkStep === 1 && (
              <div className="staff-card" style={{ maxWidth: 480 }}>
                <div className="staff-card-title">Step 1 — Identify Member</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="staff-label-text">Last Name</label>
                    <input className="staff-input" value={walkVerifyForm.last_name} onChange={e => setWalkVerifyForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Smith" />
                  </div>
                  <div className="form-group">
                    <label className="staff-label-text">Audit Number</label>
                    <input className="staff-input" value={walkVerifyForm.audit_number} onChange={e => setWalkVerifyForm(p => ({ ...p, audit_number: e.target.value }))} placeholder="12345" />
                  </div>
                </div>
                <button className="btn-staff-primary" disabled={walkLoading || !walkVerifyForm.last_name || !walkVerifyForm.audit_number} onClick={verifyMember}>
                  {walkLoading ? 'Looking up…' : 'Find Member'}
                </button>
                {walkResults.length > 1 && (
                  <div style={{ marginTop: 20 }}>
                    <div className="staff-label-text" style={{ marginBottom: 10 }}>Select member</div>
                    {walkResults.map(m => (
                      <button key={m.id} className="btn-staff-ghost" style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: '12px 16px' }}
                        onClick={() => { setWalkSelected(m); setWalkStep(2); }}>
                        {m.first_name} {m.last_name} — #{m.audit_number}{m.is_child ? ' (child)' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {walkStep === 2 && walkSelected && (
              <div className="staff-card" style={{ maxWidth: 540 }}>
                <div className="staff-card-title">
                  Step 2 — Book Lesson for {walkSelected.first_name} {walkSelected.last_name}
                  <button className="btn-staff-ghost" style={{ float: 'right', padding: '3px 10px', fontSize: 10 }} onClick={() => { setWalkStep(1); setWalkSelected(null); }}>← Back</button>
                </div>
                <div className="form-group">
                  <label className="staff-label-text">Start Time</label>
                  <input type="datetime-local" className="staff-input" value={walkBookForm.start_time} onChange={e => setWalkBookForm(p => ({ ...p, start_time: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="staff-label-text">Duration (minutes)</label>
                    <select className="staff-input" value={walkBookForm.duration_minutes} onChange={e => setWalkBookForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) }))}>
                      <option value={30}>30 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                      <option value={120}>120 min</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="staff-label-text">Coach (optional)</label>
                    <select className="staff-input" value={walkBookForm.coach_id} onChange={e => setWalkBookForm(p => ({ ...p, coach_id: e.target.value }))}>
                      <option value="">Any available / Pickup</option>
                      {coaches.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                    </select>
                  </div>
                </div>
                <button className="btn-staff-primary" disabled={walkLoading || !walkBookForm.start_time} onClick={bookWalkIn}>
                  {walkLoading ? 'Booking…' : 'Book Lesson'}
                </button>
              </div>
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
                <span className="staff-section-label">Tennis House</span>
                <h1 className="staff-page-title">Member Lookup</h1>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, maxWidth: 480 }}>
              <input className="staff-input" placeholder="Search by last name or audit number" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchMembers()} />
              <button className="btn-staff-primary" disabled={memberLoading} onClick={searchMembers}>Search</button>
            </div>

            {memberDetail ? (
              <div>
                <button className="btn-staff-ghost" style={{ marginBottom: 20 }} onClick={() => setMemberDetail(null)}>← Back to results</button>
                <div className="staff-card" style={{ maxWidth: 560 }}>
                  <div className="staff-card-title">{memberDetail.profile.first_name} {memberDetail.profile.last_name}</div>
                  <table className="staff-table">
                    <tbody>
                      <tr><td className="td-primary" style={{ width: 140 }}>Audit #</td><td>{memberDetail.profile.audit_number}</td></tr>
                      <tr><td className="td-primary">Phone</td><td>{memberDetail.profile.phone ?? '—'}</td></tr>
                      <tr><td className="td-primary">Type</td><td>{memberDetail.profile.is_child ? 'Child' : 'Adult'}</td></tr>
                    </tbody>
                  </table>
                  {memberDetail.family.length > 0 && (
                    <>
                      <div className="staff-card-title" style={{ marginTop: 20 }}>Family Members</div>
                      <table className="staff-table">
                        <thead><tr><th>Name</th><th>Audit #</th><th>Type</th></tr></thead>
                        <tbody>
                          {memberDetail.family.map(f => (
                            <tr key={f.id}>
                              <td className="td-primary">{f.first_name} {f.last_name}</td>
                              <td>{f.audit_number}</td>
                              <td>{f.is_child ? 'Child' : 'Adult'}</td>
                            </tr>
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
                <thead><tr><th>Name</th><th>Audit #</th><th>Phone</th><th>Type</th><th></th></tr></thead>
                <tbody>
                  {memberResults.map(m => (
                    <tr key={m.id}>
                      <td className="td-primary">{m.first_name} {m.last_name}</td>
                      <td>{m.audit_number}</td>
                      <td>{m.phone ?? '—'}</td>
                      <td>{m.is_child ? 'Child' : 'Adult'}</td>
                      <td><button className="btn-staff-ghost" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => loadMemberDetail(m.id)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: PROGRAMS
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'programs' && (
          <>
            <div className="staff-page-header">
              <div>
                <span className="staff-section-label">Tennis House</span>
                <h1 className="staff-page-title">MITL &amp; Academy</h1>
              </div>
              <div className="date-controls">
                <button onClick={() => setProgDate(d => addDays(d, -1))}>‹</button>
                <span className="date-display">{fmtDate(progDate)}</span>
                <button onClick={() => setProgDate(d => addDays(d, 1))}>›</button>
                <input type="date" className="staff-input" style={{ width: 'auto' }} value={progDate} onChange={e => setProgDate(e.target.value)} />
              </div>
            </div>

            {progLoading ? (
              <div className="staff-empty">Loading sessions…</div>
            ) : progSessions.length === 0 ? (
              <div className="staff-empty">No program sessions for this date.</div>
            ) : (
              progSessions.map(session => (
                <div key={session.id} className="staff-card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ fontFamily: 'var(--font-label)', fontSize: 18, color: 'var(--staff-text)' }}>
                      {session.program} — {fmtTime(session.start_time)}
                    </div>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--staff-muted)' }}>
                      {session.attendance.length} enrolled
                    </span>
                  </div>
                  {session.attendance.length === 0 ? (
                    <div style={{ color: 'var(--staff-dim)', fontSize: 12 }}>No attendance records.</div>
                  ) : (
                    <table className="staff-table">
                      <thead><tr><th>Name</th><th>DOB</th><th>Checked In</th><th>Age Exception</th></tr></thead>
                      <tbody>
                        {session.attendance.map((a, i) => (
                          <tr key={i}>
                            <td className="td-primary">{a.child?.first_name} {a.child?.last_name}</td>
                            <td>{a.child?.date_of_birth ?? '—'}</td>
                            <td>{a.checked_in_at ? fmtTime(a.checked_in_at) : <span style={{ color: 'var(--staff-dim)' }}>Not yet</span>}</td>
                            <td>{a.age_exception ? <span className="badge badge-pending">Yes</span> : '—'}</td>
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

      </div>
    </StaffLayout>
  );
}
