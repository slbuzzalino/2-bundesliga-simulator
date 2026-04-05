// Hertha BSC team ID on football-data.org
export const HERTHA_TEAM_ID = 54;
export const HERTHA_COLOR = "#005CA9";

export interface TeamStanding {
  teamId: number;
  teamName: string;
  teamCrest: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface SimulatedResult {
  matchId: number;
  homeScore: number;
  awayScore: number;
}

export interface MatchData {
  id: number;
  matchday: number;
  homeTeamId: number;
  homeTeamName: string;
  homeTeamCrest: string;
  awayTeamId: number;
  awayTeamName: string;
  awayTeamCrest: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  utcDate: string;
}

export function calculateStandings(
  baseStandings: TeamStanding[],
  finishedMatches: MatchData[],
  simulatedResults: SimulatedResult[]
): TeamStanding[] {
  // Start from base standings (from API)
  const standings = new Map<number, TeamStanding>();
  baseStandings.forEach((s) => standings.set(s.teamId, { ...s }));

  // Apply simulated results for future matches
  simulatedResults.forEach((sim) => {
    // Find the match to get team info
    const home = standings.get(sim.matchId); // We'll need match data
    // This is handled in the component by passing full match data
  });

  return sortStandings(Array.from(standings.values()));
}

export function applySimulatedResults(
  baseStandings: TeamStanding[],
  matches: MatchData[],
  simulatedResults: Record<number, { home: number; away: number }>
): TeamStanding[] {
  const standings = new Map<number, TeamStanding>();
  baseStandings.forEach((s) => standings.set(s.teamId, { ...s }));

  // For each simulated match, apply the result
  matches.forEach((match) => {
    const sim = simulatedResults[match.id];
    if (!sim) return;

    const home = standings.get(match.homeTeamId);
    const away = standings.get(match.awayTeamId);
    if (!home || !away) return;

    home.played += 1;
    away.played += 1;
    home.goalsFor += sim.home;
    home.goalsAgainst += sim.away;
    away.goalsFor += sim.away;
    away.goalsAgainst += sim.home;
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    if (sim.home > sim.away) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (sim.home < sim.away) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.draw += 1;
      away.draw += 1;
      home.points += 1;
      away.points += 1;
    }
  });

  return sortStandings(Array.from(standings.values()));
}

function sortStandings(standings: TeamStanding[]): TeamStanding[] {
  return standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
}

export function getHerthaStatus(standings: TeamStanding[]): {
  position: number;
  promotion: "direct" | "playoff" | "none";
  message: string;
} {
  const idx = standings.findIndex((s) => s.teamId === HERTHA_TEAM_ID);
  if (idx === -1) return { position: -1, promotion: "none", message: "" };

  const position = idx + 1;
  if (position <= 2) {
    return {
      position,
      promotion: "direct",
      message: "AUFSTIEG! Hertha BSC steigt direkt auf! 🏆",
    };
  }
  if (position === 3) {
    return {
      position,
      promotion: "playoff",
      message: "Relegationsplatz! Hertha kämpft um den Aufstieg! 💪",
    };
  }
  return {
    position,
    promotion: "none",
    message: `Platz ${position} — Weiter kämpfen!`,
  };
}

export function whatDoesHerthaNeed(
  standings: TeamStanding[],
  remainingMatches: MatchData[]
): string[] {
  const hertha = standings.find((s) => s.teamId === HERTHA_TEAM_ID);
  if (!hertha) return [];

  const tips: string[] = [];
  const herthaIdx = standings.findIndex((s) => s.teamId === HERTHA_TEAM_ID);
  const position = herthaIdx + 1;

  if (position <= 2) {
    tips.push("Hertha ist auf direktem Aufstiegsplatz! Einfach weiter gewinnen!");
    return tips;
  }

  if (position === 3) {
    tips.push("Hertha steht auf dem Relegationsplatz.");
    const second = standings[1];
    const gap = second.points - hertha.points;
    if (gap > 0) {
      tips.push(
        `${gap} Punkt${gap > 1 ? "e" : ""} Rückstand auf Platz 2 (${second.teamName}).`
      );
    }
  } else {
    const third = standings[2];
    const gap = third.points - hertha.points;
    tips.push(
      `${gap} Punkt${gap > 1 ? "e" : ""} Rückstand auf Platz 3 (${third.teamName}).`
    );
  }

  // Count remaining Hertha matches
  const herthaRemaining = remainingMatches.filter(
    (m) =>
      (m.homeTeamId === HERTHA_TEAM_ID || m.awayTeamId === HERTHA_TEAM_ID) &&
      (m.status === "SCHEDULED" || m.status === "TIMED")
  );
  const maxPossiblePoints = hertha.points + herthaRemaining.length * 3;
  tips.push(
    `${herthaRemaining.length} Spiel${herthaRemaining.length !== 1 ? "e" : ""} verbleibend. Maximal erreichbar: ${maxPossiblePoints} Punkte.`
  );

  // Check if mathematically possible
  const second = standings[1];
  if (maxPossiblePoints < second.points) {
    tips.push("⚠️ Direkter Aufstieg ist mathematisch nicht mehr möglich.");
  }

  return tips;
}

// Hertha BSC fan chants and motivational phrases
export const HERTHA_PHRASES = [
  "Ha Ho He — Hertha BSC! 💙",
  "Nur nach Hause geh'n wir nicht!",
  "Blau-Weiß — unser Verein, wird immer Nummer Eins sein!",
  "Wir sind Hertha — Hertha BSC!",
  "Berlin, Berlin — wir fahr'n nach Berlin!",
  "Hertha, du bist der Verein, dem ich mein Leben weih!",
  "Auf geht's Hertha — kämpfen und siegen!",
  "Von der Ostkurve bis nach überall — Hertha BSC!",
  "Steh auf, wenn du ein Herthaner bist!",
  "Hertha BSC — die Alte Dame lebt!",
  "Blau-weißes Herz schlägt für Berlin!",
  "Zusammen sind wir stark — HA HO HE!",
];

export function getRandomPhrase(): string {
  return HERTHA_PHRASES[Math.floor(Math.random() * HERTHA_PHRASES.length)];
}
