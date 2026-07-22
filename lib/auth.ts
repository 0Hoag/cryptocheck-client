export type AuthUser = { id: string; username: string; phone?: string; avatar_url?: string };

const TOKEN_KEY = "cryptocheck-token";
const USER_KEY = "cryptocheck-user";

type JwtPayload = { exp?: number };

function readJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalized)) as JwtPayload;
  } catch {
    return null;
  }
}

export function isSessionExpired(token: string) {
  if (typeof window === "undefined") return false;
  const expiresAt = readJwtPayload(token)?.exp;
  return typeof expiresAt === "number" && expiresAt * 1000 <= Date.now();
}

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (token && isSessionExpired(token)) {
    clearAuth();
    return null;
  }
  return token;
}
export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  if (!getAuthToken()) return null;
  try { return JSON.parse(window.localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
}
export function saveAuth(token: string, user: AuthUser) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("cryptocheck-auth-change"));
}
export function clearAuth() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("cryptocheck-auth-change"));
}
