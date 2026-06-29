import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCustomerProfile } from "@/lib/auth/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "auth-register",
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const { email, password, fullName, phone } = body as {
      email?: string;
      password?: string;
      fullName?: string;
      phone?: string;
    };

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { ok: false, error: "Email, password, and full name are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ ok: false, error: "Registration failed" }, { status: 500 });
    }

    await createCustomerProfile({
      userId: data.user.id,
      email,
      fullName,
      phone,
    });

    return NextResponse.json({
      ok: true,
      userId: data.user.id,
      needsEmailConfirmation: !data.session,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Registration failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
