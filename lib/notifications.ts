// TODO: replace with real email/SMS provider before launch

export async function sendLessonConfirmationRequest(
  lesson: { start_time: string },
  member: { first_name: string; last_name: string }
): Promise<void> {
  console.log(
    `Confirmation request for ${member.first_name} ${member.last_name} lesson at ${lesson.start_time}`
  );
}

export async function notifyCoachesOfPickup(
  lesson: { start_time: string },
  coaches: { first_name: string; last_name: string }[],
  member: { first_name: string; last_name: string }
): Promise<void> {
  console.log(
    `Pickup available: ${member.first_name} ${member.last_name} needs a coach at ${lesson.start_time} — notifying ${coaches.length} coach(es)`
  );
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
