import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { data: signups, error } = await supabase
    .from("clinic_signups")
    .select(
      "id, signed_up_at, profiles!clinic_signups_member_id_fkey(first_name, last_name)"
    )
    .eq("slot_id", params.id)
    .eq("is_cancelled", false)
    .order("signed_up_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const attendees = (signups ?? []).map((s) => {
    const profile = s.profiles as unknown as {
      first_name: string;
      last_name: string;
    } | null;
    const firstName = profile?.first_name ?? "";
    const lastInitial = profile?.last_name ? profile.last_name.charAt(0) + "." : "";
    return {
      id: s.id,
      display_name: `${firstName} ${lastInitial}`.trim(),
      signed_up_at: s.signed_up_at,
    };
  });

  return NextResponse.json(attendees);
}
