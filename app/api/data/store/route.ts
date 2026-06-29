import { NextResponse } from "next/server";
import {
  fetchFinancingFromSupabase,
  fetchInvoicesFromSupabase,
  fetchJobsFromSupabase,
  fetchPaymentsFromSupabase,
  fetchUsersFromSupabase,
  isSupabaseTablesReady,
  useSupabaseData,
} from "@/lib/supabase/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json({ error: "companyId required" }, { status: 400 });
  }

  if (!useSupabaseData()) {
    return NextResponse.json({ source: "mock", tablesReady: false });
  }

  const tablesReady = await isSupabaseTablesReady();
  if (!tablesReady) {
    return NextResponse.json({
      source: "mock",
      tablesReady: false,
      message: "Run npm run db:setup or paste supabase/migrations/001_initial_schema.sql in Supabase SQL Editor",
    });
  }

  try {
    const [jobs, invoices, payments, financingRequests, users] = await Promise.all([
      fetchJobsFromSupabase(companyId),
      fetchInvoicesFromSupabase(companyId),
      fetchPaymentsFromSupabase(companyId),
      fetchFinancingFromSupabase(companyId),
      fetchUsersFromSupabase(companyId),
    ]);

    return NextResponse.json({
      source: "supabase",
      tablesReady: true,
      jobs,
      invoices,
      payments,
      financingRequests,
      users,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ source: "mock", tablesReady: false, error: message });
  }
}
