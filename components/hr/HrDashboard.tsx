"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatCard } from "@/components/morris/StatCard";
import { Button } from "@/components/ui/button";
import type { HrDashboardStats } from "@/types/hr/dashboard";
import {
  Users, UserPlus, AlertTriangle, Clock, Calendar, GraduationCap,
  Shield, Wrench, FileWarning, DollarSign, FlaskConical, Copy, Check,
} from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";

export function HrDashboard() {
  const [stats, setStats] = useState<HrDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<{
    email: string;
    password: string;
    loginUrl: string;
    employeePortalUrl: string;
    created: boolean;
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hr/dashboard")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setStats(d.stats); })
      .finally(() => setLoading(false));
  }, []);

  const createTestEmployee = async () => {
    setCreating(true);
    setTestResult(null);
    setTestError(null);
    try {
      const res = await fetch("/api/hr/employees/create-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employmentType: "w2_full_time" }),
      });
      const d = await res.json();
      if (d.ok) {
        setTestResult(d);
      } else {
        setTestError(d.error ?? `Request failed (${res.status})`);
      }
    } catch {
      setTestError("Network error — could not reach the server.");
    } finally {
      setCreating(false);
    }
  };

  const copyCredentials = () => {
    if (!testResult) return;
    navigator.clipboard.writeText(`Email: ${testResult.email}\nPassword: ${testResult.password}\nLogin: ${window.location.origin}${testResult.loginUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <p className="text-muted-foreground">Loading HR dashboard…</p>;
  if (!stats) return <p className="text-destructive">Failed to load dashboard.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/admin/hr/applicants">View Applicants</ButtonLink>
        <ButtonLink href="/admin/hr/employees" variant="outline">Employee Directory</ButtonLink>
        <ButtonLink href="/admin/hr/payroll" variant="outline">Payroll Center</ButtonLink>
        {process.env.NODE_ENV !== "production" && (
          <Button variant="secondary" onClick={createTestEmployee} disabled={creating}>
            <FlaskConical className="mr-2 h-4 w-4" />
            {creating ? "Creating…" : "Create Brad Test Employee"}
          </Button>
        )}
      </div>

      {testError && (
        <PremiumCard className="p-4 border-red-200 bg-red-50/50">
          <p className="font-semibold text-red-900">Could not create test employee</p>
          <p className="mt-1 text-sm text-red-800">{testError}</p>
          <p className="mt-2 text-xs text-red-700">
            Ensure SUPABASE_DB_PASSWORD is set in .env.local (and restart the dev server).
          </p>
        </PremiumCard>
      )}

      {testResult && (
        <PremiumCard className="p-4 border-green-200 bg-green-50/50">
          <h3 className="font-semibold text-green-900">
            {testResult.created ? "Test employee created" : "Test employee ready"}
          </h3>
          <p className="mt-2 text-sm">Email: <strong>{testResult.email}</strong></p>
          <p className="text-sm">Password: <strong>{testResult.password}</strong></p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={copyCredentials}>
              {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
              Copy credentials
            </Button>
            <ButtonLink href={testResult.loginUrl}>Open login</ButtonLink>
            <ButtonLink variant="outline" href={testResult.employeePortalUrl}>Employee portal</ButtonLink>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Onboarding tasks and W-2 documents assigned. Log in as this user to test clock-in and employee portal.
          </p>
        </PremiumCard>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Applicants" value={String(stats.applicants.total)} icon={Users} />
        <StatCard label="New This Week" value={String(stats.applicants.newThisWeek)} icon={UserPlus} />
        <StatCard label="Active Employees" value={String(stats.employees.active)} icon={Users} />
        <StatCard label="In Onboarding" value={String(stats.employees.onboarding)} icon={UserPlus} />
      </div>

      <PremiumCard className="p-4">
        <h3 className="font-semibold mb-3">Live Alerts</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AlertItem icon={AlertTriangle} label="Expiring Licenses" value={stats.alerts.expiringLicenses} href="/admin/hr/compliance" />
          <AlertItem icon={UserPlus} label="Missing Onboarding" value={stats.alerts.missingOnboarding} href="/admin/hr/onboarding" />
          <AlertItem icon={Clock} label="Clocked In Now" value={stats.alerts.clockedIn} href="/admin/hr/time" />
          <AlertItem icon={Calendar} label="On Vacation" value={stats.alerts.onVacation} href="/admin/hr/schedule" />
          <AlertItem icon={GraduationCap} label="Training Expiring" value={stats.alerts.trainingExpiring} href="/admin/hr/training" />
          <AlertItem icon={Shield} label="Workers Comp Alerts" value={stats.alerts.workersCompAlerts} href="/admin/hr/compliance" />
          <AlertItem icon={Wrench} label="Equipment Not Returned" value={stats.alerts.equipmentNotReturned} href="/admin/hr/equipment" />
          <AlertItem icon={FileWarning} label="Outstanding Write-ups" value={stats.alerts.outstandingWriteUps} href="/admin/hr/performance" />
          <AlertItem icon={DollarSign} label="Payroll Due" value={stats.alerts.payrollDue ? 1 : 0} href="/admin/hr/payroll" />
        </div>
      </PremiumCard>

      <PremiumCard className="p-4">
        <h3 className="font-semibold mb-3">Applicant Pipeline</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.applicants.byStatus).map(([status, count]) => (
            <Link
              key={status}
              href={`/admin/hr/applicants?status=${status}`}
              className="rounded-full border px-3 py-1 text-sm hover:bg-muted"
            >
              {status.replace(/_/g, " ")}: <strong>{count}</strong>
            </Link>
          ))}
        </div>
      </PremiumCard>

      <p className="text-xs text-muted-foreground">
        This system tracks workforce data. Consult your CPA or payroll provider for tax filing compliance.
      </p>
    </div>
  );
}

function AlertItem({ icon: Icon, label, value, href }: { icon: typeof Users; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10">
        <Icon className="h-5 w-5 text-brand-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Link>
  );
}
