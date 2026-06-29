"use client";

import { Suspense } from "react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { BookingWizard } from "@/components/public/BookingWizard";

function BookingContent() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 morris-hero-pattern pointer-events-none" />
      <PublicHeader />
      <main className="relative mx-auto w-full max-w-lg flex-1 px-4 py-6 pb-32 md:max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">Book your pickup</h1>
          <p className="mt-1 text-muted-foreground">
            Get a live estimate in minutes — no obligation
          </p>
        </div>
        <BookingWizard />
      </main>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <BookingContent />
    </Suspense>
  );
}
