import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStaffUser, type StaffProfile } from "@/lib/auth";

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Internal server error";
}

export async function withApiErrorHandling<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return errorResponse(getErrorMessage(error), 500);
  }
}

export async function requireStaffUser(
  supabase: SupabaseClient,
  allowedRoles?: Array<NonNullable<StaffProfile["role"]>>
): Promise<{ staff: StaffProfile | null; response: NextResponse | null }> {
  const staff = await getStaffUser(supabase);
  if (!staff) {
    return { staff: null, response: errorResponse("Unauthorized", 401) };
  }

  if (allowedRoles && (!staff.role || !allowedRoles.includes(staff.role))) {
    return { staff, response: errorResponse("Forbidden", 403) };
  }

  return { staff, response: null };
}

export async function verifyMemberByAudit(
  supabase: SupabaseClient,
  auditNumber: string,
  lastName: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, audit_number, last_name")
    .eq("audit_number", auditNumber)
    .ilike("last_name", lastName);

  if (error) {
    return { profiles: null, response: errorResponse(error.message, 500) };
  }

  if (!data || data.length === 0) {
    return {
      profiles: null,
      response: errorResponse(
        "We couldn't find your information. Please check your details or speak to someone at the tennis house.",
        404
      ),
    };
  }

  return { profiles: data, response: null };
}
