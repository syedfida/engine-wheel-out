// ---------------------------------------------------------------------------
// Fictional arcade flight physics. No real engineering — just exaggerated,
// fun numbers tuned for the wheel-launch fantasy.
// ---------------------------------------------------------------------------
import {
  AIR_CONTROL_BASE,
  AIR_FUEL_BASE,
  BASE_VX,
  BASE_VY,
  BOUNCE_MIN,
  BOUNCE_PER_LEVEL,
  DRAG,
  GRAVITY,
  IMPACT_DRAG,
  IMPACT_DRAG_REDUCTION,
  MAX_FLIGHT_TIME,
  VX_POWER,
  VY_POWER,
  WHEEL_REST_SPEED,
} from "./config";
import { effectiveStats, type EffectiveStats } from "./progression";
import type { UpgradeLevels } from "./types";

export interface FlightState {
  x: number; // meters travelled
  y: number; // altitude above ground
  startY: number; // launch altitude (top of the ramp)
  vx: number;
  vy: number;
  time: number; // total flight time
  airTime: number; // seconds airborne
  maxHeight: number; // height above the launch point
  peakSpeed: number;
  bounces: number;
  onGround: boolean;
  wobblePhase: number;
  airFuel: number; // seconds of air control remaining
}

export function startFlight(power: number, upgrades: UpgradeLevels, startY = 0): FlightState {
  const s: EffectiveStats = effectiveStats(upgrades);
  const vx = BASE_VX + power * VX_POWER + s.rampLaunch * 2.4 + s.power * 1.2 + s.rail * 3.2;
  const vy = BASE_VY + power * VY_POWER + s.bounce * 1.8 + s.kick * 3;
  return {
    x: 0,
    y: Math.max(0, startY),
    startY: Math.max(0, startY),
    vx,
    vy,
    time: 0,
    airTime: 0,
    maxHeight: 0,
    peakSpeed: Math.hypot(vx, vy),
    bounces: 0,
    onGround: false,
    wobblePhase: Math.random() * Math.PI * 2,
    airFuel: AIR_FUEL_BASE + s.airControl + s.control * 0.15,
  };
}

export interface FlightStepResult {
  landed: boolean;
  bounced: boolean;
  hitGround: boolean;
}

/** Advance the flight simulation by dt seconds. */
export function stepFlight(
  fs: FlightState,
  dt: number,
  airHolding: boolean,
  upgrades: UpgradeLevels,
): FlightStepResult {
  const s = effectiveStats(upgrades);
  fs.time += dt;
  if (fs.time > MAX_FLIGHT_TIME) {
    return { landed: true, bounced: false, hitGround: true };
  }

  const wasAirborne = fs.y > 0.4;
  let result: FlightStepResult = { landed: false, bounced: false, hitGround: false };

  // Gravity
  fs.vy -= GRAVITY * dt;

  // Air control (hold to add lift, consumes fuel)
  let lifting = false;
  if (airHolding && fs.airFuel > 0 && fs.y > 0.4) {
    fs.vy += (AIR_CONTROL_BASE + s.control + s.airControl * 1.2) * dt;
    fs.airFuel = Math.max(0, fs.airFuel - dt);
    lifting = true;
  }

  // Arcade wobble — reduced by stability upgrades
  if (!lifting) {
    fs.wobblePhase += dt * 2.6;
    const wobble = Math.sin(fs.wobblePhase) * (1.1 - s.stability * 0.55);
    fs.vy += wobble * dt * 1.5;
    fs.vx += Math.cos(fs.wobblePhase * 0.7) * (0.7 - s.stability * 0.4) * dt;
  }

  // Drag
  fs.vx -= fs.vx * DRAG * dt * (1 - s.durability * 0.3);

  // Integrate
  fs.x += fs.vx * dt;
  fs.y += fs.vy * dt;

  // Ground contact
  if (fs.y <= 0) {
    fs.y = 0;
    fs.onGround = true;
    const impactSpeed = Math.abs(fs.vy);
    if (wasAirborne && impactSpeed > 12) {
      // bounce
      const bounceKeep = BOUNCE_MIN + s.bounce * BOUNCE_PER_LEVEL + s.bounce * 0.012;
      const impactDrag = Math.max(0.05, IMPACT_DRAG - s.durability * IMPACT_DRAG_REDUCTION);
      fs.vy = Math.min(impactSpeed * bounceKeep, 42);
      fs.vx *= 1 - impactDrag;
      fs.bounces++;
      result.bounced = true;
      result.hitGround = true;
      fs.onGround = false;
    } else {
      // rolling / soft landing — strong ground friction, the wheel
      // stops rolling within ~1 second (Grip Pads keep it rolling longer)
      fs.vy = 0;
      fs.vx *= Math.max(0, 1 - 2.2 * dt * (1 - s.grip));
      result.hitGround = true;
    }
  }

  // Track stats (height measured above the launch point)
  const heightAboveLaunch = fs.y - fs.startY;
  if (heightAboveLaunch > fs.maxHeight) fs.maxHeight = heightAboveLaunch;
  const sp = Math.hypot(fs.vx, Math.max(0, fs.vy));
  if (sp > fs.peakSpeed) fs.peakSpeed = sp;
  if (fs.y > 0.4) {
    fs.airTime += dt;
    fs.onGround = false;
  }

  // Settled?
  if (fs.onGround && fs.y <= 0 && Math.abs(fs.vx) < WHEEL_REST_SPEED && Math.abs(fs.vy) < 2) {
    result = { landed: true, bounced: result.bounced, hitGround: result.hitGround || true };
  }

  return result;
}
