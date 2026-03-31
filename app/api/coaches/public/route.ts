import { createClient } from "@/lib/supabase/server";
import { withApiErrorHandling } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET() {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("role", ["coach", "director"])
      .order("last_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  });
}
