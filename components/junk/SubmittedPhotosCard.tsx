"use client";

import { Camera, Check } from "lucide-react";
import Image from "next/image";
import { PremiumCard } from "@/components/morris/PremiumCard";

export interface SubmittedPhoto {
  id: string;
  url: string;
  label?: string;
  file?: File;
}

export function SubmittedPhotosCard({ photos }: { photos: SubmittedPhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <PremiumCard className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Camera className="h-5 w-5 text-brand-primary" />
        <h3 className="font-bold">Photos submitted</h3>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        We received your photos. Our team will use them during review.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo) => (
          <div key={photo.id} className="space-y-1.5">
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <Image
                src={photo.url}
                alt={photo.label ?? "Submitted photo"}
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
    </PremiumCard>
  );
}
