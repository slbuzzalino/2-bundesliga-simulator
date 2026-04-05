"use client";

import { useEffect, useState } from "react";
import {
  getHerthaStatus,
  whatDoesHerthaNeed,
  getRandomPhrase,
  HERTHA_TEAM_ID,
} from "@/lib/simulator";
import type { TeamStanding, MatchData } from "@/lib/simulator";
import TeamCrest from "./TeamCrest";

interface Props {
  standings: TeamStanding[];
  remainingMatches: MatchData[];
}

export default function HerthaInfo({ standings, remainingMatches }: Props) {
  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    setPhrase(getRandomPhrase());
    const interval = setInterval(() => setPhrase(getRandomPhrase()), 8000);
    return () => clearInterval(interval);
  }, []);

  const status = getHerthaStatus(standings);
  const tips = whatDoesHerthaNeed(standings, remainingMatches);
  const hertha = standings.find((s) => s.teamId === HERTHA_TEAM_ID);

  if (!hertha) return null;

  return (
    <div className="rounded-2xl border-2 border-hertha/50 bg-gradient-to-br from-hertha/20 to-hertha/5 p-5">
      {/* Header with crest */}
      <div className="flex items-center gap-3 mb-4">
        <TeamCrest teamId={HERTHA_TEAM_ID} teamName="Hertha BSC" className="w-12 h-12" />
        <div>
          <h3 className="font-bold text-lg text-blue-300">Hertha BSC</h3>
          <p className="text-sm text-gray-400">
            Platz {status.position} · {hertha.points} Punkte
          </p>
        </div>
      </div>

      {/* Status badge */}
      <div
        className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-4
        ${status.promotion === "direct" ? "bg-green-500/20 text-green-400" : ""}
        ${status.promotion === "playoff" ? "bg-amber-500/20 text-amber-400" : ""}
        ${status.promotion === "none" ? "bg-gray-500/20 text-gray-400" : ""}
      `}
      >
        {status.promotion === "direct" && "🏆"}
        {status.promotion === "playoff" && "⚔️"}
        {status.message}
      </div>

      {/* What does Hertha need? */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">
          Was braucht Hertha?
        </h4>
        <ul className="space-y-1">
          {tips.map((tip, i) => (
            <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
              <span className="text-hertha-light mt-0.5">→</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Motivational phrase */}
      <div className="border-t border-hertha/30 pt-3 mt-3">
        <p className="text-center text-blue-300 font-bold text-sm italic transition-all duration-500">
          &ldquo;{phrase}&rdquo;
        </p>
      </div>
    </div>
  );
}
