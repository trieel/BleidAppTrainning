using BleidAppTraining.Domain.Entities;
using BleidAppTraining.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BleidAppTraining.Infrastructure.Persistence;

public static class SeedData
{
    public static async Task SeedAsync(BleidDbContext db, CancellationToken cancellationToken = default)
    {
        var muscleGroups = await SeedMuscleGroupsAsync(db, cancellationToken);
        var exercises = await SeedExercisesAsync(db, muscleGroups, cancellationToken);
        await SeedTipsAsync(db, cancellationToken);
        await SeedRoutinesAsync(db, exercises, cancellationToken);
    }

    private static async Task<Dictionary<string, MuscleGroup>> SeedMuscleGroupsAsync(
        BleidDbContext db,
        CancellationToken cancellationToken)
    {
        var definitions = new[]
        {
            new MuscleGroupSeed("Pecho", "chest"),
            new MuscleGroupSeed("Espalda", "back"),
            new MuscleGroupSeed("Cuadriceps", "quadriceps"),
            new MuscleGroupSeed("Gluteos", "glutes"),
            new MuscleGroupSeed("Isquiotibiales", "hamstrings"),
            new MuscleGroupSeed("Pantorrillas", "calves"),
            new MuscleGroupSeed("Hombros", "shoulders"),
            new MuscleGroupSeed("Biceps", "biceps"),
            new MuscleGroupSeed("Triceps", "triceps"),
            new MuscleGroupSeed("Core", "core"),
            new MuscleGroupSeed("Cardio", "cardio")
        };

        var existing = await db.MuscleGroups.ToListAsync(cancellationToken);
        foreach (var definition in definitions)
        {
            if (existing.Any(group => group.Name.Equals(definition.Name, StringComparison.OrdinalIgnoreCase)))
                continue;

            var group = new MuscleGroup { Name = definition.Name, Icon = definition.Icon };
            db.MuscleGroups.Add(group);
            existing.Add(group);
        }

        await db.SaveChangesAsync(cancellationToken);
        return existing.ToDictionary(group => group.Name, StringComparer.OrdinalIgnoreCase);
    }

    private static async Task<Dictionary<string, Exercise>> SeedExercisesAsync(
        BleidDbContext db,
        IReadOnlyDictionary<string, MuscleGroup> muscleGroups,
        CancellationToken cancellationToken)
    {
        var existing = await db.Exercises.ToListAsync(cancellationToken);
        foreach (var definition in ExerciseDefinitions())
        {
            var group = muscleGroups[definition.MuscleGroup];
            if (existing.Any(exercise => exercise.MuscleGroupId == group.Id &&
                                         exercise.Name.Equals(definition.Name, StringComparison.OrdinalIgnoreCase)))
                continue;

            var exercise = new Exercise
            {
                MuscleGroupId = group.Id,
                Name = definition.Name,
                Description = $"Movimiento para trabajar {definition.MuscleGroup.ToLowerInvariant()}.",
                Equipment = definition.Equipment,
                Level = definition.Level,
                Contraindications = definition.Contraindications.ToList(),
                ModificationTip = definition.ModificationTip
            };
            db.Exercises.Add(exercise);
            existing.Add(exercise);
        }

        await db.SaveChangesAsync(cancellationToken);
        return existing.ToDictionary(exercise => exercise.Name, StringComparer.OrdinalIgnoreCase);
    }

    private static async Task SeedTipsAsync(BleidDbContext db, CancellationToken cancellationToken)
    {
        var definitions = new[]
        {
            new TipSeed(LimitationType.Lumbar, "Cuida tu zona lumbar", "Manten la espalda neutra y evita movimientos con dolor agudo.", TipType.Warning),
            new TipSeed(LimitationType.Lumbar, "Activa el abdomen", "Usa una carga que puedas controlar sin perder la posicion de la columna.", TipType.Recommendation),
            new TipSeed(LimitationType.Lumbar, "Alternativa de bisagra", "Proba un puente de gluteos si el peso muerto resulta incomodo.", TipType.Alternative),
            new TipSeed(LimitationType.Knee, "Respeta tu rango", "No fuerces la profundidad si aparece dolor o inestabilidad en la rodilla.", TipType.Warning),
            new TipSeed(LimitationType.Knee, "Controla el descenso", "Baja de forma lenta y alinea la rodilla con la punta del pie.", TipType.Recommendation),
            new TipSeed(LimitationType.Knee, "Trabaja sentado", "La extension de cadera y el curl femoral pueden reemplazar algunos patrones de pierna.", TipType.Alternative),
            new TipSeed(LimitationType.Shoulder, "Evita el dolor", "No entrenes por encima de la cabeza si limita tu movilidad o causa dolor.", TipType.Warning),
            new TipSeed(LimitationType.Shoulder, "Prioriza estabilidad", "Usa recorridos controlados y enfocate en la posicion de los omoplatos.", TipType.Recommendation),
            new TipSeed(LimitationType.Shoulder, "Empuje horizontal", "El press de pecho en maquina suele permitir una posicion mas estable.", TipType.Alternative),
            new TipSeed(LimitationType.Wrist, "Alinea la muñeca", "Mantene la muñeca alineada con el antebrazo y evita doblarla bajo carga.", TipType.Warning),
            new TipSeed(LimitationType.Wrist, "Usa agarre neutro", "Las mancuernas permiten encontrar un angulo mas comodo para la muñeca.", TipType.Recommendation),
            new TipSeed(LimitationType.Wrist, "Empuje con cuerda", "El jalon de triceps con cuerda reduce la exigencia de extension de muñeca.", TipType.Alternative),
            new TipSeed(LimitationType.Neck, "Mantene la cabeza neutra", "Evita mirar hacia arriba o abajo durante las repeticiones.", TipType.Warning),
            new TipSeed(LimitationType.Neck, "Reduce la carga", "Elegí una carga que no te obligue a tensar el cuello.", TipType.Recommendation),
            new TipSeed(LimitationType.Neck, "Apoyo estable", "Las maquinas con respaldo pueden ayudarte a mantener una posicion segura.", TipType.Alternative)
        };

        var existing = await db.LimitationTips.ToListAsync(cancellationToken);
        foreach (var definition in definitions)
        {
            if (existing.Any(tip => tip.LimitationType == definition.Type && tip.Title == definition.Title))
                continue;

            db.LimitationTips.Add(new LimitationTip
            {
                LimitationType = definition.Type,
                Title = definition.Title,
                Content = definition.Content,
                TipType = definition.TipType
            });
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedRoutinesAsync(
        BleidDbContext db,
        IReadOnlyDictionary<string, Exercise> exercises,
        CancellationToken cancellationToken)
    {
        var existingNames = await db.Routines
            .Where(routine => routine.IsTemplate)
            .Select(routine => routine.Name)
            .ToHashSetAsync(cancellationToken);

        foreach (var definition in RoutineDefinitions())
        {
            if (existingNames.Contains(definition.Name))
                continue;

            var routine = new Routine
            {
                Name = definition.Name,
                Goal = definition.Goal,
                Level = definition.Level,
                DaysPerWeek = definition.DaysPerWeek,
                IsTemplate = true
            };

            for (var dayIndex = 0; dayIndex < definition.Days.Length; dayIndex++)
            {
                var dayDefinition = definition.Days[dayIndex];
                var day = new RoutineDay
                {
                    Routine = routine,
                    DayNumber = dayIndex + 1,
                    Name = dayDefinition.Name,
                    Order = dayIndex + 1
                };

                for (var exerciseIndex = 0; exerciseIndex < dayDefinition.Exercises.Length; exerciseIndex++)
                {
                    var exerciseDefinition = dayDefinition.Exercises[exerciseIndex];
                    if (!exercises.TryGetValue(exerciseDefinition.Name, out var exercise))
                        throw new InvalidOperationException($"Seed exercise '{exerciseDefinition.Name}' was not found.");

                    day.Exercises.Add(new RoutineExercise
                    {
                        RoutineDay = day,
                        ExerciseId = exercise.Id,
                        Sets = exerciseDefinition.Sets,
                        RepsMin = exerciseDefinition.RepsMin,
                        RepsMax = exerciseDefinition.RepsMax,
                        RestSeconds = exerciseDefinition.RestSeconds,
                        Order = exerciseIndex + 1
                    });
                }

                routine.Days.Add(day);
            }

            db.Routines.Add(routine);
            existingNames.Add(definition.Name);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static IEnumerable<ExerciseSeed> ExerciseDefinitions()
    {
        yield return E("Press banca con barra", "Pecho", EquipmentType.Barbell, LevelType.Intermediate, new[] { "Wrist" });
        yield return E("Press inclinado con mancuernas", "Pecho", EquipmentType.Dumbbell, LevelType.Beginner);
        yield return E("Press de pecho en maquina", "Pecho", EquipmentType.Machine, LevelType.Beginner);
        yield return E("Cruce de cables", "Pecho", EquipmentType.Cable, LevelType.Intermediate);
        yield return E("Flexiones de brazos", "Pecho", EquipmentType.Bodyweight, LevelType.Beginner);
        yield return E("Aperturas con mancuernas", "Pecho", EquipmentType.Dumbbell, LevelType.Beginner, new[] { "Shoulder" });
        yield return E("Press declinado con barra", "Pecho", EquipmentType.Barbell, LevelType.Intermediate, new[] { "Wrist" });
        yield return E("Pec deck", "Pecho", EquipmentType.Machine, LevelType.Beginner);

        yield return E("Peso muerto convencional", "Espalda", EquipmentType.Barbell, LevelType.Advanced, new[] { "Lumbar" }, "Usa remo con apoyo de pecho como alternativa.");
        yield return E("Jalon al pecho", "Espalda", EquipmentType.Cable, LevelType.Beginner);
        yield return E("Remo sentado en cable", "Espalda", EquipmentType.Cable, LevelType.Beginner);
        yield return E("Remo con barra", "Espalda", EquipmentType.Barbell, LevelType.Advanced, new[] { "Lumbar" }, "Usa remo con apoyo de pecho como alternativa.");
        yield return E("Remo a una mano", "Espalda", EquipmentType.Dumbbell, LevelType.Intermediate);
        yield return E("Remo con apoyo de pecho", "Espalda", EquipmentType.Machine, LevelType.Beginner);
        yield return E("Dominadas asistidas", "Espalda", EquipmentType.Machine, LevelType.Intermediate, new[] { "Shoulder" });
        yield return E("Jalon con brazos rectos", "Espalda", EquipmentType.Cable, LevelType.Intermediate);
        yield return E("Hiperextension lumbar", "Espalda", EquipmentType.Bodyweight, LevelType.Intermediate, new[] { "Lumbar" });
        yield return E("Face pull", "Espalda", EquipmentType.Cable, LevelType.Beginner, new[] { "Shoulder" });

        yield return E("Sentadilla trasera", "Cuadriceps", EquipmentType.Barbell, LevelType.Advanced, new[] { "Knee", "Lumbar" }, "Proba prensa de piernas con rango controlado.");
        yield return E("Prensa de piernas", "Cuadriceps", EquipmentType.Machine, LevelType.Beginner, new[] { "Knee" }, "Reduce el rango y la carga si aparece molestia.");
        yield return E("Sentadilla goblet", "Cuadriceps", EquipmentType.Dumbbell, LevelType.Beginner, new[] { "Knee", "Lumbar" });
        yield return E("Extension de piernas", "Cuadriceps", EquipmentType.Machine, LevelType.Beginner, new[] { "Knee" });
        yield return E("Sentadilla bulgara", "Cuadriceps", EquipmentType.Dumbbell, LevelType.Intermediate, new[] { "Knee" });
        yield return E("Hack squat", "Cuadriceps", EquipmentType.Machine, LevelType.Intermediate, new[] { "Knee" });
        yield return E("Sentadilla frontal", "Cuadriceps", EquipmentType.Barbell, LevelType.Advanced, new[] { "Knee", "Lumbar" });
        yield return E("Subida al cajon", "Cuadriceps", EquipmentType.Bodyweight, LevelType.Beginner, new[] { "Knee" });
        yield return E("Zancada hacia atras", "Cuadriceps", EquipmentType.Dumbbell, LevelType.Beginner, new[] { "Knee" });
        yield return E("Sentadilla sissy", "Cuadriceps", EquipmentType.Bodyweight, LevelType.Advanced, new[] { "Knee" });
        yield return E("Contraccion de cuadriceps", "Cuadriceps", EquipmentType.Bodyweight, LevelType.Beginner);

        yield return E("Hip thrust con barra", "Gluteos", EquipmentType.Barbell, LevelType.Intermediate, new[] { "Lumbar" });
        yield return E("Puente de gluteos", "Gluteos", EquipmentType.Bodyweight, LevelType.Beginner);
        yield return E("Peso muerto rumano", "Gluteos", EquipmentType.Barbell, LevelType.Intermediate, new[] { "Lumbar" }, "Usa puente de gluteos como alternativa.");
        yield return E("Patada de gluteo en cable", "Gluteos", EquipmentType.Cable, LevelType.Beginner);
        yield return E("Abduccion de cadera en maquina", "Gluteos", EquipmentType.Machine, LevelType.Beginner);
        yield return E("Zancadas caminando", "Gluteos", EquipmentType.Dumbbell, LevelType.Intermediate, new[] { "Knee" });
        yield return E("Swing con kettlebell", "Gluteos", EquipmentType.Dumbbell, LevelType.Advanced, new[] { "Lumbar" });
        yield return E("Puente de gluteo a una pierna", "Gluteos", EquipmentType.Bodyweight, LevelType.Intermediate);

        yield return E("Curl femoral acostado", "Isquiotibiales", EquipmentType.Machine, LevelType.Beginner);
        yield return E("Curl femoral sentado", "Isquiotibiales", EquipmentType.Machine, LevelType.Beginner);
        yield return E("Curl nordico", "Isquiotibiales", EquipmentType.Bodyweight, LevelType.Advanced);
        yield return E("Buenos dias", "Isquiotibiales", EquipmentType.Barbell, LevelType.Advanced, new[] { "Lumbar" });
        yield return E("Curl femoral con pelota", "Isquiotibiales", EquipmentType.Bodyweight, LevelType.Intermediate);
        yield return E("Peso muerto rumano a una pierna", "Isquiotibiales", EquipmentType.Dumbbell, LevelType.Advanced, new[] { "Lumbar" });
        yield return E("Deslizamiento de isquiotibiales", "Isquiotibiales", EquipmentType.Bodyweight, LevelType.Intermediate);

        yield return E("Elevacion de pantorrillas", "Pantorrillas", EquipmentType.Machine, LevelType.Beginner, new[] { "Knee" });
        yield return E("Elevacion de pantorrillas sentado", "Pantorrillas", EquipmentType.Machine, LevelType.Beginner);

        yield return E("Press militar con barra", "Hombros", EquipmentType.Barbell, LevelType.Advanced, new[] { "Shoulder" });
        yield return E("Press de hombros con mancuernas", "Hombros", EquipmentType.Dumbbell, LevelType.Beginner, new[] { "Shoulder" });
        yield return E("Elevaciones laterales", "Hombros", EquipmentType.Dumbbell, LevelType.Beginner);
        yield return E("Elevacion lateral en cable", "Hombros", EquipmentType.Cable, LevelType.Intermediate);
        yield return E("Vuelo posterior", "Hombros", EquipmentType.Dumbbell, LevelType.Beginner, new[] { "Shoulder" });
        yield return E("Remo al menton", "Hombros", EquipmentType.Barbell, LevelType.Advanced, new[] { "Shoulder" });
        yield return E("Press Arnold", "Hombros", EquipmentType.Dumbbell, LevelType.Intermediate, new[] { "Shoulder" });
        yield return E("Elevacion frontal", "Hombros", EquipmentType.Dumbbell, LevelType.Beginner, new[] { "Shoulder" });

        yield return E("Curl de biceps con barra", "Biceps", EquipmentType.Barbell, LevelType.Beginner, new[] { "Wrist" });
        yield return E("Curl de biceps con mancuernas", "Biceps", EquipmentType.Dumbbell, LevelType.Beginner, new[] { "Wrist" });
        yield return E("Curl martillo", "Biceps", EquipmentType.Dumbbell, LevelType.Beginner);
        yield return E("Curl inclinado con mancuernas", "Biceps", EquipmentType.Dumbbell, LevelType.Intermediate, new[] { "Shoulder" });
        yield return E("Curl de biceps en cable", "Biceps", EquipmentType.Cable, LevelType.Beginner);
        yield return E("Curl predicador", "Biceps", EquipmentType.Machine, LevelType.Intermediate, new[] { "Wrist" });

        yield return E("Press cerrado", "Triceps", EquipmentType.Barbell, LevelType.Intermediate, new[] { "Wrist", "Shoulder" });
        yield return E("Jalon de triceps en polea", "Triceps", EquipmentType.Cable, LevelType.Beginner);
        yield return E("Extension de triceps sobre la cabeza", "Triceps", EquipmentType.Cable, LevelType.Intermediate, new[] { "Shoulder" });
        yield return E("Rompecraneos", "Triceps", EquipmentType.Barbell, LevelType.Advanced, new[] { "Wrist" });
        yield return E("Fondos asistidos", "Triceps", EquipmentType.Machine, LevelType.Intermediate, new[] { "Shoulder" });
        yield return E("Patada de triceps", "Triceps", EquipmentType.Dumbbell, LevelType.Beginner, new[] { "Wrist" });

        yield return E("Plancha frontal", "Core", EquipmentType.Bodyweight, LevelType.Beginner);
        yield return E("Plancha lateral", "Core", EquipmentType.Bodyweight, LevelType.Beginner);
        yield return E("Dead bug", "Core", EquipmentType.Bodyweight, LevelType.Beginner);
        yield return E("Bird dog", "Core", EquipmentType.Bodyweight, LevelType.Beginner, new[] { "Lumbar" });
        yield return E("Crunch en cable", "Core", EquipmentType.Cable, LevelType.Intermediate);
        yield return E("Elevacion de rodillas colgado", "Core", EquipmentType.Bodyweight, LevelType.Advanced, new[] { "Shoulder" });
        yield return E("Pallof press", "Core", EquipmentType.Cable, LevelType.Beginner);

        yield return E("Caminata en cinta", "Cardio", EquipmentType.Machine, LevelType.Beginner, new[] { "Knee" });
        yield return E("Bicicleta fija", "Cardio", EquipmentType.Machine, LevelType.Beginner);
        yield return E("Eliptico", "Cardio", EquipmentType.Machine, LevelType.Beginner, new[] { "Knee" });
        yield return E("Remo ergometro", "Cardio", EquipmentType.Machine, LevelType.Intermediate, new[] { "Lumbar" });
        yield return E("Escaladora", "Cardio", EquipmentType.Machine, LevelType.Intermediate, new[] { "Knee" });
        yield return E("Cuerda de saltar", "Cardio", EquipmentType.Bodyweight, LevelType.Intermediate, new[] { "Knee" });
    }

    private static IEnumerable<RoutineSeed> RoutineDefinitions()
    {
        yield return R("Hipertrofia inicial", GoalType.GainMuscle, LevelType.Beginner, 3,
            D("Tren superior", X("Press de pecho en maquina"), X("Jalon al pecho"), X("Elevaciones laterales"), X("Plancha frontal")),
            D("Piernas y gluteos", X("Prensa de piernas"), X("Puente de gluteos"), X("Curl femoral acostado"), X("Pallof press")),
            D("Fuerza general", X("Press inclinado con mancuernas"), X("Remo sentado en cable"), X("Zancada hacia atras"), X("Jalon de triceps en polea")));

        yield return R("Hipertrofia intermedia", GoalType.GainMuscle, LevelType.Intermediate, 4,
            D("Pecho y triceps", X("Press banca con barra"), X("Press inclinado con mancuernas"), X("Cruce de cables"), X("Jalon de triceps en polea")),
            D("Espalda y biceps", X("Jalon al pecho"), X("Remo sentado en cable"), X("Remo a una mano"), X("Curl martillo")),
            D("Piernas", X("Hack squat"), X("Hip thrust con barra"), X("Curl femoral sentado"), X("Elevacion de pantorrillas")),
            D("Hombros y core", X("Press de hombros con mancuernas"), X("Elevaciones laterales"), X("Vuelo posterior"), X("Crunch en cable")));

        yield return R("Hipertrofia avanzada", GoalType.GainMuscle, LevelType.Advanced, 5,
            D("Pecho", X("Press banca con barra", 4, 6, 10), X("Press inclinado con mancuernas"), X("Aperturas con mancuernas")),
            D("Espalda", X("Remo con barra", 4, 6, 10), X("Dominadas asistidas"), X("Jalon con brazos rectos")),
            D("Piernas anterior", X("Sentadilla trasera", 4, 6, 10), X("Prensa de piernas"), X("Extension de piernas")),
            D("Piernas posterior", X("Peso muerto rumano", 4, 6, 10), X("Hip thrust con barra"), X("Curl femoral acostado")),
            D("Brazos y hombros", X("Press militar con barra"), X("Curl de biceps con barra"), X("Rompecraneos"), X("Pallof press")));

        yield return R("Definicion inicial", GoalType.LoseWeight, LevelType.Beginner, 3,
            D("Circuito superior", X("Press de pecho en maquina", 3, 10, 15, 45), X("Remo sentado en cable", 3, 10, 15, 45), X("Elevaciones laterales", 3, 12, 15, 45), X("Bicicleta fija", 3, 10, 15, 30)),
            D("Circuito inferior", X("Prensa de piernas", 3, 10, 15, 45), X("Puente de gluteos", 3, 12, 15, 45), X("Curl femoral acostado", 3, 10, 15, 45), X("Caminata en cinta", 3, 15, 20, 30)),
            D("Cuerpo completo", X("Flexiones de brazos", 3, 8, 15, 45), X("Jalon al pecho", 3, 10, 15, 45), X("Zancada hacia atras", 3, 8, 12, 45), X("Plancha frontal", 3, 20, 40, 30)));

        yield return R("Definicion intermedia", GoalType.LoseWeight, LevelType.Intermediate, 4,
            D("Empuje", X("Press banca con barra"), X("Press de hombros con mancuernas"), X("Jalon de triceps en polea"), X("Eliptico", 3, 12, 18, 30)),
            D("Traccion", X("Jalon al pecho"), X("Remo sentado en cable"), X("Curl martillo"), X("Caminata en cinta", 3, 15, 20, 30)),
            D("Piernas", X("Hack squat"), X("Hip thrust con barra"), X("Curl femoral sentado"), X("Bicicleta fija", 3, 12, 18, 30)),
            D("Metabolico", X("Flexiones de brazos", 3, 10, 15, 30), X("Remo a una mano", 3, 10, 12, 30), X("Pallof press", 3, 10, 15, 30), X("Escaladora", 3, 10, 15, 30)));

        yield return R("Definicion avanzada", GoalType.LoseWeight, LevelType.Advanced, 5,
            D("Pecho y core", X("Press banca con barra", 4, 6, 10), X("Cruce de cables"), X("Crunch en cable"), X("Cuerda de saltar", 3, 20, 30, 30)),
            D("Espalda", X("Remo con barra", 4, 6, 10), X("Dominadas asistidas"), X("Jalon con brazos rectos"), X("Remo ergometro", 3, 10, 15, 30)),
            D("Cuadriceps", X("Sentadilla frontal", 4, 6, 10), X("Prensa de piernas"), X("Subida al cajon"), X("Bicicleta fija", 3, 12, 18, 30)),
            D("Gluteos e isquios", X("Peso muerto rumano", 4, 6, 10), X("Hip thrust con barra"), X("Curl femoral sentado"), X("Eliptico", 3, 12, 18, 30)),
            D("Acondicionamiento", X("Press de hombros con mancuernas"), X("Curl martillo"), X("Jalon de triceps en polea"), X("Escaladora", 4, 10, 15, 30)));

        yield return R("Resistencia inicial", GoalType.Endurance, LevelType.Beginner, 2,
            D("Cardio base", X("Bicicleta fija", 3, 15, 25, 45), X("Caminata en cinta", 3, 15, 25, 45), X("Plancha frontal", 3, 20, 30, 30)),
            D("Circuito general", X("Press de pecho en maquina", 3, 12, 15, 45), X("Prensa de piernas", 3, 12, 15, 45), X("Jalon al pecho", 3, 12, 15, 45), X("Eliptico", 3, 15, 25, 45)));

        yield return R("Resistencia intermedia", GoalType.Endurance, LevelType.Intermediate, 3,
            D("Aerobico", X("Eliptico", 4, 12, 20, 30), X("Caminata en cinta", 4, 15, 25, 30), X("Pallof press", 3, 12, 15, 30)),
            D("Fuerza resistente", X("Press inclinado con mancuernas", 3, 12, 15, 45), X("Remo sentado en cable", 3, 12, 15, 45), X("Zancada hacia atras", 3, 10, 14, 45), X("Bicicleta fija", 3, 15, 25, 30)),
            D("Intervalos", X("Remo ergometro", 5, 8, 12, 30), X("Subida al cajon", 3, 10, 14, 30), X("Flexiones de brazos", 3, 10, 15, 30), X("Plancha lateral", 3, 20, 35, 30)));

        yield return R("Resistencia avanzada", GoalType.Endurance, LevelType.Advanced, 4,
            D("Cardio continuo", X("Remo ergometro", 5, 10, 15, 30), X("Eliptico", 4, 15, 25, 30), X("Plancha frontal", 4, 30, 45, 30)),
            D("Circuito superior", X("Press banca con barra", 4, 10, 15, 30), X("Jalon al pecho", 4, 10, 15, 30), X("Press de hombros con mancuernas", 3, 12, 15, 30), X("Cuerda de saltar", 4, 20, 30, 30)),
            D("Circuito inferior", X("Prensa de piernas", 4, 12, 15, 30), X("Hip thrust con barra", 4, 10, 15, 30), X("Curl femoral sentado", 3, 12, 15, 30), X("Escaladora", 4, 10, 15, 30)),
            D("Potencia y core", X("Swing con kettlebell", 4, 12, 20, 30), X("Subida al cajon", 4, 10, 15, 30), X("Pallof press", 4, 12, 15, 30), X("Bicicleta fija", 4, 15, 25, 30)));

        yield return R("Mantenimiento inicial", GoalType.Maintain, LevelType.Beginner, 2,
            D("Cuerpo completo A", X("Press de pecho en maquina"), X("Jalon al pecho"), X("Prensa de piernas"), X("Plancha frontal")),
            D("Cuerpo completo B", X("Press inclinado con mancuernas"), X("Remo sentado en cable"), X("Puente de gluteos"), X("Bicicleta fija", 3, 12, 20, 45)));

        yield return R("Mantenimiento intermedio", GoalType.Maintain, LevelType.Intermediate, 3,
            D("Superior", X("Press banca con barra"), X("Remo sentado en cable"), X("Press de hombros con mancuernas"), X("Curl martillo")),
            D("Inferior", X("Hack squat"), X("Hip thrust con barra"), X("Curl femoral sentado"), X("Pallof press")),
            D("Mixto", X("Press inclinado con mancuernas"), X("Jalon al pecho"), X("Zancada hacia atras"), X("Jalon de triceps en polea")));

        yield return R("Mantenimiento avanzado", GoalType.Maintain, LevelType.Advanced, 4,
            D("Pecho y hombros", X("Press banca con barra", 4, 6, 10), X("Press inclinado con mancuernas"), X("Elevaciones laterales"), X("Jalon de triceps en polea")),
            D("Espalda y brazos", X("Remo con barra", 4, 6, 10), X("Dominadas asistidas"), X("Curl de biceps con barra"), X("Curl martillo")),
            D("Piernas", X("Sentadilla trasera", 4, 6, 10), X("Peso muerto rumano", 4, 6, 10), X("Hip thrust con barra"), X("Curl femoral acostado")),
            D("Core y cardio", X("Crunch en cable"), X("Pallof press"), X("Eliptico", 4, 15, 25, 45), X("Plancha lateral")));
    }

    private static ExerciseSeed E(
        string name,
        string muscleGroup,
        EquipmentType equipment,
        LevelType level,
        string[]? contraindications = null,
        string? modificationTip = null) =>
        new(name, muscleGroup, equipment, level, contraindications ?? Array.Empty<string>(), modificationTip);

    private static RoutineSeed R(string name, GoalType goal, LevelType level, int daysPerWeek, params DaySeed[] days) =>
        new(name, goal, level, daysPerWeek, days);

    private static DaySeed D(string name, params RoutineExerciseSeed[] exercises) => new(name, exercises);

    private static RoutineExerciseSeed X(string name, int sets = 3, int repsMin = 8, int repsMax = 12, int restSeconds = 90) =>
        new(name, sets, repsMin, repsMax, restSeconds);

    private sealed record MuscleGroupSeed(string Name, string Icon);

    private sealed record ExerciseSeed(
        string Name,
        string MuscleGroup,
        EquipmentType Equipment,
        LevelType Level,
        string[] Contraindications,
        string? ModificationTip);

    private sealed record TipSeed(LimitationType Type, string Title, string Content, TipType TipType);

    private sealed record RoutineSeed(string Name, GoalType Goal, LevelType Level, int DaysPerWeek, DaySeed[] Days);

    private sealed record DaySeed(string Name, RoutineExerciseSeed[] Exercises);

    private sealed record RoutineExerciseSeed(string Name, int Sets, int RepsMin, int RepsMax, int RestSeconds);
}
