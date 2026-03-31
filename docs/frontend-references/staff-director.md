# Staff Director Dashboard — Data Reference

**Role required:** `director` or `creator`

All endpoints on this page require a valid staff session (Supabase auth cookie). The server calls `getStaffUser()` and checks `role === "director" || role === "creator"` for all billing, code generation, confirmation, pickup escalation, and staff creation operations.

---

## Mock Data Imports

```ts
import { CLINIC_SLOTS, type ClinicSlot } from "@/lib/mock-data/clinic-slots";
import { CLINIC_SIGNUPS, type ClinicSignup } from "@/lib/mock-data/clinic-signups";
import { CLINIC_WAITLIST, type ClinicWaitlistEntry } from "@/lib/mock-data/clinic-waitlist";
import { LESSONS, type Lesson } from "@/lib/mock-data/lessons";
import { MEMBERS, type Member } from "@/lib/mock-data/members";
import { COACHES, type Coach } from "@/lib/mock-data/coaches";
import { COURTS, type Court } from "@/lib/mock-data/courts";
import { COACH_AVAILABILITY, type CoachAvailabilityEntry } from "@/lib/mock-data/coach-availability";
import { MITL_ATTENDANCE, type MitlAttendanceRecord } from "@/lib/mock-data/mitl-attendance";
import { CANCELLATION_REVIEWS, type CancellationReview } from "@/lib/mock-data/cancellation-reviews";
```

### Fields Used from `CLINIC_SLOTS`
| Field | Purpose |
|---|---|
| `id` | Reference slot for billing grouping |
| `date` | Filter by week for billing |
| `hour` | Display session time in billing report |
| `gender_restriction` | Label in billing report |
| `capacity` | Display fill percentage |
| `signed_up_count`, `is_full` | Overview summary |
| `access_code`, `code_generated_at` | Verify codes have been generated |

### Fields Used from `CLINIC_SIGNUPS`
| Field | Purpose |
|---|---|
| `slot_id` | Join to slot for billing |
| `member_id` | Join to member profile |
| `guest_count` | Include in billing total |
| `checked_in` | Attendance summary |
| `is_cancelled`, `cancelled_at`, `late_cancel` | Track cancellations for billing review |

### Fields Used from `CLINIC_WAITLIST`
| Field | Purpose |
|---|---|
| `slot_id` | Identify which slot has a waitlist |
| `last_name`, `audit_number` | Display waitlisted member |
| `waitlist_position` | Show queue order |
| `notified_at` | Track notification status |

### Fields Used from `LESSONS`
| Field | Purpose |
|---|---|
| `id` | Reference for PATCH/DELETE operations |
| `member_id`, `booked_by_id`, `coach_id` | Display and filter |
| `start_time`, `duration_minutes` | Billing calculation |
| `status` | Filter by `confirmed`/`completed` for billing |
| `is_recurring`, `recurrence_id` | Manage recurring series |
| `court_id` | Court assignment view |
| `booked_via` | Audit trail |
| `confirmation_sent_at`, `confirmed_by_member` | Confirmation job status |

### Fields Used from `MEMBERS`
| Field | Purpose |
|---|---|
| `id` | Member lookup and update |
| `audit_number` | Billing grouping key |
| `first_name`, `last_name` | Display |
| `phone` | Contact info |
| `is_child`, `parent_id` | Family grouping |
| `gender`, `date_of_birth` | Member profile management |

### Fields Used from `COACHES`
| Field | Purpose |
|---|---|
| `id` | Assign to lessons; filter lesson queries |
| `first_name`, `last_name` | Display in schedule and billing |
| `audit_number` | Staff record identifier |

### Fields Used from `COURTS`
| Field | Purpose |
|---|---|
| `id` | Assign to lessons |
| `name` | Display in schedule |
| `is_pro_court` | Surface pro court assignments |
| `status`, `blocked_reason` | Court status management |

### Fields Used from `COACH_AVAILABILITY`
| Field | Purpose |
|---|---|
| `id` | Approve/reject entries |
| `coach_id` | Identify which coach submitted the request |
| `unavailable_from`, `unavailable_to` | Display date range |
| `reason` | Display reason |
| `status` | Filter pending requests for action |
| `approved_by`, `approved_at` | Audit trail after decision |

### Fields Used from `MITL_ATTENDANCE`
| Field | Purpose |
|---|---|
| `session_id` | Join to program session |
| `child_id` | Join to child profile |
| `date` | Filter by week for billing |
| `age_exception` | Flag records needing review |
| `checked_in_at` | Attendance timestamp |

### Fields Used from `CANCELLATION_REVIEWS`
| Field | Purpose |
|---|---|
| `id` | Reference for audit |
| `lesson_id` | Link back to lesson |
| `cancelled_by_last_name`, `cancelled_by_audit_number` | Display who cancelled |
| `cancelled_at` | Display cancellation time |
| `coach_response` | Has coach responded? |
| `coach_responded_at` | When coach responded |
| `auto_resolved`, `auto_resolve_at` | Track auto-resolution deadline |

---

## API Endpoints

### Clinic Slots — generate weekly codes
```
POST /api/clinics/generate-codes
```
- Requires: `director` or `creator`
- **Response fields used:** `[date][]: { id, date, hour, access_code, gender_restriction, capacity }`

### Clinic Billing — per week
```
GET /api/clinics/billing?week_start=YYYY-MM-DD
```
- `week_start` must be a Saturday
- Requires: `director` or `creator`
- **Response fields used:** `audit_number`, `member_name`, `total_sessions`, `total_guests`

### Global Billing Summary — per week
```
GET /api/billing/summary?week_start=YYYY-MM-DD
```
- `week_start` must be a Monday
- Requires: `director` or `creator`
- **Response fields used per entry:** `audit_number`, `family_name`, `clinics.total_sessions`, `clinics.total_guests`, `lessons.total_lessons`, `lessons.total_minutes`, `mitl_academy.total_mitl`, `mitl_academy.total_academy`, `mitl_academy.members[]`

### Lessons Billing — per week
```
GET /api/billing/lessons?week_start=YYYY-MM-DD
```
- `week_start` must be a Monday
- Requires: `director` or `creator`
- **Response fields used per entry:** `audit_number`, `member_name`, `total_lessons`, `total_minutes`, `members[].lessons[].start_time`, `members[].lessons[].duration_minutes`, `members[].lessons[].coach_name`
- Note: `coach_name` is a pre-concatenated string returned by `groupLessonRows()` in `lib/billingHelpers.ts` — it is not a nested `{ first_name, last_name }` object

### All Lessons — schedule view
```
GET /api/lessons?coach_id=<id>&date=YYYY-MM-DD&status=<status>
```
- Any query param is optional
- Requires: any staff session
- **Response fields used:** all `Lesson` fields plus `member.first_name`, `member.last_name`, `member.audit_number`, `coach.first_name`, `coach.last_name`

### Lesson — update (court, status, time, coach)
```
PATCH /api/lessons/[id]
Body: {
  court_id?: string,
  status?: string,
  duration_minutes?: number,
  start_time?: string,
  coach_id?: string
}
```
- Requires: any staff session
- **Response fields used:** full lesson with member/coach joins

### Lesson — cancel (staff)
```
DELETE /api/lessons/[id]
```
- Requires: `coach`, `director`, or `creator`
- **Response fields used:** `id`, `status`

### Send Confirmations — batch job
```
POST /api/lessons/send-confirmations
```
- Requires: `director` or `creator`
- **Response fields used:** `confirmations_sent`

### Recurring Series — list all active
```
GET /api/lessons/recurring
```
- Requires: any staff session
- **Response fields used:** `id`, `member.first_name`, `member.last_name`, `member.audit_number`, `coach.first_name`, `coach.last_name`, `day_of_week`, `start_time`, `duration_minutes`, `active`

### Recurring Series — create
```
POST /api/lessons/recurring
Body: {
  member_id: string,
  coach_id: string,
  day_of_week: string,   // "monday", "tuesday", etc.
  start_time: string,    // "HH:MM"
  duration_minutes: number
}
```
- Requires: `coach`, `director`, or `creator`
- **Response fields used:** `recurrence.id`, `lessons[].id`, `lessons[].start_time`, `lessons[].status`

### Recurring Series — deactivate
```
DELETE /api/lessons/recurring/[id]
```
- Requires: `coach`, `director`, or `creator`
- **Response fields used:** `recurrence.id`, `cancelled_count`

### Court Schedule — day view
```
GET /api/courts/schedule?date=YYYY-MM-DD
```
- Requires: `tennis_house`, `director`, or `creator`
- **Response fields used per court:** `id`, `name`, `is_pro_court`, `status`, `blocked_reason`, `lessons[].id`, `lessons[].start_time`, `lessons[].duration_minutes`, `lessons[].member.first_name`, `lessons[].member.last_name`, `lessons[].coach.first_name`, `lessons[].coach.last_name`

### Coach Availability — list all
```
GET /api/coaches/availability
```
- Requires: any staff session (directors see all; coaches see own)
- **Response fields used:** `id`, `coach.first_name`, `coach.last_name`, `unavailable_from`, `unavailable_to`, `reason`, `status`, `approved_by`, `approved_at`

### Coach Availability — approve or reject
```
PATCH /api/coaches/availability/[id]
Body: { status: "approved" | "rejected" }
```
- Requires: `director` or `creator`
- Triggers notification to coach if status is `"approved"`
- **Response fields used:** `id`, `status`, `approved_by`, `approved_at`

### Coach schedule — date range view
```
GET /api/coaches/[id]/schedule?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```
- Requires: any staff session
- **Response fields used:** `lessons[].id`, `lessons[].start_time`, `lessons[].duration_minutes`, `lessons[].status`, `lessons[].member.first_name`, `lessons[].member.last_name`, `unavailability[].unavailable_from`, `unavailability[].unavailable_to`, `clinic_slots[].date`, `clinic_slots[].hour`

### Members — search
```
GET /api/members?search=<last_name or audit_number>
```
- Requires: any staff session
- **Response fields used:** `id`, `first_name`, `last_name`, `audit_number`, `phone`, `is_child`, `parent_id`, `gender`, `date_of_birth`, `role`

### Members — get one with family
```
GET /api/members/[id]
```
- Requires: any staff session
- **Response fields used:** `profile.*`, `family[]*`

### Members — update
```
PATCH /api/members/[id]
Body: { any subset of: first_name, last_name, audit_number, phone, role, is_child, gender, date_of_birth, parent_id }
```
- Requires: `director` or `creator`

### Staff — create new account
```
POST /api/staff/create
Body: {
  first_name: string,
  last_name: string,
  email: string,
  password: string,
  role: "coach" | "tennis_house",
  phone?: string
}
```
- Requires: `director` or `creator`
- **Response fields used:** `id`, `first_name`, `last_name`, `role`

### Pickup Escalation — manual trigger
```
POST /api/pickup/escalate
```
- Requires: `director` or `creator`
- **Response fields used:** `escalated_count`

### Programs Billing — MITL/Academy per week
```
GET /api/programs/billing?week_start=YYYY-MM-DD
```
- `week_start` must be a Monday (covers Mon–Fri)
- Requires: `director` or `creator`
- **Response fields used per group:** `audit_number`, `family_name`, `total_mitl`, `total_academy`, `members[]`

### Programs — sessions for a date
```
GET /api/programs/sessions?date=YYYY-MM-DD
```
- Requires: any staff session
- **Response fields used per session:** `id`, `program`, `start_time`, `day_of_week`, `attendance[].id`, `attendance[].child_id`, `attendance[].date`, `attendance[].age_exception`, `attendance[].child.first_name`, `attendance[].child.last_name`, `attendance[].child.audit_number`, `attendance[].child.date_of_birth`

### Session — logout
```
POST /api/auth/logout
```
- Requires: any staff session
- Clears session cookie and redirects to `/staff/login`
- No response body

---

## Local State

| State variable | Type | Description |
|---|---|---|
| `activeTab` | `string` | Which section of the dashboard is open |
| `selectedWeekStart` | `string` (YYYY-MM-DD) | Week filter for billing views |
| `selectedDate` | `string` (YYYY-MM-DD) | Day filter for schedule/programs |
| `billingSummary` | `BillingSummaryEntry[]` | Data from `/api/billing/summary` |
| `clinicBilling` | `ClinicBillingEntry[]` | Data from `/api/billing/clinics` |
| `lessonBilling` | `LessonBillingEntry[]` | Data from `/api/billing/lessons` |
| `lessons` | `Lesson[]` | All lessons for the selected day/filter |
| `recurringList` | `RecurrenceEntry[]` | Active recurring series |
| `courtSchedule` | `CourtScheduleEntry[]` | Courts + assigned lessons for `selectedDate` |
| `coachAvailability` | `CoachAvailabilityEntry[]` | All pending availability requests |
| `memberSearchQuery` | `string` | Search input for member lookup |
| `memberResults` | `Member[]` | Search results |
| `selectedMember` | `{ profile: Member; family: Member[] } \| null` | Member detail view |
| `programSessions` | `ProgramSession[]` | Sessions + attendance for `selectedDate` |
| `pendingCodesGenerated` | `boolean` | Whether codes have been generated this week |
| `confirmationsSentCount` | `number \| null` | Result of last send-confirmations call |
| `escalatedPickupsCount` | `number \| null` | Result of last pickup escalation |
| `loading` | `Record<string, boolean>` | Per-section loading states |
| `error` | `Record<string, string \| null>` | Per-section error messages |
| `newMemberForm` | `{ first_name: string; last_name: string; audit_number: string; phone: string; role: string; is_child: boolean; gender: string; date_of_birth: string; parent_id: string }` | Controlled form for creating a new member profile |
