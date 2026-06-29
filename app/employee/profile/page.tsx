"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { toast } from "@/lib/toast";
import { useAuth } from "@/components/auth/AuthProvider";
import type { EmployeeProfileSelf } from "@/types/hr/employee-portal";
import { User, Lock, LogOut } from "lucide-react";

export default function EmployeeProfilePage() {
  const { signOut } = useAuth();
  const [data, setData] = useState<EmployeeProfileSelf | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [form, setForm] = useState({
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    zip: "",
    preferredName: "",
    emergencyName: "",
    emergencyRelationship: "",
    emergencyPhone: "",
    emergencyEmail: "",
    shirtSize: "",
    pantSize: "",
    shoeSize: "",
    jacketSize: "",
    gloveSize: "",
    licenseNumber: "",
    licenseClass: "",
    licenseState: "MO",
    licenseExpires: "",
    notifyEmail: true,
    notifySms: false,
  });

  useEffect(() => {
    fetch("/api/me/profile/photo")
      .then((r) => r.json())
      .then((d) => { if (d.ok && d.url) setAvatarUrl(d.url); });
    fetch("/api/me/profile")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        setData(d.profile);
        const p = d.profile as EmployeeProfileSelf;
        const shirt = p.uniformSizes.find((u) => u.itemType === "shirt")?.size ?? "";
        const pant = p.uniformSizes.find((u) => u.itemType === "pants")?.size ?? "";
        const shoe = p.uniformSizes.find((u) => u.itemType === "shoes")?.size ?? "";
        const jacket = p.uniformSizes.find((u) => u.itemType === "jacket")?.size ?? "";
        const gloves = p.uniformSizes.find((u) => u.itemType === "gloves")?.size ?? "";
        setForm({
          phone: p.employee.phone ?? "",
          addressLine1: p.employee.addressLine1 ?? "",
          city: p.employee.city ?? "",
          state: p.employee.state ?? "",
          zip: p.employee.zip ?? "",
          preferredName: p.preferredName ?? `${p.employee.firstName} ${p.employee.lastName}`,
          emergencyName: p.emergencyContact?.name ?? "",
          emergencyRelationship: p.emergencyContact?.relationship ?? "",
          emergencyPhone: p.emergencyContact?.phone ?? "",
          emergencyEmail: p.emergencyContact?.email ?? "",
          shirtSize: shirt,
          pantSize: pant,
          shoeSize: shoe,
          jacketSize: jacket,
          gloveSize: gloves,
          licenseNumber: p.driverLicense?.licenseNumber ?? "",
          licenseClass: p.driverLicense?.licenseClass ?? "",
          licenseState: p.driverLicense?.licenseState ?? "MO",
          licenseExpires: p.driverLicense?.expiresAt?.slice(0, 10) ?? "",
          notifyEmail: p.notificationPreferences?.email ?? true,
          notifySms: p.notificationPreferences?.sms ?? false,
        });
      });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: form.phone,
          addressLine1: form.addressLine1,
          city: form.city,
          state: form.state,
          zip: form.zip,
          preferredName: form.preferredName,
          emergencyContact: form.emergencyName
            ? {
                name: form.emergencyName,
                relationship: form.emergencyRelationship,
                phone: form.emergencyPhone,
                email: form.emergencyEmail || undefined,
              }
            : undefined,
          uniformSizes: [
            { itemType: "shirt", size: form.shirtSize },
            { itemType: "pants", size: form.pantSize },
            { itemType: "shoes", size: form.shoeSize },
            { itemType: "jacket", size: form.jacketSize },
            { itemType: "gloves", size: form.gloveSize },
          ].filter((u) => u.size),
          driverLicense: form.licenseNumber
            ? {
                licenseNumber: form.licenseNumber,
                licenseClass: form.licenseClass || undefined,
                licenseState: form.licenseState,
                expiresAt: form.licenseExpires,
              }
            : undefined,
          notificationPreferences: {
            email: form.notifyEmail,
            sms: form.notifySms,
            push: false,
          },
        }),
      });
      const d = await res.json();
      if (d.ok) {
        setData(d.profile);
        toast.success("Profile updated");
      } else {
        toast.error(d.error ?? "Update failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <PremiumCard className="p-4 flex items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-primary/10">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Profile" fill className="object-cover" unoptimized />
          ) : (
            <User className="h-8 w-8 text-brand-primary" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold">{form.preferredName || "Employee"}</p>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-2 text-xs"
            disabled={photoUploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setPhotoUploading(true);
              try {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/me/profile/photo", { method: "POST", body: formData });
                const d = await res.json();
                if (d.ok) {
                  setAvatarUrl(d.url ?? null);
                  toast.success("Profile photo updated");
                } else toast.error(d.error ?? "Upload failed");
              } finally {
                setPhotoUploading(false);
                e.target.value = "";
              }
            }}
          />
        </div>
      </PremiumCard>

      {data && (
        <PremiumCard className="p-4 space-y-2 text-sm">
          <p className="font-semibold flex items-center gap-2"><Lock className="h-4 w-4" /> Admin-only (read only)</p>
          <p>Role: <strong className="capitalize">{data.readOnly.role}</strong></p>
          <p>Employment: <strong>{data.readOnly.employmentType?.replace(/_/g, " ") ?? "—"}</strong></p>
          <p>Employee #: <strong>{data.readOnly.employeeNumber ?? "—"}</strong></p>
          {data.readOnly.hourlyRate != null && (
            <p>Pay rate: <strong>${data.readOnly.hourlyRate}/hr</strong> (view only)</p>
          )}
          {data.directDepositLast4 && (
            <p>Direct deposit: <strong>••••{data.directDepositLast4}</strong></p>
          )}
        </PremiumCard>
      )}

      <PremiumCard className="p-4 space-y-3">
        <h3 className="font-semibold">Driver license</h3>
        <Field label="License #" value={form.licenseNumber} onChange={(v) => setForm((f) => ({ ...f, licenseNumber: v }))} />
        <Field label="Class" value={form.licenseClass} onChange={(v) => setForm((f) => ({ ...f, licenseClass: v }))} placeholder="e.g. D" />
        <div className="grid grid-cols-2 gap-2">
          <Field label="State" value={form.licenseState} onChange={(v) => setForm((f) => ({ ...f, licenseState: v }))} />
          <Field label="Expires" value={form.licenseExpires} onChange={(v) => setForm((f) => ({ ...f, licenseExpires: v }))} placeholder="YYYY-MM-DD" />
        </div>
      </PremiumCard>

      <PremiumCard className="p-4 space-y-3">
        <h3 className="font-semibold">Contact</h3>
        <Field label="Preferred name" value={form.preferredName} onChange={(v) => setForm((f) => ({ ...f, preferredName: v }))} />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
        <Field label="Address" value={form.addressLine1} onChange={(v) => setForm((f) => ({ ...f, addressLine1: v }))} />
        <div className="grid grid-cols-3 gap-2">
          <Field label="City" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
          <Field label="State" value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v }))} />
          <Field label="ZIP" value={form.zip} onChange={(v) => setForm((f) => ({ ...f, zip: v }))} />
        </div>
      </PremiumCard>

      <PremiumCard className="p-4 space-y-3">
        <h3 className="font-semibold">Emergency Contact</h3>
        <Field label="Name" value={form.emergencyName} onChange={(v) => setForm((f) => ({ ...f, emergencyName: v }))} />
        <Field label="Relationship" value={form.emergencyRelationship} onChange={(v) => setForm((f) => ({ ...f, emergencyRelationship: v }))} />
        <Field label="Phone" value={form.emergencyPhone} onChange={(v) => setForm((f) => ({ ...f, emergencyPhone: v }))} />
        <Field label="Email" value={form.emergencyEmail} onChange={(v) => setForm((f) => ({ ...f, emergencyEmail: v }))} />
      </PremiumCard>

      <PremiumCard className="p-4 space-y-3">
        <h3 className="font-semibold">Uniform Sizes</h3>
        <Field label="Shirt" value={form.shirtSize} onChange={(v) => setForm((f) => ({ ...f, shirtSize: v }))} placeholder="e.g. L" />
        <Field label="Pants" value={form.pantSize} onChange={(v) => setForm((f) => ({ ...f, pantSize: v }))} placeholder="e.g. 34x32" />
        <Field label="Shoes" value={form.shoeSize} onChange={(v) => setForm((f) => ({ ...f, shoeSize: v }))} placeholder="e.g. 10" />
        <Field label="Jacket" value={form.jacketSize} onChange={(v) => setForm((f) => ({ ...f, jacketSize: v }))} />
        <Field label="Gloves" value={form.gloveSize} onChange={(v) => setForm((f) => ({ ...f, gloveSize: v }))} />
      </PremiumCard>

      <PremiumCard className="p-4 space-y-2">
        <h3 className="font-semibold text-sm">Notification preferences</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.notifyEmail} onChange={(e) => setForm((f) => ({ ...f, notifyEmail: e.target.checked }))} />
          Email notifications
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.notifySms} onChange={(e) => setForm((f) => ({ ...f, notifySms: e.target.checked }))} />
          SMS (coming when enabled)
        </label>
      </PremiumCard>

      <Button className="w-full h-12" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/5"
        onClick={() => signOut()}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input className="mt-1" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
