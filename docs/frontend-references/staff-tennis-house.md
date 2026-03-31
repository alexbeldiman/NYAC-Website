# Staff Tennis House Dashboard — Data Reference

**Role required:** `tennis_house`

All endpoints require a valid staff session. The tennis house role has access to operational data (court schedules, member lookup, check-in, lesson court assignment) but does not have access to billing exports, code generation, or staff creation.

---

## Mock Data Imports

```ts
import { CLINIC_SLOTS, type ClinicSlot } from "@/lib/mock-data/clinic-slots";
import { CLINIC_SIGNUPS, type ClinicSignup } from "@/lib/mock-data/clinic-signups";
import { CLINIC_WAITLIST, type ClinicWaitlistEntry } from "@/lib/mock-data/clinic-waitlist";
import { LESSONS, type Lesson } from "@/lib/mock-data/lessons";
import { MEMBERS, type Member } from "@/lib/mock-data/members";
import { COURTS, type Court } from "@/lib/mock-data/courts";
import { MITL_ATTENDANCE, type MitlAttendanceRecord } from "@/lib/mock-data/mitl-attendance";
```

### Fields Used from `CLINIC_SLOTS`
| Field | Purpose |
|---|---|
| `id` | Reference for verify-code call |
| `date`, `hour` | Display session on check-in screen |
| `gender_restriction` | Display session type |
| `signed_up_count`, `is_full` | Show session status |
| `access_code` | Received via daily notification; used as input for verification |

### Fields Used from `CLINIC_SIGNUPS`
| Field | Purpose |
|---|---|
| `id` | Identify signup record |
| `slot_id` | Join to slot |
| `member_id` | Join to member profile |
| `guest_count`, `guest_names` | Display on check-in list |
| `checked_in` | Show check-in status |
| `is_cancelled` | Filter out cancelled signups |

### Fields Used from `CLINIC_WAITLIST`
| Field | Purpose |
|---|---|
| `slot_id` | Identify which slot has a waitlist |
| `last_name`, `audit_number` | Display waitlisted member for manual promotion |
| `waitlist_position` | Show queue order |
| `notified_at` | Track notification status |

### Fields Used from `LESSONS`
| Field | Purpose |
|---|---|
| `id` | Reference for court assignment PATCH |
| `coach_id` | Display assigned coach |
| `member_id` | Display member |
| `start_time`, `duration_minutes` | Display schedule |
| `status` | Filter to `confirmed` / `pending_pickup` |
| `court_id` | Show current court assignment (null = unassigned) |
| `booked_via` | Informational |

### Fields Used from `MEMBERS`
| Field | Purpose |
|---|---|
| `id` | Lookup result key |
| `first_name`, `last_name` | Display |
| `audit_number` | Identity lookup |
| `phone` | Contact for day-of issues |
| `is_child`, `parent_id` | Family grouping |

### Fields Used from `COURTS`
| Field | Purpose |
|---|---|
| `id` | Target for court assignment PATCH |
| `name` | Display in assignment picker |
| `is_pro_court` | Surface pro court label |
| `status` | Show available vs blocked/maintenance |
| `blocked_reason` | Display when blocked |

### Fields Used from `MITL_ATTENDANCE`
| Field | Purpose |
|---|---|
| `session_id` | Join to program session |
| `child_id` | Join to child profile |
| `date` | Filter to today |
| `checked_in_at` | Display check-in time |
| `age_exception` | Flag for tennis house awareness |

---

## API Endpoints

> **Not available to `tennis_house`:** `/api/clinics/billing`, `/api/clinics/generate-codes`, `/api/billing/*`, `/api/staff/create`, `/api/pickup/escalate`

### Verify member identity
```
POST /api/verify
Body: {
  last_name: string,
  audit_number: string
}
```
- No auth required
- **Response fields used:** `adults[]: { id, first_name, last_name, audit_number }`, `children[]: { id, first_name, last_name, audit_number, parent_id }`
- Used to resolve member_id for walk-in lesson booking

### Clinic slots — today/upcoming
```
GET /api/clinics/slots?date=YYYY-MM-DD
```
- No auth required
- **Response fields used:** `id`, `date`, `hour`, `gender_restriction`, `capacity`, `signed_up_count`, `is_full`

### Clinic check-in — verify access code
```
POST /api/clinics/verify-code
Body: {
  code: string,
  slot_id: string
}
```
- No auth required
- **Response fields used:** `success: boolean`

### Court schedule — day view
```
GET /api/courts/schedule?date=YYYY-MM-DD
```
- Requires: `tennis_house`, `director`, or `creator`
- **Response fields used per court:** `id`, `name`, `is_pro_court`, `status`, `blocked_reason`, `lessons[].id`, `lessons[].start_time`, `lessons[].duration_minutes`, `lessons[].court_id`, `lessons[].member.first_name`, `lessons[].member.last_name`, `lessons[].coach.first_name`, `lessons[].coach.last_name`

### Assign court to a lesson
```
PATCH /api/lessons/[id]/court
Body: { court_id: string }
```
- Requires: `tennis_house`, `director`, or `creator`
- **Response fields used:** `id`, `court_id`, `member.first_name`, `member.last_name`, `coach.first_name`, `coach.last_name`, `start_time`

### All courts — status list
```
GET /api/courts
```
- No auth required
- **Response fields used:** `id`, `name`, `is_pro_court`, `status`, `blocked_reason`

### Member lookup
```
GET /api/members?search=<last_name or audit_number>
```
- Requires: any staff session
- **Response fields used:** `id`, `first_name`, `last_name`, `audit_number`, `phone`, `is_child`, `parent_id`

### Member detail with family
```
GET /api/members/[id]
```
- Requires: any staff session
- **Response fields used:** `profile.*`, `family[]*`

### MITL/Academy programs — sessions for a date
```
GET /api/programs/sessions?date=YYYY-MM-DD
```
- Requires: any staff session
- **Response fields used per session:** `id`, `program`, `start_time`, `attendance[].child.first_name`, `attendance[].child.last_name`, `attendance[].child.date_of_birth`, `attendance[].checked_in_at`, `attendance[].age_exception`

### MITL/Academy — check in a child
```
POST /api/programs/attendance
Body: {
  session_id: string,
  child_id: string,
  date: string
}
```
- Requires: `coach`, `director`, or `creator` — **`tennis_house` is NOT in the allowed list for this route**
- `checkingInChildId` state is therefore non-functional until this route's role guard is updated to include `tennis_house`

### Update court status
```
PATCH /api/courts/[id]
Body: { status?: "available" | "blocked" | "maintenance", blocked_reason?: string | null }
```
- Requires: `tennis_house`, `coach`, `director`, or `creator`
- **Response fields used:** `id`, `name`, `status`, `blocked_reason`

### Book a lesson on behalf of a member (walk-in)
```
POST /api/lessons
Body: {
  last_name: string,
  audit_number: string,
  member_id: string,
  start_time: string,
  duration_minutes: number,
  coach_id?: string
}
```
- No auth required (identity via last_name + audit_number)
- The `booked_via` field will be set to `"member_app"` — a separate `"tennis_house"` origin requires a backend change if tracking source is important

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
| `selectedDate` | `string` (YYYY-MM-DD) | Date for court schedule and program sessions |
| `clinicSlots` | `ClinicSlot[]` | Today's clinic slots for check-in |
| `verifyCodeInput` | `string` | Code typed by member at desk |
| `selectedSlotId` | `string \| null` | Slot being checked into |
| `verifyResult` | `boolean \| null` | Result of code verification |
| `courtSchedule` | `CourtScheduleEntry[]` | Courts + lessons for `selectedDate` |
| `courts` | `Court[]` | All courts for assignment picker |
| `assigningLessonId` | `string \| null` | Which lesson's court is being assigned |
| `memberSearch` | `string` | Search input |
| `memberResults` | `Member[]` | Search results |
| `selectedMember` | `{ profile: Member; family: Member[] } \| null` | Member detail |
| `programSessions` | `ProgramSession[]` | MITL/Academy sessions for `selectedDate` |
| `selectedCourtId` | `string \| null` | Court being updated in the status form |
| `courtStatusForm` | `{ status: string; blocked_reason: string }` | Controlled form for court status update |
| `newLessonForm` | `{ last_name: string; audit_number: string; member_id: string; start_time: string; duration_minutes: number; coach_id: string }` | Controlled form for walk-in lesson booking |
| `submitting` | `boolean` | Any mutation in flight |
| `submitError` | `string \| null` | Error from last mutation |
| `loading` | `Record<string, boolean>` | Per-section loading states |
