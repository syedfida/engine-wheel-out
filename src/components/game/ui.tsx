// ---------------------------------------------------------------------------
// Shared game UI primitives: buttons, panels, pills, meters, animated numbers.
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ZONES } from "@/game/config";
import { useGame } from "@/game/GameContext";
import { audio } from "@/game/audio";
import { vibrate } from "@/game/haptics";
import { cn } from "@/lib/utils";

// --- Buttons ----------------------------------------------------------------

type ButtonVariant = "primary" | "gold" | "ghost" | "danger" | "dark";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 border border-emerald-400/40",
  gold: "bg-gradient-to-b from-amber-400 to-amber-600 text-amber-950 shadow-lg shadow-amber-950/40 hover:from-amber-300 hover:to-amber-500 border border-amber-200/50",
  ghost: "bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm",
  danger: "bg-red-600 text-white hover:bg-red-500 border border-red-400/40 shadow-lg shadow-red-950/40",
  dark: "bg-black/45 text-white border border-white/15 hover:bg-black/60 backdrop-blur-sm",
};

export function GameButton({
  children,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  variant = "primary",
  className,
  disabled,
  silent,
}: {
  children: ReactNode;
  onClick?: () => void;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerLeave?: () => void;
  variant?: ButtonVariant;
  className?: string;
  disabled?: boolean;
  silent?: boolean;
}) {
  const { save } = useGame();
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.08 }}
      disabled={disabled}
      onPointerDown={() => {
        if (disabled) return;
        onPointerDown?.();
      }}
      onPointerUp={() => {
        onPointerUp?.();
      }}
      onPointerLeave={() => {
        onPointerLeave?.();
      }}
      onClick={() => {
        if (disabled) return;
        if (!silent) {
          audio.sfx("click");
          vibrate("click", save.settings.vibration);
        }
        onClick?.();
      }}
      className={cn(
        "select-none rounded-2xl px-5 py-3.5 text-base font-extrabold tracking-wide transition-colors",
        "active:scale-[0.97] disabled:opacity-40 disabled:saturate-50",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

// --- Panels -----------------------------------------------------------------

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/15 bg-black/30 shadow-xl shadow-black/30 backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ScreenTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={cn("font-arcade text-xl leading-tight tracking-wide text-white drop-shadow", className)}>
      {children}
    </h1>
  );
}

// --- Pills ------------------------------------------------------------------

export function CoinPill({ coins, className }: { coins: number; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-500/15 px-3 py-1.5",
        className,
      )}
    >
      <span className="text-base leading-none">🪙</span>
      <span className="font-arcade text-sm text-amber-200 tabular-nums">{coins.toLocaleString()}</span>
    </div>
  );
}

export function LevelPill({ level, xpRatio }: { level: number; xpRatio: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 backdrop-blur-sm">
      <span className="font-arcade text-xs text-white">LV {level}</span>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-200 transition-[width] duration-500"
          style={{ width: `${Math.round(xpRatio * 100)}%` }}
        />
      </div>
    </div>
  );
}

// --- Animated number --------------------------------------------------------

export function AnimatedNumber({
  value,
  duration = 900,
  className,
  format,
}: {
  value: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = to;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{format ? format(display) : display.toLocaleString()}</span>;
}

// --- RPM zone meter ---------------------------------------------------------

const ZONE_WIDTHS = [30, 30, 25, 15]; // percentages

export function zoneLabel(rpm: number): string {
  const z = ZONES.find((z) => rpm >= z.min && rpm < z.max) ?? ZONES[3];
  return z.label;
}

export function zoneColor(rpm: number): string {
  const z = ZONES.find((z) => rpm >= z.min && rpm < z.max) ?? ZONES[3];
  return z.color;
}

export function ZoneMeter({ rpm, compact }: { rpm: number; compact?: boolean }) {
  const inOptimal = rpm >= 60 && rpm < 85;
  return (
    <div className="w-full">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-white/20 bg-black/45 backdrop-blur-sm",
          compact ? "h-6" : "h-9",
        )}
      >
        {/* zone segments */}
        <div className="absolute inset-0 flex">
          {ZONES.map((z, i) => (
            <div
              key={z.id}
              className="h-full border-r border-black/40 last:border-r-0"
              style={{
                width: `${ZONE_WIDTHS[i]}%`,
                background: `linear-gradient(to top, ${z.color}55, ${z.color}22)`,
              }}
            />
          ))}
        </div>
        {/* zone separators */}
        {[30, 60, 85].map((pct) => (
          <div key={pct} className="absolute top-0 h-full w-px bg-white/40" style={{ left: `${pct}%` }} />
        ))}
        {/* rpm fill */}
        <div
          className="absolute inset-y-0 left-0 bg-white/25 transition-[width] duration-100"
          style={{ width: `${Math.min(100, rpm)}%` }}
        />
        {/* needle */}
        <div
          className={cn(
            "absolute top-0 h-full w-[3px] rounded transition-[left] duration-100",
            inOptimal ? "bg-emerald-300 shadow-[0_0_8px_2px_rgba(110,231,183,0.9)]" : "bg-white",
          )}
          style={{ left: `calc(${Math.min(100, rpm)}% - 1px)` }}
        />
        {/* zone labels */}
        {!compact && (
          <div className="absolute inset-0 flex">
            {ZONES.map((z, i) => (
              <div
                key={z.id}
                className="flex items-center justify-center text-[9px] font-bold tracking-widest text-white/90"
                style={{ width: `${ZONE_WIDTHS[i]}%` }}
              >
                {z.label}
              </div>
            ))}
          </div>
        )}
      </div>
      {!compact && (
        <div className="mt-1.5 flex justify-between px-1 text-[9px] font-semibold tracking-wide text-white/70">
          <span>LOW 0–30%</span>
          <span>NORMAL 30–60%</span>
          <span>OPTIMAL 60–85%</span>
          <span>OD 85–100%</span>
        </div>
      )}
    </div>
  );
}

// --- Misc -------------------------------------------------------------------

export function StatChip({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/12 bg-black/30 px-2 py-2.5 backdrop-blur-sm">
      <span className="text-[9px] font-bold tracking-widest text-white/60">{label}</span>
      <span className={cn("font-arcade text-base leading-tight", accent ? "text-amber-300" : "text-white")}>
        {value}
      </span>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { save } = useGame();
  return (
    <div className="flex gap-1 rounded-2xl border border-white/15 bg-black/30 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => {
            audio.sfx("click");
            vibrate("click", save.settings.vibration);
            onChange(o.value);
          }}
          className={cn(
            "flex-1 rounded-xl px-3 py-2 text-xs font-bold tracking-wide transition-colors",
            value === o.value
              ? "bg-emerald-600 text-white shadow"
              : "text-white/60 hover:bg-white/10 hover:text-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  const { save } = useGame();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        audio.sfx("click");
        vibrate("click", save.settings.vibration);
        onChange(!on);
      }}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/30 px-4 py-3.5 text-left"
    >
      <span className="text-sm font-bold tracking-wide text-white">{label}</span>
      <span
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          on ? "bg-emerald-500" : "bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
            on ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
