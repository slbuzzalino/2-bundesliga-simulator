"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import StandingsTable from "@/components/StandingsTable";
import MatchSimulator from "@/components/MatchSimulator";
import HerthaInfo from "@/components/HerthaInfo";
import Celebration from "@/components/Celebration";
import {
  applySimulatedResults,
  getHerthaStatus,
  HERTHA_TEAM_ID,
} from "@/lib/simulator";
import { isScheduled } from "@/lib/football-api";
import { encodeSimulation } from "@/lib/share";
import type { TeamStanding, MatchData } from "@/lib/simulator";

export default function Home() {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [simulatedResults, setSimulatedResults] = useState<
    Record<number, { home: number; away: number }>
  >({});
  const [selectedMatchday, setSelectedMatchday] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [hasLive, setHasLive] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [standingsRes, matchesRes] = await Promise.all([
        fetch("/api/standings"),
        fetch("/api/matches"),
      ]);

      if (!standingsRes.ok || !matchesRes.ok) {
        throw new Error("API-Fehler");
      }

      const standingsData = await standingsRes.json();
      const matchesData = await matchesRes.json();

      setStandings(standingsData);
      setMatches(matchesData);

      // Find current matchday (first matchday with scheduled games)
      const scheduledMatch = matchesData.find((m: MatchData) =>
        isScheduled(m.status)
      );
      if (scheduledMatch) {
        setSelectedMatchday(scheduledMatch.matchday);
      } else {
        // All matches done — show last matchday
        const maxMd = Math.max(...matchesData.map((m: MatchData) => m.matchday));
        setSelectedMatchday(maxMd);
      }

      // Check for live matches
      const live = matchesData.some(
        (m: MatchData) =>
          m.status === "IN_PLAY" || m.status === "PAUSED" || m.status === "LIVE"
      );
      setHasLive(live);

      setError(null);
    } catch (err) {
      setError(
        "Daten konnten nicht geladen werden. Bitte stelle sicher, dass der FOOTBALL_DATA_API_KEY in der .env gesetzt ist."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling for live matches
  useEffect(() => {
    if (hasLive) {
      pollRef.current = setInterval(fetchData, 60000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [hasLive, fetchData]);

  // Calculate simulated standings
  const futureMatches = matches.filter((m) => isScheduled(m.status));
  const simulatedStandings =
    Object.keys(simulatedResults).length > 0
      ? applySimulatedResults(standings, futureMatches, simulatedResults)
      : standings;

  const herthaStatus = getHerthaStatus(simulatedStandings);
  const totalMatchdays =
    matches.length > 0
      ? Math.max(...matches.map((m) => m.matchday))
      : 34;

  const handleSimulate = (matchId: number, home: number, away: number) => {
    setSimulatedResults((prev) => ({
      ...prev,
      [matchId]: { home, away },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const encoded = encodeSimulation(simulatedResults);
      const url = `${window.location.origin}/sim/${encoded}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
    } catch {
      alert("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSimHerthaWins = () => {
    // Get teams currently above Hertha (rivals for promotion)
    const herthaIdx = simulatedStandings.findIndex(
      (s) => s.teamId === HERTHA_TEAM_ID
    );
    const rivalsAbove = new Set(
      simulatedStandings.slice(0, Math.max(herthaIdx, 2)).map((s) => s.teamId)
    );

    const newResults: Record<number, { home: number; away: number }> = {};
    futureMatches.forEach((m) => {
      const herthaHome = m.homeTeamId === HERTHA_TEAM_ID;
      const herthaAway = m.awayTeamId === HERTHA_TEAM_ID;

      if (herthaHome) {
        // Hertha at home: wins 3-0
        newResults[m.id] = { home: 3, away: 0 };
      } else if (herthaAway) {
        // Hertha away: wins 0-3
        newResults[m.id] = { home: 0, away: 3 };
      } else {
        // Non-Hertha match: rivals lose, others draw
        const homeIsRival = rivalsAbove.has(m.homeTeamId);
        const awayIsRival = rivalsAbove.has(m.awayTeamId);

        if (homeIsRival && awayIsRival) {
          // Two rivals face each other: draw (both drop points)
          newResults[m.id] = { home: 1, away: 1 };
        } else if (homeIsRival) {
          // Home team is a rival: they lose
          newResults[m.id] = { home: 0, away: 2 };
        } else if (awayIsRival) {
          // Away team is a rival: they lose
          newResults[m.id] = { home: 2, away: 0 };
        } else {
          // No rivals involved: draw
          newResults[m.id] = { home: 1, away: 1 };
        }
      }
    });
    setSimulatedResults(newResults);
  };

  const handleResetSim = () => {
    setSimulatedResults({});
    setShareUrl(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-hertha border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Lade 2. Bundesliga Daten...</p>
          <p className="text-xs text-gray-600 mt-2">Ha Ho He!</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <Celebration type={herthaStatus.promotion} />

      {/* Header */}
      <header className="bg-gradient-to-r from-hertha/30 via-hertha/10 to-transparent border-b border-card-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-hertha rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-hertha/30">
              2.
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">
                Bundesliga Simulator
              </h1>
              <p className="text-sm text-gray-400">
                Steigt Hertha BSC auf? Simuliere es!
              </p>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 mt-6">
        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={handleAutoSimHerthaWins}
            className="px-4 py-2 rounded-xl bg-hertha/20 border border-hertha/40 text-blue-300 text-sm font-medium hover:bg-hertha/30 transition"
          >
            💙 Hertha gewinnt alles
          </button>
          <button
            onClick={handleResetSim}
            className="px-4 py-2 rounded-xl bg-card border border-card-border text-gray-400 text-sm hover:bg-white/10 transition"
          >
            ↺ Zurücksetzen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(simulatedResults).length === 0}
            className="px-4 py-2 rounded-xl bg-card border border-card-border text-gray-400 text-sm hover:bg-white/10 transition disabled:opacity-30"
          >
            {saving ? "Speichern..." : "📎 Simulation teilen"}
          </button>
          {shareUrl && (
            <span className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              ✓ Link kopiert!
            </span>
          )}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Standings */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-card rounded-2xl border border-card-border p-4 sm:p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-hertha" />
                Tabelle
                {Object.keys(simulatedResults).length > 0 && (
                  <span className="text-xs bg-hertha/20 text-blue-300 px-2 py-0.5 rounded-full">
                    Simuliert
                  </span>
                )}
              </h2>
              <StandingsTable standings={simulatedStandings} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 order-1 lg:order-2">
            {/* Hertha Info */}
            <HerthaInfo
              standings={simulatedStandings}
              remainingMatches={futureMatches}
            />

            {/* Match Simulator */}
            <div className="bg-card rounded-2xl border border-card-border p-4">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-amber-500" />
                Spiele simulieren
              </h2>
              <MatchSimulator
                matches={matches}
                simulatedResults={simulatedResults}
                onSimulate={handleSimulate}
                selectedMatchday={selectedMatchday}
                onMatchdayChange={setSelectedMatchday}
                totalMatchdays={totalMatchdays}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      {hasLive && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/40 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-live" />
          <span className="text-xs text-red-400 font-medium">
            Live-Update alle 60s
          </span>
        </div>
      )}
    </main>
  );
}
