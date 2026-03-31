# Concrete Gaps

## High

- `public-lessons.md` expects `member.audit_number` from `GET /api/lessons/member`, but `app/api/lessons/member/route.ts` only returns member `first_name` and `last_name`.
- `staff-director.md` / `staff-creator.md` expect `family_name` in `GET /api/programs/billing`, but `app/api/programs/billing/route.ts` output has no `family_name`.
- `staff-director.md` expects lesson `start_time` in `GET /api/billing/lessons`, but payload is normalized to `date` (not `start_time`) via billing helpers.

## Medium

- `staff-director.md` / `staff-creator.md` expect `approved_by` and `approved_at` after `PATCH /api/coaches/availability/[id]`; route updates status only and does not set those fields.

## Low / Doc Drift

- `staff-director.md` references both `/api/billing/clinics` and `/api/clinics/billing`; both routes exist but return different shapes, so frontend contract can diverge.

## Potential Over-Return Risks

- `app/api/verify/route.ts` uses `select("*")` on `profiles` in public flow.
- `app/api/lessons/member/route.ts` uses `select("*")` on `private_lessons` in public flow.
