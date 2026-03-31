import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { sendDailyClinicCode } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (
    !staff ||
    (staff.role !== "director" && staff.role !== "creator")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Find this coming Saturday and Sunday
  const today = new Date();
  const dayOfWeek = today.getUTCDay(); // 0=Sun, 6=Sat
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const saturday = new Date(today);
  saturday.setUTCDate(saturday.getUTCDate() + daysUntilSaturday);
  saturday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(saturday);
  sunday.setUTCDate(sunday.getUTCDate() + 1);

  const saturdayStr = saturday.toISOString().slice(0, 10);
  const sundayStr = sunday.toISOString().slice(0, 10);

  const days = [saturdayStr, sundayStr];
  const hours = [8, 9, 10, 11];
  const genderMap: Record<number, string> = {
    8: "men_only",
    9: "women_only",
    10: "mixed",
    11: "mixed",
  };

  function generateCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  const allSlots: Record<string, unknown[]> = {};

  for (const date of days) {
    allSlots[date] = [];

    for (const hour of hours) {
      // Check if slot already exists
      const { data: existing } = await supabase
        .from("clinic_slots")
        .select("*")
        .eq("date", date)
        .eq("hour", hour)
        .maybeSingle();

      if (existing) {
        // Slot already exists — generate a new code if it doesn't have one
        if (!existing.access_code) {
          const code = generateCode();
          const { data: updated } = await serviceClient
            .from("clinic_slots")
            .update({ access_code: code })
            .eq("id", existing.id)
            .select()
            .single();

          allSlots[date].push(updated ?? existing);
        } else {
          allSlots[date].push(existing);
        }
      } else {
        // Create new slot
        const code = generateCode();
        const { data: created, error: createError } = await serviceClient
          .from("clinic_slots")
          .insert({
            date,
            hour,
            access_code: code,
            gender_restriction: genderMap[hour],
            capacity: 16,
          })
          .select()
          .single();

        if (createError) {
          console.error(
            `generate-codes: failed to create slot for ${date} hour ${hour}`,
            createError.message
          );
          continue;
        }

        allSlots[date].push(created);
      }
    }

    // Send daily clinic codes for this day
    const dayCodes = (allSlots[date] as { access_code: string }[])
      .map((s) => s.access_code)
      .filter(Boolean)
      .join(", ");

    if (dayCodes) {
      await sendDailyClinicCode(dayCodes, date, []);
    }
  }

  return NextResponse.json(allSlots, { status: 201 });
}
