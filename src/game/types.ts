// ---------------------------------------------------------------------------
// ENGINE WHEEL OUT PAKISTAN — shared types
// ---------------------------------------------------------------------------

export type ScreenId =
  | "loading"
  | "menu"
  | "tutorial"
  | "gameplay"
  | "result"
  | "garage"
  | "missions"
  | "locations"
  | "leaderboard"
  | "settings";

export type GamePhase =
  | "idle" // engine off
  | "building" // engine running, building RPM
  | "launching" // slow-mo anticipation
  | "flight" // wheel is flying
  | "landing" // impact / settling
  | "done";

export interface Settings {
  sound: boolean;
  music: boolean;
  vibration: boolean;
  graphics: "low" | "medium" | "high";
  reducedEffects: boolean;
  language: "en";
}

// --- Upgrades ---------------------------------------------------------------

export type EngineUpgradeId =
  | "power"
  | "rpmControl"
  | "efficiency"
  | "cooling"
  | "launchBonus"
  | "turbo"
  | "fuel";

export type WheelUpgradeId =
  | "stability"
  | "control"
  | "bounce"
  | "airControl"
  | "durability"
  | "grip"
  | "gyro";

export type RampUpgradeId =
  | "launchBonus"
  | "accuracy"
  | "stability"
  | "comboBonus"
  | "kick"
  | "rail";

export type UpgradeId = EngineUpgradeId | WheelUpgradeId | RampUpgradeId;
export type UpgradeGroup = "engine" | "wheel" | "ramp";

export interface UpgradeLevels {
  engine: Record<EngineUpgradeId, number>;
  wheel: Record<WheelUpgradeId, number>;
  ramp: Record<RampUpgradeId, number>;
}

// --- Cosmetics --------------------------------------------------------------

export type CosmeticCategory = "wheel" | "rim" | "trail" | "dust" | "decal" | "engine";

export interface EquippedCosmetics {
  wheel: string;
  rim: string;
  trail: string;
  dust: string;
  decal: string;
  engine: string;
}

// --- Save data --------------------------------------------------------------

export interface HighScores {
  bestDistance: number;
  bestHeight: number;
  bestScore: number;
  bestAccuracy: number;
  bestAirTime: number;
  bestSpeed: number;
  totalScore: number;
  totalDistance: number;
  totalLaunches: number;
  totalPerfect: number;
  totalOverdrive: number;
  totalRecordBreaks: number;
}

export interface MissionState {
  progress: number;
  claimed: boolean;
}

export interface AchievementState {
  progress: number;
  unlockedAt: number | null;
}

export interface SaveData {
  version: 1;
  createdAt: number;
  player: { level: number; xp: number; coins: number };
  upgrades: UpgradeLevels;
  cosmetics: { owned: string[]; equipped: EquippedCosmetics };
  locations: { unlocked: string[]; selected: string };
  highScores: HighScores;
  missions: Record<string, MissionState>;
  achievements: Record<string, AchievementState>;
  tutorialCompleted: boolean;
  totalUpgradesPurchased: number;
  settings: Settings;
}

// --- Runs -------------------------------------------------------------------

export type ZoneId = "low" | "normal" | "optimal" | "overdrive";

export interface LaunchQuality {
  rpm: number; // frozen RPM at launch (0..100)
  zone: ZoneId;
  power: number; // 0..1.15
  accuracy: number; // 0..100
  perfect: boolean;
  backfire: boolean;
}

export interface RunStats {
  distance: number; // meters
  height: number; // meters
  airTime: number; // seconds
  accuracy: number; // 0..100 (from launch quality)
  peakSpeed: number; // fictional m/s
  bounces: number;
}

export interface ScoreBreakdown {
  distance: number;
  height: number;
  accuracy: number;
  combo: number;
  upgrade: number;
  total: number;
}

export interface RunResult {
  quality: LaunchQuality;
  stats: RunStats;
  breakdown: ScoreBreakdown;
  coins: number;
  xp: number;
  combo: number; // combo after this run
  comboGain: number;
  isNewRecord: boolean;
  recordsBroken: string[];
  levelUps: number;
  missionCompletions: string[];
  achievementUnlocks: string[];
  locationUnlocks: string[];
}

export interface Toast {
  id: string;
  kind: "achievement" | "mission" | "levelup" | "location" | "record" | "info";
  title: string;
  subtitle?: string;
  reward?: string;
}

// --- Renderer HUD -----------------------------------------------------------

export interface HudData {
  phase: GamePhase;
  rpm: number; // 0..100
  power: number; // 0..1+
  distance: number;
  height: number;
  airTime: number;
  speed: number;
  combo: number;
  airFuel: number; // 0..1 remaining air control
}
