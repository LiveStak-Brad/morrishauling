"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MATERIAL_CATEGORY_GROUPS,
  MATERIAL_CATEGORY_LABELS,
  type MaterialCategory,
} from "@/lib/disposal/material-categories";
import { getMaterialIcon } from "@/lib/disposal/material-icons";
import { MaterialCategorySelector } from "@/components/disposal/FacilityFormSections";
import { Layers, X } from "lucide-react";

export function CompactMaterialSelector({
  selected,
  onChange,
}: {
  selected: MaterialCategory[];
  onChange: (m: MaterialCategory[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const remove = (m: MaterialCategory) => {
    onChange(selected.filter((x) => x !== m));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {selected.length === 0 ? (
          <span className="text-sm text-muted-foreground">All material types — no filter applied</span>
        ) : (
          selected.map((m) => {
            const Icon = getMaterialIcon(m);
            return (
              <span
                key={m}
                className="inline-flex items-center gap-1 rounded-full border bg-brand-primary/5 border-brand-primary/30 px-2.5 py-1 text-xs font-medium"
              >
                <Icon className="h-3.5 w-3.5" />
                {MATERIAL_CATEGORY_LABELS[m]}
                <button
                  type="button"
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  onClick={() => remove(m)}
                  aria-label={`Remove ${MATERIAL_CATEGORY_LABELS[m]}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button type="button" variant="outline" size="sm" className="h-8">
              <Layers className="mr-1.5 h-3.5 w-3.5" />
              {selected.length ? "Edit materials" : "Choose materials"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job materials</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Incompatible facilities are hidden automatically when materials are selected.
            </p>
            <MaterialCategorySelector selected={selected} onChange={onChange} />
            <Button className="w-full" onClick={() => setOpen(false)}>
              Done ({selected.length} selected)
            </Button>
          </DialogContent>
        </Dialog>
        {selected.length > 0 && (
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onChange([])}>
            Clear all
          </Button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {MATERIAL_CATEGORY_GROUPS.length} material groups · {selected.length || "no"} filter{selected.length === 1 ? "" : "s"} active
      </p>
    </div>
  );
}
