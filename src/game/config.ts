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
export const MAX_PLAYER_LEVEL = 50;
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
  "turbo",
  "fuel",
];
export const WHEEL_UPGRADES: WheelUpgradeId[] = [
  "stability",
  "control",
  "bounce",
  "airControl",
  "durability",
  "grip",
  "gyro",
];
export const RAMP_UPGRADES: RampUpgradeId[] = [
  "launchBonus",
  "accuracy",
  "stability",
  "comboBonus",
  "kick",
  "rail",
];

export const UPGRADE_DEFS: Record<UpgradeGroup, Record<string, UpgradeDef>> = {
  engine: {
    power: { id: "engine.power", group: "engine", name: "ENGINE POWER", desc: "More launch power from every RPM.", baseCost: 350, icon: "🔥", statLabel: "Power", statUnit: "%" },
    rpmControl: { id: "engine.rpmControl", group: "engine", name: "RPM CONTROL", desc: "Smoother needle — easier to hold the optimal zone.", baseCost: 300, icon: "🎯", statLabel: "Control", statUnit: "%" },
    efficiency: { id: "engine.efficiency", group: "engine", name: "EFFICIENCY", desc: "More coins and XP from every launch.", baseCost: 350, icon: "⚙️", statLabel: "Efficiency", statUnit: "%" },
    cooling: { id: "engine.cooling", group: "engine", name: "COOLING", desc: "Reduces overdrive backfire risk.", baseCost: 300, icon: "❄️", statLabel: "Cooling", statUnit: "%" },
    launchBonus: { id: "engine.launchBonus", group: "engine", name: "LAUNCH BONUS", desc: "Extra kick at the moment of launch.", baseCost: 400, icon: "🚀", statLabel: "Launch", statUnit: "%" },
    turbo: { id: "engine.turbo", group: "engine", name: "TURBO KIT", desc: "Overdrive launches hit dramatically harder.", baseCost: 460, icon: "💨", statLabel: "Turbo", statUnit: "%" },
    fuel: { id: "engine.fuel", group: "engine", name: "FUEL INJECTION", desc: "Engine revs build faster — shorter warm-ups.", baseCost: 320, icon: "⛽", statLabel: "Rev", statUnit: "%" },
  },
  wheel: {
    stability: { id: "wheel.stability", group: "wheel", name: "STABILITY", desc: "Straighter, calmer flight trajectory.", baseCost: 300, icon: "🛞", statLabel: "Stability", statUnit: "%" },
    control: { id: "wheel.control", group: "wheel", name: "CONTROL", desc: "Stronger air control while flying.", baseCost: 350, icon: "🕹️", statLabel: "Control", statUnit: "%" },
    bounce: { id: "wheel.bounce", group: "wheel", name: "BOUNCE", desc: "The wheel bounces higher and keeps energy.", baseCost: 320, icon: "🏀", statLabel: "Bounce", statUnit: "%" },
    airControl: { id: "wheel.airControl", group: "wheel", name: "AIR CONTROL", desc: "More time holding the wheel in the air.", baseCost: 300, icon: "🌪️", statLabel: "Air Time", statUnit: "s" },
    durability: { id: "wheel.durability", group: "wheel", name: "DURABILITY", desc: "Less speed lost on impact with the ground.", baseCost: 320, icon: "🛡️", statLabel: "Durability", statUnit: "%" },
    grip: { id: "wheel.grip", group: "wheel", name: "GRIP PADS", desc: "The wheel rolls further after touching down.", baseCost: 300, icon: "🧲", statLabel: "Grip", statUnit: "%" },
    gyro: { id: "wheel.gyro", group: "wheel", name: "GYRO HUB", desc: "Stronger swipe-up air boosts mid-flight.", baseCost: 350, icon: "🛰️", statLabel: "Boost", statUnit: "%" },
  },
  ramp: {
    launchBonus: { id: "ramp.launchBonus", group: "ramp", name: "RAMP LAUNCH", desc: "The ramp throws the wheel further.", baseCost: 400, icon: "📐", statLabel: "Launch", statUnit: "%" },
    accuracy: { id: "ramp.accuracy", group: "ramp", name: "RAMP ACCURACY", desc: "Wider perfect-timing window and accuracy.", baseCost: 350, icon: "🎯", statLabel: "Accuracy", statUnit: "%" },
    stability: { id: "ramp.stability", group: "ramp", name: "RAMP STABILITY", desc: "Consistent launches, less random variation.", baseCost: 300, icon: "🧱", statLabel: "Stability", statUnit: "%" },
    comboBonus: { id: "ramp.comboBonus", group: "ramp", name: "COMBO BONUS", desc: "Bigger score bonus per combo level.", baseCost: 350, icon: "⚡", statLabel: "Combo", statUnit: "pts" },
    kick: { id: "ramp.kick", group: "ramp", name: "RAMP KICK", desc: "Extra vertical lift at the moment of launch.", baseCost: 360, icon: "🦵", statLabel: "Kick", statUnit: "%" },
    rail: { id: "ramp.rail", group: "ramp", name: "RAIL GUIDE", desc: "The ramp flings the wheel further downrange.", baseCost: 380, icon: "🛤️", statLabel: "Range", statUnit: "%" },
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
    case "engine.turbo": return 5 * lv;
    case "engine.fuel": return 5 * lv;
    case "wheel.grip": return 7 * lv;
    case "wheel.gyro": return 6 * lv;
    case "ramp.kick": return 4 * lv;
    case "ramp.rail": return 3 * lv;
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
  // --- v1.1 additions ---
  { id: "wheel_crimson", category: "wheel", name: "CRIMSON HAWK", price: 1400, desc: "Blood-red rubber for hot-blooded runs." },
  { id: "wheel_candy", category: "wheel", name: "CANDY POP", price: 2000, desc: "Pastel pink with a neon cyan ring." },
  { id: "wheel_obsidian", category: "wheel", name: "OBSIDIAN", price: 2200, desc: "Near-black glass with silver blades." },
  { id: "wheel_rainbow", category: "wheel", name: "PRISM RING", price: 3000, desc: "Spins every color of the spectrum." },
  { id: "rim_cross", category: "rim", name: "CROSS LACE", price: 700, desc: "A classic cross-spoke pattern." },
  { id: "rim_disc", category: "rim", name: "DISC BRAKE", price: 1100, desc: "Solid disc with cooling vents." },
  { id: "rim_ring", category: "rim", name: "TRIPLE RING", price: 1600, desc: "Three spinning rings, one hub." },
  { id: "trail_sky", category: "trail", name: "SKY FIRE", price: 1200, desc: "A cool blue flame ribbon." },
  { id: "trail_neon", category: "trail", name: "NEON RIBBON", price: 1600, desc: "Magenta glow that cuts the night." },
  { id: "trail_rainbow", category: "trail", name: "PRISM TAIL", price: 2400, desc: "A cycling rainbow comet tail. Also a Point Millionaire reward." },
  { id: "dust_neon", category: "dust", name: "NEON HAZE", price: 1000, desc: "Purple haze where the wheel lands." },
  { id: "dust_snow", category: "dust", name: "PEARL DUST", price: 1300, desc: "Bright white powder clouds." },
  { id: "decal_flag", category: "decal", name: "CRESCENT FLAG", price: 1200, desc: "Green field, white crescent and star." },
  { id: "decal_wing", category: "decal", name: "WING DECAL", price: 1500, desc: "Twin wings on the hub." },
  { id: "decal_skull", category: "decal", name: "SKULL DECAL", price: 1800, desc: "A grinning hub skull." },
  { id: "engine_blue", category: "engine", name: "BLUE FLAME", price: 1400, desc: "Cool blue block with a hot heart." },
  { id: "engine_red", category: "engine", name: "RACER RED", price: 1100, desc: "Classic racing red livery." },
  { id: "engine_neon", category: "engine", name: "NEON CORE", price: 2200, desc: "Glowing cyan internals, dark shell." },
  // --- v1.2 additions ---
  { id: "wheel_sand", category: "wheel", name: "SAND RIDER", price: 1500, desc: "Desert tan rubber with ember rims." },
  { id: "wheel_truckart", category: "wheel", name: "TRUCK ART", price: 2600, desc: "A riot of color — straight off a decorated lorry." },
  { id: "rim_sunburst", category: "rim", name: "SUNBURST", price: 1300, desc: "Twelve golden rays spinning at speed." },
  { id: "rim_geometric", category: "rim", name: "CHAAL GRID", price: 1800, desc: "Tiled diamond lattice in deep green and gold." },
  { id: "trail_crimson", category: "trail", name: "CRIMSON COMET", price: 1700, desc: "A red-hot streak that burns across the sky." },
  { id: "dust_salt", category: "dust", name: "SALT SPARKLE", price: 1100, desc: "Bright white powder that catches the light." },
  { id: "dust_storm", category: "dust", name: "DESERT STORM", price: 900, desc: "A rolling cloud of golden grit." },
  { id: "decal_truckstar", category: "decal", name: "TRUCK STAR", price: 1400, desc: "A bold star painted in truck-art colors." },
  { id: "engine_desert", category: "engine", name: "DESERT STORM", price: 1900, desc: "Sand-and-olive block with a copper heart." },
  { id: "engine_nightops", category: "engine", name: "NIGHT OPS", price: 2600, desc: "Matte black with cold blue internals." },
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
  {
    id: "coastal",
    name: "COASTAL ROAD",
    tagline: "Salt breeze and palm shadows.",
    unlockText: "Reach 1,500 m best distance",
    unlocked: (s) => s.highScores.bestDistance >= 1500,
    visual: {
      id: "coastal",
      skyTop: "#2f8f9e", skyBottom: "#cdeef0", horizon: "#e7d9b0",
      sun: "#ffe08a", sunGlow: "rgba(255, 235, 170, 0.45)", stars: false, moon: false, fog: 0.1,
      mountainFar: ["#4f8f9a", "#3f7d88"], mountainNear: ["#2f6b5e", "#27594f"],
      field: "#5fae8f", fieldDark: "#4a9378", road: "#d9c9a0",
      tree: "#2e6b4f", building: "#f2e3c8", buildingRoof: "#d98a4a",
      dust: "rgba(230, 210, 160, 0.8)", glow: "rgba(190, 240, 235, 0.12)",
      musicRoot: 220.0, musicScale: [0, 2, 4, 7, 9, 12, 14],
    },
  },
  {
    id: "snow",
    name: "SNOW PEAK",
    tagline: "Frozen passes, silent skies.",
    unlockText: "Reach player level 25",
    unlocked: (s) => s.player.level >= 25,
    visual: {
      id: "snow",
      skyTop: "#7fb3d9", skyBottom: "#e8f4fb", horizon: "#dfe9ee",
      sun: "#ffffff", sunGlow: "rgba(255, 255, 255, 0.5)", stars: false, moon: false, fog: 0.3,
      mountainFar: ["#b9cbd9", "#a3bac9"], mountainNear: ["#8fa6b5", "#7a93a3"],
      field: "#d7e4ea", fieldDark: "#c2d3db", road: "#9fb2bd",
      tree: "#5f7d8a", building: "#e6eef2", buildingRoof: "#8aa0ad",
      dust: "rgba(220, 232, 238, 0.8)", glow: "rgba(220, 240, 255, 0.12)",
      musicRoot: 261.63, musicScale: [0, 2, 3, 7, 8, 10, 12],
    },
  },
  {
    id: "desert",
    name: "THAL DESERT",
    tagline: "Endless golden dunes and heat haze.",
    unlockText: "Reach 900 m best distance",
    unlocked: (s) => s.highScores.bestDistance >= 900,
    visual: {
      id: "desert",
      skyTop: "#f2a65a", skyBottom: "#ffe8c2", horizon: "#eec58e",
      sun: "#fff3c4", sunGlow: "rgba(255, 220, 140, 0.6)", stars: false, moon: false, fog: 0.08,
      mountainFar: ["#d9a05f", "#c98e4e"], mountainNear: ["#b57e3f", "#a36f35"],
      field: "#d9a860", fieldDark: "#c08a42", road: "#c9a06a",
      tree: "#8a6a3a", building: "#e0b070", buildingRoof: "#9a6a3a",
      dust: "rgba(235, 190, 120, 0.85)", glow: "rgba(255, 210, 130, 0.14)",
      musicRoot: 155.56, musicScale: [0, 2, 4, 7, 9, 12, 14],
    },
  },
  {
    id: "salt",
    name: "SALT RANGE",
    tagline: "Pale flats that shimmer like snow.",
    unlockText: "Reach player level 18",
    unlocked: (s) => s.player.level >= 18,
    visual: {
      id: "salt",
      skyTop: "#8fb8d9", skyBottom: "#eef3f8", horizon: "#efecef",
      sun: "#ffffff", sunGlow: "rgba(255, 255, 255, 0.5)", stars: false, moon: false, fog: 0.18,
      mountainFar: ["#d8c9d4", "#c9b7c5"], mountainNear: ["#b8a4b4", "#a592a4"],
      field: "#e8e2dc", fieldDark: "#d2ccc5", road: "#b8b2ac",
      tree: "#7d8a6a", building: "#f2ece4", buildingRoof: "#b08a6a",
      dust: "rgba(240, 240, 235, 0.85)", glow: "rgba(240, 245, 255, 0.12)",
      musicRoot: 164.81, musicScale: [0, 2, 3, 7, 8, 12, 14],
    },
  },
  {
    id: "river",
    name: "RIVER PLAINS",
    tagline: "Green fields along the great river.",
    unlockText: "Complete 40 launches",
    unlocked: (s) => s.highScores.totalLaunches >= 40,
    visual: {
      id: "river",
      skyTop: "#4a90b8", skyBottom: "#cfe8e8", horizon: "#e0d8a8",
      sun: "#ffdf7a", sunGlow: "rgba(255, 225, 150, 0.5)", stars: false, moon: false, fog: 0.1,
      mountainFar: ["#5f9a8f", "#4f8a80"], mountainNear: ["#3f7a5f", "#356b52"],
      field: "#6fae4f", fieldDark: "#5a9340", road: "#a08a5f",
      tree: "#2f6b3a", building: "#e8d0a0", buildingRoof: "#a0502f",
      dust: "rgba(200, 190, 150, 0.8)", glow: "rgba(200, 240, 220, 0.1)",
      musicRoot: 220.0, musicScale: [0, 3, 5, 7, 10, 12, 15],
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
  // --- v1.1 additions ---
  { id: "launch_rookie", name: "LAUNCH ROOKIE", desc: "Complete 3 launches.", target: 3, rewardCoins: 500 },
  { id: "height_hunter", name: "HEIGHT HUNTER", desc: "Reach 200 m in a single launch.", target: 200, rewardCoins: 1000 },
  { id: "air_ace", name: "AIR TIME ACE", desc: "Stay airborne for 5 s in one launch.", target: 5, rewardCoins: 1000 },
  { id: "speed_runner", name: "SPEED RUNNER", desc: "Hit 110 m/s fictional top speed.", target: 110, rewardCoins: 1500 },
  { id: "distance_champion", name: "DISTANCE CHAMPION", desc: "Reach 1,000 m in a single launch.", target: 1000, rewardCoins: 1500 },
  { id: "upgrade_enthusiast", name: "UPGRADE ENTHUSIAST", desc: "Purchase 5 upgrades.", target: 5, rewardCoins: 1200 },
  { id: "upgrade_collector", name: "UPGRADE COLLECTOR", desc: "Purchase 15 upgrades.", target: 15, rewardCoins: 2500 },
  { id: "score_seeker", name: "SCORE SEEKER", desc: "Reach 25,000 total points.", target: 25000, rewardCoins: 2000 },
  { id: "record_hunter", name: "RECORD HUNTER", desc: "Beat a personal record 5 times.", target: 5, rewardCoins: 2000 },
  { id: "perfect_master", name: "PERFECT MASTER", desc: "Perform 20 accurate (95%+) launches.", target: 20, rewardCoins: 2500 },
  { id: "wheel_legend", name: "WHEEL LEGEND", desc: "Complete 25 launches.", target: 25, rewardCoins: 2500 },
  { id: "point_millionaire", name: "POINT MILLIONAIRE", desc: "Reach 100,000 total points.", target: 100000, rewardCoins: 5000, rewardCosmetic: "trail_rainbow" },
  // --- v1.2 additions ---
  { id: "century_club", name: "CENTURY CLUB", desc: "Complete 100 launches.", target: 100, rewardCoins: 3000 },
  { id: "coin_hoarder", name: "COIN HOARDER", desc: "Hold 10,000 coins at once.", target: 10000, rewardCoins: 2500 },
  { id: "height_champion", name: "HEIGHT CHAMPION", desc: "Reach 400 m in a single launch.", target: 400, rewardCoins: 2000 },
  { id: "marathon_wheel", name: "MARATHON WHEEL", desc: "Cover 50,000 m of total distance.", target: 50000, rewardCoins: 3000 },
  { id: "point_titan", name: "POINT TITAN", desc: "Reach 500,000 total points.", target: 500000, rewardCoins: 5000 },
  { id: "perfect_elite", name: "PERFECT ELITE", desc: "Perform 50 accurate (95%+) launches.", target: 50, rewardCoins: 3000 },
  { id: "overdrive_addict", name: "OVERDRIVE ADDICT", desc: "Launch from the overdrive zone 30 times.", target: 30, rewardCoins: 2000 },
  { id: "garage_guru", name: "GARAGE GURU", desc: "Purchase 30 upgrades.", target: 30, rewardCoins: 2500 },
  { id: "trophy_hunter", name: "TROPHY HUNTER", desc: "Unlock 15 achievements.", target: 15, rewardCoins: 3000 },
  { id: "world_traveller", name: "WORLD TRAVELLER", desc: "Unlock 5 locations.", target: 5, rewardCoins: 2500 },
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
    case "launch_rookie": return save.highScores.totalLaunches;
    case "height_hunter": return save.highScores.bestHeight;
    case "air_ace": return Math.round(save.highScores.bestAirTime);
    case "speed_runner": return save.highScores.bestSpeed;
    case "distance_champion": return save.highScores.bestDistance;
    case "upgrade_enthusiast": return save.totalUpgradesPurchased;
    case "upgrade_collector": return save.totalUpgradesPurchased;
    case "score_seeker": return save.highScores.totalScore;
    case "record_hunter": return save.highScores.totalRecordBreaks;
    case "perfect_master": return save.highScores.totalPerfect;
    case "wheel_legend": return save.highScores.totalLaunches;
    case "point_millionaire": return save.highScores.totalScore;
    case "century_club": return save.highScores.totalLaunches;
    case "coin_hoarder": return save.player.coins;
    case "height_champion": return save.highScores.bestHeight;
    case "marathon_wheel": return save.highScores.totalDistance;
    case "point_titan": return save.highScores.totalScore;
    case "perfect_elite": return save.highScores.totalPerfect;
    case "overdrive_addict": return save.highScores.totalOverdrive;
    case "garage_guru": return save.totalUpgradesPurchased;
    case "trophy_hunter": return Object.values(save.achievements).filter((a) => a.unlockedAt !== null).length;
    case "world_traveller": return save.locations.unlocked.length;
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
  { id: "explorer", name: "EXPLORER", desc: `Unlock all ${LOCATIONS.length} locations.`, target: LOCATIONS.length, rewardCoins: 1000 },
  { id: "master_engineer", name: "MASTER ENGINEER", desc: "Reach player level 15.", target: 15, rewardCoins: 1500 },
  // --- v1.1 additions ---
  { id: "launch_fanatic", name: "LAUNCH FANATIC", desc: "Complete 25 launches.", target: 25, rewardCoins: 600 },
  { id: "launch_legend", name: "LAUNCH LEGEND", desc: "Complete 100 launches.", target: 100, rewardCoins: 1500 },
  { id: "perfect_launcher", name: "PERFECT LAUNCHER", desc: "Perform 20 accurate (95%+) launches.", target: 20, rewardCoins: 900 },
  { id: "sky_scraper", name: "SKY SCRAPER", desc: "Reach 350 m altitude.", target: 350, rewardCoins: 900 },
  { id: "distance_legend", name: "DISTANCE LEGEND", desc: "Reach 2,000 m in a single launch.", target: 2000, rewardCoins: 1200 },
  { id: "score_lord", name: "SCORE LORD", desc: "Reach 50,000 best score.", target: 50000, rewardCoins: 1200 },
  { id: "point_collector", name: "POINT COLLECTOR", desc: "Reach 250,000 total points.", target: 250000, rewardCoins: 1500 },
  { id: "shopaholic", name: "SHOPAHOLIC", desc: "Purchase 50 upgrades.", target: 50, rewardCoins: 1000 },
  { id: "record_hunter", name: "RECORD HUNTER", desc: "Beat a personal record 25 times.", target: 25, rewardCoins: 1000 },
  { id: "overdrive_gambler", name: "OVERDRIVE GAMBLER", desc: "Launch from the overdrive zone 20 times.", target: 20, rewardCoins: 800 },
  { id: "air_time_ace", name: "AIR TIME ACE", desc: "Stay airborne for 8 s in one launch.", target: 8, rewardCoins: 800 },
  { id: "mythic_driver", name: "MYTHIC DRIVER", desc: "Reach player level 40.", target: 40, rewardCoins: 2000 },
  // --- v1.2 additions ---
  { id: "rookie_rider", name: "ROOKIE RIDER", desc: "Reach player level 5.", target: 5, rewardCoins: 300 },
  { id: "seasoned_mechanic", name: "SEASONED MECHANIC", desc: "Reach player level 25.", target: 25, rewardCoins: 1500 },
  { id: "turbo_legend", name: "TURBO LEGEND", desc: "Reach player level 50.", target: 50, rewardCoins: 3000 },
  { id: "long_distance", name: "LONG DISTANCE", desc: "Reach 1,000 m in a single launch.", target: 1000, rewardCoins: 800 },
  { id: "giant_leap", name: "GIANT LEAP", desc: "Reach 2,500 m in a single launch.", target: 2500, rewardCoins: 2000 },
  { id: "coin_king", name: "COIN KING", desc: "Hold 20,000 coins at once.", target: 20000, rewardCoins: 1500 },
  { id: "overdrive_ace", name: "OVERDRIVE ACE", desc: "Launch from the overdrive zone 50 times.", target: 50, rewardCoins: 1200 },
  { id: "perfectionist", name: "PERFECTIONIST", desc: "Perform 50 accurate (95%+) launches.", target: 50, rewardCoins: 1500 },
  { id: "sightseer", name: "SIGHTSEER", desc: "Unlock 3 locations.", target: 3, rewardCoins: 600 },
  { id: "point_millionaire", name: "POINT MILLIONAIRE", desc: "Reach 1,000,000 total points.", target: 1000000, rewardCoins: 4000 },
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
    case "launch_fanatic": return save.highScores.totalLaunches;
    case "launch_legend": return save.highScores.totalLaunches;
    case "perfect_launcher": return save.highScores.totalPerfect;
    case "sky_scraper": return save.highScores.bestHeight;
    case "distance_legend": return save.highScores.bestDistance;
    case "score_lord": return save.highScores.bestScore;
    case "point_collector": return save.highScores.totalScore;
    case "shopaholic": return save.totalUpgradesPurchased;
    case "record_hunter": return save.highScores.totalRecordBreaks;
    case "overdrive_gambler": return save.highScores.totalOverdrive;
    case "air_time_ace": return Math.round(save.highScores.bestAirTime);
    case "mythic_driver": return save.player.level;
    case "rookie_rider": return save.player.level;
    case "seasoned_mechanic": return save.player.level;
    case "turbo_legend": return save.player.level;
    case "long_distance": return save.highScores.bestDistance;
    case "giant_leap": return save.highScores.bestDistance;
    case "coin_king": return save.player.coins;
    case "overdrive_ace": return save.highScores.totalOverdrive;
    case "perfectionist": return save.highScores.totalPerfect;
    case "sightseer": return save.locations.unlocked.length;
    case "point_millionaire": return save.highScores.totalScore;
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
    engine: { power: 1, rpmControl: 1, efficiency: 1, cooling: 1, launchBonus: 1, turbo: 1, fuel: 1 },
    wheel: { stability: 1, control: 1, bounce: 1, airControl: 1, durability: 1, grip: 1, gyro: 1 },
    ramp: { launchBonus: 1, accuracy: 1, stability: 1, comboBonus: 1, kick: 1, rail: 1 },
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
