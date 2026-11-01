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
  "Press plano con mancuernas": ["dumbbell bench press", "db bench press", "press banca mancuernas", "pecho mancuernas"],
  "Press inclinado con mancuernas": ["incline dumbbell press", "incline db press", "press inclinado", "pecho alto"],
  "Press inclinado con mancuernas agarre neutro": ["neutral grip incline press", "incline dumbbell press neutral", "press inclinado neutro"],
  "Press de pecho en máquina": ["chest press machine", "machine chest press", "press maquina pecho", "maquina pecho"],
  "Cruces en poleas para pecho": ["cable crossover", "cable flyes", "cruce de cables", "cruces polea"],
  "Flexiones de pecho (lagartijas)": ["push ups", "pushups", "lagartijas", "flexiones de brazos"],
  "Aperturas con mancuernas": ["dumbbell flyes", "db flyes", "aperturas", "aperturas pecho"],
  "Press declinado con barra": ["decline bench press", "decline barbell press", "press declinado"],
  "Aperturas en máquina (Pec Deck)": ["pec deck", "peck deck", "machine fly", "contractora", "mariposa"],
  "Fondos en paralelas (pecho)": ["chest dips", "dips", "fondos en paralelas", "paralelas"],
  "Pullover con mancuerna": ["dumbbell pullover", "pullover", "db pullover"],
  "Press inclinado en máquina Smith": ["smith machine incline press", "incline smith press", "press smith"],
  "Flexiones con deficit": ["deficit pushups", "deficit push ups", "flexiones deficit"],

  // Espalda
  "Peso muerto convencional": ["deadlift", "conventional deadlift", "peso muerto", "pmo"],
  "Dominadas libres (peso corporal)": ["pull ups", "pullups", "chin ups", "dominadas", "traccion vertical"],
  "Dominadas asistidas": ["assisted pull ups", "assisted chin ups", "dominadas en maquina"],
  "Jalón al pecho en polea": ["lat pulldown", "pulldown", "jalon al pecho", "dorsalera", "jalon"],
  "Remo sentado en cable": ["seated cable row", "cable row", "remo sentado", "remo polea"],
  "Remo en polea baja con agarre estrecho (Remo Gironda)": ["gironda row", "close grip cable row", "remo gironda"],
  "Remo con barra": ["barbell row", "bent over row", "remo barra"],
  "Remo con mancuerna a una mano (serrucho)": ["serrucho", "one arm dumbbell row", "single arm db row", "remo mancuerna"],
  "Remo con apoyo de pecho": ["chest supported row", "machine row", "remo con apoyo"],
  "Jalón con brazos rectos": ["straight arm pulldown", "straight arm lat pulldown", "jalon brazos rectos"],
  "Hiperextensión lumbar": ["back extension", "hyperextensions", "hiperextensiones", "lumbares"],
  "Face pull en polea alta": ["face pull", "cable face pull", "face pulls"],
  "Remo en barra T": ["t bar row", "t-bar row", "remo t"],
  "Jalón al pecho agarre supino": ["reverse grip lat pulldown", "underhand pulldown", "jalon supino"],
  "Remo en polea baja con agarre neutro": ["neutral grip cable row", "remo neutro polea"],
  "Pullover en polea alta": ["cable pullover", "overhead cable pullover", "pullover polea"],

  // Cuadriceps
  "Sentadilla trasera": ["back squat", "barbell squat", "sentadilla con barra", "sentadillas"],
  "Sentadilla en máquina Smith": ["smith machine squat", "smith squat", "sentadilla smith"],
  "Prensa de piernas": ["leg press", "prensa de piernas", "prensa"],
  "Prensa a 45°": ["45 degree leg press", "incline leg press", "prensa a 45 grados"],
  "Prensa horizontal": ["horizontal leg press", "seated leg press", "prensa horizontal"],
  "Sillón de cuadríceps (extensiones)": ["leg extension", "leg extensions", "extension de piernas", "sillon de cuadriceps"],
  "Sentadilla búlgara": ["bulgarian split squat", "bulgaras", "sentadilla bulgara"],
  "Hack squat": ["hack squat", "sentadilla hack"],
  "Sentadilla frontal": ["front squat", "barbell front squat", "sentadilla delantera"],
  "Sentadilla goblet": ["goblet squat", "dumbbell goblet squat", "sentadilla copa"],
  "Subidas al cajón": ["step ups", "box step ups", "subidas al cajon"],
  "Estocadas hacia atrás con mancuernas": ["reverse lunges", "dumbbell reverse lunge", "estocadas atras", "zancadas"],
  "Estocadas caminando con mancuernas": ["walking lunges", "dumbbell walking lunges", "estocadas caminando"],
  "Sentadilla sissy": ["sissy squat", "sentadilla sissy"],
  "Contracción de cuadríceps": ["quad contraction", "contraccion de cuadriceps"],
  "Sentadilla con cinturón (Belt Squat)": ["belt squat", "sentadilla con cinturon"],
  "Sentadilla cosaca": ["cossack squat", "sentadilla cosaca"],

  // Gluteos
  "Hip thrust con barra": ["hip thrust", "barbell hip thrust", "puente de gluteo con barra", "empuje de cadera"],
  "Hip thrust en máquina": ["machine hip thrust", "hip thrust machine", "hip thrust en maquina"],
  "Puente de glúteos": ["glute bridge", "puente de gluteos", "puente de gluteo"],
  "Patada de glúteos en polea": ["cable glute kickback", "glute kickback", "patada de burro", "patada de gluteo"],
  "Abducción de cadera en máquina": ["seated hip abduction", "hip abductor machine", "abductores"],
  "Swing con kettlebell": ["kettlebell swing", "kb swing", "swing"],
  "Puente de glúteo a una pierna": ["single leg glute bridge", "puente a una pierna"],
  "Hiperextensiones a 45° para glúteo": ["45 degree glute hyperextension", "hiperextension gluteo"],
  "Peso muerto sumo con mancuerna": ["dumbbell sumo deadlift", "sumo deadlift db"],
  "Step up cruzado": ["crossover step up", "step up cruzado"],

  // Isquiotibiales
  "Peso muerto rumano": ["romanian deadlift", "rdl", "barbell rdl", "peso muerto rumano"],
  "Peso muerto rumano con mancuernas": ["dumbbell rdl", "db romanian deadlift", "rdl mancuernas"],
  "Camilla femoral acostado": ["lying leg curl", "lying hamstring curl", "camilla femoral", "curl femoral acostado"],
  "Sillón de isquiotibiales (femoral sentado)": ["seated leg curl", "seated hamstring curl", "sillon de isquiotibiales", "curl femoral sentado"],
  "Curl nórdico": ["nordic curl", "nordic hamstring curl", "curl nordico"],
  "Buenos días": ["good mornings", "good morning", "buenos dias"],
  "Curl femoral con pelota": ["swiss ball leg curl", "curl con pelota"],
  "Peso muerto rumano a una pierna": ["single leg rdl", "peso muerto a una pierna"],
  "Deslizamiento de isquiotibiales": ["hamstring slide", "deslizamiento isquios"],
  "Curl femoral de pie en máquina": ["standing leg curl", "curl femoral parado"],

  // Pantorrillas
  "Gemelos de pie en máquina": ["standing calf raise", "calf raises", "gemelos de pie", "pantorrillas de pie"],
  "Gemelos sentado en máquina (sóleo)": ["seated calf raise", "soleus raise", "soleo", "gemelos sentado"],
  "Elevacion de talones en prensa": ["leg press calf raise", "talones en prensa"],
  "Elevacion de talones a una pierna": ["single leg calf raise", "talones a una pierna"],

  // Hombros
  "Press militar con barra": ["overhead press", "ohp", "barbell military press", "press militar"],
  "Press de hombros con mancuernas sentado": ["seated dumbbell shoulder press", "db shoulder press", "press de hombros"],
  "Press militar sentado con mancuernas": ["seated dumbbell overhead press", "seated db ohp", "press militar sentado"],
  "Vuelos laterales con mancuernas": ["dumbbell lateral raise", "lateral raises", "vuelos laterales", "elevaciones laterales"],
  "Vuelos laterales en polea": ["cable lateral raise", "side lateral cable", "vuelos en polea"],
  "Vuelos posteriores (pájaros)": ["rear delt fly", "rear delt flyes", "pajaros", "vuelos posteriores"],
  "Remo al mentón": ["upright row", "barbell upright row", "remo al menton"],
  "Press Arnold": ["arnold press", "dumbbell arnold press", "press arnold"],
  "Elevacion frontal": ["front raise", "dumbbell front raise", "elevacion frontal"],
  "Press militar en máquina Smith": ["smith machine shoulder press", "smith ohp", "press hombros smith"],
  "Elevaciones laterales en banco inclinado": ["incline lateral raise", "vuelos en banco inclinado"],
  "Y-Raises en banco inclinado": ["y raises", "y-raises", "elevaciones en y"],
  "Face pull con rotación externa": ["face pull external rotation", "face pull con rotacion externa"],

  // Biceps
  "Curl inclinado con mancuernas": ["incline dumbbell curl", "incline curl", "curl inclinado", "biceps cabeza larga"],
  "Curl Scott en banco (predicador)": ["preacher curl", "scott curl", "banco scott", "curl predicador"],
  "Curl de bíceps con barra": ["barbell curl", "barbell bicep curl", "curl de biceps con barra", "curl barra"],
  "Curl de bíceps con mancuernas": ["dumbbell curl", "db bicep curl", "curl de biceps con mancuernas", "curl mancuernas"],
  "Curl martillo": ["hammer curl", "dumbbell hammer curl", "curl martillo"],
  "Curl martillo en polea con soga": ["cable hammer curl", "rope hammer curl", "curl martillo polea con soga"],
  "Curl de bíceps en cable": ["cable bicep curl", "cable curl", "curl en polea"],
  "Curl de concentración": ["concentration curl", "curl concentrado"],
  "Curl araña en banco inclinado": ["spider curl", "spider bicep curl", "curl arana"],
  "Curl zottman": ["zottman curl", "curl zottman"],
  "Curl 21 con barra": ["21s curl", "barbell 21 curl", "curl 21"],

  // Triceps
  "Press francés con barra (rompecráneos)": ["skull crusher", "skullcrusher", "lying triceps extension", "french press", "rompecraneos"],
  "Press francés en banco plano con barra W": ["ez bar skull crusher", "press frances barra w"],
  "Extensiones de tríceps en polea alta": ["tricep pushdown", "cable tricep extension", "extension triceps polea"],
  "Extensiones de tríceps en polea con soga": ["rope pushdown", "tricep rope pushdown", "extension triceps soga"],
  "Extensiones tras nuca en polea con soga": ["overhead cable tricep extension", "overhead rope extension", "triceps tras nuca"],
  "Press cerrado": ["close grip bench press", "close grip press", "press cerrado"],
  "Extension de triceps sobre la cabeza": ["overhead tricep extension", "copa triceps"],
  "Fondos asistidos": ["assisted dips", "fondos asistidos"],
  "Patada de triceps": ["tricep kickbacks", "patada de triceps"],
  "Extension francesa con mancuerna sentado": ["seated overhead dumbbell extension", "extension francesa sentado"],
  "Fondos en paralelas para triceps": ["parallel bar tricep dips", "fondos en paralelas triceps"],

  // Core
  "Plancha frontal": ["plank", "abdominal plank", "plancha frontal", "plancha"],
  "Plancha lateral": ["side plank", "plancha lateral"],
  "Abdominales crunch en colchoneta": ["crunches", "ab crunch", "abdominales crunch"],
  "Crunch en cable": ["cable crunch", "kneeling cable crunch", "crunch polea"],
  "Rueda abdominal (Ab wheel)": ["ab wheel", "ab roller", "rueda abdominal"],
  "Rueda abdominal (Ab Roller)": ["ab wheel", "ab roller", "rueda abdominal"],
  "Elevación de rodillas colgado en barra": ["hanging knee raise", "elevacion de rodillas colgado"],
  "Elevacion de piernas en paralelas": ["captain chair leg raise", "elevacion piernas paralelas"],
  "Dead bug": ["dead bug", "bicho muerto"],
  "Bird dog": ["bird dog", "perro pajaro"],
  "Pallof press": ["pallof press", "press pallof"],
  "Russian twist con peso": ["russian twist", "giros rusos"],
  "Hollow body hold": ["hollow body", "hollow body hold"],

  // Cardio
  "Caminata en cinta": ["treadmill walking", "incline treadmill", "cinta caminadora"],
  "Bicicleta fija": ["stationary bike", "cycling", "bici fija"],
  "Eliptico": ["elliptical", "eliptico", "eliptica"],
  "Bicicleta de aire (Air Bike / Assault Bike)": ["air bike", "assault bike", "echo bike", "bici de aire"],
  "Remo ergometro": ["rower", "rowing machine", "concept 2", "remo ergometro"],
  "Escaladora": ["stairmaster", "stair climber", "escaladora"],
  "Cuerda de saltar": ["jump rope", "skipping rope", "cuerda de saltar", "soga saltar"],
  "Burpees": ["burpees", "burpee"],
  "Mountain climbers": ["mountain climbers", "escaladores"]
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
