import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GAME_COUNTRY, GAME_TAGLINE, GAME_TITLE } from "@/game/config";
import { useGame } from "@/game/GameContext";

const MESSAGES = ["STARTING ENGINE...", "CHECKING GARAGE...", "PREPARING LAUNCH...", "READY TO LAUNCH"];

export function LoadingScreen() {
  const { go } = useGame();
  const [msg, setMsg] = useState(0);

  useEffect(() => {
    const timers = MESSAGES.map((_, i) => window.setTimeout(() => setMsg(i), i * 720));
    // Guaranteed transition — the player can never be stuck on this screen.
    const finish = window.setTimeout(() => go("menu"), 3550);
    const hardStop = window.setTimeout(() => go("menu"), 7000);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(finish);
      window.clearTimeout(hardStop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#123a1e_0%,#07180c_60%,#040d07_100%)]">
      {/* spinning wheel */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
        className="relative h-40 w-40 rounded-full"
        style={{
          background:
            "repeating-conic-gradient(#232329 0deg 24deg, #7d828c 24deg 36deg, #232329 36deg 60deg)",
          boxShadow: "0 0 60px rgba(34,197,94,0.25), inset 0 0 24px rgba(0,0,0,0.6)",
        }}
      >
        <div
          className="absolute inset-[26%] rounded-full"
          style={{ background: "repeating-conic-gradient(#565b66 0deg 45deg, #2b2e34 45deg 90deg)" }}
        />
        <div className="absolute inset-[46%] rounded-full bg-emerald-700 shadow-inner" />
        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30" />
      </motion.div>

      {/* title */}
      <div className="mt-10 px-6 text-center">
        <h1 className="font-arcade text-3xl leading-tight text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.6)] sm:text-4xl">
          {GAME_TITLE}
        </h1>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className="h-px w-10 bg-white/40" />
          <span className="font-arcade text-lg tracking-widest text-emerald-300">{GAME_COUNTRY}</span>
          <div className="h-px w-10 bg-white/40" />
        </div>
        <p className="mt-3 text-[11px] font-semibold tracking-[0.3em] text-white/60">{GAME_TAGLINE}</p>
      </div>

      {/* message + progress */}
      <div className="absolute bottom-[16%] flex w-full flex-col items-center px-8">
        <p key={msg} className="font-arcade text-xs tracking-widest text-emerald-200">
          {MESSAGES[msg]}
        </p>
        <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
            animate={{ width: ["8%", "100%"] }}
            transition={{ duration: 3.2, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}
