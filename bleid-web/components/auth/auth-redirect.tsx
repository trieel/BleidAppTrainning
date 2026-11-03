"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, setToken } from "@/lib/auth";

export function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      // Asegurar sincronización en cookie por si venía de localStorage aislado
      const token = getToken();
      if (token) {
        setToken(token);
      }
      router.replace("/dashboard");
    }
  }, [router]);

  return null;
}
