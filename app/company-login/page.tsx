"use client";

import { PublicHeader } from "@/components/public/PublicHeader";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompanyLoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 pb-24">
        <Card>
          <CardHeader>
            <CardTitle>Company login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Employee, planner, and admin login placeholder.
            </p>
            <div>
              <Label>Work email</Label>
              <Input type="email" placeholder="you@company.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" />
            </div>
            <Button className="w-full bg-brand-primary hover:bg-brand-primary/90">
              Sign in
            </Button>
            <div className="flex flex-col gap-2">
              <ButtonLink href="/employee" variant="outline" size="sm">
                Employee dashboard (demo)
              </ButtonLink>
              <ButtonLink href="/planner" variant="outline" size="sm">
                Planner dashboard (demo)
              </ButtonLink>
              <ButtonLink href="/admin" variant="outline" size="sm">
                Admin dashboard (demo)
              </ButtonLink>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
