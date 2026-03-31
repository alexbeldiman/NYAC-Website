# Staff Coach Dashboard — Data Reference

**Role required:** `coach`

All endpoints require a valid staff session. Coaches are restricted to their own data by RLS and API-level filtering — they cannot read other coaches' lessons or submit availability on behalf of others.

---

## Mock Data Imports

```ts
import { LESSONS, type Lesson } from "@/lib/mock-data/lessons";
import { MEMBERS, type Member } from "@/lib/mock-data/members";
import { COACH_AVAILABILITY, type CoachAvailabilityEntry } from "@/lib/mock-data/coach-availability";
import { MITL_ATTENDANCE, type MitlAttendanceRecord } from "@/lib/mock-data/mitl-attendance";
import { CANCELLATION_REVIEWS, type CancellationReview } from "@/lib/mock-data/cancellation-reviews";
```

### Fields Used from `LESSONS`
| Field | Purpose |
|---|---|
| `id` | Reference for PATCH/DELETE |
| `member_id` | Join to member profile for display |
| `coach_id` | Filter to own lessons (`coach_id === session.user.id`) |
| `start_time`, `duration_minutes` | Display schedule |
| `status` | Show confirmed / pending_pickup / cancelled / completed |
| `is_recurring`, `recurrence_id` | Surface recurring badge and allow series management |
| `court_id` | Show assigned court |
| `booked_via` | Informational |
| `confirmed_by_member` | Track whether member has confirmed |

### Fields Used from `MEMBERS`
| Field | Purpose |
|---|---|
| `id` | Join target from lesson `member_id` |
| `first_name`, `last_name` | Display member name on lesson card |
| `audit_number` | Display on lesson card for reference |
| `is_child`, `parent_id` | Indicate if lesson is for a child |

### Fields Used from `COACH_AVAILABILITY`
| Field | Purpose |
|---|---|
| `id` | Reference own availability entries |
| `coach_id` | Confirm entry belongs to current coach |
| `unavailable_from`, `unavailable_to` | Display blocked date range |
| `reason` | Display reason |
| `status` | Show `pending` / `approved` / `rejected` |
| `approved_at` | Show when director acted |

### Fields Used from `MITL_ATTENDANCE`
| Field | Purpose |
|---|---|
| `session_id` | Join to program session |
| `child_id` | Join to child profile |
| `date` | Filter to today's session |
| `age_exception` | Show age exception flag |
| `checked_in_at` | Display check-in time |

### Fields Used from `CANCELLATION_REVIEWS`
| Field | Purpose |
|---|---|
| `id` | Reference for display |
| `lesson_id` | Link back to the lesson |
| `cancelled_by_last_name`, `cancelled_by_audit_number` | Display who cancelled |
| `cancelled_at` | Display cancellation time |
| `coach_response` | Whether coach has responded |
| `auto_resolve_at` | Deadline before auto-resolution |

---

## API Endpoints

### Own lesson schedule
```
GET /api/lessons?coach_id=<session.user.id>&date=YYYY-MM-DD
```
- Requires: any staff session (filtered server-side to coach's own lessons by `coach_id` param)
- **Response fields used:** `id`, `member_id`, `start_time`, `duration_minutes`, `status`, `is_recurring`, `recurrence_id`, `court_id`, `confirmed_by_member`, `member.first_name`, `member.last_name`, `member.audit_number`

### Update a lesson (status, court, time)
```
PATCH /api/lessons/[id]
Body: {
  court_id?: string,
  status?: string,
  duration_minutes?: number,
  start_time?: string
}
```
- Requires: any staff session
- **Response fields used:** `id`, `status`, `court_id`, `start_time`, `duration_minutes`

### Cancel a lesson (staff-initiated)
```
DELETE /api/lessons/[id]
```
- Requires: `coach`, `director`, or `creator`
- **Response fields used:** `id`, `status`

### Recurring series — list own
```
GET /api/lessons/recurring
```
- Requires: any staff session
- **Important:** Returns all active recurrences across all coaches — client must filter by `recurrence.coach_id === session.user.id` before displaying
- **Response fields used:** `id`, `coach_id`, `member.first_name`, `member.last_name`, `day_of_week`, `start_time`, `duration_minutes`, `active`

### Recurring series — create
```
POST /api/lessons/recurring
Body: {
  member_id: string,
  coach_id: string,
  day_of_week: string,
  start_time: string,
  duration_minutes: number
}
```
- Requires: `coach`, `director`, or `creator`
- **Response fields used:** `recurrence.id`, `lessons[].id`, `lessons[].start_time`

### Recurring series — deactivate
```
DELETE /api/lessons/recurring/[id]
```
- Requires: `coach`, `director`, or `creator`
- **Response fields used:** `recurrence.id`, `cancelled_count`

### Own availability — list
```
GET /api/coaches/availability
```
- Requires: `coach` session
- RLS restricts to own rows; API also filters to `coach_id = staff.id` for coach role
- **Response fields used:** `id`, `unavailable_from`, `unavailable_to`, `reason`, `status`, `approved_at`

### Own availability — submit request
```
POST /api/coaches/availability
Body: {
  unavailable_from: string,  // ISO 8601
  unavailable_to: string,
  reason?: string
}
```
- Requires: `coach`, `director`, or `creator`
- Coach ID is taken from the session, not the request body
- **Response fields used:** `id`, `unavailable_from`, `unavailable_to`, `status`

### MITL/Academy programs — sessions for a date
```
GET /api/programs/sessions?date=YYYY-MM-DD
```
- Requires: any staff session
- **Response fields used per session:** `id`, `program`, `start_time`, `attendance[].child_id`, `attendance[].child.first_name`, `attendance[].child.last_name`, `attendance[].child.date_of_birth`, `attendance[].age_exception`

### MITL/Academy programs — check in a child
```
POST /api/programs/attendance
Body: {
  session_id: string,
  child_id: string,
  date: string    // YYYY-MM-DD
}
```
- Requires: `coach`, `director`, or `creator`
- **Response fields used:** `id`, `session_id`, `child_id`, `date`, `age_exception`, `child.first_name`, `child.last_name`
- Returns `409` if child already checked in; age exception notification triggered automatically for MITL if child < 10

### Member lookup (for booking new lessons on behalf of member)
```
GET /api/members?search=<last_name>
```
- Requires: any staff session
- **Response fields used:** `id`, `first_name`, `last_name`, `audit_number`, `is_child`, `parent_id`

### Own schedule — full date range view
```
GET /api/coaches/[id]/schedule?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```
- Requires: any staff session; use `session.user.id` for `[id]`
- **Response fields used:** `lessons[].id`, `lessons[].start_time`, `lessons[].duration_minutes`, `lessons[].status`, `lessons[].member.first_name`, `lessons[].member.last_name`, `unavailability[].unavailable_from`, `unavailability[].unavailable_to`, `clinic_slots[].date`, `clinic_slots[].hour`

### Update court status
```
PATCH /api/courts/[id]
Body: { status?: "available" | "blocked" | "maintenance", blocked_reason?: string | null }
```
- Requires: `tennis_house`, `coach`, `director`, or `creator`
- **Response fields used:** `id`, `name`, `status`, `blocked_reason`

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
| `selectedDate` | `string` (YYYY-MM-DD) | Day being viewed in schedule |
| `lessons` | `Lesson[]` | Own lessons for `selectedDate` |
| `recurringList` | `RecurrenceEntry[]` | Own active recurring series |
| `availabilityRequests` | `CoachAvailabilityEntry[]` | Own availability submissions |
| `programSessions` | `ProgramSession[]` | MITL/Academy sessions for `selectedDate` |
| `checkingInChildId` | `string \| null` | Which child is being checked in |
| `memberSearch` | `string` | Input for member lookup (when booking) |
| `memberResults` | `Member[]` | Member search results |
| `newAvailabilityForm` | `{ unavailable_from: string; unavailable_to: string; reason: string }` | Controlled form for new request |
| `submitting` | `boolean` | POST in flight |
| `submitError` | `string \| null` | Error from any mutation |
| `selectedLesson` | `Lesson \| null` | Lesson currently open in detail/edit view |
| `cancellingLessonId` | `string \| null` | Which lesson's cancel confirmation is open |
| `selectedLesson` | `Lesson \| null` | Lesson currently open in detail/edit view |
| `cancellingLessonId` | `string \| null` | Which lesson's cancel confirmation is open |
| `loading` | `Record<string, boolean>` | Per-section loading states |
