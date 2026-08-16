import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GAME_COUNTRY, GAME_TAGLINE, GAME_TITLE } from "@/game/config";
import { useGame } from "@/game/GameContext";
import type { Settings } from "@/game/types";
import { GameButton, ScreenTitle, Segmented, Toggle } from "./ui";

type Modal = "reset" | "credits" | "privacy" | null;

export function SettingsScreen() {
  const { save, go, updateSettings, resetProgress } = useGame();
  const [modal, setModal] = useState<Modal>(null);
  const s = save.settings;

  const patch = (p: Partial<Settings>) => updateSettings({ ...s, ...p });

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
          <ScreenTitle>SETTINGS</ScreenTitle>
          <div className="w-20" />
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <Toggle label="🔊 Sound" on={s.sound} onChange={(v) => patch({ sound: v })} />
          <Toggle label="🎵 Music" on={s.music} onChange={(v) => patch({ music: v })} />
          <Toggle label="📳 Vibration" on={s.vibration} onChange={(v) => patch({ vibration: v })} />
          <Toggle
            label="✨ Reduced Effects"
            on={s.reducedEffects}
            onChange={(v) => patch({ reducedEffects: v })}
          />

          <div className="rounded-2xl border border-white/15 bg-black/30 p-4">
            <div className="mb-2 text-sm font-bold tracking-wide text-white">🖥️ Graphics Quality</div>
            <Segmented
              options={[
                { value: "low", label: "LOW" },
                { value: "medium", label: "MEDIUM" },
                { value: "high", label: "HIGH" },
              ]}
              value={s.graphics}
              onChange={(v) => patch({ graphics: v })}
            />
            <p className="mt-2 text-[10px] leading-relaxed text-white/50">
              LOW saves battery on older phones. HIGH enables more particles and sharper effects.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold tracking-wide text-white">🌐 Language</span>
              <span className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
                English (V1)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModal("credits")}
            className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3.5 text-left text-sm font-bold tracking-wide text-white hover:bg-black/45"
          >
            🎬 Credits
          </button>
          <button
            type="button"
            onClick={() => setModal("privacy")}
            className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3.5 text-left text-sm font-bold tracking-wide text-white hover:bg-black/45"
          >
            🔒 Privacy
          </button>

          <GameButton variant="danger" className="mt-2 py-3.5" onClick={() => setModal("reset")}>
            ♻️ RESET PROGRESS
          </GameButton>

          <p className="mt-1 text-center text-[10px] leading-relaxed text-white/40">
            All progress is saved on this device. No internet or real-money anything.
            Joining the online leaderboard is optional and needs only a username — no email or phone.
          </p>
        </div>
      </div>

      {/* modals */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#0b2414] p-6 shadow-2xl"
            >
              {modal === "reset" && (
                <>
                  <h3 className="text-center font-arcade text-xl text-red-400">ARE YOU SURE?</h3>
                  <p className="mt-3 text-center text-sm leading-relaxed text-white/80">
                    THIS WILL DELETE ALL LOCAL PROGRESS.
                    <br />
                    <span className="text-white/50">Level, coins, upgrades, records, missions — everything.</span>
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <GameButton variant="dark" onClick={() => setModal(null)}>
                      CANCEL
                    </GameButton>
                    <GameButton
                      variant="danger"
                      onClick={() => {
                        resetProgress();
                        setModal(null);
                        go("menu");
                      }}
                    >
                      RESET
                    </GameButton>
                  </div>
                </>
              )}
              {modal === "credits" && (
                <>
                  <h3 className="text-center font-arcade text-lg text-emerald-300">CREDITS</h3>
                  <div className="mt-4 space-y-2 text-center text-xs leading-relaxed text-white/75">
                    <p className="font-arcade text-sm text-white">{GAME_TITLE} {GAME_COUNTRY}</p>
                    <p className="text-white/50">{GAME_TAGLINE}</p>
                    <p>An original fictional arcade game.</p>
                    <p>All artwork, sounds and code are procedurally generated originals.</p>
                    <p className="text-white/45">No real-world brands, engines or engineering data.</p>
                  </div>
                  <GameButton variant="gold" className="mt-6 w-full" onClick={() => setModal(null)}>
                    CLOSE
                  </GameButton>
                </>
              )}
              {modal === "privacy" && (
                <>
                  <h3 className="text-center font-arcade text-lg text-emerald-300">PRIVACY</h3>
                  <div className="mt-4 space-y-2 text-xs leading-relaxed text-white/75">
                    <p>• The full game runs offline on your device — no account required.</p>
                    <p>• The online leaderboard is optional. It asks only for a username, password and display name — never email, phone number or other personal data.</p>
                    <p>• Passwords are hashed on your device and never stored in plaintext.</p>
                    <p>• Save data stays in your browser's local storage.</p>
                    <p>• Coins are fictional in-game currency only. No payments, deposits or cash-out.</p>
                  </div>
                  <GameButton variant="gold" className="mt-6 w-full" onClick={() => setModal(null)}>
                    CLOSE
                  </GameButton>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
