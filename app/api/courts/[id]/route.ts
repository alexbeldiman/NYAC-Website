import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

const VALID_STATUSES = ["available", "blocked", "maintenance"] as const;
type CourtStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    !["tennis_house", "coach", "director", "creator"].includes(staff.role ?? "")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { status, blocked_reason } = body as {
    status: CourtStatus;
    blocked_reason?: string;
  };

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "status must be one of: available, blocked, maintenance" },
      { status: 400 }
    );
  }

  const { id } = params;
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from("courts")
    .update({
      status,
      blocked_reason: status === "blocked" ? (blocked_reason ?? null) : null,
    })
    .eq("id", id)
    .select("id, name, is_pro_court, status, blocked_reason")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
