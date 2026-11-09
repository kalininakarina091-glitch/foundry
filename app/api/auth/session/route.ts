import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { currentUser, SESSION_COOKIE } from "@/lib/auth";
import { configuredAppOrigin } from "@/lib/app-origin";
import {
  CLAIMS_COOKIE,
  claimsCookieOptions,
  claimsSecret,
  signClaims,
} from "@/lib/session-claims";

export const runtime = "nodejs";

// Read-only, cookie-scoped lookup used by Proxy when it has no valid signed
// hint. No token or personal profile is returned. Kept outside Proxy so Prisma
// stays in the Node Functions bundle. A fresh hint is issued with the answer.
export async function GET(request: Request) {
  const user = await currentUser();
  const response = NextResponse.json(
    { authenticated: !!user, isAdmin: user?.isAdmin === true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const secret = claimsSecret();
  if (user && token && secret)
    response.cookies.set(
      CLAIMS_COOKIE,
      await signClaims(token, user.isAdmin, secret),
      claimsCookieOptions(new URL(configuredAppOrigin() || request.url).protocol === "https:"),
    );
  return response;
}
