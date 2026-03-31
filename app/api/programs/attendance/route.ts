import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { notifyAgeException } from "@/lib/notifications";
import { NextResponse, type NextRequest } from "next/server";

function calculateAge(dateOfBirth: string, asOf: string): number {
  const dob = new Date(`${dateOfBirth}T00:00:00Z`);
  const ref = new Date(`${asOf}T00:00:00Z`);
  let age = ref.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = ref.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getUTCDate() < dob.getUTCDate())) {
    age--;
  }
  return age;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["coach", "director", "creator"].includes(staff.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { session_id, child_id, date } = body;

  if (!session_id || !child_id || !date) {
    return NextResponse.json(
      { error: "session_id, child_id, and date are required" },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  // Verify child exists
  const { data: child, error: childError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, audit_number, date_of_birth")
    .eq("id", child_id)
    .eq("is_child", true)
    .single();

  if (childError || !child) {
    return NextResponse.json(
      { error: "Child not found" },
      { status: 404 }
    );
  }

  // Fetch session to determine program
  const { data: session, error: sessionError } = await supabase
    .from("mitl_academy_sessions")
    .select("id, program, start_time")
    .eq("id", session_id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Age exception check for MITL
  let age_exception = false;
  if (session.program === "mitl" && child.date_of_birth) {
    const age = calculateAge(child.date_of_birth, date);
    if (age < 10) {
      age_exception = true;
      await notifyAgeException(child, session);
    }
  }

  // Check for duplicate check-in
  const { data: existing } = await supabase
    .from("mitl_academy_attendance")
    .select("id")
    .eq("session_id", session_id)
    .eq("child_id", child_id)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Child is already checked in for this session on this date" },
      { status: 409 }
    );
  }

  const serviceClient = createServiceClient();

  const { data: attendance, error: insertError } = await serviceClient
    .from("mitl_academy_attendance")
    .insert({
      session_id,
      child_id,
      date,
      checked_in_by: staff.id,
      age_exception,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ...attendance, child }, { status: 201 });
}
