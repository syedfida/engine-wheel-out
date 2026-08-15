// ---------------------------------------------------------------------------
// ENGINE WHEEL OUT PAKISTAN — content & balance configuration
// All values are fictional arcade numbers, not engineering data.
// ---------------------------------------------------------------------------
import type {
  AchievementState,
  CosmeticCategory,
  EngineUpgradeId,
  EquippedCosmetics,
  RampUpgradeId,
  SaveData,
  Settings,
  UpgradeGroup,
  UpgradeId,
  UpgradeLevels,
  WheelUpgradeId,
  ZoneId,
} from "./types";

export const GAME_TITLE = "ENGINE WHEEL OUT";
export const GAME_COUNTRY = "PAKISTAN";
export const GAME_TAGLINE = "Spin. Launch. Upgrade. Repeat.";
export const SAVE_KEY = "ewop.save.v1";
export const SAVE_VERSION = 1;

export const STARTING_COINS = 500;
export const MAX_PLAYER_LEVEL = 30;
export const MAX_UPGRADE_LEVEL = 10;
export const LEVEL_UP_REWARD = 150; // coins per level gained

// --- RPM system (fictional) -------------------------------------------------

export const RPM_AUTO_RISE = 16; // % per second while engine runs
// Holding the START button adds this much % per second
// (46% total -> the optimal zone passes in ~0.6s — a real timing challenge)
export const RPM_HOLD_BONUS = 30;
// % per second when the engine runs but the button is not held
export const RPM_SLOW_RISE = 14;
export const RPM_DECAY = 36; // % per second when stopped
export const RPM_WOBBLE = 2.4; // peak-to-peak wobble (reduced by RPM Control)

export interface ZoneDef {
  id: ZoneId;
  label: string;
  min: number;
  max: number;
  power: [number, number]; // launch power range
  color: string;
}

export const ZONES: ZoneDef[] = [
  { id: "low", label: "LOW", min: 0, max: 30, power: [0.24, 0.42], color: "#64748b" },
  { id: "normal", label: "NORMAL", min: 30, max: 60, power: [0.5, 0.72], color: "#38bdf8" },
  { id: "optimal", label: "OPTIMAL", min: 60, max: 85, power: [0.84, 1.0], color: "#22c55e" },
  { id: "overdrive", label: "OVERDRIVE", min: 85, max: 100, power: [0.9, 1.16], color: "#f59e0b" },
];

export const OPTIMAL_CENTER = 73; // sweet-spot for perfect accuracy
export const BACKFIRE_BASE_RISK = 0.34; // at 100% RPM
export const BACKFIRE_START = 92; // risk kicks in above this RPM

export function zoneForRpm(rpm: number): ZoneDef {
  for (const z of ZONES) if (rpm >= z.min && rpm < z.max) return z;
  return ZONES[3];
}

// --- Flight physics (fictional arcade numbers) ------------------------------

export const GRAVITY = 36; // m/s^2 (exaggerated)
export const BASE_VX = 6;
export const VX_POWER = 160;
export const BASE_VY = 18;
export const VY_POWER = 72;
export const DRAG = 0.08; // base horizontal drag per second
export const AIR_CONTROL_BASE = 9; // m/s^2 upward while holding
export const AIR_FUEL_BASE = 3.2; // seconds of air control
export const BOUNCE_MIN = 0.26; // energy kept on bounce at level 1
export const BOUNCE_PER_LEVEL = 0.045;
export const IMPACT_DRAG = 0.22; // horizontal speed lost per bounce at level 1
export const IMPACT_DRAG_REDUCTION = 0.028; // per durability level
export const WHEEL_REST_SPEED = 3.5; // m/s below which the wheel settles
export const MAX_FLIGHT_TIME = 14;

// --- Scoring ----------------------------------------------------------------

export const SCORE_DISTANCE_MULT = 2;
export const SCORE_HEIGHT_MULT = 8;
export const SCORE_ACCURACY_MULT = 4;
export const COMBO_BASE = 50;
export const COMBO_PER_RAMP_LEVEL = 15;
export const UPGRADE_BONUS_PER_LEVEL = 18;

export const COINS_BASE = 80;
export const COINS_PER_SCORE = 45;
export const COINS_ZONE_BONUS: Record<ZoneId, number> = {
  low: 0,
  normal: 30,
  optimal: 120,
  overdrive: 160,
};
export const COINS_PERFECT_BONUS = 150;
export const COINS_RECORD_BONUS = 100;
export const COINS_BACKFIRE_PENALTY = 0.35;

export const XP_BASE = 25;
export const XP_PER_SCORE = 55;
export const XP_PERFECT_BONUS = 30;
export const XP_RECORD_BONUS = 60;

// Combo gains (arcade factors)
export const COMBO_GOOD_LAUNCH = 1; // any launch with power >= 0.5
export const COMBO_PERFECT = 2;
export const COMBO_HIGH_DISTANCE = 3; // distance >= 500m
export const COMBO_HIGH_ACCURACY = 2; // accuracy >= 95
export const COMBO_RECORD = 5;
export const COMBO_MAX = 25;

// --- Upgrades ---------------------------------------------------------------

export interface UpgradeDef {
  id: string; // unique key used for state: "engine.power", "wheel.bounce", ...
  group: UpgradeGroup;
  name: string;
  desc: string;
  baseCost: number;
  icon: string;
  statLabel: string;
  statUnit: string;
}

export const ENGINE_UPGRADES: EngineUpgradeId[] = [
  "power",
  "rpmControl",
  "efficiency",
  "cooling",
  "launchBonus",
];
export const WHEEL_UPGRADES: WheelUpgradeId[] = [
  "stability",
  "control",
  "bounce",
  "airControl",
  "durability",
];
export const RAMP_UPGRADES: RampUpgradeId[] = ["launchBonus", "accuracy", "stability", "comboBonus"];

export const UPGRADE_DEFS: Record<UpgradeGroup, Record<string, UpgradeDef>> = {
  engine: {
    power: { id: "engine.power", group: "engine", name: "ENGINE POWER", desc: "More launch power from every RPM.", baseCost: 350, icon: "🔥", statLabel: "Power", statUnit: "%" },
    rpmControl: { id: "engine.rpmControl", group: "engine", name: "RPM CONTROL", desc: "Smoother needle — easier to hold the optimal zone.", baseCost: 300, icon: "🎯", statLabel: "Control", statUnit: "%" },
    efficiency: { id: "engine.efficiency", group: "engine", name: "EFFICIENCY", desc: "More coins and XP from every launch.", baseCost: 350, icon: "⚙️", statLabel: "Efficiency", statUnit: "%" },
    cooling: { id: "engine.cooling", group: "engine", name: "COOLING", desc: "Reduces overdrive backfire risk.", baseCost: 300, icon: "❄️", statLabel: "Cooling", statUnit: "%" },
    launchBonus: { id: "engine.launchBonus", group: "engine", name: "LAUNCH BONUS", desc: "Extra kick at the moment of launch.", baseCost: 400, icon: "🚀", statLabel: "Launch", statUnit: "%" },
  },
  wheel: {
    stability: { id: "wheel.stability", group: "wheel", name: "STABILITY", desc: "Straighter, calmer flight trajectory.", baseCost: 300, icon: "🛞", statLabel: "Stability", statUnit: "%" },
    control: { id: "wheel.control", group: "wheel", name: "CONTROL", desc: "Stronger air control while flying.", baseCost: 350, icon: "🕹️", statLabel: "Control", statUnit: "%" },
    bounce: { id: "wheel.bounce", group: "wheel", name: "BOUNCE", desc: "The wheel bounces higher and keeps energy.", baseCost: 320, icon: "🏀", statLabel: "Bounce", statUnit: "%" },
    airControl: { id: "wheel.airControl", group: "wheel", name: "AIR CONTROL", desc: "More time holding the wheel in the air.", baseCost: 300, icon: "🌪️", statLabel: "Air Time", statUnit: "s" },
    durability: { id: "wheel.durability", group: "wheel", name: "DURABILITY", desc: "Less speed lost on impact with the ground.", baseCost: 320, icon: "🛡️", statLabel: "Durability", statUnit: "%" },
  },
  ramp: {
    launchBonus: { id: "ramp.launchBonus", group: "ramp", name: "RAMP LAUNCH", desc: "The ramp throws the wheel further.", baseCost: 400, icon: "📐", statLabel: "Launch", statUnit: "%" },
    accuracy: { id: "ramp.accuracy", group: "ramp", name: "RAMP ACCURACY", desc: "Wider perfect-timing window and accuracy.", baseCost: 350, icon: "🎯", statLabel: "Accuracy", statUnit: "%" },
    stability: { id: "ramp.stability", group: "ramp", name: "RAMP STABILITY", desc: "Consistent launches, less random variation.", baseCost: 300, icon: "🧱", statLabel: "Stability", statUnit: "%" },
    comboBonus: { id: "ramp.comboBonus", group: "ramp", name: "COMBO BONUS", desc: "Bigger score bonus per combo level.", baseCost: 350, icon: "⚡", statLabel: "Combo", statUnit: "pts" },
  },
};

export function upgradeDef(group: UpgradeGroup, id: string): UpgradeDef {
  return UPGRADE_DEFS[group][id];
}

export function upgradeCost(def: UpgradeDef, currentLevel: number): number {
  // cost to go from `currentLevel` -> currentLevel + 1
  return Math.round(def.baseCost * Math.pow(currentLevel, 1.55));
}

export function upgradeStat(def: UpgradeDef, level: number): number {
  const lv = Math.max(0, level - 1);
  switch (def.id) {
    case "engine.power": return 6 * lv;
    case "engine.rpmControl": return 5 * lv;
    case "engine.efficiency": return 4 * lv;
    case "engine.cooling": return 6 * lv;
    case "engine.launchBonus": return 2 * lv;
    case "wheel.stability": return 8 * lv;
    case "wheel.control": return 9 * lv;
    case "wheel.bounce": return 5 * lv;
    case "wheel.airControl": return Math.round(35 * lv) / 100;
    case "wheel.durability": return 6 * lv;
    case "ramp.launchBonus": return 3 * lv;
    case "ramp.accuracy": return Math.round(2.5 * lv * 10) / 10;
    case "ramp.stability": return 7 * lv;
    case "ramp.comboBonus": return 15 * lv;
    default: return 0;
  }
}

export function upgradeStatText(def: UpgradeDef, level: number): string {
  const v = upgradeStat(def, level);
  if (def.id === "wheel.airControl") return `+${v.toFixed(2)}s`;
  return `+${v}${def.statUnit}`;
}

export function totalUpgradeLevels(u: UpgradeLevels): number {
  let n = 0;
  for (const g of ["engine", "wheel", "ramp"] as const) {
    for (const key of Object.keys(u[g]) as (keyof typeof u[typeof g])[]) {
      n += u[g][key];
    }
  }
  return n;
}

// --- Cosmetics --------------------------------------------------------------

export interface CosmeticDef {
  id: string;
  category: CosmeticCategory;
  name: string;
  price: number;
  desc: string;
}

export const COSMETICS: CosmeticDef[] = [
  { id: "wheel_classic", category: "wheel", name: "CLASSIC WHEEL", price: 0, desc: "The original iron-rim workhorse." },
  { id: "wheel_steel", category: "wheel", name: "STEEL ROLLER", price: 600, desc: "Heavy steel look with a mean shine." },
  { id: "wheel_flame", category: "wheel", name: "FLAME RING", price: 1200, desc: "Heat-treated glow for hot launches." },
  { id: "wheel_neon", category: "wheel", name: "NEON SPOKE", price: 1800, desc: "Glowing spokes that cut the night." },
  { id: "wheel_gold", category: "wheel", name: "GOLDEN HUB", price: 2500, desc: "Champion gold — for record breakers." },
  { id: "rim_stock", category: "rim", name: "STOCK RIM", price: 0, desc: "Simple, tough, original." },
  { id: "rim_spoke", category: "rim", name: "SPOKE STAR", price: 400, desc: "Classic multi-spoke pattern." },
  { id: "rim_turbine", category: "rim", name: "TURBINE", price: 900, desc: "Bladed rim that spins like a fan." },
  { id: "rim_hex", category: "rim", name: "HEX GRID", price: 1500, desc: "Hexagonal lattice — pure arcade." },
  { id: "trail_none", category: "trail", name: "NO TRAIL", price: 0, desc: "Clean lines, no trail." },
  { id: "trail_spark", category: "trail", name: "SPARK TRAIL", price: 500, desc: "Orange sparks stream behind the wheel." },
  { id: "trail_ember", category: "trail", name: "EMBER TRAIL", price: 800, desc: "Glowing embers ride the wind." },
  { id: "trail_gold", category: "trail", name: "GOLD RUSH", price: 2000, desc: "A golden comet tail. Also a Point Master reward." },
  { id: "dust_default", category: "dust", name: "COUNTRY DUST", price: 0, desc: "Good honest Pakistani dirt." },
  { id: "dust_sand", category: "dust", name: "SAND CLOUD", price: 400, desc: "Dry, golden dust storms." },
  { id: "dust_ember", category: "dust", name: "EMBER DUST", price: 900, desc: "Dust with a fiery sparkle." },
  { id: "decal_none", category: "decal", name: "NO DECAL", price: 0, desc: "Bare hub." },
  { id: "decal_star", category: "decal", name: "STAR DECAL", price: 300, desc: "A green-and-white star." },
  { id: "decal_bolt", category: "decal", name: "BOLT DECAL", price: 700, desc: "Lightning on the hub." },
  { id: "decal_crescent", category: "decal", name: "CRESCENT DECAL", price: 1000, desc: "A golden crescent mark." },
  { id: "engine_stock", category: "engine", name: "STOCK BLOCK", price: 0, desc: "The reliable original engine." },
  { id: "engine_chrome", category: "engine", name: "CHROME BLOCK", price: 900, desc: "Mirror-shine casing." },
  { id: "engine_carbon", category: "engine", name: "CARBON BLOCK", price: 1600, desc: "Dark matte muscle." },
  { id: "engine_gold", category: "engine", name: "GOLD BLOCK", price: 3000, desc: "Painted in victory gold." },
];

export function cosmeticsByCategory(category: CosmeticCategory): CosmeticDef[] {
  return COSMETICS.filter((c) => c.category === category);
}

export function cosmeticById(id: string): CosmeticDef | undefined {
  return COSMETICS.find((c) => c.id === id);
}

export function defaultEquipped(): EquippedCosmetics {
  return {
    wheel: "wheel_classic",
    rim: "rim_stock",
    trail: "trail_none",
    dust: "dust_default",
    decal: "decal_none",
    engine: "engine_stock",
  };
}

// --- Locations --------------------------------------------------------------

export interface LocationVisual {
  id: string;
  skyTop: string;
  skyBottom: string;
  horizon: string;
  sun: string;
  sunGlow: string;
  stars: boolean;
  moon: boolean;
  fog: number; // 0..1
  mountainFar: string[];
  mountainNear: string[];
  field: string;
  fieldDark: string;
  road: string;
  tree: string;
  building: string;
  buildingRoof: string;
  dust: string;
  glow: string; // ambient glow overlay color
  musicRoot: number; // Hz for the music scale root
  musicScale: number[]; // semitone offsets
}

export interface LocationDef {
  id: string;
  name: string;
  tagline: string;
  unlockText: string;
  unlocked: (s: SaveData) => boolean;
  visual: LocationVisual;
}

export const LOCATIONS: LocationDef[] = [
  {
    id: "village",
    name: "PAKISTANI VILLAGE",
    tagline: "Fields, dust and open skies.",
    unlockText: "Unlocked from the start",
    unlocked: () => true,
    visual: {
      id: "village",
      skyTop: "#1c64a3", skyBottom: "#bfe0f2", horizon: "#e8d9a8",
      sun: "#ffd76a", sunGlow: "rgba(255, 205, 92, 0.55)", stars: false, moon: false, fog: 0,
      mountainFar: ["#6d8fb2", "#5b7da3"], mountainNear: ["#3f6b4f", "#35604a"],
      field: "#7cb342", fieldDark: "#5d9336", road: "#b08d5f",
      tree: "#2e5d34", building: "#e0c9a0", buildingRoof: "#a4563c",
      dust: "rgba(222, 190, 140, 0.8)", glow: "rgba(255, 220, 150, 0.08)",
      musicRoot: 146.83, musicScale: [0, 3, 5, 7, 10, 12, 15],
    },
  },
  {
    id: "brick",
    name: "BRICK-KILN AREA",
    tagline: "Warm kilns and brick dust.",
    unlockText: "Complete 8 launches",
    unlocked: (s) => s.highScores.totalLaunches >= 8,
    visual: {
      id: "brick",
      skyTop: "#b06a2f", skyBottom: "#f0c98a", horizon: "#d9a05f",
      sun: "#ff9d45", sunGlow: "rgba(255, 140, 60, 0.5)", stars: false, moon: false, fog: 0.12,
      mountainFar: ["#8a5a3a", "#7a4f33"], mountainNear: ["#6e4126", "#5e3a24"],
      field: "#a9713f", fieldDark: "#8a5b30", road: "#7d5b3a",
      tree: "#4a3a20", building: "#c0693f", buildingRoof: "#8a3f2a",
      dust: "rgba(214, 150, 90, 0.85)", glow: "rgba(255, 150, 60, 0.14)",
      musicRoot: 164.81, musicScale: [0, 2, 3, 7, 8, 12, 14],
    },
  },
  {
    id: "mountain",
    name: "MOUNTAIN RUN",
    tagline: "High passes and cold fog.",
    unlockText: "Reach 700 m best distance",
    unlocked: (s) => s.highScores.bestDistance >= 700,
    visual: {
      id: "mountain",
      skyTop: "#3a6ea5", skyBottom: "#cfe0ee", horizon: "#b8c4cf",
      sun: "#f0f6ff", sunGlow: "rgba(220, 235, 255, 0.4)", stars: false, moon: false, fog: 0.34,
      mountainFar: ["#7a90a8", "#64798f"], mountainNear: ["#4a5d70", "#3c4c5c"],
      field: "#5a6e4a", fieldDark: "#4a5c3d", road: "#7d8a94",
      tree: "#2f4a3a", building: "#8f9aa5", buildingRoof: "#5a6470",
      dust: "rgba(190, 205, 215, 0.8)", glow: "rgba(220, 240, 255, 0.1)",
      musicRoot: 196.0, musicScale: [0, 2, 5, 7, 9, 12, 14],
    },
  },
  {
    id: "festival",
    name: "FESTIVAL GROUND",
    tagline: "Lights, flags and celebration.",
    unlockText: "Reach 12,000 best score",
    unlocked: (s) => s.highScores.bestScore >= 12000,
    visual: {
      id: "festival",
      skyTop: "#3b3f7a", skyBottom: "#e8a06b", horizon: "#f2c98a",
      sun: "#ffb15e", sunGlow: "rgba(255, 170, 90, 0.5)", stars: false, moon: true, fog: 0.05,
      mountainFar: ["#5a5480", "#4c4770"], mountainNear: ["#3d3a5c", "#33304e"],
      field: "#4a7a3a", fieldDark: "#3d6630", road: "#8a7a5a",
      tree: "#2f4a2e", building: "#f2e3c0", buildingRoof: "#c04a3a",
      dust: "rgba(240, 200, 150, 0.8)", glow: "rgba(255, 120, 80, 0.16)",
      musicRoot: 174.61, musicScale: [0, 3, 5, 7, 10, 12, 15],
    },
  },
  {
    id: "night",
    name: "NIGHT RUN",
    tagline: "Moonlit roads and glowing engines.",
    unlockText: "Reach player level 12",
    unlocked: (s) => s.player.level >= 12,
    visual: {
      id: "night",
      skyTop: "#0a1633", skyBottom: "#203a5c", horizon: "#27405c",
      sun: "#e8f2ff", sunGlow: "rgba(200, 225, 255, 0.35)", stars: true, moon: true, fog: 0.08,
      mountainFar: ["#1d2e4d", "#182640"], mountainNear: ["#142038", "#101b30"],
      field: "#16283c", fieldDark: "#122236", road: "#2c3a4d",
      tree: "#0f1e2e", building: "#2e4056", buildingRoof: "#1c2a3a",
      dust: "rgba(120, 140, 170, 0.75)", glow: "rgba(120, 160, 255, 0.18)",
      musicRoot: 138.59, musicScale: [0, 2, 4, 7, 9, 12, 14],
    },
  },
];

export function locationById(id: string): LocationDef {
  return LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0];
}

// --- Missions ---------------------------------------------------------------

export interface MissionDef {
  id: string;
  name: string;
  desc: string;
  target: number;
  rewardCoins: number;
  rewardCosmetic?: string;
}

export const MISSIONS: MissionDef[] = [
  { id: "first_run", name: "FIRST RUN", desc: "Complete 1 launch.", target: 1, rewardCoins: 500 },
  { id: "distance_runner", name: "DISTANCE RUNNER", desc: "Reach 500 m in a single launch.", target: 500, rewardCoins: 750 },
  { id: "perfect_timing", name: "PERFECT TIMING", desc: "Perform 5 accurate (95%+) launches.", target: 5, rewardCoins: 1000 },
  { id: "upgrade_path", name: "UPGRADE PATH", desc: "Purchase 2 upgrades.", target: 2, rewardCoins: 1000 },
  { id: "record_breaker", name: "RECORD BREAKER", desc: "Beat your personal record.", target: 1, rewardCoins: 1500 },
  { id: "long_journey", name: "LONG JOURNEY", desc: "Complete 10 launches.", target: 10, rewardCoins: 2000 },
  { id: "point_master", name: "POINT MASTER", desc: "Reach 10,000 total points.", target: 10000, rewardCoins: 1000, rewardCosmetic: "trail_gold" },
];

export function missionProgress(save: SaveData, id: string): number {
  switch (id) {
    case "first_run": return save.highScores.totalLaunches;
    case "distance_runner": return save.highScores.bestDistance;
    case "perfect_timing": return save.highScores.totalPerfect;
    case "upgrade_path": return save.totalUpgradesPurchased;
    case "record_breaker": return save.highScores.totalRecordBreaks;
    case "long_journey": return save.highScores.totalLaunches;
    case "point_master": return save.highScores.totalScore;
    default: return 0;
  }
}

// --- Achievements -----------------------------------------------------------

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  target: number;
  rewardCoins: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_launch", name: "FIRST LAUNCH", desc: "Complete your first launch.", target: 1, rewardCoins: 200 },
  { id: "high_flyer", name: "HIGH FLYER", desc: "Reach 120 m altitude.", target: 120, rewardCoins: 400 },
  { id: "speed_demon", name: "SPEED DEMON", desc: "Reach 90 m/s fictional speed.", target: 90, rewardCoins: 400 },
  { id: "record_breaker", name: "RECORD BREAKER", desc: "Beat a personal record.", target: 1, rewardCoins: 500 },
  { id: "upgrader", name: "UPGRADER", desc: "Purchase 10 upgrades.", target: 10, rewardCoins: 800 },
  { id: "explorer", name: "EXPLORER", desc: "Unlock all 5 locations.", target: 5, rewardCoins: 1000 },
  { id: "master_engineer", name: "MASTER ENGINEER", desc: "Reach player level 15.", target: 15, rewardCoins: 1500 },
];

export function achievementProgress(save: SaveData, id: string): number {
  switch (id) {
    case "first_launch": return save.highScores.totalLaunches;
    case "high_flyer": return save.highScores.bestHeight;
    case "speed_demon": return save.highScores.bestSpeed;
    case "record_breaker": return save.highScores.totalRecordBreaks;
    case "upgrader": return save.totalUpgradesPurchased;
    case "explorer": return save.locations.unlocked.length;
    case "master_engineer": return save.player.level;
    default: return 0;
  }
}

// --- Defaults ---------------------------------------------------------------

export function defaultSettings(): Settings {
  return {
    sound: true,
    music: true,
    vibration: true,
    graphics: "medium",
    reducedEffects: false,
    language: "en",
  };
}

export function defaultUpgrades(): UpgradeLevels {
  return {
    engine: { power: 1, rpmControl: 1, efficiency: 1, cooling: 1, launchBonus: 1 },
    wheel: { stability: 1, control: 1, bounce: 1, airControl: 1, durability: 1 },
    ramp: { launchBonus: 1, accuracy: 1, stability: 1, comboBonus: 1 },
  };
}

export function emptyMissionStates(): Record<string, { progress: number; claimed: boolean }> {
  const out: Record<string, { progress: number; claimed: boolean }> = {};
  for (const m of MISSIONS) out[m.id] = { progress: 0, claimed: false };
  return out;
}

export function emptyAchievementStates(): Record<string, AchievementState> {
  const out: Record<string, AchievementState> = {};
  for (const a of ACHIEVEMENTS) out[a.id] = { progress: 0, unlockedAt: null };
  return out;
}

export const RECORD_LABELS: { key: keyof SaveData["highScores"]; label: string; unit: string }[] = [
  { key: "bestDistance", label: "BEST DISTANCE", unit: " m" },
  { key: "bestHeight", label: "BEST HEIGHT", unit: " m" },
  { key: "bestScore", label: "BEST SCORE", unit: "" },
  { key: "bestAccuracy", label: "BEST ACCURACY", unit: "%" },
  { key: "bestAirTime", label: "LONGEST AIR TIME", unit: " s" },
];
