import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RECORD_LABELS } from "@/game/config";
import { useGame } from "@/game/GameContext";
import { clearToken, loadToken, pbkdf2Hex, randomHex, saveToken, sha256Hex } from "@/game/lb";
import { convexClient } from "@/lib/convex";
import { cn } from "@/lib/utils";
import { AnimatedNumber, CoinPill, GameButton, ScreenTitle } from "./ui";

type Tab = "online" | "local";

const ERROR_MESSAGES: Record<string, string> = {
  USERNAME_INVALID: "Username must be 3–20 characters: letters, numbers or underscore.",
  USERNAME_TAKEN: "That username is already taken. Try another.",
  NAME_INVALID: "Please enter a name (at least 2 characters).",
  PASSWORD_INVALID: "Password must be at least 6 characters.",
  NO_USER: "No account found with that username.",
  BAD_PASSWORD: "Wrong password. Try again.",
  NOT_LOGGED_IN: "Session expired — please sign in again.",
  NETWORK: "Can't reach the server. Check your connection.",
};

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  return ERROR_MESSAGES[msg] ?? ERROR_MESSAGES.NETWORK;
}

// --- Local (offline) records ------------------------------------------------

function formatRecord(key: string, n: number): string {
  if (key === "bestAccuracy") return `${Math.round(n)}%`;
  if (key === "bestAirTime") return `${n.toFixed(1)} s`;
  const unit = RECORD_LABELS.find((r) => r.key === key)?.unit ?? "";
  return `${Math.round(n).toLocaleString()}${unit}`;
}

function LocalRecords() {
  const { save } = useGame();
  const hs = save.highScores;
  return (
    <>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-white/55">
        PERSONAL RECORDS — stored on this device only.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {RECORD_LABELS.map((r, i) => (
          <motion.div
            key={r.key}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between rounded-3xl border border-white/12 bg-black/30 px-5 py-4 backdrop-blur-md"
          >
            <div className="flex items-center gap-3.5">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl font-arcade text-sm",
                  i === 0 ? "bg-amber-500/25 text-amber-300" : "bg-white/10 text-white/70",
                )}
              >
                {i + 1}
              </span>
              <span className="text-sm font-extrabold tracking-wide text-white">{r.label}</span>
            </div>
            <span className="font-arcade text-lg text-emerald-300">
              <AnimatedNumber value={hs[r.key] as number} duration={700} format={(n) => formatRecord(r.key, n)} />
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-white/12 bg-black/25 p-4 backdrop-blur-md">
        <div className="text-[10px] font-bold tracking-widest text-white/50">CAREER TOTALS</div>
        <div className="mt-2 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="font-arcade text-lg text-white">{hs.totalLaunches}</div>
            <div className="text-[9px] font-bold tracking-widest text-white/50">LAUNCHES</div>
          </div>
          <div>
            <div className="font-arcade text-lg text-white">{(hs.totalDistance ?? 0).toLocaleString()} m</div>
            <div className="text-[9px] font-bold tracking-widest text-white/50">TOTAL DISTANCE</div>
          </div>
          <div>
            <div className="font-arcade text-lg text-white">{(hs.totalScore ?? 0).toLocaleString()}</div>
            <div className="text-[9px] font-bold tracking-widest text-white/50">TOTAL POINTS</div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Auth modal -------------------------------------------------------------

type AuthMode = "signin" | "signup";

function AuthModal({
  mode,
  onClose,
  onSuccess,
}: {
  mode: AuthMode;
  onClose: () => void;
  onSuccess: (token: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = useMutation(api.leaderboard.signup);
  const login = useMutation(api.leaderboard.login);

  const submit = async () => {
    if (busy) return;
    if (!window.crypto?.subtle) {
      setError("Your browser does not support secure login. Try a modern browser.");
      return;
    }
    const uname = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(uname)) {
      setError(ERROR_MESSAGES.USERNAME_INVALID);
      return;
    }
    if (password.length < 6) {
      setError(ERROR_MESSAGES.PASSWORD_INVALID);
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      setError(ERROR_MESSAGES.NAME_INVALID);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = randomHex(32);
      const tokenHash = await sha256Hex(token);
      let result: { token: string; username: string; name: string };
      if (mode === "signup") {
        const salt = randomHex(16);
        const passHash = await pbkdf2Hex(password, salt);
        result = await signup({ username: uname, name: name.trim(), passHash, salt, token, tokenHash });
      } else {
        const saltRes = await convexClient!.query(api.leaderboard.getSalt, { username: uname });
        if (!saltRes) {
          setError(ERROR_MESSAGES.NO_USER);
          setBusy(false);
          return;
        }
        const passHash = await pbkdf2Hex(password, saltRes.salt);
        result = await login({ username: uname, passHash, token, tokenHash });
      }
      saveToken(result.token);
      onSuccess(result.token);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full select-text rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-sm font-bold text-white placeholder-white/40 outline-none focus:border-emerald-400/60";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#0b2414] p-6 shadow-2xl"
      >
        <h3 className="text-center font-arcade text-lg text-emerald-300">
          {mode === "signup" ? "CREATE ACCOUNT" : "SIGN IN"}
        </h3>
        <p className="mt-2 text-center text-[10px] leading-relaxed text-white/55">
          Only a username, password and display name — no email, no phone, no personal data.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-extrabold tracking-widest text-white/60">USERNAME</label>
            <input
              className={inputCls}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. wheel_king"
              autoCapitalize="none"
              autoComplete="username"
              spellCheck={false}
            />
          </div>
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-[10px] font-extrabold tracking-widest text-white/60">YOUR NAME</label>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Shown on the leaderboard"
                autoComplete="name"
                maxLength={30}
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-[10px] font-extrabold tracking-widest text-white/60">PASSWORD</label>
            <input
              className={inputCls}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-center text-[11px] font-bold text-red-200">
            {error}
          </div>
        )}

        <GameButton variant="gold" className="mt-5 w-full py-3" disabled={busy} onClick={submit}>
          {busy ? "PLEASE WAIT…" : mode === "signup" ? "CREATE & JOIN" : "SIGN IN"}
        </GameButton>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-2xl py-2 text-center text-xs font-extrabold tracking-widest text-white/60 hover:text-white"
        >
          CANCEL
        </button>
      </motion.div>
    </motion.div>
  );
}

// --- Online rankings --------------------------------------------------------

function OnlineLeaderboard() {
  const { save } = useGame();
  const hs = save.highScores;
  const [token, setToken] = useState<string | null>(() => loadToken());
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const top = useQuery(api.leaderboard.getTop, { limit: 50 });
  const me = useQuery(api.leaderboard.getMe, tokenHash ? { tokenHash } : "skip");
  const submit = useMutation(api.leaderboard.submitScore);
  const signoutM = useMutation(api.leaderboard.signout);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    sha256Hex(token)
      .then((h) => {
        if (alive) setTokenHash(h);
      })
      .catch(() => {
        if (alive) setTokenHash(null);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const submitArgs = () => ({
    bestScore: hs.bestScore,
    bestDistance: hs.bestDistance,
    bestHeight: hs.bestHeight,
    bestAccuracy: Math.round(hs.bestAccuracy),
    launches: hs.totalLaunches,
  });

  const syncBest = async () => {
    if (!tokenHash) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      await submit({ tokenHash, ...submitArgs() });
      setSyncMsg("Synced! Your best is now on the board.");
    } catch (e) {
      setSyncMsg(friendlyError(e));
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = async () => {
    if (tokenHash) {
      try {
        await signoutM({ tokenHash });
      } catch {
        /* ignore */
      }
    }
    clearToken();
    setToken(null);
    setTokenHash(null);
  };

  const handleAuthSuccess = async (token: string) => {
    setAuthMode(null);
    setToken(token);
    // Joining = show yourself on the board right away.
    try {
      const th = await sha256Hex(token);
      setTokenHash(th);
      if (th && hs.bestScore > 0) {
        await submit({ tokenHash: th, ...submitArgs() });
        setSyncMsg("Synced! Your best is now on the board.");
      }
    } catch {
      // The SYNC MY BEST button is the fallback.
    }
  };

  const loading = top === undefined || (tokenHash !== null && me === undefined);

  return (
    <>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-white/55">
        GLOBAL RANKINGS — view free, no account needed.
        <br />
        Create a username to join and see yourself on the board.
      </p>

      {/* player card */}
      <div className="mt-4 rounded-3xl border border-white/12 bg-black/30 p-4 backdrop-blur-md">
        {me ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/25 text-base">👤</span>
                <div>
                  <div className="text-sm font-extrabold text-white">{me.name}</div>
                  <div className="text-[10px] font-bold text-emerald-300/80">@{me.username}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-extrabold tracking-widest text-white/70 hover:bg-white/10"
              >
                SIGN OUT
              </button>
            </div>
            {me.rank && me.entry ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-amber-500/15 py-2.5">
                  <div className="font-arcade text-lg text-amber-300">#{me.rank}</div>
                  <div className="text-[9px] font-bold tracking-widest text-amber-200/70">YOUR RANK</div>
                </div>
                <div className="rounded-2xl bg-white/5 py-2.5">
                  <div className="font-arcade text-lg text-white">{me.entry.bestScore.toLocaleString()}</div>
                  <div className="text-[9px] font-bold tracking-widest text-white/50">BEST SCORE</div>
                </div>
                <div className="rounded-2xl bg-white/5 py-2.5">
                  <div className="font-arcade text-lg text-white">{me.entry.launches}</div>
                  <div className="text-[9px] font-bold tracking-widest text-white/50">LAUNCHES</div>
                </div>
              </div>
            ) : (
              <p className="text-center text-[11px] text-white/60">
                You're in! Launch and sync to claim your spot.
              </p>
            )}
            <GameButton variant="gold" className="py-2.5 text-sm" disabled={syncing || !tokenHash} onClick={syncBest}>
              {syncing ? "SYNCING…" : "⚡ SYNC MY BEST"}
            </GameButton>
            {syncMsg && <p className="text-center text-[10px] font-bold text-emerald-200/90">{syncMsg}</p>}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-3xl">🏆</span>
            <p className="text-sm font-extrabold text-white">JOIN THE LEADERBOARD</p>
            <p className="text-[11px] leading-relaxed text-white/55">
              Create a free username + password (no email, no phone) to submit your
              best score and see your rank against every player.
            </p>
            <div className="flex w-full gap-2.5">
              <GameButton variant="gold" className="flex-1 py-2.5 text-sm" onClick={() => setAuthMode("signup")}>
                CREATE ACCOUNT
              </GameButton>
              <GameButton variant="dark" className="flex-1 py-2.5 text-sm" onClick={() => setAuthMode("signin")}>
                SIGN IN
              </GameButton>
            </div>
          </div>
        )}
      </div>

      {/* top list */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="text-center text-[10px] font-bold tracking-[0.3em] text-white/50">TOP RIDERS</div>
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-black/25 p-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              className="mx-auto mb-2 h-6 w-6 rounded-full border-2 border-emerald-400 border-t-transparent"
            />
            <p className="text-[11px] font-bold tracking-widest text-white/60">LOADING RANKINGS…</p>
          </div>
        ) : !top || top.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-black/25 p-6 text-center">
            <p className="text-[11px] leading-relaxed text-white/55">
              No scores yet — be the first to spin, launch and climb the board!
            </p>
          </div>
        ) : (
          top.slice(0, 20).map((e, i) => {
            const isMe = me !== null && me !== undefined && me.username === e.username;
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <motion.div
                key={`${e.username}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(0.35, i * 0.035) }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md",
                  isMe
                    ? "border-emerald-300/60 bg-emerald-500/15 shadow-[0_0_24px_rgba(34,197,94,0.2)]"
                    : "border-white/10 bg-black/25",
                )}
              >
                <span className="w-9 shrink-0 text-center font-arcade text-sm text-white/70">
                  {medal ?? `#${e.rank}`}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-extrabold text-white">{e.name}</span>
                    {isMe && (
                      <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-[8px] font-extrabold tracking-widest text-emerald-200">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[10px] text-white/50">
                    @{e.username} · {e.bestDistance.toLocaleString()} m · {e.launches} launches
                  </div>
                </div>
                <span className="shrink-0 font-arcade text-base text-amber-300">{e.bestScore.toLocaleString()}</span>
              </motion.div>
            );
          })
        )}
      </div>
      {top && top.length > 20 && (
        <p className="mt-2 text-center text-[10px] text-white/40">Showing the top 20 — keep launching to climb.</p>
      )}

      <AnimatePresence>
        {authMode && (
          <AuthModal key={authMode} mode={authMode} onClose={() => setAuthMode(null)} onSuccess={handleAuthSuccess} />
        )}
      </AnimatePresence>
    </>
  );
}

// --- Screen -----------------------------------------------------------------

export function LeaderboardScreen() {
  const { save, go } = useGame();
  const [tab, setTab] = useState<Tab>("online");

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[radial-gradient(ellipse_at_top,#0f331d_0%,#06140b_60%)]">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-[calc(env(safe-area-inset-top)+0.9rem)]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => go("menu")}
            className="rounded-full border border-white/20 bg-black/35 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm hover:bg-black/55"
          >
            ← MENU
          </button>
          <ScreenTitle>LEADERBOARD</ScreenTitle>
          <CoinPill coins={save.player.coins} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-2xl border border-white/15 bg-black/30 p-1">
          {(["online", "local"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-xl py-2 text-[11px] font-extrabold tracking-widest transition-colors",
                tab === t ? "bg-emerald-600 text-white shadow" : "text-white/60 hover:bg-white/10",
              )}
            >
              {t === "online" ? "ONLINE" : "LOCAL"}
            </button>
          ))}
        </div>

        {tab === "online" ? (
          convexClient ? (
            <OnlineLeaderboard />
          ) : (
            <div className="mt-4 rounded-3xl border border-white/12 bg-black/30 p-6 text-center backdrop-blur-md">
              <span className="text-3xl">📡</span>
              <p className="mt-2 text-sm font-extrabold text-white">ONLINE RANKINGS UNAVAILABLE</p>
              <p className="mt-2 text-[11px] leading-relaxed text-white/55">
                The leaderboard service isn't reachable right now. Your game still works fully
                offline — check your connection and come back to join the board.
              </p>
            </div>
          )
        ) : (
          <LocalRecords />
        )}
      </div>
    </div>
  );
}
