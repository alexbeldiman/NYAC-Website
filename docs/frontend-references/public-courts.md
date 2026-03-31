# Public Court Availability Page — Data Reference

## Mock Data Imports

```ts
import { COURTS, type Court } from "@/lib/mock-data/courts";
```

### Fields Used from `COURTS`
| Field | Purpose |
|---|---|
| `id` | Key for each court row |
| `name` | Display court name (e.g. "Court 7") |
| `is_pro_court` | Distinguish pro courts from standard courts |
| `status` | `"available"` / `"blocked"` / `"maintenance"` — drive display state |
| `blocked_reason` | Display reason when `status === "blocked"` |

> `created_at` is not displayed publicly.

---

## API Endpoints (replacing mock data)

### Load all courts
```
GET /api/courts
```
- No auth required
- **Response fields used:** `id`, `name`, `is_pro_court`, `status`, `blocked_reason`

---

## Local State

| State variable | Type | Description |
|---|---|---|
| `courts` | `Court[]` | Full court list from the API |
| `loading` | `boolean` | Loading state for court fetch |
| `error` | `string \| null` | Error from court fetch |
| `filter` | `"all" \| "available" \| "pro"` | Optional client-side filter |
