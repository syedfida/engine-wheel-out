import { useMemo } from "react";
import { motion } from "framer-motion";
import { zoneForRpm } from "@/game/config";
import { useGame } from "@/game/GameContext";
import { AnimatedNumber, GameButton, Panel, ScreenTitle, StatChip } from "./ui";

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: (i % 10) * 0.12,
        duration: 1.6 + (i % 5) * 0.25,
        color: ["#22c55e", "#f5b301", "#ffffff", "#38bdf8", "#f97316"][i % 5],
        size: 6 + (i % 4) * 3,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          initial={{ y: -30, x: `${p.left}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", x: `calc(${p.left}vw + ${(i % 3) * 40 - 40}px)`, opacity: 0.6, rotate: 720 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          className="absolute top-0"
          style={{ width: p.size, height: p.size, background: p.color, borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

export function ResultScreen() {
  const { save, pendingRun, go, combo } = useGame();

  if (!pendingRun) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <p className="font-arcade text-white">NO RUN DATA</p>
          <GameButton variant="gold" onClick={() => go("menu")}>
            HOME
          </GameButton>
        </div>
      </div>
    );
  }

  const run = pendingRun;
  const zone = zoneForRpm(run.quality.rpm);
  const b = run.breakdown;
  const reduced = save.settings.reducedEffects;

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[radial-gradient(ellipse_at_center,#0f331d_0%,#06140b_70%)]">
      {run.isNewRecord && !reduced && <Confetti />}

      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        <ScreenTitle className="text-center text-3xl">LAUNCH COMPLETE!</ScreenTitle>

        {/* zone badge */}
        <div className="mt-2 flex justify-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-[10px] font-extrabold tracking-widest text-white"
            style={{ background: `${zone.color}66` }}
          >
            {zone.label} ZONE · {Math.round(run.quality.rpm)}% RPM
          </span>
          {run.quality.perfect && (
            <span className="animate-pulse rounded-full bg-emerald-500/30 px-3 py-1 text-[10px] font-extrabold tracking-widest text-emerald-200">
              PERFECT TIMING!
            </span>
          )}
          {run.quality.backfire && (
            <span className="rounded-full bg-red-500/25 px-3 py-1 text-[10px] font-extrabold tracking-widest text-red-200">
              BACKFIRE!
            </span>
          )}
        </div>

        {/* new record */}
        {run.isNewRecord && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.2 }}
            className="mt-4 rounded-2xl border-2 border-amber-300/60 bg-gradient-to-b from-amber-500/25 to-amber-600/10 p-4 text-center shadow-[0_0_40px_rgba(245,179,1,0.35)]"
          >
            <div className="font-arcade text-2xl text-amber-300 drop-shadow">NEW RECORD!</div>
            <div className="mt-1 text-[10px] font-bold tracking-widest text-amber-200/80">
              {run.recordsBroken.join(" · ")}
            </div>
          </motion.div>
        )}

        {/* stats */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <StatChip label="DISTANCE" value={<AnimatedNumber value={Math.round(run.stats.distance)} format={(n) => `${n.toLocaleString()} m`} />} />
          <StatChip label="HEIGHT" value={<AnimatedNumber value={Math.round(run.stats.height)} format={(n) => `${n} m`} />} accent />
          <StatChip label="AIR TIME" value={<AnimatedNumber value={run.stats.airTime} duration={1000} format={(n) => `${n.toFixed(1)} s`} />} />
          <StatChip label="ACCURACY" value={<AnimatedNumber value={Math.round(run.stats.accuracy)} format={(n) => `${n}%`} />} />
        </div>

        {/* score */}
        <Panel className="mt-4 p-5 text-center">
          <div className="text-[10px] font-bold tracking-[0.3em] text-white/60">FINAL SCORE</div>
          <div className="mt-1 font-arcade text-5xl text-emerald-300 drop-shadow-[0_3px_0_rgba(0,0,0,0.5)]">
            <AnimatedNumber value={b.total} duration={1300} format={(n) => n.toLocaleString()} />
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {[
              { label: "DIST", v: b.distance },
              { label: "HEIGHT", v: b.height },
              { label: "ACC", v: b.accuracy },
              { label: "COMBO", v: b.combo },
              { label: "UPGRADE", v: b.upgrade },
            ].map((s) => (
              <span key={s.label} className="rounded-lg bg-white/10 px-2 py-1 text-[9px] font-bold text-white/75">
                {s.label} +{s.v.toLocaleString()}
              </span>
            ))}
          </div>
        </Panel>

        {/* rewards */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Panel className="p-4 text-center">
            <div className="text-[10px] font-bold tracking-widest text-white/60">COINS EARNED</div>
            <div className="mt-1 font-arcade text-2xl text-amber-300">
              +<AnimatedNumber value={run.coins} duration={1100} format={(n) => n.toLocaleString()} />
            </div>
          </Panel>
          <Panel className="p-4 text-center">
            <div className="text-[10px] font-bold tracking-widest text-white/60">XP EARNED</div>
            <div className="mt-1 font-arcade text-2xl text-sky-300">
              +<AnimatedNumber value={run.xp} duration={1100} format={(n) => n.toLocaleString()} />
            </div>
          </Panel>
        </div>

        {/* extras */}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {run.combo > 1 && (
            <span className="rounded-full bg-amber-500/20 px-3 py-1.5 font-arcade text-xs text-amber-300">
              COMBO x{run.combo}
            </span>
          )}
          {run.levelUps > 0 && (
            <span className="animate-pulse rounded-full bg-emerald-500/25 px-3 py-1.5 font-arcade text-xs text-emerald-200">
              LEVEL {save.player.level}! +{run.levelUps * 150} COINS
            </span>
          )}
          {run.achievementUnlocks.length > 0 && (
            <span className="rounded-full bg-sky-500/20 px-3 py-1.5 font-arcade text-xs text-sky-200">
              {run.achievementUnlocks.length} ACHIEVEMENT{run.achievementUnlocks.length > 1 ? "S" : ""} UNLOCKED
            </span>
          )}
          {run.locationUnlocks.length > 0 && (
            <span className="rounded-full bg-fuchsia-500/20 px-3 py-1.5 font-arcade text-xs text-fuchsia-200">
              NEW LOCATION{run.locationUnlocks.length > 1 ? "S" : ""}!
            </span>
          )}
          {combo > 1 && (
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/70">
              +{run.comboGain} combo
            </span>
          )}
        </div>

        {/* actions */}
        <div className="mt-6 flex flex-col gap-2.5">
          <GameButton variant="gold" className="py-4 text-lg" onClick={() => go("gameplay")}>
            ▶ PLAY AGAIN
          </GameButton>
          <div className="grid grid-cols-2 gap-2.5">
            <GameButton variant="dark" onClick={() => go("garage")}>
              🔧 UPGRADE
            </GameButton>
            <GameButton variant="dark" onClick={() => go("menu")}>
              🏠 HOME
            </GameButton>
          </div>
          <GameButton variant="ghost" onClick={() => go("leaderboard")}>
            🏆 JOIN THE LEADERBOARD
          </GameButton>
        </div>
      </div>
    </div>
  );
}
