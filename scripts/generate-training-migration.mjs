/**
 * Generates supabase/migrations/024_training_content.sql from training-seed-data.
 * Run: node scripts/generate-training-migration.mjs
 */
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Compile TS on the fly via tsx dynamic import
const { MORRIS_TRAINING_COURSES, ONBOARDING_COURSE_LINKS } = await import(
  "../lib/db/hr/training-seed-data.ts"
);

function esc(s) {
  return s.replace(/'/g, "''");
}

function arrSql(a) {
  return `ARRAY[${a.map((x) => `'${esc(x)}'`).join(", ")}]::text[]`;
}

function jsonSql(a) {
  return `'${esc(JSON.stringify(a))}'::jsonb`;
}

const lines = [];
lines.push("-- Morris field training curriculum (12 courses)");
lines.push("BEGIN;");
lines.push("");
lines.push("DELETE FROM public.training_quiz_attempts WHERE company_id = 'morris-hauling';");
lines.push("DELETE FROM public.training_acknowledgments WHERE company_id = 'morris-hauling';");
lines.push("DELETE FROM public.training_lesson_progress WHERE company_id = 'morris-hauling';");
lines.push("DELETE FROM public.training_completions WHERE company_id = 'morris-hauling';");
lines.push("DELETE FROM public.training_quiz_questions WHERE company_id = 'morris-hauling';");
lines.push("DELETE FROM public.training_lessons WHERE company_id = 'morris-hauling';");
lines.push("DELETE FROM public.training_course_assignments WHERE company_id = 'morris-hauling';");
lines.push("DELETE FROM public.training_retraining_events WHERE company_id = 'morris-hauling';");
lines.push("DELETE FROM public.training_courses WHERE company_id = 'morris-hauling';");
lines.push("");

for (const c of MORRIS_TRAINING_COURSES) {
  lines.push(
    `INSERT INTO public.training_courses (id, company_id, name, description, category, course_type, is_required, expiration_months, sort_order, passing_score_percent, max_quiz_attempts, requires_lesson_completion) VALUES ('${c.id}', 'morris-hauling', '${esc(c.name)}', '${esc(c.description)}', '${esc(c.category)}', 'quiz', ${c.isRequired}, ${c.expirationMonths}, ${c.sortOrder}, 80, 3, true);`
  );
  for (const l of c.lessons) {
    lines.push(
      `INSERT INTO public.training_lessons (id, company_id, course_id, title, overview, objectives, content_html, sort_order, min_read_seconds) VALUES ('${l.id}', 'morris-hauling', '${c.id}', '${esc(l.title)}', '${esc(l.overview)}', ${arrSql(l.objectives)}, '${esc(l.contentHtml)}', ${l.sortOrder}, ${l.minReadSeconds ?? 30});`
    );
  }
  for (const q of c.questions) {
    lines.push(
      `INSERT INTO public.training_quiz_questions (id, company_id, course_id, question, options, correct_index, explanation, sort_order) VALUES ('${q.id}', 'morris-hauling', '${c.id}', '${esc(q.question)}', ${jsonSql(q.options)}, ${q.correctIndex}, ${q.explanation ? `'${esc(q.explanation)}'` : "NULL"}, ${q.sortOrder});`
    );
  }
  if (c.isRequired) {
    lines.push(
      `INSERT INTO public.training_course_assignments (id, company_id, course_id, employment_type, is_required) VALUES ('tca-${c.id}', 'morris-hauling', '${c.id}', 'w2', true);`
    );
    lines.push(
      `INSERT INTO public.training_course_assignments (id, company_id, course_id, employment_type, is_required) VALUES ('tca-${c.id}-1099', 'morris-hauling', '${c.id}', '1099', true);`
    );
  }
}

for (const [key, courseId] of Object.entries(ONBOARDING_COURSE_LINKS)) {
  lines.push(
    `UPDATE public.onboarding_template_items SET linked_course_id = '${courseId}' WHERE item_key = '${key}' AND company_id = 'morris-hauling';`
  );
  lines.push(
    `UPDATE public.employee_onboarding_items SET linked_course_id = '${courseId}' WHERE item_key = '${key}' AND company_id = 'morris-hauling';`
  );
}

lines.push("");
lines.push("COMMIT;");
lines.push("");

const out = join(root, "supabase", "migrations", "024_training_content.sql");
writeFileSync(out, lines.join("\n"), "utf8");
console.log(`Wrote ${out} (${lines.length} lines)`);
