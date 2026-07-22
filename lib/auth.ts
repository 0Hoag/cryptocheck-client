export type AuthUser = { id: string; username: string; phone?: string; avatar_url?: string };

const TOKEN_KEY = "cryptocheck-token";
const USER_KEY = "cryptocheck-user";

export function getAuthToken() { return typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY); }
export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
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
