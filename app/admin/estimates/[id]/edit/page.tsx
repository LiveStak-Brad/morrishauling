import { redirect } from "next/navigation";

type Ctx = { params: Promise<{ id: string }> };

/** Edit lives on the detail page — keep a stable route for bookmarks. */
export default async function AdminEstimateEditPage({ params }: Ctx) {
  const { id } = await params;
  redirect(`/admin/estimates/${id}`);
}
