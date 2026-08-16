// ---------------------------------------------------------------------------
// Game state: screen navigation, save persistence, rewards, missions,
// achievements, cosmetics, locations, settings. Single source of truth.
// ---------------------------------------------------------------------------
import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { audio } from "./audio";
import {
  MAX_UPGRADE_LEVEL,
  MISSIONS,
  cosmeticById,
  locationById,
  upgradeCost,
  upgradeDef,
} from "./config";
import { applyRunToSave, syncProgress } from "./scoring";
import { clearSave, freshSave, loadSave, persistSave } from "./save";
import type {
  CosmeticCategory,
  LaunchQuality,
  RunResult,
  RunStats,
  SaveData,
  ScreenId,
  Settings,
  Toast,
  UpgradeGroup,
} from "./types";

let toastSeq = 0;
function uid(prefix: string): string {
  toastSeq += 1;
  return `${prefix}-${Date.now()}-${toastSeq}`;
}

interface GameState {
  save: SaveData;
  screen: ScreenId;
  pendingRun: RunResult | null;
  combo: number;
  toasts: Toast[];
}

type Action =
  | { type: "GO"; screen: ScreenId }
  | { type: "COMPLETE_TUTORIAL" }
  | { type: "COMPLETE_RUN"; quality: LaunchQuality; stats: RunStats }
  | { type: "BUY_UPGRADE"; group: UpgradeGroup; id: string }
  | { type: "CLAIM_MISSION"; id: string }
  | { type: "BUY_COSMETIC"; id: string }
  | { type: "EQUIP_COSMETIC"; category: CosmeticCategory; id: string }
  | { type: "SELECT_LOCATION"; id: string }
  | { type: "UPDATE_SETTINGS"; settings: Settings }
  | { type: "RESET_PROGRESS" }
  | { type: "DISMISS_TOAST"; id: string };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "GO": {
      return {
        ...state,
        screen: action.screen,
        pendingRun: action.screen === "result" ? state.pendingRun : null,
      };
    }

    case "COMPLETE_TUTORIAL": {
      const save = clone(state.save);
      save.tutorialCompleted = true;
      return { ...state, save };
    }

    case "COMPLETE_RUN": {
      const result = applyRunToSave(state.save, action.quality, action.stats, state.combo, Date.now());
      return {
        ...state,
        save: result.save,
        combo: result.run.combo,
        pendingRun: result.run,
        toasts: [...state.toasts, ...result.toasts].slice(-4),
        screen: "result",
      };
    }

    case "BUY_UPGRADE": {
      const def = upgradeDef(action.group, action.id);
      const save = clone(state.save);
      const levels = save.upgrades[action.group] as Record<string, number>;
      const current = levels[action.id] ?? 1;
      if (current >= MAX_UPGRADE_LEVEL) return state;
      const cost = upgradeCost(def, current);
      if (save.player.coins < cost) return state;
      save.player.coins -= cost;
      levels[action.id] = current + 1;
      save.totalUpgradesPurchased += 1;
      const sync = syncProgress(save, Date.now());
      return {
        ...state,
        save,
        toasts: [...state.toasts, ...sync.toasts].slice(-4),
      };
    }

    case "CLAIM_MISSION": {
      const def = MISSIONS.find((m) => m.id === action.id);
      if (!def) return state;
      if (!state.save.missions[action.id]) return state;
      const save = clone(state.save);
      const st = save.missions[action.id];
      if (!st || st.claimed || st.progress < def.target) return state;
      st.claimed = true;
      save.player.coins += def.rewardCoins;
      const toasts: Toast[] = [
        ...state.toasts,
        {
          id: uid("claim"),
          kind: "mission",
          title: "REWARD CLAIMED",
          subtitle: def.name,
          reward: `+${def.rewardCoins} coins`,
        },
      ];
      if (def.rewardCosmetic && !save.cosmetics.owned.includes(def.rewardCosmetic)) {
        const cosmeticDef = cosmeticById(def.rewardCosmetic);
        save.cosmetics.owned.push(def.rewardCosmetic);
        if (cosmeticDef) save.cosmetics.equipped[cosmeticDef.category] = def.rewardCosmetic;
        toasts.push({
          id: uid("cosmetic"),
          kind: "info",
          title: "COSMETIC UNLOCKED",
          subtitle: cosmeticById(def.rewardCosmetic)?.name ?? def.rewardCosmetic,
          reward: "Equipped in GARAGE",
        });
      }
      return { ...state, save, toasts: toasts.slice(-4) };
    }

    case "BUY_COSMETIC": {
      const def = cosmeticById(action.id);
      if (!def) return state;
      if (state.save.cosmetics.owned.includes(action.id)) return state;
      if (state.save.player.coins < def.price) return state;
      const save = clone(state.save);
      save.player.coins -= def.price;
      save.cosmetics.owned.push(action.id);
      save.cosmetics.equipped[def.category] = action.id;
      const t: Toast = {
        id: uid("cosmetic"),
        kind: "info",
        title: "EQUIPPED",
        subtitle: def.name,
        reward: "New look ready",
      };
      return { ...state, save, toasts: [...state.toasts, t].slice(-4) };
    }

    case "EQUIP_COSMETIC": {
      if (!state.save.cosmetics.owned.includes(action.id)) return state;
      const save = clone(state.save);
      save.cosmetics.equipped[action.category] = action.id;
      return { ...state, save };
    }

    case "SELECT_LOCATION": {
      if (!state.save.locations.unlocked.includes(action.id)) return state;
      const save = clone(state.save);
      save.locations.selected = action.id;
      return { ...state, save };
    }

    case "UPDATE_SETTINGS": {
      const save = clone(state.save);
      save.settings = action.settings;
      return { ...state, save };
    }

    case "RESET_PROGRESS": {
      clearSave();
      return {
        ...state,
        save: freshSave(),
        combo: 0,
        pendingRun: null,
        toasts: [],
        screen: "menu",
      };
    }

    case "DISMISS_TOAST": {
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    }

    default:
      return state;
  }
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export interface GameApi {
  save: SaveData;
  screen: ScreenId;
  pendingRun: RunResult | null;
  combo: number;
  toasts: Toast[];
  go: (screen: ScreenId) => void;
  completeRun: (quality: LaunchQuality, stats: RunStats) => void;
  completeTutorial: () => void;
  buyUpgrade: (group: UpgradeGroup, id: string) => void;
  claimMission: (id: string) => void;
  buyCosmetic: (id: string) => void;
  equipCosmetic: (category: CosmeticCategory, id: string) => void;
  selectLocation: (id: string) => void;
  updateSettings: (settings: Settings) => void;
  resetProgress: () => void;
  dismissToast: (id: string) => void;
}

const GameContext = createContext<GameApi | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    save: loadSave(),
    screen: "loading" as ScreenId,
    pendingRun: null,
    combo: 0,
    toasts: [],
  }));

  // Persist on every save change
  useEffect(() => {
    persistSave(state.save);
  }, [state.save]);

  // Keep the audio engine in sync with settings & location
  useEffect(() => {
    audio.setSound(state.save.settings.sound);
    audio.setMusic(state.save.settings.music);
    audio.setLocation(state.save.locations.selected);
  }, [state.save.settings, state.save.locations.selected]);

  const api = useMemo<GameApi>(
    () => ({
      save: state.save,
      screen: state.screen,
      pendingRun: state.pendingRun,
      combo: state.combo,
      toasts: state.toasts,
      go: (screen) => dispatch({ type: "GO", screen }),
      completeRun: (quality, stats) => dispatch({ type: "COMPLETE_RUN", quality, stats }),
      completeTutorial: () => dispatch({ type: "COMPLETE_TUTORIAL" }),
      buyUpgrade: (group, id) => dispatch({ type: "BUY_UPGRADE", group, id }),
      claimMission: (id) => dispatch({ type: "CLAIM_MISSION", id }),
      buyCosmetic: (id) => dispatch({ type: "BUY_COSMETIC", id }),
      equipCosmetic: (category, id) => dispatch({ type: "EQUIP_COSMETIC", category, id }),
      selectLocation: (id) => dispatch({ type: "SELECT_LOCATION", id }),
      updateSettings: (settings) => dispatch({ type: "UPDATE_SETTINGS", settings }),
      resetProgress: () => dispatch({ type: "RESET_PROGRESS" }),
      dismissToast: (id) => dispatch({ type: "DISMISS_TOAST", id }),
    }),
    [state],
  );

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame(): GameApi {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}

export { locationById };
