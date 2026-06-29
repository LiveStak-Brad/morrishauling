"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import {
  AdvancedJsonEditor,
  FieldGrid,
  SettingsSectionCard,
  useSettingSave,
} from "@/components/admin/settings/shared";
import { normalizeBranding, type BrandingConfig } from "@/lib/admin/settings-normalizers";

export function BrandingSection({ initial }: { initial: unknown }) {
  const [branding, setBranding] = useState<BrandingConfig>(() => normalizeBranding(initial));
  const { saving, save } = useSettingSave();

  useEffect(() => {
    setBranding(normalizeBranding(initial));
  }, [initial]);

  const set = <K extends keyof BrandingConfig>(key: K, value: BrandingConfig[K]) =>
    setBranding((prev) => ({ ...prev, [key]: value }));

  const setColor = (key: keyof BrandingConfig["brandColors"], value: string) =>
    setBranding((prev) => ({ ...prev, brandColors: { ...prev.brandColors, [key]: value } }));

  return (
    <>
      <SettingsSectionCard
        title="Logo & images"
        description="Public-facing brand assets. Use a path under /public or a full URL."
        onSave={() => save("branding.config", branding, "Branding")}
        saving={saving}
        saveLabel="Save branding"
        onReset={() => setBranding(normalizeBranding(undefined))}
      >
        <div className="flex items-center gap-4 rounded-lg border p-4">
          <CompanyLogo height={64} width={64} className="!h-16 !w-16 shrink-0" />
          <div className="flex-1 space-y-3">
            <div>
              <Label>Logo URL or path</Label>
              <Input className="mt-1" value={branding.logo} onChange={(e) => set("logo", e.target.value)} placeholder="/logo.png" />
            </div>
            <div>
              <Label>Hero banner (desktop)</Label>
              <Input className="mt-1" value={branding.heroBanner} onChange={(e) => set("heroBanner", e.target.value)} placeholder="/banner.png" />
            </div>
            <div>
              <Label>Hero banner (mobile, optional)</Label>
              <Input
                className="mt-1"
                value={branding.heroBannerMobile}
                onChange={(e) => set("heroBannerMobile", e.target.value)}
                placeholder="/banner-mobile.png"
              />
            </div>
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Contact & location"
        description="Phone, email, and address shown across the site and documents."
        onSave={() => save("branding.config", branding, "Branding")}
        saving={saving}
        saveLabel="Save contact info"
      >
        <FieldGrid>
          <div>
            <Label>Phone</Label>
            <Input className="mt-1" value={branding.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" className="mt-1" value={branding.email} onChange={(e) => set("email", e.target.value)} />
          </div>
        </FieldGrid>
        <div>
          <Label>Company address</Label>
          <Textarea className="mt-1" rows={2} value={branding.companyAddress} onChange={(e) => set("companyAddress", e.target.value)} />
        </div>
        <div>
          <Label>Service area copy</Label>
          <Textarea
            className="mt-1"
            rows={2}
            value={branding.serviceAreaCopy}
            onChange={(e) => set("serviceAreaCopy", e.target.value)}
            placeholder="Warren, Lincoln & St. Charles Counties…"
          />
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Brand colors"
        description="Theme colors applied across customer and admin experiences."
        onSave={() => save("branding.config", branding, "Branding")}
        saving={saving}
        saveLabel="Save colors"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(branding.brandColors) as (keyof BrandingConfig["brandColors"])[]).map((key) => (
            <div key={key} className="flex items-center gap-3 rounded-lg border p-3">
              <input
                type="color"
                value={branding.brandColors[key]}
                onChange={(e) => setColor(key, e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <div className="flex-1">
                <Label className="capitalize">{key}</Label>
                <Input className="mt-1 font-mono text-xs" value={branding.brandColors[key]} onChange={(e) => setColor(key, e.target.value)} />
              </div>
            </div>
          ))}
        </div>
        <AdvancedJsonEditor
          value={branding}
          onSave={async (v) => {
            await save("branding.config", v, "Branding");
            setBranding(normalizeBranding(v));
          }}
          saving={saving}
        />
      </SettingsSectionCard>
    </>
  );
}
