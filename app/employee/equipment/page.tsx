"use client";

import { useEffect, useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { EmployeeAssetSummary } from "@/types/hr/equipment";
import { Wrench, AlertTriangle, PenLine } from "lucide-react";
import { toast } from "@/lib/toast";

export default function EmployeeEquipmentPage() {
  const [assets, setAssets] = useState<EmployeeAssetSummary[]>([]);
  const [ackCheckout, setAckCheckout] = useState<EmployeeAssetSummary | null>(null);
  const [reportAsset, setReportAsset] = useState<EmployeeAssetSummary | null>(null);
  const [signatureName, setSignatureName] = useState("");
  const [condition, setCondition] = useState("good");
  const [severity, setSeverity] = useState<"minor" | "moderate" | "major">("moderate");
  const [notes, setNotes] = useState("");

  const load = () => {
    fetch("/api/me/equipment")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setAssets(d.assets ?? []);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const submitAck = async () => {
    if (!ackCheckout?.checkout) return;
    const res = await fetch("/api/me/equipment/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkoutEventId: ackCheckout.checkout.id,
        signatureName,
        conditionConfirmed: condition,
      }),
    });
    const d = await res.json();
    if (d.ok) {
      toast.success("Checkout acknowledged");
      setAckCheckout(null);
      setSignatureName("");
      load();
    } else {
      toast.error(d.error ?? "Failed");
    }
  };

  const submitReport = async () => {
    if (!reportAsset) return;
    const res = await fetch("/api/me/equipment/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: reportAsset.asset.id,
        checkoutEventId: reportAsset.checkout?.id,
        severity,
        notes,
      }),
    });
    const d = await res.json();
    if (d.ok) {
      toast.success("Damage report submitted");
      setReportAsset(null);
      setNotes("");
      load();
    } else {
      toast.error(d.error ?? "Report failed");
    }
  };

  const requestReturn = async (checkoutId: string) => {
    const res = await fetch("/api/me/equipment/return", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkoutEventId: checkoutId }),
    });
    const d = await res.json();
    if (d.ok) {
      toast.success("Return requested");
      load();
    } else {
      toast.error(d.error ?? "Failed");
    }
  };

  return (
    <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">My Equipment</h1>

      {assets.length === 0 ? (
        <PremiumCard className="p-6 text-center text-muted-foreground">
          <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No assets assigned yet. Check with your manager.
        </PremiumCard>
      ) : (
        assets.map((item) => (
          <PremiumCard key={item.asset.id} className="p-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="font-medium">{item.asset.name}</p>
                <p className="text-xs text-muted-foreground">{item.asset.assetId}</p>
                <p className="text-sm text-muted-foreground capitalize">{item.asset.category}</p>
                <Badge variant="outline" className="mt-2 capitalize">
                  {item.asset.condition}
                </Badge>
              </div>
              {item.needsAcknowledgment && (
                <Badge variant="destructive">Sign required</Badge>
              )}
            </div>
            <div className="flex flex-col gap-2 mt-3">
              {item.needsAcknowledgment && (
                <Button size="sm" onClick={() => setAckCheckout(item)}>
                  <PenLine className="mr-2 h-4 w-4" /> Acknowledge checkout
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setReportAsset(item)}>
                <AlertTriangle className="mr-2 h-4 w-4" /> Report damage
              </Button>
              {item.checkout && !item.checkout.returnRequestedAt && (
                <Button variant="ghost" size="sm" onClick={() => requestReturn(item.checkout!.id)}>
                  Request return
                </Button>
              )}
            </div>
          </PremiumCard>
        ))
      )}

      <Dialog open={!!ackCheckout} onOpenChange={(o) => !o && setAckCheckout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Equipment checkout agreement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            I accept responsibility for this asset and will report damage promptly.
          </p>
          <div className="space-y-3">
            <div>
              <Label>Condition received</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm mt-1"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                {["excellent", "good", "fair", "poor"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Full name (signature)</Label>
              <input
                className="w-full border rounded px-3 py-2 text-sm mt-1"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitAck} disabled={!signatureName.trim()}>
              Sign & confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reportAsset} onOpenChange={(o) => !o && setReportAsset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report damage — {reportAsset?.asset.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["minor", "moderate", "major"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={severity === s ? "default" : "outline"}
                  onClick={() => setSeverity(s)}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe damage…" />
          </div>
          <DialogFooter>
            <Button onClick={submitReport}>Submit report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
