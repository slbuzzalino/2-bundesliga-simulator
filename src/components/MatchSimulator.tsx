"use client";

import { HERTHA_TEAM_ID } from "@/lib/simulator";
import type { MatchData } from "@/lib/simulator";
import { isFinished, isLive, isScheduled } from "@/lib/football-api";
import TeamCrest from "./TeamCrest";

interface Props {
  matches: MatchData[];
  simulatedResults: Record<number, { home: number; away: number }>;
  onSimulate: (
    matchId: number,
    home: number,
    away: number
  ) => void;
  selectedMatchday: number;
  onMatchdayChange: (md: number) => void;
  totalMatchdays: number;
}

export default function MatchSimulator({
  matches,
  simulatedResults,
  onSimulate,
  selectedMatchday,
  onMatchdayChange,
  totalMatchdays,
}: Props) {
  const matchdayMatches = matches.filter(
    (m) => m.matchday === selectedMatchday
  );

  return (
    <div>
      {/* Matchday selector */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMatchdayChange(Math.max(1, selectedMatchday - 1))}
          disabled={selectedMatchday <= 1}
          className="px-3 py-1.5 rounded-lg bg-card border border-card-border text-sm disabled:opacity-30 hover:bg-white/10 transition"
        >
          ← Zurück
        </button>
        <span className="text-sm font-semibold">
          Spieltag {selectedMatchday} / {totalMatchdays}
        </span>
        <button
          onClick={() =>
            onMatchdayChange(Math.min(totalMatchdays, selectedMatchday + 1))
          }
          disabled={selectedMatchday >= totalMatchdays}
          className="px-3 py-1.5 rounded-lg bg-card border border-card-border text-sm disabled:opacity-30 hover:bg-white/10 transition"
        >
          Weiter →
        </button>
      </div>

      {/* Matches */}
      <div className="space-y-2">
        {matchdayMatches.map((match) => {
          const finished = isFinished(match.status);
          const live = isLive(match.status);
          const scheduled = isScheduled(match.status);
          const sim = simulatedResults[match.id];
          const hasHertha =
            match.homeTeamId === HERTHA_TEAM_ID ||
            match.awayTeamId === HERTHA_TEAM_ID;

          return (
            <div
              key={match.id}
              className={`
                rounded-xl border transition-all duration-300 p-3
                ${hasHertha ? "border-hertha/50 bg-hertha/10" : "border-card-border bg-card"}
                ${live ? "ring-1 ring-red-500/50" : ""}
              `}
            >
              {/* Status badge */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">
                  {new Date(match.utcDate).toLocaleDateString("de-DE", {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {live && (
                  <span className="animate-live text-xs font-bold text-red-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    LIVE
                  </span>
                )}
                {finished && (
                  <span className="text-xs text-green-500 font-medium">
                    Beendet
                  </span>
                )}
                {scheduled && (
                  <span className="text-xs text-gray-500">Simulierbar</span>
                )}
              </div>

              {/* Teams and score */}
              <div className="flex items-center justify-between gap-2">
                {/* Home team */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <TeamCrest teamId={match.homeTeamId} teamName={match.homeTeamName} className="w-7 h-7 flex-shrink-0" />
                  <span
                    className={`text-sm truncate ${match.homeTeamId === HERTHA_TEAM_ID ? "text-blue-300 font-bold" : ""}`}
                  >
                    {match.homeTeamName}
                  </span>
                </div>

                {/* Score */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {finished || live ? (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-lg font-bold w-8 text-center ${live ? "text-red-400" : ""}`}
                      >
                        {match.homeScore}
                      </span>
                      <span className="text-gray-500">:</span>
                      <span
                        className={`text-lg font-bold w-8 text-center ${live ? "text-red-400" : ""}`}
                      >
                        {match.awayScore}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={sim?.home ?? ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          onSimulate(
                            match.id,
                            val,
                            sim?.away ?? 0
                          );
                        }}
                        placeholder="-"
                        className="w-10 h-10 text-center text-lg font-bold bg-white/10 rounded-lg border border-card-border focus:border-hertha focus:outline-none focus:ring-1 focus:ring-hertha transition"
                      />
                      <span className="text-gray-500 font-bold">:</span>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={sim?.away ?? ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          onSimulate(
                            match.id,
                            sim?.home ?? 0,
                            val
                          );
                        }}
                        placeholder="-"
                        className="w-10 h-10 text-center text-lg font-bold bg-white/10 rounded-lg border border-card-border focus:border-hertha focus:outline-none focus:ring-1 focus:ring-hertha transition"
                      />
                    </div>
                  )}
                </div>

                {/* Away team */}
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span
                    className={`text-sm truncate text-right ${match.awayTeamId === HERTHA_TEAM_ID ? "text-blue-300 font-bold" : ""}`}
                  >
                    {match.awayTeamName}
                  </span>
                  <TeamCrest teamId={match.awayTeamId} teamName={match.awayTeamName} className="w-7 h-7 flex-shrink-0" />
                </div>
              </div>
            </div>
          );
        })}

        {matchdayMatches.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Keine Spiele für diesen Spieltag
          </div>
        )}
      </div>
    </div>
  );
}
