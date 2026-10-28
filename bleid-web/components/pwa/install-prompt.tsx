"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Share, PlusSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "bleid_pwa_prompt_dismissed_until";
const COOLDOWN_DAYS = 7;

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (installed)
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (standaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 2. Check platform
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPhone|iPad|iPod/i.test(ua);
    setIsIOS(isIOSDevice);

    // 3. Check dismiss cooldown
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    const isDismissed = dismissedUntil && Date.now() < parseInt(dismissedUntil, 10);

    // 4. Listen for Chrome/Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissed) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // On iOS Safari, if not standalone and not dismissed, show banner after a brief delay
    if (isIOSDevice && !isDismissed) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    const cooldownMs = Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, cooldownMs.toString());
  };

  if (isStandalone || installed || !showBanner) {
    return (
      <>
        {showIOSModal && (
          <IOSInstallModal onClose={() => setShowIOSModal(false)} />
        )}
      </>
    );
  }

  return (
    <>
      {/* Floating Install Prompt Banner */}
      <aside
        aria-label="Instalación de la aplicación"
        className={cn(
          "fixed bottom-20 inset-x-4 z-50 mx-auto max-w-md lg:bottom-6 lg:right-6 lg:left-auto lg:max-w-sm",
          "animate-in fade-in slide-in-from-bottom-5 duration-300"
        )}
      >
        <div className="flex items-center gap-3.5 rounded-2xl border border-stone-800/90 bg-[#16120E]/95 p-3.5 text-[#FAF7F2] shadow-2xl backdrop-blur-xl">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-stone-700/60 bg-stone-900 shadow-md">
            <Image
              src="/icon-192x192.png"
              alt="Bleid Logo"
              width={44}
              height={44}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FAF7F2]">
                Instalar Bleid
              </h4>
              <span className="rounded bg-[#BB6C32]/20 px-1.5 py-0.2 text-[8px] font-mono font-bold uppercase text-[#BB6C32] border border-[#BB6C32]/30">
                PWA
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-tight text-stone-300 truncate">
              {isIOS
                ? "Accedé directo desde tu pantalla de inicio"
                : "Instalá la app para entrenar más rápido"}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#BB6C32] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#A35924] active:scale-95 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isIOS ? "Ver cómo" : "Instalar"}</span>
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Cerrar aviso"
              className="rounded-lg p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Safari Instructions Modal */}
      {showIOSModal && (
        <IOSInstallModal onClose={() => setShowIOSModal(false)} />
      )}
    </>
  );
}

export function IOSInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl border border-stone-800 bg-[#16120E] p-6 text-[#FAF7F2] shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800/80">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 overflow-hidden rounded-xl border border-stone-700 bg-stone-900">
              <Image
                src="/apple-touch-icon.png"
                alt="Bleid Logo"
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#FAF7F2]">
                Instalar Bleid en iPhone
              </h3>
              <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                Pantalla de Inicio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs text-stone-300">
          <div className="flex items-start gap-3.5 rounded-xl border border-stone-800/80 bg-stone-900/40 p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-stone-800 text-[11px] font-mono font-bold text-white">
              1
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                Tocá el botón Compartir
                <Share className="inline h-4 w-4 text-[#BB6C32]" />
              </p>
              <p className="text-[11px] text-stone-400">
                Se encuentra en la barra inferior de navegación en Safari.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-xl border border-stone-800/80 bg-stone-900/40 p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-stone-800 text-[11px] font-mono font-bold text-white">
              2
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                Elegí &ldquo;Agregar a inicio&rdquo;
                <PlusSquare className="inline h-4 w-4 text-[#BB6C32]" />
              </p>
              <p className="text-[11px] text-stone-400">
                Deslizá hacia abajo en el menú de opciones y seleccionalo.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-xl border border-stone-800/80 bg-stone-900/40 p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-stone-800 text-[11px] font-mono font-bold text-white">
              3
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-white">Tocá &ldquo;Agregar&rdquo;</p>
              <p className="text-[11px] text-stone-400">
                ¡Listo! Bleid se abrirá en pantalla completa como una app nativa.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#BB6C32] py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#A35924] active:scale-98 transition-all"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
