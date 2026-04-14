import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth";
import { notifyNewStaffAccount } from "@/lib/notifications";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const staff = await getStaffUser(supabase);
  if (
    !staff ||
    (staff.role !== "director" && staff.role !== "creator")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { first_name, last_name, email, password, role, phone } = body;

  if (!first_name || !last_name || !email || !password || !role) {
    return NextResponse.json(
      {
        error:
          "first_name, last_name, email, password, and role are required",
      },
      { status: 400 }
    );
  }

  if (role !== "coach" && role !== "tennis_house") {
    return NextResponse.json(
      { error: "role must be 'coach' or 'tennis_house'" },
      { status: 400 }
    );
  }

  const serviceClient = createServiceClient();

  // Create the auth user — metadata is picked up by the handle_new_user trigger
  // which auto-inserts the profiles row.
  const { data: authData, error: authError } =
    await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name, role, phone: phone ?? null },
    });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const userId = authData.user.id;

  // Fetch the profile row created by the trigger
  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select()
    .eq("id", userId)
    .single();

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 }
    );
  }

  await notifyNewStaffAccount(profile, email, password);

  return NextResponse.json(profile, { status: 201 });
}
