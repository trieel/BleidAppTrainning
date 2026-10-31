// Unit verification for formatContraindications and formatExerciseName
import assert from "node:assert";
import { formatContraindications, formatExerciseName } from "../lib/labels.ts";

assert.strictEqual(typeof formatContraindications, "function");
assert.strictEqual(typeof formatExerciseName, "function");

// Test single values
assert.strictEqual(formatContraindications(["wrist"]), "Muñeca");
assert.strictEqual(formatContraindications(["Wrist"]), "Muñeca");
assert.strictEqual(formatContraindications(["knee"]), "Rodilla");
assert.strictEqual(formatContraindications(["shoulder"]), "Hombro");
assert.strictEqual(formatContraindications(["lower_back"]), "Espalda baja");
assert.strictEqual(formatContraindications(["Lumbar"]), "Espalda baja");

// Test multiple values
assert.strictEqual(formatContraindications(["Wrist", "lower_back"]), "Muñeca, Espalda baja");
assert.strictEqual(formatContraindications(["knee", "shoulder"]), "Rodilla, Hombro");
assert.strictEqual(formatContraindications([]), "");
assert.strictEqual(formatContraindications(null), "");

// Test Spanish typography, 'ñ' and accents
assert.strictEqual(formatExerciseName("Curl arana en banco inclinado"), "Curl araña en banco inclinado");
assert.strictEqual(formatExerciseName("Press banca con barra"), "Press banca con barra");
assert.strictEqual(formatExerciseName("Jalon al pecho"), "Jalón al pecho");
assert.strictEqual(formatExerciseName("Curl de biceps con barra"), "Curl de bíceps con barra");
assert.strictEqual(formatExerciseName("Press de pecho en maquina"), "Press de pecho en máquina");
assert.strictEqual(formatExerciseName("Sentadilla bulgara"), "Sentadilla búlgara");
assert.strictEqual(formatExerciseName("Rompecraneos"), "Rompecráneos");

console.log("✓ ALL LOCALIZATION & TYPOGRAPHY TESTS PASSED!");
