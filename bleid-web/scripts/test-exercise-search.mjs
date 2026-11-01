import assert from "node:assert";
import Fuse from "fuse.js";
import fs from "node:fs";
import path from "node:path";

// Function to extract export const objects from TS files
function loadTsDict(filePath, varName) {
  const content = fs.readFileSync(filePath, "utf8");
  const regex = new RegExp(`export const ${varName}:?\\s*(?:Record<[^>]+>)?\\s*=\\s*({[\\s\\S]*?\\n};)`);
  const match = content.match(regex);
  if (!match) throw new Error(`Could not find ${varName} in ${filePath}`);
  return eval(`(${match[1].replace(/;$/, "")})`);
}

const fallbackAliases = loadTsDict(
  path.resolve("bleid-web/lib/exercise-search.ts"),
  "EXERCISE_FALLBACK_ALIASES"
);
const englishNames = loadTsDict(
  path.resolve("bleid-web/lib/exercise-i18n.ts"),
  "exerciseEnglishNames"
);

function normalizeSearchText(text) {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function prepareIndexDoc(exercise) {
  const englishName = englishNames[exercise.name] || "";
  const backendAliases = Array.isArray(exercise.aliases) ? exercise.aliases : [];
  const fallbacks = fallbackAliases[exercise.name] || [];
  const mergedAliases = Array.from(new Set([...backendAliases, ...fallbacks]));

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
  };
}

function searchExercises(exercises, query) {
  const trimmed = query.trim();
  if (!trimmed) return exercises.map((e) => ({ exercise: e }));

  const normalizedQuery = normalizeSearchText(trimmed);
  const docs = exercises.map(prepareIndexDoc);

  const fuse = new Fuse(docs, {
    keys: [
      { name: "nameNormalized", weight: 0.45 },
      { name: "nameEnglishNormalized", weight: 0.40 },
      { name: "aliasesNormalized", weight: 0.35 },
      { name: "muscleGroupNameNormalized", weight: 0.15 },
      { name: "equipment", weight: 0.08 },
    ],
    threshold: 0.38,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
  });

  return fuse.search(normalizedQuery).map((r) => ({
    exercise: r.item.raw,
    score: r.score,
  }));
}

// Mock dataset
const mockExercises = Object.keys(fallbackAliases).map((name, index) => ({
  id: `ex-${index + 1}`,
  name,
  muscleGroupName: name.includes("Curl") ? "Biceps" : name.includes("Press") ? "Pecho" : "Espalda",
  equipment: name.includes("mancuerna") ? "Dumbbell" : "Barbell",
  aliases: fallbackAliases[name],
}));

console.log(`Loaded ${mockExercises.length} catalog exercises for search verification.`);

const testCases = [
  {
    name: "English term 'bench press' finds 'Press plano con barra'",
    query: "bench press",
    expectedFirst: "Press plano con barra",
  },
  {
    name: "English term 'deadlift' finds 'Peso muerto convencional'",
    query: "deadlift",
    expectedFirst: "Peso muerto convencional",
  },
  {
    name: "Acronym 'rdl' finds 'Peso muerto rumano'",
    query: "rdl",
    expectedContains: "Peso muerto rumano",
  },
  {
    name: "Argentine slang 'serrucho' finds 'Remo con mancuerna a una mano (serrucho)'",
    query: "serrucho",
    expectedFirst: "Remo con mancuerna a una mano (serrucho)",
  },
  {
    name: "Argentine slang 'banco scott' finds 'Curl Scott en banco (predicador)'",
    query: "banco scott",
    expectedFirst: "Curl Scott en banco (predicador)",
  },
  {
    name: "Argentine slang 'rompecraneos' finds 'Press francés con barra (rompecráneos)'",
    query: "rompecraneos",
    expectedFirst: "Press francés con barra (rompecráneos)",
  },
  {
    name: "Argentine slang 'pajaros' finds 'Vuelos posteriores (pájaros)'",
    query: "pajaros",
    expectedFirst: "Vuelos posteriores (pájaros)",
  },
  {
    name: "Diacritic desensitization: 'jalon' finds 'Jalón al pecho en polea'",
    query: "jalon",
    expectedContains: "Jalón al pecho en polea",
  },
  {
    name: "Diacritic desensitization: 'biceps' finds curls",
    query: "biceps",
    expectedContains: "Curl de bíceps con barra",
  },
  {
    name: "Typo tolerance: 'pres banca' finds 'Press plano con barra'",
    query: "pres banca",
    expectedFirst: "Press plano con barra",
  },
  {
    name: "English term 'lat pulldown' finds 'Jalón al pecho en polea'",
    query: "lat pulldown",
    expectedFirst: "Jalón al pecho en polea",
  },
  {
    name: "English term 'skull crusher' finds 'Press francés con barra (rompecráneos)'",
    query: "skull crusher",
    expectedFirst: "Press francés con barra (rompecráneos)",
  },
  {
    name: "English term 'bulgarian' finds 'Sentadilla búlgara'",
    query: "bulgarian",
    expectedFirst: "Sentadilla búlgara",
  },
  {
    name: "English term 'hip thrust' finds 'Hip thrust con barra'",
    query: "hip thrust",
    expectedContains: "Hip thrust con barra",
  },
  {
    name: "English term 'ab wheel' finds 'Rueda abdominal'",
    query: "ab wheel",
    expectedContains: "Rueda abdominal",
  },
];

let passed = 0;
for (const tc of testCases) {
  const results = searchExercises(mockExercises, tc.query);
  assert(results.length > 0, `Query '${tc.query}' returned 0 results!`);

  if (tc.expectedFirst) {
    const top = results[0].exercise.name;
    assert.strictEqual(
      top,
      tc.expectedFirst,
      `For '${tc.query}', expected top result '${tc.expectedFirst}' but got '${top}'`
    );
  }

  if (tc.expectedContains) {
    const found = results.some((r) => r.exercise.name.includes(tc.expectedContains));
    assert(
      found,
      `For '${tc.query}', expected results to contain '${tc.expectedContains}'`
    );
  }

  passed++;
  console.log(`✅ [PASS] ${tc.name}`);
}

console.log("\nVerifying Translations:");
assert.strictEqual(englishNames["Press plano con barra"], "Barbell Flat Bench Press");
assert.strictEqual(englishNames["Remo con mancuerna a una mano (serrucho)"], "One-Arm Dumbbell Row (Saw)");
console.log("✅ [PASS] Translations matched expected English terms.");

console.log(`\n🎉 ALL ${passed} SEARCH AND LOCALIZATION TESTS PASSED CLEANLY!`);
