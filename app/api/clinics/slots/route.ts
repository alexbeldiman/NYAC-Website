import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date query param is required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: slots, error } = await supabase
    .from("clinic_slots")
    .select("*, clinic_signups(id, guest_count, is_cancelled)")
    .eq("date", date)
    .order("hour");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (slots ?? []).map((slot) => {
    const signups: { id: string; guest_count: number; is_cancelled: boolean }[] =
      slot.clinic_signups ?? [];
    const signed_up_count = signups
      .filter((s) => !s.is_cancelled)
      .reduce((sum, s) => sum + 1 + s.guest_count, 0);
    const { clinic_signups: _, ...rest } = slot;
    return {
      ...rest,
      signed_up_count,
      is_full: signed_up_count >= slot.capacity,
    };
  });

  return NextResponse.json(result);
}
