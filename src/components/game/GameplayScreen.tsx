import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { audio } from "@/game/audio";
import { OPTIMAL_CENTER, zoneForRpm } from "@/game/config";
import { useGame } from "@/game/GameContext";
import { levelProgress } from "@/game/progression";
import { GameRenderer } from "@/game/render/engine";
import { computeLaunchQuality } from "@/game/scoring";
import type { HudData, LaunchQuality } from "@/game/types";
import { CoinPill, GameButton, LevelPill, StatChip, ZoneMeter } from "./ui";

export function GameplayScreen() {
  const { save, go, completeRun, combo } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const qualityRef = useRef<LaunchQuality | null>(null);
  const phaseRef = useRef<string>("idle");
  const [hud, setHud] = useState<HudData>({
    phase: "idle", rpm: 0, power: 0, distance: 0, height: 0, airTime: 0, speed: 0, combo: 0, airFuel: 0,
  });
  const [paused, setPaused] = useState(false);
  const swipeStartY = useRef<number | null>(null);
  const phase = hud.phase;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new GameRenderer(
      canvas,
      {
        graphics: save.settings.graphics,
        reducedEffects: save.settings.reducedEffects,
        vibration: save.settings.vibration,
        locationId: save.locations.selected,
        equipped: save.cosmetics.equipped,
        upgrades: save.upgrades,
      },
      {
        onHud: (h) => {
          phaseRef.current = h.phase;
          setHud(h);
        },
        onFlightComplete: (stats) => {
          if (qualityRef.current) {
            completeRun(qualityRef.current, stats);
          } else {
            go("result");
          }
        },
      },
    );
    renderer.setMode("gameplay");
    rendererRef.current = renderer;
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep renderer in sync with settings/location/cosmetics/upgrades
  useEffect(() => {
    rendererRef.current?.applyConfig({
      graphics: save.settings.graphics,
      reducedEffects: save.settings.reducedEffects,
      vibration: save.settings.vibration,
      locationId: save.locations.selected,
      equipped: save.cosmetics.equipped,
      upgrades: save.upgrades,
    });
  }, [save.settings, save.locations.selected, save.cosmetics.equipped, save.upgrades]);

  // Auto-pause when the app goes to background
  useEffect(() => {
    const onVis = () => {
      const p = phaseRef.current;
      if (document.hidden && ["building", "launching", "flight", "landing"].includes(p)) {
        setPaused(true);
        rendererRef.current?.pause();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const lp = levelProgress(save.player);
  const zone = zoneForRpm(hud.rpm);
  const inOptimal = hud.rpm >= 60 && hud.rpm < 85;
  const canLaunch = phase === "idle" || phase === "building";
  const engineActive = phase === "building" || phase === "launching";

  const startEngine = () => {
    audio.unlock();
    rendererRef.current?.startEngine();
  };

  const doLaunch = () => {
    if (!canLaunch) return;
    const quality = computeLaunchQuality(hud.rpm, save.upgrades);
    qualityRef.current = quality;
    rendererRef.current?.launch(quality);
  };

  const togglePause = (on: boolean) => {
    setPaused(on);
    if (on) rendererRef.current?.pause();
    else rendererRef.current?.resume();
  };

  const restart = () => {
    setPaused(false);
    rendererRef.current?.resume();
    rendererRef.current?.resetRun();
  };

  return (
    <div
      className="fixed inset-0 touch-none select-none overflow-hidden bg-black"
      onPointerDown={(e) => {
        swipeStartY.current = e.clientY;
        if (phase === "flight") {
          rendererRef.current?.setAirHolding(true);
        }
      }}
      onPointerUp={(e) => {
        // swipe up = air boost
        if (phase === "flight" && swipeStartY.current !== null) {
          const dy = e.clientY - swipeStartY.current;
          if (dy < -45) rendererRef.current?.airBoost();
        }
        swipeStartY.current = null;
        rendererRef.current?.setAirHolding(false);
      }}
      onPointerCancel={() => {
        swipeStartY.current = null;
        rendererRef.current?.setAirHolding(false);
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* top HUD */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 pt-[calc(env(safe-area-inset-top)+0.6rem)]">
        <LevelPill level={lp.level} xpRatio={lp.ratio} />
        <CoinPill coins={save.player.coins} />
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-[9px] font-bold tracking-widest text-white/60">BEST</span>
            <span className="font-arcade text-sm text-white tabular-nums">
              {save.highScores.bestScore.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => togglePause(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-lg text-white backdrop-blur-sm"
            aria-label="Pause"
          >
            ⏸
          </button>
        </div>
      </div>

      {/* combo chip */}
      <AnimatePresence>
        {combo > 1 && (
          <motion.div
            key="combo"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="absolute right-4 top-24 z-20 rounded-2xl border border-amber-300/40 bg-amber-500/20 px-4 py-2 text-center backdrop-blur-sm"
          >
            <div className="font-arcade text-lg text-amber-300">COMBO x{combo}</div>
            <div className="text-[9px] font-bold tracking-widest text-amber-200/70">SESSION STREAK</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LAUNCH banner */}
      <AnimatePresence>
        {phase === "launching" && (
          <motion.div
            key="launching"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          >
            <span className="font-arcade text-5xl text-amber-300 drop-shadow-[0_4px_0_rgba(0,0,0,0.6)]">
              LAUNCH!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* flight HUD */}
      {phase === "flight" && (
        <div className="pointer-events-none absolute inset-x-0 top-[18%] z-20 flex flex-col items-center gap-3 px-4">
          <div className="grid w-full max-w-md grid-cols-3 gap-2">
            <StatChip label="DISTANCE" value={`${hud.distance.toLocaleString()} m`} />
            <StatChip label="HEIGHT" value={`${hud.height} m`} accent />
            <StatChip label="AIR TIME" value={`${hud.airTime.toFixed(1)} s`} />
          </div>
          <div className="mt-1 flex flex-col items-center gap-1">
            <motion.span
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="rounded-2xl border border-white/25 bg-black/45 px-5 py-2 font-arcade text-sm text-white backdrop-blur-sm"
            >
              HOLD TO FLY · SWIPE UP TO BOOST ✋
            </motion.span>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-[width] duration-200"
                style={{ width: `${Math.round(hud.airFuel * 100)}%` }}
              />
            </div>
            <span className="text-[9px] font-bold tracking-widest text-white/60">AIR CONTROL</span>
          </div>
        </div>
      )}

      {/* bottom controls */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-[calc(env(safe-area-inset-bottom)+0.9rem)]">
        {phase === "flight" || phase === "landing" || phase === "done" ? null : (
          <div className="mx-auto w-full max-w-md">
            {/* RPM meter */}
            <div className="mb-2.5 rounded-2xl border border-white/15 bg-black/45 p-3 backdrop-blur-md">
              <div className="mb-1.5 flex items-end justify-between">
                <span className="text-[10px] font-bold tracking-widest text-white/60">RPM</span>
                <span
                  className={`font-arcade text-2xl leading-none tabular-nums ${
                    inOptimal ? "text-emerald-300" : zone.id === "overdrive" ? "text-amber-300" : "text-white"
                  }`}
                >
                  {Math.round(hud.rpm)}%
                </span>
              </div>
              <ZoneMeter rpm={hud.rpm} />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-widest ${
                    inOptimal
                      ? "animate-pulse bg-emerald-500/30 text-emerald-200"
                      : zone.id === "overdrive"
                        ? "bg-amber-500/25 text-amber-200"
                        : "bg-white/10 text-white/70"
                  }`}
                >
                  {zone.id === "optimal"
                    ? "OPTIMAL ZONE — HIT LAUNCH!"
                    : zone.id === "overdrive"
                      ? "OVERDRIVE — RISKY!"
                      : `${zone.label} ZONE`}
                </span>
                <span className="text-[10px] font-bold text-white/55">SWEET SPOT {OPTIMAL_CENTER}%</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest text-white/60">POWER</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-[width] duration-150 ${
                      inOptimal
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-300"
                        : zone.id === "overdrive"
                          ? "bg-gradient-to-r from-amber-500 to-amber-300"
                          : "bg-white/40"
                    }`}
                    style={{ width: `${Math.round(hud.power * 100)}%` }}
                  />
                </div>
                <span className="font-arcade text-xs text-white/80">{Math.round(hud.power * 100)}%</span>
              </div>
            </div>

            {/* controls */}
            <div className="grid grid-cols-[1fr_auto] gap-2.5">
              <div className="flex flex-col gap-2.5">
                <GameButton
                  variant="primary"
                  className="py-4"
                  onClick={startEngine}
                  onPointerDown={() => rendererRef.current?.setHolding(true)}
                  onPointerUp={() => rendererRef.current?.setHolding(false)}
                  onPointerLeave={() => rendererRef.current?.setHolding(false)}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg">{engineActive ? "🔧" : "⚙️"}</span>
                    {engineActive ? "HOLD TO REV" : "START ENGINE"}
                  </span>
                </GameButton>
                {engineActive && (
                  <GameButton variant="danger" className="py-3" onClick={() => rendererRef.current?.stopEngine()}>
                    STOP ENGINE
                  </GameButton>
                )}
              </div>
              <GameButton
                variant="gold"
                className={`w-32 py-4 ${inOptimal ? "animate-pulse" : ""}`}
                disabled={!canLaunch}
                onClick={doLaunch}
              >
                <span className="flex flex-col items-center leading-none">
                  <span className="text-xl">🚀</span>
                  <span className="mt-1 font-arcade text-sm">LAUNCH</span>
                </span>
              </GameButton>
            </div>
          </div>
        )}
      </div>

      {/* pause overlay */}
      <AnimatePresence>
        {paused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <div className="flex w-72 flex-col gap-3 rounded-3xl border border-white/15 bg-black/50 p-6 shadow-2xl">
              <h2 className="mb-1 text-center font-arcade text-xl text-white">PAUSED</h2>
              <GameButton variant="gold" onClick={() => togglePause(false)}>
                RESUME
              </GameButton>
              <GameButton variant="dark" onClick={restart}>
                RESTART
              </GameButton>
              <GameButton
                variant="dark"
                onClick={() => {
                  setPaused(false);
                  rendererRef.current?.resume();
                  rendererRef.current?.resetRun();
                  go("menu");
                }}
              >
                HOME
              </GameButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
