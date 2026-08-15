// ---------------------------------------------------------------------------
// Versioned local save system. Offline-first: everything lives in localStorage.
// The structure is versioned so future versions can migrate old saves.
// ---------------------------------------------------------------------------
import {
  defaultEquipped,
  defaultSettings,
  defaultUpgrades,
  emptyAchievementStates,
  emptyMissionStates,
  LOCATIONS,
  SAVE_KEY,
  SAVE_VERSION,
  STARTING_COINS,
} from "./config";
import type { SaveData } from "./types";

export function freshSave(): SaveData {
  return {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    player: { level: 1, xp: 0, coins: STARTING_COINS },
    upgrades: defaultUpgrades(),
    cosmetics: { owned: ["wheel_classic", "rim_stock", "trail_none", "dust_default", "decal_none", "engine_stock"], equipped: defaultEquipped() },
    locations: { unlocked: [LOCATIONS[0].id], selected: LOCATIONS[0].id },
    highScores: {
      bestDistance: 0,
      bestHeight: 0,
      bestScore: 0,
      bestAccuracy: 0,
      bestAirTime: 0,
      bestSpeed: 0,
      totalScore: 0,
      totalDistance: 0,
      totalLaunches: 0,
      totalPerfect: 0,
      totalRecordBreaks: 0,
    },
    missions: emptyMissionStates(),
    achievements: emptyAchievementStates(),
    tutorialCompleted: false,
    totalUpgradesPurchased: 0,
    settings: defaultSettings(),
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Merge a raw parsed save onto a fresh save, so partial/corrupt saves recover
 *  gracefully instead of crashing the game. Unknown future fields are kept
 *  (they may belong to a newer save version migrated later). */
function mergeSave(base: SaveData, raw: unknown): SaveData {
  if (!isObject(raw)) return base;
  const out: SaveData = {
    ...base,
    version: SAVE_VERSION,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : base.createdAt,
  };
  if (isObject(raw.player)) {
    out.player = {
      level: clampInt(raw.player.level, 1, 30, base.player.level),
      xp: clampInt(raw.player.xp, 0, Number.MAX_SAFE_INTEGER, base.player.xp),
      coins: clampInt(raw.player.coins, 0, Number.MAX_SAFE_INTEGER, base.player.coins),
    };
  }    if (isObject(raw.upgrades)) {
      out.upgrades = base.upgrades;
      for (const group of ["engine", "wheel", "ramp"] as const) {
        const g = raw.upgrades[group];
        if (isObject(g)) {
          const target = out.upgrades[group] as Record<string, number>;
          for (const key of Object.keys(g)) {
            const v = g[key];
            if (typeof v === "number" && key in target) {
              target[key] = clampInt(v, 1, 10, 1);
            }
          }
        }
      }
    }
  if (isObject(raw.cosmetics)) {
    const owned = Array.isArray(raw.cosmetics.owned)
      ? (raw.cosmetics.owned as unknown[]).filter((x): x is string => typeof x === "string")
      : base.cosmetics.owned;
    out.cosmetics = {
      owned: Array.from(new Set([...base.cosmetics.owned, ...owned])),
      equipped: {
        ...base.cosmetics.equipped,
        ...(isObject(raw.cosmetics.equipped) ? raw.cosmetics.equipped : {}),
      },
    };
  }
  if (isObject(raw.locations)) {
    const unlocked = Array.isArray(raw.locations.unlocked)
      ? (raw.locations.unlocked as unknown[]).filter((x): x is string => typeof x === "string")
      : base.locations.unlocked;
    out.locations = {
      unlocked: Array.from(new Set([...base.locations.unlocked, ...unlocked])),
      selected: typeof raw.locations.selected === "string" ? raw.locations.selected : base.locations.selected,
    };
  }
  if (isObject(raw.highScores)) {
    const h = raw.highScores;
    out.highScores = {
      bestDistance: num(h.bestDistance, base.highScores.bestDistance),
      bestHeight: num(h.bestHeight, base.highScores.bestHeight),
      bestScore: num(h.bestScore, base.highScores.bestScore),
      bestAccuracy: num(h.bestAccuracy, base.highScores.bestAccuracy),
      bestAirTime: num(h.bestAirTime, base.highScores.bestAirTime),
      bestSpeed: num(h.bestSpeed, base.highScores.bestSpeed),
      totalScore: num(h.totalScore, base.highScores.totalScore),
      totalDistance: num(h.totalDistance, base.highScores.totalDistance),
      totalLaunches: num(h.totalLaunches, base.highScores.totalLaunches),
      totalPerfect: num(h.totalPerfect, base.highScores.totalPerfect),
      totalRecordBreaks: num(h.totalRecordBreaks, base.highScores.totalRecordBreaks),
    };
  }
  if (isObject(raw.missions)) {
    for (const key of Object.keys(out.missions)) {
      const m = raw.missions[key];
      if (isObject(m)) {
        out.missions[key] = {
          progress: num(m.progress, 0),
          claimed: m.claimed === true,
        };
      }
    }
  }
  if (isObject(raw.achievements)) {
    for (const key of Object.keys(out.achievements)) {
      const a = raw.achievements[key];
      if (isObject(a)) {
        out.achievements[key] = {
          progress: num(a.progress, 0),
          unlockedAt: typeof a.unlockedAt === "number" ? a.unlockedAt : null,
        };
      }
    }
  }
  out.tutorialCompleted = raw.tutorialCompleted === true;
  out.totalUpgradesPurchased = num(raw.totalUpgradesPurchased, 0);
  if (isObject(raw.settings)) {
    const s = raw.settings;
    out.settings = {
      sound: s.sound !== false,
      music: s.music !== false,
      vibration: s.vibration !== false,
      graphics: s.graphics === "low" || s.graphics === "high" ? s.graphics : "medium",
      reducedEffects: s.reducedEffects === true,
      language: "en",
    };
  }
  return out;
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
}

export function loadSave(): SaveData {
  const base = freshSave();
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as unknown;
    return mergeSave(base, parsed);
  } catch (err) {
    // Corrupted save — recover with a fresh save, never crash.
    console.warn("[EWOP] Save corrupted, starting fresh:", err);
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
    return base;
  }
}

export function persistSave(save: SaveData): void {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (err) {
    console.warn("[EWOP] Could not persist save:", err);
  }
}

export function clearSave(): void {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}
