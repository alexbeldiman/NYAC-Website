"use client";

import { useState } from "react";
import { COACHES } from "@/lib/mock-data/coaches";
import { LESSONS } from "@/lib/mock-data/lessons";
import { MEMBERS } from "@/lib/mock-data/members";

// Use only the first 3 coaches for the member-facing booking view
const DISPLAY_COACHES = COACHES.slice(0, 3);

// 8:00 AM to 5:30 PM in 30-min increments = 20 slots
const TIME_SLOTS: { hour: number; minute: number }[] = [];
for (let h = 8; h < 18; h++) {
  TIME_SLOTS.push({ hour: h, minute: 0 });
  if (h < 18) TIME_SLOTS.push({ hour: h, minute: 30 });
}
// Remove the duplicate 18:00 entry if any
const GRID_SLOTS = TIME_SLOTS.filter(
  (s) => !(s.hour === 18 && s.minute === 0)
).slice(0, 20);

function formatTime(hour: number, minute: number) {
  const suffix = hour < 12 ? "AM" : "PM";
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h}:${minute === 0 ? "00" : "30"} ${suffix}`;
}

function parseSlotKey(coachId: string, hour: number, minute: number) {
  return `${coachId}-${hour}-${minute}`;
}

// Build a set of occupied slot keys from mock lessons
function buildOccupiedSlots() {
  const occupied = new Set<string>();
  for (const lesson of LESSONS) {
    const match = lesson.start_time.match(/T(\d{2}):(\d{2})/);
    if (!match) continue;
    const startH = parseInt(match[1]);
    const startM = parseInt(match[2]);
    const totalMins = lesson.duration_minutes;
    // Mark every 30-min block this lesson occupies
    let elapsed = 0;
    while (elapsed < totalMins) {
      const blockH = startH + Math.floor((startM + elapsed) / 60);
      const blockM = (startM + elapsed) % 60;
      occupied.add(parseSlotKey(lesson.coach_id, blockH, blockM));
      elapsed += 30;
    }
  }
  return occupied;
}

const OCCUPIED_SLOTS = buildOccupiedSlots();

// Demo member profile — always shown on lookup success
const DEMO_MEMBER = MEMBERS.find((m) => m.audit_number === "4471" && !m.is_child)!;
const DEMO_FAMILY = MEMBERS.filter(
  (m) => m.parent_id === DEMO_MEMBER.id || m.id === DEMO_MEMBER.id
);

const COACH_COLORS = [
  "bg-blue-600",
  "bg-purple-600",
  "bg-emerald-600",
];

export default function LessonsPage() {
  const [lastName, setLastName] = useState("");
  const [auditNumber, setAuditNumber] = useState("");
  const [memberFound, setMemberFound] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());

  // modal
  const [selectedSlot, setSelectedSlot] = useState<{
    coachId: string;
    coachName: string;
    hour: number;
    minute: number;
  } | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  function handleFind() {
    setMemberFound(true);
  }

  function handleSlotClick(coachId: string, coachName: string, hour: number, minute: number) {
    const key = parseSlotKey(coachId, hour, minute);
    if (OCCUPIED_SLOTS.has(key) || bookedSlots.has(key)) return;
    setSelectedSlot({ coachId, coachName, hour, minute });
    setBookingConfirmed(false);
  }

  function handleConfirmBooking() {
    if (!selectedSlot) return;
    const key = parseSlotKey(selectedSlot.coachId, selectedSlot.hour, selectedSlot.minute);
    setBookedSlots((prev) => new Set(prev).add(key));
    setBookingConfirmed(true);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Book a Lesson</h1>
        <p className="text-slate-500 mt-1">Find your account to view availability and book with a coach.</p>
      </div>

      {/* Lookup form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
        <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          Find My Account
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
          />
          <input
            type="text"
            placeholder="Audit number"
            value={auditNumber}
            onChange={(e) => setAuditNumber(e.target.value)}
            className="w-40 border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
          />
          <button
            onClick={handleFind}
            className="px-6 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition"
          >
            Find My Account
          </button>
        </div>
        {!memberFound && (
          <p className="text-xs text-slate-400 mt-3">
            Try: last name <strong>Thornton</strong>, audit number <strong>4471</strong>
          </p>
        )}
      </div>

      {/* Member profile */}
      {memberFound && (
        <>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg flex-shrink-0">
                {DEMO_MEMBER.first_name[0]}
                {DEMO_MEMBER.last_name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900">
                    {DEMO_MEMBER.first_name} {DEMO_MEMBER.last_name}
                  </h2>
                  <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                    #{DEMO_MEMBER.audit_number}
                  </span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    Full Member
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{DEMO_MEMBER.phone}</p>

                {/* Family members */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {DEMO_FAMILY.filter((m) => m.is_child).map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full"
                    >
                      <span className="text-xs text-amber-800 font-medium">
                        {child.first_name} {child.last_name}
                      </span>
                      <span className="text-xs text-amber-500">· Junior</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">
                Available Slots — Monday, March 30, 2026
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any available slot to book &middot; Gray slots are already booked
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">
                      Time
                    </th>
                    {DISPLAY_COACHES.map((coach, i) => (
                      <th key={coach.id} className="text-center px-3 py-3 text-xs font-semibold text-slate-700">
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={`w-8 h-8 rounded-full ${COACH_COLORS[i]} text-white flex items-center justify-center text-xs font-bold`}
                          >
                            {coach.first_name[0]}{coach.last_name[0]}
                          </div>
                          <span>{coach.first_name} {coach.last_name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GRID_SLOTS.map(({ hour, minute }, rowIdx) => (
                    <tr
                      key={`${hour}-${minute}`}
                      className={rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                    >
                      <td className="px-4 py-2 text-xs font-mono text-slate-400 whitespace-nowrap border-r border-slate-100">
                        {formatTime(hour, minute)}
                      </td>
                      {DISPLAY_COACHES.map((coach, coachIdx) => {
                        const key = parseSlotKey(coach.id, hour, minute);
                        const isOccupied = OCCUPIED_SLOTS.has(key);
                        const isBooked = bookedSlots.has(key);

                        return (
                          <td key={coach.id} className="px-3 py-1.5 text-center">
                            {isOccupied ? (
                              <span className="inline-block w-full max-w-[100px] py-1.5 rounded text-xs text-slate-400 bg-slate-100 border border-slate-200">
                                Booked
                              </span>
                            ) : isBooked ? (
                              <span
                                className={`inline-flex items-center justify-center gap-1 w-full max-w-[100px] py-1.5 rounded text-xs font-semibold text-white ${COACH_COLORS[coachIdx]}`}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                Booked
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  handleSlotClick(coach.id, `${coach.first_name} ${coach.last_name}`, hour, minute)
                                }
                                className="w-full max-w-[100px] py-1.5 rounded text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400 transition"
                              >
                                Open
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Booking modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            {!bookingConfirmed ? (
              <>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Confirm Booking</h2>
                <p className="text-sm text-slate-500 mb-6">Review and confirm your lesson.</p>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Coach</span>
                    <span className="font-semibold text-slate-800">{selectedSlot.coachName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Date</span>
                    <span className="font-semibold text-slate-800">Mon, March 30, 2026</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Time</span>
                    <span className="font-semibold text-slate-800">
                      {formatTime(selectedSlot.hour, selectedSlot.minute)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Member</span>
                    <span className="font-semibold text-slate-800">
                      {DEMO_MEMBER.first_name} {DEMO_MEMBER.last_name}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
                  >
                    Confirm
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Lesson Booked!</h2>
                <p className="text-sm text-slate-500 mb-6">
                  {formatTime(selectedSlot.hour, selectedSlot.minute)} with {selectedSlot.coachName}
                </p>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
