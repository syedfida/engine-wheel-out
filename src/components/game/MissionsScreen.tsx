import { useState } from "react";
import { motion } from "framer-motion";
import { ACHIEVEMENTS, MISSIONS } from "@/game/config";
import { useGame } from "@/game/GameContext";
import { cn } from "@/lib/utils";
import { CoinPill, GameButton, ScreenTitle } from "./ui";

type Tab = "missions" | "achievements";

export function MissionsScreen() {
  const { save, go, claimMission } = useGame();
  const [tab, setTab] = useState<Tab>("missions");

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
          <ScreenTitle>MISSIONS</ScreenTitle>
          <CoinPill coins={save.player.coins} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-2xl border border-white/15 bg-black/30 p-1">
          {(["missions", "achievements"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-xl py-2 text-[11px] font-extrabold tracking-widest transition-colors",
                tab === t ? "bg-emerald-600 text-white shadow" : "text-white/60 hover:bg-white/10",
              )}
            >
              {t === "missions" ? "MISSIONS" : "ACHIEVEMENTS"}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {tab === "missions" ? (
            MISSIONS.map((m) => {
              const st = save.missions[m.id];
              const done = (st?.progress ?? 0) >= m.target;
              const claimed = st?.claimed ?? false;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-3xl border p-4 backdrop-blur-md",
                    done && !claimed
                      ? "border-emerald-300/50 bg-emerald-500/10"
                      : claimed
                        ? "border-white/10 bg-black/25"
                        : "border-white/12 bg-black/30",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-extrabold tracking-wide text-white">{m.name}</div>
                    {claimed ? (
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-extrabold tracking-widest text-white/60">
                        CLAIMED ✓
                      </span>
                    ) : done ? (
                      <span className="animate-pulse rounded-full bg-emerald-500/30 px-2.5 py-1 text-[9px] font-extrabold tracking-widest text-emerald-200">
                        READY!
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-[11px] text-white/60">{m.desc}</div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-[width] duration-700"
                      style={{ width: `${Math.min(100, ((st?.progress ?? 0) / m.target) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/55 tabular-nums">
                      {Math.min((st?.progress ?? 0), m.target).toLocaleString()} / {m.target.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-bold text-amber-200">
                      Reward: 🪙 {m.rewardCoins.toLocaleString()}
                      {m.rewardCosmetic ? " + cosmetic" : ""}
                    </span>
                  </div>
                  {done && !claimed && (
                    <GameButton variant="gold" className="mt-3 w-full py-2.5 text-sm" onClick={() => claimMission(m.id)}>
                      CLAIM REWARD
                    </GameButton>
                  )}
                </motion.div>
              );
            })
          ) : (
            ACHIEVEMENTS.map((a) => {
              const st = save.achievements[a.id];
              const unlocked = st?.unlockedAt !== null && st?.unlockedAt !== undefined;
              const prog = st?.progress ?? 0;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-3xl border p-4 backdrop-blur-md",
                    unlocked
                      ? "border-amber-300/50 bg-gradient-to-b from-amber-500/15 to-black/25 shadow-[0_0_24px_rgba(245,179,1,0.15)]"
                      : "border-white/12 bg-black/30",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{unlocked ? "🏆" : "🔒"}</span>
                      <div>
                        <div className={cn("text-sm font-extrabold tracking-wide", unlocked ? "text-amber-200" : "text-white/80")}>
                          {a.name}
                        </div>
                        <div className="text-[10px] text-white/50">{a.desc}</div>
                      </div>
                    </div>
                    {unlocked && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="rounded-full bg-amber-500/25 px-2.5 py-1 text-[9px] font-extrabold tracking-widest text-amber-200"
                      >
                        UNLOCKED
                      </motion.span>
                    )}
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-700",
                        unlocked ? "bg-gradient-to-r from-amber-400 to-amber-200" : "bg-white/30",
                      )}
                      style={{ width: `${Math.min(100, (prog / a.target) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] font-bold text-white/55">
                    <span className="tabular-nums">
                      {Math.min(prog, a.target).toLocaleString()} / {a.target.toLocaleString()}
                    </span>
                    <span className="text-amber-200/80">Reward: 🪙 {a.rewardCoins.toLocaleString()}</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
