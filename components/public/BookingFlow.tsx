"use client";

import { useState } from "react";
import type { ServiceType } from "@/types/hauling";
import { ServiceLinePicker } from "@/components/public/ServiceLinePicker";
import { BookingWizard } from "@/components/public/BookingWizard";
import { HaulingTransportWizard } from "@/components/public/HaulingTransportWizard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BookingFlow({ demoMode = false }: { demoMode?: boolean }) {
  const [line, setLine] = useState<ServiceType | null>(null);

  if (!line) {
    return <ServiceLinePicker onSelect={setLine} />;
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1 text-muted-foreground"
        onClick={() => setLine(null)}
      >
        <ArrowLeft className="h-4 w-4" />
        Change service type
      </Button>
      {line === "junk_removal" ? (
        <BookingWizard demoMode={demoMode} />
      ) : (
        <HaulingTransportWizard demoMode={demoMode} />
      )}
    </div>
  );
}
