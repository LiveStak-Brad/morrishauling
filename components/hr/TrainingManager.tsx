"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TrainingCourse, TrainingMatrixRow } from "@/types/hr/training";
import { toast } from "@/lib/toast";
import { format, parseISO } from "date-fns";
import { EmployeeSelector } from "@/components/hr/EmployeeSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function statusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "overdue":
    case "expired":
      return "bg-red-100 text-red-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function TrainingManager() {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [matrix, setMatrix] = useState<TrainingMatrixRow[]>([]);
  const [overdue, setOverdue] = useState<
    Array<{ employeeId: string; employeeName: string; courseId: string; courseName: string; dueDate?: string }>
  >([]);
  const [expiring, setExpiring] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseForm, setCourseForm] = useState({
    id: "",
    name: "",
    description: "",
    category: "",
    isRequired: false,
    isActive: true,
    passingScorePercent: 80,
  });
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [retrainForm, setRetrainForm] = useState({
    employeeId: "",
    courseId: "",
    reason: "",
    dueDate: "",
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/hr/training/courses").then((r) => r.json()),
      fetch("/api/hr/training/matrix").then((r) => r.json()),
      fetch("/api/hr/training/overdue").then((r) => r.json()),
      fetch("/api/hr/training/overdue?type=expiring&days=60").then((r) => r.json()),
    ])
      .then(([c, m, o, e]) => {
        if (c.ok) setCourses(c.courses ?? []);
        if (m.ok) setMatrix(m.matrix ?? []);
        if (o.ok) setOverdue(o.overdue ?? []);
        if (e.ok) setExpiring(e.expiring ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const submitRetraining = async () => {
    const res = await fetch("/api/hr/training/retraining", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(retrainForm),
    });
    const d = await res.json();
    if (d.ok) {
      toast.success("Retraining assigned");
      setRetrainForm({ employeeId: "", courseId: "", reason: "", dueDate: "" });
      load();
    } else {
      toast.error(d.error ?? "Failed");
    }
  };

  const saveCourse = async () => {
    const res = await fetch("/api/hr/training/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseForm),
    });
    const d = await res.json();
    if (d.ok) {
      toast.success(courseForm.id ? "Course updated" : "Course created");
      setShowCourseForm(false);
      setCourseForm({
        id: "",
        name: "",
        description: "",
        category: "",
        isRequired: false,
        isActive: true,
        passingScorePercent: 80,
      });
      load();
    } else {
      toast.error(d.error ?? "Failed");
    }
  };

  const editCourse = (c: TrainingCourse) => {
    setCourseForm({
      id: c.id,
      name: c.name,
      description: c.description ?? "",
      category: c.category ?? "",
      isRequired: c.isRequired,
      isActive: c.isActive,
      passingScorePercent: c.passingScorePercent,
    });
    setShowCourseForm(true);
  };

  const archiveCourse = async (c: TrainingCourse) => {
    const res = await fetch("/api/hr/training/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, name: c.name, isActive: false }),
    });
    const d = await res.json();
    if (d.ok) {
      toast.success("Course archived");
      load();
    } else {
      toast.error(d.error ?? "Failed");
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading training manager…</p>;

  return (
    <Tabs defaultValue="courses">
      <TabsList className="mb-4 flex-wrap h-auto">
        <TabsTrigger value="courses">Courses</TabsTrigger>
        <TabsTrigger value="compliance">Compliance</TabsTrigger>
        <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
        <TabsTrigger value="retraining">Retraining</TabsTrigger>
      </TabsList>

      <TabsContent value="courses">
        <div className="mb-4 flex gap-2">
          <Button size="sm" onClick={() => { setShowCourseForm(true); setCourseForm({ id: "", name: "", description: "", category: "", isRequired: false, isActive: true, passingScorePercent: 80 }); }}>
            New course
          </Button>
        </div>
        {showCourseForm && (
          <PremiumCard className="p-4 mb-4 max-w-lg space-y-3">
            <p className="font-medium">{courseForm.id ? "Edit course" : "New course"}</p>
            <div><Label>Name</Label><Input value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} /></div>
            <div><Label>Category</Label><Input value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} /></div>
            <div><Label>Passing score %</Label><Input type="number" value={courseForm.passingScorePercent} onChange={(e) => setCourseForm({ ...courseForm, passingScorePercent: Number(e.target.value) })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={courseForm.isRequired} onChange={(e) => setCourseForm({ ...courseForm, isRequired: e.target.checked })} /> Required</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={courseForm.isActive} onChange={(e) => setCourseForm({ ...courseForm, isActive: e.target.checked })} /> Active</label>
            <div className="flex gap-2">
              <Button onClick={() => void saveCourse()}>Save</Button>
              <Button variant="outline" onClick={() => setShowCourseForm(false)}>Cancel</Button>
            </div>
          </PremiumCard>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <PremiumCard key={c.id} className="p-4">
              <div className="flex justify-between items-start gap-2">
                <p className="font-medium">{c.name}</p>
                {c.isActive ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {c.isRequired && <Badge variant="secondary">Required</Badge>}
                {c.category && <Badge variant="outline">{c.category}</Badge>}
                <Badge variant="outline">Pass {c.passingScorePercent}%</Badge>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => editCourse(c)}>Edit</Button>
                {c.isActive && (
                  <Button size="sm" variant="ghost" onClick={() => void archiveCourse(c)}>Archive</Button>
                )}
              </div>
            </PremiumCard>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="compliance">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2 sticky left-0 bg-background">Employee</th>
                {courses.filter((c) => c.isRequired).map((c) => (
                  <th key={c.id} className="p-2 text-xs font-medium max-w-[100px] truncate" title={c.name}>
                    {c.name.split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.employeeId} className="border-b">
                  <td className="p-2 font-medium sticky left-0 bg-background">{row.employeeName}</td>
                  {courses
                    .filter((c) => c.isRequired)
                    .map((c) => {
                      const cell = row.courses.find((x) => x.courseId === c.id);
                      return (
                        <td key={c.id} className="p-1">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] capitalize ${statusColor(cell?.status ?? "not_started")}`}
                            title={
                              cell?.completedAt
                                ? `Done ${format(parseISO(cell.completedAt), "MMM d, yyyy")}`
                                : cell?.status
                            }
                          >
                            {(cell?.status ?? "not_started").replace("_", " ")}
                          </span>
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {expiring.length > 0 && (
          <PremiumCard className="p-4 mt-4">
            <p className="font-medium mb-2">Expiring within 60 days</p>
            <ul className="text-sm space-y-1">
              {expiring.slice(0, 10).map((e, i) => {
                const emp = e.employees as { first_name?: string; last_name?: string } | null;
                const course = e.training_courses as { name?: string } | null;
                return (
                  <li key={i}>
                    {emp?.first_name} {emp?.last_name} — {course?.name} (expires {String(e.expires_at)})
                  </li>
                );
              })}
            </ul>
          </PremiumCard>
        )}
      </TabsContent>

      <TabsContent value="overdue">
        {overdue.length === 0 ? (
          <p className="text-muted-foreground">No overdue training.</p>
        ) : (
          <div className="space-y-2">
            {overdue.map((o, i) => (
              <PremiumCard key={i} className="p-3 flex justify-between items-center text-sm">
                <span>
                  <strong>{o.employeeName}</strong> — {o.courseName}
                </span>
                {o.dueDate && <Badge variant="destructive">Due {o.dueDate}</Badge>}
              </PremiumCard>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="retraining">
        <PremiumCard className="p-4 max-w-md space-y-3">
          <p className="font-medium">Incident-based retraining</p>
          <EmployeeSelector value={retrainForm.employeeId} onChange={(id) => setRetrainForm((f) => ({ ...f, employeeId: id }))} />
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={retrainForm.courseId}
            onChange={(e) => setRetrainForm((f) => ({ ...f, courseId: e.target.value }))}
          >
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Reason"
            rows={3}
            value={retrainForm.reason}
            onChange={(e) => setRetrainForm((f) => ({ ...f, reason: e.target.value }))}
          />
          <input
            type="date"
            className="w-full border rounded px-3 py-2 text-sm"
            value={retrainForm.dueDate}
            onChange={(e) => setRetrainForm((f) => ({ ...f, dueDate: e.target.value }))}
          />
          <Button onClick={submitRetraining} className="w-full">
            Assign retraining
          </Button>
        </PremiumCard>
      </TabsContent>
    </Tabs>
  );
}
