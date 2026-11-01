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
 * Diccionario de equipamiento en español para visualización compacta y modales.
 */
export const equipmentLabels: Record<string, string> = {
  Barbell: "Barra",
  Dumbbell: "Mancuerna",
  Machine: "Máquina",
  Cable: "Polea",
  Bodyweight: "Corporal",
};

/**
 * Traduce un valor de equipamiento al español.
 * 
 * @example
 * formatEquipment("Barbell") // "Barra"
 * formatEquipment("Dumbbell") // "Mancuerna"
 */
export function formatEquipment(equipment?: string | null): string {
  if (!equipment) return "";
  return equipmentLabels[equipment] || equipment;
}

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
 * Tabla de normalización tipográfica en español para ejercicios:
 * Corrige omisiones de la letra 'ñ' y faltas de tildes biomecánicas provenientes de bases de datos.
 */
const EXERCISE_TYPOGRAPHY_RULES: [RegExp, string][] = [
  [/\bCurl arana\b/gi, "Curl araña"],
  [/\bJalon\b/gi, "Jalón"],
  [/\bExtension\b/gi, "Extensión"],
  [/\bHiperextension\b/gi, "Hiperextensión"],
  [/\bHiperextensiones\b/gi, "Hiperextensiones"],
  [/\bElevacion\b/gi, "Elevación"],
  [/\bElevaciones\b/gi, "Elevaciones"],
  [/\bContraccion\b/gi, "Contracción"],
  [/\bAbduccion\b/gi, "Abducción"],
  [/\bbiceps\b/gi, "bíceps"],
  [/\btriceps\b/gi, "tríceps"],
  [/\bcuadriceps\b/gi, "cuadríceps"],
  [/\bmaquina\b/gi, "máquina"],
  [/\bRompecraneos\b/gi, "Rompecráneos"],
  [/\bbulgara\b/gi, "búlgara"],
  [/\bcajon\b/gi, "cajón"],
  [/\batras\b/gi, "atrás"],
  [/\bEliptico\b/gi, "Elíptico"],
  [/\bergometro\b/gi, "ergómetro"],
  [/\bmenton\b/gi, "mentón"],
  [/\brotacion\b/gi, "rotación"],
  [/\bdeficit\b/gi, "déficit"],
  [/\bconcentracion\b/gi, "concentración"],
];

/**
 * Normaliza nombres de ejercicios garantizando ortografía y acentuación en español
 * (ej. "Curl arana" -> "Curl araña", "Jalon" -> "Jalón", "biceps" -> "bíceps").
 * 
 * @param name Nombre original del ejercicio
 * @returns Nombre formateado y tipográficamente correcto
 */
export function formatExerciseName(name: string): string {
  if (!name) return "";
  let result = name;
  for (const [regex, replacement] of EXERCISE_TYPOGRAPHY_RULES) {
    result = result.replace(regex, replacement);
  }
  return result;
}
