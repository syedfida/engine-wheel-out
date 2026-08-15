// ---------------------------------------------------------------------------
// GameRenderer — the canvas heart of the game.
// Handles: cinematic menu scene, engine close-up + RPM building, slow-mo
// launch sequence, flight simulation rendering, particles, camera states and
// audio hooks. All visuals are original procedural art.
// ---------------------------------------------------------------------------
import { audio } from "../audio";
import {
  AIR_FUEL_BASE,
  RPM_AUTO_RISE,
  RPM_DECAY,
  RPM_HOLD_BONUS,
  RPM_SLOW_RISE,
  RPM_WOBBLE,
  locationById,
} from "../config";
import { vibrate } from "../haptics";
import { effectiveStats } from "../progression";
import { startFlight, stepFlight, type FlightState } from "../physics";
import type { EquippedCosmetics, GamePhase, HudData, LaunchQuality, RunStats, UpgradeLevels } from "../types";
import { drawEnvironment, type EnvState } from "./env";
import { ParticleSystem } from "./particles";

export type RenderMode = "menu" | "gameplay";

export interface RendererConfig {
  graphics: "low" | "medium" | "high";
  reducedEffects: boolean;
  vibration: boolean;
  locationId: string;
  equipped: EquippedCosmetics;
  upgrades: UpgradeLevels;
}

export interface RendererCallbacks {
  onHud: (hud: HudData) => void;
  onFlightComplete: (stats: RunStats) => void;
}

const PX_PER_M = 6; // world scale: meters -> pixels
const HEIGHT_PX_PER_M = 2.2;

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

interface WheelStyle {
  tire: string;
  rim: string;
  hub: string;
  glow: string;
}
const WHEEL_STYLES: Record<string, WheelStyle> = {
  wheel_classic: { tire: "#26262c", rim: "#8f929b", hub: "#6b6f78", glow: "#ff9a3c" },
  wheel_steel: { tire: "#3a3d42", rim: "#c3cbd4", hub: "#9aa4ae", glow: "#cfe0ff" },
  wheel_flame: { tire: "#3a1d18", rim: "#ff7a2a", hub: "#b34a1f", glow: "#ff5a1a" },
  wheel_neon: { tire: "#13141c", rim: "#35d6ff", hub: "#1f8fb0", glow: "#35d6ff" },
  wheel_gold: { tire: "#2e2810", rim: "#e9b83c", hub: "#a37f1e", glow: "#ffd54a" },
};

const ENGINE_STYLES: Record<string, { body: string; head: string; accent: string; dark: string }> = {
  engine_stock: { body: "#47534a", head: "#333e36", accent: "#5d6b60", dark: "#20261f" },
  engine_chrome: { body: "#c9d2da", head: "#aeb9c4", accent: "#e6edf4", dark: "#6f7a85" },
  engine_carbon: { body: "#2b2f35", head: "#1d2126", accent: "#3a4048", dark: "#101317" },
  engine_gold: { body: "#d9a92e", head: "#b8891f", accent: "#f2cc5a", dark: "#7a5c10" },
};

const TRAIL_COLORS: Record<string, string | null> = {
  trail_none: null,
  trail_spark: "#ffb347",
  trail_ember: "#ff5a2a",
  trail_gold: "#ffd54a",
};

const DUST_COLORS: Record<string, string> = {
  dust_default: "",
  dust_sand: "#d9b46a",
  dust_ember: "#ff8a4a",
};

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cfg: RendererConfig;
  private cb: RendererCallbacks;
  private raf = 0;
  private last = 0;
  private destroyed = false;
  paused = false;

  mode: RenderMode = "menu";
  private dpr = 1;
  private w = 320;
  private h = 640;
  private resScale = 1;

  private time = 0;

  // Menu scene
  private menuSpin = 0;

  // Gameplay
  phase: GamePhase = "idle";
  private rpm = 0;
  private holding = false;
  private engineRunning = false;
  private wobbleSeed = Math.random() * 10;
  private quality: LaunchQuality | null = null;
  private flight: FlightState | null = null;
  private airHolding = false;
  private launchT = 0;
  private landingT = 0;
  private hudTimer = 0;
  private shakeX = 0;
  private shakeY = 0;
  private camZoom = 1;
  private camZoomTarget = 1;
  private flyCamY = 0;

  private particles = new ParticleSystem(220);
  private hudSentPhase: GamePhase | null = null;

  constructor(canvas: HTMLCanvasElement, cfg: RendererConfig, cb: RendererCallbacks) {
    this.canvas = canvas;
    this.cfg = cfg;
    this.cb = cb;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.applyConfig(cfg);
    this.resize();
    window.addEventListener("resize", this.onResize);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  applyConfig(cfg: RendererConfig): void {
    this.cfg = cfg;
    this.resScale = cfg.graphics === "low" ? 0.7 : cfg.graphics === "high" ? 1.3 : 1;
    const budget = cfg.reducedEffects ? 90 : cfg.graphics === "low" ? 140 : cfg.graphics === "high" ? 340 : 230;
    this.particles.setMax(budget);
    if (this.w > 0) this.resize();
  }

  private onResize = (): void => {
    this.resize();
  };

  resize(): void {
    const cw = this.canvas.clientWidth || this.canvas.parentElement?.clientWidth || window.innerWidth;
    const ch = this.canvas.clientHeight || this.canvas.parentElement?.clientHeight || window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = cw;
    this.h = ch;
    this.canvas.width = Math.max(2, Math.round(cw * this.dpr * this.resScale));
    this.canvas.height = Math.max(2, Math.round(ch * this.dpr * this.resScale));
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    this.stopEngineSound();
  }

  setMode(mode: RenderMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.particles.clear();
    this.phase = "idle";
    this.rpm = 0;
    this.engineRunning = false;
    this.flight = null;
    this.quality = null;
    this.camZoom = 1;
    this.camZoomTarget = 1;
    this.stopEngineSound();
  }

  // --- Gameplay controls ----------------------------------------------------

  startEngine(): void {
    if (this.mode !== "gameplay") return;
    if (this.phase !== "idle" && this.phase !== "building") return;
    this.engineRunning = true;
    if (this.phase === "idle") this.phase = "building";
    vibrate("start", this.cfg.vibration);
  }

  stopEngine(): void {
    if (this.mode !== "gameplay") return;
    this.engineRunning = false;
    vibrate("stop", this.cfg.vibration);
  }

  setHolding(v: boolean): void {
    this.holding = v;
  }

  launch(quality: LaunchQuality): void {
    if (this.mode !== "gameplay") return;
    if (this.phase !== "idle" && this.phase !== "building") return;
    this.quality = quality;
    this.phase = "launching";
    this.launchT = 0;
    this.engineRunning = false;
    this.holding = false;
    this.camZoomTarget = 1.28;
    this.camZoom = 1.18;
    vibrate("launch", this.cfg.vibration);
    this.particles.burst({
      x: this.launchX(), y: this.groundY() - 10, count: this.particleCount(18),
      speed: 160, life: 0.7, size: 5, color: "#ffb347", gravity: 300, angle: -Math.PI / 2, spread: Math.PI * 0.9,
    });
  }

  setAirHolding(v: boolean): void {
    this.airHolding = v;
  }

  /** Swipe-up bonus: a quick upward nudge that consumes a bit of air fuel. */
  airBoost(): void {
    if (this.mode !== "gameplay" || this.phase !== "flight" || !this.flight) return;
    if (this.flight.airFuel < 0.3) return;
    this.flight.vy += 13;
    this.flight.airFuel = Math.max(0, this.flight.airFuel - 0.4);
    this.particles.burst({
      x: this.wheelScreenX(this.flight.x),
      y: this.wheelScreenY(this.flight.y),
      count: this.particleCount(8),
      speed: 90,
      life: 0.4,
      size: 3,
      color: "#9be8ff",
      gravity: -40,
      angle: -Math.PI / 2,
      spread: Math.PI * 0.6,
    });
  }

  resetRun(): void {
    this.phase = "idle";
    this.rpm = 0;
    this.engineRunning = false;
    this.flight = null;
    this.quality = null;
    this.launchT = 0;
    this.landingT = 0;
    this.camZoom = 1;
    this.camZoomTarget = 1;
    this.flyCamY = 0;
    this.particles.clear();
    this.stopEngineSound();
  }

  private stopEngineSound(): void {
    audio.updateEngine(0, false);
    audio.stopWind();
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
    audio.suspend();
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.last = performance.now();
    audio.resume();
  }

  // --- Helpers --------------------------------------------------------------

  private groundY(): number {
    return this.h * 0.6;
  }

  private launchX(): number {
    return this.w * 0.2;
  }

  private wheelRadius(): number {
    return Math.min(64, Math.max(28, Math.min(this.w, this.h) * 0.12));
  }

  private particleCount(base: number): number {
    const mult = this.cfg.reducedEffects ? 0.35 : this.cfg.graphics === "low" ? 0.6 : this.cfg.graphics === "high" ? 1.5 : 1;
    return Math.max(2, Math.round(base * mult));
  }

  private heat(): number {
    if (this.mode !== "gameplay") return 0;
    return Math.max(0, (this.rpm - 20) / 80);
  }

  // --- Main loop ------------------------------------------------------------

  private tick = (t: number): void => {
    if (this.destroyed) return;
    const rawDt = Math.min(0.05, Math.max(0.001, (t - this.last) / 1000));
    this.last = t;
    if (!this.paused) {
      this.update(rawDt);
    }
    this.draw();
    this.raf = requestAnimationFrame(this.tick);
  };

  private update(dt: number): void {
    this.time += dt;
    if (this.mode === "menu") {
      this.updateMenu(dt);
      return;
    }
    this.updateGameplay(dt);
    this.particles.update(dt);

    // HUD (throttled)
    this.hudTimer += dt;
    if (this.hudTimer >= 0.12 || this.phase !== this.hudSentPhase) {
      this.hudTimer = 0;
      this.hudSentPhase = this.phase;
      this.sendHud();
    }
  }

  private updateMenu(dt: number): void {
    this.menuSpin += dt * 1.6;
    // ambient dust
    const dustColor = this.dustColor();
    if (Math.random() < 0.06) {
      this.particles.spawn({
        x: Math.random() * this.w,
        y: this.h * (0.72 + Math.random() * 0.26),
        vx: -20 - Math.random() * 30,
        vy: -8 - Math.random() * 12,
        life: 2.4 + Math.random() * 2,
        size: 2 + Math.random() * 3.5,
        color: dustColor,
        drag: 0.4,
      });
    }
    this.particles.update(dt);
    audio.updateEngine(0, false);
  }

  private updateGameplay(dt: number): void {
    const upgrades = this.cfg.upgrades;
    const s = effectiveStats(upgrades);

    switch (this.phase) {
      case "idle": {
        this.rpm = Math.max(0, this.rpm - RPM_DECAY * dt);
        this.camZoomTarget = 1;
        this.camZoom += (this.camZoomTarget - this.camZoom) * 0.06;
        audio.updateEngine(0, false);
        break;
      }
      case "building": {
        const rate = this.engineRunning ? (this.holding ? RPM_AUTO_RISE + RPM_HOLD_BONUS : RPM_SLOW_RISE) : -RPM_DECAY;
        if (!this.engineRunning && this.rpm <= 0) {
          this.phase = "idle";
          this.camZoomTarget = 1;
          break;
        }
        this.rpm = Math.min(100, Math.max(0, this.rpm + rate * dt));
        this.rpm += Math.sin(this.time * 3.1 + this.wobbleSeed) * RPM_WOBBLE * 0.5 * (1 - s.rpmControl) * dt * 2.2;
        this.rpm = Math.min(100, Math.max(0, this.rpm));
        this.camZoomTarget = 1 + (this.rpm / 100) * 0.05;
        this.camZoom += (this.camZoomTarget - this.camZoom) * 0.08;

        // effects
        const wx = this.launchX() + this.wheelRadius() * 0.85;
        const wy = this.groundY() - this.wheelRadius() * 0.95;
        if (Math.random() < this.rpm / 140) {
          this.particles.spawn({
            x: wx + (Math.random() - 0.5) * 14,
            y: wy + Math.random() * 6,
            vx: -30 - this.rpm * 0.4 + (Math.random() - 0.5) * 20,
            vy: -8 - Math.random() * 18,
            life: 0.5 + Math.random() * 0.6,
            size: 2 + Math.random() * 3,
            color: this.dustColor(),
            drag: 1.4,
          });
        }
        // exhaust puffs
        if (Math.random() < this.rpm / 60) {
          this.particles.spawn({
            x: this.launchX() + this.wheelRadius() * 2.1,
            y: this.groundY() - this.wheelRadius() * 0.55,
            vx: 60 + this.rpm * 1.2,
            vy: -20 - this.rpm * 0.3,
            life: 0.35 + Math.random() * 0.3,
            size: 3 + this.rpm * 0.05,
            color: "rgba(160,160,170,0.85)",
            drag: 2,
          });
        }
        audio.updateEngine(this.rpm, true);
        break;
      }
      case "launching": {
        this.launchT += dt * 0.42; // slow-motion anticipation
        this.camZoom += (1.28 - this.camZoom) * 0.12;
        // speed lines build
        if (Math.random() < 0.5 && !this.cfg.reducedEffects) {
          this.particles.spawn({
            x: Math.random() * this.w,
            y: Math.random() * this.h,
            vx: -500 - Math.random() * 300,
            vy: 0,
            life: 0.25,
            size: 1.6,
            color: "rgba(255,255,255,0.8)",
            kind: "streak",
          });
        }
        audio.updateEngine(this.rpm, true);
        if (this.launchT >= 1) {
          // LAUNCH! (start at the top of the ramp so the visuals stay continuous)
          const rampTopMeters = (this.wheelRadius() * 1.18) / HEIGHT_PX_PER_M;
          this.flight = startFlight(this.quality?.power ?? 0.3, upgrades, rampTopMeters);
          this.phase = "flight";
          audio.sfx(this.quality?.backfire ? "backfire" : "launch");
          audio.updateEngine(0, false);
          if (this.quality?.backfire) {
            this.particles.burst({
              x: this.launchX(), y: this.groundY() - 20, count: this.particleCount(26),
              speed: 200, life: 0.8, size: 4, color: "#6a6a72", gravity: 200,
              angle: Math.PI, spread: Math.PI * 0.8,
            });
          }
        }
        break;
      }
      case "flight": {
        if (!this.flight) {
          this.phase = "done";
          break;
        }
        const res = stepFlight(this.flight, dt, this.airHolding, upgrades);
        const fx = this.flight;

        // trail
        const trail = TRAIL_COLORS[this.cfg.equipped.trail];
        if (trail && Math.random() < 0.75) {
          this.particles.spawn({
            x: this.wheelScreenX(fx.x),
            y: this.wheelScreenY(fx.y),
            vx: -fx.vx * 0.5 + (Math.random() - 0.5) * 30,
            vy: -fx.vy * 0.3,
            life: 0.4 + Math.random() * 0.4,
            size: 2.5 + Math.random() * 3,
            color: trail,
            gravity: 40,
            drag: 1.2,
          });
        }
        // ground dust while low
        if (fx.y < 8 && Math.random() < 0.5) {
          this.particles.spawn({
            x: this.wheelScreenX(fx.x),
            y: this.groundY(),
            vx: -fx.vx * 0.35,
            vy: -20 - Math.random() * 20,
            life: 0.5,
            size: 3 + Math.random() * 4,
            color: this.dustColor(),
            drag: 1.6,
          });
        }
        // speed lines
        const speed = Math.hypot(fx.vx, fx.vy);
        if (speed > 110 && !this.cfg.reducedEffects && Math.random() < 0.25) {
          this.particles.spawn({
            x: this.w * (0.2 + Math.random() * 0.8),
            y: Math.random() * this.h,
            vx: -(speed * 3),
            vy: 0,
            life: 0.18,
            size: 1.4,
            color: "rgba(255,255,255,0.7)",
            kind: "streak",
          });
        }
        // camera — pan up only when the wheel climbs above ~42% of the screen
        const rawY = this.groundY() - fx.y * HEIGHT_PX_PER_M;
        const targetCamY = Math.max(0, this.h * 0.42 - rawY);
        this.camZoomTarget = 1 + Math.min(0.16, speed / 700);
        this.camZoom += (this.camZoomTarget - this.camZoom) * 0.1;
        this.flyCamY += (targetCamY - this.flyCamY) * 0.12;

        audio.updateWind(Math.max(fx.vx, 0));
        this.shakeX = 0;
        this.shakeY = 0;

        if (res.bounced) {
          audio.sfx("impact");
          vibrate("impact", this.cfg.vibration);
          this.particles.burst({
            x: this.wheelScreenX(fx.x),
            y: this.groundY(),
            count: this.particleCount(14),
            speed: 140,
            life: 0.5,
            size: 4,
            color: this.dustColor(),
            gravity: 320,
            angle: -Math.PI / 2,
            spread: Math.PI,
          });
        }
        if (res.landed) {
          this.phase = "landing";
          this.landingT = 0;
          audio.stopWind();
          audio.sfx("impact");
          vibrate("impact", this.cfg.vibration);
          this.particles.burst({
            x: this.wheelScreenX(fx.x),
            y: this.groundY(),
            count: this.particleCount(30),
            speed: 240,
            life: 0.8,
            size: 5,
            color: this.dustColor(),
            gravity: 400,
            angle: -Math.PI / 2,
            spread: Math.PI * 1.1,
          });
        }
        break;
      }
      case "landing": {
        this.landingT += dt;
        this.camZoom += (1 - this.camZoom) * 0.05;
        audio.updateWind(0);
        if (this.landingT >= 0.9) {
          this.phase = "done";
          this.sendHud();
          if (this.flight && this.quality) {
            const f = this.flight;
            this.cb.onFlightComplete({
              distance: Math.round(f.x),
              height: Math.round(f.maxHeight),
              airTime: Math.round(f.airTime * 10) / 10,
              accuracy: this.quality.accuracy,
              peakSpeed: Math.round(f.peakSpeed * 10) / 10,
              bounces: f.bounces,
            });
          }
        }
        break;
      }
      case "done": {
        break;
      }
    }

    // decay shake
    this.shakeX *= 0.88;
    this.shakeY *= 0.88;
  }

  private sendHud(): void {
    const f = this.flight;
    this.cb.onHud({
      phase: this.phase,
      rpm: Math.round(this.rpm * 10) / 10,
      power: Math.round(this.rpm) / 100,
      distance: f ? Math.round(f.x) : 0,
      height: f ? Math.round(f.maxHeight) : 0,
      airTime: f ? Math.round(f.airTime * 10) / 10 : 0,
      speed: f ? Math.round(Math.hypot(f.vx, f.vy)) : 0,
      combo: 0,
      airFuel: f ? Math.min(1, f.airFuel / AIR_FUEL_BASE) : 0,
    });
  }

  // --- Screen mapping -------------------------------------------------------

  private wheelScreenX(worldX: number): number {
    const camX = this.flight ? this.flight.x * PX_PER_M : 0;
    return this.w * 0.3 + worldX * PX_PER_M - camX;
  }

  private wheelScreenY(worldY: number): number {
    const raw = this.groundY() - worldY * HEIGHT_PX_PER_M - this.flyCamY;
    return Math.max(-this.h * 0.4, Math.min(this.h * 0.95, raw));
  }

  private dustColor(): string {
    const d = DUST_COLORS[this.cfg.equipped.dust];
    if (d) return d;
    return locationById(this.cfg.locationId).visual.dust;
  }

  // --- Drawing --------------------------------------------------------------

  private draw(): void {
    const ctx = this.ctx;
    const { w, h } = this;
    const scale = this.dpr * this.resScale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    // camera zoom + shake
    const zoom = this.mode === "menu" ? 1 + Math.sin(this.time * 0.6) * 0.012 : this.camZoom;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-w / 2 + this.shakeX, -h / 2 + this.shakeY);

    if (this.mode === "menu") {
      this.drawMenuScene(ctx);
    } else {
      this.drawGameplayScene(ctx);
    }

    ctx.restore();

    // vignette
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.72);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.34)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  private envScroll(): number {
    if (this.mode === "menu") return this.time * 8;
    if (this.flight) return this.flight.x * PX_PER_M;
    return 0;
  }

  private drawMenuScene(ctx: CanvasRenderingContext2D): void {
    const { w, h } = this;
    const env: EnvState = {
      loc: locationById(this.cfg.locationId).visual,
      scroll: this.envScroll(),
      t: this.time,
      seed: 7,
    };
    drawEnvironment(ctx, w, h, env);

    // cinematic light shaft
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#ffe9b0";
    ctx.beginPath();
    ctx.moveTo(w * 0.72, 0);
    ctx.lineTo(w * 0.72 + 60, h);
    ctx.lineTo(w * 0.72 - 140, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const groundY = this.groundY();
    const r = this.wheelRadius();

    // engine on a stand, left side
    const ex = w * 0.2;
    const ey = groundY - r * 0.25;
    const menuRpm = 14 + 7 * Math.sin(this.time * 0.9);
    this.drawEngine(ctx, ex, ey, r * 0.95, menuRpm, 0.25);

    // wheel on ramp, right of center
    const wx = w * 0.56;
    const wy = groundY - r * 1.05;
    this.drawRamp(ctx, wx, groundY, r);
    this.drawWheel(ctx, wx, wy, r, this.menuSpin, 0.3);

    // dust kicked under wheel
    if (Math.random() < 0.05) {
      this.particles.spawn({
        x: wx + (Math.random() - 0.5) * r,
        y: groundY - 4,
        vx: -30 + Math.random() * 60,
        vy: -12 - Math.random() * 14,
        life: 1 + Math.random(),
        size: 2.4,
        color: this.dustColor(),
        drag: 1.2,
      });
    }
    this.particles.draw(ctx);
  }

  private drawGameplayScene(ctx: CanvasRenderingContext2D): void {
    const { w, h } = this;
    const env: EnvState = {
      loc: locationById(this.cfg.locationId).visual,
      scroll: this.envScroll(),
      t: this.time,
      seed: 11,
    };
    drawEnvironment(ctx, w, h, env);

    const groundY = this.groundY();
    const r = this.wheelRadius();
    const lx = this.launchX();

    // Ramp + wheel during build/launch
    if (this.phase === "idle" || this.phase === "building" || this.phase === "launching") {
      this.drawRamp(ctx, lx, groundY, r);
      const wx = lx + r * 0.55;
      const wy = groundY - r * 1.18;
      const spin = this.rpm / 100 * 9 + this.time * 0.2;
      this.drawWheel(ctx, wx, wy, r, spin, this.heat());
      this.drawEngine(ctx, w * 0.36, groundY - r * 0.32, r * 0.85, this.phase === "launching" ? 100 : this.rpm, this.heat());
    }

    // Flying wheel
    if (this.flight && (this.phase === "flight" || this.phase === "landing" || this.phase === "done")) {
      const f = this.flight;
      const sx = this.wheelScreenX(f.x);
      const sy = this.wheelScreenY(f.y);
      const spin = f.x / r * 0.32;

      // shadow
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(sx, groundY + r * 0.22, r * 0.7, r * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      this.drawWheel(ctx, sx, sy, r, spin, Math.min(1, f.peakSpeed / 160));
    }

    this.particles.draw(ctx);
  }

  // --- Procedural props -----------------------------------------------------

  private drawRamp(ctx: CanvasRenderingContext2D, x: number, groundY: number, r: number): void {
    const rampLen = r * 2.1;
    const rampTop = r * 1.15;
    ctx.save();
    // support legs
    ctx.fillStyle = "#5a3d22";
    ctx.fillRect(x + rampLen * 0.28, groundY - rampTop + r * 0.3, 6, rampTop - r * 0.3);
    ctx.fillRect(x + rampLen * 0.66, groundY - rampTop + r * 0.5, 6, rampTop - r * 0.5);
    // deck
    ctx.fillStyle = "#7a5230";
    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, groundY);
    ctx.lineTo(x + rampLen, groundY - rampTop);
    ctx.lineTo(x + rampLen + r * 0.5, groundY - rampTop + 8);
    ctx.lineTo(x - r * 0.6 + r * 0.9, groundY + 8);
    ctx.closePath();
    ctx.fill();
    // planks
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const t = i / 5;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.6 + t * r * 1.5, groundY - t * 6);
      ctx.lineTo(x + rampLen * (0.2 + t * 0.8), groundY - rampTop * (0.25 + t * 0.75));
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawEngine(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rpm: number, heat: number): void {
    const style = ENGINE_STYLES[this.cfg.equipped.engine] ?? ENGINE_STYLES.engine_stock;
    const vib = rpm > 0 ? (Math.random() * 2 - 1) * s * 0.014 * Math.min(1, rpm / 100) : 0;
    ctx.save();
    ctx.translate(x + vib, y + vib * 0.6);

    // heat glow
    if (heat > 0.04) {
      const g = ctx.createRadialGradient(x, y, s * 0.2, x, y, s * 1.6);
      g.addColorStop(0, `rgba(255,140,40,${0.3 * heat})`);
      g.addColorStop(1, "rgba(255,140,40,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - s * 1.8, y - s * 1.8, s * 3.6, s * 3.6);
    }

    // intake pipes
    ctx.strokeStyle = style.accent;
    ctx.lineWidth = Math.max(3, s * 0.09);
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      const off = (i - 1) * s * 0.22;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.25 + off, y - s * 0.55);
      ctx.quadraticCurveTo(x - s * 0.55 + off, y - s * 0.8, x - s * 0.55 + off, y - s * 0.95);
      ctx.stroke();
    }

    // cylinder head
    rr(ctx, x - s * 0.58, y - s * 0.62, s * 1.16, s * 0.34, s * 0.08);
    ctx.fillStyle = style.head;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // valve cover bolts
    ctx.fillStyle = style.accent;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(x - s * 0.4 + i * s * 0.26, y - s * 0.45, s * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }

    // body
    rr(ctx, x - s * 0.8, y - s * 0.3, s * 1.6, s * 0.6, s * 0.1);
    ctx.fillStyle = style.body;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // accent stripes
    ctx.fillStyle = style.accent;
    ctx.fillRect(x - s * 0.7, y - s * 0.18, s * 0.5, s * 0.08);
    ctx.fillRect(x + s * 0.2, y - s * 0.18, s * 0.5, s * 0.08);

    // exhaust pipe
    ctx.strokeStyle = style.dark;
    ctx.lineWidth = Math.max(4, s * 0.14);
    ctx.beginPath();
    ctx.moveTo(x + s * 0.8, y - s * 0.05);
    ctx.lineTo(x + s * 1.15, y - s * 0.32);
    ctx.stroke();
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(x + s * 1.15, y - s * 0.32, s * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // fan
    const fanX = x - s * 0.72;
    const fanY = y - s * 0.02;
    const fanR = s * 0.16;
    ctx.fillStyle = style.dark;
    ctx.beginPath();
    ctx.arc(fanX, fanY, fanR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = style.accent;
    ctx.lineWidth = 2;
    const a = this.time * (2 + rpm * 0.5);
    for (let i = 0; i < 3; i++) {
      const ang = a + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(fanX, fanY);
      ctx.lineTo(fanX + Math.cos(ang) * fanR * 0.9, fanY + Math.sin(ang) * fanR * 0.9);
      ctx.stroke();
    }
    ctx.fillStyle = style.body;
    ctx.beginPath();
    ctx.arc(fanX, fanY, fanR * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, spin: number, heat: number): void {
    const style = WHEEL_STYLES[this.cfg.equipped.wheel] ?? WHEEL_STYLES.wheel_classic;

    ctx.save();
    ctx.translate(x, y);

    // heat glow
    if (heat > 0.05) {
      const g = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.2);
      g.addColorStop(0, `${style.glow}${Math.floor(60 * heat).toString(16).padStart(2, "0")}`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // tire
    ctx.fillStyle = style.tire;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // tread blocks
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = Math.max(2, r * 0.055);
    for (let i = 0; i < 10; i++) {
      const a = spin + (i * Math.PI * 2) / 10;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.97, a - 0.11, a + 0.11);
      ctx.stroke();
    }

    // rim ring
    ctx.fillStyle = style.rim;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    ctx.fill();

    // spokes
    ctx.strokeStyle = style.hub;
    ctx.lineCap = "round";
    const rim = this.cfg.equipped.rim;
    if (rim === "rim_spoke") {
      ctx.lineWidth = r * 0.07;
      for (let i = 0; i < 8; i++) {
        const a = spin + (i * Math.PI * 2) / 8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.12, Math.sin(a) * r * 0.12);
        ctx.lineTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
        ctx.stroke();
      }
    } else if (rim === "rim_turbine") {
      ctx.lineWidth = r * 0.09;
      for (let i = 0; i < 6; i++) {
        const a = spin + (i * Math.PI * 2) / 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.1, Math.sin(a) * r * 0.1);
        ctx.quadraticCurveTo(
          Math.cos(a + 0.55) * r * 0.42,
          Math.sin(a + 0.55) * r * 0.42,
          Math.cos(a + 0.8) * r * 0.6,
          Math.sin(a + 0.8) * r * 0.6,
        );
        ctx.stroke();
      }
    } else if (rim === "rim_hex") {
      ctx.lineWidth = r * 0.06;
      for (let i = 0; i < 3; i++) {
        const a = spin + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
        ctx.lineTo(Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58);
        ctx.stroke();
      }
      ctx.lineWidth = r * 0.04;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = spin + (i * Math.PI * 2) / 6;
        const px = Math.cos(a) * r * 0.45;
        const py = Math.sin(a) * r * 0.45;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      // stock: 4 thick spokes
      ctx.lineWidth = r * 0.14;
      for (let i = 0; i < 4; i++) {
        const a = spin + (i * Math.PI * 2) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.12, Math.sin(a) * r * 0.12);
        ctx.lineTo(Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58);
        ctx.stroke();
      }
    }

    // hub + decal
    ctx.fillStyle = style.hub;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const decal = this.cfg.equipped.decal;
    if (decal === "decal_star") {
      ctx.fillStyle = "#ffffff";
      this.drawStar(ctx, 0, 0, r * 0.17, r * 0.07, 5);
    } else if (decal === "decal_bolt") {
      ctx.fillStyle = "#ffe45a";
      ctx.beginPath();
      ctx.moveTo(r * 0.03, -r * 0.16);
      ctx.lineTo(-r * 0.08, r * 0.01);
      ctx.lineTo(-r * 0.01, r * 0.01);
      ctx.lineTo(-r * 0.03, r * 0.16);
      ctx.lineTo(r * 0.08, -r * 0.01);
      ctx.lineTo(r * 0.01, -r * 0.01);
      ctx.closePath();
      ctx.fill();
    } else if (decal === "decal_crescent") {
      ctx.fillStyle = "#ffd54a";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = style.hub;
      ctx.beginPath();
      ctx.arc(r * 0.05, 0, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number, points: number): void {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const rad = i % 2 === 0 ? outer : inner;
      const a = (i * Math.PI) / points - Math.PI / 2;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
}
