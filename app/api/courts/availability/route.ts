import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/courts/availability?date=YYYY-MM-DD
 *
 * Public endpoint. Returns all courts with their status and a list of
 * booked time windows for the given date, so the public booking UI can
 * show which courts are available at which times.
 *
 * Booked windows come from court_bookings that are not cancelled.
 */
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date query param is required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const [courtsResult, bookingsResult] = await Promise.all([
    supabase
      .from("courts")
      .select("id, name, is_pro_court, status, blocked_reason")
      .order("name"),
    serviceClient
      .from("court_bookings")
      .select("court_id, start_time, duration_minutes")
      .gte("start_time", `${date}T00:00:00Z`)
      .lt("start_time", `${date}T24:00:00Z`)
      .eq("status", "confirmed"),
  ]);

  if (courtsResult.error) {
    return NextResponse.json(
      { error: courtsResult.error.message },
      { status: 500 }
    );
  }

  const bookings = bookingsResult.data ?? [];

  // Group booked windows by court_id
  const bookedByCourt: Record<
    string,
    { start_time: string; duration_minutes: number }[]
  > = {};

  for (const booking of bookings) {
    if (!bookedByCourt[booking.court_id]) bookedByCourt[booking.court_id] = [];
    bookedByCourt[booking.court_id]!.push({
      start_time: booking.start_time,
      duration_minutes: booking.duration_minutes ?? 60,
    });
  }

  const courts = (courtsResult.data ?? []).map((court) => ({
    ...court,
    booked_windows: bookedByCourt[court.id] ?? [],
  }));

  return NextResponse.json(courts);
}
