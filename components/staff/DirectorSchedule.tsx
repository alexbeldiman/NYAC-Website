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

type BookingType = 'pick' | 'member' | 'private' | 'event';

interface Props { coaches: CoachOption[]; }

// ─── Helpers ──────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am–8pm
const TIMELINE_START = 7 * 60;
const TIMELINE_SPAN  = 14 * 60;

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
  const firstDow = new Date(year, month, 1).getDay();
  const offset = (firstDow + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const STATUS_COLOR: Record<string, string> = {
  confirmed:      '#4ade80',
  pending_pickup: '#fbbf24',
  completed:      '#64748b',
  cancelled:      '#ef4444',
};

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

  // Now indicator
  const [nowMin, setNowMin] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });
  useEffect(() => {
    const t = setInterval(() => { const d = new Date(); setNowMin(d.getHours() * 60 + d.getMinutes()); }, 60000);
    return () => clearInterval(t);
  }, []);

  // ── Member booking ──────────────────────────────────────────
  const [mStep, setMStep]             = useState<1|2>(1);
  const [mVerifyForm, setMVerifyForm] = useState({ last_name: '', audit_number: '' });
  const [mResults, setMResults]       = useState<Member[]>([]);
  const [mSelected, setMSelected]     = useState<Member | null>(null);
  const [mBookForm, setMBookForm]     = useState({ start_time: '', duration_minutes: 60, coach_id: '', court_id: '' });
  const [mLoading, setMLoading]       = useState(false);
  const [mMsg, setMMsg]               = useState<{ type: 'success'|'error'; text: string } | null>(null);

  // ── Private booking ─────────────────────────────────────────
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

  // ─── Fetch all courts ────────────────────────────────────────
  const fetchCourts = useCallback(async () => {
    try {
      const res = await fetch('/api/courts');
      const data = await res.json();
      setAllCourts(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (bookingType && bookingType !== 'pick') fetchCourts();
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

  // ─── Calendar navigation ─────────────────────────────────────
  function openDay(day: number) { setSelectedDate(dateStr(calYear, calMonth, day)); setView('day'); }
  function prevMonth() { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }
  function nextMonth() { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }

  // ─── Reset modal ─────────────────────────────────────────────
  function closeModal() {
    setBookingType(null);
    setMStep(1); setMSelected(null); setMResults([]);
    setMVerifyForm({ last_name: '', audit_number: '' });
    setMBookForm({ start_time: '', duration_minutes: 60, coach_id: '', court_id: '' });
    setMMsg(null); setPMsg(null); setEMsg(null);
    setPSelected(null); setPCourtId('');
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

  // ─── Computed ─────────────────────────────────────────────────
  const today = todayStr();
  const cells = getCalendarCells(calYear, calMonth);
  const unassigned = courtSchedule.flatMap(c => c.lessons).filter(l => !l.court_id);
  const nowPct = ((nowMin - TIMELINE_START) / TIMELINE_SPAN) * 100;
  const showNow = selectedDate === today && nowPct >= 0 && nowPct <= 100;

  function lessonStyle(lesson: LessonBlock): React.CSSProperties {
    const startMin = minutesSinceMidnight(lesson.start_time);
    const left = Math.max(0, (startMin - TIMELINE_START) / TIMELINE_SPAN * 100);
    const width = Math.min(lesson.duration_minutes / TIMELINE_SPAN * 100, 100 - left);
    const borderColor = STATUS_COLOR[lesson.status] ?? 'var(--crimson)';
    return { left: `${left}%`, width: `${width}%`, borderLeftColor: borderColor };
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <style suppressHydrationWarning>{`

        /* ══════════════════════════════════════════════════════
           SCHEDULE HEADER
        ══════════════════════════════════════════════════════ */
        .sch-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 16px;
        }
        .sch-header-left { display: flex; flex-direction: column; gap: 2px; }
        .sch-eyebrow {
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--crimson);
        }
        .sch-title {
          font-family: var(--font-label);
          font-size: 26px;
          font-weight: 400;
          color: var(--staff-text);
          line-height: 1;
        }
        .sch-header-actions { display: flex; gap: 8px; align-items: center; }

        /* ══════════════════════════════════════════════════════
           CALENDAR
        ══════════════════════════════════════════════════════ */
        .cal-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .cal-month-label {
          font-family: var(--font-label);
          font-size: 18px;
          color: var(--staff-muted);
          font-weight: 400;
          letter-spacing: 0.02em;
        }
        .cal-arrow {
          background: none;
          border: 1px solid var(--staff-border);
          color: var(--staff-dim);
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 15px;
          transition: border-color 0.15s, color 0.15s;
        }
        .cal-arrow:hover { border-color: var(--staff-border-hi); color: var(--staff-text); }

        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }
        .cal-dow {
          font-family: var(--font-ui);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--staff-dim);
          text-align: center;
          padding: 6px 0 10px;
        }
        .cal-cell {
          aspect-ratio: 1 / 0.82;
          background: var(--staff-card);
          border: 1px solid var(--staff-border);
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          padding: 8px 10px;
          cursor: pointer;
          transition: background 0.12s, border-color 0.12s, color 0.12s;
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 500;
          color: var(--staff-muted);
          position: relative;
          user-select: none;
        }
        .cal-cell:hover {
          background: var(--staff-surface);
          color: var(--staff-text);
          border-color: var(--staff-border-hi);
          z-index: 1;
        }
        .cal-cell.today {
          color: var(--crimson);
          border-color: rgba(200,16,46,0.45);
        }
        .cal-cell.today::after {
          content: '';
          position: absolute;
          top: 8px; left: 10px;
          width: 5px; height: 5px;
          background: var(--crimson);
          border-radius: 50%;
        }
        .cal-cell.selected {
          background: var(--crimson);
          color: white;
          border-color: var(--crimson);
        }
        .cal-cell.selected:hover { background: var(--crimson-dk); }
        .cal-cell.empty {
          background: transparent;
          border-color: transparent;
          cursor: default;
          pointer-events: none;
        }
        .cal-cell.weekend { background: rgba(255,255,255,0.012); }
        .cal-cell.weekend.empty { background: transparent; }

        /* ══════════════════════════════════════════════════════
           DAY VIEW TOOLBAR
        ══════════════════════════════════════════════════════ */
        .day-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .day-legend {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-left: auto;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--staff-dim);
        }
        .legend-dot {
          width: 8px; height: 8px;
          border-radius: 1px;
        }

        /* ══════════════════════════════════════════════════════
           TIMELINE
        ══════════════════════════════════════════════════════ */
        .timeline-wrap { overflow-x: auto; min-width: 0; }

        .timeline-header {
          display: flex;
          border-bottom: 1px solid var(--staff-border);
          padding-left: 120px;
          position: sticky;
          top: 0;
          background: var(--staff-bg);
          z-index: 2;
          margin-bottom: 0;
        }
        .timeline-hour {
          font-family: var(--font-ui);
          font-size: 9px;
          font-weight: 700;
          color: var(--staff-dim);
          letter-spacing: 0.12em;
          text-align: left;
          padding: 7px 0 7px;
          flex: none;
          width: calc(100% / 14);
        }

        .timeline-section-label {
          font-family: var(--font-ui);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--staff-dim);
          padding: 14px 0 5px;
          border-top: 1px solid var(--staff-border);
          margin-top: 4px;
        }
        .timeline-section-label:first-of-type {
          border-top: none;
          margin-top: 0;
        }

        .timeline-row {
          display: flex;
          align-items: stretch;
          min-height: 46px;
          border-bottom: 1px solid var(--staff-border);
        }
        .timeline-row:last-child { border-bottom: none; }
        .timeline-row:nth-child(even) .timeline-track {
          background-image: repeating-linear-gradient(
            90deg,
            transparent 0,
            transparent calc(100% / 14 - 1px),
            var(--staff-border) calc(100% / 14 - 1px),
            var(--staff-border) calc(100% / 14)
          ), linear-gradient(rgba(255,255,255,0.012) 0, rgba(255,255,255,0.012) 100%);
        }

        .timeline-court-name {
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--staff-muted);
          width: 120px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-right: 14px;
          gap: 2px;
        }
        .timeline-court-status {
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.12em;
        }
        .timeline-court-status.blocked { color: var(--crimson); }
        .timeline-court-status.maintenance { color: #fbbf24; }
        .timeline-court-status.pro { color: rgba(255,255,255,0.28); }

        .timeline-track {
          flex: 1;
          position: relative;
          min-height: 46px;
          min-width: 700px;
          background-image: repeating-linear-gradient(
            90deg,
            transparent 0,
            transparent calc(100% / 14 - 1px),
            var(--staff-border) calc(100% / 14 - 1px),
            var(--staff-border) calc(100% / 14)
          );
        }

        /* Now indicator */
        .timeline-now {
          position: absolute;
          top: 0; bottom: 0;
          width: 1px;
          background: rgba(200,16,46,0.7);
          z-index: 3;
          pointer-events: none;
        }
        .timeline-now::before {
          content: '';
          position: absolute;
          top: 50%;
          left: -3px;
          transform: translateY(-50%);
          width: 7px; height: 7px;
          background: var(--crimson);
          border-radius: 50%;
        }

        .timeline-blocked-overlay {
          position: absolute;
          inset: 8px 6px;
          background: rgba(200,16,46,0.05);
          border: 1px dashed rgba(200,16,46,0.2);
          display: flex;
          align-items: center;
          padding-left: 12px;
        }
        .timeline-blocked-label {
          font-family: var(--font-ui);
          font-size: 10px;
          color: rgba(200,16,46,0.5);
          letter-spacing: 0.08em;
          font-weight: 600;
        }

        .timeline-block {
          position: absolute;
          top: 7px; bottom: 7px;
          background: rgba(30,30,30,0.95);
          border-left: 3px solid var(--crimson);
          padding: 0 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
          min-width: 36px;
          font-family: var(--font-ui);
          font-size: 10px;
          color: var(--staff-muted);
          white-space: nowrap;
          backdrop-filter: blur(4px);
          transition: background 0.15s;
        }
        .timeline-block:hover { background: rgba(40,40,40,0.98); color: var(--staff-text); }
        .timeline-block-name {
          font-size: 11px;
          font-weight: 700;
          color: var(--staff-text);
          flex-shrink: 0;
        }
        .timeline-block-coach { opacity: 0.7; flex-shrink: 0; }
        .timeline-block-time { opacity: 0.55; font-size: 9px; }

        .unassigned-block { border-left-color: #fbbf24 !important; }

        /* ══════════════════════════════════════════════════════
           BOOKING MODAL
        ══════════════════════════════════════════════════════ */
        .booking-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          backdrop-filter: blur(4px);
        }
        .booking-modal {
          background: var(--staff-surface);
          border: 1px solid var(--staff-border-hi);
          width: 100%;
          max-width: 500px;
          max-height: 88vh;
          overflow-y: auto;
          position: relative;
        }
        .booking-modal::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--crimson);
        }
        .booking-modal-header {
          padding: 22px 24px 18px;
          border-bottom: 1px solid var(--staff-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .booking-modal-title {
          font-family: var(--font-label);
          font-size: 20px;
          color: var(--staff-text);
          font-weight: 400;
        }
        .booking-modal-crumb {
          font-family: var(--font-ui);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--staff-dim);
          margin-bottom: 3px;
        }
        .booking-close {
          background: rgba(255,255,255,0.06);
          border: none;
          color: var(--staff-dim);
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }
        .booking-close:hover { background: rgba(255,255,255,0.12); color: var(--staff-text); }

        .booking-modal-body { padding: 22px 24px; }

        /* ── Type picker ──────────────────────────────────── */
        .booking-pick-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .booking-pick-btn {
          background: var(--staff-card);
          border: 1px solid var(--staff-border);
          padding: 16px 18px;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: border-color 0.15s, background 0.15s;
        }
        .booking-pick-btn:hover {
          border-color: var(--crimson);
          background: rgba(200,16,46,0.04);
        }
        .booking-pick-icon {
          width: 38px; height: 38px;
          background: rgba(200,16,46,0.1);
          color: var(--crimson);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 18px;
        }
        .booking-pick-title {
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--staff-text);
          margin-bottom: 2px;
        }
        .booking-pick-desc {
          font-family: var(--font-ui);
          font-size: 11px;
          color: var(--staff-dim);
        }

        /* ── Shared form styles ───────────────────────────── */
        .booking-back {
          background: none;
          border: none;
          color: var(--staff-dim);
          cursor: pointer;
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 0 0 18px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.15s;
        }
        .booking-back:hover { color: var(--staff-muted); }

        .booking-member-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(200,16,46,0.08);
          border: 1px solid rgba(200,16,46,0.2);
          padding: 8px 14px;
          margin-bottom: 18px;
        }
        .booking-member-chip-name {
          font-family: var(--font-label);
          font-size: 15px;
          color: var(--staff-text);
        }

        .lesson-pick-btn {
          display: block;
          width: 100%;
          text-align: left;
          background: var(--staff-card);
          border: 1px solid var(--staff-border);
          padding: 11px 14px;
          margin-bottom: 6px;
          cursor: pointer;
          font-family: var(--font-ui);
          font-size: 11px;
          color: var(--staff-muted);
          transition: border-color 0.15s, background 0.15s;
        }
        .lesson-pick-btn:hover { border-color: var(--staff-border-hi); background: var(--staff-surface); color: var(--staff-text); }
        .lesson-pick-btn.selected { border-color: var(--crimson); background: rgba(200,16,46,0.05); color: var(--staff-text); }
        .lesson-pick-name { font-weight: 700; color: var(--staff-text); margin-right: 6px; }

        .court-check-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          margin-top: 8px;
        }
        .court-check-label {
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 600;
          color: var(--staff-muted);
          padding: 8px 10px;
          border: 1px solid var(--staff-border);
          background: var(--staff-card);
          transition: border-color 0.12s, background 0.12s, color 0.12s;
          user-select: none;
        }
        .court-check-label:has(input:checked) {
          border-color: var(--crimson);
          background: rgba(200,16,46,0.06);
          color: var(--staff-text);
        }
        .court-check-label input { accent-color: var(--crimson); }

        .modal-hint {
          font-family: var(--font-ui);
          font-size: 10px;
          color: var(--staff-dim);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        @media (max-width: 640px) {
          .cal-cell { font-size: 12px; }
          .timeline-court-name { width: 80px; font-size: 9px; }
          .day-legend { display: none; }
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="sch-header">
        <div className="sch-header-left">
          <span className="sch-eyebrow">Schedule</span>
          <h1 className="sch-title">
            {view === 'calendar'
              ? `${MONTHS[calMonth]} ${calYear}`
              : fmtDate(selectedDate)}
          </h1>
        </div>
        <div className="sch-header-actions">
          {view === 'day' && (
            <button className="btn-staff-ghost" onClick={() => setView('calendar')}>← Calendar</button>
          )}
          <button className="btn-staff-primary" onClick={() => setBookingType('pick')}>
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
            <button className="cal-arrow" onClick={prevMonth}>‹</button>
            <span className="cal-month-label">{MONTHS[calMonth]} {calYear}</span>
            <button className="cal-arrow" onClick={nextMonth}>›</button>
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
                  className={[
                    'cal-cell',
                    isSelected ? 'selected' : isToday ? 'today' : '',
                    isWeekend && !isSelected ? 'weekend' : '',
                  ].filter(Boolean).join(' ')}
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
        <>
          <div className="day-toolbar">
            <div className="day-legend">
              {[
                { label: 'Confirmed',    color: '#4ade80' },
                { label: 'Pending',      color: '#fbbf24' },
                { label: 'Completed',    color: '#64748b' },
                { label: 'Unassigned',   color: '#fbbf24' },
              ].map(({ label, color }) => (
                <div key={label} className="legend-item">
                  <div className="legend-dot" style={{ background: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="timeline-wrap">
            {dayLoading ? (
              <div className="staff-empty">Loading schedule…</div>
            ) : (
              <>
                {/* Time header */}
                <div className="timeline-header">
                  {HOURS.map(h => (
                    <div key={h} className="timeline-hour">{fmtHour(h)}</div>
                  ))}
                </div>

                {/* Unassigned lessons */}
                {unassigned.length > 0 && (
                  <>
                    <div className="timeline-section-label">Unassigned</div>
                    <div className="timeline-row">
                      <div className="timeline-court-name" style={{ color: '#fbbf24' }}>
                        No Court
                      </div>
                      <div className="timeline-track">
                        {showNow && (
                          <div className="timeline-now" style={{ left: `${nowPct}%` }} />
                        )}
                        {unassigned.map(l => (
                          <div key={l.id} className="timeline-block unassigned-block" style={lessonStyle(l)}>
                            <span className="timeline-block-name">
                              {l.member ? l.member.last_name : '?'}
                            </span>
                            <span className="timeline-block-time">{fmtTimeFull(l.start_time)}</span>
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
                          <span>{court.name}</span>
                          {court.is_pro_court && (
                            <span className="timeline-court-status pro">Pro</span>
                          )}
                          {court.status === 'blocked' && (
                            <span className="timeline-court-status blocked">Blocked</span>
                          )}
                          {court.status === 'maintenance' && (
                            <span className="timeline-court-status maintenance">Maint.</span>
                          )}
                        </div>
                        <div className="timeline-track">
                          {showNow && (
                            <div className="timeline-now" style={{ left: `${nowPct}%` }} />
                          )}
                          {court.status !== 'available' && court.lessons.length === 0 && (
                            <div className="timeline-blocked-overlay">
                              <span className="timeline-blocked-label">
                                {court.blocked_reason ?? court.status}
                              </span>
                            </div>
                          )}
                          {court.lessons.map(l => (
                            <div key={l.id} className="timeline-block" style={lessonStyle(l)}>
                              <span className="timeline-block-name">
                                {l.member ? l.member.last_name : '?'}
                              </span>
                              {l.coach && (
                                <span className="timeline-block-coach">/ {l.coach.last_name}</span>
                              )}
                              <span className="timeline-block-time">{fmtTimeFull(l.start_time)}</span>
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
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          BOOKING MODAL
      ══════════════════════════════════════════════════════ */}
      {bookingType !== null && (
        <div
          className="booking-overlay"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="booking-modal">
            <div className="booking-modal-header">
              <div>
                {bookingType !== 'pick' && (
                  <div className="booking-modal-crumb">
                    {bookingType === 'member'  ? 'Book · Member'  :
                     bookingType === 'private' ? 'Book · Scheduled' :
                                                 'Book · Event'}
                  </div>
                )}
                <span className="booking-modal-title">
                  {bookingType === 'pick'    ? 'Book Court'            :
                   bookingType === 'member'  ? (mStep === 1 ? 'Find Member' : `${mSelected?.first_name} ${mSelected?.last_name}`) :
                   bookingType === 'private' ? 'Assign Court'          :
                                               'Block for Event'}
                </span>
              </div>
              <button className="booking-close" onClick={closeModal}>×</button>
            </div>

            <div className="booking-modal-body">

              {/* ── TYPE PICKER ─────────────────────────────── */}
              {bookingType === 'pick' && (
                <div className="booking-pick-grid">
                  <button className="booking-pick-btn" onClick={() => setBookingType('member')}>
                    <div className="booking-pick-icon">👤</div>
                    <div>
                      <div className="booking-pick-title">For a Member</div>
                      <div className="booking-pick-desc">Verify and create a new lesson booking</div>
                    </div>
                  </button>
                  <button className="booking-pick-btn" onClick={() => setBookingType('private')}>
                    <div className="booking-pick-icon">📋</div>
                    <div>
                      <div className="booking-pick-title">Assign Court</div>
                      <div className="booking-pick-desc">Assign a court to a scheduled lesson</div>
                    </div>
                  </button>
                  <button className="booking-pick-btn" onClick={() => setBookingType('event')}>
                    <div className="booking-pick-icon">🎾</div>
                    <div>
                      <div className="booking-pick-title">Block for Event</div>
                      <div className="booking-pick-desc">Reserve courts for a tournament or club event</div>
                    </div>
                  </button>
                </div>
              )}

              {/* ── MEMBER FLOW ─────────────────────────────── */}
              {bookingType === 'member' && (
                <>
                  <button className="booking-back" onClick={() => setBookingType('pick')}>← Back</button>
                  {mMsg && (
                    <div className={mMsg.type === 'success' ? 'staff-success' : 'staff-error'} style={{ marginBottom: 16 }}>
                      {mMsg.text}
                    </div>
                  )}

                  {mStep === 1 ? (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="staff-label-text">Last Name</label>
                          <input
                            className="staff-input"
                            value={mVerifyForm.last_name}
                            onChange={e => setMVerifyForm(p => ({ ...p, last_name: e.target.value }))}
                            placeholder="Smith"
                          />
                        </div>
                        <div className="form-group">
                          <label className="staff-label-text">Audit Number</label>
                          <input
                            className="staff-input"
                            value={mVerifyForm.audit_number}
                            onChange={e => setMVerifyForm(p => ({ ...p, audit_number: e.target.value }))}
                            placeholder="12345"
                          />
                        </div>
                      </div>
                      <button
                        className="btn-staff-primary"
                        disabled={mLoading || !mVerifyForm.last_name || !mVerifyForm.audit_number}
                        onClick={verifyMember}
                      >
                        {mLoading ? 'Looking up…' : 'Find Member'}
                      </button>
                      {mResults.length > 1 && (
                        <div style={{ marginTop: 20 }}>
                          <div className="staff-label-text" style={{ marginBottom: 10 }}>Select member</div>
                          {mResults.map(m => (
                            <button
                              key={m.id}
                              className="btn-staff-ghost"
                              style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 6, padding: '10px 14px' }}
                              onClick={() => { setMSelected(m); setMStep(2); }}
                            >
                              {m.first_name} {m.last_name} — #{m.audit_number}{m.is_child ? ' (child)' : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <button className="booking-back" onClick={() => { setMStep(1); setMSelected(null); }}>← Back</button>
                      <div className="booking-member-chip">
                        <span className="booking-member-chip-name">
                          {mSelected?.first_name} {mSelected?.last_name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--staff-dim)' }}>
                          #{mSelected?.audit_number}
                        </span>
                      </div>
                      <div className="form-group">
                        <label className="staff-label-text">Start Date &amp; Time</label>
                        <input
                          type="datetime-local"
                          className="staff-input"
                          value={mBookForm.start_time}
                          onChange={e => setMBookForm(p => ({ ...p, start_time: e.target.value }))}
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="staff-label-text">Duration</label>
                          <select
                            className="staff-input"
                            value={mBookForm.duration_minutes}
                            onChange={e => setMBookForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) }))}
                          >
                            <option value={30}>30 min</option>
                            <option value={60}>60 min</option>
                            <option value={90}>90 min</option>
                            <option value={120}>120 min</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="staff-label-text">Coach (optional)</label>
                          <select
                            className="staff-input"
                            value={mBookForm.coach_id}
                            onChange={e => setMBookForm(p => ({ ...p, coach_id: e.target.value }))}
                          >
                            <option value="">Any / Pickup</option>
                            {coaches.map(c => (
                              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="staff-label-text">Court (optional)</label>
                        <select
                          className="staff-input"
                          value={mBookForm.court_id}
                          onChange={e => setMBookForm(p => ({ ...p, court_id: e.target.value }))}
                        >
                          <option value="">Unassigned</option>
                          {allCourts.filter(c => c.status === 'available').map(c => (
                            <option key={c.id} value={c.id}>{c.name}{c.is_pro_court ? ' (Pro)' : ''}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        className="btn-staff-primary"
                        disabled={mLoading || !mBookForm.start_time}
                        onClick={bookForMember}
                      >
                        {mLoading ? 'Booking…' : 'Book Court'}
                      </button>
                    </>
                  )}
                </>
              )}

              {/* ── PRIVATE FLOW ────────────────────────────── */}
              {bookingType === 'private' && (
                <>
                  <button className="booking-back" onClick={() => setBookingType('pick')}>← Back</button>
                  {pMsg && (
                    <div className={pMsg.type === 'success' ? 'staff-success' : 'staff-error'} style={{ marginBottom: 16 }}>
                      {pMsg.text}
                    </div>
                  )}
                  <div className="form-group">
                    <label className="staff-label-text">Date</label>
                    <input
                      type="date"
                      className="staff-input"
                      value={pDate}
                      onChange={e => { setPDate(e.target.value); setPSelected(null); }}
                    />
                  </div>
                  {pLoading ? (
                    <div style={{ color: 'var(--staff-dim)', fontFamily: 'var(--font-ui)', fontSize: 11, padding: '10px 0' }}>
                      Loading lessons…
                    </div>
                  ) : pLessons.length === 0 ? (
                    <div style={{ color: 'var(--staff-dim)', fontFamily: 'var(--font-ui)', fontSize: 11, padding: '10px 0' }}>
                      No unassigned lessons for this date.
                    </div>
                  ) : (
                    <>
                      <div className="staff-label-text" style={{ marginBottom: 8 }}>Select lesson</div>
                      {pLessons.map(l => (
                        <button
                          key={l.id}
                          className={`lesson-pick-btn${pSelected?.id === l.id ? ' selected' : ''}`}
                          onClick={() => setPSelected(pSelected?.id === l.id ? null : l)}
                        >
                          <span className="lesson-pick-name">{fmtTimeFull(l.start_time)}</span>
                          {l.duration_minutes}min
                          {l.member ? ` · ${l.member.first_name} ${l.member.last_name}` : ''}
                          {l.coach ? ` / ${l.coach.first_name} ${l.coach.last_name}` : ''}
                        </button>
                      ))}
                      {pSelected && (
                        <>
                          <div className="form-group" style={{ marginTop: 14 }}>
                            <label className="staff-label-text">Assign to Court</label>
                            <select
                              className="staff-input"
                              value={pCourtId}
                              onChange={e => setPCourtId(e.target.value)}
                            >
                              <option value="">Select court</option>
                              {allCourts.filter(c => c.status === 'available').map(c => (
                                <option key={c.id} value={c.id}>{c.name}{c.is_pro_court ? ' (Pro)' : ''}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            className="btn-staff-primary"
                            disabled={pLoading || !pCourtId}
                            onClick={assignCourt}
                          >
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
                  <button className="booking-back" onClick={() => setBookingType('pick')}>← Back</button>
                  {eMsg && (
                    <div className={eMsg.type === 'success' ? 'staff-success' : 'staff-error'} style={{ marginBottom: 16 }}>
                      {eMsg.text}
                    </div>
                  )}
                  <div className="form-group">
                    <label className="staff-label-text">Event Name</label>
                    <input
                      className="staff-input"
                      placeholder="Member Tournament, Club Day…"
                      value={eName}
                      onChange={e => setEName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="staff-label-text">Date</label>
                    <input
                      type="date"
                      className="staff-input"
                      value={eDate}
                      onChange={e => setEDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="staff-label-text">Courts to Block</label>
                    <div className="court-check-grid">
                      {allCourts.map(c => (
                        <label key={c.id} className="court-check-label">
                          <input
                            type="checkbox"
                            checked={eCourts.includes(c.id)}
                            onChange={e => setECourts(prev =>
                              e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                            )}
                          />
                          {c.name}
                        </label>
                      ))}
                    </div>
                    {allCourts.length > 0 && (
                      <button
                        className="btn-staff-ghost"
                        style={{ marginTop: 10, padding: '5px 12px', fontSize: 10 }}
                        onClick={() => setECourts(eCourts.length === allCourts.length ? [] : allCourts.map(c => c.id))}
                      >
                        {eCourts.length === allCourts.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                  <p className="modal-hint">
                    Selected courts will be blocked with the event name. Unblock them via Court Status after the event.
                  </p>
                  <button
                    className="btn-staff-primary"
                    disabled={eLoading || !eName || !eCourts.length}
                    onClick={blockEvent}
                  >
                    {eLoading ? 'Blocking…' : `Block ${eCourts.length} Court${eCourts.length !== 1 ? 's' : ''}`}
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
