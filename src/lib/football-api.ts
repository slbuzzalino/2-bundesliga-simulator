const BASE_URL = "https://api.openligadb.de";
const LEAGUE = "bl2";
const SEASON = 2025; // 2025/2026 season

export interface ApiStandingEntry {
  position: number;
  teamId: number;
  teamName: string;
  teamCrest: string;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface ApiMatch {
  id: number;
  matchday: number;
  status: string; // FINISHED, IN_PLAY, SCHEDULED
  utcDate: string;
  homeTeamId: number;
  homeTeamName: string;
  homeTeamCrest: string;
  awayTeamId: number;
  awayTeamName: string;
  awayTeamCrest: string;
  homeScore: number | null;
  awayScore: number | null;
}

export async function fetchStandings(): Promise<ApiStandingEntry[]> {
  const res = await fetch(`${BASE_URL}/getbltable/${LEAGUE}/${SEASON}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();

  return data.map((t: Record<string, unknown>, idx: number) => ({
    position: idx + 1,
    teamId: t.teamInfoId as number,
    teamName: t.teamName as string,
    teamCrest: (t.teamIconUrl as string) || "",
    playedGames: t.matches as number,
    won: t.won as number,
    draw: t.draw as number,
    lost: t.lost as number,
    points: t.points as number,
    goalsFor: t.goals as number,
    goalsAgainst: t.opponentGoals as number,
    goalDifference: (t.goalDiff as number) ?? ((t.goals as number) - (t.opponentGoals as number)),
  }));
}

function parseMatchStatus(match: Record<string, unknown>): string {
  if (match.matchIsFinished) return "FINISHED";

  const matchDate = new Date(match.matchDateTimeUTC as string);
  const now = new Date();

  // If match started (within ~2h window) and not finished = potentially live
  const matchEndEstimate = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);
  if (now >= matchDate && now <= matchEndEstimate) return "IN_PLAY";

  return "SCHEDULED";
}

function getEndScore(
  results: Array<{ resultTypeID: number; pointsTeam1: number; pointsTeam2: number }>
): { home: number | null; away: number | null } {
  if (!results || results.length === 0) return { home: null, away: null };

  // resultTypeID 2 = end result, 1 = half time
  const endResult = results.find((r) => r.resultTypeID === 2);
  const latestResult = endResult || results[results.length - 1];

  return {
    home: latestResult.pointsTeam1,
    away: latestResult.pointsTeam2,
  };
}

export async function fetchMatches(matchday?: number): Promise<ApiMatch[]> {
  if (matchday) {
    const res = await fetch(
      `${BASE_URL}/getmatchdata/${LEAGUE}/${SEASON}/${matchday}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return parseMatches(data);
  }

  // Fetch all matchdays
  const res = await fetch(
    `${BASE_URL}/getmatchdata/${LEAGUE}/${SEASON}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return parseMatches(data);
}

function parseMatches(data: Array<Record<string, unknown>>): ApiMatch[] {
  return data.map((m) => {
    const team1 = m.team1 as { teamId: number; teamName: string; teamIconUrl: string };
    const team2 = m.team2 as { teamId: number; teamName: string; teamIconUrl: string };
    const group = m.group as { groupOrderID: number };
    const results = (m.matchResults || []) as Array<{
      resultTypeID: number;
      pointsTeam1: number;
      pointsTeam2: number;
    }>;
    const score = getEndScore(results);
    const status = parseMatchStatus(m);

    return {
      id: m.matchID as number,
      matchday: group.groupOrderID,
      status,
      utcDate: m.matchDateTimeUTC as string,
      homeTeamId: team1.teamId,
      homeTeamName: team1.teamName,
      homeTeamCrest: team1.teamIconUrl || "",
      awayTeamId: team2.teamId,
      awayTeamName: team2.teamName,
      awayTeamCrest: team2.teamIconUrl || "",
      homeScore: score.home,
      awayScore: score.away,
    };
  });
}

export function isFinished(status: string): boolean {
  return status === "FINISHED";
}

export function isLive(status: string): boolean {
  return status === "IN_PLAY" || status === "PAUSED" || status === "LIVE";
}

export function isScheduled(status: string): boolean {
  return status === "SCHEDULED" || status === "TIMED";
}
