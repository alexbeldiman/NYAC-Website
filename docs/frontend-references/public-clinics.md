# Public Clinic Signup Page — Data Reference

## Mock Data Imports

```ts
import { CLINIC_SLOTS, type ClinicSlot } from "@/lib/mock-data/clinic-slots";
import { CLINIC_SIGNUPS, type ClinicSignup } from "@/lib/mock-data/clinic-signups";
import { CLINIC_WAITLIST, type ClinicWaitlistEntry } from "@/lib/mock-data/clinic-waitlist";
```

### Fields Used from `CLINIC_SLOTS`
| Field | Purpose |
|---|---|
| `id` | Target for signup/waitlist POST body |
| `date` | Group slots by day |
| `hour` | Display session time |
| `gender_restriction` | Show `men_only` / `women_only` / `mixed` |
| `capacity` | Show total spots |
| `signed_up_count` | Show current count |
| `is_full` | Branch to waitlist flow instead of signup |

### Fields Used from `CLINIC_SIGNUPS`
| Field | Purpose |
|---|---|
| `id` | Confirm successful signup (returned from POST) |
| `slot_id` | Match signup to slot in confirmation message |
| `member_id` | Confirm whose signup it is |
| `guest_count` | Show how many guests are included |
| `guest_names` | List guests in confirmation |
| `signed_up_at` | Display confirmation timestamp |
| `is_cancelled` | Filter out cancelled signups |

### Fields Used from `CLINIC_WAITLIST`
| Field | Purpose |
|---|---|
| `id` | Confirm waitlist entry (returned from POST) |
| `slot_id` | Match entry to slot |
| `waitlist_position` | Show position in queue |
| `joined_at` | Display confirmation timestamp |
| `notified_at` | Indicate if member has been notified of a spot |

---

## API Endpoints (replacing mock data)

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
- Used before signup/waitlist to resolve member_id from identity inputs

### Load clinic slots for a date
```
GET /api/clinics/slots?date=YYYY-MM-DD
```
- No auth required
- **Response fields used:** `id`, `date`, `hour`, `gender_restriction`, `capacity`, `signed_up_count`, `is_full`

### Sign up for a slot
```
POST /api/clinics/signup
Body: {
  slot_id: string,
  last_name: string,
  audit_number: string,
  guest_count?: number,      // default 0
  guest_names?: string[]     // default []
}
```
- No auth required — member identity verified via `last_name` + `audit_number`
- **Response fields used:** `id`, `slot_id`, `member_id`, `guest_count`, `guest_names`, `signed_up_at`
- Returns `409` if slot is full or member already signed up
- Returns `404` if member not found

### Join waitlist for a full slot
```
POST /api/clinics/waitlist
Body: {
  slot_id: string,
  last_name: string,
  audit_number: string,
  guest_count?: number,
  guest_names?: string[]
}
```
- No auth required
- Only succeeds if slot `is_full` is true
- **Response fields used:** `id`, `slot_id`, `waitlist_position`, `joined_at`
- Returns `400` if slot is not full; `409` if already on waitlist

---

## Local State

| State variable | Type | Description |
|---|---|---|
| `selectedDate` | `string` (YYYY-MM-DD) | Currently viewed date |
| `slots` | `ClinicSlot[]` | Slots loaded for `selectedDate` |
| `selectedSlot` | `ClinicSlot \| null` | Slot the member has chosen to act on |
| `flow` | `"signup" \| "waitlist" \| null` | Which form is active |
| `lastName` | `string` | Member identity input |
| `auditNumber` | `string` | Member identity input |
| `guestCount` | `number` | Guest count field |
| `guestNames` | `string[]` | Guest names field |
| `submitting` | `boolean` | POST in flight |
| `submitResult` | `ClinicSignup \| ClinicWaitlistEntry \| null` | Success payload for confirmation |
| `submitError` | `string \| null` | Error message from API |
| `sundaySlots` | `ClinicSlot[]` | Slots for the Sunday following the selected date |
| `sundayDate` | `string` (YYYY-MM-DD) | The Sunday derived from `selectedDate` |
| `slotsLoading` | `boolean` | Loading state for slot fetch |
| `slotsError` | `string \| null` | Error from slot fetch |
