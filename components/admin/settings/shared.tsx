"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCompanySetting } from "@/lib/admin/save-company-setting";
import { toast } from "@/lib/toast";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  onSave?: () => void | Promise<void>;
  onReset?: () => void;
  saving?: boolean;
  saveLabel?: string;
  resetLabel?: string;
  className?: string;
}

export function SettingsSectionCard({
  title,
  description,
  children,
  onSave,
  onReset,
  saving,
  saveLabel = "Save",
  resetLabel = "Reset to defaults",
  className,
}: SettingsSectionCardProps) {
  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {(onSave || onReset) && (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            {onSave ? (
              <Button onClick={() => void onSave()} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  saveLabel
                )}
              </Button>
            ) : null}
            {onReset ? (
              <Button type="button" variant="outline" onClick={onReset} disabled={saving}>
                {resetLabel}
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AdvancedJsonEditorProps {
  value: unknown;
  onSave: (value: unknown) => Promise<void>;
  saving?: boolean;
}

export function AdvancedJsonEditor({ value, onSave, saving }: AdvancedJsonEditorProps) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(raw);
      setError(null);
      await onSave(parsed);
      toast.success("Advanced JSON saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setError(msg);
      toast.error(msg);
    }
  };

  if (!open) {
    return (
      <div className="rounded-lg border border-dashed border-amber-300/60 bg-amber-50/40 p-3">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left text-sm text-amber-900"
          onClick={() => {
            setRaw(JSON.stringify(value, null, 2));
            setOpen(true);
          }}
        >
          <span>Advanced JSON editor — use only if you know what you are doing</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50/40 p-3 space-y-2">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-sm font-medium text-amber-900"
        onClick={() => setOpen(false)}
      >
        <span>Advanced JSON editor — use only if you know what you are doing</span>
        <ChevronUp className="h-4 w-4 shrink-0" />
      </button>
      <Textarea
        rows={8}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        className="font-mono text-xs bg-slate-950 text-slate-100"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button size="sm" variant="secondary" onClick={() => void handleSave()} disabled={saving}>
        Save raw JSON
      </Button>
    </div>
  );
}

interface CurrencyInputProps {
  id?: string;
  label?: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function CurrencyInput({ id, label, value, onChange, className }: CurrencyInputProps) {
  const [text, setText] = useState(() => value.toFixed(2));

  useEffect(() => {
    setText(value.toFixed(2));
  }, [value]);

  const commit = (raw: string) => {
    setText(raw);
    const n = parseFloat(raw.replace(/[^0-9.-]/g, ""));
    if (!Number.isNaN(n)) onChange(n);
  };

  return (
    <div className={className}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className="relative mt-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          className="pl-7"
          value={text}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setText(value.toFixed(2))}
        />
      </div>
    </div>
  );
}

interface PercentInputProps {
  id?: string;
  label?: string;
  value: number;
  onChange: (value: number) => void;
}

export function PercentInput({ id, label, value, onChange }: PercentInputProps) {
  return (
    <div>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className="relative mt-1">
        <Input
          id={id}
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
      </div>
    </div>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function useSettingSave() {
  const [saving, setSaving] = useState(false);

  const save = useCallback(async (key: string, value: unknown, label: string) => {
    setSaving(true);
    try {
      await saveCompanySetting(key, value);
      toast.success(`${label} saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  return { saving, save };
}

export function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
