"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";

type Review = {
  id: string;
  employeeId: string;
  employeeName?: string;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  overallRating?: number;
  strengths?: string;
  improvements?: string;
  goals?: string;
  status: string;
};

type Disciplinary = {
  id: string;
  employeeId: string;
  actionType: string;
  description: string;
  actionDate: string;
};

export default function HrPerformancePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [actions, setActions] = useState<Disciplinary[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [form, setForm] = useState({
    reviewPeriodStart: "",
    reviewPeriodEnd: "",
    overallRating: "3",
    strengths: "",
    improvements: "",
    goals: "",
  });
  const [noteForm, setNoteForm] = useState({
    actionType: "coaching",
    description: "",
    actionDate: new Date().toISOString().slice(0, 10),
  });

  async function load() {
    const res = await fetch(`/api/admin/hr/performance?companyId=${MORRIS_COMPANY_ID}`);
    const json = await res.json();
    if (json.ok) {
      setReviews(json.data.reviews ?? []);
      setActions(json.data.disciplinary ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createReview() {
    if (!employeeId) {
      toast.error("Employee ID required");
      return;
    }
    const res = await fetch("/api/admin/hr/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_review",
        companyId: MORRIS_COMPANY_ID,
        employeeId,
        ...form,
        overallRating: Number(form.overallRating),
      }),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success("Review saved (manager-only)");
      void load();
    } else toast.error(json.error || "Failed");
  }

  async function createDisciplinary() {
    if (!employeeId || !noteForm.description) {
      toast.error("Employee and description required");
      return;
    }
    const res = await fetch("/api/admin/hr/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_disciplinary",
        companyId: MORRIS_COMPANY_ID,
        employeeId,
        ...noteForm,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success("Disciplinary note recorded");
      void load();
    } else toast.error(json.error || "Failed");
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-3xl font-medium tracking-tight">Performance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manager-only reviews, goals, and disciplinary actions. Not visible to customers.
        </p>
      </div>

      <PremiumCard className="space-y-3 p-4">
        <h2 className="text-lg font-semibold">New review</h2>
        <Input
          placeholder="Employee ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            type="date"
            value={form.reviewPeriodStart}
            onChange={(e) => setForm((f) => ({ ...f, reviewPeriodStart: e.target.value }))}
          />
          <Input
            type="date"
            value={form.reviewPeriodEnd}
            onChange={(e) => setForm((f) => ({ ...f, reviewPeriodEnd: e.target.value }))}
          />
          <Input
            type="number"
            min={1}
            max={5}
            value={form.overallRating}
            onChange={(e) => setForm((f) => ({ ...f, overallRating: e.target.value }))}
            placeholder="Rating 1-5"
          />
        </div>
        <Textarea
          placeholder="Strengths"
          value={form.strengths}
          onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))}
        />
        <Textarea
          placeholder="Improvements"
          value={form.improvements}
          onChange={(e) => setForm((f) => ({ ...f, improvements: e.target.value }))}
        />
        <Textarea
          placeholder="Goals"
          value={form.goals}
          onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))}
        />
        <Button onClick={() => void createReview()}>Save review</Button>
      </PremiumCard>

      <PremiumCard className="space-y-3 p-4">
        <h2 className="text-lg font-semibold">Disciplinary / coaching note</h2>
        <Input
          value={noteForm.actionType}
          onChange={(e) => setNoteForm((f) => ({ ...f, actionType: e.target.value }))}
          placeholder="Action type (coaching, warning, …)"
        />
        <Input
          type="date"
          value={noteForm.actionDate}
          onChange={(e) => setNoteForm((f) => ({ ...f, actionDate: e.target.value }))}
        />
        <Textarea
          placeholder="Description (manager-only)"
          value={noteForm.description}
          onChange={(e) => setNoteForm((f) => ({ ...f, description: e.target.value }))}
        />
        <Button variant="outline" onClick={() => void createDisciplinary()}>
          Record note
        </Button>
      </PremiumCard>

      <PremiumCard className="p-4">
        <h2 className="text-lg font-semibold">Recent reviews</h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-border p-3">
                <p className="font-medium">
                  {r.employeeName ?? r.employeeId} · {r.overallRating ?? "—"}/5 · {r.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.reviewPeriodStart} → {r.reviewPeriodEnd}
                </p>
                {r.goals && <p className="mt-1 text-muted-foreground">Goals: {r.goals}</p>}
              </li>
            ))}
          </ul>
        )}
      </PremiumCard>

      <PremiumCard className="p-4">
        <h2 className="text-lg font-semibold">Disciplinary log</h2>
        {actions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No disciplinary actions recorded.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {actions.map((a) => (
              <li key={a.id} className="rounded-lg border border-border p-3">
                <p className="font-medium">
                  {a.employeeId} · {a.actionType} · {a.actionDate}
                </p>
                <p className="text-muted-foreground">{a.description}</p>
              </li>
            ))}
          </ul>
        )}
      </PremiumCard>
    </div>
  );
}
