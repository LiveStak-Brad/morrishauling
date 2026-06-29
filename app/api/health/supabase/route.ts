import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        { ok: false, connected: false, error: error.message },
        { status: 503 }
      );
    }

    const { error: pingError } = await supabase.from("companies").select("id").limit(1);

    return NextResponse.json({
      ok: true,
      connected: true,
      hasSession: Boolean(data.session),
      tablesReady: !pingError || pingError.code !== "PGRST205",
      tableError: pingError?.message ?? null,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { ok: false, connected: false, error: message },
      { status: 500 }
    );
  }
}
