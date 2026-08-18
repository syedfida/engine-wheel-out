import { useEffect } from "react";
import { ConvexProvider } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { audio } from "@/game/audio";
import { GameProvider, useGame } from "@/game/GameContext";
import { convexClient } from "@/lib/convex";
import type { Toast } from "@/game/types";
import { cn } from "@/lib/utils";
import { GameplayScreen } from "./GameplayScreen";
import { GarageScreen } from "./GarageScreen";
import { LeaderboardScreen } from "./LeaderboardScreen";
import { LoadingScreen } from "./LoadingScreen";
import { LocationsScreen } from "./LocationsScreen";
import { MainMenu } from "./MainMenu";
import { MissionsScreen } from "./MissionsScreen";
import { ResultScreen } from "./ResultScreen";
import { SettingsScreen } from "./SettingsScreen";
import { TutorialScreen } from "./TutorialScreen";

const TOAST_STYLES: Record<Toast["kind"], string> = {
  achievement: "border-sky-300/50 bg-sky-500/15",
  mission: "border-emerald-300/50 bg-emerald-500/15",
  levelup: "border-amber-300/70 bg-amber-500/20 shadow-[0_0_30px_rgba(245,179,1,0.35)]",
  location: "border-fuchsia-300/50 bg-fuchsia-500/15",
  record: "border-amber-300/60 bg-gradient-to-r from-amber-500/25 to-amber-600/10",
  info: "border-white/20 bg-white/10",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = window.setTimeout(() => onDismiss(toast.id), toast.kind === "levelup" ? 5000 : 4200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.95 }}
      className={cn("w-full rounded-xl border px-3 py-1.5 backdrop-blur-md shadow-lg", TOAST_STYLES[toast.kind])}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm leading-none">
          {toast.kind === "achievement" ? "🏆" : toast.kind === "mission" ? "📜" : toast.kind === "levelup" ? "⬆️" : toast.kind === "record" ? "🌟" : toast.kind === "location" ? "🗺️" : "✨"}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate font-arcade text-[10px] leading-tight tracking-wide",
              toast.kind === "levelup" ? "text-amber-300" : "text-white",
            )}
          >
            {toast.title}
          </div>
          {toast.subtitle && <div className="truncate text-[9px] leading-tight text-white/65">{toast.subtitle}</div>}
        </div>
        {toast.reward && <div className="shrink-0 text-[9px] font-extrabold leading-tight text-amber-200">{toast.reward}</div>}
      </div>
    </motion.div>
  );
}

function ToastStack() {
  const { toasts, dismissToast } = useGame();
  return (
    <div className="pointer-events-none fixed right-3 top-[calc(env(safe-area-inset-top)+3.6rem)] z-[60] flex w-56 flex-col items-end gap-1.5">
      <AnimatePresence>
        {toasts.map((t) => (
          <div key={t.id} className="w-full">
            <ToastItem toast={t} onDismiss={dismissToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function GameInner() {
  const { screen } = useGame();

  // Unlock audio on the first user gesture (required by mobile browsers).
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-black font-sans text-white">
      {screen === "loading" && <LoadingScreen />}
      {screen === "menu" && <MainMenu />}
      {screen === "tutorial" && <TutorialScreen />}
      {screen === "gameplay" && <GameplayScreen />}
      {screen === "result" && <ResultScreen />}
      {screen === "garage" && <GarageScreen />}
      {screen === "missions" && <MissionsScreen />}
      {screen === "locations" && <LocationsScreen />}
      {screen === "leaderboard" && <LeaderboardScreen />}
      {screen === "settings" && <SettingsScreen />}
      <ToastStack />
    </div>
  );
}

export function GameApp() {
  return (
    <GameProvider>
      {convexClient ? (
        <ConvexProvider client={convexClient}>
          <GameInner />
        </ConvexProvider>
      ) : (
        <GameInner />
      )}
    </GameProvider>
  );
}
