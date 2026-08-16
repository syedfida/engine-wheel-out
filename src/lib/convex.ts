// Convex client for the online leaderboard. Created lazily and only when a
// deployment URL is configured — the game itself stays fully playable offline.
import { ConvexReactClient } from "convex/react";

const url = (import.meta.env.VITE_CONVEX_URL as string | undefined)?.trim();

export const convexClient: ConvexReactClient | null = url ? new ConvexReactClient(url) : null;
