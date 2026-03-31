# Public Lesson Booking Page — Data Reference

## Mock Data Imports

```ts
import { LESSONS, type Lesson } from "@/lib/mock-data/lessons";
import { MEMBERS, type Member } from "@/lib/mock-data/members";
import { COACHES, type Coach } from "@/lib/mock-data/coaches";
import { COACH_AVAILABILITY, type CoachAvailabilityEntry } from "@/lib/mock-data/coach-availability";
```

### Fields Used from `LESSONS`
| Field | Purpose |
|---|---|
| `id` | Reference for cancel/confirm flows |
| `member_id` | Identify which family member the lesson is for |
| `coach_id` | Show which coach is assigned (or null for pickup) |
| `start_time` | Display lesson date and time |
| `duration_minutes` | Display lesson length |
| `status` | `confirmed` / `pending_pickup` / `cancelled` / `completed` — controls what actions are available |
| `is_recurring` | Indicate recurring series |
| `booked_via` | Informational display |
| `confirmation_sent_at` | Show when a confirmation was or will be sent |
| `confirmed_by_member` | Show whether member has confirmed the lesson |

### Fields Used from `MEMBERS`
| Field | Purpose |
|---|---|
| `id` | Select which family member to book for |
| `audit_number` | Identity verification for booking and cancellation |
| `first_name`, `last_name` | Display and identity verification |
| `is_child` | Distinguish account holder from children |
| `parent_id` | Group family members |

### Fields Used from `COACHES`
| Field | Purpose |
|---|---|
| `id` | `coach_id` in booking POST body |
| `first_name`, `last_name` | Display coach name in selection list |

### Fields Used from `COACH_AVAILABILITY`
| Field | Purpose |
|---|---|
| `coach_id` | Match unavailability to a coach |
| `unavailable_from`, `unavailable_to` | Block out coach on calendar |
| `status` | Only use `"approved"` entries |

---

## API Endpoints (replacing mock data)

### Verify member identity and load family
```
POST /api/verify
Body: {
  last_name: string,
  audit_number: string
}
```
- No auth required
- **Response fields used:** `adults[]: { id, first_name, last_name, audit_number, is_child }`, `children[]: { id, first_name, last_name, audit_number, parent_id, is_child }`
- This is the correct source for `familyMembers` state — family members who have never had a lesson will not appear in `GET /api/lessons/member`

### Load upcoming and past lessons for the family
```
GET /api/lessons/member?last_name=<string>&audit_number=<string>
```
- No auth required — identity via query params
- **Response fields used:**
  - `upcoming[]`: `id`, `member_id`, `coach_id`, `start_time`, `duration_minutes`, `status`, `is_recurring`, `confirmed_by_member`, `member.first_name`, `member.last_name`, `coach.first_name`, `coach.last_name`
  - `past[]`: same fields

### Load coach availability for date range (for booking calendar)
```
GET /api/lessons/availability?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```
- No auth required
- **Response fields used per coach entry:**
  - `id`, `first_name`, `last_name`, `role`
  - `lessons[]`: `id`, `coach_id`, `start_time`, `duration_minutes`, `status`
  - `unavailability[]`: `id`, `coach_id`, `unavailable_from`, `unavailable_to`, `reason`

### Book a lesson
```
POST /api/lessons
Body: {
  last_name: string,
  audit_number: string,
  member_id: string,
  start_time: string,        // ISO 8601
  duration_minutes: number,
  coach_id?: string          // omit for pending_pickup
}
```
- No auth required
- Returns `status: "confirmed"` if `coach_id` provided; `"pending_pickup"` if not
- **Response fields used:** `id`, `member_id`, `coach_id`, `start_time`, `duration_minutes`, `status`, `confirmation_sent_at`
- Returns `409` if coach has a conflicting lesson; `404` if member or coach not found

### Cancel a lesson (member self-service)
```
POST /api/lessons/[id]/cancel
Body: {
  last_name: string,
  audit_number: string
}
```
- No auth required — identity verified against lesson's member profile
- **Response fields used:** `lesson.id`, `lesson.status`, `review.id`, `review.auto_resolve_at`

### Confirm or decline a lesson (member self-service)
```
POST /api/lessons/[id]/confirm
Body: {
  last_name: string,
  audit_number: string,
  confirmed: boolean
}
```
- No auth required — identity verified against lesson's member profile
- **Response fields used:** `id`, `status`, `confirmed_by_member`

---

## Local State

| State variable | Type | Description |
|---|---|---|
| `step` | `"identify" \| "view" \| "book" \| "confirm"` | Which form step is active |
| `lastName` | `string` | Identity input |
| `auditNumber` | `string` | Identity input |
| `familyMembers` | `Member[]` | Members returned from `/api/lessons/member` |
| `upcomingLessons` | `Lesson[]` | Upcoming confirmed/pickup lessons for the family |
| `pastLessons` | `Lesson[]` | Past/cancelled/completed lessons |
| `selectedMemberId` | `string \| null` | Which family member is being booked for |
| `coachAvailability` | `{ id: string; first_name: string; last_name: string; role: string; lessons: { id: string; coach_id: string; start_time: string; duration_minutes: number; status: string }[]; unavailability: { id: string; coach_id: string; unavailable_from: string; unavailable_to: string; reason: string \| null }[] }[]` | Per-coach schedule and unavailability for the booking calendar — populated from `GET /api/lessons/availability`, not from `COACH_AVAILABILITY` mock |
| `selectedCoachId` | `string \| null` | Coach chosen in booking flow |
| `selectedStartTime` | `string \| null` | ISO start time chosen |
| `selectedDuration` | `number \| null` | Duration in minutes |
| `submitting` | `boolean` | POST in flight |
| `submitResult` | `Lesson \| null` | Newly created lesson |
| `submitError` | `string \| null` | Error from booking or cancel |
| `availabilityLoading` | `boolean` | Loading state for availability fetch |
| `familyLoading` | `boolean` | Loading state for member lookup |
| `familyError` | `string \| null` | Error from member lookup |
| `lessonToCancel` | `Lesson \| null` | Lesson the member has selected to cancel |
| `lessonToConfirm` | `Lesson \| null` | Lesson awaiting member confirmation or decline |
| `confirmingCancel` | `boolean` | Whether the cancel confirmation dialog is open |
