"use client";

import { useMemo } from "react";
import Fuse from "fuse.js";
import type { Exercise } from "@/types";
import { exerciseEnglishNames, getExerciseName, type AppLanguage } from "./exercise-i18n";
import { formatEquipment } from "./labels";

/**
 * Normaliza una cadena eliminando tildes, diacríticos y espacios sobrantes.
 * @example
 * normalizeSearchText("Jalón al pecho") // "jalon al pecho"
 * normalizeSearchText("Bíceps") // "biceps"
 */
export function normalizeSearchText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Diccionario de fallback con alias multilingües y jergas para los ~77 ejercicios.
 * Garantiza resiliencia total incluso si la API aún no retornó la columna de alias.
 */
export const EXERCISE_FALLBACK_ALIASES: Record<string, string[]> = {
  // Pecho
  "Press plano con barra": ["bench press", "barbell bench press", "press banca", "banca plana", "pecho plano", "pecho"],
  "Press plano con mancuernas": ["dumbbell bench press", "db bench press", "press banca con mancuernas", "pecho plano mancuernas"],
  "Press inclinado con mancuernas": ["incline dumbbell press", "incline db press", "press inclinado", "pecho alto"],
  "Press inclinado en máquina Smith": ["smith machine incline press", "incline smith press", "press inclinado smith"],
  "Press de pecho en máquina": ["chest press machine", "machine chest press", "press maquina pecho", "maquina pecho"],
  "Cruces en polea para pecho": ["cable crossover", "cable flyes", "cruce de cables", "cruces en poleas para pecho", "cruces polea"],
  "Aperturas con mancuernas": ["dumbbell flyes", "db flyes", "aperturas", "aperturas de pecho"],
  "Peck Deck": ["pec deck", "peck deck", "machine fly", "contractora de pecho", "mariposa", "aperturas en maquina"],
  "Flexiones de brazos": ["push ups", "pushups", "lagartijas", "flexiones de pecho", "flexiones"],
  "Fondos en paralelas (pecho)": ["chest dips", "dips", "fondos en paralelas", "paralelas"],
  "Pullover con mancuerna": ["dumbbell pullover", "pullover", "db pullover"],

  // Espalda
  "Peso muerto convencional": ["deadlift", "conventional deadlift", "peso muerto", "pmo"],
  "Dominadas libres (peso corporal)": ["pull ups", "pullups", "chin ups", "dominadas", "traccion vertical"],
  "Dominadas asistidas": ["assisted pull ups", "assisted chin ups", "dominadas en maquina"],
  "Jalón al pecho en polea": ["lat pulldown", "pulldown", "jalon al pecho", "dorsalera", "jalon"],
  "Jalón al pecho agarre supino": ["reverse grip lat pulldown", "underhand pulldown", "jalon supino"],
  "Remo en polea baja (Remo Gironda)": ["gironda row", "close grip cable row", "remo gironda", "remo sentado en cable", "remo polea baja"],
  "Remo con barra": ["barbell row", "bent over row", "remo barra"],
  "Remo con mancuerna a una mano (serrucho)": ["serrucho", "one arm dumbbell row", "single arm db row", "remo mancuerna"],
  "Remo con apoyo de pecho": ["chest supported row", "machine row", "remo con apoyo"],
  "Remo en barra T": ["t bar row", "t-bar row", "remo t"],
  "Pullover en polea alta con soga": ["cable pullover", "straight arm pulldown", "overhead cable pullover", "pullover polea", "jalon con brazos rectos"],
  "Face pull en polea alta": ["face pull", "cable face pull", "face pulls", "face pull con rotacion externa"],
  "Hiperextensión lumbar": ["back extension", "hyperextensions", "hiperextensiones", "lumbares"],

  // Cuadriceps
  "Sentadilla trasera": ["back squat", "barbell squat", "sentadilla con barra", "sentadillas"],
  "Sentadilla en máquina Smith": ["smith machine squat", "smith squat", "sentadilla smith"],
  "Sentadilla frontal": ["front squat", "barbell front squat", "sentadilla delantera"],
  "Sentadilla Hack": ["hack squat", "sentadilla hack"],
  "Prensa a 45°": ["45 degree leg press", "incline leg press", "prensa a 45 grados", "prensa de piernas", "prensa"],
  "Prensa horizontal": ["horizontal leg press", "seated leg press", "prensa horizontal"],
  "Sillón de cuadríceps": ["leg extension", "leg extensions", "extension de piernas", "sillon de cuadriceps", "contraccion de cuadriceps"],
  "Sentadilla búlgara": ["bulgarian split squat", "bulgaras", "sentadilla bulgara"],
  "Sentadilla goblet": ["goblet squat", "dumbbell goblet squat", "sentadilla copa"],
  "Subidas al cajón": ["step ups", "box step ups", "subidas al cajon", "subida al cajon"],
  "Estocadas hacia atrás con mancuernas": ["reverse lunges", "dumbbell reverse lunge", "estocadas atras", "zancada hacia atras", "zancadas"],
  "Estocadas caminando con mancuernas": ["walking lunges", "dumbbell walking lunges", "estocadas caminando", "zancadas caminando"],
  "Sentadilla sissy": ["sissy squat", "sentadilla sissy"],
  "Sentadilla con cinturón (Belt Squat)": ["belt squat", "sentadilla con cinturon"],
  "Sentadilla cosaca": ["cossack squat", "sentadilla cosaca"],

  // Gluteos
  "Hip thrust con barra": ["hip thrust", "barbell hip thrust", "puente de gluteo con barra", "empuje de cadera"],
  "Hip thrust en máquina": ["machine hip thrust", "hip thrust machine", "hip thrust en maquina"],
  "Puente de glúteos en colchoneta": ["glute bridge", "puente de gluteos", "puente de gluteo", "puente a una pierna"],
  "Patada de glúteos en polea": ["cable glute kickback", "glute kickback", "patada de burro", "patada de gluteo"],
  "Abducción de cadera en máquina": ["seated hip abduction", "hip abductor machine", "abductores"],
  "Hiperextensiones a 45° para glúteo": ["45 degree glute hyperextension", "hiperextension gluteo"],
  "Swing con kettlebell": ["kettlebell swing", "kb swing", "swing"],
  "Peso muerto sumo con mancuerna": ["dumbbell sumo deadlift", "sumo deadlift db"],
  "Step up cruzado en banco": ["crossover step up", "step up cruzado"],

  // Isquiotibiales (Femoral)
  "Camilla femoral": ["lying leg curl", "lying hamstring curl", "camilla femoral", "curl femoral acostado", "camilla femoral acostado"],
  "Sillón femoral": ["seated leg curl", "seated hamstring curl", "sillon de isquiotibiales", "curl femoral sentado", "sillon femoral", "curl femoral de pie"],
  "Peso muerto rumano con barra": ["romanian deadlift", "rdl", "barbell rdl", "peso muerto rumano"],
  "Peso muerto rumano con mancuernas": ["dumbbell rdl", "rdl", "db romanian deadlift", "rdl mancuernas"],
  "Peso muerto rumano a una pierna": ["single leg rdl", "rdl", "peso muerto a una pierna", "rdl unilateral"],
  "Curl nórdico": ["nordic curl", "nordic hamstring curl", "curl nordico"],
  "Buenos días con barra": ["good mornings", "good morning", "buenos dias"],

  // Pantorrillas
  "Gemelos de pie en máquina": ["standing calf raise", "calf raises", "gemelos de pie", "pantorrillas de pie", "elevacion de pantorrillas"],
  "Gemelos sentado en máquina (sóleo)": ["seated calf raise", "soleus raise", "soleo", "gemelos sentado"],
  "Gemelos en prensa": ["leg press calf raise", "talones en prensa", "elevacion de talones en prensa"],
  "Gemelos a una pierna con peso corporal": ["single leg calf raise", "talones a una pierna"],

  // Hombros
  "Press militar con barra": ["overhead press", "ohp", "barbell military press", "press militar"],
  "Press de hombros con mancuernas sentado": ["seated dumbbell shoulder press", "db shoulder press", "press de hombros", "press militar sentado con mancuernas"],
  "Press militar en máquina Smith": ["smith machine shoulder press", "smith ohp", "press hombros smith"],
  "Press Arnold": ["arnold press", "dumbbell arnold press", "press arnold"],
  "Vuelos laterales con mancuernas": ["dumbbell lateral raise", "lateral raises", "vuelos laterales", "elevaciones laterales"],
  "Vuelos laterales en polea": ["cable lateral raise", "side lateral cable", "vuelos en polea", "elevacion lateral en cable"],
  "Vuelos posteriores (pájaros)": ["rear delt fly", "rear delt flyes", "pajaros", "vuelos posteriores", "vuelo posterior"],
  "Vuelos frontales con mancuernas": ["front raise", "dumbbell front raise", "elevacion frontal", "vuelos frontales"],
  "Remo al mentón con barra": ["upright row", "barbell upright row", "remo al menton"],
  "Vuelos laterales en banco inclinado": ["incline lateral raise", "vuelos en banco inclinado"],
  "Y-Raises en banco inclinado": ["y raises", "y-raises", "elevaciones en y"],

  // Biceps
  "Curl con mancuernas": ["dumbbell curl", "db bicep curl", "curl de biceps con mancuernas", "curl mancuernas", "curl de concentracion", "curl de concentración", "curl concentrado"],
  "Curl Scott con barra": ["preacher curl", "scott curl", "banco scott", "curl predicador", "curl scott en banco"],
  "Curl Scott con mancuernas": ["dumbbell preacher curl", "curl predicadora", "curl scott mancuernas"],
  "Curl de bíceps en polea": ["cable bicep curl", "cable curl", "curl en polea", "curl de bíceps en cable", "curl de biceps en cable"],
  "Curl de bíceps con barra": ["barbell curl", "barbell bicep curl", "curl de biceps con barra", "curl barra"],
  "Curl martillo": ["hammer curl", "dumbbell hammer curl", "curl martillo"],
  "Curl martillo en polea con soga": ["cable hammer curl", "rope hammer curl", "curl martillo polea con soga"],
  "Curl inclinado con mancuernas": ["incline dumbbell curl", "incline curl", "curl inclinado", "biceps cabeza larga"],
  "Curl araña en banco inclinado": ["spider curl", "spider bicep curl", "curl arana"],
  "Curl zottman": ["zottman curl", "curl zottman"],
  "Curl 21 con barra": ["21s curl", "barbell 21 curl", "curl 21"],

  // Triceps
  "Press francés con barra W (rompecráneos)": ["skull crusher", "skullcrusher", "lying triceps extension", "french press", "rompecraneos", "press frances barra w"],
  "Extensiones de tríceps en polea alta (barra)": ["tricep pushdown", "cable tricep extension", "extension triceps polea", "jalon de triceps en polea"],
  "Extensiones de tríceps en polea con soga": ["rope pushdown", "tricep rope pushdown", "extension triceps soga"],
  "Extensiones tras nuca en polea con soga": ["overhead cable tricep extension", "overhead rope extension", "triceps tras nuca", "extension de triceps sobre la cabeza"],
  "Extensiones tras nuca con mancuerna (copa)": ["seated overhead dumbbell extension", "extension francesa sentado", "copa triceps"],
  "Press cerrado con barra": ["close grip bench press", "close grip press", "press cerrado"],
  "Fondos en paralelas para tríceps": ["parallel bar tricep dips", "fondos en paralelas triceps"],
  "Fondos asistidos en máquina": ["assisted dips", "fondos asistidos"],
  "Patada de tríceps con mancuerna": ["tricep kickbacks", "patada de triceps"],

  // Core
  "Plancha frontal": ["plank", "abdominal plank", "plancha frontal", "plancha"],
  "Plancha lateral": ["side plank", "plancha lateral"],
  "Abdominales crunch en colchoneta": ["crunches", "ab crunch", "abdominales crunch"],
  "Crunch en polea con soga": ["cable crunch", "kneeling cable crunch", "crunch polea", "crunch en cable"],
  "Rueda abdominal (Ab Roller)": ["ab wheel", "ab roller", "rueda abdominal"],
  "Elevación de rodillas colgado en barra": ["hanging knee raise", "elevacion de rodillas colgado"],
  "Elevación de piernas en paralelas": ["captain chair leg raise", "elevacion piernas paralelas"],
  "Dead bug": ["dead bug", "bicho muerto"],
  "Bird dog": ["bird dog", "perro pajaro"],
  "Press Pallof en polea": ["pallof press", "press pallof"],
  "Russian twist con peso": ["russian twist", "giros rusos"],
  "Hollow body hold": ["hollow body", "hollow body hold"],

  // Cardio
  "Caminata inclinada en cinta": ["treadmill walking", "incline treadmill", "cinta caminadora", "caminata en cinta"],
  "Bicicleta fija": ["stationary bike", "cycling", "bici fija"],
  "Eliptico": ["elliptical", "eliptico", "eliptica"],
  "Bicicleta de aire (Air Bike / Assault Bike)": ["air bike", "assault bike", "echo bike", "bici de aire"],
  "Remoergómetro (Concept 2)": ["rower", "rowing machine", "concept 2", "remo ergometro"],
  "Escaladora (StairMaster)": ["stairmaster", "stair climber", "escaladora"],
  "Cuerda de saltar": ["jump rope", "skipping rope", "cuerda de saltar", "soga saltar"],
  "Burpees": ["burpees", "burpee"],
  "Mountain climbers": ["mountain climbers", "escaladores"],
  "Empuje de trineo (Sled push)": ["sled push", "empuje de trineo"]
};

export type SearchResultItem = {
  exercise: Exercise;
  matchedAlias?: string;
  score?: number;
};

type IndexedExercise = {
  raw: Exercise;
  name: string;
  nameNormalized: string;
  nameEnglish: string;
  nameEnglishNormalized: string;
  aliases: string[];
  aliasesNormalized: string[];
  muscleGroupName: string;
  muscleGroupNameNormalized: string;
  equipment: string;
  equipmentTranslated: string;
};

/**
 * Prepara el documento indexable para Fuse.js combinando nombres, traducciones y alias.
 */
function prepareIndexDoc(exercise: Exercise): IndexedExercise {
  const englishName = exerciseEnglishNames[exercise.name] || "";
  const backendAliases = Array.isArray(exercise.aliases) ? exercise.aliases : [];
  const fallbackAliases = EXERCISE_FALLBACK_ALIASES[exercise.name] || [];
  const mergedAliases = Array.from(new Set([...backendAliases, ...fallbackAliases]));

  return {
    raw: exercise,
    name: exercise.name,
    nameNormalized: normalizeSearchText(exercise.name),
    nameEnglish: englishName,
    nameEnglishNormalized: normalizeSearchText(englishName),
    aliases: mergedAliases,
    aliasesNormalized: mergedAliases.map(normalizeSearchText),
    muscleGroupName: exercise.muscleGroupName || "",
    muscleGroupNameNormalized: normalizeSearchText(exercise.muscleGroupName || ""),
    equipment: exercise.equipment || "",
    equipmentTranslated: normalizeSearchText(formatEquipment(exercise.equipment)),
  };
}

/**
 * Busca ejercicios usando Fuse.js con normalización de diacríticos y detección de alias.
 */
export function searchExercises(
  exercises: Exercise[],
  query: string,
  lang: AppLanguage = "es"
): SearchResultItem[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return exercises.map((exercise) => ({ exercise }));
  }

  const normalizedQuery = normalizeSearchText(trimmed);
  const docs = exercises.map(prepareIndexDoc);

  const fuse = new Fuse(docs, {
    keys: [
      { name: "nameNormalized", weight: 0.45 },
      { name: "nameEnglishNormalized", weight: 0.40 },
      { name: "aliasesNormalized", weight: 0.35 },
      { name: "muscleGroupNameNormalized", weight: 0.15 },
      { name: "equipmentTranslated", weight: 0.10 },
      { name: "equipment", weight: 0.08 },
    ],
    threshold: 0.38,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
  });

  const results = fuse.search(normalizedQuery);

  return results.map((result) => {
    const doc = result.item;
    let matchedAlias: string | undefined;

    // Detectar si el usuario encontró el ejercicio a través de un alias o traducción
    const displayName = getExerciseName(doc.raw, lang);
    const normalizedDisplay = normalizeSearchText(displayName);

    if (!normalizedDisplay.includes(normalizedQuery)) {
      // Si no fue parte del nombre mostrado actualmente, buscar cuál alias coincidió
      const matchInEnglish = doc.nameEnglish && normalizeSearchText(doc.nameEnglish).includes(normalizedQuery);
      if (matchInEnglish && lang === "es") {
        matchedAlias = doc.nameEnglish;
      } else {
        const found = doc.aliases.find((a) => normalizeSearchText(a).includes(normalizedQuery));
        if (found) {
          matchedAlias = found;
        } else if (doc.nameNormalized.includes(normalizedQuery) && lang === "en") {
          matchedAlias = doc.name;
        }
      }
    }

    return {
      exercise: doc.raw,
      matchedAlias,
      score: result.score,
    };
  });
}

/**
 * Hook reactivo de búsqueda difusa de ejercicios.
 */
export function useExerciseSearch(
  exercises: Exercise[],
  query: string,
  lang: AppLanguage = "es"
): SearchResultItem[] {
  return useMemo(() => {
    return searchExercises(exercises, query, lang);
  }, [exercises, query, lang]);
}
