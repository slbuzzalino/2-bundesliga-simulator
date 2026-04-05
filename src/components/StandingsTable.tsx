"use client";

import { HERTHA_TEAM_ID } from "@/lib/simulator";
import type { TeamStanding } from "@/lib/simulator";
import TeamCrest from "./TeamCrest";

interface Props {
  standings: TeamStanding[];
}

export default function StandingsTable({ standings }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-card-border text-xs text-gray-400 uppercase tracking-wider">
            <th className="py-3 px-2 text-left w-8">#</th>
            <th className="py-3 px-2 text-left">Verein</th>
            <th className="py-3 px-1 text-center hidden sm:table-cell">Sp</th>
            <th className="py-3 px-1 text-center hidden sm:table-cell">S</th>
            <th className="py-3 px-1 text-center hidden sm:table-cell">U</th>
            <th className="py-3 px-1 text-center hidden sm:table-cell">N</th>
            <th className="py-3 px-1 text-center hidden sm:table-cell">Tore</th>
            <th className="py-3 px-1 text-center">Diff</th>
            <th className="py-3 px-2 text-center font-bold">Pkt</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, idx) => {
            const pos = idx + 1;
            const isHertha = team.teamId === HERTHA_TEAM_ID;
            const zoneBg =
              pos <= 2
                ? "border-l-3 border-l-green-500"
                : pos === 3
                  ? "border-l-3 border-l-amber-500"
                  : pos >= 17
                    ? "border-l-3 border-l-red-500"
                    : pos === 16
                      ? "border-l-3 border-l-orange-500"
                      : "";

            return (
              <tr
                key={team.teamId}
                className={`
                  border-b border-card-border/50 transition-all duration-300
                  ${isHertha ? "hertha-row font-semibold" : "hover:bg-white/5"}
                  ${zoneBg}
                  ${isHertha ? "animate-pulse-glow" : ""}
                `}
              >
                <td className="py-2.5 px-2 text-center">
                  <span
                    className={`
                    inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                    ${pos <= 2 ? "bg-green-500/20 text-green-400" : ""}
                    ${pos === 3 ? "bg-amber-500/20 text-amber-400" : ""}
                    ${pos >= 17 ? "bg-red-500/20 text-red-400" : ""}
                    ${pos === 16 ? "bg-orange-500/20 text-orange-400" : ""}
                  `}
                  >
                    {pos}
                  </span>
                </td>
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-2">
                    <TeamCrest teamId={team.teamId} teamName={team.teamName} />
                    <span
                      className={`truncate max-w-[120px] sm:max-w-none ${isHertha ? "text-blue-300" : ""}`}
                    >
                      {team.teamName}
                    </span>
                    {isHertha && (
                      <span className="text-xs bg-hertha/30 text-blue-300 px-1.5 py-0.5 rounded-full">
                        💙
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-1 text-center text-gray-400 hidden sm:table-cell">
                  {team.played}
                </td>
                <td className="py-2.5 px-1 text-center text-green-400 hidden sm:table-cell">
                  {team.won}
                </td>
                <td className="py-2.5 px-1 text-center text-gray-400 hidden sm:table-cell">
                  {team.draw}
                </td>
                <td className="py-2.5 px-1 text-center text-red-400 hidden sm:table-cell">
                  {team.lost}
                </td>
                <td className="py-2.5 px-1 text-center text-gray-400 hidden sm:table-cell">
                  {team.goalsFor}:{team.goalsAgainst}
                </td>
                <td
                  className={`py-2.5 px-1 text-center ${team.goalDifference > 0 ? "text-green-400" : team.goalDifference < 0 ? "text-red-400" : "text-gray-400"}`}
                >
                  {team.goalDifference > 0 ? "+" : ""}
                  {team.goalDifference}
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span
                    className={`font-bold text-base ${isHertha ? "text-blue-300" : ""}`}
                  >
                    {team.points}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 px-2 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500/40" /> Aufstieg
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500/40" /> Relegation
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-orange-500/40" /> Abstiegs-Relegation
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/40" /> Abstieg
        </div>
      </div>
    </div>
  );
}
