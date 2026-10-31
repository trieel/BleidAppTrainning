// Unit verification for formatContraindications and formatExerciseName
import assert from "node:assert";
import { formatContraindications, formatExerciseName, contraindicationMap } from "../lib/labels.ts";

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

// Test Spanish typography and 'ñ'
assert.strictEqual(formatExerciseName("Curl arana en banco inclinado"), "Curl araña en banco inclinado");
assert.strictEqual(formatExerciseName("Press banca con barra"), "Press banca con barra");

console.log("✓ ALL LOCALIZATION TESTS PASSED!");
