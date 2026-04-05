import { fetchMatches } from "@/lib/football-api";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const matchday = request.nextUrl.searchParams.get("matchday");

  try {
    const apiMatches = await fetchMatches(
      matchday ? parseInt(matchday) : undefined
    );
    return Response.json(apiMatches);
  } catch (err) {
    console.error("Matches fetch error:", err);
    return Response.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}
