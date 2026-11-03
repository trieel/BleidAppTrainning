const TOKEN_KEY = "bleid_access_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function isTokenExpiringSoon(thresholdDays = 7): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const base64 = (token.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (!payload.exp) return false;
    const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
    return payload.exp * 1000 - Date.now() < thresholdMs;
  } catch {
    return false;
  }
}

export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  try {
    const base64 = (token.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      clearToken();
      return false;
    }
    return true;
  } catch {
    return true;
  }
}
