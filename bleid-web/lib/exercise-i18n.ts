"use client";

import { useEffect, useState } from "react";

export type AppLanguage = "es" | "en";

export const muscleGroupEnglish: Record<string, string> = {
  Pecho: "Chest",
  Espalda: "Back",
  Cuadriceps: "Quadriceps",
  "Cuádriceps": "Quadriceps",
  Gluteos: "Glutes",
  "Glúteos": "Glutes",
  Isquiotibiales: "Hamstrings",
  Pantorrillas: "Calves",
  Hombros: "Shoulders",
  Biceps: "Biceps",
  "Bí­ceps": "Biceps",
  "Bíceps": "Biceps",
  Triceps: "Triceps",
  "Trí­ceps": "Triceps",
  "Tríceps": "Triceps",
  Core: "Core",
  Cardio: "Cardio",
  Otros: "Other",
};

export const equipmentEnglish: Record<string, string> = {
  Barbell: "Barbell",
  Dumbbell: "Dumbbell",
  Machine: "Machine",
  Cable: "Cable / Pulley",
  Bodyweight: "Bodyweight",
};

export const exerciseEnglishNames: Record<string, string> = {
  // Pecho
  "Press plano con barra": "Barbell Flat Bench Press",
  "Press plano con mancuernas": "Flat Dumbbell Bench Press",
  "Press inclinado con mancuernas": "Incline Dumbbell Bench Press",
  "Press inclinado con mancuernas agarre neutro": "Neutral Grip Incline Dumbbell Press",
  "Press de pecho en máquina": "Machine Chest Press",
  "Cruces en polea para pecho": "Cable Crossover Flyes",
  "Cruces en poleas para pecho": "Cable Crossover Flyes",
  "Flexiones de brazos": "Push-ups",
  "Flexiones de pecho (lagartijas)": "Push-ups",
  "Aperturas con mancuernas": "Dumbbell Flyes",
  "Press declinado con barra": "Decline Barbell Bench Press",
  "Peck Deck": "Pec Deck Machine Fly",
  "Aperturas en máquina (Pec Deck)": "Pec Deck Machine Fly",
  "Fondos en paralelas (pecho)": "Chest Dips",
  "Pullover con mancuerna": "Dumbbell Pullover",
  "Press inclinado en máquina Smith": "Smith Machine Incline Press",
  "Flexiones con deficit": "Deficit Push-ups",

  // Espalda
  "Peso muerto convencional": "Conventional Deadlift",
  "Dominadas libres (peso corporal)": "Bodyweight Pull-ups",
  "Dominadas asistidas": "Assisted Pull-ups",
  "Jalón al pecho en polea": "Cable Lat Pulldown",
  "Jalón al pecho agarre supino": "Reverse-Grip Lat Pulldown",
  "Remo en polea baja (Remo Gironda)": "Close-Grip Seated Cable Row (Gironda Row)",
  "Remo sentado en cable": "Close-Grip Seated Cable Row (Gironda Row)",
  "Remo en polea baja con agarre estrecho (Remo Gironda)": "Close-Grip Seated Cable Row (Gironda Row)",
  "Remo con barra": "Barbell Bent-Over Row",
  "Remo con mancuerna a una mano (serrucho)": "One-Arm Dumbbell Row (Saw)",
  "Remo con apoyo de pecho": "Chest-Supported Machine Row",
  "Remo en barra T": "T-Bar Row",
  "Pullover en polea alta con soga": "High Cable Rope Pullover",
  "Jalón con brazos rectos": "Straight-Arm Cable Pulldown",
  "Pullover en polea alta": "High Cable Pullover",
  "Face pull en polea alta": "High Cable Face Pull",
  "Hiperextensión lumbar": "Hyperextensions (Back Extensions)",

  // Cuadriceps
  "Sentadilla trasera": "Barbell Back Squat",
  "Sentadilla en máquina Smith": "Smith Machine Squat",
  "Sentadilla frontal": "Barbell Front Squat",
  "Sentadilla Hack": "Hack Squat",
  "Hack squat": "Hack Squat",
  "Prensa a 45°": "45° Incline Leg Press",
  "Prensa de piernas": "45° Incline Leg Press",
  "Prensa horizontal": "Horizontal Seated Leg Press",
  "Sillón de cuadríceps": "Leg Extension Machine",
  "Sillón de cuadríceps (extensiones)": "Leg Extension Machine",
  "Contracción de cuadríceps": "Isometric Quad Contraction",
  "Sentadilla búlgara": "Bulgarian Split Squat",
  "Sentadilla goblet": "Goblet Squat",
  "Subidas al cajón": "Box Step-ups",
  "Estocadas hacia atrás con mancuernas": "Dumbbell Reverse Lunges",
  "Estocadas caminando con mancuernas": "Dumbbell Walking Lunges",
  "Sentadilla sissy": "Sissy Squat",
  "Sentadilla con cinturón (Belt Squat)": "Belt Squat",
  "Sentadilla cosaca": "Cossack Squat",

  // Gluteos
  "Hip thrust con barra": "Barbell Hip Thrust",
  "Hip thrust en máquina": "Machine Hip Thrust",
  "Puente de glúteos en colchoneta": "Floor Glute Bridge",
  "Puente de glúteos": "Floor Glute Bridge",
  "Puente de glúteo a una pierna": "Single-Leg Glute Bridge",
  "Patada de glúteos en polea": "Cable Glute Kickback",
  "Abducción de cadera en máquina": "Seated Hip Abduction Machine",
  "Hiperextensiones a 45° para glúteo": "45° Glute Hyperextensions",
  "Swing con kettlebell": "Kettlebell Swing",
  "Peso muerto sumo con mancuerna": "Dumbbell Sumo Deadlift",
  "Step up cruzado en banco": "Bench Crossover Step-up",
  "Step up cruzado": "Bench Crossover Step-up",

  // Isquiotibiales (Femoral)
  "Camilla femoral": "Lying Leg Curl (Hamstring Curl)",
  "Camilla femoral acostado": "Lying Leg Curl (Hamstring Curl)",
  "Curl femoral acostado": "Lying Leg Curl (Hamstring Curl)",
  "Sillón femoral": "Seated Leg Curl Machine",
  "Sillón de isquiotibiales (femoral sentado)": "Seated Leg Curl Machine",
  "Curl femoral sentado": "Seated Leg Curl Machine",
  "Curl femoral de pie en máquina": "Standing Leg Curl Machine",
  "Peso muerto rumano con barra": "Barbell Romanian Deadlift (RDL)",
  "Peso muerto rumano": "Barbell Romanian Deadlift (RDL)",
  "Peso muerto rumano con mancuernas": "Dumbbell Romanian Deadlift (RDL)",
  "Peso muerto rumano a una pierna": "Single-Leg Romanian Deadlift",
  "Curl nórdico": "Nordic Hamstring Curl",
  "Buenos días con barra": "Good Mornings (Barbell)",
  "Buenos días": "Good Mornings (Barbell)",
  "Curl femoral con pelota": "Swiss Ball Leg Curl",
  "Deslizamiento de isquiotibiales": "Hamstring Slide",

  // Pantorrillas
  "Gemelos de pie en máquina": "Standing Calf Raise Machine",
  "Gemelos sentado en máquina (sóleo)": "Seated Calf Raise (Soleus)",
  "Gemelos en prensa": "Leg Press Calf Raise",
  "Elevacion de talones en prensa": "Leg Press Calf Raise",
  "Gemelos a una pierna con peso corporal": "Single-Leg Calf Raise",
  "Elevacion de talones a una pierna": "Single-Leg Calf Raise",

  // Hombros
  "Press militar con barra": "Overhead Press (Barbell Military Press)",
  "Press de hombros con mancuernas sentado": "Seated Dumbbell Shoulder Press",
  "Press militar sentado con mancuernas": "Seated Dumbbell Overhead Press",
  "Press militar en máquina Smith": "Smith Machine Shoulder Press",
  "Press Arnold": "Arnold Dumbbell Press",
  "Vuelos laterales con mancuernas": "Dumbbell Lateral Raises",
  "Vuelos laterales en polea": "Cable Lateral Raises",
  "Vuelos posteriores (pájaros)": "Rear Delt Flyes",
  "Vuelos frontales con mancuernas": "Dumbbell Front Raises",
  "Elevacion frontal": "Dumbbell Front Raises",
  "Remo al mentón con barra": "Barbell Upright Row",
  "Remo al mentón": "Barbell Upright Row",
  "Vuelos laterales en banco inclinado": "Incline Lateral Raises",
  "Y-Raises en banco inclinado": "Incline Bench Y-Raises",
  "Face pull con rotación externa": "Face Pull with External Rotation",

  // Biceps
  "Curl con mancuernas": "Dumbbell Bicep Curl",
  "Curl de bíceps con mancuernas": "Dumbbell Bicep Curl",
  "Curl de concentración": "Concentration Curl",
  "Curl Scott con barra": "Barbell Preacher Curl (Scott Bench)",
  "Curl Scott en banco (predicador)": "Barbell Preacher Curl (Scott Bench)",
  "Curl Scott con mancuernas": "Dumbbell Preacher Curl",
  "Curl de bíceps en polea": "Low Cable Bicep Curl",
  "Curl de bíceps en cable": "Low Cable Bicep Curl",
  "Curl de bíceps con barra": "Barbell Bicep Curl",
  "Curl martillo": "Dumbbell Hammer Curl",
  "Curl martillo en polea con soga": "Cable Rope Hammer Curl",
  "Curl inclinado con mancuernas": "Incline Dumbbell Bicep Curl",
  "Curl araña en banco inclinado": "Spider Curl",
  "Curl zottman": "Zottman Curl",
  "Curl 21 con barra": "21s Barbell Curl",

  // Triceps
  "Press francés con barra W (rompecráneos)": "Barbell Skull Crusher (French Press)",
  "Press francés con barra (rompecráneos)": "Barbell Skull Crusher (French Press)",
  "Press francés en banco plano con barra W": "EZ-Bar Skull Crusher",
  "Extensiones de tríceps en polea alta (barra)": "Triceps Cable Pushdown (Bar)",
  "Extensiones de tríceps en polea alta": "Triceps Cable Pushdown (Bar)",
  "Extensiones de tríceps en polea con soga": "Triceps Rope Pushdown",
  "Extensiones tras nuca en polea con soga": "Overhead Cable Rope Extension",
  "Extensiones tras nuca con mancuerna (copa)": "Seated Overhead Dumbbell Triceps Extension",
  "Extension francesa con mancuerna sentado": "Seated Overhead Dumbbell Triceps Extension",
  "Extension de triceps sobre la cabeza": "Overhead Triceps Extension",
  "Press cerrado con barra": "Close-Grip Bench Press",
  "Press cerrado": "Close-Grip Bench Press",
  "Fondos en paralelas para tríceps": "Parallel Bar Triceps Dips",
  "Fondos en paralelas para triceps": "Parallel Bar Triceps Dips",
  "Fondos asistidos en máquina": "Assisted Dips Machine",
  "Fondos asistidos": "Assisted Dips Machine",
  "Patada de tríceps con mancuerna": "Dumbbell Triceps Kickback",
  "Patada de triceps": "Dumbbell Triceps Kickback",

  // Core
  "Plancha frontal": "Front Plank",
  "Plancha lateral": "Side Plank",
  "Abdominales crunch en colchoneta": "Floor Abdominal Crunches",
  "Crunch en polea con soga": "Kneeling Cable Crunch with Rope",
  "Crunch en cable": "Kneeling Cable Crunch with Rope",
  "Rueda abdominal (Ab Roller)": "Ab Wheel Rollout",
  "Rueda abdominal (Ab wheel)": "Ab Wheel Rollout",
  "Elevación de rodillas colgado en barra": "Hanging Knee Raise",
  "Elevación de piernas en paralelas": "Captain's Chair Leg Raise",
  "Elevacion de piernas en paralelas": "Captain's Chair Leg Raise",
  "Dead bug": "Dead Bug",
  "Bird dog": "Bird Dog",
  "Press Pallof en polea": "Cable Pallof Press",
  "Pallof press": "Cable Pallof Press",
  "Russian twist con peso": "Weighted Russian Twist",
  "Hollow body hold": "Hollow Body Hold",

  // Cardio
  "Caminata inclinada en cinta": "Incline Treadmill Walk",
  "Caminata en cinta": "Incline Treadmill Walk",
  "Bicicleta fija": "Stationary Upright Bike",
  "Eliptico": "Elliptical Trainer",
  "Bicicleta de aire (Air Bike / Assault Bike)": "Air Bike / Assault Bike",
  "Remoergómetro (Concept 2)": "Concept 2 Rowing Ergometer",
  "Remo ergometro": "Concept 2 Rowing Ergometer",
  "Escaladora (StairMaster)": "StairMaster (Stair Climber)",
  "Escaladora": "StairMaster (Stair Climber)",
  "Cuerda de saltar": "Jump Rope",
  "Burpees": "Burpees",
  "Mountain climbers": "Mountain Climbers",
  "Empuje de trineo (Sled push)": "Sled Push",
};

/**
 * Devuelve el nombre localizado del ejercicio según el idioma seleccionado.
 */
export function getExerciseName(exercise: { name: string }, lang: AppLanguage = "es"): string {
  if (lang === "en") {
    return exerciseEnglishNames[exercise.name] || exercise.name;
  }
  return exercise.name;
}

/**
 * Devuelve el grupo muscular traducido.
 */
export function getMuscleGroupName(groupName?: string | null, lang: AppLanguage = "es"): string {
  if (!groupName) return lang === "en" ? "Other" : "Otros";
  if (lang === "en") {
    return muscleGroupEnglish[groupName] || groupName;
  }
  return groupName;
}

/**
 * Devuelve el implemento traducido.
 */
export function getEquipmentDisplayName(equipment?: string | null, lang: AppLanguage = "es"): string {
  if (!equipment) return "";
  if (lang === "en") {
    return equipmentEnglish[equipment] || equipment;
  }
  return equipment;
}

const LANGUAGE_KEY = "bleid_preferred_language";
const LANGUAGE_EVENT = "bleid_language_change";

/**
 * Hook reactivo para obtener y alternar el idioma de la aplicación (ES / EN).
 * Sincronizado en tiempo real a través de localStorage y CustomEvent.
 */
export function useLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>("es");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_KEY) as AppLanguage | null;
      if (stored === "es" || stored === "en") {
        setLanguageState(stored);
      }
    } catch {
      // Ignorar restricciones en SSR o modo incógnito estricto
    }

    function handleCustomEvent(e: Event) {
      const detail = (e as CustomEvent<AppLanguage>).detail;
      if (detail === "es" || detail === "en") {
        setLanguageState(detail);
      }
    }

    window.addEventListener(LANGUAGE_EVENT, handleCustomEvent);
    return () => window.removeEventListener(LANGUAGE_EVENT, handleCustomEvent);
  }, []);

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_KEY, newLang);
      window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: newLang }));
    } catch {
      // Ignorar error de almacenamiento
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "es" ? "en" : "es");
  };

  return { language, setLanguage, toggleLanguage, isEnglish: language === "en" };
}
