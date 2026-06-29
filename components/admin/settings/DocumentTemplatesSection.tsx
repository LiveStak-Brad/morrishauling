"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AdvancedJsonEditor,
  FieldGrid,
  SettingsSectionCard,
  useSettingSave,
} from "@/components/admin/settings/shared";
import {
  documentTemplatesForSave,
  normalizeDocumentTemplates,
  type DocumentTemplateConfig,
} from "@/lib/admin/settings-normalizers";
import { Archive, Plus } from "lucide-react";

function TemplateCard({
  template,
  onChange,
  onArchive,
}: {
  template: DocumentTemplateConfig;
  onChange: (next: DocumentTemplateConfig) => void;
  onArchive: () => void;
}) {
  const setApplies = (key: keyof DocumentTemplateConfig["appliesTo"], value: boolean) =>
    onChange({ ...template, appliesTo: { ...template.appliesTo, [key]: value } });

  return (
    <div className={`rounded-lg border p-4 space-y-4 ${!template.active ? "opacity-60 bg-muted/30" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="font-medium">{template.label || template.templateType}</p>
          {!template.active ? <Badge variant="secondary">Archived</Badge> : null}
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onArchive}>
          <Archive className="mr-1 h-3 w-3" />
          {template.active ? "Archive" : "Restore"}
        </Button>
      </div>

      <FieldGrid>
        <div>
          <Label>Template type</Label>
          <Input
            className="mt-1 font-mono text-sm"
            value={template.templateType}
            onChange={(e) => onChange({ ...template, templateType: e.target.value, id: e.target.value })}
          />
        </div>
        <div>
          <Label>Label</Label>
          <Input className="mt-1" value={template.label} onChange={(e) => onChange({ ...template, label: e.target.value })} />
        </div>
        <div>
          <Label>Version</Label>
          <Input className="mt-1" value={template.version} onChange={(e) => onChange({ ...template, version: e.target.value })} />
        </div>
        <div className="flex items-end gap-4 pb-1">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={template.active} onCheckedChange={(active) => onChange({ ...template, active })} />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={template.requiresSignature}
              onCheckedChange={(requiresSignature) => onChange({ ...template, requiresSignature })}
            />
            Requires signature
          </label>
        </div>
      </FieldGrid>

      <div>
        <Label>Header</Label>
        <Textarea className="mt-1" rows={2} value={template.header} onChange={(e) => onChange({ ...template, header: e.target.value })} />
      </div>
      <div>
        <Label>Footer</Label>
        <Textarea className="mt-1" rows={2} value={template.footer} onChange={(e) => onChange({ ...template, footer: e.target.value })} />
      </div>
      <div>
        <Label>Disclaimer</Label>
        <Textarea className="mt-1" rows={3} value={template.disclaimer} onChange={(e) => onChange({ ...template, disclaimer: e.target.value })} />
      </div>

      <div>
        <Label className="mb-2 block">Applies to</Label>
        <div className="flex flex-wrap gap-4">
          {(
            [
              ["customer", "Customer"],
              ["employee", "Employee"],
              ["applicant", "Applicant"],
              ["contractor", "Contractor"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Switch checked={template.appliesTo[key]} onCheckedChange={(v) => setApplies(key, v)} />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DocumentTemplatesSection({ initial }: { initial: unknown }) {
  const [templates, setTemplates] = useState<DocumentTemplateConfig[]>(() => normalizeDocumentTemplates(initial));
  const { saving, save } = useSettingSave();

  useEffect(() => {
    setTemplates(normalizeDocumentTemplates(initial));
  }, [initial]);

  const update = (index: number, next: DocumentTemplateConfig) =>
    setTemplates((prev) => prev.map((t, i) => (i === index ? next : t)));

  const addTemplate = () => {
    const id = `template-${Date.now()}`;
    setTemplates((prev) => [
      ...prev,
      {
        id,
        templateType: id,
        label: "New template",
        version: "1.0",
        header: "",
        footer: "",
        disclaimer: "",
        active: true,
        requiresSignature: false,
        appliesTo: { customer: true, employee: false, applicant: false, contractor: false },
      },
    ]);
  };

  return (
    <SettingsSectionCard
      title="Document template metadata"
      description="Headers, footers, and disclaimers for invoices, estimates, and HR documents."
      onSave={() => save("document.templates", documentTemplatesForSave(templates), "Document templates")}
      onReset={() => setTemplates(normalizeDocumentTemplates(undefined))}
      saving={saving}
      saveLabel="Save templates"
    >
      <div className="space-y-4">
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No templates yet — add one to get started.</p>
        ) : (
          templates.map((t, i) => (
            <TemplateCard
              key={t.id}
              template={t}
              onChange={(next) => update(i, next)}
              onArchive={() => update(i, { ...t, active: !t.active })}
            />
          ))
        )}
        <Button type="button" variant="outline" onClick={addTemplate}>
          <Plus className="mr-2 h-4 w-4" /> Add template
        </Button>
      </div>
      <AdvancedJsonEditor
        value={documentTemplatesForSave(templates)}
        onSave={async (v) => {
          await save("document.templates", v, "Document templates");
          setTemplates(normalizeDocumentTemplates(v));
        }}
        saving={saving}
      />
    </SettingsSectionCard>
  );
}
