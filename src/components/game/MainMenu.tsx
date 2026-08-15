import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GAME_COUNTRY, GAME_TAGLINE, GAME_TITLE } from "@/game/config";
import { useGame } from "@/game/GameContext";
import { levelProgress } from "@/game/progression";
import { GameRenderer } from "@/game/render/engine";
import { CoinPill, GameButton, LevelPill } from "./ui";
import { TutorialScreen } from "./TutorialScreen";

const MENU_ITEMS: { label: string; go: "gameplay" | "garage" | "locations" | "missions" | "leaderboard" | "settings" }[] = [
  { label: "PLAY", go: "gameplay" },
  { label: "GARAGE", go: "garage" },
  { label: "LOCATIONS", go: "locations" },
  { label: "MISSIONS", go: "missions" },
  { label: "LEADERBOARD", go: "leaderboard" },
  { label: "SETTINGS", go: "settings" },
];

export function MainMenu() {
  const { go, save, combo } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);

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
        onHud: () => {},
        onFlightComplete: () => {},
      },
    );
    renderer.setMode("menu");
    rendererRef.current = renderer;
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the menu scene in sync with settings/location/cosmetics
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

  const lp = levelProgress(save.player);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <LevelPill level={lp.level} xpRatio={lp.ratio} />
        <div className="flex flex-col items-end gap-1.5">
          <CoinPill coins={save.player.coins} />
          {combo > 1 && (
            <span className="rounded-full bg-amber-500/20 px-2.5 py-1 font-arcade text-[10px] text-amber-300">
              COMBO x{combo}
            </span>
          )}
        </div>
      </div>

      {/* title */}
      <div className="pointer-events-none absolute inset-x-0 top-[14%] z-10 flex flex-col items-center px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="font-arcade text-4xl leading-[1.08] text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.7)] sm:text-5xl"
        >
          {GAME_TITLE}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-2 flex items-center gap-3"
        >
          <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-emerald-300" />
          <span className="font-arcade text-xl tracking-[0.25em] text-emerald-300 drop-shadow sm:text-2xl">
            {GAME_COUNTRY}
          </span>
          <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-emerald-300" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-2 text-[10px] font-bold tracking-[0.35em] text-white/70"
        >
          {GAME_TAGLINE.toUpperCase()}
        </motion.p>
      </div>

      {/* menu buttons */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2.5 px-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex w-full max-w-sm flex-col gap-2.5"
        >
          {MENU_ITEMS.map((item, i) => (
            <GameButton
              key={item.label}
              variant={item.label === "PLAY" ? "gold" : "dark"}
              className={item.label === "PLAY" ? "py-4 text-xl" : "py-3 text-sm"}
              onClick={() => go(item.go)}
              silent={i > 0}
            >
              <span className="flex items-center justify-center gap-2">
                {item.label === "PLAY" && <span className="text-lg">▶</span>}
                {item.label}
              </span>
            </GameButton>
          ))}
        </motion.div>
      </div>

      {/* first-time tutorial overlay */}
      {!save.tutorialCompleted && <TutorialScreen />}
    </div>
  );
}
