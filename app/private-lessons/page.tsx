'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/* ─── Types ──────────────────────────────────────────────────── */
interface CoachProfile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  lessons: { start_time: string; duration_minutes: number; status: string }[];
  unavailability: { unavailable_from: string; unavailable_to: string }[];
}

interface MemberLesson {
  id: string;
  member_id: string;
  coach_id: string | null;
  start_time: string;
  duration_minutes: number;
  status: string;
  member: { first_name: string; last_name: string; audit_number: string } | null;
  coach: { first_name: string; last_name: string } | null;
}

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
}

/* ─── Constants ──────────────────────────────────────────────── */
// Hourly slots 8 AM – 7 PM
const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 19; h++) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);

function slotTo12(s: string): string {
  const [h, m] = s.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

const ET_TZ = 'America/New_York';

function dateISO(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: ET_TZ });
}

/** Returns the UTC offset in hours for a given calendar date in ET (4 for EDT, 5 for EST). */
function etOffset(dateStr: string): number {
  const probe = new Date(`${dateStr}T12:00:00Z`);
  const etHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: ET_TZ, hour: 'numeric', hour12: false }).format(probe));
  return 12 - etHour;
}

/** Converts a YYYY-MM-DD date + HH:MM slot (ET) into a UTC ISO string for storage. */
function slotToISO(dateStr: string, slot: string): string {
  const off = etOffset(dateStr);
  const offsetStr = off === 4 ? '-04:00' : '-05:00';
  return new Date(`${dateStr}T${slot}:00${offsetStr}`).toISOString();
}

/** Returns the YYYY-MM-DD in ET for any UTC ISO timestamp. */
function etDateOf(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-CA', { timeZone: ET_TZ });
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getMondayOfWeek(offset: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(today, diff + offset * 7);
  return monday;
}

function getWeekDays(offset: number): Date[] {
  const monday = getMondayOfWeek(offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function isSlotTaken(
  coach: CoachProfile,
  dateStr: string,      // YYYY-MM-DD
  slotTime: string      // HH:MM
): boolean {
  const slotStart = new Date(slotToISO(dateStr, slotTime)).getTime();
  const slotEnd = slotStart + 60 * 60_000;

  for (const lesson of coach.lessons) {
    if (etDateOf(lesson.start_time) !== dateStr) continue;
    const ls = new Date(lesson.start_time).getTime();
    const le = ls + lesson.duration_minutes * 60_000;
    if (slotStart < le && slotEnd > ls) return true;
  }

  for (const w of coach.unavailability) {
    const ws = new Date(w.unavailable_from).getTime();
    const we = new Date(w.unavailable_to).getTime();
    if (slotStart < we && slotEnd > ws) return true;
  }

  return false;
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function PrivateLessonsPage() {
  /* Verification */
  const [auditInput, setAuditInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifiedLabel, setVerifiedLabel] = useState('');

  /* Member data */
  const [upcomingLessons, setUpcomingLessons] = useState<MemberLesson[]>([]);
  const [pastLessons, setPastLessons] = useState<MemberLesson[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [lessonsTab, setLessonsTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  /* Saved credentials for booking POST */
  const credsRef = useRef<{ auditNumber: string; lastName: string }>({ auditNumber: '', lastName: '' });

  /* Flow */
  const [currentFlow, setCurrentFlow] = useState<'coach' | 'date' | null>(null);

  /* Availability data */
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [availLoading, setAvailLoading] = useState(false);

  /* Date flow */
  const [dateOpen, setDateOpen] = useState(false);
  const [selectedDateISO, setSelectedDateISO] = useState<string | null>(null);
  const [selectedDateLabel, setSelectedDateLabel] = useState('Select');
  const [dateSelectedCoachId, setDateSelectedCoachId] = useState<string | null>(null);
  const [dateSelectedSlot, setDateSelectedSlot] = useState<string | null>(null);
  const [dateSummary, setDateSummary] = useState({ coach: '—', date: '—', time: '—' });

  /* Coach flow */
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [coachSelectedDateISO, setCoachSelectedDateISO] = useState<string | null>(null);
  const [coachSelectedSlot, setCoachSelectedSlot] = useState<string | null>(null);
  const [coachSummary, setCoachSummary] = useState({ coach: '—', date: '—', time: '—' });

  /* Inline popup */
  const [popupCell, setPopupCell] = useState<{ coachId: string; dateISO: string; slot: string } | null>(null);

  /* Booking confirmation */
  const [bookingStep, setBookingStep] = useState<0 | 1 | 2>(0); // 0=none, 1=confirm panel, 2=success
  const [pendingBooking, setPendingBooking] = useState<{
    coachName: string; dateLong: string; timeFmt: string; startTime: string; coachId: string | null;
  } | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  /* ─── Fade-up observer ──────────────────────────────────────── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    const observe = () => document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    observe();
    const t = setTimeout(observe, 600);
    return () => { observer.disconnect(); clearTimeout(t); };
  }, [verified, currentFlow, bookingStep]);

  /* ─── Verification ──────────────────────────────────────────── */
  async function doVerify() {
    const audit = auditInput.trim();
    const last = lastNameInput.trim();
    if (!audit || !last) { setVerifyError('Please enter both fields.'); return; }

    setVerifyLoading(true);
    setVerifyError('');
    try {
      const res = await fetch(`/api/lessons/member?audit_number=${encodeURIComponent(audit)}&last_name=${encodeURIComponent(last)}`);
      const data = await res.json();
      if (!res.ok) {
        setVerifyError('Audit number or last name not recognised. Please try again.');
        return;
      }
      const members: FamilyMember[] = (data.family ?? []).map((f: { id: string; first_name: string; last_name: string }) => ({
        id: f.id,
        first_name: f.first_name,
        last_name: f.last_name,
      }));

      credsRef.current = { auditNumber: audit, lastName: last };
      setFamilyMembers(members);
      setSelectedMemberId(members[0]?.id ?? '');
      setUpcomingLessons(data.upcoming ?? []);
      setPastLessons(data.past ?? []);
      setVerifiedLabel(`${last.charAt(0).toUpperCase()}${last.slice(1).toLowerCase()} · #${audit}`);
      setVerified(true);
    } catch {
      setVerifyError('Something went wrong. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  }

  function doSignOut() {
    setVerified(false);
    setAuditInput('');
    setLastNameInput('');
    setVerifyError('');
    setVerifiedLabel('');
    setFamilyMembers([]);
    setSelectedMemberId('');
    setUpcomingLessons([]);
    setPastLessons([]);
    setCurrentFlow(null);
    setBookingStep(0);
    setPendingBooking(null);
    credsRef.current = { auditNumber: '', lastName: '' };
  }

  /* ─── Load Availability ─────────────────────────────────────── */
  const loadAvailability = useCallback(async () => {
    setAvailLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = dateISO(today);
      const end = dateISO(addDays(today, 14));
      const res = await fetch(`/api/lessons/availability?start_date=${start}&end_date=${end}`);
      if (res.ok) {
        const data = await res.json();
        setCoaches(data);
      }
    } catch { /* silent */ }
    setAvailLoading(false);
  }, []);

  /* ─── Start Flow ────────────────────────────────────────────── */
  function startFlow(type: 'coach' | 'date') {
    setCurrentFlow(type);
    setBookingStep(0);
    setPendingBooking(null);
    setBookingError('');
    setPopupCell(null);
    setSelectedDateISO(null);
    setSelectedDateLabel('Select');
    setDateSelectedCoachId(null);
    setDateSelectedSlot(null);
    setDateSummary({ coach: '—', date: '—', time: '—' });
    setSelectedCoach(null);
    setWeekOffset(0);
    setCoachSelectedDateISO(null);
    setCoachSelectedSlot(null);
    setCoachSummary({ coach: '—', date: '—', time: '—' });
    loadAvailability();
    setTimeout(() => {
      document.getElementById('booking-flow-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function resetToPathSelector() {
    setCurrentFlow(null);
    setBookingStep(0);
    setPendingBooking(null);
    setBookingError('');
    setPopupCell(null);
  }

  /* ─── Slot Click ────────────────────────────────────────────── */
  function handleSlotClick(coachId: string, dateStr: string, slot: string) {
    if (popupCell?.coachId === coachId && popupCell?.dateISO === dateStr && popupCell?.slot === slot) {
      setPopupCell(null);
      return;
    }
    setPopupCell({ coachId, dateISO: dateStr, slot });
    const coach = coaches.find(c => c.id === coachId);
    const coachName = coach ? `${coach.first_name} ${coach.last_name}` : '—';
    const d = new Date(`${dateStr}T12:00:00Z`);
    const dateLong = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: ET_TZ });
    const timeFmt = slotTo12(slot);

    if (currentFlow === 'date') {
      setDateSelectedCoachId(coachId);
      setDateSelectedSlot(slot);
      setDateSummary({ coach: coachName, date: dateLong, time: timeFmt });
    } else {
      setCoachSelectedDateISO(dateStr);
      setCoachSelectedSlot(slot);
      setCoachSummary({ coach: coachName, date: dateLong, time: timeFmt });
    }
  }

  /* ─── Confirm Slot → Show Confirmation Panel ────────────────── */
  function handleInlineConfirm() {
    if (!popupCell) return;
    const { coachId, dateISO: dISO, slot } = popupCell;
    const coach = coaches.find(c => c.id === coachId);
    const coachName = coach ? `${coach.first_name} ${coach.last_name}` : '—';
    const d = new Date(`${dISO}T12:00:00Z`);
    const dateLong = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: ET_TZ });
    const timeFmt = slotTo12(slot);
    const startTime = slotToISO(dISO, slot);

    setPendingBooking({ coachName, dateLong, timeFmt, startTime, coachId });
    setBookingStep(1);
    setPopupCell(null);
    setTimeout(() => {
      document.getElementById('pl-confirmation-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  /* ─── Final Booking POST ────────────────────────────────────── */
  async function doBook() {
    if (!pendingBooking || !selectedMemberId) {
      setBookingError('Please select a family member to book for.');
      return;
    }
    setBookingLoading(true);
    setBookingError('');
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_name: credsRef.current.lastName,
          audit_number: credsRef.current.auditNumber,
          member_id: selectedMemberId,
          start_time: pendingBooking.startTime,
          duration_minutes: 60,
          ...(pendingBooking.coachId ? { coach_id: pendingBooking.coachId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error ?? 'Booking failed. Please try again.');
        return;
      }
      setBookingStep(2);
    } catch {
      setBookingError('Something went wrong. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  }

  /* ─── Cancel Lesson ─────────────────────────────────────────── */
  async function handleCancelLesson(lessonId: string) {
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audit_number: credsRef.current.auditNumber,
          last_name: credsRef.current.lastName,
        }),
      });
      if (res.ok) {
        setUpcomingLessons(prev => prev.filter(l => l.id !== lessonId));
        setCancellingId(null);
      }
    } catch { /* silent */ }
    setCancelLoading(false);
  }

  /* ─── Date slot list ─────────────────────────────────────────── */
  function renderDateSlotList() {
    if (!selectedDateISO) {
      return <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 14, color: 'var(--mid-gray)', paddingTop: 8 }}>Select a date above to see available times.</p>;
    }
    const now = new Date();
    const todayISO = dateISO(now);
    return (
      <div className="date-slot-list">
        {TIME_SLOTS.map(slot => {
          const [sh] = slot.split(':').map(Number);
          const nowET = new Date(now.toLocaleString('en-US', { timeZone: ET_TZ }));
          const isPast = selectedDateISO === todayISO && sh <= nowET.getHours();
          const availableCount = coaches.filter(c => !isSlotTaken(c, selectedDateISO!, slot) && !isCoachFullyUnavailable(c, selectedDateISO!)).length;
          const isAvail = !isPast && availableCount > 0;
          const isSelected = dateSelectedSlot === slot;
          return (
            <button
              key={slot}
              className={`date-slot-item${isSelected ? ' ds-selected' : ''}`}
              disabled={!isAvail}
              onClick={isAvail ? () => { setDateSelectedSlot(slot); setPendingBooking(null); setBookingStep(0); } : undefined}
            >
              <span className="date-slot-time">{slotTo12(slot)}</span>
              <span className="date-slot-avail">
                {isPast ? 'Past' : !isAvail ? 'No availability' : `${availableCount} coach${availableCount !== 1 ? 'es' : ''}`}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  /* ─── Coach picker ────────────────────────────────────────────── */
  function renderCoachPicker() {
    if (!selectedDateISO || !dateSelectedSlot) return null;
    const availableCoaches = coaches.filter(c =>
      !isSlotTaken(c, selectedDateISO!, dateSelectedSlot) &&
      !isCoachFullyUnavailable(c, selectedDateISO!)
    );
    function selectCoach(coachId: string | null) {
      const coach = coaches.find(c => c.id === coachId);
      const coachName = coachId ? (coach ? `${coach.first_name} ${coach.last_name}` : '—') : 'Any Available Coach';
      const d = new Date(`${selectedDateISO}T12:00:00Z`);
      const dateLong = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: ET_TZ });
      const timeFmt = slotTo12(dateSelectedSlot!);
      const startTime = slotToISO(selectedDateISO!, dateSelectedSlot!);
      setPendingBooking({ coachName, dateLong, timeFmt, startTime, coachId });
      setBookingStep(1);
      setTimeout(() => document.getElementById('pl-confirmation-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
    return (
      <div className="coach-picker">
        <h3 className="coach-picker-heading">Choose a Coach</h3>
        <hr className="divider-crimson" style={{ width: 40, margin: '10px 0 20px' }} />
        <button className="coach-pick-card" onClick={() => selectCoach(null)}>
          <span className="coach-pick-name">Any Available Coach</span>
          <span className="coach-pick-sub">We&apos;ll match you with the first available coach</span>
        </button>
        {availableCoaches.map(c => (
          <button key={c.id} className="coach-pick-card" onClick={() => selectCoach(c.id)}>
            <span className="coach-pick-name">{c.first_name} {c.last_name}</span>
            <span className="coach-pick-sub">{c.role}</span>
          </button>
        ))}
      </div>
    );
  }

  function isCoachFullyUnavailable(coach: CoachProfile, dateStr: string): boolean {
    const dayStart = new Date(slotToISO(dateStr, '00:00')).getTime();
    const dayEnd = dayStart + 24 * 60 * 60_000;
    for (const w of coach.unavailability) {
      const ws = new Date(w.unavailable_from).getTime();
      const we = new Date(w.unavailable_to).getTime();
      if (ws <= dayStart && we >= dayEnd) return true;
    }
    return false;
  }

  /* ─── Coach week grid ────────────────────────────────────────── */
  function renderCoachWeekGrid() {
    if (!selectedCoach) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = getWeekDays(weekOffset);

    return (
      <div className="pl-grid-wrapper">
        <table id="pl-coach-grid-table">
          <thead>
            <tr>
              <th className="pl-time-col-header"></th>
              {days.map(day => {
                const isPast = day < today;
                const dayAbbr = day.toLocaleDateString('en-US', { weekday: 'short', timeZone: ET_TZ }).toUpperCase();
                const dateStr = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: ET_TZ });
                return (
                  <th key={dateISO(day)} style={{ opacity: isPast ? 0.4 : 1 }}>
                    <span style={{ display: 'block' }}>{dayAbbr}</span>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 400, color: 'var(--mid-gray)', marginTop: 2 }}>{dateStr}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(slot => (
              <tr key={slot}>
                <td className="pl-time-label">{slotTo12(slot)}</td>
                {days.map(day => {
                  const dISO = dateISO(day);
                  const isPast = day < today;
                  const taken = isPast || isSlotTaken(selectedCoach, dISO, slot);
                  const isSelected = coachSelectedDateISO === dISO && coachSelectedSlot === slot;
                  const isPopup = popupCell?.coachId === selectedCoach.id && popupCell?.dateISO === dISO && popupCell?.slot === slot;
                  let cls = 'pl-slot-cell';
                  if (isSelected || isPopup) cls += ' pl-selected';
                  else if (taken) cls += ' pl-taken';
                  else cls += ' pl-avail';

                  return (
                    <td
                      key={dISO}
                      className={cls}
                      onClick={taken ? undefined : () => handleSlotClick(selectedCoach.id, dISO, slot)}
                    >
                      {isPopup && !taken && (
                        <div className="pl-cell-popup" onClick={e => e.stopPropagation()}>
                          <span className="pl-cell-popup-label">{slotTo12(slot)} · {new Date(`${dISO}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: ET_TZ })}</span>
                          <div className="pl-cell-popup-actions">
                            <button className="btn-crimson pl-inline-confirm-btn" style={{ padding: '6px 14px', fontSize: 10 }} onClick={handleInlineConfirm}>Confirm</button>
                            <button className="pl-inline-cancel-btn" onClick={() => { setPopupCell(null); setCoachSelectedDateISO(null); setCoachSelectedSlot(null); setCoachSummary({ coach: coachSummary.coach, date: '—', time: '—' }); }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* ─── Date Filter Bar ────────────────────────────────────────── */
  function renderDateFilterBar() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pills = Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, i);
      return {
        iso: dateISO(d),
        dayLabel: i === 0 ? 'TODAY' : d.toLocaleDateString('en-US', { weekday: 'short', timeZone: ET_TZ }).toUpperCase(),
        num: parseInt(d.toLocaleDateString('en-US', { day: 'numeric', timeZone: ET_TZ })),
        monthStr: d.toLocaleDateString('en-US', { month: 'short', timeZone: ET_TZ }),
        weekday: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: ET_TZ }),
      };
    });

    return (
      <div id="pl-filter-bar">
        <div className="filter-row">
          <div className="filter-group">
            <span className="filter-label">DATE</span>
            <div id="pl-date-selector-wrap" style={{ position: 'relative' }}>
              <button
                className={`filter-pill${selectedDateISO ? ' selected' : ''}`}
                id="pl-date-selected-pill"
                onClick={e => { e.stopPropagation(); setDateOpen(o => !o); }}
              >
                <span>{selectedDateLabel}</span>
                <svg className={`pill-chevron${dateOpen ? ' open' : ''}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {dateOpen && (
                <div id="pl-date-expanded-tray" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 6, border: '1px solid var(--light-gray)', background: 'var(--off-white)', position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100, maxHeight: 205, overflowY: 'auto' }}>
                  {pills.map(p => (
                    <button
                      key={p.iso}
                      className={`date-tray-pill${selectedDateISO === p.iso ? ' selected' : ''}`}
                      onClick={() => {
                        setSelectedDateISO(p.iso);
                        setSelectedDateLabel(`${p.weekday} · ${p.monthStr} ${p.num}`);
                        setDateOpen(false);
                        setPopupCell(null);
                        setDateSelectedCoachId(null);
                        setDateSelectedSlot(null);
                        setDateSummary({ coach: '—', date: new Date(`${p.iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: ET_TZ }), time: '—' });
                      }}
                    >
                      <span className="date-tray-pill-day">{p.dayLabel}</span>
                      <span className="date-tray-pill-num">{p.num}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button className="clear-filters-btn" onClick={() => {
            setSelectedDateISO(null);
            setSelectedDateLabel('Select');
            setDateOpen(false);
            setPopupCell(null);
            setDateSelectedCoachId(null);
            setDateSelectedSlot(null);
            setDateSummary({ coach: '—', date: '—', time: '—' });
          }}>Clear</button>
        </div>
      </div>
    );
  }

  /* ─── Week Nav label ─────────────────────────────────────────── */
  function weekLabel(offset: number): string {
    const days = getWeekDays(offset);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: ET_TZ });
    const prefix = offset === 0 ? 'This Week' : 'Next Week';
    return `${prefix} · ${fmt(days[0])} – ${fmt(days[6])}`;
  }

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <>
      <Navbar />
      <style suppressHydrationWarning>{`
        :root {
          --crimson:    #C8102E;
          --crimson-dk: #A00D23;
          --white:      #FFFFFF;
          --off-white:  #FAF8F5;
          --dark:       #1A1A1A;
          --mid-gray:   #6B6B6B;
          --light-gray: #E8E4DF;
          --font-display: 'Playfair Display', Georgia, serif;
          --font-label:   'Cormorant Garamond', Georgia, serif;
          --font-ui:      'Montserrat', Arial, sans-serif;
          --font-body:    'Lora', Georgia, serif;
        }
        .fade-up { opacity: 0; transform: translateY(28px); transition: opacity 0.65s ease, transform 0.65s ease; }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .btn-crimson {
          background-color: var(--crimson); color: var(--white); font-family: var(--font-ui);
          font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
          border-radius: 0; padding: 14px 32px; border: none; cursor: pointer; display: inline-block;
          transition: background-color 0.25s ease;
        }
        .btn-crimson:hover { background-color: var(--crimson-dk); }
        .btn-crimson:disabled { background-color: var(--light-gray); color: var(--mid-gray); cursor: not-allowed; }
        .btn-light {
          background: transparent; border: 1px solid var(--light-gray); color: var(--dark);
          font-family: var(--font-ui); font-size: 12px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; padding: 14px 32px; display: inline-block; cursor: pointer;
          transition: background 0.25s ease;
        }
        .btn-light:hover { background: var(--off-white); }
        .section-label { font-family: var(--font-label); font-size: 13px; font-weight: 600; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.18em; display: block; }
        .divider-crimson { border: none; border-top: 1px solid var(--crimson); width: 48px; margin: 12px 0 22px 0; }
        .section-inner { max-width: 1160px; margin: 0 auto; padding: 0 40px; }

        /* Slim Hero */
        #pl-slim-hero {
          height: 320px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding-top: 76px; position: relative;
        }
        #pl-slim-hero h1 { font-family: var(--font-display); font-size: 56px; font-weight: 400; color: white; text-shadow: 0 2px 12px rgba(0,0,0,0.35); }
        #pl-slim-hero .slim-hero-divider { border: none; border-top: 1px solid rgba(255,255,255,0.7); width: 48px; margin: 10px auto; }
        #pl-slim-hero .hero-location { font-family: var(--font-ui); font-size: 13px; font-weight: 500; color: white; text-transform: uppercase; letter-spacing: 0.18em; margin-top: 4px; text-shadow: 0 1px 6px rgba(0,0,0,0.35); }

        /* Verified strip */
        #verify-strip {
          position: absolute; bottom: 20px; left: 24px; background: rgba(255,255,255,0.92);
          border: 1px solid rgba(255,255,255,0.6); border-radius: 6px; padding: 10px 14px;
          backdrop-filter: blur(4px); display: flex; flex-direction: column; gap: 4px; min-width: 180px;
        }
        .verify-strip-left { display: flex; align-items: center; gap: 6px; }
        .verify-strip-check { color: var(--crimson); font-family: var(--font-ui); font-size: 12px; }
        #strip-name-display { font-family: var(--font-ui); font-size: 12px; font-weight: 600; color: var(--dark); }
        #strip-sign-out-btn { font-family: var(--font-ui); font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--mid-gray); background: none; border: none; cursor: pointer; padding: 0; text-align: left; }
        #strip-sign-out-btn:hover { color: var(--dark); }

        /* Verification gate */
        #verification-gate { background: var(--off-white); min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 80px 40px; border-bottom: 1px solid var(--light-gray); }
        #verify-card { background: var(--white); border: 1px solid var(--light-gray); padding: 56px 64px; max-width: 480px; width: 100%; text-align: center; }
        .gate-member-access-label { font-family: var(--font-label); font-size: 12px; font-weight: 600; color: var(--crimson); text-transform: uppercase; letter-spacing: 0.18em; display: block; margin-bottom: 12px; }
        .gate-heading { font-family: var(--font-display); font-size: 28px; font-weight: 400; color: var(--dark); line-height: 1.3; margin-bottom: 8px; }
        .gate-subtext { font-family: var(--font-body); font-size: 14px; color: var(--mid-gray); line-height: 1.7; margin-bottom: 32px; }
        .gate-field-group { margin-bottom: 20px; text-align: left; }
        .gate-field-label { font-family: var(--font-ui); font-size: 11px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.16em; display: block; margin-bottom: 8px; }
        .gate-field-input { border: none; border-bottom: 1px solid var(--light-gray); padding: 10px 0; width: 100%; font-family: var(--font-body); font-size: 15px; background: transparent; outline: none; transition: border-bottom-color 0.2s ease; }
        .gate-field-input:focus { border-bottom-color: var(--crimson); }
        #gate-error { font-family: var(--font-body); font-size: 13px; color: var(--crimson); margin-bottom: 16px; }

        /* Booking entry section */
        #booking-entry { background: var(--white); padding: 64px 0; }
        .booking-heading { font-family: var(--font-display); font-size: 32px; font-weight: 400; color: var(--dark); }
        .path-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 8px; }
        .path-card { background: var(--white); border: 1px solid var(--light-gray); padding: 36px 32px; cursor: pointer; transition: border-color 0.2s ease; }
        .path-card:hover { border-color: var(--crimson); }
        .path-card-title { font-family: var(--font-display); font-size: 22px; color: var(--dark); margin-bottom: 8px; margin-top: 16px; }
        .path-card-sub { font-family: var(--font-body); font-size: 14px; color: var(--mid-gray); line-height: 1.6; }
        .back-link { font-family: var(--font-ui); font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--crimson); cursor: pointer; background: none; border: none; padding: 0; margin-bottom: 24px; display: inline-block; }
        .back-link:hover { text-decoration: underline; }

        /* Member lessons */
        #member-lessons { padding: 0 0 80px 0; background: var(--white); }
        .pl-lessons-tab { font-family: var(--font-ui); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: var(--mid-gray); background: none; border: none; border-bottom: 2px solid transparent; padding: 12px 24px 12px 0; cursor: pointer; margin-right: 24px; transition: color 0.2s, border-color 0.2s; }
        .pl-lessons-tab:hover { color: var(--dark); }
        .pl-tab-active { color: var(--crimson); border-bottom-color: var(--crimson) !important; }
        .pl-lesson-row { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--light-gray); }
        .pl-lesson-row:first-child { border-top: 1px solid var(--light-gray); }
        .pl-lesson-info { display: grid; grid-template-columns: 140px 1fr 130px 100px; align-items: center; gap: 0 24px; flex: 1; min-width: 0; }
        .pl-lesson-row-date { font-family: var(--font-body); font-size: 14px; color: var(--dark); }
        .pl-lesson-row-coach { font-family: var(--font-body); font-size: 14px; color: var(--dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pl-lesson-row-time { font-family: var(--font-ui); font-size: 12px; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.08em; }
        .pl-lesson-row-status { font-family: var(--font-ui); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
        .pl-cancel-btn { font-family: var(--font-ui); font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mid-gray); background: none; border: none; cursor: pointer; padding: 0; transition: color 0.2s; white-space: nowrap; flex-shrink: 0; }
        .pl-cancel-btn:hover { color: var(--crimson); }
        .pl-cancel-confirm { display: flex; align-items: center; gap: 8px; white-space: nowrap; flex-shrink: 0; }
        .pl-cancel-yes { font-family: var(--font-ui); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--crimson); background: none; border: none; cursor: pointer; padding: 0; }
        .pl-cancel-no { font-family: var(--font-ui); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mid-gray); background: none; border: none; cursor: pointer; padding: 0; }
        @media (max-width: 640px) { .pl-lesson-info { grid-template-columns: 1fr 72px; gap: 2px 8px; } .pl-lesson-row-time { grid-column: 1; } .pl-lesson-row-status { grid-column: 2; grid-row: 1; text-align: right; } }
        .pl-lesson-status-upcoming { color: #228B22; }
        .pl-lesson-status-past { color: var(--mid-gray); }
        .pl-lessons-empty { font-family: var(--font-body); font-style: italic; font-size: 14px; color: var(--mid-gray); padding: 32px 0; }

        /* Booking flow section */
        #booking-flow-section { background: var(--off-white); padding: 48px 0; }

        /* Filter bar */
        #pl-filter-bar { background: var(--white); border: 1px solid var(--light-gray); padding: 14px 20px; margin: 0 auto 24px; max-width: fit-content; display: flex; flex-direction: column; gap: 10px; align-items: center; }
        #pl-filter-bar .filter-row { display: flex; align-items: flex-end; gap: 20px; flex-wrap: nowrap; justify-content: center; }
        #pl-filter-bar .filter-group { display: flex; flex-direction: column; gap: 6px; }
        #pl-filter-bar .filter-label { font-family: var(--font-ui); font-size: 11px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.16em; white-space: nowrap; }
        .filter-pill { font-family: var(--font-ui); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 0; padding: 7px 14px; border: 1px solid var(--light-gray); background: var(--white); color: var(--dark); cursor: pointer; transition: border-color 0.2s, color 0.2s, background 0.2s; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; }
        .filter-pill:hover { border-color: var(--crimson); color: var(--crimson); }
        .filter-pill.selected { background: var(--crimson); color: white; border-color: var(--crimson); }
        .clear-filters-btn { font-family: var(--font-ui); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 0; padding: 7px 14px; border: 1px solid var(--light-gray); background: var(--white); color: var(--mid-gray); cursor: pointer; transition: border-color 0.2s, color 0.2s; white-space: nowrap; }
        .clear-filters-btn:hover { border-color: var(--crimson); color: var(--crimson); }
        .pill-chevron { transition: transform 0.2s ease; flex-shrink: 0; }
        .pill-chevron.open { transform: rotate(180deg); }
        .date-tray-pill { font-family: var(--font-ui); font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; border-radius: 0; padding: 6px 12px; border: 1px solid var(--light-gray); background: var(--white); color: var(--dark); cursor: pointer; transition: border-color 0.2s, color 0.2s, background 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 6px; text-align: left; }
        .date-tray-pill:hover { border-color: var(--crimson); color: var(--crimson); }
        .date-tray-pill.selected { background: var(--crimson); color: white; border-color: var(--crimson); }
        .date-tray-pill-day { font-size: 9px; opacity: 0.75; letter-spacing: 0.12em; min-width: 28px; }
        .date-tray-pill-num { font-size: 13px; font-weight: 700; }

        /* Grid layout */
        .pl-grid-layout { display: flex; align-items: flex-start; gap: 24px; margin-top: 24px; }
        .pl-grid-wrapper { flex: 1 1 0; min-width: 0; overflow-x: auto; position: relative; }

        /* Tables */
        #pl-date-grid, #pl-coach-grid-table { border-collapse: separate; border-spacing: 4px; width: 100%; table-layout: fixed; }
        #pl-date-grid th, #pl-coach-grid-table th { font-family: var(--font-ui); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--dark); padding: 8px 4px; text-align: center; border: 1px solid var(--light-gray); }
        .pl-time-col-header { width: 80px; background: var(--white); }
        .pl-time-label { font-family: var(--font-ui); font-size: 11px; color: var(--mid-gray); text-align: right; padding-right: 12px; height: 36px; white-space: nowrap; border: none; width: 80px; }
        .pl-slot-cell { height: 42px; border: 1px solid var(--light-gray); text-align: center; vertical-align: middle; transition: background 0.15s ease, border-color 0.15s ease; border-radius: 4px; position: relative; }
        .pl-slot-cell.pl-avail { background: rgba(34,139,34,0.18); border-color: #228B22; cursor: pointer; }
        .pl-slot-cell.pl-avail:hover { background: rgba(34,139,34,0.28); }
        .pl-slot-cell.pl-taken { background: #F0EEEB; border-color: #C8C4BE; cursor: not-allowed; }
        .pl-slot-cell.pl-selected { background: rgba(255,140,0,0.35); border-color: #FF8C00; cursor: pointer; }

        /* Grid overlay */
        #pl-grid-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(250,248,245,0.82); pointer-events: none; z-index: 2; }
        #pl-grid-overlay p { font-family: var(--font-body); font-style: italic; font-size: 15px; color: var(--mid-gray); text-align: center; max-width: 280px; }

        /* Right panel */
        .pl-right-panel { width: 220px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .pl-panel-box { background: var(--white); border: 1px solid var(--light-gray); padding: 24px; }
        .legend-heading { font-family: var(--font-ui); font-size: 10px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.16em; display: block; margin-bottom: 10px; }
        .legend-divider { border: none; border-top: 1px solid var(--light-gray); margin-bottom: 14px; }
        .pl-how-to-list { list-style: decimal; padding-left: 18px; display: flex; flex-direction: column; gap: 8px; }
        .pl-how-to-list li { font-family: var(--font-body); font-size: 13px; color: var(--dark); }
        .booking-summary-row { display: grid; grid-template-columns: 60px 1fr; gap: 10px 16px; margin-bottom: 20px; margin-top: 12px; }
        .summary-label { font-family: var(--font-ui); font-size: 11px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.14em; line-height: 1.8; }
        .summary-value { font-family: var(--font-body); font-size: 13px; color: var(--dark); line-height: 1.8; }

        /* Coach cards */
        .pl-coaches-heading { font-family: var(--font-display); font-size: 26px; font-weight: 400; color: var(--dark); margin-bottom: 8px; }
        #pl-coach-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .pl-coach-card { display: flex; align-items: flex-start; gap: 16px; border: 1px solid var(--light-gray); padding: 20px; cursor: pointer; background: var(--white); transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .pl-coach-card:hover { border-color: var(--crimson); box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .pl-coach-card-avatar { width: 72px; height: 72px; object-fit: cover; flex-shrink: 0; background: var(--light-gray); border-radius: 2px; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 22px; color: var(--mid-gray); }
        .pl-coach-card-text { display: flex; flex-direction: column; gap: 4px; }
        .pl-coach-card-name { font-family: var(--font-display); font-size: 17px; font-weight: 600; color: var(--dark); }
        .pl-coach-card-role { font-family: var(--font-label); font-size: 11px; font-weight: 600; color: var(--crimson); text-transform: uppercase; letter-spacing: 0.14em; }

        /* Coach header (selected coach) */
        #pl-coach-header { background: var(--off-white); border-top: 1px solid var(--light-gray); border-bottom: 1px solid var(--light-gray); padding: 20px 0; margin-bottom: 28px; }
        .pl-coach-header-inner { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .pl-coach-header-left { display: flex; align-items: center; gap: 16px; }
        .pl-coach-header-photo { width: 56px; height: 56px; border-radius: 50%; background: var(--light-gray); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-family: var(--font-display); font-size: 20px; color: var(--mid-gray); }
        .pl-coach-header-name { font-family: var(--font-display); font-size: 18px; font-weight: 400; color: var(--dark); display: block; }
        .pl-coach-header-role { font-family: var(--font-label); font-size: 11px; font-weight: 600; color: var(--crimson); text-transform: uppercase; letter-spacing: 0.14em; display: block; }
        #pl-change-coach-btn { font-family: var(--font-ui); font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--crimson); background: none; border: none; cursor: pointer; flex-shrink: 0; }
        #pl-change-coach-btn:hover { color: var(--crimson-dk); }

        /* Week nav */
        #pl-week-nav { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px; }
        .pl-week-btn { padding: 7px 16px; font-size: 16px; }
        #pl-week-label { font-family: var(--font-ui); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: var(--dark); }

        /* Inline popup */
        .pl-cell-popup { position: absolute; top: calc(100% + 4px); left: 50%; transform: translateX(-50%); z-index: 200; background: var(--white); border: 1px solid var(--light-gray); border-top: 2px solid var(--crimson); padding: 10px 14px; display: flex; flex-direction: column; align-items: center; gap: 8px; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.12); min-width: 160px; }
        .pl-cell-popup-label { font-family: var(--font-body); font-size: 12px; font-style: italic; color: var(--mid-gray); text-align: center; }
        .pl-cell-popup-actions { display: flex; gap: 8px; align-items: center; }
        .pl-inline-cancel-btn { font-family: var(--font-ui); font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--mid-gray); background: none; border: none; cursor: pointer; }
        .pl-inline-cancel-btn:hover { color: var(--dark); }

        /* Confirmation panel */
        #pl-confirmation-panel { max-width: 560px; margin: 40px auto 0; background: var(--off-white); border: 1px solid var(--light-gray); border-top: 3px solid var(--crimson); padding: 36px 40px; }
        .pl-confirm-heading { font-family: var(--font-display); font-size: 24px; font-weight: 400; color: var(--dark); margin-bottom: 6px; }
        .pl-confirm-subtext { font-family: var(--font-body); font-size: 13px; color: var(--mid-gray); font-style: italic; margin-bottom: 24px; }
        .pl-confirm-details { display: grid; grid-template-columns: 100px 1fr; gap: 10px 0; margin-bottom: 20px; }
        .pl-confirm-label { font-family: var(--font-ui); font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--mid-gray); padding-top: 2px; }
        .pl-confirm-value { font-family: var(--font-body); font-size: 15px; color: var(--dark); }
        .pl-confirm-actions { display: flex; gap: 12px; align-items: center; margin-top: 20px; }
        .pl-family-select { width: 100%; border: none; border-bottom: 1px solid var(--light-gray); padding: 10px 0; font-family: var(--font-body); font-size: 15px; background: transparent; outline: none; cursor: pointer; margin-bottom: 20px; }

        /* Success */
        @keyframes checkScale { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .success-check { width: 56px; height: 56px; border-radius: 50%; border: 2px solid var(--crimson); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; animation: checkScale 0.4s ease both; }
        .success-check span { font-family: var(--font-display); font-size: 28px; color: var(--crimson); line-height: 1; }
        .success-detail { font-family: var(--font-body); font-size: 13px; color: var(--mid-gray); text-align: center; line-height: 1.8; }

        /* Date slot list */
        .date-slot-list { display: flex; flex-direction: column; gap: 6px; flex: 1; max-width: 300px; }
        .date-slot-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border: 1px solid var(--light-gray); background: var(--white); cursor: pointer; transition: border-color 0.2s; width: 100%; text-align: left; }
        .date-slot-item:not(:disabled):hover { border-color: var(--crimson); }
        .date-slot-item.ds-selected { border-color: var(--crimson); background: #FDF5F5; }
        .date-slot-item:disabled { opacity: 0.38; cursor: default; }
        .date-slot-time { font-family: var(--font-ui); font-size: 13px; font-weight: 500; color: var(--dark); }
        .date-slot-avail { font-family: var(--font-ui); font-size: 11px; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.1em; }
        .date-slot-item.ds-selected .date-slot-avail { color: var(--crimson); }
        /* Coach picker */
        .coach-picker { flex: 1; min-width: 240px; }
        .coach-picker-heading { font-family: var(--font-display); font-size: 22px; font-weight: 400; color: var(--dark); margin-bottom: 4px; }
        .coach-pick-card { width: 100%; display: flex; flex-direction: column; align-items: flex-start; padding: 16px 20px; border: 1px solid var(--light-gray); background: var(--white); cursor: pointer; margin-bottom: 8px; transition: border-color 0.2s; text-align: left; }
        .coach-pick-card:hover { border-color: var(--crimson); }
        .coach-pick-name { font-family: var(--font-body); font-size: 15px; color: var(--dark); }
        .coach-pick-sub { font-family: var(--font-body); font-size: 12px; color: var(--mid-gray); font-style: italic; margin-top: 2px; }
        /* Mobile */
        @media (max-width: 768px) { .path-cards { grid-template-columns: 1fr; } #pl-coach-grid { grid-template-columns: 1fr; } .date-slot-list { max-width: 100%; } }
        @media (max-width: 600px) { #pl-slim-hero h1 { font-size: 36px; } #verify-card { padding: 40px 24px; } }
      `}</style>

      {/* ─── SLIM HERO ─────────────────────────────────────────── */}
      <section id="pl-slim-hero">
        <Image fill priority src="/NYAC.Website.Photos/Arial-courts-final.jpeg" alt="" style={{ objectFit: 'cover', zIndex: -1 }} />
        <h1>Private Lessons</h1>
        <hr className="slim-hero-divider" />
        <p className="hero-location">NYAC Travers Island</p>
        {verified && (
          <div id="verify-strip">
            <div className="verify-strip-left">
              <span className="verify-strip-check">✓</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--mid-gray)' }}>Verified</span>
            </div>
            <span id="strip-name-display">{verifiedLabel}</span>
            <button id="strip-sign-out-btn" onClick={doSignOut}>Sign Out</button>
          </div>
        )}
      </section>

      {/* ─── VERIFICATION GATE ─────────────────────────────────── */}
      {!verified && (
        <section id="verification-gate">
          <div id="verify-card">
            <span className="gate-member-access-label">Member Access</span>
            <h2 className="gate-heading">Welcome to Travers Island Tennis</h2>
            <p className="gate-subtext">Enter your audit number and last name to access lesson booking and your lesson history.</p>
            <div className="gate-field-group">
              <label className="gate-field-label" htmlFor="gate-audit">Audit #</label>
              <input
                type="text" id="gate-audit" className="gate-field-input" inputMode="numeric" autoComplete="off"
                value={auditInput} onChange={e => setAuditInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doVerify()}
              />
            </div>
            <div className="gate-field-group">
              <label className="gate-field-label" htmlFor="gate-last-name">Last Name</label>
              <input
                type="text" id="gate-last-name" className="gate-field-input" autoComplete="family-name"
                value={lastNameInput} onChange={e => setLastNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doVerify()}
              />
            </div>
            {verifyError && <p id="gate-error">{verifyError}</p>}
            <button className="btn-crimson" style={{ width: '100%' }} onClick={doVerify} disabled={verifyLoading}>
              {verifyLoading ? 'Verifying…' : 'Continue'}
            </button>
          </div>
        </section>
      )}

      {/* ─── BOOKING ENTRY ─────────────────────────────────────── */}
      {verified && !currentFlow && (
        <section id="booking-entry">
          <div className="section-inner">
            <h2 className="booking-heading fade-up">Book a Lesson</h2>
            <hr className="divider-crimson fade-up" />
            <div className="path-cards">
              <div className="path-card fade-up" onClick={() => startFlow('coach')}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--crimson)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="16" cy="10" r="5" />
                  <path d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" />
                </svg>
                <div className="path-card-title">Browse by Coach</div>
                <p className="path-card-sub">Choose your preferred coach, then find a time that works.</p>
              </div>
              <div className="path-card fade-up" onClick={() => startFlow('date')}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--crimson)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="26" height="24" rx="2" />
                  <line x1="3" y1="13" x2="29" y2="13" />
                  <line x1="10" y1="3" x2="10" y2="7" />
                  <line x1="22" y1="3" x2="22" y2="7" />
                  <rect x="8" y="17" width="4" height="4" rx="0.5" />
                  <rect x="14" y="17" width="4" height="4" rx="0.5" />
                  <rect x="20" y="17" width="4" height="4" rx="0.5" />
                  <rect x="8" y="23" width="4" height="4" rx="0.5" />
                  <rect x="14" y="23" width="4" height="4" rx="0.5" />
                </svg>
                <div className="path-card-title">Browse by Date</div>
                <p className="path-card-sub">Pick a date first, then see all available coaches and times.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── MEMBER LESSONS ─────────────────────────────────────── */}
      {verified && !currentFlow && (
        <section id="member-lessons">
          <div className="section-inner">
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--light-gray)', marginBottom: 32 }}>
              <button className={`pl-lessons-tab${lessonsTab === 'upcoming' ? ' pl-tab-active' : ''}`} onClick={() => setLessonsTab('upcoming')}>Upcoming</button>
              <button className={`pl-lessons-tab${lessonsTab === 'past' ? ' pl-tab-active' : ''}`} onClick={() => setLessonsTab('past')}>Past</button>
            </div>

            {lessonsTab === 'upcoming' && (
              upcomingLessons.length === 0
                ? <p className="pl-lessons-empty">No upcoming lessons scheduled.</p>
                : upcomingLessons.map(l => (
                  <div key={l.id} className="pl-lesson-row">
                    <div className="pl-lesson-info">
                      <span className="pl-lesson-row-date">{new Date(l.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: ET_TZ })}</span>
                      <span className="pl-lesson-row-coach">{l.coach ? `${l.coach.first_name} ${l.coach.last_name}` : 'Any Coach'}</span>
                      <span className="pl-lesson-row-time">{new Date(l.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: ET_TZ })} · {l.duration_minutes} min</span>
                      <span className={`pl-lesson-row-status pl-lesson-status-upcoming`}>{l.status === 'pending_pickup' ? 'Pending' : 'Confirmed'}</span>
                    </div>
                    {cancellingId === l.id ? (
                      <div className="pl-cancel-confirm">
                        <button className="pl-cancel-yes" disabled={cancelLoading} onClick={() => handleCancelLesson(l.id)}>
                          {cancelLoading ? '…' : 'Yes, cancel'}
                        </button>
                        <button className="pl-cancel-no" onClick={() => setCancellingId(null)}>Keep it</button>
                      </div>
                    ) : (
                      <button className="pl-cancel-btn" onClick={() => setCancellingId(l.id)}>Cancel</button>
                    )}
                  </div>
                ))
            )}

            {lessonsTab === 'past' && (
              pastLessons.length === 0
                ? <p className="pl-lessons-empty">No past lessons found.</p>
                : pastLessons.map(l => (
                  <div key={l.id} className="pl-lesson-row">
                    <div className="pl-lesson-info">
                      <span className="pl-lesson-row-date">{new Date(l.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: ET_TZ })}</span>
                      <span className="pl-lesson-row-coach">{l.coach ? `${l.coach.first_name} ${l.coach.last_name}` : 'Any Coach'}</span>
                      <span className="pl-lesson-row-time">{new Date(l.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: ET_TZ })} · {l.duration_minutes} min</span>
                      <span className="pl-lesson-row-status pl-lesson-status-past">{l.status === 'completed' ? 'Completed' : l.status}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>
      )}

      {/* ─── BOOKING FLOW SECTION ────────────────────────────────── */}
      {verified && currentFlow && (
        <section id="booking-flow-section">
          <div className="section-inner">

            {/* Date Flow */}
            {currentFlow === 'date' && bookingStep === 0 && (
              <>
                <button className="back-link" onClick={resetToPathSelector}>← Change Selection</button>
                {availLoading ? (
                  <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--mid-gray)', padding: '40px 0' }}>Loading availability…</p>
                ) : (
                  <>
                    {renderDateFilterBar()}
                    <div className="pl-grid-layout">
                      {renderDateSlotList()}
                      {dateSelectedSlot && renderCoachPicker()}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Coach Flow */}
            {currentFlow === 'coach' && bookingStep === 0 && (
              <>
                <button className="back-link" onClick={resetToPathSelector}>← Change Selection</button>
                {availLoading ? (
                  <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--mid-gray)', padding: '40px 0' }}>Loading coaches…</p>
                ) : !selectedCoach ? (
                  <>
                    <h2 className="pl-coaches-heading fade-up">Select a Coach</h2>
                    <hr className="divider-crimson fade-up" style={{ marginBottom: 28 }} />
                    <div id="pl-coach-grid">
                      {coaches.map(c => (
                        <div key={c.id} className="pl-coach-card fade-up" onClick={() => {
                          setSelectedCoach(c);
                          setWeekOffset(0);
                          setCoachSummary({ coach: `${c.first_name} ${c.last_name}`, date: '—', time: '—' });
                          setTimeout(() => {
                            document.getElementById('pl-coach-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 100);
                        }}>
                          <div className="pl-coach-card-avatar">{c.first_name[0]}{c.last_name[0]}</div>
                          <div className="pl-coach-card-text">
                            <span className="pl-coach-card-name">{c.first_name} {c.last_name}</span>
                            <span className="pl-coach-card-role">{c.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Coach header strip */}
                    <div id="pl-coach-header">
                      <div className="pl-coach-header-inner">
                        <div className="pl-coach-header-left">
                          <div className="pl-coach-header-photo">{selectedCoach.first_name[0]}{selectedCoach.last_name[0]}</div>
                          <div>
                            <span className="pl-coach-header-name">{selectedCoach.first_name} {selectedCoach.last_name}</span>
                            <span className="pl-coach-header-role">{selectedCoach.role}</span>
                          </div>
                        </div>
                        <button id="pl-change-coach-btn" onClick={() => {
                          setSelectedCoach(null);
                          setCoachSelectedDateISO(null);
                          setCoachSelectedSlot(null);
                          setPopupCell(null);
                          setCoachSummary({ coach: '—', date: '—', time: '—' });
                          setWeekOffset(0);
                        }}>← Change Coach</button>
                      </div>
                    </div>

                    {/* Week nav */}
                    <div id="pl-week-nav">
                      <button
                        className="btn-light pl-week-btn"
                        style={{ opacity: weekOffset === 0 ? 0.4 : 1, pointerEvents: weekOffset === 0 ? 'none' : 'auto' }}
                        onClick={() => { if (weekOffset > 0) { setWeekOffset(0); setPopupCell(null); setCoachSelectedDateISO(null); setCoachSelectedSlot(null); } }}
                      >←</button>
                      <span id="pl-week-label">{weekLabel(weekOffset)}</span>
                      <button
                        className="btn-light pl-week-btn"
                        style={{ opacity: weekOffset === 1 ? 0.4 : 1, pointerEvents: weekOffset === 1 ? 'none' : 'auto' }}
                        onClick={() => { if (weekOffset < 1) { setWeekOffset(1); setPopupCell(null); setCoachSelectedDateISO(null); setCoachSelectedSlot(null); } }}
                      >→</button>
                    </div>

                    {/* Coach week grid + right panel */}
                    <div className="pl-grid-layout">
                      {renderCoachWeekGrid()}
                      <div className="pl-right-panel">
                        <div className="pl-panel-box">
                          <span className="legend-heading">How to Book</span>
                          <hr className="legend-divider" />
                          <ol className="pl-how-to-list">
                            <li>Browse this week or next using the arrows above.</li>
                            <li>Click an available slot to select it.</li>
                            <li>Review your summary, then confirm.</li>
                          </ol>
                        </div>
                        <div className="pl-panel-box">
                          <span className="legend-heading">Booking Summary</span>
                          <hr className="legend-divider" />
                          <div className="booking-summary-row">
                            <span className="summary-label">Coach</span><span className="summary-value">{coachSummary.coach}</span>
                            <span className="summary-label">Date</span><span className="summary-value">{coachSummary.date}</span>
                            <span className="summary-label">Time</span><span className="summary-value">{coachSummary.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Confirmation Panel */}
            {bookingStep === 1 && pendingBooking && (
              <div id="pl-confirmation-panel">
                <h3 className="pl-confirm-heading">Confirm Your Lesson</h3>
                <p className="pl-confirm-subtext">Please review the details below before confirming.</p>
                <div className="pl-confirm-details">
                  <span className="pl-confirm-label">Coach</span><span className="pl-confirm-value">{pendingBooking.coachName}</span>
                  <span className="pl-confirm-label">Date</span><span className="pl-confirm-value">{pendingBooking.dateLong}</span>
                  <span className="pl-confirm-label">Time</span><span className="pl-confirm-value">{pendingBooking.timeFmt}</span>
                  <span className="pl-confirm-label">Duration</span><span className="pl-confirm-value">60 min</span>
                </div>
                {familyMembers.length > 1 && (
                  <>
                    <label className="gate-field-label" style={{ marginBottom: 8, display: 'block' }}>Booking For</label>
                    <select
                      className="pl-family-select"
                      value={selectedMemberId}
                      onChange={e => setSelectedMemberId(e.target.value)}
                    >
                      {familyMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                      ))}
                    </select>
                  </>
                )}
                {familyMembers.length === 0 && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--crimson)', marginBottom: 16 }}>
                    No member history found. Please contact the tennis house to book your first lesson.
                  </p>
                )}
                {bookingError && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--crimson)', marginBottom: 16 }}>{bookingError}</p>}
                <div className="pl-confirm-actions">
                  <button className="btn-crimson" onClick={doBook} disabled={bookingLoading || familyMembers.length === 0}>
                    {bookingLoading ? 'Booking…' : 'Confirm Booking'}
                  </button>
                  <button className="btn-light" onClick={() => {
                    setBookingStep(0);
                    setPendingBooking(null);
                    setBookingError('');
                    setPopupCell(null);
                  }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Success State */}
            {bookingStep === 2 && pendingBooking && (
              <div id="pl-confirmation-panel" style={{ textAlign: 'center' }}>
                <div className="success-check"><span>✓</span></div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--dark)', marginBottom: 12 }}>Lesson Booked!</h3>
                <p className="success-detail">
                  {pendingBooking.coachName}<br />
                  {pendingBooking.dateLong}<br />
                  {pendingBooking.timeFmt}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
                  <button className="btn-crimson" style={{ width: '100%' }} onClick={() => {
                    setBookingStep(0);
                    setPendingBooking(null);
                    setCurrentFlow(null);
                  }}>Book Another Lesson</button>
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
