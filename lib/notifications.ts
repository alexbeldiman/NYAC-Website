function logDraftEmail(input: {
  template: string;
  to: string;
  subject: string;
  bodyLines: string[];
}) {
  const body = input.bodyLines.join("\n");
  console.log(
    [
      "[Draft Email]",
      `Template: ${input.template}`,
      `To: ${input.to}`,
      `Subject: ${input.subject}`,
      "Body:",
      body,
    ].join("\n")
  );
}

export async function notifyPrivateLessonCreated(input: {
  lesson: { id: string; start_time: string; duration_minutes: number; status: string };
  member: { first_name: string; last_name: string };
  booked_via: string;
}): Promise<void> {
  logDraftEmail({
    template: "private_lesson_created",
    to: `${input.member.first_name} ${input.member.last_name} (member)`,
    subject: `Lesson created for ${input.lesson.start_time}`,
    bodyLines: [
      `Hello ${input.member.first_name},`,
      "Your private lesson has been created.",
      `Lesson ID: ${input.lesson.id}`,
      `Start: ${input.lesson.start_time}`,
      `Duration: ${input.lesson.duration_minutes} minutes`,
      `Status: ${input.lesson.status}`,
      `Booked via: ${input.booked_via}`,
    ],
  });
}

export async function notifyClinicSignupCreated(input: {
  signup: { id: string; slot_id: string; guest_count: number };
  member: { first_name: string; last_name: string; audit_number: string };
}): Promise<void> {
  logDraftEmail({
    template: "clinic_signup_created",
    to: `${input.member.first_name} ${input.member.last_name} (member)`,
    subject: `Clinic signup confirmed for slot ${input.signup.slot_id}`,
    bodyLines: [
      `Hello ${input.member.first_name},`,
      "Your clinic signup has been created.",
      `Signup ID: ${input.signup.id}`,
      `Slot ID: ${input.signup.slot_id}`,
      `Guest count: ${input.signup.guest_count}`,
      `Audit number: ${input.member.audit_number}`,
    ],
  });
}

export async function sendLessonConfirmationRequest(
  lesson: { start_time: string },
  member: { first_name: string; last_name: string }
): Promise<void> {
  logDraftEmail({
    template: "lesson_confirmation_request",
    to: `${member.first_name} ${member.last_name} (member)`,
    subject: `Please confirm lesson at ${lesson.start_time}`,
    bodyLines: [
      `Hello ${member.first_name},`,
      `Please confirm your lesson at ${lesson.start_time}.`,
    ],
  });
}

export async function notifyCoachesOfPickup(
  lesson: { start_time: string },
  coaches: { first_name: string; last_name: string }[],
  member: { first_name: string; last_name: string }
): Promise<void> {
  logDraftEmail({
    template: "pickup_coach_broadcast",
    to: `${coaches.length} coach(es)`,
    subject: `Pickup available at ${lesson.start_time}`,
    bodyLines: [
      `Member: ${member.first_name} ${member.last_name}`,
      `Lesson time: ${lesson.start_time}`,
      "A coach can claim this pickup request.",
    ],
  });
}

export async function sendCoachPickupConfirmation(
  lesson: { start_time: string },
  member: { first_name: string; last_name: string },
  coach: { first_name: string; last_name: string }
): Promise<void> {
  console.log(
    `Coach ${coach.first_name} ${coach.last_name} claimed lesson for ${member.first_name} ${member.last_name}`
  );
}

export async function sendDailyClinicCode(
  code: string,
  date: string,
  recipients: { first_name: string; last_name: string }[]
): Promise<void> {
  console.log(
    `Daily clinic code ${code} for ${date} sent to ${recipients.length} staff`
  );
}

export async function escalatePickupToDirector(
  lesson: { start_time: string },
  member: { first_name: string; last_name: string },
  director: { first_name: string; last_name: string }
): Promise<void> {
  console.log(
    `Escalating unmatched pickup for ${member.first_name} ${member.last_name} at ${lesson.start_time} to director ${director.first_name} ${director.last_name}`
  );
}

export async function notifyAgeException(
  child: { first_name: string; last_name: string; date_of_birth: string | null },
  session: { program: string; start_time: string }
): Promise<void> {
  console.log(
    `Age exception: ${child.first_name} ${child.last_name} (DOB: ${child.date_of_birth}) checked into ${session.program.toUpperCase()} session at ${session.start_time} — child is under 10`
  );
}

export async function sendMemberDeclineNotification(
  lesson: { start_time: string },
  coach: { first_name: string; last_name: string }
): Promise<void> {
  console.log(
    `Member declined lesson at ${lesson.start_time} — notifying coach ${coach.first_name} ${coach.last_name}`
  );
}

export async function notifyWaitlistPromotion(
  waitlistEntry: { last_name: string; audit_number: string; slot_id: string }
): Promise<void> {
  console.log(
    `Waitlist promotion: ${waitlistEntry.last_name} (audit: ${waitlistEntry.audit_number}) promoted from waitlist for slot ${waitlistEntry.slot_id}`
  );
}

export async function notifyCoachLessonCancelled(
  lesson: { start_time: string },
  coach: { first_name: string; last_name: string }
): Promise<void> {
  console.log(
    `Pre-lesson cancellation: lesson at ${lesson.start_time} cancelled — notifying coach ${coach.first_name} ${coach.last_name}`
  );
}

export async function notifyCoachCancellationReview(
  lesson: { start_time: string },
  coach: { first_name: string; last_name: string }
): Promise<void> {
  console.log(
    `Post-lesson cancellation review: lesson at ${lesson.start_time} cancelled after end time — asking coach ${coach.first_name} ${coach.last_name} to confirm if lesson happened`
  );
}

export async function notifyCoachAvailabilityApproved(
  availability: { unavailable_from: string; unavailable_to: string },
  coach: { first_name: string; last_name: string }
): Promise<void> {
  console.log(
    `Availability approved: ${coach.first_name} ${coach.last_name} unavailability from ${availability.unavailable_from} to ${availability.unavailable_to} has been approved`
  );
}

export async function notifyNewStaffAccount(
  profile: { first_name: string; last_name: string; role: string | null },
  email: string,
  password: string
): Promise<void> {
  console.log(
    `New staff account created: ${profile.first_name} ${profile.last_name} (${profile.role}) — email: ${email}, password: ${password}`
  );
}
