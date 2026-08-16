// ---------------------------------------------------------------------------
// Player progression: XP curve, levels, and derived upgrade stats.
// ---------------------------------------------------------------------------
import { LEVEL_UP_REWARD, MAX_PLAYER_LEVEL } from "./config";
import type { SaveData, UpgradeLevels } from "./types";

export interface EffectiveStats {
  power: number; // engine power: extra launch power %
  rpmControl: number; // 0..1 reduction of rpm wobble
  efficiency: number; // coin/xp multiplier
  cooling: number; // 0..1 reduction of backfire risk
  launchBonus: number; // engine launch kick %
  stability: number; // flight wobble reduction
  control: number; // air control strength
  bounce: number; // bounce energy
  airControl: number; // air control duration
  durability: number; // impact drag reduction
  rampLaunch: number; // ramp launch bonus
  accuracy: number; // accuracy bonus
  rampStability: number; // launch variance reduction
  comboBonus: number; // combo score bonus
  turbo: number; // overdrive launch power bonus
  fuelRate: number; // faster RPM build
  grip: number; // keeps roll speed on the ground
  gyro: number; // stronger air boost
  kick: number; // extra vertical lift at launch
  rail: number; // extra launch distance
}

export function effectiveStats(u: UpgradeLevels): EffectiveStats {
  return {
    power: (u.engine.power - 1) * 0.06,
    rpmControl: (u.engine.rpmControl - 1) * 0.05,
    efficiency: 1 + (u.engine.efficiency - 1) * 0.04,
    cooling: (u.engine.cooling - 1) * 0.06,
    launchBonus: (u.engine.launchBonus - 1) * 0.02,
    stability: (u.wheel.stability - 1) * 0.08,
    control: (u.wheel.control - 1) * 0.09,
    bounce: (u.wheel.bounce - 1) * 0.05,
    airControl: (u.wheel.airControl - 1) * 0.35,
    durability: (u.wheel.durability - 1) * 0.06,
    rampLaunch: (u.ramp.launchBonus - 1) * 0.03,
    accuracy: (u.ramp.accuracy - 1) * 0.025,
    rampStability: (u.ramp.stability - 1) * 0.07,
    comboBonus: (u.ramp.comboBonus - 1) * 15,
    turbo: (u.engine.turbo - 1) * 0.05,
    fuelRate: (u.engine.fuel - 1) * 0.05,
    grip: (u.wheel.grip - 1) * 0.07,
    gyro: (u.wheel.gyro - 1) * 0.06,
    kick: (u.ramp.kick - 1) * 0.04,
    rail: (u.ramp.rail - 1) * 0.03,
  };
}

/** XP required to advance FROM `level` TO `level + 1`. */
export function xpNeededForLevel(level: number): number {
  return Math.round(85 * Math.pow(level, 1.4));
}

export function xpForLevel(level: number): number {
  // cumulative XP needed to reach `level` (starting at level 1)
  let total = 0;
  for (let i = 1; i < level; i++) total += xpNeededForLevel(i);
  return total;
}

export function levelFromXp(xp: number): { level: number; intoLevel: number } {
  let level = 1;
  let remaining = xp;
  while (level < MAX_PLAYER_LEVEL && remaining >= xpNeededForLevel(level)) {
    remaining -= xpNeededForLevel(level);
    level++;
  }
  return { level, intoLevel: remaining };
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  ratio: number; // 0..1 progress bar
  maxed: boolean;
}

export function levelProgress(player: { level: number; xp: number }): LevelProgress {
  if (player.level >= MAX_PLAYER_LEVEL) {
    return { level: MAX_PLAYER_LEVEL, xpIntoLevel: 0, xpForNext: 1, ratio: 1, maxed: true };
  }
  const xpForNext = xpNeededForLevel(player.level);
  return {
    level: player.level,
    xpIntoLevel: player.xp,
    xpForNext,
    ratio: Math.min(1, player.xp / xpForNext),
    maxed: false,
  };
}

/** Add XP to a save; returns the mutated save and how many levels were gained. */
export function addXp(save: SaveData, amount: number): number {
  let xp = save.player.xp + Math.max(0, Math.round(amount));
  let levels = 0;
  while (save.player.level < MAX_PLAYER_LEVEL && xp >= xpNeededForLevel(save.player.level)) {
    xp -= xpNeededForLevel(save.player.level);
    save.player.level++;
    levels++;
    save.player.coins += LEVEL_UP_REWARD;
  }
  save.player.xp = xp;
  return levels;
}
