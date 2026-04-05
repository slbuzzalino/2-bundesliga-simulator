"use client";

import { useEffect, useState, use } from "react";
import StandingsTable from "@/components/StandingsTable";
import HerthaInfo from "@/components/HerthaInfo";
import Celebration from "@/components/Celebration";
import { applySimulatedResults, getHerthaStatus } from "@/lib/simulator";
import { isScheduled } from "@/lib/football-api";
import { decodeSimulation } from "@/lib/share";
import type { TeamStanding, MatchData } from "@/lib/simulator";

export default function SharedSimulation({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [simulatedResults, setSimulatedResults] = useState<
    Record<number, { home: number; away: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Decode simulation from URL
        const decoded = decodeSimulation(slug);
        if (!decoded) {
          setError("Simulation nicht gefunden oder ungültiger Link.");
          setLoading(false);
          return;
        }

        const [standingsRes, matchesRes] = await Promise.all([
          fetch("/api/standings"),
          fetch("/api/matches"),
        ]);

        if (!standingsRes.ok || !matchesRes.ok) {
          setError("Fehler beim Laden der Daten.");
          setLoading(false);
          return;
        }

        const standingsData = await standingsRes.json();
        const matchesData = await matchesRes.json();

        setStandings(standingsData);
        setMatches(matchesData);
        setSimulatedResults(decoded);
      } catch {
        setError("Fehler beim Laden der Simulation.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const futureMatches = matches.filter((m) => isScheduled(m.status));
  const simulatedStandings =
    Object.keys(simulatedResults).length > 0
      ? applySimulatedResults(standings, futureMatches, simulatedResults)
      : standings;

  const herthaStatus = getHerthaStatus(simulatedStandings);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-hertha border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Lade Simulation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 text-lg">{error}</p>
          <a
            href="/"
            className="mt-4 inline-block text-hertha-light hover:underline"
          >
            ← Zurück zum Simulator
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <Celebration type={herthaStatus.promotion} />

      <header className="bg-gradient-to-r from-hertha/30 via-hertha/10 to-transparent border-b border-card-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-hertha rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-hertha/30">
                2.
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black">
                  Geteilte Simulation
                </h1>
                <p className="text-sm text-gray-400">
                  Jemand hat diese Simulation mit dir geteilt
                </p>
              </div>
            </div>
            <a
              href="/"
              className="px-4 py-2 rounded-xl bg-hertha/20 border border-hertha/40 text-blue-300 text-sm font-medium hover:bg-hertha/30 transition"
            >
              Selbst simulieren →
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border border-card-border p-4 sm:p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-hertha" />
                Simulierte Tabelle
              </h2>
              <StandingsTable standings={simulatedStandings} />
            </div>
          </div>

          <div>
            <HerthaInfo
              standings={simulatedStandings}
              remainingMatches={futureMatches}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
