"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AdvancedJsonEditor,
  SettingsSectionCard,
  useSettingSave,
} from "@/components/admin/settings/shared";
import { normalizeTerms, type TermsConfig } from "@/lib/admin/settings-normalizers";

export function TermsSection({ initial }: { initial: unknown }) {
  const [terms, setTerms] = useState<TermsConfig>(() => normalizeTerms(initial));
  const { saving, save } = useSettingSave();

  useEffect(() => {
    setTerms(normalizeTerms(initial));
  }, [initial]);

  const set = <K extends keyof TermsConfig>(key: K, value: TermsConfig[K]) =>
    setTerms((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <SettingsSectionCard
        title="Estimate disclaimer"
        description="Shown on junk removal estimates before the customer confirms."
        onSave={() => save("terms.config", terms, "Terms & disclaimers")}
        onReset={() => setTerms(normalizeTerms(undefined))}
        saving={saving}
        saveLabel="Save terms"
      >
        <div>
          <Label>Junk removal estimate disclaimer</Label>
          <Textarea
            className="mt-1"
            rows={5}
            value={terms.estimateDisclaimer}
            onChange={(e) => set("estimateDisclaimer", e.target.value)}
          />
        </div>
        <div>
          <Label>Hauling estimate disclaimer</Label>
          <Textarea
            className="mt-1"
            rows={4}
            value={terms.haulingEstimateDisclaimer}
            onChange={(e) => set("haulingEstimateDisclaimer", e.target.value)}
          />
        </div>
        <div>
          <Label>Company terms</Label>
          <Textarea className="mt-1" rows={5} value={terms.companyTerms} onChange={(e) => set("companyTerms", e.target.value)} />
        </div>
        <div>
          <Label>Financing disclaimer</Label>
          <Textarea
            className="mt-1"
            rows={4}
            value={terms.financingDisclaimer}
            onChange={(e) => set("financingDisclaimer", e.target.value)}
          />
        </div>
        <AdvancedJsonEditor
          value={terms}
          onSave={async (v) => {
            await save("terms.config", v, "Terms");
            setTerms(normalizeTerms(v));
          }}
          saving={saving}
        />
      </SettingsSectionCard>
    </>
  );
}
