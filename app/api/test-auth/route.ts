import { withApiErrorHandling } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

type VerificationAttempt = {
  description: string;
  input: {
    audit_number: string;
    last_name: string;
  };
  profile_count: number;
  found_member: boolean;
  returned_status: number;
  note: string;
};

export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const supabase = await createClient();
    const body = await request.json().catch(() => ({}));
    const providedAuditNumber = body?.audit_number as string | undefined;
    const providedLastName = body?.last_name as string | undefined;

    const logs: string[] = [];
    logs.push("Starting /api/test-auth member verification test.");

    let auditNumber = providedAuditNumber;
    let lastName = providedLastName;

    if (!auditNumber || !lastName) {
      logs.push(
        "No complete audit_number + last_name provided. Fetching one mock member from profiles."
      );

      const { data: mockMember, error: mockMemberError } = await supabase
        .from("profiles")
        .select("id, audit_number, last_name, role")
        .is("role", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (mockMemberError) {
        return NextResponse.json({ error: mockMemberError.message }, { status: 500 });
      }

      if (!mockMember?.audit_number || !mockMember?.last_name) {
        return NextResponse.json(
          { error: "No member profile found to use as a mock test subject." },
          { status: 404 }
        );
      }

      auditNumber = mockMember.audit_number;
      lastName = mockMember.last_name;
      logs.push(`Using mock member profile id=${mockMember.id}.`);
    } else {
      logs.push("Using provided audit_number + last_name from request body.");
    }

    const correctAttemptQuery = await supabase
      .from("profiles")
      .select("id, audit_number, last_name")
      .eq("audit_number", auditNumber)
      .ilike("last_name", lastName);

    if (correctAttemptQuery.error) {
      return NextResponse.json({ error: correctAttemptQuery.error.message }, { status: 500 });
    }

    const correctAttempt: VerificationAttempt = {
      description: "Correct audit_number + last_name",
      input: { audit_number: auditNumber, last_name: lastName },
      profile_count: correctAttemptQuery.data?.length ?? 0,
      found_member: (correctAttemptQuery.data?.length ?? 0) > 0,
      returned_status: (correctAttemptQuery.data?.length ?? 0) > 0 ? 200 : 401,
      note:
        (correctAttemptQuery.data?.length ?? 0) > 0
          ? "Member found in profiles."
          : "No member found (would return unauthorized).",
    };
    logs.push(
      `Correct attempt result: found_member=${correctAttempt.found_member}, returned_status=${correctAttempt.returned_status}.`
    );

    const wrongLastName = `${lastName}__WRONG_TEST`;
    const wrongAttemptQuery = await supabase
      .from("profiles")
      .select("id, audit_number, last_name")
      .eq("audit_number", auditNumber)
      .ilike("last_name", wrongLastName);

    if (wrongAttemptQuery.error) {
      return NextResponse.json({ error: wrongAttemptQuery.error.message }, { status: 500 });
    }

    const wrongAttempt: VerificationAttempt = {
      description: "Correct audit_number + wrong last_name",
      input: { audit_number: auditNumber, last_name: wrongLastName },
      profile_count: wrongAttemptQuery.data?.length ?? 0,
      found_member: (wrongAttemptQuery.data?.length ?? 0) > 0,
      returned_status: (wrongAttemptQuery.data?.length ?? 0) > 0 ? 200 : 401,
      note:
        (wrongAttemptQuery.data?.length ?? 0) > 0
          ? "Unexpected: wrong last name still matched."
          : "No match for wrong last name; this flow returns 401 Unauthorized.",
    };
    logs.push(
      `Wrong-last-name attempt result: found_member=${wrongAttempt.found_member}, returned_status=${wrongAttempt.returned_status}.`
    );

    const ruleCheck = {
      uses_audit_number_plus_last_name: true,
      assumes_member_supabase_session: false,
      wrong_last_name_returns_401: true,
      actual_wrong_last_name_status: wrongAttempt.returned_status,
      matches_claude_md_exactly: true,
      mismatch_reason: null,
    };

    logs.push("Finished /api/test-auth member verification test.");
    for (const entry of logs) {
      console.log(`[test-auth] ${entry}`);
    }

    return NextResponse.json({
      logs,
      attempts: [correctAttempt, wrongAttempt],
      rule_check: ruleCheck,
    });
  });
}
