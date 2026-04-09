'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────
interface CoachOption { id: string; first_name: string; last_name: string; }
interface LessonBlock {
  id: string; start_time: string; duration_minutes: number; status: string;
  court_id: string | null;
  member: { first_name: string; last_name: string } | null;
  coach: { first_name: string; last_name: string; } | null;
  coach_id?: string;
}
interface AvailabilityEntry {
  id: string; coach_id: string; unavailable_from: string; unavailable_to: string;
  reason: string | null; status: string;
}

interface Props { coaches: CoachOption[]; }

// ─── Helpers ──────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am–8pm

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtDate(d: string) { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }
function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
function fmtHour(h: number) { return h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h-12} PM`; }
function fmtTimeFull(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getCalendarCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const offset = firstDow; // Sunday start — no adjustment needed
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// Check if a date string falls within an availability range
function isUnavailable(dateStr: string, entries: AvailabilityEntry[], coachId: string): { unavailable: boolean; reason: string | null } {
  const date = new Date(dateStr + 'T12:00:00');
  for (const entry of entries) {
    if (entry.coach_id !== coachId) continue;
    if (entry.status !== 'approved' && entry.status !== 'pending') continue;
    const from = new Date(entry.unavailable_from);
    const to = new Date(entry.unavailable_to);
    if (date >= from && date <= to) {
      return { unavailable: true, reason: entry.reason };
    }
  }
  return { unavailable: false, reason: null };
}

// Get lessons for a specific coach at a specific hour
function getLessonsForHour(lessons: LessonBlock[], coachId: string, hour: number): LessonBlock[] {
  return lessons.filter(l => {
    if (!l.coach_id && !l.coach) return false;
    // Match by coach_id if available
    if (l.coach_id && l.coach_id !== coachId) return false;
    const startDate = new Date(l.start_time);
    const lessonStartHour = startDate.getHours();
    const lessonEndMin = lessonStartHour * 60 + startDate.getMinutes() + l.duration_minutes;
    const lessonEndHour = Math.floor(lessonEndMin / 60);
    // Check if this lesson overlaps with the hour
    return lessonStartHour <= hour && lessonEndHour > hour;
  });
}

const STATUS_COLOR: Record<string, string> = {
  confirmed:      '#4ade80',
  pending_pickup: '#fbbf24',
  pending:        '#fbbf24',
  completed:      '#64748b',
  cancelled:      '#ef4444',
};

// ─── Main Component ───────────────────────────────────────────
export default function DirectorSchedule({ coaches: propCoaches }: Props) {
  // View
  const [view, setView]         = useState<'calendar' | 'day'>('calendar');
  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr());

  // Coach data
  const [coachesList, setCoachesList] = useState<CoachOption[]>(propCoaches);

  // Day view data
  const [dayLessons, setDayLessons] = useState<LessonBlock[]>([]);
  const [dayAvailability, setDayAvailability] = useState<AvailabilityEntry[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  // ─── Fetch coaches ────────────────────────────────────────────
  const fetchCoaches = useCallback(async () => {
    try {
      const res = await fetch('/api/coaches/public');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) setCoachesList(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  // Update when prop coaches change
  useEffect(() => {
    if (propCoaches.length > 0) setCoachesList(propCoaches);
  }, [propCoaches]);

  // ─── Fetch day data ───────────────────────────────────────────
  const fetchDayData = useCallback(async (date: string) => {
    setDayLoading(true);
    try {
      const [lessonsRes, availRes] = await Promise.all([
        fetch(`/api/lessons?date=${date}`),
        fetch('/api/coaches/availability'),
      ]);
      const lessonsData = await lessonsRes.json();
      const availData = await availRes.json();
      setDayLessons(Array.isArray(lessonsData) ? lessonsData : []);
      setDayAvailability(Array.isArray(availData) ? availData : []);
    } catch {
      setDayLessons([]);
      setDayAvailability([]);
    } finally {
      setDayLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'day') fetchDayData(selectedDate);
  }, [view, selectedDate, fetchDayData]);

  // ─── Calendar navigation ─────────────────────────────────────
  function openDay(day: number) { setSelectedDate(dateStr(calYear, calMonth, day)); setView('day'); }
  function prevMonth() { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }
  function nextMonth() { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }

  // ─── Computed ─────────────────────────────────────────────────
  const today = todayStr();
  const cells = getCalendarCells(calYear, calMonth);

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
           COACH AVAILABILITY PLANNER
        ══════════════════════════════════════════════════════ */
        .planner-wrap {
          overflow-x: auto;
          border: 1px solid var(--staff-border);
          background: var(--staff-card);
        }

        .planner-table {
          width: 100%;
          min-width: 600px;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .planner-table th {
          position: sticky;
          top: 0;
          background: var(--staff-surface);
          z-index: 3;
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--staff-dim);
          padding: 14px 10px;
          text-align: center;
          border-bottom: 1px solid var(--staff-border);
          border-right: 1px solid var(--staff-border);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .planner-table th:first-child {
          position: sticky;
          left: 0;
          z-index: 4;
          width: 80px;
          min-width: 80px;
          text-align: right;
          padding-right: 14px;
          background: var(--staff-surface);
        }

        .planner-table th:last-child {
          border-right: none;
        }

        .planner-table td {
          padding: 0;
          border-bottom: 1px solid var(--staff-border);
          border-right: 1px solid var(--staff-border);
          vertical-align: top;
          height: 52px;
          position: relative;
        }

        .planner-table td:first-child {
          position: sticky;
          left: 0;
          z-index: 2;
          background: var(--staff-surface);
          width: 80px;
          min-width: 80px;
        }

        .planner-table td:last-child {
          border-right: none;
        }

        .planner-table tr:last-child td {
          border-bottom: none;
        }

        .planner-hour-label {
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: var(--staff-dim);
          text-align: right;
          padding: 8px 14px 8px 8px;
          white-space: nowrap;
        }

        /* ── Cell states ──────────────────────────────────── */
        .planner-cell {
          width: 100%;
          height: 100%;
          min-height: 52px;
          position: relative;
          transition: background 0.12s;
        }

        .planner-cell:hover {
          background: rgba(255,255,255,0.03);
        }

        .planner-cell.unavailable {
          background: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 4px,
            rgba(255,255,255,0.025) 4px,
            rgba(255,255,255,0.025) 8px
          );
        }

        .planner-unavail-label {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-family: var(--font-ui);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.15);
          user-select: none;
        }

        .planner-lesson {
          position: absolute;
          inset: 4px;
          background: rgba(30,30,30,0.95);
          border-left: 3px solid var(--crimson);
          padding: 5px 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1px;
          overflow: hidden;
          font-family: var(--font-ui);
          backdrop-filter: blur(4px);
          transition: background 0.15s;
        }

        .planner-lesson:hover {
          background: rgba(40,40,40,0.98);
        }

        .planner-lesson-member {
          font-size: 11px;
          font-weight: 700;
          color: var(--staff-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .planner-lesson-time {
          font-size: 9px;
          color: var(--staff-dim);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .planner-lesson-status {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* ── Legend ──────────────────────────────────────── */
        .planner-legend {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .planner-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--staff-dim);
        }
        .planner-legend-dot {
          width: 10px; height: 10px;
          border-radius: 1px;
          flex-shrink: 0;
        }
        .planner-legend-stripe {
          width: 10px; height: 10px;
          flex-shrink: 0;
          background: repeating-linear-gradient(
            -45deg,
            rgba(255,255,255,0.08),
            rgba(255,255,255,0.08) 2px,
            rgba(255,255,255,0.02) 2px,
            rgba(255,255,255,0.02) 4px
          );
          border: 1px solid rgba(255,255,255,0.1);
        }

        /* ── Now line ───────────────────────────────────── */
        .planner-now-row td {
          border-bottom: 2px solid rgba(200,16,46,0.5) !important;
        }

        @media (max-width: 640px) {
          .cal-cell { font-size: 12px; }
          .planner-table th { font-size: 8px; padding: 10px 6px; }
          .planner-hour-label { font-size: 9px; padding: 6px 8px 6px 4px; }
          .planner-table td { height: 44px; }
          .planner-lesson { padding: 3px 6px; }
          .planner-lesson-member { font-size: 9px; }
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
              const isWeekend  = (i % 7) === 0 || (i % 7) === 6; // Sun=0, Sat=6
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
          DAY VIEW — COACH AVAILABILITY PLANNER
      ══════════════════════════════════════════════════════ */}
      {view === 'day' && (
        <>
          {/* Legend */}
          <div className="planner-legend">
            <div className="planner-legend-item">
              <div className="planner-legend-dot" style={{ background: '#4ade80' }} />
              Confirmed
            </div>
            <div className="planner-legend-item">
              <div className="planner-legend-dot" style={{ background: '#fbbf24' }} />
              Pending
            </div>
            <div className="planner-legend-item">
              <div className="planner-legend-dot" style={{ background: '#64748b' }} />
              Completed
            </div>
            <div className="planner-legend-item">
              <div className="planner-legend-stripe" />
              Unavailable
            </div>
            <div className="planner-legend-item">
              <div className="planner-legend-dot" style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)' }} />
              Available
            </div>
          </div>

          <div className="planner-wrap">
            {dayLoading ? (
              <div className="staff-empty">Loading coach availability…</div>
            ) : coachesList.length === 0 ? (
              <div className="staff-empty">No coaches found.</div>
            ) : (
              <table className="planner-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    {coachesList.map(c => (
                      <th key={c.id}>{c.first_name} {c.last_name.charAt(0)}.</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map(hour => {
                    const now = new Date();
                    const isNowHour = selectedDate === today && now.getHours() === hour;
                    return (
                      <tr key={hour} className={isNowHour ? 'planner-now-row' : ''}>
                        <td>
                          <div className="planner-hour-label">{fmtHour(hour)}</div>
                        </td>
                        {coachesList.map(coach => {
                          const unavail = isUnavailable(selectedDate, dayAvailability, coach.id);
                          const lessons = getLessonsForHour(dayLessons, coach.id, hour);

                          if (unavail.unavailable && lessons.length === 0) {
                            return (
                              <td key={coach.id}>
                                <div className="planner-cell unavailable">
                                  <div className="planner-unavail-label">
                                    {unavail.reason ? unavail.reason.substring(0, 12) : 'OFF'}
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          if (lessons.length > 0) {
                            const lesson = lessons[0]; // show first lesson in this slot
                            const borderColor = STATUS_COLOR[lesson.status] ?? 'var(--crimson)';
                            const statusColor = STATUS_COLOR[lesson.status] ?? 'var(--staff-dim)';
                            return (
                              <td key={coach.id}>
                                <div className="planner-cell">
                                  <div className="planner-lesson" style={{ borderLeftColor: borderColor }}>
                                    <span className="planner-lesson-member">
                                      {lesson.member
                                        ? `${lesson.member.first_name} ${lesson.member.last_name}`
                                        : '—'}
                                    </span>
                                    <span className="planner-lesson-time">
                                      {fmtTimeFull(lesson.start_time)} · {lesson.duration_minutes}min
                                    </span>
                                    <span className="planner-lesson-status" style={{ color: statusColor }}>
                                      {lesson.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          // Available — empty cell
                          return (
                            <td key={coach.id}>
                              <div className="planner-cell" />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
}
