"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatCard } from "@/components/morris/StatCard";
import { MiniBarChart } from "@/components/morris/Charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  FacilityAccessTypeSelect,
  FacilityClosureToggle,
  FacilityGpsInputs,
  FacilityHoursBuilder,
  FacilityMapEmbed,
  FacilityRestrictionsForm,
  MaterialCategorySelector,
} from "@/components/disposal/FacilityFormSections";
import { formatTodayHours, isFacilityOpenNow } from "@/lib/disposal/facility-hours";
import type { DisposalFacility, FacilityHistoricalStats } from "@/types/disposal-management";
import { ArrowLeft, Clock, DollarSign, MapPin, Star, TrendingUp } from "lucide-react";
import { toast } from "@/lib/toast";
import { StatusChip } from "@/components/morris/StatusChip";
import { FacilityQuickActions } from "@/components/disposal/FacilityQuickActions";
import { useRef } from "react";

export default function DisposalFacilityProfilePage() {
  const params = useParams();
  const id = String(params.id);
  const [facility, setFacility] = useState<DisposalFacility | null>(null);
  const [stats, setStats] = useState<FacilityHistoricalStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<
    Array<{ jobId: string; actualCost: number; completedAt: string; waitMinutes?: number; unloadMinutes?: number; receiptSignedUrl?: string }>
  >([]);
  const [saving, setSaving] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/admin/disposal/sites/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setFacility(d.facility);
          setStats(d.stats);
          setRecentJobs(d.recentJobs ?? []);
        }
      });
  }, [id]);

  const save = async (override?: DisposalFacility) => {
    const toSave = override ?? facility;
    if (!toSave) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/disposal/sites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: toSave }),
      });
      const d = await res.json();
      if (d.ok) {
        setFacility(d.facility);
        toast.success("Facility saved");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!facility) {
    return (
      <AdminPageShell title="Facility profile">
        <p className="text-muted-foreground">Loading…</p>
      </AdminPageShell>
    );
  }

  const openNow = isFacilityOpenNow(facility.hoursJson, facility.isClosed, facility.holidayClosures);

  return (
    <AdminPageShell
      title={facility.name}
      description={`${facility.county ? `${facility.county} County · ` : ""}${facility.accessType}`}
      action={
        <Link href="/admin/dump-sites">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <StatusChip label={openNow ? "Open now" : "Closed"} variant={openNow ? "success" : "neutral"} />
            {facility.isPreferredVendor && (
              <StatusChip label="Preferred vendor" variant="warning" />
            )}
            {facility.isAvoidVendor && <StatusChip label="Avoid" variant="urgent" />}
            {facility.isFavorite && <StatusChip label="Favorite" variant="info" />}
            {facility.isClosed && <StatusChip label="Temporarily closed" variant="urgent" />}
          </div>

          <FacilityQuickActions
            facility={facility}
            onChange={setFacility}
            onSave={() => void save()}
            onScrollPricing={() => pricingRef.current?.scrollIntoView({ behavior: "smooth" })}
          />

          {stats && stats.jobCount > 0 && (
            <div className="grid gap-3 sm:grid-cols-4">
              <StatCard label="Jobs" value={stats.jobCount} icon={TrendingUp} />
              <StatCard label="Avg cost" value={`$${stats.avgActualCost}`} icon={DollarSign} />
              <StatCard label="Total spent" value={`$${stats.totalSpent.toLocaleString()}`} icon={DollarSign} />
              <StatCard label="Rec. accept rate" value={`${stats.recommendationAcceptRate}%`} icon={Star} />
            </div>
          )}

          <PremiumCard className="space-y-3 p-5">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Location & map
            </h3>
            <FacilityMapEmbed facility={facility} />
            <FacilityGpsInputs facility={facility} onChange={setFacility} />
          </PremiumCard>

          <PremiumCard className="space-y-4 p-5">
            <h3 className="font-semibold">General information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={facility.name} onChange={(e) => setFacility({ ...facility, name: e.target.value })} />
              </div>
              <div>
                <Label>County</Label>
                <Input value={facility.county ?? ""} onChange={(e) => setFacility({ ...facility, county: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Input value={facility.address} onChange={(e) => setFacility({ ...facility, address: e.target.value })} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={facility.city ?? ""} onChange={(e) => setFacility({ ...facility, city: e.target.value })} />
              </div>
              <div>
                <Label>ZIP</Label>
                <Input value={facility.zip ?? ""} onChange={(e) => setFacility({ ...facility, zip: e.target.value })} />
              </div>
              <div>
                <Label>Access type</Label>
                <FacilityAccessTypeSelect
                  value={facility.accessType}
                  onChange={(v) => setFacility({ ...facility, accessType: v })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={facility.phone ?? ""} onChange={(e) => setFacility({ ...facility, phone: e.target.value })} />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={facility.website ?? ""} onChange={(e) => setFacility({ ...facility, website: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={facility.isPreferredVendor}
                  onCheckedChange={(v) => setFacility({ ...facility, isPreferredVendor: v })}
                />
                Preferred vendor
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={facility.isFavorite}
                  onCheckedChange={(v) => setFacility({ ...facility, isFavorite: v })}
                />
                Favorite
              </label>
            </div>
            <FacilityClosureToggle facility={facility} onChange={setFacility} />
          </PremiumCard>

          <PremiumCard className="space-y-3 p-5">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" /> Hours of operation
            </h3>
            <p className="text-xs text-muted-foreground">Today: {formatTodayHours(facility.hoursJson)}</p>
            <FacilityHoursBuilder
              hours={facility.hoursJson}
              onChange={(hoursJson) => setFacility({ ...facility, hoursJson })}
            />
          </PremiumCard>

          <PremiumCard className="space-y-3 p-5">
            <h3 className="font-semibold">Accepted materials</h3>
            <MaterialCategorySelector
              selected={facility.acceptedMaterials}
              onChange={(acceptedMaterials) => setFacility({ ...facility, acceptedMaterials })}
              rejected={facility.rejectedMaterials ?? []}
              onRejectedChange={(rejectedMaterials) => setFacility({ ...facility, rejectedMaterials })}
            />
          </PremiumCard>

          <PremiumCard className="space-y-3 p-5">
            <h3 className="font-semibold">Restrictions & load limits</h3>
            <FacilityRestrictionsForm facility={facility} onChange={setFacility} />
          </PremiumCard>

        <div ref={pricingRef}>
        <PremiumCard className="space-y-3 p-5">
          <h3 className="font-semibold">Pricing & performance</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Base fee ($)</Label>
                <Input
                  type="number"
                  value={facility.baseFee}
                  onChange={(e) => setFacility({ ...facility, baseFee: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Per ton ($)</Label>
                <Input
                  type="number"
                  value={facility.perTonFee ?? ""}
                  onChange={(e) => setFacility({ ...facility, perTonFee: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Minimum ($)</Label>
                <Input
                  type="number"
                  value={facility.minimumFee}
                  onChange={(e) => setFacility({ ...facility, minimumFee: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Avg wait (min)</Label>
                <Input
                  type="number"
                  value={facility.avgWaitMinutes ?? ""}
                  onChange={(e) => setFacility({ ...facility, avgWaitMinutes: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Avg unload (min)</Label>
                <Input
                  type="number"
                  value={facility.avgUnloadMinutes ?? ""}
                  onChange={(e) => setFacility({ ...facility, avgUnloadMinutes: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Vendor rating (1–5)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={1}
                  max={5}
                  value={facility.vendorRating ?? ""}
                  onChange={(e) => setFacility({ ...facility, vendorRating: Number(e.target.value) })}
                />
              </div>
            </div>
          </PremiumCard>
        </div>

          <PremiumCard className="space-y-3 p-5">
            <h3 className="font-semibold">Internal notes</h3>
          <Textarea
            id="facility-internal-notes"
            rows={4}
              value={facility.internalNotes ?? ""}
              onChange={(e) => setFacility({ ...facility, internalNotes: e.target.value })}
              placeholder="Vendor relationship, gate codes, best days to visit…"
            />
            <Textarea
              rows={2}
              value={facility.notes ?? ""}
              onChange={(e) => setFacility({ ...facility, notes: e.target.value })}
              placeholder="Public-facing notes for dispatch"
            />
          </PremiumCard>

          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save facility"}
          </Button>
        </div>

        <div className="space-y-6">
          {stats && stats.jobCount >= 3 && (
            <PremiumCard className="space-y-3 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Historical performance
              </h3>
              <MiniBarChart
                title="Avg wait vs unload (min)"
                data={[
                  { label: "Wait", value: stats.avgWaitMinutes },
                  { label: "Unload", value: stats.avgUnloadMinutes },
                  { label: "Drive", value: stats.avgDriveMinutes },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                Based on {stats.jobCount} recorded disposal events. Recommendations use this data when available.
              </p>
            </PremiumCard>
          )}

          {recentJobs.length > 0 && (
            <PremiumCard className="space-y-3 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Recent jobs & receipts
              </h3>
              <ul className="divide-y text-sm">
                {recentJobs.map((j) => (
                  <li key={j.jobId} className="flex items-center justify-between py-2.5">
                    <div>
                      <Link href={`/admin/jobs`} className="font-medium hover:text-brand-primary">
                        Job {j.jobId.slice(0, 8)}…
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {new Date(j.completedAt).toLocaleDateString()}
                        {j.waitMinutes != null && ` · ${j.waitMinutes}m wait`}
                        {j.unloadMinutes != null && ` · ${j.unloadMinutes}m unload`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${j.actualCost}</p>
                      {j.receiptSignedUrl && (
                        <a
                          href={j.receiptSignedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-primary hover:underline"
                        >
                          Receipt
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </PremiumCard>
          )}

          <PremiumCard className="space-y-2 p-5 text-sm">
            <h3 className="font-semibold">Quick reference</h3>
            <dl className="space-y-1.5 text-muted-foreground">
              <div className="flex justify-between">
                <dt>Fee type</dt>
                <dd className="font-medium capitalize text-foreground">{facility.feeType}</dd>
              </div>
              {facility.weightLimitTons && (
                <div className="flex justify-between">
                  <dt>Weight limit</dt>
                  <dd className="font-medium text-foreground">{facility.weightLimitTons} tons</dd>
                </div>
              )}
              {facility.maxLoadSize && (
                <div className="flex justify-between">
                  <dt>Max load</dt>
                  <dd className="font-medium text-foreground">{facility.maxLoadSize}</dd>
                </div>
              )}
            </dl>
          </PremiumCard>
        </div>
      </div>
    </AdminPageShell>
  );
}
