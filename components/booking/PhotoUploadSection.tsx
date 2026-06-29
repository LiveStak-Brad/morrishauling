"use client";

import { useRef } from "react";
import { Camera, Check } from "lucide-react";
import Image from "next/image";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Input } from "@/components/ui/input";
import type { SubmittedPhoto } from "@/components/junk/SubmittedPhotosCard";
import { labelForPhotoIndex } from "@/lib/booking/arrival-slots";

interface PhotoUploadSectionProps {
  photos: SubmittedPhoto[];
  onPhotosChange: (photos: SubmittedPhoto[]) => void;
  title?: string;
  description?: string;
}

export function PhotoUploadSection({
  photos,
  onPhotosChange,
  title = "Add photos (optional)",
  description = "Photos help our team review your job and confirm pricing. Uploads may trigger a quick human review before scheduling.",
}: PhotoUploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) {
      onPhotosChange([]);
      return;
    }
    const next: SubmittedPhoto[] = Array.from(files).map((file, i) => ({
      id: `${file.name}-${file.lastModified}-${i}`,
      url: URL.createObjectURL(file),
      label: labelForPhotoIndex(i),
      file,
    }));
    onPhotosChange(next);
  };

  return (
    <PremiumCard className="border-2 border-dashed border-brand-primary/30 bg-brand-primary/5 p-6">
      <div className="text-center">
        <Camera className="mx-auto h-8 w-8 text-brand-primary" />
        <h3 className="mt-2 font-bold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="mt-4"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {photos.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <p className="mb-2 text-sm font-semibold">Photos ready to submit</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <div key={photo.id} className="space-y-1.5">
                <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={photo.url}
                    alt={photo.label ?? "Photo"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {photo.label && (
                  <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Check className="h-3 w-3 text-green-600" />
                    {photo.label}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </PremiumCard>
  );
}
