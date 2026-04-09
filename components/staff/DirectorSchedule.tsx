'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────
interface CoachOption { id: string; first_name: string; last_name: string; }
interface Court { id: string; name: string; is_pro_court: boolean; status: string; blocked_reason: string | null; }
interface LessonBlock {
  id: string; start_time: string; duration_minutes: number; status: string;
  court_id: string | null;
  member: { first_name: string; last_name: string } | null;
  coach: { first_name: string; last_name: string } | null;
}
interface CourtRow extends Court { lessons: LessonBlock[]; }
interface Member { id: string; first_name: string; last_name: string; audit_number: string; is_child: boolean; }

type BookingType = 'member' | 'private' | 'event';

interface Props { coaches: CoachOption[]; }

// ─── Helpers ──────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7–20 (7am–8pm, last slot = 9pm end)
const TIMELINE_START = 7 * 60;   // 420 min
const TIMELINE_SPAN  = 14 * 60;  // 840 min

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtDate(d: string) { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }
function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
function minutesSinceMidnight(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}
function fmtHour(h: number) { return h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h-12}pm`; }
function fmtTimeFull(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getCalendarCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const offset = (firstDow + 6) % 7; // convert to Mon-first
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Main Component ───────────────────────────────────────────
export default function DirectorSchedule({ coaches }: Props) {
  // View
  const [view, setView]         = useState<'calendar' | 'day'>('calendar');
  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr());

  // Day view data
  const [courtSchedule, setCourtSchedule] = useState<CourtRow[]>([]);
  const [dayLoading, setDayLoading]       = useState(false);

  // All courts (for booking modals)
  const [allCourts, setAllCourts] = useState<Court[]>([]);

  // Booking modal
  const [bookingType, setBookingType] = useState<BookingType | null>(null);

  // ── Member booking ──────────────────────────────────────────
  const [mStep, setMStep]             = useState<1|2>(1);
  const [mVerifyForm, setMVerifyForm] = useState({ last_name: '', audit_number: '' });
  const [mResults, setMResults]       = useState<Member[]>([]);
  const [mSelected, setMSelected]     = useState<Member | null>(null);
  const [mBookForm, setMBookForm]     = useState({ start_time: '', duration_minutes: 60, coach_id: '', court_id: '' });
  const [mLoading, setMLoading]       = useState(false);
  const [mMsg, setMMsg]               = useState<{ type: 'success'|'error'; text: string } | null>(null);

  // ── Private booking (assign court to existing lesson) ───────
  const [pDate, setPDate]           = useState(todayStr());
  const [pLessons, setPLessons]     = useState<LessonBlock[]>([]);
  const [pSelected, setPSelected]   = useState<LessonBlock | null>(null);
  const [pCourtId, setPCourtId]     = useState('');
  const [pLoading, setPLoading]     = useState(false);
  const [pMsg, setPMsg]             = useState<{ type: 'success'|'error'; text: string } | null>(null);

  // ── Event booking ───────────────────────────────────────────
  const [eName, setEName]           = useState('');
  const [eCourts, setECourts]       = useState<string[]>([]);
  const [eDate, setEDate]           = useState(todayStr());
  const [eLoading, setELoading]     = useState(false);
  const [eMsg, setEMsg]             = useState<{ type: 'success'|'error'; text: string } | null>(null);

  // ─── Fetch day schedule ──────────────────────────────────────
  const fetchDay = useCallback(async (date: string) => {
    setDayLoading(true);
    try {
      const res = await fetch(`/api/courts/schedule?date=${date}`);
      const data = await res.json();
      setCourtSchedule(Array.isArray(data) ? data : []);
    } catch { setCourtSchedule([]); }
    finally { setDayLoading(false); }
  }, []);

  useEffect(() => {
    if (view === 'day') fetchDay(selectedDate);
  }, [view, selectedDate, fetchDay]);

  // ─── Fetch all courts (for modal) ────────────────────────────
  const fetchCourts = useCallback(async () => {
    try {
      const res = await fetch('/api/courts');
      const data = await res.json();
      setAllCourts(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (bookingType) fetchCourts();
  }, [bookingType, fetchCourts]);

  // ─── Fetch unassigned lessons (private booking) ──────────────
  async function fetchPrivateLessons(date: string) {
    setPLoading(true);
    try {
      const res = await fetch(`/api/lessons?date=${date}`);
      const data = await res.json();
      setPLessons(Array.isArray(data) ? data.filter((l: LessonBlock) => !l.court_id && l.status !== 'cancelled') : []);
    } catch { setPLessons([]); }
    finally { setPLoading(false); }
  }

  useEffect(() => {
    if (bookingType === 'private') fetchPrivateLessons(pDate);
  }, [bookingType, pDate]);

  // ─── Open day from calendar ───────────────────────────────────
  function openDay(day: number) {
    setSelectedDate(dateStr(calYear, calMonth, day));
    setView('day');
  }

  // ─── Calendar navigation ─────────────────────────────────────
  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  // ─── Member booking: verify ───────────────────────────────────
  async function verifyMember() {
    setMLoading(true); setMMsg(null);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mVerifyForm),
      });
      const d = await res.json();
      if (!res.ok) { setMMsg({ type: 'error', text: d.error ?? 'Not found' }); return; }
      const all = [...(d.adults ?? []), ...(d.children ?? [])];
      if (!all.length) { setMMsg({ type: 'error', text: 'No member found.' }); return; }
      setMResults(all);
      if (all.length === 1) { setMSelected(all[0]); setMStep(2); }
    } catch { setMMsg({ type: 'error', text: 'Verification failed' }); }
    finally { setMLoading(false); }
  }

  // ─── Member booking: book ─────────────────────────────────────
  async function bookForMember() {
    if (!mSelected) return;
    setMLoading(true); setMMsg(null);
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_name: mSelected.last_name,
          audit_number: mSelected.audit_number,
          member_id: mSelected.id,
          start_time: mBookForm.start_time,
          duration_minutes: mBookForm.duration_minutes,
          coach_id: mBookForm.coach_id || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setMMsg({ type: 'error', text: d.error ?? 'Booking failed' }); return; }

      // Assign court if selected
      if (mBookForm.court_id && d.id) {
        await fetch(`/api/lessons/${d.id}/court`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ court_id: mBookForm.court_id }),
        });
      }

      setMMsg({ type: 'success', text: `Booked for ${mSelected.first_name} ${mSelected.last_name}.` });
      setMStep(1); setMSelected(null); setMResults([]);
      setMVerifyForm({ last_name: '', audit_number: '' });
      setMBookForm({ start_time: '', duration_minutes: 60, coach_id: '', court_id: '' });
      if (view === 'day') fetchDay(selectedDate);
    } catch { setMMsg({ type: 'error', text: 'Booking failed' }); }
    finally { setMLoading(false); }
  }

  // ─── Private: assign court ────────────────────────────────────
  async function assignCourt() {
    if (!pSelected || !pCourtId) return;
    setPLoading(true); setPMsg(null);
    try {
      const res = await fetch(`/api/lessons/${pSelected.id}/court`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ court_id: pCourtId }),
      });
      const d = await res.json();
      if (!res.ok) { setPMsg({ type: 'error', text: d.error ?? 'Failed' }); return; }
      setPMsg({ type: 'success', text: 'Court assigned.' });
      setPSelected(null); setPCourtId('');
      fetchPrivateLessons(pDate);
      if (view === 'day') fetchDay(selectedDate);
    } catch { setPMsg({ type: 'error', text: 'Assignment failed' }); }
    finally { setPLoading(false); }
  }

  // ─── Event: block courts ──────────────────────────────────────
  async function blockEvent() {
    if (!eName || !eCourts.length) return;
    setELoading(true); setEMsg(null);
    try {
      await Promise.all(eCourts.map(id =>
        fetch(`/api/courts/${id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'blocked', blocked_reason: `${eName} — ${eDate}` }),
        })
      ));
      setEMsg({ type: 'success', text: `${eCourts.length} court(s) blocked for "${eName}".` });
      setEName(''); setECourts([]); setEDate(todayStr());
      if (view === 'day') fetchDay(selectedDate);
    } catch { setEMsg({ type: 'error', text: 'Blocking failed' }); }
    finally { setELoading(false); }
  }

  // ─── Render helpers ───────────────────────────────────────────
  const today = todayStr();
  const cells = getCalendarCells(calYear, calMonth);

  // ─── Lesson block position ────────────────────────────────────
  function lessonStyle(lesson: LessonBlock): React.CSSProperties {
    const startMin = minutesSinceMidnight(lesson.start_time);
    const left = Math.max(0, (startMin - TIMELINE_START) / TIMELINE_SPAN * 100);
    const width = Math.min(lesson.duration_minutes / TIMELINE_SPAN * 100, 100 - left);
    const colors: Record<string, string> = {
      confirmed: '#4ade80', pending_pickup: '#fbbf24', completed: '#94a3b8',
    };
    const borderColor = colors[lesson.status] ?? 'var(--crimson)';
    return { left: `${left}%`, width: `${width}%`, borderLeftColor: borderColor };
  }

  // Collect unassigned lessons
  const unassigned = courtSchedule.flatMap(c => c.lessons).filter(l => !l.court_id);

  return (
    <>
      <style suppressHydrationWarning>{`
        /* ─── CALENDAR ──────────────────────────────────────── */
        .cal-nav {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px;
        }
        .cal-nav-title {
          font-family: var(--font-label); font-size: 22px;
          color: var(--staff-text); font-weight: 400;
        }
        .cal-nav-btn {
          background: var(--staff-card); border: 1px solid var(--staff-border);
          color: var(--staff-muted); width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 16px; transition: background 0.15s;
        }
        .cal-nav-btn:hover { background: var(--staff-surface); color: var(--staff-text); }

        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }

        .cal-dow {
          font-family: var(--font-ui); font-size: 10px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--staff-dim); text-align: center; padding: 8px 0 12px;
        }

        .cal-cell {
          aspect-ratio: 1 / 0.85; background: var(--staff-card);
          border: 1px solid var(--staff-border); display: flex;
          align-items: flex-start; justify-content: flex-end;
          padding: 10px 12px; cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          font-family: var(--font-ui); font-size: 14px; font-weight: 500;
          color: var(--staff-muted); position: relative;
        }
        .cal-cell:hover { background: var(--staff-surface); color: var(--staff-text); border-color: var(--staff-border-hi); }
        .cal-cell.today { border-color: var(--crimson); color: var(--crimson); }
        .cal-cell.selected { background: var(--crimson); color: white; border-color: var(--crimson); }
        .cal-cell.selected:hover { background: var(--crimson-dk); }
        .cal-cell.empty { background: transparent; border-color: transparent; cursor: default; }
        .cal-cell.weekend { background: rgba(255,255,255,0.015); }

        /* ─── TIMELINE ──────────────────────────────────────── */
        .timeline-wrap { overflow-x: auto; min-width: 0; }

        .timeline-header {
          display: flex; border-bottom: 1px solid var(--staff-border);
          margin-bottom: 4px; padding-left: 110px;
          position: sticky; top: 0; background: var(--staff-bg); z-index: 2;
        }
        .timeline-hour-label {
          font-family: var(--font-ui); font-size: 10px; font-weight: 600;
          color: var(--staff-dim); letter-spacing: 0.1em;
          text-align: left; padding: 6px 0;
          flex: none; width: calc(100% / 14);
        }

        .timeline-row {
          display: flex; align-items: stretch; min-height: 44px;
          border-bottom: 1px solid var(--staff-border);
        }
        .timeline-court-name {
          font-family: var(--font-ui); font-size: 11px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--staff-muted); width: 110px; flex-shrink: 0;
          display: flex; align-items: center; padding-right: 12px;
          white-space: nowrap; overflow: hidden;
        }
        .timeline-track {
          flex: 1; position: relative; min-height: 44px;
          background: repeating-linear-gradient(
            90deg,
            transparent 0,
            transparent calc(100% / 14 - 1px),
            var(--staff-border) calc(100% / 14 - 1px),
            var(--staff-border) calc(100% / 14)
          );
        }
        .timeline-block {
          position: absolute; top: 6px; bottom: 6px;
          background: var(--staff-surface); border-left: 3px solid var(--crimson);
          padding: 0 8px; display: flex; align-items: center; gap: 6px;
          overflow: hidden; min-width: 40px;
          font-family: var(--font-ui); font-size: 11px; color: var(--staff-muted);
          white-space: nowrap;
        }
        .timeline-block-name { color: var(--staff-text); font-weight: 600; flex-shrink: 0; }

        .timeline-section-label {
          font-family: var(--font-ui); font-size: 10px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase; color: var(--staff-dim);
          padding: 12px 0 6px;
        }

        .unassigned-row .timeline-track { background: repeating-linear-gradient(
          90deg, transparent 0, transparent calc(100% / 14 - 1px),
          var(--staff-border) calc(100% / 14 - 1px), var(--staff-border) calc(100% / 14)
        ); }
        .unassigned-block { border-left-color: #fbbf24 !important; }

        /* ─── BOOKING MODAL ─────────────────────────────────── */
        .booking-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.75);
          z-index: 100; display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .booking-modal {
          background: var(--staff-surface); border: 1px solid var(--staff-border);
          width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
          position: relative;
        }
        .booking-modal::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0;
          height: 3px; background: var(--crimson);
        }
        .booking-modal-header {
          padding: 24px 28px 20px;
          border-bottom: 1px solid var(--staff-border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .booking-modal-title {
          font-family: var(--font-label); font-size: 20px; color: var(--staff-text);
        }
        .booking-close {
          background: none; border: none; color: var(--staff-dim);
          font-size: 20px; cursor: pointer; line-height: 1; padding: 4px;
          transition: color 0.15s;
        }
        .booking-close:hover { color: var(--staff-text); }
        .booking-modal-body { padding: 24px 28px; }

        .booking-type-grid {
          display: grid; grid-template-columns: 1fr; gap: 10px;
        }
        .booking-type-btn {
          background: var(--staff-card); border: 1px solid var(--staff-border);
          padding: 18px 20px; text-align: left; cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          display: flex; align-items: center; gap: 14px;
        }
        .booking-type-btn:hover { border-color: var(--crimson); background: rgba(200,16,46,0.05); }
        .booking-type-icon {
          width: 36px; height: 36px; background: rgba(200,16,46,0.12);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 16px;
        }
        .booking-type-title {
          font-family: var(--font-ui); font-size: 12px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--staff-text);
          margin-bottom: 3px;
        }
        .booking-type-desc {
          font-family: var(--font-body); font-size: 13px; color: var(--staff-muted);
        }

        .booking-back {
          background: none; border: none; color: var(--staff-dim); cursor: pointer;
          font-family: var(--font-ui); font-size: 11px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; padding: 0 0 16px;
          display: flex; align-items: center; gap: 6px;
          transition: color 0.15s;
        }
        .booking-back:hover { color: var(--staff-muted); }
      `}</style>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="staff-page-header">
        <div>
          <span className="staff-section-label">Director</span>
          <h1 className="staff-page-title">
            {view === 'calendar' ? `${MONTHS[calMonth]} ${calYear}` : fmtDate(selectedDate)}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {view === 'day' && (
            <button className="btn-staff-ghost" onClick={() => setView('calendar')}>← Calendar</button>
          )}
          <button className="btn-staff-primary" onClick={() => { setBookingType(null); setBookingType('member'); }}>
            + Book Court
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CALENDAR VIEW
      ══════════════════════════════════════════════════════ */}
      {view === 'calendar' && (
        <>
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
            <span className="cal-nav-title">{MONTHS[calMonth]} {calYear}</span>
            <button className="cal-nav-btn" onClick={nextMonth}>›</button>
          </div>

          <div className="cal-grid">
            {DAYS_SHORT.map(d => <div key={d} className="cal-dow">{d}</div>)}
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="cal-cell empty" />;
              const ds = dateStr(calYear, calMonth, day);
              const isToday    = ds === today;
              const isSelected = ds === selectedDate;
              const isWeekend  = (i % 7) >= 5;
              return (
                <div
                  key={i}
                  className={`cal-cell${isSelected ? ' selected' : isToday ? ' today' : ''}${isWeekend && !isSelected ? ' weekend' : ''}`}
                  onClick={() => openDay(day)}
                  title={`View ${fmtDate(ds)}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          DAY VIEW (TIMELINE)
      ══════════════════════════════════════════════════════ */}
      {view === 'day' && (
        <div className="timeline-wrap">
          {dayLoading ? (
            <div className="staff-empty">Loading schedule…</div>
          ) : (
            <>
              {/* Time header */}
              <div className="timeline-header">
                {HOURS.map(h => (
                  <div key={h} className="timeline-hour-label">{fmtHour(h)}</div>
                ))}
              </div>

              {/* Unassigned lessons row */}
              {unassigned.length > 0 && (
                <>
                  <div className="timeline-section-label">Unassigned</div>
                  <div className="timeline-row unassigned-row">
                    <div className="timeline-court-name" style={{ color: '#fbbf24' }}>No Court</div>
                    <div className="timeline-track" style={{ minWidth: 700 }}>
                      {unassigned.map(l => (
                        <div key={l.id} className="timeline-block unassigned-block" style={lessonStyle(l)}>
                          <span className="timeline-block-name">
                            {l.member ? l.member.last_name : '?'}
                          </span>
                          <span>{fmtTimeFull(l.start_time)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Courts */}
              {courtSchedule.length === 0 ? (
                <div className="staff-empty">No schedule data for this date.</div>
              ) : (
                <>
                  <div className="timeline-section-label">Courts</div>
                  {courtSchedule.map(court => (
                    <div key={court.id} className="timeline-row">
                      <div className="timeline-court-name">
                        {court.name}
                        {court.status !== 'available' && (
                          <span style={{ color: court.status === 'blocked' ? 'var(--crimson)' : '#fbbf24', marginLeft: 4, fontSize: 9 }}>●</span>
                        )}
                      </div>
                      <div className="timeline-track" style={{ minWidth: 700 }}>
                        {court.status !== 'available' && court.lessons.length === 0 && (
                          <div style={{ position: 'absolute', inset: '10px 8px', background: 'rgba(200,16,46,0.07)', border: '1px dashed rgba(200,16,46,0.25)', display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'rgba(200,16,46,0.6)', letterSpacing: '0.08em' }}>
                              {court.blocked_reason ?? court.status}
                            </span>
                          </div>
                        )}
                        {court.lessons.map(l => (
                          <div key={l.id} className="timeline-block" style={lessonStyle(l)}>
                            <span className="timeline-block-name">
                              {l.member ? l.member.last_name : '?'}
                            </span>
                            {l.coach && <span>/ {l.coach.last_name}</span>}
                            <span>{fmtTimeFull(l.start_time)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          BOOKING MODAL
      ══════════════════════════════════════════════════════ */}
      {bookingType !== null && (
        <div className="booking-overlay" onClick={e => { if (e.target === e.currentTarget) { setBookingType(null); setMStep(1); setMMsg(null); setPMsg(null); setEMsg(null); }}}>
          <div className="booking-modal">
            <div className="booking-modal-header">
              <span className="booking-modal-title">
                {bookingType === 'member'  ? 'Book — For a Member'   :
                 bookingType === 'private' ? 'Book — Scheduled Private' :
                                             'Book — Event'}
              </span>
              <button className="booking-close" onClick={() => { setBookingType(null); setMStep(1); setMMsg(null); setPMsg(null); setEMsg(null); }}>×</button>
            </div>

            <div className="booking-modal-body">

              {/* ── Type picker (when we open modal fresh via "+ Book Court") ── */}
              {/* We show the type picker first by routing through a null/initial state */}
              {/* Actually we set bookingType directly — so show 3-choice first */}

              {/* ── MEMBER FLOW ────────────────────────────── */}
              {bookingType === 'member' && (
                <>
                  {mMsg && <div className={mMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{mMsg.text}</div>}

                  {mStep === 1 ? (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="staff-label-text">Last Name</label>
                          <input className="staff-input" value={mVerifyForm.last_name} onChange={e => setMVerifyForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Smith" />
                        </div>
                        <div className="form-group">
                          <label className="staff-label-text">Audit Number</label>
                          <input className="staff-input" value={mVerifyForm.audit_number} onChange={e => setMVerifyForm(p => ({ ...p, audit_number: e.target.value }))} placeholder="12345" />
                        </div>
                      </div>
                      <button className="btn-staff-primary" disabled={mLoading || !mVerifyForm.last_name || !mVerifyForm.audit_number} onClick={verifyMember}>
                        {mLoading ? 'Looking up…' : 'Find Member'}
                      </button>
                      {mResults.length > 1 && (
                        <div style={{ marginTop: 20 }}>
                          <div className="staff-label-text" style={{ marginBottom: 10 }}>Select member</div>
                          {mResults.map(m => (
                            <button key={m.id} className="btn-staff-ghost" style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: '10px 16px' }}
                              onClick={() => { setMSelected(m); setMStep(2); }}>
                              {m.first_name} {m.last_name} — #{m.audit_number}{m.is_child ? ' (child)' : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <button className="booking-back" onClick={() => { setMStep(1); setMSelected(null); }}>← Back</button>
                      <div style={{ fontFamily: 'var(--font-label)', fontSize: 16, color: 'var(--staff-text)', marginBottom: 20 }}>
                        {mSelected?.first_name} {mSelected?.last_name}
                      </div>
                      <div className="form-group">
                        <label className="staff-label-text">Start Date &amp; Time</label>
                        <input type="datetime-local" className="staff-input" value={mBookForm.start_time} onChange={e => setMBookForm(p => ({ ...p, start_time: e.target.value }))} />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="staff-label-text">Duration</label>
                          <select className="staff-input" value={mBookForm.duration_minutes} onChange={e => setMBookForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) }))}>
                            <option value={30}>30 min</option><option value={60}>60 min</option>
                            <option value={90}>90 min</option><option value={120}>120 min</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="staff-label-text">Coach (optional)</label>
                          <select className="staff-input" value={mBookForm.coach_id} onChange={e => setMBookForm(p => ({ ...p, coach_id: e.target.value }))}>
                            <option value="">Any / Pickup</option>
                            {coaches.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="staff-label-text">Court (optional)</label>
                        <select className="staff-input" value={mBookForm.court_id} onChange={e => setMBookForm(p => ({ ...p, court_id: e.target.value }))}>
                          <option value="">Unassigned</option>
                          {allCourts.filter(c => c.status === 'available').map(c => <option key={c.id} value={c.id}>{c.name}{c.is_pro_court ? ' (Pro)' : ''}</option>)}
                        </select>
                      </div>
                      <button className="btn-staff-primary" disabled={mLoading || !mBookForm.start_time} onClick={bookForMember}>
                        {mLoading ? 'Booking…' : 'Book Court'}
                      </button>
                    </>
                  )}
                </>
              )}

              {/* ── PRIVATE FLOW ────────────────────────────── */}
              {bookingType === 'private' && (
                <>
                  {pMsg && <div className={pMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{pMsg.text}</div>}
                  <div className="form-group">
                    <label className="staff-label-text">Date</label>
                    <input type="date" className="staff-input" value={pDate} onChange={e => { setPDate(e.target.value); setPSelected(null); }} />
                  </div>
                  {pLoading ? (
                    <div style={{ color: 'var(--staff-dim)', fontSize: 12, padding: '12px 0' }}>Loading lessons…</div>
                  ) : pLessons.length === 0 ? (
                    <div style={{ color: 'var(--staff-dim)', fontSize: 12, padding: '12px 0' }}>No unassigned lessons for this date.</div>
                  ) : (
                    <>
                      <div className="staff-label-text" style={{ marginBottom: 8 }}>Select lesson</div>
                      {pLessons.map(l => (
                        <button key={l.id} className={`btn-staff-ghost`} style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: '10px 16px', borderColor: pSelected?.id === l.id ? 'var(--crimson)' : undefined }}
                          onClick={() => setPSelected(pSelected?.id === l.id ? null : l)}>
                          {fmtTimeFull(l.start_time)} · {l.duration_minutes}min
                          {l.member ? ` · ${l.member.first_name} ${l.member.last_name}` : ''}
                          {l.coach ? ` / ${l.coach.first_name} ${l.coach.last_name}` : ''}
                        </button>
                      ))}
                      {pSelected && (
                        <>
                          <div className="form-group" style={{ marginTop: 16 }}>
                            <label className="staff-label-text">Assign to Court</label>
                            <select className="staff-input" value={pCourtId} onChange={e => setPCourtId(e.target.value)}>
                              <option value="">Select court</option>
                              {allCourts.filter(c => c.status === 'available').map(c => <option key={c.id} value={c.id}>{c.name}{c.is_pro_court ? ' (Pro)' : ''}</option>)}
                            </select>
                          </div>
                          <button className="btn-staff-primary" disabled={pLoading || !pCourtId} onClick={assignCourt}>
                            {pLoading ? 'Assigning…' : 'Assign Court'}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── EVENT FLOW ──────────────────────────────── */}
              {bookingType === 'event' && (
                <>
                  {eMsg && <div className={eMsg.type === 'success' ? 'staff-success' : 'staff-error'}>{eMsg.text}</div>}
                  <div className="form-group">
                    <label className="staff-label-text">Event Name</label>
                    <input className="staff-input" placeholder="Member Tournament, Club Day…" value={eName} onChange={e => setEName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="staff-label-text">Date</label>
                    <input type="date" className="staff-input" value={eDate} onChange={e => setEDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="staff-label-text">Courts to Block</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 8 }}>
                      {allCourts.map(c => (
                        <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--staff-muted)' }}>
                          <input type="checkbox" checked={eCourts.includes(c.id)} onChange={e => setECourts(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} style={{ accentColor: 'var(--crimson)' }} />
                          {c.name}
                        </label>
                      ))}
                    </div>
                    {allCourts.length > 0 && (
                      <button className="btn-staff-ghost" style={{ marginTop: 10, padding: '6px 14px', fontSize: 10 }}
                        onClick={() => setECourts(eCourts.length === allCourts.length ? [] : allCourts.map(c => c.id))}>
                        {eCourts.length === allCourts.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                  <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--staff-dim)', marginBottom: 16, lineHeight: 1.6 }}>
                    Selected courts will be blocked with the event name. Unblock them manually via Court Status after the event.
                  </p>
                  <button className="btn-staff-primary" disabled={eLoading || !eName || !eCourts.length} onClick={blockEvent}>
                    {eLoading ? 'Blocking…' : `Block ${eCourts.length} Court${eCourts.length !== 1 ? 's' : ''}`}
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── Booking type selector (rendered as an additional overlay) ── */}
      {/* Actually surfaced via a choice modal when we first click "+ Book Court" */}
      {/* Handled below by rendering a choice picker first */}
    </>
  );
}
