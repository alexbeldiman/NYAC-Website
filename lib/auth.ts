import { SupabaseClient } from "@supabase/supabase-js";

export interface StaffProfile {
  id: string;
  audit_number: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: "creator" | "director" | "coach" | "tennis_house" | null;
  is_child: boolean;
  date_of_birth: string | null;
  gender: string | null;
  parent_id: string | null;
  created_at: string;
}

export async function getStaffUser(
  supabase: SupabaseClient
): Promise<StaffProfile | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  return profile ?? null;
}
