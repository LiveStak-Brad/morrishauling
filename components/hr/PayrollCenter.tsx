"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatCard } from "@/components/morris/StatCard";
import type { PayPeriod, PayrollEntry } from "@/types/hr/payroll";
import { Download, Lock, RefreshCw } from "lucide-react";

export function PayrollCenter() {
  const [periods, setPeriods] = useState<PayPeriod[]>([]);
  const [current, setCurrent] = useState<PayPeriod | null>(null);
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/hr/payroll")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setPeriods(d.periods);
          setCurrent(d.current);
          setEntries(d.entries);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const runAction = async (action: string, format?: string) => {
    if (!current) return;
    const res = await fetch("/api/hr/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payPeriodId: current.id, format }),
    });
    const d = await res.json();
    if (d.ok) {
      if (d.csv) setCsvData(d.csv);
      load();
    }
  };

  const downloadCsv = () => {
    if (!csvData) return;
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${current?.startDate}-${current?.endDate}.csv`;
    a.click();
  };

  if (loading) return <p className="text-muted-foreground">Loading payroll…</p>;

  const totalGross = entries.reduce((s, e) => s + e.grossPay, 0);
  const totalNet = entries.reduce((s, e) => s + e.netPay, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => runAction("aggregate")} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Aggregate from Timeclock
        </Button>
        <Button onClick={() => runAction("lock")} variant="outline">
          <Lock className="h-4 w-4 mr-2" /> Lock Period
        </Button>
        <Button onClick={() => runAction("export", "quickbooks")}>
          <Download className="h-4 w-4 mr-2" /> Export QuickBooks CSV
        </Button>
        {csvData && (
          <Button onClick={downloadCsv} variant="secondary">Download CSV</Button>
        )}
      </div>

      {current && (
        <p className="text-sm text-muted-foreground">
          Current period: {current.startDate} – {current.endDate} ({current.status})
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Employees" value={String(entries.length)} />
        <StatCard label="Total Gross" value={`$${totalGross.toFixed(2)}`} />
        <StatCard label="Total Net" value={`$${totalNet.toFixed(2)}`} />
      </div>

      <PremiumCard className="p-4 overflow-x-auto">
        <h3 className="font-semibold mb-3">Payroll Entries</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-4">Employee</th>
              <th className="pb-2 pr-4">Reg Hrs</th>
              <th className="pb-2 pr-4">OT Hrs</th>
              <th className="pb-2 pr-4">Gross</th>
              <th className="pb-2 pr-4">Fed Tax</th>
              <th className="pb-2 pr-4">State Tax</th>
              <th className="pb-2">Net</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-border/40">
                <td className="py-2 pr-4 font-medium">
                  {e.employee ? `${e.employee.firstName} ${e.employee.lastName}` : e.employeeId}
                </td>
                <td className="py-2 pr-4">{e.regularHours}</td>
                <td className="py-2 pr-4">{e.overtimeHours}</td>
                <td className="py-2 pr-4">${e.grossPay.toFixed(2)}</td>
                <td className="py-2 pr-4">${e.federalWithholding.toFixed(2)}</td>
                <td className="py-2 pr-4">${e.stateWithholding.toFixed(2)}</td>
                <td className="py-2">${e.netPay.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PremiumCard>

      <p className="text-xs text-muted-foreground">
        Payroll exports are for data tracking. Consult your licensed payroll provider for tax compliance.
      </p>
    </div>
  );
}
