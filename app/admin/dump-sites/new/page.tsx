"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FacilityAccessTypeSelect,
  FacilityGpsInputs,
  FacilityHoursBuilder,
  MaterialCategorySelector,
} from "@/components/disposal/FacilityFormSections";
import type { DisposalFacility } from "@/types/disposal-management";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toast";

const EMPTY: DisposalFacility = {
  id: "",
  name: "",
  address: "",
  city: "",
  state: "MO",
  accessType: "both",
  acceptedMaterials: ["mixed_junk", "general_junk"],
  feeType: "flat",
  baseFee: 45,
  minimumFee: 40,
  status: "active",
  isClosed: false,
};

export default function NewDisposalFacilityPage() {
  const router = useRouter();
  const [facility, setFacility] = useState<DisposalFacility>(EMPTY);
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!facility.name.trim() || !facility.address.trim()) {
      toast.error("Name and address are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/disposal/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facility }),
      });
      const d = await res.json();
      if (d.ok) {
        toast.success("Facility created");
        router.push(`/admin/dump-sites/${d.facility.id}`);
      } else {
        toast.error(d.error ?? "Failed to create");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageShell
      title="Add disposal facility"
      description="Create a new facility for routing and recommendations"
      action={
        <Link href="/admin/dump-sites">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </Link>
      }
    >
      <div className="max-w-4xl space-y-6">
        <PremiumCard className="space-y-4 p-5">
          <h3 className="font-semibold">General information</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Facility name</Label>
              <Input
                value={facility.name}
                onChange={(e) => setFacility({ ...facility, name: e.target.value })}
                placeholder="e.g. St. Charles Recycle Works"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Input
                value={facility.address}
                onChange={(e) => setFacility({ ...facility, address: e.target.value })}
              />
            </div>
            <div>
              <Label>City</Label>
              <Input value={facility.city ?? ""} onChange={(e) => setFacility({ ...facility, city: e.target.value })} />
            </div>
            <div>
              <Label>County</Label>
              <Input value={facility.county ?? ""} onChange={(e) => setFacility({ ...facility, county: e.target.value })} />
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
        </PremiumCard>

        <PremiumCard className="space-y-3 p-5">
          <h3 className="font-semibold">GPS coordinates</h3>
          <p className="text-xs text-muted-foreground">Required for distance and drive-time recommendations.</p>
          <FacilityGpsInputs facility={facility} onChange={setFacility} />
        </PremiumCard>

        <PremiumCard className="space-y-3 p-5">
          <h3 className="font-semibold">Hours of operation</h3>
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
          />
        </PremiumCard>

        <PremiumCard className="space-y-3 p-5">
          <h3 className="font-semibold">Pricing</h3>
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
          </div>
        </PremiumCard>

        <Button onClick={() => void create()} disabled={saving}>
          {saving ? "Creating…" : "Create facility"}
        </Button>
      </div>
    </AdminPageShell>
  );
}
