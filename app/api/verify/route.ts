import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

const NOT_FOUND_MESSAGE =
  "We couldn't find your information. Please check your details or speak to someone at the tennis house.";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const body = await request.json();
  const { last_name, audit_number } = body;

  if (!last_name || !audit_number) {
    return NextResponse.json(
      { error: "last_name and audit_number are required" },
      { status: 400 }
    );
  }

  // Find matching adults
  const { data: adults, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("last_name", last_name)
    .eq("audit_number", audit_number)
    .eq("is_child", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!adults || adults.length === 0) {
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
  }

  // Fetch all children under the same audit_number
  const { data: children } = await supabase
    .from("profiles")
    .select("*")
    .eq("audit_number", audit_number)
    .eq("is_child", true)
    .order("last_name");

  return NextResponse.json({
    adults,
    children: children ?? [],
  });
}
