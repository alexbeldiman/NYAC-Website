import { createClient } from "@/lib/supabase/server";
import { withApiErrorHandling } from "@/lib/api";
import { NextResponse, type NextRequest } from "next/server";

const UNAUTHORIZED_MESSAGE = "Unauthorized";

export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();
    const body = await request.json();
    const { last_name, audit_number } = body;

    if (!last_name || !audit_number) {
      return NextResponse.json(
        { error: "last_name and audit_number are required" },
        { status: 400 }
      );
    }

    const { data: adults, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, audit_number, is_child")
      .ilike("last_name", last_name)
      .eq("audit_number", audit_number)
      .eq("is_child", false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!adults || adults.length === 0) {
      return NextResponse.json({ error: UNAUTHORIZED_MESSAGE }, { status: 401 });
    }

    const { data: children, error: childError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, audit_number, parent_id, is_child")
      .eq("audit_number", audit_number)
      .eq("is_child", true)
      .order("last_name");

    if (childError) {
      return NextResponse.json({ error: childError.message }, { status: 500 });
    }

    return NextResponse.json({
      adults,
      children: children ?? [],
    });
  });
}
