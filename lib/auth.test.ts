import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAuth, getAuthToken, getAuthUser, isSessionExpired, saveAuth } from "./auth";

const tokenKey = "cryptocheck-token";
const userKey = "cryptocheck-user";

function jwtWithExpiry(exp: number) {
  const payload = window.btoa(JSON.stringify({ exp }));
  return `header.${payload}.signature`;
}

describe("browser auth storage", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
        clear: () => values.clear(),
      },
    });
    vi.useRealTimers();
  });

  it("persists a valid session and exposes its user", () => {
    const token = jwtWithExpiry(Math.floor(Date.now() / 1000) + 60);
    const user = { id: "user-1", username: "Satoshi", phone: "0900000000" };

    saveAuth(token, user);

    expect(getAuthToken()).toBe(token);
    expect(getAuthUser()).toEqual(user);
  });

  it("clears an expired token before returning it", () => {
    const onAuthChange = vi.fn();
    window.addEventListener("cryptocheck-auth-change", onAuthChange);
    saveAuth(jwtWithExpiry(Math.floor(Date.now() / 1000) - 1), { id: "user-1", username: "Satoshi" });
    onAuthChange.mockClear();

    expect(isSessionExpired(window.localStorage.getItem(tokenKey)!)).toBe(true);
    expect(getAuthToken()).toBeNull();
    expect(window.localStorage.getItem(tokenKey)).toBeNull();
    expect(window.localStorage.getItem(userKey)).toBeNull();
    expect(onAuthChange).toHaveBeenCalledTimes(1);

    window.removeEventListener("cryptocheck-auth-change", onAuthChange);
  });

  it("does not treat a malformed token as expired and keeps sign-out explicit", () => {
    const onAuthChange = vi.fn();
    window.addEventListener("cryptocheck-auth-change", onAuthChange);
    saveAuth("not-a-jwt", { id: "user-1", username: "Satoshi" });

    expect(isSessionExpired("not-a-jwt")).toBe(false);
    expect(getAuthToken()).toBe("not-a-jwt");

    clearAuth();
    expect(getAuthToken()).toBeNull();
    expect(onAuthChange).toHaveBeenCalledTimes(2);

    window.removeEventListener("cryptocheck-auth-change", onAuthChange);
  });

  it("clears an incomplete stored user instead of exposing a malformed session to the UI", () => {
    const token = jwtWithExpiry(Math.floor(Date.now() / 1000) + 60);
    window.localStorage.setItem(tokenKey, token);
    window.localStorage.setItem(userKey, JSON.stringify({ id: "user-1" }));

    expect(getAuthUser()).toBeNull();
    expect(window.localStorage.getItem(tokenKey)).toBeNull();
    expect(window.localStorage.getItem(userKey)).toBeNull();
  });
});
