import type { GoalType, LevelType, LimitationType, SeverityType } from "@/types";

export const goalLabels: Record<GoalType, string> = {
  GainMuscle: "Hipertrofia / Ganar músculo",
  LoseWeight: "Definición / Bajar grasa",
  Endurance: "Resistencia",
  Maintain: "Mantenimiento / Salud",
};

export const goalShortLabels: Record<GoalType, string> = {
  GainMuscle: "Hipertrofia",
  LoseWeight: "Definición",
  Endurance: "Resistencia",
  Maintain: "Mantenimiento",
};

export const levelLabels: Record<LevelType, string> = {
  Beginner: "Inicial / Principiante",
  Intermediate: "Intermedio",
  Advanced: "Avanzado",
};

export const limitationLabels: Record<LimitationType, string> = {
  Knee: "Rodilla",
  Lumbar: "Zona lumbar",
  Shoulder: "Hombro",
  Wrist: "Muñeca",
  Neck: "Cuello / Cervicales",
};

export const severityLabels: Record<SeverityType, string> = {
  Mild: "Leve",
  Moderate: "Moderada",
  Severe: "Severa",
};
