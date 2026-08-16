// ---------------------------------------------------------------------------
// Leaderboard account helpers — client-side crypto + session storage.
//
// Passwords are PBKDF2-SHA256 hashed (salted, 100k iterations) on the device
// before anything is sent to the server. Only the hash is ever stored. The
// session is a random token kept in localStorage; the server only sees the
// SHA-256 of the token.
// ---------------------------------------------------------------------------

export const LB_TOKEN_KEY = "ewop.lb.token.v1";

export function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return toHex(buf);
}

export async function pbkdf2Hex(password: string, salt: string, iterations = 100_000): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(bits);
}

export function loadToken(): string | null {
  try {
    return window.localStorage.getItem(LB_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  try {
    window.localStorage.setItem(LB_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(LB_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
