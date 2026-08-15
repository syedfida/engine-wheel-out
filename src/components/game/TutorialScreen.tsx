import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/game/GameContext";
import { GameButton, ZoneMeter } from "./ui";

interface Step {
  title: string;
  body: string;
  visual: "engine" | "meter" | "zones" | "launch" | "coins" | "garage";
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
    title: "FIND THE OPTIMAL ZONE",
    body: "The meter has four zones: LOW (0–30), NORMAL (30–60), OPTIMAL (60–85) and OVERDRIVE (85–100). The green OPTIMAL zone gives the best launch. OVERDRIVE is high-risk, high-reward.",
    visual: "zones",
  },
  {
    title: "TIME YOUR LAUNCH",
    body: "Press LAUNCH while the needle sits in the OPTIMAL zone. During the flight, hold the screen to stay high and swipe up for a boost.",
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
