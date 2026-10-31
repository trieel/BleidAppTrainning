import type { GoalType, LevelType, LimitationType, SeverityType } from "@/types";

/**
 * Diccionario de objetivos principales del atleta.
 * Etiquetas extendidas para el onboarding y perfiles.
 */
export const goalLabels: Record<GoalType, string> = {
  GainMuscle: "Hipertrofia / Ganar músculo",
  LoseWeight: "Definición / Bajar grasa",
  Endurance: "Resistencia",
  Maintain: "Mantenimiento / Salud",
};

/**
 * Diccionario de objetivos en formato corto para tarjetas compactas y visualizaciones móviles.
 */
export const goalShortLabels: Record<GoalType, string> = {
  GainMuscle: "Hipertrofia",
  LoseWeight: "Definición",
  Endurance: "Resistencia",
  Maintain: "Mantenimiento",
};

/**
 * Diccionario de niveles de experiencia atlética.
 */
export const levelLabels: Record<LevelType, string> = {
  Beginner: "Inicial / Principiante",
  Intermediate: "Intermedio",
  Advanced: "Avanzado",
};

/**
 * Diccionario de limitaciones articulares por tipo oficial.
 */
export const limitationLabels: Record<LimitationType, string> = {
  Knee: "Rodilla",
  Lumbar: "Zona lumbar",
  Shoulder: "Hombro",
  Wrist: "Muñeca",
  Neck: "Cuello / Cervicales",
};

/**
 * Mapa exhaustivo de normalización de contraindicaciones articulares.
 * Soporta claves enviadas por la API tanto en PascalCase, lowercase como snake_case
 * para garantizar que nunca aparezcan términos en inglés (ej. "wrist", "lower_back") en la UI.
 */
export const contraindicationMap: Record<string, string> = {
  wrist: "Muñeca",
  Wrist: "Muñeca",
  lower_back: "Espalda baja",
  lowerback: "Espalda baja",
  lumbar: "Espalda baja",
  Lumbar: "Espalda baja",
  knee: "Rodilla",
  Knee: "Rodilla",
  shoulder: "Hombro",
  Shoulder: "Hombro",
  neck: "Cuello / Cervicales",
  Neck: "Cuello / Cervicales",
  cervical: "Cuello / Cervicales",
  elbow: "Codo",
  Elbow: "Codo",
};

/**
 * Diccionario de niveles de severidad articular.
 */
export const severityLabels: Record<SeverityType, string> = {
  Mild: "Leve",
  Moderate: "Moderada",
  Severe: "Severa",
};

/**
 * Traduce y formatea un array de contraindicaciones articulares a una cadena legible en español.
 * 
 * @example
 * formatContraindications(["wrist", "lower_back"]) // "Muñeca, Espalda baja"
 * formatContraindications(["Knee"]) // "Rodilla"
 */
export function formatContraindications(items?: string[] | null): string {
  if (!items || items.length === 0) return "";
  return items
    .map((item) => {
      const trimmed = item.trim();
      return contraindicationMap[trimmed] || contraindicationMap[trimmed.toLowerCase()] || trimmed;
    })
    .join(", ");
}

/**
 * Normaliza nombres de ejercicios garantizando ortografía correcta en español,
 * en particular corrigiendo caracteres como la 'ñ' omitida en bases de datos o semillas
 * (ej. "Curl arana" -> "Curl araña").
 * 
 * @param name Nombre original del ejercicio
 * @returns Nombre corregido y tipográficamente formateado
 */
export function formatExerciseName(name: string): string {
  if (!name) return "";
  return name.replace(/\bCurl arana\b/gi, "Curl araña");
}
