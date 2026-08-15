// ---------------------------------------------------------------------------
// Pooled particle system — mobile-friendly, no allocation per spawn.
// ---------------------------------------------------------------------------

export type ParticleKind = "dot" | "streak";

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  kind: ParticleKind;
  drag: number;
}

function makeParticle(): Particle {
  return {
    active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1,
    size: 2, color: "#fff", gravity: 0, kind: "dot", drag: 0,
  };
}

export class ParticleSystem {
  private pool: Particle[];
  private cursor = 0;
  max: number;

  constructor(max: number) {
    this.max = max;
    this.pool = Array.from({ length: max }, () => makeParticle());
  }

  setMax(max: number): void {
    if (max === this.max) return;
    this.max = Math.max(8, max);
    if (this.pool.length < this.max) {
      const extra = Array.from({ length: this.max - this.pool.length }, () => makeParticle());
      this.pool.push(...extra);
    }
  }

  clear(): void {
    for (const p of this.pool) p.active = false;
  }

  spawn(o: {
    x: number; y: number; vx?: number; vy?: number;
    life: number; size: number; color: string;
    gravity?: number; kind?: ParticleKind; drag?: number;
  }): void {
    let p: Particle | null = null;
    for (let i = 0; i < this.pool.length; i++) {
      const idx = (this.cursor + i) % this.pool.length;
      if (!this.pool[idx].active) {
        p = this.pool[idx];
        this.cursor = idx + 1;
        break;
      }
    }
    if (!p) return; // pool full — drop silently
    p.active = true;
    p.x = o.x; p.y = o.y;
    p.vx = o.vx ?? 0; p.vy = o.vy ?? 0;
    p.life = o.life; p.maxLife = o.life;
    p.size = o.size; p.color = o.color;
    p.gravity = o.gravity ?? 0;
    p.kind = o.kind ?? "dot";
    p.drag = o.drag ?? 0;
  }

  burst(o: {
    x: number; y: number; count: number;
    speed: number; life: number; size: number; color: string;
    gravity?: number; angle?: number; spread?: number; kind?: ParticleKind; drag?: number;
  }): void {
    const base = o.angle ?? -Math.PI / 2;
    const spread = o.spread ?? Math.PI * 2;
    for (let i = 0; i < o.count; i++) {
      const a = base + (Math.random() - 0.5) * spread;
      const v = o.speed * (0.4 + Math.random() * 0.6);
      this.spawn({
        x: o.x, y: o.y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: o.life * (0.5 + Math.random() * 0.5),
        size: o.size * (0.6 + Math.random() * 0.8),
        color: o.color, gravity: o.gravity, kind: o.kind, drag: o.drag,
      });
    }
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      if (p.drag > 0) {
        const d = Math.max(0, 1 - p.drag * dt);
        p.vx *= d;
        p.vy *= d;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      const t = p.life / p.maxLife;
      ctx.globalAlpha = Math.min(1, t * 1.4);
      ctx.fillStyle = p.color;
      if (p.kind === "streak") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, p.size * 0.4);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045);
        ctx.stroke();
      } else {
        const s = p.size * (0.5 + t * 0.5);
        ctx.beginPath();
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
