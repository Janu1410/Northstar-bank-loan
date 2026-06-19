import type { LoggedInAdmin } from "../types/admin";

const ADMIN_TOKEN_KEY = "northstar_admin_token";
const ADMIN_USER_KEY = "northstar_admin_user";

export function getStoredAdminToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getStoredAdminUser(): LoggedInAdmin | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LoggedInAdmin;
  } catch {
    return null;
  }
}

export function storeAdminSession(token: string, admin: LoggedInAdmin) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
}

export function storeAdminUser(admin: LoggedInAdmin) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_USER_KEY);
}
