import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { searchParams } = request.nextUrl;
  const last_name = searchParams.get("last_name");
  const audit_number = searchParams.get("audit_number");

  if (!last_name || !audit_number) {
    return NextResponse.json(
      { error: "last_name and audit_number are required" },
      { status: 400 }
    );
  }

  const { data: entry, error } = await supabase
    .from("clinic_waitlist")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !entry) {
    return NextResponse.json(
      { error: "Waitlist entry not found" },
      { status: 404 }
    );
  }

  // Verify identity
  if (
    entry.audit_number !== audit_number ||
    entry.last_name.toLowerCase() !== last_name.toLowerCase()
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(entry);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const body = await request.json().catch(() => ({}));
  const { last_name, audit_number } = body;

  if (!last_name || !audit_number) {
    return NextResponse.json(
      { error: "last_name and audit_number are required" },
      { status: 400 }
    );
  }

  // Fetch the entry
  const { data: entry, error: fetchError } = await supabase
    .from("clinic_waitlist")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchError || !entry) {
    return NextResponse.json(
      { error: "Waitlist entry not found" },
      { status: 404 }
    );
  }

  // Verify identity
  if (
    entry.audit_number !== audit_number ||
    entry.last_name.toLowerCase() !== last_name.toLowerCase()
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Delete the entry
  const { error: deleteError } = await serviceClient
    .from("clinic_waitlist")
    .delete()
    .eq("id", params.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Resequence remaining waitlist positions for this slot
  const { data: remaining, error: remainingError } = await serviceClient
    .from("clinic_waitlist")
    .select("id, waitlist_position")
    .eq("slot_id", entry.slot_id)
    .gt("waitlist_position", entry.waitlist_position)
    .order("waitlist_position", { ascending: true });

  if (!remainingError && remaining) {
    for (const row of remaining) {
      await serviceClient
        .from("clinic_waitlist")
        .update({ waitlist_position: row.waitlist_position - 1 })
        .eq("id", row.id);
    }
  }

  return new NextResponse(null, { status: 204 });
}
