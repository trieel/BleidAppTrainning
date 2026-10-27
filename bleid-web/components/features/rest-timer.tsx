"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, FastForward, Plus, RotateCcw, Volume2, VolumeX, X } from "lucide-react";

interface RestTimerProps {
  initialSeconds: number;
  exerciseName?: string;
  onFinish?: () => void;
  onClose: () => void;
}

function playSynthesizedBeep(freq = 440, type: OscillatorType = "sine", duration = 0.12) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio context may be restricted by platform
  }
}

export function RestTimer({ initialSeconds, exerciseName, onFinish, onClose }: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [isDone, setIsDone] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastPlayedSecond = useRef<number | null>(null);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setTotalSeconds(initialSeconds);
    setIsDone(false);
    lastPlayedSecond.current = null;
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!isDone) {
        setIsDone(true);
        if (soundEnabled) {
          playSynthesizedBeep(880, "triangle", 0.4);
          setTimeout(() => playSynthesizedBeep(1100, "sine", 0.3), 150);
        }
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.([150, 100, 150]);
        }
        onFinish?.();
      }
      return;
    }

    // Audio cue for last 3 seconds
    if (soundEnabled && secondsLeft <= 3 && lastPlayedSecond.current !== secondsLeft) {
      lastPlayedSecond.current = secondsLeft;
      playSynthesizedBeep(520, "sine", 0.12);
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, isDone, onFinish, soundEnabled]);

  function addSeconds(amount: number) {
    setSecondsLeft((prev) => {
      const next = Math.max(prev + amount, 0);
      if (next > totalSeconds) setTotalSeconds(next);
      return next;
    });
    setIsDone(false);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  
  // SVG Circle Progress calculation (radius = 20)
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <aside
      aria-label="Temporizador de descanso"
      className={`fixed bottom-24 sm:bottom-6 left-4 right-4 z-50 mx-auto max-w-md overflow-hidden rounded-2xl border transition-all duration-300 ${
        isDone
          ? "border-[#3E6B48]/50 bg-[#3E6B48] text-white shadow-soft-lg backdrop-blur-xl animate-pulse"
          : "border-border bg-card/95 text-foreground shadow-soft-lg backdrop-blur-xl"
      }`}
    >
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3">
          {/* Circular SVG Progress Ring */}
          <div className="relative grid h-12 w-12 shrink-0 place-items-center">
            <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 48 48">
              {/* Background Track */}
              <circle
                cx="24"
                cy="24"
                r={radius}
                className={isDone ? "stroke-white/20" : "stroke-muted"}
                strokeWidth="3.5"
                fill="none"
              />
              {/* Active Ring */}
              <circle
                cx="24"
                cy="24"
                r={radius}
                className={`transition-all duration-1000 ease-linear ${
                  isDone ? "stroke-white" : "stroke-primary"
                }`}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="absolute inset-0 grid place-items-center rounded-full text-foreground hover:scale-105 active:scale-95 transition"
              title={soundEnabled ? "Silenciar" : "Activar audio"}
            >
              {isDone ? (
                <Bell className="h-4 w-4 text-white animate-spin" />
              ) : soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5 text-primary" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDone ? "text-white" : "text-primary"}`}>
                {isDone ? "¡Tiempo Cumplido!" : "Descanso Activo"}
              </span>
              {exerciseName && (
                <span className={`text-[10px] truncate max-w-[120px] font-mono ${isDone ? "text-white/80" : "text-muted-foreground"}`}>
                  · {exerciseName}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold tracking-tight">{timeFormatted}</span>
              <span className={`text-[10px] font-mono ${isDone ? "text-white/80" : "text-muted-foreground"}`}>
                {isDone ? "Siguiente serie" : `de ${totalSeconds}s`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!isDone && (
            <>
              <button
                type="button"
                onClick={() => addSeconds(30)}
                className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-mono font-bold text-foreground hover:bg-muted active:scale-[0.98] transition shadow-soft"
                title="Agregar 30 segundos"
              >
                <Plus className="h-3 w-3 text-primary" /> 30s
              </button>
              <button
                type="button"
                onClick={() => setSecondsLeft(0)}
                className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-mono font-bold text-primary-foreground shadow-soft hover:bg-primary/90 active:scale-[0.98] transition"
                title="Saltar descanso"
              >
                <FastForward className="h-3 w-3 fill-current" /> Listo
              </button>
            </>
          )}

          {isDone && (
            <button
              type="button"
              onClick={() => {
                setSecondsLeft(60);
                setTotalSeconds(60);
                setIsDone(false);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-mono font-bold text-white hover:bg-white/30 active:scale-[0.98] transition shadow-soft"
            >
              <RotateCcw className="h-3 w-3" /> +1 min
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`grid h-8 w-8 place-items-center rounded-lg transition ml-1 ${
              isDone ? "text-white/80 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title="Cerrar temporizador"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
