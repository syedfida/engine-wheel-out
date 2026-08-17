import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/game/GameContext";
import { GameButton, ZoneMeter } from "./ui";

interface Step {
  title: string;
  body: string;
  visual: "engine" | "meter" | "zones" | "launch" | "stick" | "coins" | "garage";
}

const STEPS: Step[] = [
  {
    title: "START THE ENGINE",
    body: "Every run begins here. Press START ENGINE and the fictional engine roars to life. Then hold the button to build RPM fast.",
    visual: "engine",
  },
  {
    title: "BUILD RPM",
    body: "Watch the RPM meter climb. The higher the RPM, the more power builds up — and the stronger the launch.",
    visual: "meter",
  },
  {
    title: "THE PUSHER STICK",
    body: "The engine is bolted to a hydraulic PUSHER STICK. As the RPM climbs, the stick pumps and shoves the tyre up the ramp — then SLAMS it off the lip at launch.",
    visual: "stick",
  },
  {
    title: "FIND THE OPTIMAL ZONE",
    body: "The meter has four zones: LOW (0–30), NORMAL (30–60), OPTIMAL (60–85) and OVERDRIVE (85–100). The green OPTIMAL zone gives the best launch. OVERDRIVE is high-risk, high-reward.",
    visual: "zones",
  },
  {
    title: "TIME YOUR LAUNCH",
    body: "Press LAUNCH while the needle sits in the OPTIMAL zone. The engine fires, the stick throws the tyre, and it flies. During flight, hold the screen to stay high and swipe up for a boost.",
    visual: "launch",
  },
  {
    title: "EARN COINS",
    body: "Every launch earns fictional coins — more for long distances, high accuracy and new records. Coins only live inside the game.",
    visual: "coins",
  },
  {
    title: "UPGRADE YOUR EQUIPMENT",
    body: "Spend coins in the GARAGE on Engine Power, Wheel Bounce, Ramp Launch and more. Every upgrade changes how the wheel actually flies.",
    visual: "garage",
  },
];

/** Mini diagram of the engine → pusher stick → tyre → ramp mechanism. */
function PusherStickDiagram() {
  return (
    <svg viewBox="0 0 300 130" className="h-full w-full" role="img" aria-label="Engine with pusher stick launching a tyre off a ramp">
      {/* ground */}
      <line x1="0" y1="118" x2="300" y2="118" stroke="#3f6b2f" strokeWidth="4" strokeLinecap="round" />
      {/* ramp */}
      <polygon points="150,118 270,70 278,76 158,124" fill="#7a5230" stroke="#4a3318" strokeWidth="2" />
      <line x1="158" y1="124" x2="150" y2="118" stroke="#4a3318" strokeWidth="2" />
      {/* engine block */}
      <rect x="18" y="74" width="58" height="36" rx="7" fill="#47534a" stroke="#1f2821" strokeWidth="2" />
      <rect x="26" y="80" width="14" height="7" rx="2" fill="#5d6b60" />
      <rect x="48" y="80" width="14" height="7" rx="2" fill="#5d6b60" />
      <path d="M74 86 L90 80 L96 84" stroke="#20261f" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* engine glow (running) */}
      <circle cx="96" cy="84" r="6" fill="#ff9a3c" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="0.7s" repeatCount="indefinite" />
      </circle>
      {/* cradle */}
      <rect x="14" y="112" width="66" height="8" rx="4" fill="#3a2f20" />
      {/* hydraulic cylinder */}
      <rect x="70" y="84" width="34" height="16" rx="6" fill="#8f929b" stroke="#3a3d42" strokeWidth="2" />
      {/* piston rod — the pusher stick */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;4 0;0 0" dur="0.8s" repeatCount="indefinite" />
        <line x1="104" y1="92" x2="196" y2="60" stroke="#d7dbe2" strokeWidth="7" strokeLinecap="round" />
        {/* fork head cupping the tyre */}
        <path d="M186 44 L206 44 M186 74 L206 74 M196 60 L206 60" stroke="#2e2e33" strokeWidth="6" strokeLinecap="round" />
      </g>
      {/* tyre on the ramp */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;4 -2;0 0" dur="0.8s" repeatCount="indefinite" />
        <circle cx="206" cy="52" r="22" fill="#26262c" stroke="#0e0e11" strokeWidth="3" />
        <circle cx="206" cy="52" r="14" fill="#8f929b" />
        <circle cx="206" cy="52" r="5" fill="#6b6f78" />
        <g stroke="#6b6f78" strokeWidth="4" strokeLinecap="round">
          <line x1="206" y1="38" x2="206" y2="66" />
          <line x1="192" y1="52" x2="220" y2="52" />
        </g>
      </g>
      {/* ramp label */}
      <text x="248" y="62" fill="#ffd54a" fontSize="9" fontWeight="800" fontFamily="sans-serif">RAMP</text>
      <text x="22" y="60" fill="#9be8b0" fontSize="9" fontWeight="800" fontFamily="sans-serif">ENGINE</text>
    </svg>
  );
}

function StepVisual({ kind }: { kind: Step["visual"] }) {
  switch (kind) {
    case "engine":
      return (
        <div className="flex h-28 items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="text-7xl drop-shadow-[0_0_24px_rgba(255,160,60,0.5)]"
          >
            ⚙️
          </motion.div>
        </div>
      );
    case "meter":
      return (
        <div className="flex h-28 flex-col justify-center px-6">
          <ZoneMeter rpm={52} />
        </div>
      );
    case "zones":
      return (
        <div className="flex h-28 flex-col justify-center px-6">
          <ZoneMeter rpm={72} />
          <div className="mt-2 flex justify-center gap-1.5 text-[9px] font-bold text-white/80">
            <span className="rounded bg-slate-500/40 px-1.5 py-0.5">LOW</span>
            <span className="rounded bg-sky-500/40 px-1.5 py-0.5">NORMAL</span>
            <span className="rounded bg-green-500/60 px-1.5 py-0.5 text-black">OPTIMAL</span>
            <span className="rounded bg-amber-500/50 px-1.5 py-0.5">OVERDRIVE</span>
          </div>
        </div>
      );
    case "launch":
      return (
        <div className="flex h-28 items-center justify-center">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1.1 }}
            className="rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 px-10 py-4 font-arcade text-lg text-amber-950 shadow-xl"
          >
            LAUNCH
          </motion.div>
        </div>
      );
    case "stick":
      return (
        <div className="h-32 px-4">
          <PusherStickDiagram />
        </div>
      );
    case "coins":
      return (
        <div className="flex h-28 items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
              className="text-5xl"
            >
              🪙
            </motion.div>
          ))}
        </div>
      );
    case "garage":
      return (
        <div className="flex h-28 items-center justify-center px-8">
          <div className="w-full rounded-2xl border border-white/20 bg-black/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-white/70">ENGINE POWER</span>
              <span className="font-arcade text-xs text-amber-300">Lv 1 → 2</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/3 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-bold text-white/60">
              <span>+6 Power</span>
              <span className="text-amber-300">400 🪙</span>
            </div>
          </div>
        </div>
      );
  }
}

export function TutorialScreen() {
  const { go, completeTutorial } = useGame();
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[radial-gradient(ellipse_at_center,#0d2b16_0%,#050f08_75%)]">
      <div className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <span className="font-arcade text-[10px] tracking-widest text-emerald-300">TUTORIAL</span>
        <button
          type="button"
          onClick={() => {
            completeTutorial();
            go("menu");
          }}
          className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-white/80 hover:bg-white/20"
        >
          SKIP
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <StepVisual kind={current.visual} />
            <h2 className="mt-6 text-center font-arcade text-xl text-white drop-shadow">{current.title}</h2>
            <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-white/80">
              {current.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-4 px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-emerald-400" : "w-1.5 bg-white/25"}`}
            />
          ))}
        </div>
        <GameButton
          variant="gold"
          className="w-full max-w-xs py-4 text-lg"
          onClick={() => {
            if (last) {
              completeTutorial();
              go("gameplay");
            } else {
              setStep((s) => s + 1);
            }
          }}
          silent
        >
          {last ? "LET'S GO!" : "NEXT"}
        </GameButton>
      </div>
    </div>
  );
}
