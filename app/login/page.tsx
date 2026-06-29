"use client";

import { PublicHeader } from "@/components/public/PublicHeader";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 pb-24">
        <Card>
          <CardHeader>
            <CardTitle>Customer login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Authentication placeholder — use dev role switcher to preview customer dashboard.
            </p>
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="you@email.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" />
            </div>
            <Button className="w-full bg-brand-primary hover:bg-brand-primary/90">
              Sign in
            </Button>
            <ButtonLink href="/customer" variant="link" className="w-full">
              Continue to customer dashboard (demo)
            </ButtonLink>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
