"use client";

import { useEffect, useState } from "react";

interface Props {
  type: "direct" | "playoff" | "none";
}

const CONFETTI_COLORS = ["#005CA9", "#FFFFFF", "#FFD700", "#00C853", "#2196F3"];

function ConfettiPiece({ index }: { index: number }) {
  const style = {
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 2}s`,
    animationDuration: `${2 + Math.random() * 2}s`,
    backgroundColor:
      CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    width: `${6 + Math.random() * 8}px`,
    height: `${6 + Math.random() * 8}px`,
    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
  };

  return (
    <div
      key={index}
      className="absolute animate-confetti"
      style={style}
    />
  );
}

export default function Celebration({ type }: Props) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (type !== "none") {
      setShow(true);
      setDismissed(false);
    } else {
      setShow(false);
    }
  }, [type]);

  if (!show || dismissed || type === "none") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setDismissed(true)}
      />

      {/* Card */}
      <div className="relative z-10 animate-slide-up max-w-md mx-4">
        <div
          className={`
          rounded-2xl p-8 text-center shadow-2xl border-2
          ${type === "direct" ? "bg-gradient-to-br from-green-900/90 to-green-950/90 border-green-500" : "bg-gradient-to-br from-amber-900/90 to-amber-950/90 border-amber-500"}
        `}
        >
          <div className="text-6xl mb-4">
            {type === "direct" ? "🏆" : "⚔️"}
          </div>
          <h2 className="text-3xl font-black mb-2">
            {type === "direct"
              ? "AUFSTIEG!"
              : "RELEGATION!"}
          </h2>
          <p className="text-lg mb-2">
            {type === "direct"
              ? "Hertha BSC steigt direkt in die Bundesliga auf!"
              : "Hertha BSC hat den Relegationsplatz erreicht!"}
          </p>
          <p className="text-2xl font-bold mt-4">
            Ha Ho He — Hertha BSC! 💙🤍
          </p>
          <button
            onClick={() => setDismissed(true)}
            className={`
              mt-6 px-6 py-2 rounded-full font-bold text-sm transition
              ${type === "direct" ? "bg-green-500 hover:bg-green-400 text-black" : "bg-amber-500 hover:bg-amber-400 text-black"}
            `}
          >
            Weiter simulieren
          </button>
        </div>
      </div>
    </div>
  );
}
