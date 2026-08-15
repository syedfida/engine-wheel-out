import { useState } from "react";
import { motion } from "framer-motion";
import { audio } from "@/game/audio";
import {
  ENGINE_UPGRADES,
  MAX_UPGRADE_LEVEL,
  RAMP_UPGRADES,
  WHEEL_UPGRADES,
  cosmeticsByCategory,
  upgradeCost,
  upgradeDef,
  upgradeStat,
  upgradeStatText,
} from "@/game/config";
import { useGame } from "@/game/GameContext";
import type { CosmeticCategory, UpgradeGroup } from "@/game/types";
import { cn } from "@/lib/utils";
import { CoinPill, GameButton, ScreenTitle } from "./ui";

type Tab = "engine" | "wheel" | "ramp" | "cosmetics";

const TABS: { id: Tab; label: string }[] = [
  { id: "engine", label: "ENGINE" },
  { id: "wheel", label: "WHEEL" },
  { id: "ramp", label: "RAMP" },
  { id: "cosmetics", label: "COSMETICS" },
];

function LevelPips({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: MAX_UPGRADE_LEVEL }, (_, i) => (
        <div
          key={i}
          className={cn("h-1.5 w-3 rounded-full", i < level ? "bg-emerald-400" : "bg-white/15")}
        />
      ))}
    </div>
  );
}

function UpgradeCard({ group, id }: { group: UpgradeGroup; id: string }) {
  const { save, buyUpgrade } = useGame();
  const def = upgradeDef(group, id);
  const level = (save.upgrades[group] as Record<string, number>)[id] ?? 1;
  const maxed = level >= MAX_UPGRADE_LEVEL;
  const cost = maxed ? 0 : upgradeCost(def, level);
  const afford = save.player.coins >= cost;
  const current = upgradeStat(def, level);
  const next = upgradeStat(def, level + 1);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/12 bg-black/30 p-4 backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
            {def.icon}
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-wide text-white">{def.name}</div>
            <div className="mt-0.5 text-[10px] leading-snug text-white/55">{def.desc}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-arcade text-xs text-amber-300">Lv {level} {!maxed && `→ ${level + 1}`}</span>
          <LevelPips level={level} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/5 px-3 py-2">
          <div className="text-[9px] font-bold tracking-widest text-white/50">CURRENT</div>
          <div className="text-sm font-extrabold text-white">
            {def.statLabel} {upgradeStatText(def, level)}
          </div>
        </div>
        <div className="rounded-xl bg-emerald-500/10 px-3 py-2">
          <div className="text-[9px] font-bold tracking-widest text-emerald-300/70">NEXT LEVEL</div>
          <div className="text-sm font-extrabold text-emerald-200">
            {def.statLabel} {maxed ? "MAX" : upgradeStatText(def, level + 1)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-amber-200">
          {maxed ? "MAX LEVEL" : (
            <>
              <span className="mr-1">🪙</span>
              {cost.toLocaleString()} Coins
            </>
          )}
        </span>
        <GameButton
          variant={afford ? "gold" : "dark"}
          disabled={maxed || !afford}
          className="px-6 py-2.5 text-sm"
          onClick={() => {
            buyUpgrade(group, id);
            audio.sfx("upgrade");
          }}
        >
          {maxed ? "MAXED" : "UPGRADE"}
        </GameButton>
      </div>
    </motion.div>
  );
}

const COSMETIC_CATEGORIES: { id: CosmeticCategory; label: string }[] = [
  { id: "wheel", label: "WHEELS" },
  { id: "rim", label: "RIMS" },
  { id: "trail", label: "TRAILS" },
  { id: "dust", label: "DUST" },
  { id: "decal", label: "DECALS" },
  { id: "engine", label: "ENGINES" },
];

export function GarageScreen() {
  const { save, go, buyCosmetic, equipCosmetic } = useGame();
  const [tab, setTab] = useState<Tab>("engine");
  const [cat, setCat] = useState<CosmeticCategory>("wheel");
  const owned = save.cosmetics.owned;
  const equipped = save.cosmetics.equipped;

  const upgrades: Record<Tab, string[]> = {
    engine: ENGINE_UPGRADES,
    wheel: WHEEL_UPGRADES,
    ramp: RAMP_UPGRADES,
    cosmetics: [],
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
          <ScreenTitle>GARAGE</ScreenTitle>
          <CoinPill coins={save.player.coins} />
        </div>

        {/* tabs */}
        <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-2xl border border-white/15 bg-black/30 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-xl py-2 text-[11px] font-extrabold tracking-widest transition-colors",
                tab === t.id ? "bg-emerald-600 text-white shadow" : "text-white/60 hover:bg-white/10",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* content */}
        <div className="mt-4 flex flex-col gap-3">
          {tab === "cosmetics" ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {COSMETIC_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCat(c.id)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-[10px] font-extrabold tracking-widest transition-colors",
                      cat === c.id
                        ? "bg-amber-500/30 text-amber-200 ring-1 ring-amber-300/50"
                        : "bg-white/10 text-white/60",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {cosmeticsByCategory(cat).map((c) => {
                  const isOwned = owned.includes(c.id);
                  const isEquipped = equipped[cat] === c.id;
                  const afford = save.player.coins >= c.price;
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "rounded-3xl border p-3.5 backdrop-blur-md",
                        isEquipped ? "border-amber-300/50 bg-amber-500/10" : "border-white/12 bg-black/30",
                      )}
                    >
                      <div className="flex h-12 items-center justify-center">
                        <div
                          className={cn(
                            "h-9 w-9 rounded-full border-2",
                            cat === "wheel" || cat === "rim"
                              ? "border-white/40"
                              : "rounded-2xl border-white/30 bg-white/10",
                          )}
                          style={{
                            background:
                              cat === "wheel" || cat === "rim"
                                ? "repeating-conic-gradient(#232329 0deg 24deg, #7d828c 24deg 36deg)"
                                : undefined,
                          }}
                        />
                      </div>
                      <div className="mt-2 text-center text-xs font-extrabold text-white">{c.name}</div>
                      <div className="mt-1 min-h-7 text-center text-[9px] leading-tight text-white/55">
                        {c.desc}
                      </div>
                      <div className="mt-2">
                        {isEquipped ? (
                          <div className="rounded-xl bg-emerald-600 py-2 text-center text-[11px] font-extrabold tracking-widest text-white">
                            EQUIPPED
                          </div>
                        ) : isOwned ? (
                          <GameButton
                            variant="primary"
                            className="py-2 text-xs"
                            onClick={() => equipCosmetic(cat, c.id)}
                            silent
                          >
                            EQUIP
                          </GameButton>
                        ) : (
                          <GameButton
                            variant="gold"
                            className="py-2 text-xs"
                            disabled={!afford}
                            onClick={() => buyCosmetic(c.id)}
                            silent
                          >
                            {afford ? `🪙 ${c.price.toLocaleString()}` : "NOT ENOUGH"}
                          </GameButton>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-1 text-center text-[10px] leading-relaxed text-white/45">
                Cosmetics are visual only — they change how your engine and wheel look and roll, but not your stats.
              </p>
            </>
          ) : (
            upgrades[tab].map((id) => <UpgradeCard key={id} group={tab} id={id} />)
          )}
        </div>
      </div>
    </div>
  );
}
