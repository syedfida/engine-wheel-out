// ---------------------------------------------------------------------------
// Procedural environment painting: sky, sun/moon, stars, clouds, mountains,
// fields, road, trees, buildings, fog, festival lights, night lanterns.
// All original procedural art — no external assets.
// ---------------------------------------------------------------------------
import type { LocationVisual } from "../config";

/** Deterministic pseudo-random from an integer seed. */
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export interface EnvState {
  loc: LocationVisual;
  /** world-space scroll offset in px (camera) */
  scroll: number;
  /** elapsed time for ambient animation */
  t: number;
  seed: number;
}

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, s: EnvState): void {
  const g = ctx.createLinearGradient(0, 0, 0, h * 0.75);
  g.addColorStop(0, s.loc.skyTop);
  g.addColorStop(1, s.loc.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Sun / moon
  const cx = w * 0.72;
  const cy = h * 0.22;
  if (s.loc.moon || !s.loc.stars) {
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, w * 0.28);
    glow.addColorStop(0, s.loc.sunGlow);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - w * 0.28, cy - w * 0.28, w * 0.56, w * 0.56);
    ctx.fillStyle = s.loc.sun;
    ctx.beginPath();
    ctx.arc(cx, cy, h * 0.055, 0, Math.PI * 2);
    ctx.fill();
    if (s.loc.moon) {
      ctx.fillStyle = "rgba(20,30,50,0.25)";
      ctx.beginPath();
      ctx.arc(cx - h * 0.02, cy - h * 0.01, h * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (s.loc.stars) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 70; i++) {
      const x = hash(i * 3 + s.seed) * w;
      const y = hash(i * 7 + s.seed) * h * 0.5;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(s.t * 1.4 + i));
      ctx.globalAlpha = tw;
      const sz = 0.8 + hash(i * 13) * 1.4;
      ctx.fillRect(x, y, sz, sz);
    }
    ctx.globalAlpha = 1;
  }
}

function drawMountains(ctx: CanvasRenderingContext2D, w: number, h: number, s: EnvState, layer: string[], factor: number, base: number, amp: number): void {
  const horizon = h * 0.66;
  for (let li = 0; li < layer.length; li++) {
    ctx.fillStyle = layer[li];
    ctx.beginPath();
    ctx.moveTo(-40, horizon + 40);
    const span = 420;
    const off = (s.scroll * factor) % span;
    const start = -span - off;
    for (let x = start; x < w + span; x += span) {
      const hgt = h * (0.10 + amp) + hash(Math.floor(x / span) * 17 + li + s.seed) * h * amp;
      const px = x;
      ctx.lineTo(px, horizon - hgt);
      const mid = px + span * 0.5;
      const midH = hgt * (1.05 + hash(Math.floor(x / span) * 31 + li) * 0.5);
      ctx.lineTo(mid, horizon - midH);
      ctx.lineTo(px + span, horizon - hgt);
    }
    ctx.lineTo(w + 40, horizon + 40);
    ctx.closePath();
    ctx.fill();
  }
}

function drawClouds(ctx: CanvasRenderingContext2D, w: number, h: number, s: EnvState): void {
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (let i = 0; i < 6; i++) {
    const speed = 6 + i * 1.6;
    const span = w + 320;
    const x = ((s.t * speed + i * 347 + hash(i + s.seed) * 500) % span) - 160;
    const y = h * (0.08 + hash(i * 5 + s.seed) * 0.2);
    const sc = 0.7 + hash(i * 9) * 0.8;
    ctx.globalAlpha = 0.5 + hash(i * 11) * 0.3;
    ctx.beginPath();
    ctx.ellipse(x, y, 70 * sc, 22 * sc, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 45 * sc, y - 12 * sc, 48 * sc, 18 * sc, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 45 * sc, y - 8 * sc, 40 * sc, 15 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Distant birds drifting across the sky — simple flapping 'V' shapes. */
function drawBirds(ctx: CanvasRenderingContext2D, w: number, h: number, s: EnvState): void {
  for (let i = 0; i < 4; i++) {
    const speed = 16 + i * 4.5;
    const span = w + 180;
    const x = ((s.t * speed + i * 211 + hash(i + s.seed) * 700) % span) - 90;
    const y = h * (0.09 + hash(i * 7 + s.seed) * 0.16);
    const sc = 0.7 + hash(i * 3) * 0.8;
    const flap = Math.sin(s.t * (4.5 + i) * 2.4) * 3.2 * sc;
    ctx.strokeStyle = "rgba(35,35,40,0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 9 * sc, y + flap);
    ctx.quadraticCurveTo(x - 4 * sc, y - 3 * sc, x, y);
    ctx.quadraticCurveTo(x + 4 * sc, y - 3 * sc, x + 9 * sc, y + flap);
    ctx.stroke();
  }
}

/** Colourful Basant kites drifting on strings — a skyline favourite. */
function drawKites(ctx: CanvasRenderingContext2D, w: number, h: number, s: EnvState): void {
  const ids = ["village", "festival", "river", "desert"];
  if (!ids.includes(s.loc.id)) return;
  const colors = ["#ff5a5a", "#ffe45a", "#5aff8a", "#5ad2ff", "#ff9a5a", "#ff7ae0"];
  for (let i = 0; i < 3; i++) {
    const speed = 9 + i * 3;
    const span = w + 220;
    const x = ((s.t * speed + i * 173 + hash(i * 5 + s.seed) * 900) % span) - 110;
    const y = h * (0.11 + hash(i * 9 + s.seed) * 0.2);
    const sc = 0.8 + hash(i * 3) * 0.9;
    const sway = Math.sin(s.t * 1.7 + i * 2.4) * 6 * sc;
    const col = colors[Math.floor(hash(i * 7 + s.seed) * colors.length)];
    // string
    ctx.strokeStyle = "rgba(60,60,60,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + sway, y + 20 * sc);
    ctx.quadraticCurveTo(x + sway * 2.2 + 20, h * 0.6, x + sway * 3.2 + 46, h * 0.92);
    ctx.stroke();
    // diamond body
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x + sway, y - 16 * sc);
    ctx.lineTo(x + sway + 12 * sc, y);
    ctx.lineTo(x + sway, y + 16 * sc);
    ctx.lineTo(x + sway - 12 * sc, y);
    ctx.closePath();
    ctx.fill();
    // cross spars
    ctx.strokeStyle = "rgba(0,0,0,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + sway, y - 16 * sc);
    ctx.lineTo(x + sway, y + 16 * sc);
    ctx.moveTo(x + sway - 12 * sc, y);
    ctx.lineTo(x + sway + 12 * sc, y);
    ctx.stroke();
    // tail ribbon
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let t = 0; t < 5; t++) {
      const tx = x + sway + t * 5 * sc;
      const ty = y + 16 * sc + t * 7 * sc;
      if (t === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx + Math.sin(s.t * 3 + t * 1.3) * 2.2, ty);
    }
    ctx.stroke();
  }
}

function drawFields(ctx: CanvasRenderingContext2D, w: number, h: number, s: EnvState): void {
  const horizon = h * 0.66;
  const groundTop = horizon + h * 0.03;
  // ground base
  const g = ctx.createLinearGradient(0, groundTop, 0, h);
  g.addColorStop(0, s.loc.field);
  g.addColorStop(1, s.loc.fieldDark);
  ctx.fillStyle = g;
  ctx.fillRect(0, groundTop, w, h - groundTop);

  // crop rows (perspective lines)
  const span = 220;
  const off = (s.scroll * 0.5) % span;
  ctx.strokeStyle = s.loc.fieldDark;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 3;
  for (let x = -span - off; x < w + span; x += span) {
    ctx.beginPath();
    ctx.moveTo(x, groundTop + 6);
    ctx.lineTo(x + w * 0.25, h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawRoad(ctx: CanvasRenderingContext2D, w: number, h: number, s: EnvState): void {
  const horizon = h * 0.66;
  const roadY = horizon + h * 0.16;
  const halfW = w * 0.24;
  ctx.fillStyle = s.loc.road;
  ctx.beginPath();
  ctx.moveTo(w * 0.5 - w * 0.03, roadY);
  ctx.lineTo(w * 0.5 + w * 0.03, roadY);
  ctx.lineTo(w * 0.5 + halfW, h);
  ctx.lineTo(w * 0.5 - halfW, h);
  ctx.closePath();
  ctx.fill();

  // road texture / dust patches
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  for (let i = 0; i < 12; i++) {
    const t = hash(i + s.seed);
    const yy = roadY + (h - roadY) * (0.15 + t * 0.8);
    const widthAt = (w * 0.03 + (halfW - w * 0.03) * (yy - roadY) / (h - roadY)) * 2 * 0.5;
    const xx = w * 0.5 - widthAt / 2 + (hash(i * 3) - 0.5) * widthAt * 0.8;
    ctx.fillRect(xx, yy, widthAt * 0.25, Math.max(6, h * 0.012));
  }
}

function drawTrees(ctx: CanvasRenderingContext2D, w: number, h: number, s: EnvState): void {
  const horizon = h * 0.66;
  const span = 260;
  const off = (s.scroll * 0.55) % span;
  for (let x = -span - off; x < w + span; x += span) {
    const i = Math.round((x + off) / span);
    const r = hash(i * 23 + s.seed);
    if (r < 0.35) continue;
    const tx = x + hash(i * 5) * span * 0.6;
    const size = (0.8 + hash(i * 7) * 0.9) * h * 0.045;
    const ty = horizon + h * 0.1 + (hash(i * 11) - 0.5) * h * 0.06;
    // trunk
    ctx.fillStyle = "#5a4028";
    ctx.fillRect(tx - size * 0.08, ty - size * 0.4, size * 0.16, size * 0.55);
    // canopy
    ctx.fillStyle = s.loc.tree;
    ctx.beginPath();
    ctx.arc(tx, ty - size * 0.55, size * 0.55, 0, Math.PI * 2);
    ctx.arc(tx - size * 0.35, ty - size * 0.38, size * 0.38, 0, Math.PI * 2);
    ctx.arc(tx + size * 0.35, ty - size * 0.4, size * 0.38, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBuildings(ctx: CanvasRenderingContext2D, w: number, h: number, s: EnvState): void {
  const horizon = h * 0.66;
  const span = 400;
  const off = (s.scroll * 0.6) % span;
  for (let x = -span - off; x < w + span; x += span) {
    const i = Math.round((x + off) / span);
    const r = hash(i * 41 + s.seed);
    if (r < 0.45) continue;
    const bx = x + hash(i * 3) * span * 0.7;
    const bw = (0.7 + hash(i * 7) * 0.9) * h * 0.075;
    const bh = bw * (0.55 + hash(i * 13) * 0.4);
    const by = horizon + h * 0.12;

    ctx.fillStyle = s.loc.building;
    ctx.fillRect(bx - bw / 2, by - bh, bw, bh);

    if (s.loc.id === "brick") {
      // kiln dome
      ctx.fillStyle = s.loc.buildingRoof;
      ctx.beginPath();
      ctx.arc(bx, by - bh, bw * 0.6, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      for (let ly = 0; ly < 4; ly++) {
        ctx.beginPath();
        ctx.arc(bx, by - bh + ly * bh * 0.25, bw * 0.6, Math.PI, 0);
        ctx.stroke();
      }
    } else if (s.loc.id === "festival") {
      // tent
      ctx.fillStyle = s.loc.buildingRoof;
      ctx.beginPath();
      ctx.moveTo(bx - bw / 2, by - bh);
      ctx.lineTo(bx, by - bh - bw * 0.35);
      ctx.lineTo(bx + bw / 2, by - bh);
      ctx.closePath();
      ctx.fill();
    } else {
      // flat roof
      ctx.fillStyle = s.loc.buildingRoof;
      ctx.fillRect(bx - bw / 2 - bw * 0.06, by - bh - bh * 0.12, bw * 1.12, bh * 0.14);
    }

    // windows
    ctx.fillStyle = s.loc.stars ? "rgba(255,210,120,0.9)" : "rgba(40,30,20,0.55)";
    const cols = 2;
    const rows = 2;
    const ww = bw * 0.16;
    const wh = bh * 0.18;
    for (let c = 0; c < cols; c++) {
      for (let rr = 0; rr < rows; rr++) {
        const lit = s.loc.stars ? hash(i * 17 + c * 7 + rr) > 0.35 : true;
        if (lit) {
          ctx.fillRect(bx - bw * 0.25 + c * bw * 0.5, by - bh * 0.8 + rr * bh * 0.38, ww, wh);
        }
      }
    }
  }
}

function drawFestivalLights(ctx: CanvasRenderingContext2D, w: number, h: number, s: EnvState): void {
  if (s.loc.id !== "festival" && s.loc.id !== "night") return;
  const horizon = h * 0.66;
  const span = 340;
  const off = (s.scroll * 0.6) % span;
  for (let x = -span - off; x < w + span; x += span) {
    const i = Math.round((x + off) / span);
    if (hash(i * 29 + s.seed) < 0.4) continue;
    const px = x + hash(i * 3) * span * 0.8;
    const y = horizon + h * 0.08;
    const len = h * (0.09 + hash(i * 5) * 0.12);
    ctx.strokeStyle = "rgba(80,60,40,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.quadraticCurveTo(px + len * 0.4, y + len, px + len * 0.8, y + len * 0.6);
    ctx.stroke();
    // bulb
    const bx = px + len * 0.8;
    const by = y + len * 0.6;
    const colors = ["#ff5a5a", "#ffe45a", "#5aff8a", "#5ad2ff", "#ff9a5a", "#ff5ad2"];
    const col = colors[Math.floor(hash(i * 19) * colors.length)];
    const flicker = 0.5 + 0.5 * Math.abs(Math.sin(s.t * 3 + i * 2.3));
    ctx.globalAlpha = 0.5 + flicker * 0.5;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(bx, by, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(bx, by, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawFog(ctx: CanvasRenderingContext2D, w: number, h: number, s: EnvState): void {
  if (s.loc.fog <= 0) return;
  const g = ctx.createLinearGradient(0, h * 0.4, 0, h);
  g.addColorStop(0, "rgba(200,215,225,0)");
  g.addColorStop(0.6, `rgba(210,225,235,${s.loc.fog * 0.5})`);
  g.addColorStop(1, `rgba(210,225,235,${s.loc.fog})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, h * 0.4, w, h * 0.6);
}

function drawForeground(ctx: CanvasRenderingContext2D, w: number, h: number, s: EnvState): void {
  const horizon = h * 0.66;
  const y = h - h * 0.02;
  ctx.fillStyle = s.loc.fieldDark;

  if (s.loc.id === "desert") {
    // rolling dune silhouettes instead of bushes
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, y);
    const span = 300;
    const off = (s.scroll * 0.9) % span;
    for (let x = -span - off; x < w + span; x += span) {
      const i = Math.round((x + off) / span);
      const hgt = h * (0.03 + hash(i * 61 + s.seed) * 0.07);
      ctx.quadraticCurveTo(x + span * 0.5, y - hgt, x + span, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, y);
  const span = 180;
  const off = (s.scroll * 0.9) % span;
  for (let x = -span - off; x < w + span; x += span) {
    const i = Math.round((x + off) / span);
    const r = hash(i * 53 + s.seed);
    if (r < 0.4) continue;
    const bx = x + hash(i * 3) * span * 0.6;
    const bh = h * (0.02 + hash(i * 7) * 0.03);
    ctx.lineTo(bx, y - bh);
    ctx.lineTo(bx + span * 0.25, y - bh * 0.4);
  }
  ctx.lineTo(w, y);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  void horizon;
}

/** Twinkling light catching the salt flats — only in the SALT RANGE. */
function drawSaltTwinkle(ctx: CanvasRenderingContext2D, w: number, h: number, s: EnvState): void {
  if (s.loc.id !== "salt") return;
  for (let i = 0; i < 16; i++) {
    const x = hash(i * 71 + s.seed) * w;
    const y = h * (0.7 + hash(i * 13) * 0.26);
    const tw = 0.25 + 0.75 * Math.abs(Math.sin(s.t * 1.8 + i * 1.7));
    ctx.globalAlpha = tw * 0.9;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 1.1 + hash(i * 3) * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawEnvironment(ctx: CanvasRenderingContext2D, w: number, h: number, s: EnvState): void {
  drawSky(ctx, w, h, s);
  drawClouds(ctx, w, h, s);
  drawBirds(ctx, w, h, s);
  drawKites(ctx, w, h, s);
  drawMountains(ctx, w, h, s, s.loc.mountainFar, 0.06, 0.16, 0.05);
  drawMountains(ctx, w, h, s, s.loc.mountainNear, 0.16, 0.1, 0.04);
  drawFields(ctx, w, h, s);
  drawBuildings(ctx, w, h, s);
  drawTrees(ctx, w, h, s);
  drawRoad(ctx, w, h, s);
  drawFestivalLights(ctx, w, h, s);
  drawFog(ctx, w, h, s);
  drawForeground(ctx, w, h, s);
  drawSaltTwinkle(ctx, w, h, s);
  // ambient glow
  ctx.fillStyle = s.loc.glow;
  ctx.fillRect(0, 0, w, h);
}
