"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { TrainingQuiz } from "./TrainingQuiz";
import { TrainingCertificate } from "./TrainingCertificate";
import type { TrainingCourseDetail, TrainingQuizQuestionPublic } from "@/types/hr/training";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { toast } from "@/lib/toast";

type Step = "overview" | "lessons" | "quiz" | "ack" | "certificate";

const ACK_TEXT =
  "I certify that I have read and understood all course materials, passed the required quiz, and agree to follow Morris Hauling policies and procedures on the job.";

interface Props {
  courseId: string;
}

export function CoursePlayer({ courseId }: Props) {
  const [detail, setDetail] = useState<TrainingCourseDetail | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<TrainingQuizQuestionPublic[]>([]);
  const [step, setStep] = useState<Step>("overview");
  const [lessonIdx, setLessonIdx] = useState(0);
  const [readSeconds, setReadSeconds] = useState(0);
  const [signerName, setSignerName] = useState("");
  const [certHtml, setCertHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch(`/api/me/training/${courseId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setDetail(d.detail);
          setQuizQuestions(d.quizQuestions ?? []);
          if (d.detail.status === "completed") {
            setStep("certificate");
            loadCert();
          }
        }
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const loadCert = useCallback(() => {
    fetch(`/api/me/training/${courseId}/certificate`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setCertHtml(d.html);
      });
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const lesson = detail?.lessons[lessonIdx];
  const minRead = lesson?.minReadSeconds ?? 30;
  const canCompleteLesson = readSeconds >= minRead;

  useEffect(() => {
    if (step !== "lessons" || !lesson) return;
    setReadSeconds(0);
    const t = setInterval(() => setReadSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [step, lessonIdx, lesson?.id]);

  const completeLesson = async () => {
    if (!lesson) return;
    const res = await fetch(`/api/me/training/${courseId}/lessons/${lesson.id}/complete`, {
      method: "POST",
    });
    const d = await res.json();
    if (d.ok) {
      toast.success("Lesson complete");
      if (lessonIdx < (detail?.lessons.length ?? 0) - 1) {
        setLessonIdx((i) => i + 1);
      } else {
        setStep("quiz");
      }
      load();
    } else {
      toast.error(d.error ?? "Could not complete lesson");
    }
  };

  const acknowledge = async () => {
    if (!signerName.trim()) {
      toast.error("Enter your full name to sign");
      return;
    }
    const res = await fetch(`/api/me/training/${courseId}/acknowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signerName }),
    });
    const d = await res.json();
    if (d.ok) {
      toast.success("Course completed!");
      setStep("certificate");
      loadCert();
      load();
    } else {
      toast.error(d.error ?? "Acknowledgment failed");
    }
  };

  if (loading || !detail) {
    return <div className="p-4 text-muted-foreground animate-pulse">Loading course…</div>;
  }

  const lessonsDone = detail.lessons.every((l) => l.completed);
  const steps: Step[] = ["overview", "lessons", "quiz", "ack", "certificate"];

  return (
    <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <ButtonLink href="/employee/training" variant="ghost" size="icon">
          <ChevronLeft className="h-5 w-5" />
        </ButtonLink>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{detail.course.name}</h1>
          <div className="flex gap-1 mt-1 flex-wrap">
            {steps.map((s) => (
              <Badge
                key={s}
                variant={step === s ? "default" : "outline"}
                className="text-[10px] capitalize cursor-pointer"
                onClick={() => {
                  if (s === "quiz" && !lessonsDone && detail.course.requiresLessonCompletion) return;
                  if (s === "ack" && !detail.quizPassed) return;
                  if (s === "certificate" && detail.status !== "completed") return;
                  setStep(s);
                }}
              >
                {s === "ack" ? "Sign" : s}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {step === "overview" && (
        <PremiumCard className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">{detail.course.description}</p>
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>{detail.lessons.length} lessons</li>
            <li>{detail.quizQuestionCount} quiz questions · pass {detail.course.passingScorePercent}%</li>
            <li>Digital signature required</li>
          </ul>
          <Button className="w-full" onClick={() => setStep("lessons")}>
            Begin lessons
          </Button>
        </PremiumCard>
      )}

      {step === "lessons" && lesson && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Lesson {lessonIdx + 1} of {detail.lessons.length}
            {lesson.completed && (
              <CheckCircle2 className="inline h-4 w-4 text-green-600 ml-1" />
            )}
          </p>
          <PremiumCard className="p-4">
            <h2 className="font-semibold text-lg">{lesson.title}</h2>
            {lesson.overview && <p className="text-sm text-muted-foreground mt-1">{lesson.overview}</p>}
            {lesson.objectives.length > 0 && (
              <ul className="text-sm mt-3 list-disc pl-5 text-muted-foreground">
                {lesson.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            )}
            <div
              className="prose prose-sm max-w-none mt-4"
              dangerouslySetInnerHTML={{ __html: lesson.contentHtml }}
            />
          </PremiumCard>
          {!lesson.completed ? (
            <>
              <p className="text-xs text-muted-foreground text-center">
                {canCompleteLesson
                  ? "You may mark this lesson complete"
                  : `Please read (${minRead - readSeconds}s remaining)`}
              </p>
              <Button className="w-full" disabled={!canCompleteLesson} onClick={completeLesson}>
                I&apos;ve read this lesson
              </Button>
            </>
          ) : (
            <Button
              className="w-full"
              onClick={() => {
                if (lessonIdx < detail.lessons.length - 1) setLessonIdx((i) => i + 1);
                else setStep("quiz");
              }}
            >
              {lessonIdx < detail.lessons.length - 1 ? "Next lesson" : "Go to quiz"}
            </Button>
          )}
        </div>
      )}

      {step === "quiz" && (
        <TrainingQuiz
          courseId={courseId}
          questions={quizQuestions}
          attemptsRemaining={detail.attemptsRemaining}
          passingScore={detail.course.passingScorePercent}
          onPassed={() => {
            setStep("ack");
            load();
          }}
        />
      )}

      {step === "ack" && (
        <PremiumCard className="p-4 space-y-4">
          <p className="text-sm">{ACK_TEXT}</p>
          <div>
            <label className="text-sm font-medium">Type your full legal name</label>
            <input
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="First Last"
            />
          </div>
          <Button className="w-full" onClick={acknowledge} disabled={!detail.quizPassed}>
            Sign and complete course
          </Button>
          {!detail.quizPassed && (
            <p className="text-xs text-destructive">Pass the quiz before signing.</p>
          )}
        </PremiumCard>
      )}

      {step === "certificate" && certHtml && (
        <TrainingCertificate
          html={certHtml}
          courseName={detail.course.name}
          score={detail.completion?.score}
          completedAt={detail.completion?.completedAt}
        />
      )}
    </div>
  );
}
