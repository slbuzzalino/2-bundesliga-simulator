import { fetchStandings } from "@/lib/football-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const apiStandings = await fetchStandings();

    return Response.json(
      apiStandings.map((e) => ({
        teamId: e.teamId,
        teamName: e.teamName,
        teamCrest: e.teamCrest,
        position: e.position,
        played: e.playedGames,
        won: e.won,
        draw: e.draw,
        lost: e.lost,
        points: e.points,
        goalsFor: e.goalsFor,
        goalsAgainst: e.goalsAgainst,
        goalDifference: e.goalDifference,
      }))
    );
  } catch (err) {
    console.error("Standings fetch error:", err);
    return Response.json({ error: "Failed to fetch standings" }, { status: 500 });
  }
}
