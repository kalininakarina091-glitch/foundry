import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { syncSource } from "@/lib/source-sync";
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const result = await syncSource((await params).id);
  return result.ok
    ? NextResponse.json(result)
    : NextResponse.json(
        { error: result.error, excluded: result.excluded },
        { status: result.status },
      );
}
