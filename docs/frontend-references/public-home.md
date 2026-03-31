# Public Home Page — Data Reference

## Mock Data Imports

```ts
import { CLINIC_SLOTS, type ClinicSlot } from "@/lib/mock-data/clinic-slots";
import { COACHES, type Coach } from "@/lib/mock-data/coaches";
```

### Fields Used from `CLINIC_SLOTS`
| Field | Purpose |
|---|---|
| `id` | Key for slot selection links |
| `date` | Display and group by weekend date |
| `hour` | Display session time |
| `gender_restriction` | Display session type label |
| `capacity` | Calculate availability percentage |
| `signed_up_count` | Calculate how full each slot is |
| `is_full` | Show full badge / waitlist CTA |

### Fields Used from `COACHES`
| Field | Purpose |
|---|---|
| `id` | Key for coach links |
| `first_name`, `last_name` | Display coach name |
| `role` | Confirm entry is a coach |

---

## API Endpoints (replacing mock data)

### Clinic slots for the upcoming weekend
```
GET /api/clinics/slots?date=YYYY-MM-DD
```
- Call twice: once for Saturday, once for Sunday
- **Response fields used:** `id`, `date`, `hour`, `gender_restriction`, `capacity`, `signed_up_count`, `is_full`
- No auth required

### Coach list
```
GET /api/coaches/public
```
- No auth required
- **Response fields used:** `id`, `first_name`, `last_name`

---

## Local State

| State variable | Type | Description |
|---|---|---|
| `selectedDate` | `string` (YYYY-MM-DD) | Which Saturday is selected to view |
| `sundayDate` | `string` (YYYY-MM-DD) | The Sunday of the selected weekend (derived from `selectedDate`) |
| `saturdaySlots` | `ClinicSlot[]` | Slots for the selected Saturday |
| `sundaySlots` | `ClinicSlot[]` | Slots for the Sunday of the same weekend |
| `coaches` | `Coach[]` | Coach list for the directory section |
| `slotsLoading` | `boolean` | Loading state for slot fetch |
| `slotsError` | `string \| null` | Error state for slot fetch |
