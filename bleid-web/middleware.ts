import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return false;
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
    const payload = JSON.parse(json);
    if (!payload?.exp) return true;

    // Ventana de gracia de 30 días para renovación silenciosa
    const graceMs = 30 * 24 * 60 * 60 * 1000;
    return Date.now() < payload.exp * 1000 + graceMs;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("bleid_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthEntryPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register";

  // Si el usuario ya tiene sesión activa o en periodo de gracia y visita landing/login,
  // redirigir directamente al Dashboard de entrenamiento sin parpadeo.
  if (token && isAuthEntryPage && isTokenValid(token)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)).*)",
  ],
};
