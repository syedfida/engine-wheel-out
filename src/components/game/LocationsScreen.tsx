import { motion } from "framer-motion";
import { LOCATIONS } from "@/game/config";
import { useGame } from "@/game/GameContext";
import { audio } from "@/game/audio";
import { vibrate } from "@/game/haptics";
import { cn } from "@/lib/utils";
import { ScreenTitle } from "./ui";

export function LocationsScreen() {
  const { save, go, selectLocation } = useGame();

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
          <ScreenTitle>LOCATIONS</ScreenTitle>
          <div className="w-20" />
        </div>

        <p className="mt-3 text-center text-[11px] text-white/55">
          Five fictional environments. Progress unlocks new ones.
        </p>

        <div className="mt-4 flex flex-col gap-3.5">
          {LOCATIONS.map((loc, i) => {
            const unlocked = save.locations.unlocked.includes(loc.id);
            const selected = save.locations.selected === loc.id;
            const v = loc.visual;
            return (
              <motion.div
                key={loc.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "overflow-hidden rounded-3xl border backdrop-blur-md",
                  selected ? "border-emerald-300/60 shadow-[0_0_30px_rgba(34,197,94,0.25)]" : "border-white/12 bg-black/30",
                )}
              >
                {/* preview */}
                <div
                  className="relative h-24 w-full"
                  style={{ background: `linear-gradient(to bottom, ${v.skyTop}, ${v.skyBottom})` }}
                >
                  {/* fake landscape silhouette */}
                  <svg viewBox="0 0 320 96" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                    <path d="M0 70 L40 40 L80 62 L130 30 L180 60 L230 36 L280 62 L320 46 L320 96 L0 96 Z" fill={v.mountainFar[0]} opacity="0.75" />
                    <path d="M0 80 L60 52 L120 72 L180 48 L240 70 L320 58 L320 96 L0 96 Z" fill={v.mountainNear[0]} />
                    <rect y="78" width="320" height="18" fill={v.field} />
                    <rect y="88" width="320" height="8" fill={v.fieldDark} />
                  </svg>
                  {v.stars && (
                    <div className="absolute inset-0">
                      {Array.from({ length: 12 }, (_, j) => (
                        <div
                          key={j}
                          className="absolute h-0.5 w-0.5 rounded-full bg-white"
                          style={{ left: `${(j * 29) % 100}%`, top: `${(j * 17) % 40}%`, opacity: 0.8 }}
                        />
                      ))}
                    </div>
                  )}
                  {v.moon && <div className="absolute right-5 top-3 h-5 w-5 rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.8)]" />}
                  <div
                    className="absolute left-6 top-4 h-5 w-5 rounded-full"
                    style={{ background: v.sun, boxShadow: `0 0 18px 6px ${v.sunGlow}` }}
                  />
                  {loc.id === "festival" && (
                    <div className="absolute inset-x-0 bottom-0 flex justify-around text-sm">
                      {["🔴", "🟢", "🟡", "🔵", "🟣", "🟠"].map((c, j) => (
                        <span key={j} className="animate-pulse" style={{ animationDelay: `${j * 0.15}s` }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                    <div>
                      <div className="font-arcade text-sm text-white drop-shadow">{loc.name}</div>
                      <div className="text-[10px] font-semibold text-white/75">{loc.tagline}</div>
                    </div>
                    {!unlocked && (
                      <span className="rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-extrabold tracking-widest text-white/80">
                        🔒 LOCKED
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 p-3.5">
                  <div className="text-[11px] font-bold text-white/60">
                    {unlocked ? (
                      <span className="text-emerald-300">✓ Unlocked</span>
                    ) : (
                      <span>Unlock: {loc.unlockText}</span>
                    )}
                  </div>
                  {unlocked && (
                    <button
                      type="button"
                      disabled={selected}
                      onClick={() => {
                        audio.sfx("click");
                        vibrate("click", save.settings.vibration);
                        selectLocation(loc.id);
                      }}
                      className={cn(
                        "rounded-2xl px-5 py-2 text-xs font-extrabold tracking-widest transition-colors",
                        selected
                          ? "bg-emerald-600 text-white"
                          : "bg-white/10 text-white hover:bg-white/20",
                      )}
                    >
                      {selected ? "SELECTED ✓" : "SELECT"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
