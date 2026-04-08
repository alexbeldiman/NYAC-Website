'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/* ─── Types ──────────────────────────────────────────────────── */
interface Court {
  id: string;
  name: string;
  is_pro_court: boolean;
  status: 'available' | 'blocked' | 'maintenance';
  blocked_reason?: string | null;
  booked_windows: { start_time: string; duration_minutes: number }[];
}

interface CourtBooking {
  id: string;
  start_time: string;
  duration_minutes: number;
  status: string;
  court: { id: string; name: string } | null;
  member: { first_name: string; last_name: string } | null;
}

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  is_child: boolean;
}

/* ─── Court Map ──────────────────────────────────────────────── */
const COURT_MAP = [
  { key: 'P1', name: 'Court 13', cluster: 'pro',     points: '354,225 434,210 469,371 387,388', num: 13, x: 411, y: 299 },
  { key: 'P2', name: 'Court 14', cluster: 'pro',     points: '455,206 536,190 570,352 489,369', num: 14, x: 512, y: 279 },
  { key: 'P3', name: 'Court 15', cluster: 'pro',     points: '555,185 636,169 670,331 589,348', num: 15, x: 612, y: 258 },
  { key: 'N1', name: 'Court 16', cluster: 'north',   points: '772,103 852,87 887,249 805,266',  num: 16, x: 829, y: 176 },
  { key: 'N2', name: 'Court 17', cluster: 'north',   points: '873,83 954,68 988,229 906,246',   num: 17, x: 930, y: 157 },
  { key: 'N3', name: 'Court 18', cluster: 'north',   points: '970,62 1051,47 1085,209 1004,225',num: 18, x: 1028, y: 136 },
  { key: 'C1', name: 'Court 8',  cluster: 'central', points: '599,606 681,608 678,775 596,773', num: 8,  x: 638, y: 690 },
  { key: 'C2', name: 'Court 7',  cluster: 'central', points: '693,608 776,610 773,777 691,775', num: 7,  x: 732, y: 692 },
  { key: 'C3', name: 'Court 6',  cluster: 'central', points: '790,610 872,612 870,779 787,776', num: 6,  x: 829, y: 694 },
  { key: 'C4', name: 'Court 5',  cluster: 'central', points: '886,612 968,613 966,780 883,778', num: 5,  x: 925, y: 696 },
  { key: 'W1', name: 'Court 4',  cluster: 'west',    points: '579,864 661,866 659,1032 576,1030',num: 4, x: 618, y: 948 },
  { key: 'W2', name: 'Court 3',  cluster: 'west',    points: '674,866 756,867 754,1034 671,1032',num: 3, x: 713, y: 950 },
  { key: 'W3', name: 'Court 2',  cluster: 'west',    points: '769,867 851,869 849,1036 766,1034',num: 2, x: 808, y: 952 },
  { key: 'W4', name: 'Court 1',  cluster: 'west',    points: '865,868 947,869 945,1036 862,1034',num: 1, x: 904, y: 953 },
  { key: 'S1', name: 'Court 12', cluster: 'south',   points: '71,785 153,789 146,956 63,951',   num: 12, x: 107, y: 870 },
  { key: 'S2', name: 'Court 11', cluster: 'south',   points: '169,791 251,795 243,962 161,957', num: 11, x: 205, y: 876 },
  { key: 'S3', name: 'Court 10', cluster: 'south',   points: '266,796 348,801 341,967 258,963', num: 10, x: 303, y: 882 },
  { key: 'S4', name: 'Court 9',  cluster: 'south',   points: '367,801 449,805 441,972 359,967', num: 9,  x: 404, y: 887 },
];

const CLUSTER_INFO = [
  { key: 'pro',     label: 'Pro Courts',     sub: 'Blue/Green Hard Courts', count: 3 },
  { key: 'north',   label: 'North Clay',     sub: 'Har-Tru Clay Courts',    count: 3 },
  { key: 'central', label: 'Central Clay',   sub: 'Har-Tru Clay Courts',    count: 4 },
  { key: 'south',   label: 'South Clay',     sub: 'Har-Tru Clay Courts',    count: 4 },
  { key: 'west',    label: 'West Clay',      sub: 'Har-Tru Clay Courts',    count: 4 },
];

const DURATIONS = [
  { value: 0.5, label: '30 min', long: '30 Minutes' },
  { value: 1,   label: '1 hr',   long: '1 Hour' },
  { value: 1.5, label: '1.5 hr', long: '1.5 Hours' },
  { value: 2,   label: '2 hr',   long: '2 Hours' },
];

/* ─── Date / Time Helpers ────────────────────────────────────── */
function getDateStrings(count = 14): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(formatDateKey(d));
  }
  return dates;
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatDateShort(dateStr: string, index: number): { day: string; num: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (index === 0) return { day: 'TODAY', num: String(d) };
  return {
    day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    num: String(d),
  };
}

function getAllTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 7; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 20) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  slots.push('20:30');
  return slots;
}

function slotToMinutes(slot: string): number {
  const [h, m] = slot.split(':').map(Number);
  return h * 60 + m;
}

function formatTime12(slot: string): string {
  const [h, m] = slot.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function isCourtAvailableForSlot(court: Court, dateStr: string, startTime: string, durationHours: number): boolean {
  if (court.status !== 'available') return false;
  const startMin = slotToMinutes(startTime);
  const durationMin = durationHours * 60;
  const endMin = startMin + durationMin;
  if (endMin > 21 * 60) return false;
  for (const w of court.booked_windows) {
    const wDate = w.start_time.split('T')[0];
    if (wDate !== dateStr) continue;
    const wTime = w.start_time.split('T')[1]?.substring(0, 5);
    if (!wTime) continue;
    const wStart = slotToMinutes(wTime);
    const wEnd = wStart + w.duration_minutes;
    if (startMin < wEnd && endMin > wStart) return false;
  }
  return true;
}

const DATE_STRINGS = getDateStrings();
const ALL_TIME_SLOTS = getAllTimeSlots();

/* ─── Main Component ─────────────────────────────────────────── */
export default function CourtBookingPage() {
  const [courts, setCourts] = useState<Court[]>([]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);

  const [selectedCourtKey, setSelectedCourtKey] = useState<string | null>(null);

  /* Verification gate */
  const [verified, setVerified] = useState(false);
  const [verifiedLabel, setVerifiedLabel] = useState('');
  const [auditInput, setAuditInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const credsRef = useRef<{ auditNumber: string; lastName: string }>({ auditNumber: '', lastName: '' });

  /* Member bookings */
  const [upcomingLessons, setUpcomingLessons] = useState<CourtBooking[]>([]);
  const [pastLessons, setPastLessons] = useState<CourtBooking[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [lessonsTab, setLessonsTab] = useState<'upcoming' | 'past'>('upcoming');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  /* Booking panel */
  const [bookingStep, setBookingStep] = useState(0);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);


  const bookingPanelRef = useRef<HTMLDivElement>(null);
  const filtersActive = !!(selectedDate && selectedTime && selectedDuration);

  /* ─── Load Courts ────────────────────────────────────────────── */
  const loadCourts = useCallback(async (date: string) => {
    try {
      const res = await fetch(`/api/courts/availability?date=${date}`);
      const data = await res.json();
      if (res.ok) setCourts(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadCourts(DATE_STRINGS[0]!);
  }, [loadCourts]);

  useEffect(() => {
    if (selectedDate) loadCourts(selectedDate);
  }, [selectedDate, loadCourts]);

  /* ─── Close trays on outside click ─────────────────────────── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as Element;
      if (!t.closest('#date-selector-wrap')) setDateOpen(false);
      if (!t.closest('#time-selector-wrap')) setTimeOpen(false);
      if (!t.closest('#duration-selector-wrap')) setDurationOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ─── Court State ────────────────────────────────────────────── */
  function getCourtState(courtKey: string): 'default' | 'available' | 'unavailable' | 'selected' {
    if (!filtersActive) return 'default';
    if (courtKey === selectedCourtKey) return 'selected';
    const cm = COURT_MAP.find(c => c.key === courtKey);
    if (!cm) return 'unavailable';
    const court = courts.find(c => c.name === cm.name);
    if (!court) return 'unavailable';
    return isCourtAvailableForSlot(court, selectedDate!, selectedTime!, selectedDuration!)
      ? 'available' : 'unavailable';
  }

  /* ─── Verification ──────────────────────────────────────────── */
  async function loadLessons(audit: string, last: string) {
    try {
      const res = await fetch(`/api/court-bookings/member?audit_number=${encodeURIComponent(audit)}&last_name=${encodeURIComponent(last)}`);
      const data = await res.json();
      if (res.ok) {
        setUpcomingLessons(data.upcoming ?? []);
        setPastLessons(data.past ?? []);
      }
    } catch { /* silent */ }
  }

  async function doVerify() {
    const audit = auditInput.trim();
    const last = lastNameInput.trim();
    if (!audit || !last) { setVerifyError('Please enter both fields.'); return; }
    setVerifyLoading(true);
    setVerifyError('');
    try {
      const [verifyRes, lessonsRes] = await Promise.all([
        fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audit_number: audit, last_name: last }),
        }),
        fetch(`/api/court-bookings/member?audit_number=${encodeURIComponent(audit)}&last_name=${encodeURIComponent(last)}`),
      ]);
      if (!verifyRes.ok) { setVerifyError('Audit number or last name not recognised. Please try again.'); return; }
      const verifyData = await verifyRes.json();
      const lessonsData = await lessonsRes.json();
      const adults: FamilyMember[] = verifyData.adults ?? [];
      const children: FamilyMember[] = verifyData.children ?? [];
      const allMembers = [...adults, ...children];
      setFamilyMembers(allMembers);
      setSelectedMemberId(adults[0]?.id ?? allMembers[0]?.id ?? null);
      setUpcomingLessons(lessonsData.upcoming ?? []);
      setPastLessons(lessonsData.past ?? []);
      credsRef.current = { auditNumber: audit, lastName: last };
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
    setUpcomingLessons([]);
    setPastLessons([]);
    setFamilyMembers([]);
    setSelectedMemberId(null);
    setCancellingId(null);
    credsRef.current = { auditNumber: '', lastName: '' };
    resetWidget();
  }

  function handleCourtClick(courtKey: string) {
    if (!filtersActive) return;
    if (getCourtState(courtKey) === 'unavailable') return;
    setSelectedCourtKey(courtKey);
    setBookingStep(1);
    setBookingError('');
    setTimeout(() => bookingPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  /* ─── Booking ────────────────────────────────────────────────── */
  async function confirmBooking() {
    setBookingError('');
    if (!selectedMemberId) { setBookingError('Please select a member.'); return; }
    const court = courts.find(c => c.name === selectedCourtData?.name);
    if (!court) { setBookingError('Court not found. Please reselect.'); return; }
    setBookingLoading(true);
    try {
      const start_time = `${selectedDate}T${selectedTime}:00`;
      const duration_minutes = selectedDuration! * 60;
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audit_number: credsRef.current.auditNumber,
          last_name: credsRef.current.lastName,
          member_id: selectedMemberId,
          start_time,
          duration_minutes,
          court_id: court.id,
          booked_via: 'court_booking',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error ?? 'Booking failed. Please try again.');
        return;
      }
      setBookingStep(2);
      loadCourts(selectedDate!);
      loadLessons(credsRef.current.auditNumber, credsRef.current.lastName);
    } catch {
      setBookingError('Something went wrong. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  }

  async function cancelBooking(bookingId: string) {
    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/court-bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audit_number: credsRef.current.auditNumber,
          last_name: credsRef.current.lastName,
          action: 'cancel',
        }),
      });
      if (res.ok) {
        await loadLessons(credsRef.current.auditNumber, credsRef.current.lastName);
        if (selectedDate) loadCourts(selectedDate);
      }
    } catch { /* silent */ } finally {
      setCancellingId(null);
    }
  }

  function resetWidget() {
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedDuration(null);
    setSelectedCourtKey(null);
    setBookingStep(0);
    setBookingError('');
  }

  /* ─── Derived display values ─────────────────────────────────── */
  const selectedCourtData = COURT_MAP.find(c => c.key === selectedCourtKey);
  const dateLabel = selectedDate ? formatDateLong(selectedDate) : '—';
  const timeLabel = selectedTime ? formatTime12(selectedTime) : '—';
  const durLabel = selectedDuration ? (DURATIONS.find(d => d.value === selectedDuration)?.long ?? '—') : '—';
  const courtLabel = selectedCourtData ? selectedCourtData.name : '—';

  /* ─── SVG polygon fill/stroke ────────────────────────────────── */
  function polyStyle(state: ReturnType<typeof getCourtState>): React.CSSProperties {
    switch (state) {
      case 'available': return { fill: 'rgba(34,139,34,0.28)', stroke: '#228B22', strokeWidth: 3.5, cursor: 'pointer', pointerEvents: 'auto' };
      case 'unavailable': return { fill: 'rgba(200,16,46,0.3)', stroke: '#C8102E', strokeWidth: 3.5, cursor: 'not-allowed', pointerEvents: 'none' };
      case 'selected': return { fill: 'rgba(255,140,0,0.35)', stroke: '#FF8C00', strokeWidth: 3.5, cursor: 'pointer', pointerEvents: 'auto' };
      default: return { fill: 'transparent', stroke: 'transparent', strokeWidth: 3.5, cursor: 'not-allowed', pointerEvents: 'none', opacity: filtersActive ? 1 : 0.35 };
    }
  }

  return (
    <>
      <style suppressHydrationWarning>{`
        #slim-hero {
          height: 320px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding-top: 76px; margin-top: var(--nav-height);
          position: relative;
        }
        #slim-hero h1 { font-family: var(--font-display); font-size: 56px; font-weight: 400; color: white; text-shadow: 0 2px 12px rgba(0,0,0,0.35); }
        .slim-hero-divider { border: none; border-top: 1px solid rgba(255,255,255,0.7); width: 48px; margin: 8px auto; }
        .hero-location { font-family: var(--font-ui); font-size: 13px; font-weight: 500; color: white; text-transform: uppercase; letter-spacing: 0.18em; margin-top: 4px; text-shadow: 0 1px 6px rgba(0,0,0,0.35); }

        /* Verified strip */
        #verify-strip { position: absolute; bottom: 20px; left: 24px; background: rgba(255,255,255,0.92); border: 1px solid rgba(255,255,255,0.6); border-radius: 6px; padding: 10px 14px; backdrop-filter: blur(4px); display: flex; flex-direction: column; gap: 4px; min-width: 180px; }
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

        /* My Bookings */
        #my-bookings { background: var(--white); padding: 48px 0 0; }
        .pl-lessons-tab { font-family: var(--font-ui); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: var(--mid-gray); background: none; border: none; border-bottom: 2px solid transparent; padding: 12px 24px 12px 0; cursor: pointer; margin-right: 24px; transition: color 0.2s, border-color 0.2s; }
        .pl-tab-active { color: var(--crimson); border-bottom-color: var(--crimson) !important; }
        .pl-lesson-row { display: grid; grid-template-columns: 140px 1fr 130px 100px; align-items: center; gap: 12px 24px; padding: 16px 0; border-bottom: 1px solid var(--light-gray); }
        .pl-lesson-row:first-child { border-top: 1px solid var(--light-gray); }
        .pl-lesson-row-date { font-family: var(--font-body); font-size: 14px; color: var(--dark); }
        .pl-lesson-row-coach { font-family: var(--font-body); font-size: 14px; color: var(--dark); }
        .pl-lesson-row-time { font-family: var(--font-ui); font-size: 12px; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.08em; }
        .pl-lesson-row-status { font-family: var(--font-ui); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
        .pl-lesson-status-upcoming { color: #228B22; }
        .pl-lesson-status-past { color: var(--mid-gray); }
        .pl-lessons-empty { font-family: var(--font-body); font-style: italic; font-size: 14px; color: var(--mid-gray); padding: 32px 0; }

        #booking-widget { background: var(--off-white); padding: 28px 0 96px; }
        .booking-inner { max-width: 1400px; margin: 0 auto; padding: 0 40px; }

        #filter-bar {
          background: var(--white); border: 1px solid var(--light-gray);
          padding: 14px 20px; margin: 0 auto 24px; max-width: fit-content;
          display: flex; flex-direction: column; gap: 10px; align-items: center;
        }
        .filter-row { display: flex; align-items: flex-end; gap: 20px; flex-wrap: nowrap; justify-content: center; }
        .filter-group { display: flex; flex-direction: column; gap: 6px; }
        .filter-label { font-family: var(--font-ui); font-size: 11px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.16em; white-space: nowrap; }
        .filter-pill {
          font-family: var(--font-ui); font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; border-radius: 0; padding: 7px 14px;
          border: 1px solid var(--light-gray); background: var(--white); color: var(--dark);
          cursor: pointer; transition: border-color 0.2s, color 0.2s, background 0.2s;
          white-space: nowrap; display: inline-flex; align-items: center; gap: 6px;
        }
        .filter-pill:hover { border-color: var(--crimson); color: var(--crimson); }
        .filter-pill.active { background: var(--crimson); color: white; border-color: var(--crimson); }
        .clear-filters-btn {
          font-family: var(--font-ui); font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; border-radius: 0; padding: 7px 14px;
          border: 1px solid var(--light-gray); background: var(--white); color: var(--mid-gray);
          cursor: pointer; transition: border-color 0.2s, color 0.2s;
        }
        .clear-filters-btn:hover { border-color: var(--crimson); color: var(--crimson); }

        .selector-wrap { display: flex; flex-direction: column; gap: 10px; position: relative; }
        .expanded-tray {
          display: flex; flex-direction: column; gap: 4px; padding: 6px;
          border: 1px solid var(--light-gray); background: var(--off-white);
          position: absolute; top: calc(100% + 4px); left: 0; z-index: 100;
          max-height: 205px; overflow-y: auto; min-width: 130px;
          animation: tray-in 0.18s ease;
        }
        @keyframes tray-in { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        .tray-pill {
          font-family: var(--font-ui); font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; padding: 6px 12px; border: 1px solid var(--light-gray);
          background: var(--white); color: var(--dark); cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s; white-space: nowrap;
          display: flex; align-items: center; gap: 6px; text-align: left; border-radius: 0;
        }
        .tray-pill:hover { border-color: var(--crimson); color: var(--crimson); }
        .tray-pill.selected { background: var(--crimson); color: white; border-color: var(--crimson); }
        .tray-pill-day { font-size: 9px; opacity: 0.75; letter-spacing: 0.12em; min-width: 32px; }
        .tray-pill-num { font-size: 13px; font-weight: 700; }

        .map-layout { display: flex; align-items: flex-start; justify-content: center; gap: 32px; padding: 0; }
        .legend-panel { width: 220px; flex-shrink: 0; background: var(--white); border: 1px solid var(--light-gray); padding: 24px; }
        .legend-heading { font-family: var(--font-ui); font-size: 10px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.16em; display: block; margin-bottom: 10px; }
        .legend-divider { border: none; border-top: 1px solid var(--light-gray); margin-bottom: 14px; }
        .legend-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .legend-swatch { width: 12px; height: 12px; flex-shrink: 0; }
        .legend-item-text { font-family: var(--font-body); font-size: 14px; color: var(--dark); }

        .map-wrap { position: relative; display: inline-block; flex-shrink: 0; }
        #court-map-img { display: block; width: 650px; height: auto; }
        #court-svg-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .court-label {
          font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 700;
          fill: white; text-anchor: middle; dominant-baseline: middle; pointer-events: none;
          paint-order: stroke fill; stroke: rgba(0,0,0,0.55); stroke-width: 3px; letter-spacing: 0.05em;
        }

        .right-col { display: flex; flex-direction: column; gap: 16px; flex-shrink: 0; align-self: flex-start; width: 220px; }
        #instructions-panel { background: var(--white); border: 1px solid var(--light-gray); padding: 24px; }
        #court-info-panel { background: var(--white); border: 1px solid var(--light-gray); padding: 24px; }
        .summary-live-table { display: grid; grid-template-columns: auto 1fr; gap: 10px 12px; margin-top: 4px; }
        .summary-live-label { font-family: var(--font-ui); font-size: 10px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.14em; line-height: 1.6; white-space: nowrap; }
        .summary-live-value { font-family: var(--font-body); font-size: 13px; color: var(--dark); line-height: 1.6; }
        .summary-live-value.empty { color: var(--light-gray); }

        #booking-panel { max-width: 640px; margin: 40px auto 0; scroll-margin-top: 100px; }
        .booking-step { background: var(--white); border: 1px solid var(--light-gray); padding: 40px 48px; }
        .booking-step-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .booking-back-btn { background: none; border: none; cursor: pointer; font-family: var(--font-ui); font-size: 18px; color: var(--mid-gray); padding: 0; line-height: 1; transition: color 0.2s; flex-shrink: 0; }
        .booking-back-btn:hover { color: var(--crimson); }
        .booking-step-title { font-family: var(--font-display); font-size: 24px; font-weight: 400; color: var(--dark); }
        .booking-divider { border: none; border-top: 1px solid var(--light-gray); margin-bottom: 24px; }
        .booking-summary-row { display: grid; grid-template-columns: 110px 1fr; gap: 10px 16px; margin-bottom: 28px; }
        .summary-label { font-family: var(--font-ui); font-size: 11px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.14em; line-height: 1.8; }
        .summary-value { font-family: var(--font-body); font-size: 16px; color: var(--dark); line-height: 1.8; }
        .booking-actions { display: flex; justify-content: flex-end; }
        .name-field-group { margin-bottom: 24px; }
        .name-field-label { font-family: var(--font-ui); font-size: 11px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.14em; display: block; margin-bottom: 8px; }
        .name-field-input { border: none; border-bottom: 1px solid var(--light-gray); padding: 10px 0; width: 100%; font-family: var(--font-body); font-size: 16px; color: var(--dark); background: transparent; outline: none; transition: border-bottom-color 0.2s ease; }
        .name-field-input:focus { border-bottom-color: var(--crimson); }
        .booking-error { font-family: var(--font-ui); font-size: 12px; color: var(--crimson); margin-top: 12px; }
        .booking-success { text-align: center; padding: 16px 0; }
        .success-check { font-size: 48px; color: var(--crimson); line-height: 1; margin-bottom: 16px; }
        .success-title { font-family: var(--font-display); font-size: 28px; font-weight: 400; color: var(--dark); margin-bottom: 20px; }
        .success-detail { font-family: var(--font-body); font-size: 15px; color: var(--mid-gray); line-height: 1.8; margin-bottom: 6px; }
        .success-actions { display: flex; gap: 12px; justify-content: center; margin-top: 28px; flex-wrap: wrap; }

        #mobile-cluster-cards { display: none; flex-direction: column; gap: 12px; margin-top: 20px; }
        .cluster-card { border: 1px solid var(--light-gray); padding: 20px 24px; background: var(--white); cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .cluster-card:hover { border-color: var(--crimson); box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .cluster-card-name { font-family: var(--font-display); font-size: 20px; color: var(--dark); display: block; margin-bottom: 4px; }
        .cluster-card-sub { font-family: var(--font-ui); font-size: 11px; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.1em; }
        .cluster-card-count { font-family: var(--font-ui); font-size: 11px; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.1em; }
        .cluster-card-arrow { font-family: var(--font-ui); font-size: 16px; color: var(--crimson); }

        @media (max-width: 768px) {
          .booking-inner { padding: 0 20px; }
          .filter-row { gap: 8px; }
          .map-layout { flex-direction: column; align-items: center; gap: 16px; }
          .legend-panel { display: none; }
          #court-info-panel { display: none; }
          #instructions-panel { display: none; }
          .map-wrap { width: 100%; }
          #court-map-img { width: 100%; pointer-events: none; }
          #court-svg-overlay { pointer-events: none; }
          #mobile-cluster-cards { display: flex; }
          .booking-step { padding: 24px; }
          #slim-hero h1 { font-size: 36px; }
          #slim-hero { height: 240px; }
        }
      `}</style>

      <Navbar />

      {/* ─── Slim Hero ───────────────────────────────────────────── */}
      <section id="slim-hero">
        <Image fill priority src="/NYAC.Website.Photos/Side.View.Courts.png" alt="" style={{ objectFit: 'cover', zIndex: -1 }} />
        <h1>Book a Court</h1>
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

      {/* ─── Verification Gate ───────────────────────────────────── */}
      {!verified && (
        <section id="verification-gate">
          <div id="verify-card">
            <span className="gate-member-access-label">Member Access</span>
            <h2 className="gate-heading">Welcome to Travers Island Tennis</h2>
            <p className="gate-subtext">Enter your audit number and last name to book a court and view your booking history.</p>
            <div className="gate-field-group">
              <label className="gate-field-label" htmlFor="gate-audit">Audit #</label>
              <input type="text" id="gate-audit" className="gate-field-input" inputMode="numeric" autoComplete="off"
                value={auditInput} onChange={e => setAuditInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && doVerify()} />
            </div>
            <div className="gate-field-group">
              <label className="gate-field-label" htmlFor="gate-last-name">Last Name</label>
              <input type="text" id="gate-last-name" className="gate-field-input" autoComplete="family-name"
                value={lastNameInput} onChange={e => setLastNameInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && doVerify()} />
            </div>
            {verifyError && <p id="gate-error">{verifyError}</p>}
            <button className="btn-crimson" style={{ width: '100%' }} onClick={doVerify} disabled={verifyLoading}>
              {verifyLoading ? 'Verifying…' : 'Continue'}
            </button>
          </div>
        </section>
      )}

      {/* ─── My Bookings ─────────────────────────────────────────── */}
      {verified && (
        <section id="my-bookings">
          <div className="booking-inner">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--dark)', marginBottom: 4 }}>My Court Bookings</h2>
            <hr style={{ border: 'none', borderTop: '1px solid var(--crimson)', width: 48, margin: '10px 0 0' }} />
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--light-gray)', margin: '24px 0 0' }}>
              <button className={`pl-lessons-tab${lessonsTab === 'upcoming' ? ' pl-tab-active' : ''}`} onClick={() => setLessonsTab('upcoming')}>Upcoming</button>
              <button className={`pl-lessons-tab${lessonsTab === 'past' ? ' pl-tab-active' : ''}`} onClick={() => setLessonsTab('past')}>Past</button>
            </div>
            <div style={{ paddingBottom: 48 }}>
              {lessonsTab === 'upcoming' && (
                upcomingLessons.length === 0
                  ? <p className="pl-lessons-empty">No upcoming bookings.</p>
                  : upcomingLessons.map(l => (
                    <div key={l.id} className="pl-lesson-row">
                      <span className="pl-lesson-row-date">{new Date(l.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className="pl-lesson-row-coach">{l.court?.name ?? '—'}</span>
                      <span className="pl-lesson-row-time">{new Date(l.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {l.duration_minutes} min</span>
                      <span className="pl-lesson-row-status pl-lesson-status-upcoming">Confirmed</span>
                      <button
                        className="pl-cancel-btn"
                        disabled={cancellingId === l.id}
                        onClick={() => cancelBooking(l.id)}
                        style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--crimson)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      >
                        {cancellingId === l.id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    </div>
                  ))
              )}
              {lessonsTab === 'past' && (
                pastLessons.length === 0
                  ? <p className="pl-lessons-empty">No past bookings found.</p>
                  : pastLessons.map(l => (
                    <div key={l.id} className="pl-lesson-row">
                      <span className="pl-lesson-row-date">{new Date(l.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className="pl-lesson-row-coach">{l.court?.name ?? '—'}</span>
                      <span className="pl-lesson-row-time">{new Date(l.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {l.duration_minutes} min</span>
                      <span className="pl-lesson-row-status pl-lesson-status-past">{l.status === 'cancelled' ? 'Cancelled' : 'Completed'}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── Booking Widget ──────────────────────────────────────── */}
      {verified && (<section id="booking-widget">
        <div className="booking-inner">

          {/* Filter Bar */}
          <div id="filter-bar">
            <div className="filter-row">

              {/* Date */}
              <div className="filter-group">
                <span className="filter-label">Date</span>
                <div className="selector-wrap" id="date-selector-wrap">
                  <button className={`filter-pill${selectedDate ? ' active' : ''}`} onClick={() => { setDateOpen(o => !o); setTimeOpen(false); setDurationOpen(false); }}>
                    <span>{selectedDate ? formatDateLong(selectedDate).split(',')[0] + ',' + formatDateLong(selectedDate).split(',').slice(1).join(',') : 'Select'}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: dateOpen ? 'rotate(180deg)' : 'none' }}><polyline points="2 4 6 8 10 4"/></svg>
                  </button>
                  {dateOpen && (
                    <div className="expanded-tray">
                      {DATE_STRINGS.map((d, i) => {
                        const { day, num } = formatDateShort(d, i);
                        return (
                          <button key={d} className={`tray-pill${selectedDate === d ? ' selected' : ''}`} onClick={() => { setSelectedDate(d); setDateOpen(false); }}>
                            <span className="tray-pill-day">{day}</span>
                            <span className="tray-pill-num">{num}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Start Time */}
              <div className="filter-group">
                <span className="filter-label">Start Time</span>
                <div className="selector-wrap" id="time-selector-wrap">
                  <button className={`filter-pill${selectedTime ? ' active' : ''}`} onClick={() => { setTimeOpen(o => !o); setDateOpen(false); setDurationOpen(false); }}>
                    <span>{selectedTime ? formatTime12(selectedTime) : 'Select'}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: timeOpen ? 'rotate(180deg)' : 'none' }}><polyline points="2 4 6 8 10 4"/></svg>
                  </button>
                  {timeOpen && (
                    <div className="expanded-tray">
                      {ALL_TIME_SLOTS.map(slot => (
                        <button key={slot} className={`tray-pill${selectedTime === slot ? ' selected' : ''}`} onClick={() => { setSelectedTime(slot); setTimeOpen(false); }}>
                          {formatTime12(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Duration */}
              <div className="filter-group">
                <span className="filter-label">Duration</span>
                <div className="selector-wrap" id="duration-selector-wrap">
                  <button className={`filter-pill${selectedDuration ? ' active' : ''}`} onClick={() => { setDurationOpen(o => !o); setDateOpen(false); setTimeOpen(false); }}>
                    <span>{selectedDuration ? DURATIONS.find(d => d.value === selectedDuration)?.label : 'Select'}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: durationOpen ? 'rotate(180deg)' : 'none' }}><polyline points="2 4 6 8 10 4"/></svg>
                  </button>
                  {durationOpen && (
                    <div className="expanded-tray">
                      {DURATIONS.map(d => (
                        <button key={d.value} className={`tray-pill${selectedDuration === d.value ? ' selected' : ''}`} onClick={() => { setSelectedDuration(d.value); setDurationOpen(false); }}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Clear */}
              <div className="filter-group">
                <span className="filter-label" style={{ visibility: 'hidden' }}>_</span>
                <button className="clear-filters-btn" onClick={resetWidget}>Clear</button>
              </div>

            </div>
          </div>

          {/* Map Layout */}
          <div className="map-layout">

            {/* Legend Panel */}
            <div className="legend-panel">
              <span className="legend-heading">Legend</span>
              <hr className="legend-divider" />
              <div className="legend-item">
                <svg className="legend-swatch" viewBox="0 0 12 12"><rect width="12" height="12" fill="rgba(34,139,34,0.28)" stroke="#228B22" strokeWidth="1.5"/></svg>
                <span className="legend-item-text">Available</span>
              </div>
              <div className="legend-item">
                <svg className="legend-swatch" viewBox="0 0 12 12"><rect width="12" height="12" fill="rgba(200,16,46,0.3)" stroke="#C8102E" strokeWidth="1.5"/></svg>
                <span className="legend-item-text">Unavailable</span>
              </div>
              <div className="legend-item">
                <svg className="legend-swatch" viewBox="0 0 12 12"><rect width="12" height="12" fill="rgba(255,140,0,0.35)" stroke="#FF8C00" strokeWidth="1.5"/></svg>
                <span className="legend-item-text">Selected</span>
              </div>
              {!filtersActive && (
                <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '13px', color: 'var(--mid-gray)', lineHeight: 1.6, marginTop: '12px' }}>
                  Set all filters above to view court availability.
                </p>
              )}
            </div>

            {/* Map */}
            <div className="map-wrap" id="map-wrap" style={{ width: '650px', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img id="court-map-img" src="/NYAC.Website.Photos/Arial-courts-final.jpeg" alt="NYAC Travers Island aerial court map" style={{ display: 'block', width: '650px', height: 'auto' }} />
              <svg id="court-svg-overlay" viewBox="0 0 1321 1172" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                {COURT_MAP.map(c => {
                  const state = getCourtState(c.key);
                  return (
                    <polygon
                      key={c.key}
                      id={`court-${c.key}`}
                      points={c.points}
                      style={polyStyle(state)}
                      onClick={() => handleCourtClick(c.key)}
                    />
                  );
                })}
                {COURT_MAP.map(c => (
                  <text key={`lbl-${c.key}`} className="court-label" x={c.x} y={c.y}>{c.num}</text>
                ))}
              </svg>
            </div>

            {/* Right Column */}
            <div className="right-col">
              <div id="instructions-panel">
                <span className="legend-heading">How to Book</span>
                <hr className="legend-divider" />
                <ol style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--dark)' }}>Set your date, start time, and duration using the filters above.</li>
                  <li style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--dark)' }}>Click an available court on the map to select it.</li>
                  <li style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--dark)' }}>Review your booking summary, then confirm.</li>
                </ol>
              </div>
              <div id="court-info-panel">
                <span className="legend-heading">Booking Summary</span>
                <hr className="legend-divider" />
                <div className="summary-live-table">
                  <span className="summary-live-label">Date</span>
                  <span className={`summary-live-value${!selectedDate ? ' empty' : ''}`}>{selectedDate ? formatDateLong(selectedDate) : '—'}</span>
                  <span className="summary-live-label">Start Time</span>
                  <span className={`summary-live-value${!selectedTime ? ' empty' : ''}`}>{selectedTime ? formatTime12(selectedTime) : '—'}</span>
                  <span className="summary-live-label">Duration</span>
                  <span className={`summary-live-value${!selectedDuration ? ' empty' : ''}`}>{durLabel}</span>
                  <span className="summary-live-label">Court</span>
                  <span className={`summary-live-value${!selectedCourtKey ? ' empty' : ''}`}>{courtLabel}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Mobile Cluster Cards */}
          <div id="mobile-cluster-cards">
            {CLUSTER_INFO.map(cl => (
              <div key={cl.key} className="cluster-card">
                <div>
                  <span className="cluster-card-name">{cl.label}</span>
                  <span className="cluster-card-sub">{cl.sub}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="cluster-card-count">{cl.count} courts</span>
                  <span className="cluster-card-arrow">→</span>
                </div>
              </div>
            ))}
          </div>

          {/* Booking Panel */}
          {bookingStep > 0 && (
            <div id="booking-panel" ref={bookingPanelRef}>

              {/* Step 1: Summary */}
              {bookingStep === 1 && (
                <div className="booking-step">
                  <div className="booking-step-header">
                    <button className="booking-back-btn" onClick={() => setBookingStep(0)} aria-label="Back">←</button>
                    <h2 className="booking-step-title">Booking Summary</h2>
                  </div>
                  <hr className="booking-divider" />
                  <div className="booking-summary-row">
                    <span className="summary-label">Court</span><span className="summary-value">{courtLabel}</span>
                    <span className="summary-label">Date</span><span className="summary-value">{dateLabel}</span>
                    <span className="summary-label">Time</span><span className="summary-value">{timeLabel}</span>
                    <span className="summary-label">Duration</span><span className="summary-value">{durLabel}</span>
                  </div>
                  {familyMembers.length > 1 && (
                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 500, color: 'var(--mid-gray)', textTransform: 'uppercase', letterSpacing: '0.16em', display: 'block', marginBottom: 8 }}>
                        Booking For
                      </label>
                      <select
                        value={selectedMemberId ?? ''}
                        onChange={e => setSelectedMemberId(e.target.value)}
                        style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--dark)', border: '1px solid var(--light-gray)', borderRadius: 4, padding: '8px 12px', width: '100%', background: 'var(--white)' }}
                      >
                        {familyMembers.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.first_name} {m.last_name}{m.is_child ? ' (Junior)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {bookingError && <p className="booking-error">{bookingError}</p>}
                  <div className="booking-actions">
                    <button className="btn-crimson" disabled={bookingLoading} onClick={confirmBooking}>
                      {bookingLoading ? 'Confirming…' : 'Confirm Booking'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Success */}
              {bookingStep === 2 && (
                <div className="booking-step">
                  <div className="booking-success">
                    <div className="success-check">✓</div>
                    <h2 className="success-title">Booking Confirmed</h2>
                    <p className="success-detail">{courtLabel} · {dateLabel}</p>
                    <p className="success-detail">{timeLabel} · {durLabel}</p>
                    <p className="success-detail">{verifiedLabel}</p>
                    <div className="success-actions">
                      <button className="btn-crimson" onClick={() => { setSelectedCourtKey(null); setBookingStep(0); setBookingError(''); }}>Book Another Court</button>
                      <button className="btn-light" onClick={() => setBookingStep(0)}>Close</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </section>)}

      <Footer />
    </>
  );
}
