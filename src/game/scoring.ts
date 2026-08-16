// ---------------------------------------------------------------------------
// Scoring & rewards: launch quality, score breakdown, coins/XP, records,
// missions, achievements and location unlocks. All pure functions.
// ---------------------------------------------------------------------------
import {
  ACHIEVEMENTS,
  BACKFIRE_BASE_RISK,
  BACKFIRE_START,
  COINS_BACKFIRE_PENALTY,
  COINS_BASE,
  COINS_PERFECT_BONUS,
  COINS_PER_SCORE,
  COINS_RECORD_BONUS,
  COINS_ZONE_BONUS,
  COMBO_BASE,
  COMBO_GOOD_LAUNCH,
  COMBO_HIGH_ACCURACY,
  COMBO_HIGH_DISTANCE,
  COMBO_MAX,
  COMBO_PERFECT,
  COMBO_RECORD,
  LOCATIONS,
  MISSIONS,
  OPTIMAL_CENTER,
  SCORE_ACCURACY_MULT,
  SCORE_DISTANCE_MULT,
  SCORE_HEIGHT_MULT,
  UPGRADE_BONUS_PER_LEVEL,
  XP_BASE,
  XP_PERFECT_BONUS,
  XP_PER_SCORE,
  XP_RECORD_BONUS,
  zoneForRpm,
} from "./config";
import { addXp, effectiveStats } from "./progression";
import { achievementProgress, missionProgress, totalUpgradeLevels } from "./config";
import type {
  HighScores,
  LaunchQuality,
  RunResult,
  RunStats,
  SaveData,
  ScoreBreakdown,
  Toast,
  UpgradeLevels,
} from "./types";

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Determine launch quality from the frozen RPM at the moment of launch. */
export function computeLaunchQuality(rpm: number, upgrades: UpgradeLevels): LaunchQuality {
  const s = effectiveStats(upgrades);
  const zone = zoneForRpm(rpm);

  // Launch power from zone + variance (reduced by Ramp Stability)
  const [lo, hi] = zone.power;
  const variance = Math.max(0.04, 0.14 - s.rampStability * 0.12);
  let power = lo + (hi - lo) * (0.4 + 0.6 * Math.random()) + (Math.random() - 0.5) * variance;
  power *= 1 + s.power + s.launchBonus + s.rampLaunch;
  if (zone.id === "overdrive") power *= 1 + s.turbo;
  power = clamp(power, 0.06, 1.35);

  // Accuracy — how close the launch was to the sweet spot
  let accuracy = 0;
  if (zone.id === "optimal") {
    accuracy = 100 - Math.abs(rpm - OPTIMAL_CENTER) * 1.5;
    accuracy = clamp(accuracy, 45, 100);
  } else if (zone.id === "overdrive") {
    accuracy = clamp(100 - (rpm - OPTIMAL_CENTER) * 2, 15, 60);
  } else if (zone.id === "normal") {
    accuracy = clamp(45 - (60 - rpm) * 1.4, 4, 45);
  } else {
    accuracy = clamp(4 + rpm * 0.4, 0, 16);
  }
  accuracy = clamp(accuracy + s.accuracy * 100, 0, 100);

  // Perfect timing window (widened by Ramp Accuracy)
  const perfectWindow = 3 + s.accuracy * 28;
  const perfect = zone.id === "optimal" && Math.abs(rpm - OPTIMAL_CENTER) <= perfectWindow && accuracy >= 97;

  // Overdrive backfire risk (reduced by Cooling)
  let backfire = false;
  if (zone.id === "overdrive" && rpm >= BACKFIRE_START) {
    const risk =
      BACKFIRE_BASE_RISK * ((rpm - BACKFIRE_START) / (100 - BACKFIRE_START)) * (1 - s.cooling);
    if (Math.random() < risk) backfire = true;
  }
  if (backfire) power *= 0.28;

  return { rpm, zone: zone.id, power, accuracy: Math.round(accuracy), perfect, backfire };
}

export function computeBreakdown(
  quality: LaunchQuality,
  stats: RunStats,
  upgrades: UpgradeLevels,
  combo: number,
): ScoreBreakdown {
  const s = effectiveStats(upgrades);
  const distance = Math.round(stats.distance * SCORE_DISTANCE_MULT);
  const height = Math.round(stats.height * SCORE_HEIGHT_MULT);
  const accuracy = Math.round(stats.accuracy * SCORE_ACCURACY_MULT);
  const comboScore = Math.round(combo * (COMBO_BASE + s.comboBonus));
  const upgrade = totalUpgradeLevels(upgrades) * UPGRADE_BONUS_PER_LEVEL;
  return {
    distance,
    height,
    accuracy,
    combo: comboScore,
    upgrade,
    total: distance + height + accuracy + comboScore + upgrade,
  };
}

export interface ProgressSync {
  toasts: Toast[];
  missionCompletions: string[];
  achievementUnlocks: string[];
}

/** Refresh mission/achievement progress for the current save; returns new
 *  completions/unlocks and their toasts. Mutates `save`. */
export function syncProgress(save: SaveData, now: number): ProgressSync {
  const toasts: Toast[] = [];
  const missionCompletions: string[] = [];
  const achievementUnlocks: string[] = [];
  let toastSeq = 0;

  for (const m of MISSIONS) {
    const st = save.missions[m.id];
    st.progress = Math.max(st.progress, missionProgress(save, m.id));
    if (st.progress >= m.target && !st.claimed) {
      missionCompletions.push(m.id);
      toasts.push({
        id: `mission-${m.id}-${now}-${toastSeq++}`,
        kind: "mission",
        title: "MISSION COMPLETE",
        subtitle: m.name,
        reward: `+${m.rewardCoins} coins — claim in MISSIONS`,
      });
    }
  }

  for (const a of ACHIEVEMENTS) {
    const st = save.achievements[a.id];
    st.progress = Math.max(st.progress, achievementProgress(save, a.id));
    if (st.progress >= a.target && st.unlockedAt === null) {
      st.unlockedAt = now;
      achievementUnlocks.push(a.id);
      save.player.coins += a.rewardCoins;
      toasts.push({
        id: `ach-${a.id}-${now}`,
        kind: "achievement",
        title: `ACHIEVEMENT UNLOCKED`,
        subtitle: a.name,
        reward: `+${a.rewardCoins} coins`,
      });
    }
  }

  return { toasts, missionCompletions, achievementUnlocks };
}

/** Check location unlock conditions; returns newly unlocked ids and toasts. */
export function syncLocations(save: SaveData, now: number): { unlocks: string[]; toasts: Toast[] } {
  const unlocks: string[] = [];
  const toasts: Toast[] = [];
  for (const loc of LOCATIONS) {
    if (!save.locations.unlocked.includes(loc.id) && loc.unlocked(save)) {
      save.locations.unlocked.push(loc.id);
      unlocks.push(loc.id);
      toasts.push({
        id: `loc-${loc.id}-${now}`,
        kind: "location",
        title: "NEW LOCATION UNLOCKED",
        subtitle: loc.name,
        reward: "Pick it in LOCATIONS",
      });
    }
  }
  return { unlocks, toasts };
}

function checkRecords(
  hs: HighScores,
  stats: RunStats,
  total: number,
): { broken: string[]; isNew: boolean } {
  const checks: [keyof HighScores, number, string][] = [
    ["bestDistance", stats.distance, "BEST DISTANCE"],
    ["bestHeight", stats.height, "BEST HEIGHT"],
    ["bestScore", total, "BEST SCORE"],
    ["bestAccuracy", stats.accuracy, "BEST ACCURACY"],
    ["bestAirTime", stats.airTime, "LONGEST AIR TIME"],
    ["bestSpeed", stats.peakSpeed, "TOP SPEED"],
  ];
  const broken: string[] = [];
  for (const [key, val, label] of checks) {
    if (val > hs[key]) {
      hs[key] = val;
      broken.push(label);
    }
  }
  return { broken, isNew: broken.length > 0 };
}

export interface RunApplyResult {
  save: SaveData;
  run: RunResult;
  toasts: Toast[];
}

/** Apply a completed run to the save: rewards, records, progress, unlocks. */
export function applyRunToSave(
  saveIn: SaveData,
  quality: LaunchQuality,
  statsIn: RunStats,
  prevCombo: number,
  now: number,
): RunApplyResult {
  const save: SaveData = JSON.parse(JSON.stringify(saveIn)) as SaveData;
  const s = effectiveStats(save.upgrades);
  const stats: RunStats = {
    distance: Math.max(0, statsIn.distance),
    height: Math.max(0, statsIn.height),
    airTime: Math.max(0, statsIn.airTime),
    accuracy: clamp(statsIn.accuracy, 0, 100),
    peakSpeed: Math.max(0, statsIn.peakSpeed),
    bounces: Math.max(0, statsIn.bounces),
  };

  // Combo gains (record bonus added below)
  let gains = 0;
  if (quality.power >= 0.5) gains += COMBO_GOOD_LAUNCH;
  if (quality.perfect) gains += COMBO_PERFECT;
  if (stats.distance >= 500) gains += COMBO_HIGH_DISTANCE;
  if (stats.accuracy >= 95) gains += COMBO_HIGH_ACCURACY;
  let combo = quality.backfire ? 0 : Math.min(COMBO_MAX, prevCombo + gains);

  const breakdown = computeBreakdown(quality, stats, save.upgrades, combo);
  const total = breakdown.total;

  // Records
  const { broken, isNew } = checkRecords(save.highScores, stats, total);
  const recordsBroken = broken;
  const isNewRecord = isNew;
  if (isNewRecord) {
    combo = Math.min(COMBO_MAX, combo + COMBO_RECORD);
    gains += COMBO_RECORD;
  }

  // Coins & XP
  let coins = Math.round((COINS_BASE + total / COINS_PER_SCORE) * s.efficiency);
  coins += COINS_ZONE_BONUS[quality.zone];
  if (quality.perfect) coins += COINS_PERFECT_BONUS;
  if (isNewRecord) coins += COINS_RECORD_BONUS;
  if (quality.backfire) coins = Math.round(coins * (1 - COINS_BACKFIRE_PENALTY));
  coins = Math.max(5, coins);

  let xp = Math.round((XP_BASE + total / XP_PER_SCORE + (quality.perfect ? XP_PERFECT_BONUS : 0)) * s.efficiency);
  if (isNewRecord) xp += XP_RECORD_BONUS;

  // Accumulate history
  save.highScores.totalScore += total;
  save.highScores.totalDistance += Math.round(stats.distance);
  save.highScores.totalLaunches += 1;
  if (quality.perfect) save.highScores.totalPerfect += 1;
  if (quality.zone === "overdrive") save.highScores.totalOverdrive += 1;
  if (recordsBroken.length > 0) save.highScores.totalRecordBreaks += recordsBroken.length;

  // Player progression
  save.player.coins += coins;
  const levelUps = addXp(save, xp);

  // Progress sync (missions, achievements, locations)
  const progress = syncProgress(save, now);
  const loc = syncLocations(save, now);
  const toasts: Toast[] = [];

  if (levelUps > 0) {
    toasts.push({
      id: `lvl-${now}`,
      kind: "levelup",
      title: `LEVEL ${save.player.level}!`,
      subtitle: `${levelUps} level${levelUps > 1 ? "s" : ""} up`,
      reward: `+${levelUps * 150} coins`,
    });
  }
  if (isNewRecord) {
    toasts.push({
      id: `rec-${now}`,
      kind: "record",
      title: "NEW RECORD!",
      subtitle: recordsBroken.slice(0, 3).join(" · "),
      reward: `+${COINS_RECORD_BONUS} coins`,
    });
  }
  toasts.push(...progress.toasts, ...loc.toasts);

  const run: RunResult = {
    quality,
    stats,
    breakdown,
    coins,
    xp,
    combo,
    comboGain: gains,
    isNewRecord,
    recordsBroken,
    levelUps,
    missionCompletions: progress.missionCompletions,
    achievementUnlocks: progress.achievementUnlocks,
    locationUnlocks: loc.unlocks,
  };

  return { save, run, toasts };
}
