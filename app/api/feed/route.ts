import { NextResponse } from "next/server";
import { fetchActivityFeed } from "@/lib/reputation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limitRaw = searchParams.get("limit");
  const limit = limitRaw ? Math.min(Number(limitRaw), 20) : 10;

  try {
    const events = await fetchActivityFeed(Number.isFinite(limit) ? limit : 10);
    return NextResponse.json({ events }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
