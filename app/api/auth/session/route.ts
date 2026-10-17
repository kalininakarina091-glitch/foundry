import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export const runtime = "nodejs";

// Read-only, cookie-scoped lookup used by Proxy. No token or personal profile
// is returned. Kept outside Proxy so Prisma stays in the Node Functions bundle.
export async function GET() {
  const user = await currentUser();
  return NextResponse.json(
    { authenticated: !!user, isAdmin: user?.isAdmin === true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
