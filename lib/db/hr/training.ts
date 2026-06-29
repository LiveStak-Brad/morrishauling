import { addDays, format, isBefore, parseISO, startOfDay } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  rowToTrainingCourse,
  rowToTrainingLesson,
  rowToTrainingQuizQuestion,
  rowToTrainingCompletion,
  rowToTrainingCourseAssignment,
  rowToHrEmployee,
} from "@/lib/db/hr-mappers";
import type {
  AssignedCourseSummary,
  TrainingCourse,
  TrainingCourseDetail,
  TrainingCourseStatus,
  TrainingLesson,
  TrainingMatrixRow,
  TrainingQuizQuestion,
  TrainingQuizQuestionPublic,
} from "@/types/hr/training";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

const ACK_TEXT =
  "I certify that I have read and understood all course materials, passed the required quiz, and agree to follow Morris Hauling policies and procedures on the job.";

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

function isExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  return isBefore(parseISO(expiresAt), startOfDay(new Date()));
}

function calcExpiresAt(months?: number | null): string | null {
  if (!months) return null;
  return format(addDays(new Date(), months * 30), "yyyy-MM-dd");
}

async function getEmployeeContext(companyId: string, employeeId: string) {
  const sb = await sbWrite();
  const { data } = await sb
    .from("employees")
    .select("employment_type, position_id, profiles(role)")
    .eq("company_id", companyId)
    .eq("id", employeeId)
    .single();
  const profile = data?.profiles as { role?: string } | null;
  return {
    employmentType: data?.employment_type as string | undefined,
    positionId: data?.position_id as string | undefined,
    role: profile?.role,
  };
}

async function getCourseAssignmentsForEmployee(companyId: string, employeeId: string) {
  const ctx = await getEmployeeContext(companyId, employeeId);
  const sb = await sbWrite();
  const { data: allAssignments } = await sb
    .from("training_course_assignments")
    .select("*")
    .eq("company_id", companyId);
  const { data: courses } = await sb
    .from("training_courses")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true);

  const courseMap = new Map((courses ?? []).map((c) => [String(c.id), rowToTrainingCourse(c)]));
  const matched = new Map<string, { course: TrainingCourse; dueDate?: string; isRequired: boolean }>();

  for (const row of allAssignments ?? []) {
    const a = rowToTrainingCourseAssignment(row);
    const course = courseMap.get(a.courseId);
    if (!course) continue;
    const matches =
      a.employeeId === employeeId ||
      (a.employmentType && a.employmentType === ctx.employmentType) ||
      (a.positionId && a.positionId === ctx.positionId) ||
      (a.employeeRole && a.employeeRole === ctx.role);
    if (!matches) continue;
    const existing = matched.get(a.courseId);
    if (!existing || a.isRequired) {
      matched.set(a.courseId, { course, dueDate: a.dueDate, isRequired: a.isRequired });
    }
  }

  // Fallback: global required courses when no explicit assignments
  if (matched.size === 0) {
    for (const course of courseMap.values()) {
      if (course.isRequired) {
        matched.set(course.id, { course, isRequired: true });
      }
    }
  }

  return Array.from(matched.values());
}

async function getActiveCompletion(companyId: string, employeeId: string, courseId: string) {
  const sb = await sbWrite();
  const { data } = await sb
    .from("training_completions")
    .select("*, training_courses(*)")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .eq("course_id", courseId)
    .eq("passed", true)
    .order("completed_at", { ascending: false });
  const rows = (data ?? []).map(rowToTrainingCompletion);
  return rows.find((c) => !isExpired(c.expiresAt));
}

function deriveStatus(
  completion: ReturnType<typeof rowToTrainingCompletion> | undefined,
  lessonsTotal: number,
  lessonsCompleted: number,
  quizPassed: boolean,
  dueDate?: string,
  isRequired?: boolean
): TrainingCourseStatus {
  if (completion && !isExpired(completion.expiresAt)) return "completed";
  if (completion && isExpired(completion.expiresAt)) return "expired";
  const overdue = Boolean(isRequired && dueDate && isBefore(parseISO(dueDate), startOfDay(new Date())));
  if (lessonsCompleted > 0 || quizPassed) return overdue ? "overdue" : "in_progress";
  return overdue ? "overdue" : "not_started";
}

export async function getAssignedCourses(
  companyId: string,
  employeeId: string
): Promise<AssignedCourseSummary[]> {
  const sb = await sbWrite();
  const assigned = await getCourseAssignmentsForEmployee(companyId, employeeId);
  const courseIds = assigned.map((a) => a.course.id);

  const [{ data: lessons }, { data: progress }, { data: attempts }, { data: completions }] = await Promise.all([
    sb.from("training_lessons").select("id, course_id").eq("company_id", companyId).in("course_id", courseIds.length ? courseIds : ["__none__"]),
    sb.from("training_lesson_progress").select("lesson_id, completed_at").eq("company_id", companyId).eq("employee_id", employeeId),
    sb.from("training_quiz_attempts").select("course_id, score, passed").eq("company_id", companyId).eq("employee_id", employeeId),
    sb.from("training_completions").select("*, training_courses(*)").eq("company_id", companyId).eq("employee_id", employeeId),
  ]);

  const lessonsByCourse = new Map<string, number>();
  for (const l of lessons ?? []) {
    const cid = String(l.course_id);
    lessonsByCourse.set(cid, (lessonsByCourse.get(cid) ?? 0) + 1);
  }
  const completedLessonIds = new Set(
    (progress ?? []).filter((p) => p.completed_at).map((p) => String(p.lesson_id))
  );
  const lessonIdToCourse = new Map((lessons ?? []).map((l) => [String(l.id), String(l.course_id)]));

  const completedByCourse = new Map<string, number>();
  for (const lid of completedLessonIds) {
    const cid = lessonIdToCourse.get(lid);
    if (cid) completedByCourse.set(cid, (completedByCourse.get(cid) ?? 0) + 1);
  }

  const attemptsByCourse = new Map<string, { count: number; best?: number; passed: boolean }>();
  for (const a of attempts ?? []) {
    const cid = String(a.course_id);
    const cur = attemptsByCourse.get(cid) ?? { count: 0, passed: false };
    cur.count += 1;
    if (a.passed) cur.passed = true;
    const score = Number(a.score);
    if (!cur.best || score > cur.best) cur.best = score;
    attemptsByCourse.set(cid, cur);
  }

  const completionByCourse = new Map<string, ReturnType<typeof rowToTrainingCompletion>>();
  for (const row of completions ?? []) {
    const c = rowToTrainingCompletion(row);
    const existing = completionByCourse.get(c.courseId);
    if (!existing || c.completedAt > existing.completedAt) {
      completionByCourse.set(c.courseId, c);
    }
  }

  return assigned.map(({ course, dueDate, isRequired }) => {
    const lessonsTotal = lessonsByCourse.get(course.id) ?? 0;
    const lessonsCompleted = completedByCourse.get(course.id) ?? 0;
    const att = attemptsByCourse.get(course.id);
    const completion = completionByCourse.get(course.id);
    const active = completion && !isExpired(completion.expiresAt) ? completion : undefined;
    const status = deriveStatus(
      active ?? (completion && isExpired(completion.expiresAt) ? completion : undefined),
      lessonsTotal,
      lessonsCompleted,
      Boolean(att?.passed),
      dueDate,
      isRequired
    );
    return {
      course,
      status,
      lessonsTotal,
      lessonsCompleted,
      quizAttempts: att?.count ?? 0,
      bestScore: att?.best,
      completion: active,
      dueDate,
      isOverdue: status === "overdue",
    };
  });
}

export async function getCourseDetail(
  companyId: string,
  employeeId: string,
  courseId: string
): Promise<TrainingCourseDetail | null> {
  const sb = await sbWrite();
  const { data: courseRow } = await sb
    .from("training_courses")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", courseId)
    .single();
  if (!courseRow) return null;
  const course = rowToTrainingCourse(courseRow);

  const [{ data: lessonRows }, { data: progressRows }, { data: attemptRows }] = await Promise.all([
    sb.from("training_lessons").select("*").eq("company_id", companyId).eq("course_id", courseId).order("sort_order"),
    sb.from("training_lesson_progress").select("*").eq("company_id", companyId).eq("employee_id", employeeId),
    sb.from("training_quiz_attempts").select("*").eq("company_id", companyId).eq("employee_id", employeeId).eq("course_id", courseId).order("attempted_at", { ascending: false }),
  ]);

  const progressMap = new Map((progressRows ?? []).map((p) => [String(p.lesson_id), p]));
  const lessons: TrainingLesson[] = (lessonRows ?? []).map((r) => {
    const lesson = rowToTrainingLesson(r);
    const prog = progressMap.get(lesson.id);
    if (prog?.completed_at) {
      lesson.completed = true;
      lesson.completedAt = String(prog.completed_at);
    }
    return lesson;
  });

  const { count: questionCount } = await sb
    .from("training_quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("course_id", courseId);

  const attempts = attemptRows ?? [];
  const quizPassed = attempts.some((a) => a.passed);
  const bestScore = attempts.length ? Math.max(...attempts.map((a) => Number(a.score))) : undefined;
  const activeCompletion = await getActiveCompletion(companyId, employeeId, courseId);
  const lessonsCompleted = lessons.filter((l) => l.completed).length;

  const assigned = await getCourseAssignmentsForEmployee(companyId, employeeId);
  const assignMeta = assigned.find((a) => a.course.id === courseId);

  const status = deriveStatus(
    activeCompletion,
    lessons.length,
    lessonsCompleted,
    quizPassed,
    assignMeta?.dueDate,
    assignMeta?.isRequired ?? course.isRequired
  );

  const { data: ackRow } = activeCompletion
    ? await sb
        .from("training_acknowledgments")
        .select("id")
        .eq("company_id", companyId)
        .eq("completion_id", activeCompletion.id)
        .maybeSingle()
    : { data: null };

  return {
    course,
    lessons,
    quizQuestionCount: questionCount ?? 0,
    status,
    lessonsCompleted,
    quizPassed,
    bestScore,
    attemptsRemaining: Math.max(0, course.maxQuizAttempts - attempts.length),
    completion: activeCompletion,
    acknowledgmentRequired: Boolean(activeCompletion && !ackRow),
  };
}

export async function getQuizQuestionsPublic(
  companyId: string,
  courseId: string
): Promise<TrainingQuizQuestionPublic[]> {
  const sb = await sbWrite();
  const { data } = await sb
    .from("training_quiz_questions")
    .select("id, question, options, sort_order")
    .eq("company_id", companyId)
    .eq("course_id", courseId)
    .order("sort_order");
  return (data ?? []).map((r) => ({
    id: String(r.id),
    question: String(r.question),
    options: Array.isArray(r.options) ? (r.options as string[]) : [],
    sortOrder: Number(r.sort_order) ?? 0,
  }));
}

export async function markLessonComplete(
  companyId: string,
  employeeId: string,
  lessonId: string
): Promise<void> {
  const sb = await sbWrite();
  const { data: lesson } = await sb
    .from("training_lessons")
    .select("id, course_id")
    .eq("company_id", companyId)
    .eq("id", lessonId)
    .single();
  if (!lesson) throw new Error("Lesson not found");

  const progId = id("tlp");
  const { error } = await sb.from("training_lesson_progress").upsert(
    {
      id: progId,
      company_id: companyId,
      employee_id: employeeId,
      lesson_id: lessonId,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "employee_id,lesson_id" }
  );
  if (error) throw error;
}

export async function submitQuizAttempt(
  companyId: string,
  employeeId: string,
  courseId: string,
  answers: Record<string, number>
): Promise<{ score: number; passed: boolean; attemptsRemaining: number }> {
  const sb = await sbWrite();
  const { data: course } = await sb.from("training_courses").select("*").eq("id", courseId).single();
  if (!course) throw new Error("Course not found");
  const courseObj = rowToTrainingCourse(course);

  const { data: questions } = await sb
    .from("training_quiz_questions")
    .select("*")
    .eq("company_id", companyId)
    .eq("course_id", courseId);
  const qs = (questions ?? []).map(rowToTrainingQuizQuestion);
  if (!qs.length) throw new Error("No quiz questions for this course");

  const { count: priorAttempts } = await sb
    .from("training_quiz_attempts")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .eq("course_id", courseId);

  if ((priorAttempts ?? 0) >= courseObj.maxQuizAttempts) {
    throw new Error("Maximum quiz attempts reached. Contact your supervisor.");
  }

  if (courseObj.requiresLessonCompletion) {
    const { data: lessons } = await sb
      .from("training_lessons")
      .select("id")
      .eq("company_id", companyId)
      .eq("course_id", courseId);
    const lessonIds = (lessons ?? []).map((l) => String(l.id));
    if (lessonIds.length) {
      const { data: progress } = await sb
        .from("training_lesson_progress")
        .select("lesson_id")
        .eq("company_id", companyId)
        .eq("employee_id", employeeId)
        .in("lesson_id", lessonIds)
        .not("completed_at", "is", null);
      if ((progress ?? []).length < lessonIds.length) {
        throw new Error("Complete all lessons before taking the quiz");
      }
    }
  }

  let correct = 0;
  for (const q of qs) {
    if (answers[q.id] === q.correctIndex) correct += 1;
  }
  const score = Math.round((correct / qs.length) * 100);
  const passed = score >= courseObj.passingScorePercent;

  await sb.from("training_quiz_attempts").insert({
    id: id("tqa"),
    company_id: companyId,
    employee_id: employeeId,
    course_id: courseId,
    score,
    passed,
    answers,
  });

  return {
    score,
    passed,
    attemptsRemaining: Math.max(0, courseObj.maxQuizAttempts - (priorAttempts ?? 0) - 1),
  };
}

export async function acknowledgeCourse(
  companyId: string,
  employeeId: string,
  courseId: string,
  signerName: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const sb = await sbWrite();
  const course = rowToTrainingCourse(
    (await sb.from("training_courses").select("*").eq("id", courseId).single()).data ?? {}
  );
  if (!course.id) throw new Error("Course not found");

  const { data: attempts } = await sb
    .from("training_quiz_attempts")
    .select("*")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .eq("course_id", courseId)
    .eq("passed", true)
    .limit(1);
  if (!attempts?.length) throw new Error("Pass the quiz before signing");

  const active = await getActiveCompletion(companyId, employeeId, courseId);
  if (active) {
    const { data: existingAck } = await sb
      .from("training_acknowledgments")
      .select("id")
      .eq("completion_id", active.id)
      .maybeSingle();
    if (existingAck) return active.id;
  }

  const score = Number(attempts[0].score);
  const compId = id("tcomp");
  const expiresAt = calcExpiresAt(course.expirationMonths);

  await sb.from("training_completions").insert({
    id: compId,
    company_id: companyId,
    employee_id: employeeId,
    course_id: courseId,
    score,
    passed: true,
    expires_at: expiresAt,
    certificate_path: `training/${employeeId}/${courseId}/${compId}.html`,
  });

  await sb.from("training_acknowledgments").insert({
    id: id("tack"),
    company_id: companyId,
    completion_id: compId,
    employee_id: employeeId,
    course_id: courseId,
    signer_name: signerName.trim(),
    acknowledgment_text: ACK_TEXT,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  await syncOnboardingForCourse(companyId, employeeId, courseId);
  await completeRetrainingEvent(companyId, employeeId, courseId);

  return compId;
}

async function syncOnboardingForCourse(companyId: string, employeeId: string, courseId: string) {
  const sb = await sbWrite();
  const { data: items } = await sb
    .from("employee_onboarding_items")
    .select("id")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .eq("linked_course_id", courseId)
    .is("completed_at", null);
  for (const item of items ?? []) {
    await sb
      .from("employee_onboarding_items")
      .update({ completed_at: new Date().toISOString(), status: "completed" })
      .eq("id", item.id);
  }
}

async function completeRetrainingEvent(companyId: string, employeeId: string, courseId: string) {
  const sb = await sbWrite();
  await sb
    .from("training_retraining_events")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .eq("course_id", courseId)
    .eq("status", "pending");
}

export async function getCertificate(
  companyId: string,
  employeeId: string,
  courseId: string
): Promise<{ html: string; completionId: string } | null> {
  const sb = await sbWrite();
  const completion = await getActiveCompletion(companyId, employeeId, courseId);
  if (!completion) return null;

  const [{ data: course }, { data: emp }, { data: ack }] = await Promise.all([
    sb.from("training_courses").select("*").eq("id", courseId).single(),
    sb.from("employees").select("first_name, last_name").eq("id", employeeId).single(),
    sb.from("training_acknowledgments").select("*").eq("completion_id", completion.id).maybeSingle(),
  ]);
  if (!course || !ack) return null;

  const name = `${emp?.first_name ?? ""} ${emp?.last_name ?? ""}`.trim();
  const template =
    course.certificate_template_html ||
    `
    <div style="font-family: Georgia, serif; max-width: 700px; margin: 0 auto; padding: 48px; border: 3px double #1a4d2e; text-align: center;">
      <h1 style="color: #1a4d2e; margin-bottom: 8px;">Certificate of Completion</h1>
      <p style="font-size: 14px; color: #666;">Morris Hauling &amp; Junk Removal</p>
      <p style="margin: 32px 0;">This certifies that</p>
      <h2 style="font-size: 28px; margin: 0;">{{employeeName}}</h2>
      <p style="margin: 24px 0;">has successfully completed</p>
      <h3 style="font-size: 22px; color: #1a4d2e;">{{courseName}}</h3>
      <p style="margin: 24px 0;">Score: {{score}}% · Date: {{completedDate}}</p>
      <p style="margin-top: 48px; border-top: 1px solid #ccc; padding-top: 16px;">{{signerName}}</p>
      <p style="font-size: 12px; color: #888;">Digital acknowledgment on file</p>
    </div>`;

  const html = template
    .replace(/\{\{employeeName\}\}/g, name)
    .replace(/\{\{courseName\}\}/g, String(course.name))
    .replace(/\{\{score\}\}/g, String(completion.score ?? "—"))
    .replace(/\{\{completedDate\}\}/g, format(new Date(completion.completedAt), "MMMM d, yyyy"))
    .replace(/\{\{signerName\}\}/g, String(ack.signer_name));

  return { html, completionId: completion.id };
}

export async function getOverdueTraining(companyId: string): Promise<
  Array<{ employeeId: string; employeeName: string; courseId: string; courseName: string; dueDate?: string }>
> {
  const sb = await sbWrite();
  const { data: employees } = await sb
    .from("employees")
    .select("id, first_name, last_name")
    .eq("company_id", companyId)
    .eq("lifecycle_status", "active");
  const results: Array<{ employeeId: string; employeeName: string; courseId: string; courseName: string; dueDate?: string }> = [];
  for (const emp of employees ?? []) {
    const assigned = await getAssignedCourses(companyId, String(emp.id));
    for (const a of assigned) {
      if (a.isOverdue || a.status === "expired") {
        results.push({
          employeeId: String(emp.id),
          employeeName: `${emp.first_name} ${emp.last_name}`,
          courseId: a.course.id,
          courseName: a.course.name,
          dueDate: a.dueDate,
        });
      }
    }
  }
  return results;
}

export async function getTrainingMatrix(companyId: string): Promise<TrainingMatrixRow[]> {
  const sb = await sbWrite();
  const { data: employees } = await sb
    .from("employees")
    .select("id, first_name, last_name")
    .eq("company_id", companyId)
    .in("lifecycle_status", ["active", "on_leave"]);
  const rows: TrainingMatrixRow[] = [];
  for (const emp of employees ?? []) {
    const assigned = await getAssignedCourses(companyId, String(emp.id));
    rows.push({
      employeeId: String(emp.id),
      employeeName: `${emp.first_name} ${emp.last_name}`,
      courses: assigned.map((a) => ({
        courseId: a.course.id,
        courseName: a.course.name,
        status: a.status,
        score: a.bestScore ?? a.completion?.score,
        completedAt: a.completion?.completedAt,
        expiresAt: a.completion?.expiresAt,
      })),
    });
  }
  return rows;
}

// Admin operations
export async function listAllCourses(companyId: string): Promise<TrainingCourse[]> {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("training_courses")
    .select("*")
    .eq("company_id", companyId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(rowToTrainingCourse);
}

export async function upsertCourse(companyId: string, course: Partial<TrainingCourse> & { name: string }) {
  const sb = await sbWrite();
  const courseId = course.id ?? id("tc");
  const row = {
    id: courseId,
    company_id: companyId,
    name: course.name,
    description: course.description,
    course_type: course.courseType ?? "quiz",
    category: course.category,
    content_url: course.contentUrl,
    expiration_months: course.expirationMonths,
    is_required: course.isRequired ?? false,
    is_active: course.isActive ?? true,
    sort_order: course.sortOrder ?? 0,
    passing_score_percent: course.passingScorePercent ?? 80,
    max_quiz_attempts: course.maxQuizAttempts ?? 3,
    requires_lesson_completion: course.requiresLessonCompletion ?? true,
    certificate_template_html: course.certificateTemplateHtml,
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from("training_courses").upsert(row);
  if (error) throw error;
  return courseId;
}

export async function assignCourse(
  companyId: string,
  input: {
    courseId: string;
    employeeId?: string;
    employmentType?: string;
    employeeRole?: string;
    positionId?: string;
    isRequired?: boolean;
    dueDate?: string;
    renewalMonths?: number;
  }
) {
  const sb = await sbWrite();
  const assignId = id("tca");
  const { error } = await sb.from("training_course_assignments").insert({
    id: assignId,
    company_id: companyId,
    course_id: input.courseId,
    employee_id: input.employeeId,
    employment_type: input.employmentType,
    employee_role: input.employeeRole,
    position_id: input.positionId,
    is_required: input.isRequired ?? true,
    due_date: input.dueDate,
    renewal_months: input.renewalMonths,
  });
  if (error) throw error;
  return assignId;
}

export async function requireRetraining(
  companyId: string,
  input: { employeeId: string; courseId: string; reason: string; dueDate: string; requiredByProfileId?: string }
) {
  const sb = await sbWrite();
  const eventId = id("tre");
  await sb.from("training_retraining_events").insert({
    id: eventId,
    company_id: companyId,
    employee_id: input.employeeId,
    course_id: input.courseId,
    reason: input.reason,
    required_by_profile_id: input.requiredByProfileId,
    due_date: input.dueDate,
    status: "pending",
  });
  return eventId;
}

export async function adminWaiveCompletion(companyId: string, eventId: string) {
  const sb = await sbWrite();
  await sb
    .from("training_retraining_events")
    .update({ status: "waived", updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("id", eventId);
}

export async function getEmployeeTrainingSummary(companyId: string, employeeId: string) {
  return getAssignedCourses(companyId, employeeId);
}

export async function getExpiringTraining(companyId: string, withinDays = 30) {
  const sb = await sbWrite();
  const cutoff = format(addDays(new Date(), withinDays), "yyyy-MM-dd");
  const { data } = await sb
    .from("training_completions")
    .select("*, training_courses(name), employees(first_name, last_name)")
    .eq("company_id", companyId)
    .eq("passed", true)
    .not("expires_at", "is", null)
    .lte("expires_at", cutoff)
    .gte("expires_at", todayStr());
  return data ?? [];
}

// Legacy wrappers — honor-system bypass removed
export async function getTrainingCourses(companyId: string) {
  return listAllCourses(companyId).then((c) => c.filter((x) => x.isActive));
}

export async function getTrainingCompletions(companyId: string, employeeId: string) {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("training_completions")
    .select("*, training_courses(*)")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId);
  if (error) throw error;
  return (data ?? []).map(rowToTrainingCompletion);
}

export async function completeTraining() {
  throw new Error("Direct training completion is disabled. Complete lessons, quiz, and acknowledgment.");
}

export async function upsertLesson(companyId: string, lesson: Partial<TrainingLesson> & { courseId: string; title: string }) {
  const sb = await sbWrite();
  const lessonId = lesson.id ?? id("tl");
  const { error } = await sb.from("training_lessons").upsert({
    id: lessonId,
    company_id: companyId,
    course_id: lesson.courseId,
    title: lesson.title,
    overview: lesson.overview,
    objectives: lesson.objectives ?? [],
    content_html: lesson.contentHtml ?? "",
    image_paths: lesson.imagePaths ?? [],
    sort_order: lesson.sortOrder ?? 0,
    min_read_seconds: lesson.minReadSeconds ?? 30,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return lessonId;
}

export async function upsertQuizQuestion(companyId: string, q: Partial<TrainingQuizQuestion> & { courseId: string; question: string; options: string[]; correctIndex: number }) {
  const sb = await sbWrite();
  const qId = q.id ?? id("tqq");
  const { error } = await sb.from("training_quiz_questions").upsert({
    id: qId,
    company_id: companyId,
    course_id: q.courseId,
    question: q.question,
    options: q.options,
    correct_index: q.correctIndex,
    explanation: q.explanation,
    sort_order: q.sortOrder ?? 0,
  });
  if (error) throw error;
  return qId;
}
