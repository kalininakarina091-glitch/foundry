import { NextResponse } from "next/server";
import { listOpportunities } from "@/lib/opportunities";
export async function GET() {
  return NextResponse.json(await listOpportunities());
}
