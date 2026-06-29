import { notFound } from "next/navigation";
import { areDevToolsEnabled } from "@/lib/env/dev-tools";
import { DataInspectorClient } from "./DataInspectorClient";

export default function DataInspectorPage() {
  if (!areDevToolsEnabled()) notFound();
  return <DataInspectorClient />;
}
