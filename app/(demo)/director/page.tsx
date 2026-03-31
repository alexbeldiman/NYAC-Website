"use client";

import { COACHES } from "@/lib/mock-data/coaches";
import { LESSONS } from "@/lib/mock-data/lessons";
import { MEMBERS } from "@/lib/mock-data/members";

const ROW_HEIGHT = 52; // px per 30-min slot
const START_HOUR = 8;
const END_HOUR = 18; // exclusive (so last slot is 17:30)
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2; // 20 slots

// Time label rows: 8:00, 8:30, … 17:30
const TIME_ROWS: { hour: number; minute: number }[] = [];
for (let h = START_HOUR; h < END_HOUR; h++) {
  TIME_ROWS.push({ hour: h, minute: 0 });
  TIME_ROWS.push({ hour: h, minute: 30 });
}

function formatLabel(hour: number, minute: number) {
  const suffix = hour < 12 ? "AM" : "PM";
  const h = hour > 12 ? hour - 12 : hour;
  return `${h}:${minute === 0 ? "00" : "30"} ${suffix}`;
}

function parseStartSlot(isoString: string): number {
  const match = isoString.match(/T(\d{2}):(\d{2})/);
  if (!match) return 0;
  const h = parseInt(match[1]);
  const m = parseInt(match[2]);
  return (h - START_HOUR) * 2 + m / 30;
}

// Per-coach color palette (background, border, text)
const COACH_PALETTE = [
  { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-900", header: "bg-blue-600" },
  { bg: "bg-violet-100", border: "border-violet-400", text: "text-violet-900", header: "bg-violet-600" },
  { bg: "bg-emerald-100", border: "border-emerald-400", text: "text-emerald-900", header: "bg-emerald-600" },
  { bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-900", header: "bg-amber-500" },
  { bg: "bg-teal-100", border: "border-teal-400", text: "text-teal-900", header: "bg-teal-600" },
  { bg: "bg-rose-100", border: "border-rose-400", text: "text-rose-900", header: "bg-rose-500" },
];

// Build a lookup from member_id -> display name
const MEMBER_MAP = new Map(
  MEMBERS.map((m) => [m.id, `${m.first_name} ${m.last_name}`])
);

// Today formatted
const TODAY = new Date("2026-03-30");
const TODAY_LABEL = TODAY.toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function DirectorPage() {
  const totalHeight = TOTAL_SLOTS * ROW_HEIGHT;

  return (
    <div className="px-4 py-8">
      {/* Header */}
      <div className="max-w-full mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Director Schedule</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            {TODAY_LABEL}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Total Lessons Today</p>
          <p className="text-3xl font-bold text-slate-800">{LESSONS.length}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[...COACHES].map((coach, i) => {
          const palette = COACH_PALETTE[i % COACH_PALETTE.length];
          const count = LESSONS.filter((l) => l.coach_id === coach.id).length;
          return (
            <div
              key={coach.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${palette.border} ${palette.bg}`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${palette.header}`}></div>
              <span className={`text-xs font-semibold ${palette.text}`}>
                {coach.first_name} {coach.last_name}
              </span>
              <span className={`text-xs opacity-60 ${palette.text}`}>{count} lesson{count !== 1 ? "s" : ""}</span>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: "900px" }}>
            {/* Column headers */}
            <div className="grid border-b border-slate-200 bg-slate-50" style={{ gridTemplateColumns: `80px repeat(6, 1fr)` }}>
              <div className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide border-r border-slate-200">
                Time
              </div>
              {[...COACHES].map((coach, i) => {
                const palette = COACH_PALETTE[i % COACH_PALETTE.length];
                return (
                  <div
                    key={coach.id}
                    className="px-3 py-3 text-center border-r border-slate-200 last:border-r-0"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-9 h-9 rounded-full ${palette.header} text-white flex items-center justify-center text-xs font-bold shadow-sm`}
                      >
                        {coach.first_name[0]}{coach.last_name[0]}
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {coach.first_name} {coach.last_name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Body */}
            <div
              className="grid relative"
              style={{
                gridTemplateColumns: `80px repeat(6, 1fr)`,
                height: `${totalHeight}px`,
              }}
            >
              {/* Time labels column */}
              <div className="border-r border-slate-200 relative z-10 bg-white">
                {TIME_ROWS.map(({ hour, minute }, i) => (
                  <div
                    key={`${hour}-${minute}`}
                    className="absolute left-0 right-0 flex items-start px-3"
                    style={{ top: `${i * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
                  >
                    <span
                      className={`text-xs font-mono ${
                        minute === 0 ? "text-slate-500 font-semibold" : "text-slate-300"
                      } pt-1`}
                    >
                      {formatLabel(hour, minute)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coach columns */}
              {[...COACHES].map((coach, coachIdx) => {
                const palette = COACH_PALETTE[coachIdx % COACH_PALETTE.length];
                const coachLessons = LESSONS.filter((l) => l.coach_id === coach.id);

                return (
                  <div
                    key={coach.id}
                    className="relative border-r border-slate-200 last:border-r-0"
                  >
                    {/* Horizontal grid lines */}
                    {TIME_ROWS.map(({ hour, minute }, i) => (
                      <div
                        key={`${hour}-${minute}`}
                        className={`absolute left-0 right-0 border-t ${
                          minute === 0 ? "border-slate-200" : "border-slate-100"
                        }`}
                        style={{ top: `${i * ROW_HEIGHT}px` }}
                      />
                    ))}

                    {/* Lesson blocks */}
                    {coachLessons.map((lesson) => {
                      const startSlot = parseStartSlot(lesson.start_time);
                      const durationSlots = lesson.duration_minutes / 30;
                      const top = startSlot * ROW_HEIGHT;
                      const height = durationSlots * ROW_HEIGHT;
                      const memberName = MEMBER_MAP.get(lesson.member_id) ?? "Member";

                      return (
                        <div
                          key={lesson.id}
                          className={`absolute left-1.5 right-1.5 rounded-lg border ${palette.bg} ${palette.border} ${palette.text} overflow-hidden shadow-sm`}
                          style={{ top: `${top + 2}px`, height: `${height - 4}px` }}
                        >
                          <div className="p-2 h-full flex flex-col justify-start overflow-hidden">
                            <p className="text-xs font-bold leading-tight truncate">{memberName}</p>
                            {height >= 2 * ROW_HEIGHT && (
                              <p className="text-xs opacity-60 leading-tight mt-0.5">
                                {lesson.duration_minutes} min
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
