"use client";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { PremiumCard } from "@/components/morris/PremiumCard";

interface Props {
  html: string;
  courseName: string;
  score?: number;
  completedAt?: string;
}

export function TrainingCertificate({ html, courseName, score, completedAt }: Props) {
  const printCert = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-4">
      <PremiumCard className="p-4 overflow-auto">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </PremiumCard>
      <div className="flex gap-2">
        <Button onClick={printCert} className="flex-1">
          Print certificate
        </Button>
        <ButtonLink href={`?format=html`} target="_blank" variant="outline" className="flex-1 text-center">
          Open full page
        </ButtonLink>
      </div>
      {(score != null || completedAt) && (
        <p className="text-xs text-center text-muted-foreground">
          {courseName}
          {score != null && ` · ${score}%`}
          {completedAt && ` · ${new Date(completedAt).toLocaleDateString()}`}
        </p>
      )}
    </div>
  );
}
