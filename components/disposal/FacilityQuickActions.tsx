"use client";

import { Phone, MapPin, Star, Ban, Clock, DollarSign, StickyNote, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { DisposalFacility } from "@/types/disposal-management";

export function FacilityQuickActions({
  facility,
  onChange,
  onSave,
  onScrollPricing,
}: {
  facility: DisposalFacility;
  onChange: (f: DisposalFacility) => void;
  onSave: (f?: DisposalFacility) => void;
  onScrollPricing?: () => void;
}) {
  const mapsUrl = facility.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${facility.location.lat},${facility.location.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${facility.address}, ${facility.city ?? ""}`)}`;

  return (
    <div className="flex flex-wrap gap-2 rounded-xl border bg-muted/30 p-3">
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
        <Button size="sm" variant="outline">
          <MapPin className="mr-1.5 h-4 w-4" /> Maps
        </Button>
      </a>
      {facility.phone && (
        <a href={`tel:${facility.phone.replace(/\D/g, "")}`}>
          <Button size="sm" variant="outline">
            <Phone className="mr-1.5 h-4 w-4" /> Call
          </Button>
        </a>
      )}
      <Link href="/admin/disposal-review">
        <Button size="sm" variant="outline">
          <ClipboardList className="mr-1.5 h-4 w-4" /> Review queue
        </Button>
      </Link>
      <Button
        size="sm"
        variant={facility.isPreferredVendor ? "default" : "outline"}
        onClick={() => {
          const updated = { ...facility, isPreferredVendor: !facility.isPreferredVendor };
          onChange(updated);
          onSave(updated);
        }}
      >
        <Star className="mr-1.5 h-4 w-4" /> Preferred
      </Button>
      <Button
        size="sm"
        variant={facility.isAvoidVendor ? "destructive" : "outline"}
        onClick={() => {
          const updated = { ...facility, isAvoidVendor: !facility.isAvoidVendor };
          onChange(updated);
          onSave(updated);
        }}
      >
        <Ban className="mr-1.5 h-4 w-4" /> Avoid
      </Button>
      <label className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm">
        <Switch
          checked={facility.isClosed}
          onCheckedChange={(v) => onChange({ ...facility, isClosed: v })}
        />
        <Clock className="h-4 w-4 text-muted-foreground" />
        Closed
      </label>
      {onScrollPricing && (
        <Button size="sm" variant="ghost" onClick={onScrollPricing}>
          <DollarSign className="mr-1.5 h-4 w-4" /> Pricing
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => document.getElementById("facility-internal-notes")?.focus()}
      >
        <StickyNote className="mr-1.5 h-4 w-4" /> Note
      </Button>
    </div>
  );
}
