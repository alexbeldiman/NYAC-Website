# Staff Creator Dashboard — Data Reference

**Role required:** `creator`

The creator role is a super-admin. It has access to every operation the `director` role can perform, plus the ability to assign any role (including `director`) when creating or updating member profiles. In practice, this dashboard shares its data contracts with [staff-director.md](./staff-director.md) — all endpoints available to `director` are also available to `creator`. This file documents the **additive differences** only.

---

## Mock Data Imports

Same set as the director dashboard, plus no additional mock files are required. All mock files are referenced:

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

Refer to [staff-director.md](./staff-director.md) for the complete field-level breakdown of each mock file.

---

## Additive API Capabilities vs Director

### Staff creation — any role (including `director`)
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
- The `role` field is currently validated to `"coach"` or `"tennis_house"` in the route handler
- To allow `creator` to create `director` accounts, the route's validation must be updated to also permit `"director"` when `staff.role === "creator"`
- **Response fields used:** `id`, `first_name`, `last_name`, `role`, `email` (from auth, not returned directly — store at creation time if needed)

### Member profile — assign any role
```
PATCH /api/members/[id]
Body: { role: "director" | "coach" | "tennis_house" | "member" | "creator" }
```
- The director role can also call this endpoint, but only `creator` should be able to assign `director` or `creator` roles — this guard is not currently enforced server-side and should be added
- **Response fields used:** `id`, `role`, `first_name`, `last_name`

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

### Programs Billing — MITL/Academy per week
```
GET /api/programs/billing?week_start=YYYY-MM-DD
```
- `week_start` must be a Monday (covers Mon–Fri)
- Requires: `director` or `creator`
- **Response fields used per group:** `audit_number`, `family_name`, `total_mitl`, `total_academy`, `members[]`

### Session — logout
```
POST /api/auth/logout
```
- Requires: any staff session
- Clears session cookie and redirects to `/staff/login`
- No response body

### Member creation — assign any role
```
POST /api/members
Body: {
  first_name: string,
  last_name: string,
  audit_number: string,
  phone?: string,
  role?: string,
  is_child?: boolean,
  gender?: string,
  date_of_birth?: string,
  parent_id?: string
}
```
- `role` is only applied if caller is `director` or `creator`
- **Response fields used:** `id`, `first_name`, `last_name`, `audit_number`, `role`

---

## Fields with Creator-Specific Behavior

| Field | Model | Notes |
|---|---|---|
| `role` | `Member` / `profiles` | Creator can assign `director` or `creator`; director is limited to `coach` / `tennis_house` |
| `approved_by` | `CoachAvailabilityEntry` | Creator approvals are recorded the same as director approvals |
| `created_by` | `recurrences` | Creator-initiated recurring series are tagged with creator's `staff.id` |

---

## API Endpoints (full list)

All endpoints listed in [staff-director.md](./staff-director.md) are available to `creator`. No additional endpoints exist exclusively for `creator` — the distinction is at the role-guard level within shared endpoints.

---

## Local State

Identical to [staff-director.md](./staff-director.md). No additional state variables are needed. The dashboard can conditionally expose role assignment UI elements based on `session.user.role === "creator"`.

| State variable | Type | Description |
|---|---|---|
| `roleAssignmentTarget` | `Member \| null` | Member whose role is being changed |
| `roleAssignmentValue` | `string \| null` | New role being set |

All other state variables are shared with the director dashboard — see [staff-director.md](./staff-director.md#local-state).
