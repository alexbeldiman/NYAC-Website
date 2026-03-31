import { createClient } from "@/lib/supabase/server";
import { errorResponse, verifyMemberByAudit, withApiErrorHandling } from "@/lib/api";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();
    const auditNumber = request.nextUrl.searchParams.get("audit_number");
    const lastName = request.nextUrl.searchParams.get("last_name");

    if (!auditNumber || !lastName) {
      return errorResponse("audit_number and last_name are required", 400);
    }

    const { response: memberError } = await verifyMemberByAudit(
      supabase,
      auditNumber,
      lastName
    );
    if (memberError) return memberError;

    const { data: signups, error } = await supabase
      .from("clinic_signups")
      .select(
        "id, signed_up_at, profiles!clinic_signups_member_id_fkey(first_name, last_name)"
      )
      .eq("slot_id", params.id)
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
  });
}
