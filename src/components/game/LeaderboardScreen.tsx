import { motion } from "framer-motion";
import { RECORD_LABELS } from "@/game/config";
import { useGame } from "@/game/GameContext";
import { AnimatedNumber, ScreenTitle } from "./ui";

export function LeaderboardScreen() {
  const { save, go } = useGame();
  const hs = save.highScores;

  const formatRecord = (key: string, n: number) => {
    if (key === "bestAccuracy") return `${Math.round(n)}%`;
    if (key === "bestAirTime") return `${n.toFixed(1)} s`;
    const unit = RECORD_LABELS.find((r) => r.key === key)?.unit ?? "";
    return `${Math.round(n).toLocaleString()}${unit}`;
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[radial-gradient(ellipse_at_top,#0f331d_0%,#06140b_60%)]">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-[calc(env(safe-area-inset-top)+0.9rem)]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => go("menu")}
            className="rounded-full border border-white/20 bg-black/35 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm hover:bg-black/55"
          >
            ← MENU
          </button>
          <ScreenTitle>LEADERBOARD</ScreenTitle>
          <div className="w-20" />
        </div>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-white/55">
          PERSONAL RECORDS — all scores are stored on this device only.
          <br />
          Online rankings arrive in a future version.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          {RECORD_LABELS.map((r, i) => (
            <motion.div
              key={r.key}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between rounded-3xl border border-white/12 bg-black/30 px-5 py-4 backdrop-blur-md"
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl font-arcade text-sm ${
                    i === 0 ? "bg-amber-500/25 text-amber-300" : "bg-white/10 text-white/70"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-extrabold tracking-wide text-white">{r.label}</span>
              </div>
              <span className="font-arcade text-lg text-emerald-300">
                <AnimatedNumber value={hs[r.key] as number} duration={700} format={(n) => formatRecord(r.key, n)} />
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 rounded-3xl border border-white/12 bg-black/25 p-4 backdrop-blur-md">
          <div className="text-[10px] font-bold tracking-widest text-white/50">CAREER TOTALS</div>
          <div className="mt-2 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="font-arcade text-lg text-white">{hs.totalLaunches}</div>
              <div className="text-[9px] font-bold tracking-widest text-white/50">LAUNCHES</div>
            </div>
            <div>
              <div className="font-arcade text-lg text-white">{(hs.totalDistance ?? 0).toLocaleString()} m</div>
              <div className="text-[9px] font-bold tracking-widest text-white/50">TOTAL DISTANCE</div>
            </div>
            <div>
              <div className="font-arcade text-lg text-white">{(hs.totalScore ?? 0).toLocaleString()}</div>
              <div className="text-[9px] font-bold tracking-widest text-white/50">TOTAL POINTS</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
