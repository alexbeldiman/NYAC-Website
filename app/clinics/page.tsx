'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/* ─── Types ──────────────────────────────────────────────────── */
interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  audit_number: string;
  is_child: boolean;
  date_of_birth: string | null;
  gender: string | null;
}

interface ClinicSlot {
  id: string;
  date: string;
  hour: number;
  capacity: number;
  signed_up_count: number;
  is_full: boolean;
  access_code?: string;
  gender_restriction?: string | null;
}

interface Attendee {
  id: string;
  display_name: string;
}

interface WaitlistEntry {
  id: string;
  position: number;
  memberId: string;
  displayName: string;
}

const SLOT_CONFIG = [
  { hour: 8,  label: "Men's Clinic",   timeLabel: '8:00 AM',  badgeClass: 'badge-mens',   badgeText: "Men's"   },
  { hour: 9,  label: "Women's Clinic", timeLabel: '9:00 AM',  badgeClass: 'badge-womens', badgeText: "Women's" },
  { hour: 10, label: 'Mixed Clinic',   timeLabel: '10:00 AM', badgeClass: 'badge-mixed',  badgeText: 'Mixed'   },
  { hour: 11, label: 'Mixed Clinic',   timeLabel: '11:00 AM', badgeClass: 'badge-mixed',  badgeText: 'Mixed'   },
];

/* ─── Date Utilities ─────────────────────────────────────────── */
function etParts(date: Date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const out: Record<string, string> = {};
  fmt.formatToParts(date).forEach(p => { out[p.type] = p.value; });
  return out;
}

function isInAccessWindow() {
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview')) return true;
  const p = etParts(new Date());
  const dow = p.weekday;
  const tot = parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10);
  if (dow === 'Sat') return tot >= 5 * 60;
  if (dow === 'Sun') return tot < 15 * 60;
  return false;
}

function getWeekendDates() {
  const p = etParts(new Date());
  const dow = p.weekday;
  const yr = parseInt(p.year, 10);
  const mo = parseInt(p.month, 10) - 1;
  const dy = parseInt(p.day, 10);
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  if (dow === 'Sun') {
    return { satDate: fmt(new Date(yr, mo, dy - 1)), sunDate: fmt(new Date(yr, mo, dy)) };
  }
  const dowNum: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const daysUntilSat = (6 - (dowNum[dow] ?? 6) + 7) % 7;
  return {
    satDate: fmt(new Date(yr, mo, dy + daysUntilSat)),
    sunDate: fmt(new Date(yr, mo, dy + daysUntilSat + 1)),
  };
}

function formatDisplayDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[m - 1]} ${d}, ${y}`;
}

function ageFromDateOfBirth(dob: string | null): number | null {
  if (!dob) return null;
  const parts = dob.split('-').map(Number);
  if (parts.length < 3 || parts.some(n => isNaN(n))) return null;
  const [y, m, d] = parts;
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const md = today.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function isEligibleForClinic(fm: FamilyMember) {
  if (!fm.is_child) return true;
  const age = ageFromDateOfBirth(fm.date_of_birth);
  return age !== null && age >= 18;
}

function formatMemberDisplayName(fm: FamilyMember) {
  const li = fm.last_name ? fm.last_name.charAt(0) : '';
  return `${fm.first_name} ${li}.`.trim();
}

function getClinicRestriction(hour: number) {
  if (hour === 8) return 'men_only';
  if (hour === 9) return 'women_only';
  return 'mixed';
}

function hasGenderConflict(hour: number, profiles: FamilyMember[]) {
  const r = getClinicRestriction(hour);
  if (r === 'mixed') return false;
  return profiles.some(p => {
    const g = (p.gender || '').toLowerCase();
    if (!g) return false; // unknown gender: don't block
    if (r === 'men_only') return g !== 'male';
    if (r === 'women_only') return g !== 'female';
    return false;
  });
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function ClinicsPage() {
  // Member state
  const [verifyStep, setVerifyStep] = useState<1 | 2 | 3>(1);
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [codeVerified, setCodeVerified] = useState(false);

  // Verification inputs
  const [lastName, setLastName] = useState('');
  const [auditNumber, setAuditNumber] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [verifyError1, setVerifyError1] = useState('');
  const [verifyError2, setVerifyError2] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);

  // Dates
  const [satDate, setSatDate] = useState('');
  const [sunDate, setSunDate] = useState('');
  const [showVerifyBar, setShowVerifyBar] = useState(true);

  // Slots: keyed by "sat-8", "sun-10", etc.
  const [slots, setSlots] = useState<Record<string, ClinicSlot | null>>({});
  const [slotsLoading, setSlotsLoading] = useState(true);

  // Attendees: keyed by slotId
  const [attendeesBySlot, setAttendeesBySlot] = useState<Record<string, Attendee[]>>({});
  // Signed-up member IDs: keyed by slotId
  const [signedUpBySlot, setSignedUpBySlot] = useState<Record<string, Set<string>>>({});
  // Waitlist: keyed by slotId
  const [waitlistBySlot, setWaitlistBySlot] = useState<Record<string, WaitlistEntry[]>>({});

  // Card-level errors/warnings: keyed by card key
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [cardWarnings, setCardWarnings] = useState<Record<string, string>>({});

  // Form state
  const [activeFormKey, setActiveFormKey] = useState<string | null>(null);
  const [formType, setFormType] = useState<'signup' | 'waitlist'>('signup');
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [guestCount, setGuestCount] = useState(0);
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  /* ─── Init ──────────────────────────────────────────────────── */
  useEffect(() => {
    const dates = getWeekendDates();
    setSatDate(dates.satDate);
    setSunDate(dates.sunDate);
    setShowVerifyBar(isInAccessWindow());

    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    const observe = () => document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    observe();
    const t = setTimeout(observe, 600);
    return () => { observer.disconnect(); clearTimeout(t); };
  }, []);

  /* ─── Load Slots ────────────────────────────────────────────── */
  useEffect(() => {
    if (!satDate || !sunDate) return;
    loadSlots(satDate, sunDate);
  }, [satDate, sunDate]);

  async function loadSlots(sat: string, sun: string) {
    setSlotsLoading(true);
    const [satSlots, sunSlots] = await Promise.all([
      fetchSlotsForDay('sat', sat),
      fetchSlotsForDay('sun', sun),
    ]);
    setSlots({ ...satSlots, ...sunSlots });
    setSlotsLoading(false);
  }

  async function fetchSlotsForDay(day: 'sat' | 'sun', date: string) {
    try {
      const res = await fetch(`/api/clinics/slots?date=${date}`);
      const rows = await res.json();
      if (!res.ok) throw new Error(rows.error || 'Failed');
      const byHour: Record<number, ClinicSlot> = {};
      (Array.isArray(rows) ? rows : []).forEach((r: ClinicSlot) => { byHour[r.hour] = r; });
      const result: Record<string, ClinicSlot | null> = {};
      SLOT_CONFIG.forEach(cfg => {
        result[`${day}-${cfg.hour}`] = byHour[cfg.hour] || null;
      });
      return result;
    } catch {
      const result: Record<string, ClinicSlot | null> = {};
      SLOT_CONFIG.forEach(cfg => { result[`${day}-${cfg.hour}`] = null; });
      return result;
    }
  }

  /* ─── Load Attendees ────────────────────────────────────────── */
  const loadAllAttendees = useCallback(async (mem: FamilyMember, allSlots: Record<string, ClinicSlot | null>) => {
    const results: Record<string, Attendee[]> = {};
    const signedUp: Record<string, Set<string>> = {};
    await Promise.all(
      Object.entries(allSlots)
        .filter(([, s]) => s)
        .map(async ([key, slot]) => {
          if (!slot) return;
          try {
            const params = new URLSearchParams({ audit_number: mem.audit_number, last_name: mem.last_name });
            const res = await fetch(`/api/clinics/slots/${slot.id}/attendees?${params}`);
            if (!res.ok) return;
            const attendees: Attendee[] = await res.json();
            if (!Array.isArray(attendees)) return;
            results[slot.id] = attendees;
            signedUp[slot.id] = new Set<string>();
          } catch { /* silent */ }
        })
    );
    setAttendeesBySlot(results);
    setSignedUpBySlot(signedUp);
  }, []);

  /* ─── Verify Member ─────────────────────────────────────────── */
  async function doVerify() {
    setVerifyError1('');
    if (!lastName || !auditNumber) {
      setVerifyError1('Please enter your last name and audit number.');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_name: lastName, audit_number: auditNumber }),
      });
      const data = await res.json();
      if (!res.ok || !data.adults?.length) {
        setVerifyError1('Member not found. Check your last name and audit number.');
        return;
      }
      const a = data.adults[0];
      const mem: FamilyMember = { id: a.id, first_name: a.first_name, last_name: a.last_name, audit_number: a.audit_number, is_child: false, date_of_birth: a.date_of_birth, gender: a.gender };
      const family: FamilyMember[] = [
        ...(data.adults || []),
        ...(data.children || []),
      ];
      setMember(mem);
      setFamilyMembers(family);
      const isPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview');
      setVerifyStep(isPreview ? 3 : 2);
      if (isPreview) setCodeVerified(true);
      await loadAllAttendees(mem, slots);
    } catch {
      setVerifyError1('Something went wrong. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  /* ─── Verify Access Code ────────────────────────────────────── */
  async function doVerifyCode() {
    setVerifyError2('');
    if (!accessCode) { setVerifyError2('Please enter the access code.'); return; }
    // Use first available slot of today's day
    const todayDay = etParts(new Date()).weekday === 'Sun' ? 'sun' : 'sat';
    const todaySlot = SLOT_CONFIG.map(cfg => slots[`${todayDay}-${cfg.hour}`]).find(Boolean);
    if (!todaySlot) { setVerifyError2('No slots loaded yet. Please wait and try again.'); return; }
    setCheckingCode(true);
    try {
      const res = await fetch('/api/clinics/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode, slot_id: todaySlot.id }),
      });
      if (!res.ok) { setVerifyError2('Incorrect code. Try again.'); return; }
      setCodeVerified(true);
      setVerifyStep(3);
    } catch {
      setVerifyError2('Something went wrong. Please try again.');
    } finally {
      setCheckingCode(false);
    }
  }

  /* ─── Signup ─────────────────────────────────────────────────── */
  async function doSignup(key: string, slot: ClinicSlot) {
    const profiles = selectedMemberIds.map(id => familyMembers.find(f => f.id === id)).filter(Boolean) as FamilyMember[];
    setFormError('');
    if (!profiles.length) { setFormError('Select at least one family member.'); return; }
    if (hasGenderConflict(slot.hour, profiles)) { setFormError('This clinic does not match one or more selected members.'); return; }
    setFormSubmitting(true);
    try {
      for (let i = 0; i < profiles.length; i++) {
        const p = profiles[i];
        const res = await fetch('/api/clinics/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slot_id: slot.id,
            last_name: p.last_name,
            audit_number: p.audit_number,
            member_id: p.id,
            guest_count: i === 0 ? guestCount : 0,
            guest_names: i === 0 ? guestNames.filter(Boolean) : [],
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = data.error === 'This session is full' ? 'This session is now full.' : (data.error || 'Signup failed. Please try again.');
          setFormError(profiles.length > 1 && i > 0 ? `${msg} (${i} of ${profiles.length} completed before this error.)` : msg);
          return;
        }
      }
      closeForm();
      // Refresh slot data
      const day = key.startsWith('sat') ? 'sat' : 'sun';
      const date = day === 'sat' ? satDate : sunDate;
      const refreshed = await fetchSlotsForDay(day, date);
      setSlots(prev => ({ ...prev, ...refreshed }));
      if (member) await loadAllAttendees(member, { ...slots, ...refreshed });
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  }

  /* ─── Waitlist ───────────────────────────────────────────────── */
  async function doWaitlist(key: string, slot: ClinicSlot) {
    const profiles = selectedMemberIds.map(id => familyMembers.find(f => f.id === id)).filter(Boolean) as FamilyMember[];
    setFormError('');
    if (!profiles.length) { setFormError('Select at least one family member.'); return; }
    if (hasGenderConflict(slot.hour, profiles)) { setFormError('This clinic does not match one or more selected members.'); return; }
    setFormSubmitting(true);
    try {
      const newEntries: WaitlistEntry[] = [];
      for (let i = 0; i < profiles.length; i++) {
        const p = profiles[i];
        const res = await fetch('/api/clinics/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slot_id: slot.id, last_name: p.last_name, audit_number: p.audit_number,
            member_id: p.id, guest_count: i === 0 ? guestCount : 0, guest_names: i === 0 ? guestNames.filter(Boolean) : [],
          }),
        });
        const data = await res.json();
        if (!res.ok) { setFormError(data.error || 'Unable to join waitlist.'); return; }
        newEntries.push({ id: data.id, position: data.waitlist_position, memberId: p.id, displayName: formatMemberDisplayName(p) });
      }
      setWaitlistBySlot(prev => ({ ...prev, [slot.id]: [...(prev[slot.id] || []), ...newEntries] }));
      closeForm();
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  }

  /* ─── Cancel ─────────────────────────────────────────────────── */
  async function doCancel(key: string, slot: ClinicSlot, signupId: string) {
    if (!member) return;
    if (!window.confirm('Cancel your signup for this session?')) return;
    setCardErrors(prev => ({ ...prev, [key]: '' }));
    setCardWarnings(prev => ({ ...prev, [key]: '' }));
    try {
      const res = await fetch(`/api/clinics/signup/${signupId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_name: member.last_name, audit_number: member.audit_number }),
      });
      const data = await res.json();
      if (!res.ok) { setCardErrors(prev => ({ ...prev, [key]: data.error || 'Cancellation failed.' })); return; }
      if (data.signup?.late_cancel) {
        setCardWarnings(prev => ({ ...prev, [key]: 'This was a late cancellation and has been flagged on your account.' }));
      }
      // Refresh
      const day = key.startsWith('sat') ? 'sat' : 'sun';
      const date = day === 'sat' ? satDate : sunDate;
      const refreshed = await fetchSlotsForDay(day, date);
      setSlots(prev => ({ ...prev, ...refreshed }));
      if (member) await loadAllAttendees(member, { ...slots, ...refreshed });
    } catch {
      setCardErrors(prev => ({ ...prev, [key]: 'Something went wrong. Please try again.' }));
    }
  }

  /* ─── Form Helpers ───────────────────────────────────────────── */
  function openForm(key: string, type: 'signup' | 'waitlist') {
    const eligible = familyMembers.filter(isEligibleForClinic);
    const slot = slots[key];
    const restriction = slot ? getClinicRestriction(slot.hour) : 'mixed';
    const genderEligible = restriction === 'mixed'
      ? eligible
      : eligible.filter(fm => {
          const g = (fm.gender || '').toLowerCase();
          if (!g) return true; // unknown gender: include in pool
          return restriction === 'men_only' ? g === 'male' : g === 'female';
        });
    const pool = genderEligible.length > 0 ? genderEligible : eligible;
    const defaultIds = pool.some(f => f.id === member?.id) ? [member!.id] : (pool[0] ? [pool[0].id] : []);
    setActiveFormKey(key);
    setFormType(type);
    setFormStep(1);
    setSelectedMemberIds(defaultIds);
    setGuestCount(0);
    setGuestNames([]);
    setFormError('');
  }

  function closeForm() {
    setActiveFormKey(null);
    setFormStep(1);
    setSelectedMemberIds([]);
    setGuestCount(0);
    setGuestNames([]);
    setFormError('');
  }

  function toggleMember(id: string, checked: boolean) {
    setSelectedMemberIds(prev => {
      const set = new Set(prev);
      if (checked) set.add(id); else set.delete(id);
      return familyMembers.filter(fm => set.has(fm.id)).map(fm => fm.id);
    });
  }

  /* ─── Slot Card Render ───────────────────────────────────────── */
  function renderSlotCard(day: 'sat' | 'sun', cfg: typeof SLOT_CONFIG[number]) {
    const key = `${day}-${cfg.hour}`;
    const slot = slots[key];
    const isFormOpen = activeFormKey === key;
    const slotAttendees = slot ? (attendeesBySlot[slot.id] || []) : [];
    const slotWaitlist = slot ? (waitlistBySlot[slot.id] || []) : [];
    const cardError = cardErrors[key] || '';
    const cardWarn = cardWarnings[key] || '';

    if (slotsLoading) {
      return (
        <div key={key} className="slot-wrapper fade-up">
          <div className="slot-card">
            <div className="skeleton skel-name"></div>
            <div className="skeleton skel-time"></div>
            <div className="skeleton skel-spots"></div>
            <div className="skeleton skel-btn"></div>
          </div>
        </div>
      );
    }

    if (!slot) {
      return (
        <div key={key} className="slot-wrapper fade-up">
          <div className="slot-card">
            <div className="card-top">
              <div>
                <span className="card-name">{cfg.label}</span>
                <span className="card-time">{cfg.timeLabel}</span>
              </div>
              <span className={`card-badge ${cfg.badgeClass}`}>{cfg.badgeText}</span>
            </div>
            <div className="card-spots">
              <span className="spots-text not-scheduled">Not Scheduled</span>
            </div>
          </div>
        </div>
      );
    }

    const remaining = slot.capacity - slot.signed_up_count;
    const spotsClass = slot.is_full ? 'spots-full' : remaining <= 3 ? 'spots-low' : '';
    const spotsText = slot.is_full ? 'Session Full' : `${remaining} spot${remaining !== 1 ? 's' : ''} remaining`;

    const hasWaitlist = slotWaitlist.length > 0;
    const allEligibleSignedUp = member && familyMembers.filter(isEligibleForClinic).length > 0 &&
      familyMembers.filter(isEligibleForClinic).every(fm => {
        const dn = formatMemberDisplayName(fm);
        return slotAttendees.some(a => a.display_name === dn);
      });

    let actionButton = null;
    if (member && codeVerified && !hasWaitlist && !allEligibleSignedUp) {
      actionButton = slot.is_full
        ? <button className="btn-outline" onClick={() => openForm(key, 'waitlist')}>Join Waitlist</button>
        : <button className="btn-crimson" onClick={() => openForm(key, 'signup')}>Sign Up</button>;
    } else if (hasWaitlist) {
      actionButton = <span className="btn-muted">On Waitlist</span>;
    }

    return (
      <div key={key} className="slot-wrapper fade-up">
        <div className="slot-card" style={isFormOpen ? { borderBottom: '1px solid var(--light-gray)' } : {}}>
          <div className="card-top">
            <div>
              <span className="card-name">{cfg.label}</span>
              <span className="card-time">{cfg.timeLabel}</span>
            </div>
            <span className={`card-badge ${cfg.badgeClass}`}>{cfg.badgeText}</span>
          </div>
          <div className="card-spots">
            <span className={`spots-text ${spotsClass}`}>{spotsText}</span>
          </div>
          {cardError && <div className="card-error">{cardError}</div>}
          {cardWarn && <div className="card-warn">{cardWarn}</div>}
          {slotAttendees.length > 0 && (
            <div className="card-attendees">
              <ul className="attendee-list">
                {slotAttendees.map(a => (
                  <li key={a.id} className="attendee-item">
                    <span className="attendee-name">{a.display_name}</span>
                    <span className="cancel-link" role="button" tabIndex={0}
                      onClick={() => doCancel(key, slot, a.id)}
                      onKeyDown={e => e.key === 'Enter' && doCancel(key, slot, a.id)}>
                      Cancel
                    </span>
                  </li>
                ))}
                {slotWaitlist.map(e => (
                  <li key={e.id} className="attendee-item">
                    <span className="attendee-name">{e.displayName}</span>
                    <span className="attendee-waitlist">Waitlist — Position #{e.position}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="card-actions">{actionButton}</div>
        </div>
        {isFormOpen && renderForm(key, slot)}
      </div>
    );
  }

  /* ─── Form Render ────────────────────────────────────────────── */
  function renderForm(key: string, slot: ClinicSlot) {
    const titleBase = formType === 'signup' ? 'Sign Up' : 'Join Waitlist';
    const eligible = familyMembers.filter(isEligibleForClinic);
    const restriction = getClinicRestriction(slot.hour);
    const selectedProfiles = selectedMemberIds.map(id => familyMembers.find(f => f.id === id)).filter(Boolean) as FamilyMember[];
    const conflict = hasGenderConflict(slot.hour, selectedProfiles);

    if (formStep === 1) {
      return (
        <div className="inline-form">
          <span className="form-heading">{titleBase} — Who is attending?</span>
          <p className="family-picker-intro">Select one or more family members. Adults are always eligible; children may register only if they are 18 or older.</p>
          {restriction !== 'mixed' && (
            <p className="family-picker-intro">
              {restriction === 'men_only' ? "This session is for men only." : "This session is for women only."}
            </p>
          )}
          <ul className="family-member-list">
            {familyMembers.map(fm => {
              const elig = isEligibleForClinic(fm);
              const checked = selectedMemberIds.includes(fm.id);
              const g = (fm.gender || '').toLowerCase();
              const isBadGender = elig && checked && restriction !== 'mixed' && !!g && (
                (restriction === 'men_only' && g !== 'male') ||
                (restriction === 'women_only' && g !== 'female')
              );
              return (
                <li key={fm.id} className={`family-member-row${!elig ? ' disabled' : ''}${isBadGender ? ' gender-block' : ''}`}>
                  <input type="checkbox" id={`fm-${key}-${fm.id}`}
                    checked={checked} disabled={!elig}
                    onChange={e => toggleMember(fm.id, e.target.checked)} />
                  <label htmlFor={`fm-${key}-${fm.id}`}>
                    <span className="fm-name">{fm.first_name} {fm.last_name}</span>
                    <span className="fm-meta">
                      {fm.is_child ? (elig ? 'Family member' : 'Under 18 — not eligible') : 'Adult member'}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {conflict && <p className="family-gender-note visible">Remove or change selections that do not match this clinic.</p>}
          {formError && <div className="form-error">{formError}</div>}
          <div className="form-actions">
            <button className="btn-crimson" disabled={conflict || selectedMemberIds.length === 0}
              onClick={() => { if (!selectedMemberIds.length) { setFormError('Select at least one family member.'); return; } setFormError(''); setFormStep(2); }}>
              Continue
            </button>
            <button className="btn-cancel-form" onClick={closeForm}>Cancel</button>
          </div>
        </div>
      );
    }

    // Step 2: guests
    return (
      <div className="inline-form">
        <span className="form-heading">{titleBase} — Guests</span>
        <p className="family-picker-intro">Guests apply to the first selected family member&rsquo;s registration only.</p>
        <div className="form-row">
          <label className="form-label" htmlFor={`guests-${key}`}>Guests</label>
          <select id={`guests-${key}`} className="form-select" value={guestCount}
            onChange={e => {
              const n = parseInt(e.target.value, 10);
              setGuestCount(n);
              setGuestNames(Array(n).fill(''));
            }}>
            {[0,1,2,3,4].map(n => <option key={n} value={n}>{n} guest{n !== 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <div className="guest-inputs">
          {Array.from({ length: guestCount }, (_, i) => (
            <div key={i} className="form-row">
              <label className="form-label" htmlFor={`guest-${key}-${i}`}>Guest {i + 1}</label>
              <input id={`guest-${key}-${i}`} className="form-text-input" type="text"
                placeholder="Full name" value={guestNames[i] || ''}
                onChange={e => setGuestNames(prev => { const n = [...prev]; n[i] = e.target.value; return n; })} />
            </div>
          ))}
        </div>
        {formError && <div className="form-error">{formError}</div>}
        <div className="form-actions">
          <button className="btn-outline" onClick={() => { setFormStep(1); setFormError(''); }}>Back</button>
          <button className="btn-crimson" disabled={formSubmitting}
            onClick={() => formType === 'signup' ? doSignup(key, slot) : doWaitlist(key, slot)}>
            {formSubmitting ? 'Please wait…' : `Confirm ${titleBase}`}
          </button>
          <button className="btn-cancel-form" onClick={closeForm}>Cancel</button>
        </div>
      </div>
    );
  }

  /* ─── Render ─────────────────────────────────────────────────── */
  const memberInitial = member ? member.last_name.charAt(0).toUpperCase() : '';

  return (
    <>
      <style suppressHydrationWarning>{`
        /* ─── HERO (slim) ──────────────────────────────────────── */
        #hero-section {
          background-image: url('/NYAC.Website.Photos/Arial.View.Courts.png');
          background-size: cover; background-position: center 60%;
          position: relative; height: 320px;
          display: flex; align-items: center; justify-content: center; text-align: center;
          margin-top: var(--nav-height);
        }
        .hero-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.52); z-index: 0; }
        .hero-content { position: relative; z-index: 1; padding: 0 24px; }
        .hero-eyebrow { font-family: var(--font-ui); font-size: 12px; font-weight: 500; color: white; text-transform: uppercase; letter-spacing: 0.22em; opacity: 0.85; }
        .hero-divider { border: none; border-top: 1px solid rgba(255,255,255,0.6); width: 40px; margin: 14px auto; }
        .hero-title { font-family: var(--font-display); font-size: 48px; font-weight: 400; color: white; line-height: 1.1; }
        .hero-subtitle { font-family: var(--font-body); font-style: italic; font-size: 16px; color: rgba(255,255,255,0.8); margin-top: 10px; }

        /* ─── VERIFY BAR ───────────────────────────────────────── */
        #verify-bar {
          position: sticky; top: var(--nav-height); z-index: 30;
          background: var(--off-white); border-bottom: 1px solid var(--light-gray);
          height: var(--vbar-height);
        }
        .verify-bar-inner {
          max-width: 900px; margin: 0 auto; padding: 0 32px;
          height: 100%; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .verify-label { font-family: var(--font-ui); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: var(--mid-gray); white-space: nowrap; }
        .verify-input { height: 32px; padding: 0 12px; border: 1px solid var(--light-gray); background: var(--white); font-family: var(--font-ui); font-size: 13px; color: var(--dark); outline: none; transition: border-color 0.2s ease; }
        .verify-input:focus { border-color: var(--crimson); }
        #input-last-name { width: 140px; }
        #input-audit { width: 100px; }
        #input-code { width: 120px; }
        .verify-error { font-family: var(--font-ui); font-size: 12px; color: var(--crimson); }
        .vbar-divider { width: 1px; height: 20px; background: var(--light-gray); flex-shrink: 0; }
        .verify-greeting { font-family: var(--font-ui); font-size: 12px; font-weight: 600; color: var(--dark); letter-spacing: 0.06em; }
        .verify-status-check { color: #15803D; font-size: 16px; font-weight: 700; }
        .verify-status { font-family: var(--font-ui); font-size: 12px; font-weight: 600; color: var(--dark); letter-spacing: 0.06em; }

        /* ─── SLOT GRID ────────────────────────────────────────── */
        .main-wrap { max-width: 1100px; margin: 0 auto; padding: 64px 40px 96px; }
        .slots-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 56px; }
        .day-header { margin-bottom: 32px; }
        .day-label { font-family: var(--font-display); font-size: 28px; font-weight: 400; color: var(--crimson); margin-bottom: 6px; }
        .day-date-text { font-family: var(--font-ui); font-size: 12px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.1em; }

        /* ─── SLOT CARDS ───────────────────────────────────────── */
        .slot-wrapper { margin-bottom: 24px; }
        .slot-card { border: 1px solid var(--light-gray); padding: 24px 28px; background: var(--white); }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
        .card-name { font-family: var(--font-display); font-size: 20px; font-weight: 600; color: var(--dark); display: block; margin-bottom: 4px; }
        .card-time { font-family: var(--font-ui); font-size: 11px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.1em; }
        .card-badge { font-family: var(--font-ui); font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 10px; white-space: nowrap; flex-shrink: 0; }
        .badge-mens { background: var(--charcoal); color: var(--white); }
        .badge-womens { background: var(--crimson); color: var(--white); }
        .badge-mixed { background: var(--light-gray); color: var(--dark); }
        .card-spots { margin-bottom: 14px; }
        .spots-text { font-family: var(--font-ui); font-size: 12px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.08em; }
        .spots-text.spots-low { color: #B45309; }
        .spots-text.spots-full { color: var(--crimson); }
        .spots-text.not-scheduled { font-style: italic; font-weight: 400; text-transform: none; letter-spacing: 0; }
        .card-attendees { margin-bottom: 16px; }
        .attendee-list { list-style: none; display: flex; flex-direction: column; gap: 5px; }
        .attendee-item { font-family: var(--font-body); font-size: 14px; color: var(--dark); display: flex; align-items: center; gap: 10px; }
        .attendee-name { flex: 1; }
        .cancel-link { font-family: var(--font-ui); font-size: 11px; font-weight: 500; color: var(--mid-gray); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.08em; transition: color 0.25s ease; }
        .cancel-link:hover { color: var(--crimson); }
        .attendee-waitlist { font-family: var(--font-label); font-size: 13px; color: var(--mid-gray); font-style: italic; }
        .card-actions { display: flex; align-items: center; gap: 10px; }
        .card-error { margin-bottom: 12px; padding: 10px 14px; border-left: 3px solid var(--crimson); background: #FEF2F2; font-family: var(--font-ui); font-size: 12px; color: var(--crimson); }
        .card-warn { margin-bottom: 12px; padding: 10px 14px; border-left: 3px solid #92400E; background: #FFFBEB; font-family: var(--font-ui); font-size: 12px; color: #92400E; }

        /* ─── SKELETON ─────────────────────────────────────────── */
        .skeleton { background: linear-gradient(90deg, var(--light-gray) 25%, #F0EDE8 50%, var(--light-gray) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .skel-name { height: 20px; width: 140px; margin-bottom: 8px; }
        .skel-time { height: 12px; width: 70px; margin-bottom: 16px; }
        .skel-spots { height: 12px; width: 110px; margin-bottom: 14px; }
        .skel-btn { height: 38px; width: 100px; }

        /* ─── INLINE FORM ──────────────────────────────────────── */
        .inline-form { background: var(--off-white); border: 1px solid var(--light-gray); border-top: none; padding: 24px 28px; animation: slideDown 0.2s ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .form-heading { font-family: var(--font-label); font-size: 13px; font-weight: 600; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 18px; display: block; }
        .form-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .form-label { font-family: var(--font-ui); font-size: 12px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; min-width: 80px; }
        .form-select { height: 36px; padding: 0 10px; border: 1px solid var(--light-gray); background: var(--white); font-family: var(--font-ui); font-size: 13px; color: var(--dark); outline: none; }
        .form-select:focus { border-color: var(--crimson); }
        .form-text-input { height: 36px; padding: 0 12px; border: 1px solid var(--light-gray); background: var(--white); font-family: var(--font-ui); font-size: 13px; color: var(--dark); outline: none; flex: 1; }
        .form-text-input:focus { border-color: var(--crimson); }
        .guest-inputs { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
        .form-actions { display: flex; align-items: center; gap: 12px; margin-top: 18px; }
        .form-error { margin-top: 12px; padding: 10px 14px; border-left: 3px solid var(--crimson); background: #FEF2F2; font-family: var(--font-ui); font-size: 12px; color: var(--crimson); }
        .btn-cancel-form { font-family: var(--font-ui); font-size: 12px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; background: none; border: none; padding: 0; transition: color 0.25s ease; }
        .btn-cancel-form:hover { color: var(--dark); }

        /* ─── FAMILY PICKER ────────────────────────────────────── */
        .family-picker-intro { font-family: var(--font-body); font-size: 14px; color: var(--mid-gray); margin-bottom: 16px; line-height: 1.55; }
        .family-member-list { list-style: none; display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
        .family-member-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border: 1px solid var(--light-gray); background: var(--white); transition: border-color 0.2s ease; }
        .family-member-row label { flex: 1; cursor: pointer; display: flex; flex-direction: column; gap: 4px; font-family: var(--font-ui); font-size: 13px; color: var(--dark); }
        .fm-name { font-weight: 600; letter-spacing: 0.02em; }
        .fm-meta { font-size: 11px; font-weight: 500; color: var(--mid-gray); text-transform: uppercase; letter-spacing: 0.08em; }
        .family-member-row input[type="checkbox"] { margin-top: 3px; width: 18px; height: 18px; accent-color: var(--crimson); flex-shrink: 0; }
        .family-member-row.disabled { opacity: 0.45; pointer-events: none; background: var(--off-white); }
        .family-member-row.gender-block { border-color: var(--crimson); background: #FEF2F2; }
        .family-gender-note { font-family: var(--font-ui); font-size: 12px; color: var(--crimson); margin-top: 10px; display: none; }
        .family-gender-note.visible { display: block; }

        /* ─── INFO STRIP ───────────────────────────────────────── */
        #info-strip { background: linear-gradient(to right, var(--charcoal) 0%, var(--crimson) 50%, var(--charcoal) 100%); display: flex; }
        .info-tile { flex: 1; padding: 36px 36px; border-right: 1px solid rgba(255,255,255,0.1); }
        .info-tile:last-child { border-right: none; }
        .info-tile-label { font-family: var(--font-ui); font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.16em; display: block; margin-bottom: 10px; }
        .info-tile-value { font-family: var(--font-body); font-size: 15px; color: var(--white); line-height: 1.65; }

        /* ─── RESPONSIVE ───────────────────────────────────────── */
        @media (max-width: 900px) {
          .slots-grid { grid-template-columns: 1fr; gap: 40px; }
          #info-strip { flex-direction: column; }
          .info-tile { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.1); }
          .info-tile:last-child { border-bottom: none; }
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 36px; }
          .main-wrap { padding: 40px 20px 64px; }
          #input-last-name { width: 120px; }
          #input-audit { width: 100px; }
          .verify-bar-inner { height: auto; padding: 12px 20px; }
        }
      `}</style>

      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section id="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-eyebrow">NYAC Travers Island</p>
          <hr className="hero-divider" />
          <h1 className="hero-title">Weekend Clinics</h1>
          <p className="hero-subtitle">Saturday &amp; Sunday &middot; Travers Island</p>
        </div>
      </section>

      {/* ─── VERIFY BAR ───────────────────────────────────────────── */}
      {showVerifyBar && (
        <div id="verify-bar">
          <div className="verify-bar-inner">
            {verifyStep === 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
                <span className="verify-label">Member</span>
                <input id="input-last-name" className="verify-input" type="text" placeholder="Last name"
                  value={lastName} onChange={e => setLastName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doVerify()} />
                <input id="input-audit" className="verify-input" type="text" placeholder="Audit #"
                  inputMode="numeric" value={auditNumber} onChange={e => setAuditNumber(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doVerify()} />
                <button className="btn-crimson" disabled={verifying} onClick={doVerify}>
                  {verifying ? 'Verifying…' : 'Verify'}
                </button>
                {verifyError1 && <span className="verify-error">{verifyError1}</span>}
              </div>
            )}
            {verifyStep === 2 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
                <span className="verify-greeting">Verified: {member?.first_name} {memberInitial}.</span>
                <div className="vbar-divider"></div>
                <span className="verify-label">Access Code</span>
                <input id="input-code" className="verify-input" type="text" placeholder="Enter code"
                  value={accessCode} onChange={e => setAccessCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doVerifyCode()} />
                <button className="btn-crimson" disabled={checkingCode} onClick={doVerifyCode}>
                  {checkingCode ? 'Checking…' : 'Submit Code'}
                </button>
                {verifyError2 && <span className="verify-error">{verifyError2}</span>}
              </div>
            )}
            {verifyStep === 3 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                <span className="verify-status-check">✓</span>
                <span className="verify-status">Verified: {member?.first_name} {memberInitial}. · Access Granted</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SLOT GRID ────────────────────────────────────────────── */}
      <main className="main-wrap">
        <div className="slots-grid">
          <div className="day-column">
            <div className="day-header fade-up">
              <span className="section-label">Weekend Clinics</span>
              <hr className="divider-crimson" />
              <div className="day-label">Saturday</div>
              <div className="day-date-text">{satDate ? formatDisplayDate(satDate) : ''}</div>
            </div>
            {SLOT_CONFIG.map(cfg => renderSlotCard('sat', cfg))}
          </div>
          <div className="day-column">
            <div className="day-header fade-up">
              <span className="section-label">Weekend Clinics</span>
              <hr className="divider-crimson" />
              <div className="day-label">Sunday</div>
              <div className="day-date-text">{sunDate ? formatDisplayDate(sunDate) : ''}</div>
            </div>
            {SLOT_CONFIG.map(cfg => renderSlotCard('sun', cfg))}
          </div>
        </div>
      </main>

      {/* ─── INFO STRIP ───────────────────────────────────────────── */}
      <div id="info-strip">
        <div className="info-tile">
          <span className="info-tile-label">Cancellation Policy</span>
          <p className="info-tile-value">Cancel before the session starts to avoid a late-cancel flag. Cancellations within 15 minutes of start time are flagged on your account.</p>
        </div>
        <div className="info-tile">
          <span className="info-tile-label">Guest Policy</span>
          <p className="info-tile-value">Members may bring up to 4 guests per session. Guest names are required at signup and count toward the 12-person capacity.</p>
        </div>
        <div className="info-tile">
          <span className="info-tile-label">Access Code</span>
          <p className="info-tile-value">A daily access code is distributed at the Travers Island gate each weekend morning. Contact the tennis house for assistance.</p>
        </div>
      </div>

      <Footer />
    </>
  );
}
