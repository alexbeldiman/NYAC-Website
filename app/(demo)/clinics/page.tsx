"use client";

import { useState, useEffect } from "react";
import { CLINIC_SLOTS } from "@/lib/mock-data/clinic-slots";

type Slot = (typeof CLINIC_SLOTS)[number];

function formatHour(hour: number) {
  if (hour === 12) return "12:00 PM";
  return hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
}

export default function ClinicsPage() {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [codeError, setCodeError] = useState(false);

  // slot id -> true
  const [registered, setRegistered] = useState<Set<string>>(new Set());

  // modal state
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const [guestCount, setGuestCount] = useState(0);
  const [guestNames, setGuestNames] = useState<string[]>([]);

  useEffect(() => {
    setGuestNames(Array.from({ length: guestCount }, (_, i) => guestNames[i] ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestCount]);

  function handleUnlock() {
    if (code.length === 6) {
      setUnlocked(true);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  }

  function handleSignUp(slot: Slot) {
    setActiveSlot(slot);
    setGuestCount(0);
    setGuestNames([]);
  }

  function handleConfirm() {
    if (!activeSlot) return;
    setRegistered((prev) => new Set(prev).add(activeSlot.id));
    setActiveSlot(null);
  }

  function handleGuestNameChange(idx: number, value: string) {
    setGuestNames((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }

  // live slot counts (bump if registered)
  function liveCount(slot: Slot) {
    return slot.signed_up_count + (registered.has(slot.id) ? 1 : 0);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Clinic Sign-Ups</h1>
        <p className="text-slate-500 mt-1">Saturday, April 4, 2026 &middot; All clinics held on Court 1–4</p>
      </div>

      {/* Access code */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8 shadow-sm">
        <p className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
          Member Access Code
        </p>
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <input
              type="text"
              maxLength={10}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setCodeError(false);
              }}
              placeholder="Enter 6-character code"
              className={`w-full border rounded-lg px-4 py-2.5 text-sm font-mono tracking-widest text-slate-800 focus:outline-none focus:ring-2 transition ${
                codeError
                  ? "border-red-400 focus:ring-red-200"
                  : "border-slate-300 focus:ring-emerald-200 focus:border-emerald-400"
              }`}
            />
            {codeError && (
              <p className="text-xs text-red-500 mt-1.5">Please enter a 6-character code.</p>
            )}
            {unlocked && (
              <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                ✓ Code accepted — sign-ups are now active.
              </p>
            )}
          </div>
          <button
            onClick={handleUnlock}
            disabled={unlocked}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {unlocked ? "Unlocked" : "Unlock"}
          </button>
        </div>
        {!unlocked && (
          <p className="text-xs text-slate-400 mt-3">
            Your access code was emailed to you with your membership confirmation. Try{" "}
            <span className="font-mono font-semibold">WOM-9AM</span> for the women&apos;s clinic.
          </p>
        )}
      </div>

      {/* Clinic cards */}
      <div className="space-y-4">
        {CLINIC_SLOTS.map((slot) => {
          const count = liveCount(slot);
          const pct = Math.round((count / slot.capacity) * 100);
          const isFull = count >= slot.capacity;
          const isRegistered = registered.has(slot.id);
          const isWomen = slot.gender_restriction === "women_only";

          return (
            <div
              key={slot.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-slate-900">
                      {formatHour(slot.hour)}
                    </span>
                    {isWomen && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-700 border border-pink-200">
                        Women Only
                      </span>
                    )}
                    {!isWomen && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        Open
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-3">
                    90-minute group clinic &middot; Max {slot.capacity} players
                  </p>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 90
                            ? "bg-red-400"
                            : pct >= 70
                            ? "bg-amber-400"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                      {count} / {slot.capacity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {slot.capacity - count > 0
                      ? `${slot.capacity - count} spot${slot.capacity - count !== 1 ? "s" : ""} remaining`
                      : "Fully booked"}
                  </p>
                </div>

                {/* Action button */}
                <div className="flex-shrink-0 pt-1">
                  {isRegistered ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Registered
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSignUp(slot)}
                      disabled={!unlocked || isFull}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        unlocked && !isFull
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {isFull ? "Full" : "Sign Up"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sign-up modal */}
      {activeSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Sign Up — {formatHour(activeSlot.hour)} Clinic
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Saturday, April 4, 2026
              {activeSlot.gender_restriction === "women_only" && (
                <span className="ml-2 text-pink-600 font-medium">&middot; Women Only</span>
              )}
            </p>

            {/* Guest count */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Additional Guests
                <span className="ml-1 font-normal text-slate-400">(household members)</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={4}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="flex-1 accent-emerald-600"
                />
                <span className="w-6 text-center text-lg font-bold text-slate-800">
                  {guestCount}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                0 = just you &middot; up to 4 guests
              </p>
            </div>

            {/* Guest name fields */}
            {guestCount > 0 && (
              <div className="space-y-3 mb-6">
                <p className="text-sm font-semibold text-slate-700">Guest Names</p>
                {Array.from({ length: guestCount }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`Guest ${i + 1} full name`}
                    value={guestNames[i] ?? ""}
                    onChange={(e) => handleGuestNameChange(i, e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                  />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setActiveSlot(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
              >
                Confirm Sign-Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
