// ---------------------------------------------------------------------------
// ENGINE WHEEL OUT PAKISTAN — online leaderboard backend.
//
// Accounts use ONLY username + password + display name (no email, no phone).
// Passwords never travel in plaintext: the client hashes with PBKDF2-SHA256
// (salted, 100k iterations) and only the hash is stored here. Sessions are a
// random client token; only its SHA-256 hash is persisted.
// ---------------------------------------------------------------------------
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function validUsername(raw: string): string | null {
  const u = raw.trim().toLowerCase();
  return USERNAME_RE.test(u) ? u : null;
}

export const signup = mutation({
  args: {
    username: v.string(),
    name: v.string(),
    passHash: v.string(),
    salt: v.string(),
    token: v.string(),
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    const username = validUsername(args.username);
    if (!username) throw new Error("USERNAME_INVALID");
    const name = args.name.trim().slice(0, 30);
    if (name.length < 2) throw new Error("NAME_INVALID");
    if (args.passHash.length < 40 || args.passHash.length > 256) throw new Error("PASSWORD_INVALID");
    if (args.token.length < 32 || args.tokenHash.length < 32) throw new Error("TOKEN_INVALID");

    const existing = await ctx.db
      .query("leaderboardUsers")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    if (existing) throw new Error("USERNAME_TAKEN");

    const id = await ctx.db.insert("leaderboardUsers", {
      username,
      name,
      passHash: args.passHash,
      salt: args.salt,
      tokenHash: args.tokenHash,
      createdAt: Date.now(),
    });
    await ctx.db.insert("leaderboardScores", {
      userId: id,
      username,
      name,
      bestScore: 0,
      bestDistance: 0,
      bestHeight: 0,
      bestAccuracy: 0,
      launches: 0,
      updatedAt: Date.now(),
    });
    return { token: args.token, username, name };
  },
});

/** Public salt lookup so a client can re-derive the PBKDF2 hash for login.
 *  Salt is not secret — it is only used to make the hash unique per user. */
export const getSalt = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase();
    const user = await ctx.db
      .query("leaderboardUsers")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    return user ? { salt: user.salt } : null;
  },
});

export const login = mutation({
  args: {
    username: v.string(),
    passHash: v.string(),
    token: v.string(),
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase();
    const user = await ctx.db
      .query("leaderboardUsers")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    if (!user) throw new Error("NO_USER");
    if (user.passHash !== args.passHash) throw new Error("BAD_PASSWORD");
    if (args.token.length < 32 || args.tokenHash.length < 32) throw new Error("TOKEN_INVALID");
    await ctx.db.patch(user._id, { tokenHash: args.tokenHash });
    return { token: args.token, username: user.username, name: user.name };
  },
});

export const signout = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("leaderboardUsers")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .first();
    if (user) await ctx.db.patch(user._id, { tokenHash: undefined });
  },
});

/** Submit local bests; keeps the highest values per user. */
export const submitScore = mutation({
  args: {
    tokenHash: v.string(),
    bestScore: v.number(),
    bestDistance: v.number(),
    bestHeight: v.number(),
    bestAccuracy: v.number(),
    launches: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("leaderboardUsers")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .first();
    if (!user) throw new Error("NOT_LOGGED_IN");

    const existing = await ctx.db
      .query("leaderboardScores")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    const next = {
      userId: user._id,
      username: user.username,
      name: user.name,
      bestScore: Math.max(existing?.bestScore ?? 0, Math.round(args.bestScore)),
      bestDistance: Math.max(existing?.bestDistance ?? 0, Math.round(args.bestDistance)),
      bestHeight: Math.max(existing?.bestHeight ?? 0, Math.round(args.bestHeight)),
      bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, Math.round(args.bestAccuracy)),
      launches: Math.max(existing?.launches ?? 0, Math.round(args.launches)),
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, next);
    } else {
      await ctx.db.insert("leaderboardScores", next);
    }
    return { submitted: true };
  },
});

/** Top leaderboard — public, no login required to view. */
export const getTop = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(100, Math.max(1, args.limit ?? 50));
    const entries = await ctx.db
      .query("leaderboardScores")
      .withIndex("by_score")
      .order("desc")
      .take(limit);
    return entries
      .filter((e) => e.bestScore > 0)
      .map((e, i) => ({
        rank: i + 1,
        username: e.username,
        name: e.name,
        bestScore: e.bestScore,
        bestDistance: e.bestDistance,
        bestHeight: e.bestHeight,
        bestAccuracy: e.bestAccuracy,
        launches: e.launches,
      }));
  },
});

/** Current logged-in player's entry + exact rank. Returns null when not logged in. */
export const getMe = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("leaderboardUsers")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .first();
    if (!user) return null;

    const entry = await ctx.db
      .query("leaderboardScores")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!entry || entry.bestScore <= 0) {
      return { username: user.username, name: user.name, entry: null, rank: null };
    }

    const higherRows = await ctx.db
      .query("leaderboardScores")
      .withIndex("by_score")
      .filter((q) => q.gt(q.field("bestScore"), entry.bestScore))
      .collect();

    return {
      username: user.username,
      name: user.name,
      entry: {
        bestScore: entry.bestScore,
        bestDistance: entry.bestDistance,
        bestHeight: entry.bestHeight,
        bestAccuracy: entry.bestAccuracy,
        launches: entry.launches,
      },
      rank: higherRows.length + 1,
    };
  },
});
