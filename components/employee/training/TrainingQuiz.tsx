"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PremiumCard } from "@/components/morris/PremiumCard";
import type { TrainingQuizQuestionPublic } from "@/types/hr/training";
import { toast } from "@/lib/toast";

interface Props {
  courseId: string;
  questions: TrainingQuizQuestionPublic[];
  attemptsRemaining: number;
  passingScore: number;
  onPassed: (score: number) => void;
}

export function TrainingQuiz({ courseId, questions, attemptsRemaining, passingScore, onPassed }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const submit = async () => {
    if (!allAnswered) {
      toast.error("Answer all questions");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/me/training/${courseId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const d = await res.json();
      if (!d.ok) {
        toast.error(d.error ?? "Quiz failed");
        return;
      }
      setResult({ score: d.score, passed: d.passed });
      if (d.passed) {
        toast.success(`Passed with ${d.score}%`);
        onPassed(d.score);
      } else {
        toast.error(`Score ${d.score}% — need ${passingScore}% (${d.attemptsRemaining} attempts left)`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!questions.length) {
    return <p className="text-sm text-muted-foreground">No quiz for this course.</p>;
  }

  if (attemptsRemaining <= 0 && !result?.passed) {
    return (
      <PremiumCard className="p-4 text-destructive text-sm">
        Maximum attempts reached. Contact your supervisor for help.
      </PremiumCard>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pass with {passingScore}% or higher. Attempts remaining: {attemptsRemaining}
      </p>
      {questions.map((q, idx) => (
        <PremiumCard key={q.id} className="p-4">
          <p className="font-medium mb-3">
            {idx + 1}. {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <label
                key={oi}
                className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer text-sm ${
                  answers[q.id] === oi ? "border-brand-primary bg-brand-primary/5" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === oi}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                  className="accent-brand-primary"
                />
                {opt}
              </label>
            ))}
          </div>
        </PremiumCard>
      ))}
      {result && !result.passed && (
        <p className="text-sm text-destructive">Score: {result.score}% — try again when ready.</p>
      )}
      <Button onClick={submit} disabled={submitting || !allAnswered} className="w-full">
        {submitting ? "Submitting…" : "Submit quiz"}
      </Button>
    </div>
  );
}
