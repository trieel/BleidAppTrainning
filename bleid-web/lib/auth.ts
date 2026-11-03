const TOKEN_KEY = "bleid_access_token";
const COOKIE_KEY = "bleid_token";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAgeDays = 90) {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 60 * 60;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

function removeCookie(name: string) {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

export function parseJwtPayload(token: string): { exp?: number; [key: string]: unknown } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) {
      base64 += "=".repeat(4 - pad);
    }
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  let token = window.localStorage.getItem(TOKEN_KEY);
  if (!token) {
    // Intentar recuperar de cookie (ej. iOS Safari sandbox o PWA recién agregada a pantalla de inicio)
    token = getCookie(COOKIE_KEY);
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
  }
  return token;
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token);
    setCookie(COOKIE_KEY, token, 90);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
    removeCookie(COOKIE_KEY);
  }
}

export function isTokenExpiringSoon(thresholdDays = 7): boolean {
  const token = getToken();
  if (!token) return false;
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return false;
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
  return payload.exp * 1000 - Date.now() < thresholdMs;
}

export function isAuthenticated(options: { allowGracePeriod?: boolean } = {}): boolean {
  const token = getToken();
  if (!token) return false;

  const payload = parseJwtPayload(token);
  if (!payload?.exp) return true;

  const isExpired = Date.now() >= payload.exp * 1000;
  if (!isExpired) return true;

  // Ventana de gracia de 30 días para renovación silenciosa en fondo
  const gracePeriodMs = 30 * 24 * 60 * 60 * 1000;
  const isWithinGrace = Date.now() - payload.exp * 1000 < gracePeriodMs;

  if (isWithinGrace) {
    return options.allowGracePeriod ?? true;
  }

  // Pasó el periodo de gracia: expirar definitivamente
  clearToken();
  return false;
}

