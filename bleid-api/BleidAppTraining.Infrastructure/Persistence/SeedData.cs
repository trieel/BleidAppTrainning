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

        // Mapeo exhaustivo de nombres previos a terminología estándar y rioplatense de gimnasio
        var legacyRenames = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "Press banca con barra", "Press plano con barra" },
            { "Curl arana en banco inclinado", "Curl araña en banco inclinado" },
            { "Remo a una mano", "Remo con mancuerna a una mano (serrucho)" },
            { "Curl predicador", "Curl Scott en banco (predicador)" },
            { "Rompecraneos", "Press francés con barra (rompecráneos)" },
            { "Elevaciones laterales", "Vuelos laterales con mancuernas" },
            { "Elevacion lateral en cable", "Vuelos laterales en polea" },
            { "Vuelo posterior", "Vuelos posteriores (pájaros)" },
            { "Zancada hacia atras", "Estocadas hacia atrás con mancuernas" },
            { "Zancadas caminando", "Estocadas caminando con mancuernas" },
            { "Jalon al pecho", "Jalón al pecho en polea" },
            { "Extension de piernas", "Sillón de cuadríceps (extensiones)" },
            { "Curl femoral acostado", "Camilla femoral acostado" },
            { "Curl femoral sentado", "Sillón de isquiotibiales (femoral sentado)" },
            { "Elevacion de pantorrillas", "Gemelos de pie en máquina" },
            { "Elevacion de pantorrillas sentado", "Gemelos sentado en máquina (sóleo)" },
            { "Extension de triceps en polea con cuerda", "Extensiones de tríceps en polea con soga" },
            { "Jalon de triceps en polea", "Extensiones de tríceps en polea alta" },
            { "Flexiones de brazos", "Flexiones de pecho (lagartijas)" },
            { "Cruce de cables", "Cruces en poleas para pecho" },
            { "Prensa 45 grados", "Prensa a 45°" },
            { "Rueda abdominal (Ab wheel)", "Rueda abdominal (Ab Roller)" },
            { "Elevacion de rodillas colgado", "Elevación de rodillas colgado en barra" },
            { "Crunch en cable", "Crunch abdominal en polea alta" },
            { "Sentadilla con cinturon (Belt squat)", "Sentadilla con cinturón (Belt Squat)" },
            { "Press inclinado en maquina Smith", "Press inclinado en máquina Smith" },
            { "Press militar en maquina Smith", "Press militar en máquina Smith" },
            { "Press de hombros con mancuernas", "Press de hombros con mancuernas sentado" },
            { "Press de pecho en maquina", "Press de pecho en máquina" },
            { "Face pull", "Face pull en polea alta" },
            { "Face pull con rotacion externa", "Face pull con rotación externa" },
            { "Hiperextensiones a 45 grados para gluteo", "Hiperextensiones a 45° para glúteo" },
            { "Subida al cajon", "Subidas al cajón" },
            { "Subida al cajón", "Subidas al cajón" },
            { "Puente de gluteos", "Puente de glúteos" },
            { "Remo en polea baja agarre neutro", "Remo en polea baja con agarre neutro" }
        };

        // Migración en caliente de nombres en registros existentes
        foreach (var (oldName, newName) in legacyRenames)
        {
            var match = existing.FirstOrDefault(e => e.Name.Equals(oldName, StringComparison.OrdinalIgnoreCase));
            if (match != null)
            {
                match.Name = newName;
            }
        }

        foreach (var definition in ExerciseDefinitions())
        {
            var group = muscleGroups[definition.MuscleGroup];
            var existingExercise = existing.FirstOrDefault(exercise =>
                exercise.MuscleGroupId == group.Id &&
                (exercise.Name.Equals(definition.Name, StringComparison.OrdinalIgnoreCase) ||
                 (legacyRenames.TryGetValue(exercise.Name, out var targetName) && targetName.Equals(definition.Name, StringComparison.OrdinalIgnoreCase))));

            if (existingExercise != null)
            {
                // Sincronizar y enriquecer descripciones y tips de ejercicios existentes
                existingExercise.Name = definition.Name;
                existingExercise.Description = definition.Description;
                existingExercise.Equipment = definition.Equipment;
                existingExercise.Level = definition.Level;
                existingExercise.Contraindications = definition.Contraindications.ToList();
                if (!string.IsNullOrWhiteSpace(definition.ModificationTip))
                {
                    existingExercise.ModificationTip = definition.ModificationTip;
                }
                continue;
            }

            var exercise = new Exercise
            {
                MuscleGroupId = group.Id,
                Name = definition.Name,
                Description = definition.Description,
                Equipment = definition.Equipment,
                Level = definition.Level,
                Contraindications = definition.Contraindications.ToList(),
                ModificationTip = definition.ModificationTip
            };
            db.Exercises.Add(exercise);
            existing.Add(exercise);
        }

        await db.SaveChangesAsync(cancellationToken);

        // Crear mapa de resolución que soporte tanto nombres nuevos como legacy
        var resultDict = new Dictionary<string, Exercise>(StringComparer.OrdinalIgnoreCase);
        foreach (var ex in existing)
        {
            resultDict[ex.Name] = ex;
            var unaccented = RemoveDiacritics(ex.Name);
            if (!resultDict.ContainsKey(unaccented))
            {
                resultDict[unaccented] = ex;
            }
        }
        foreach (var (oldName, newName) in legacyRenames)
        {
            if (resultDict.TryGetValue(newName, out var ex))
            {
                resultDict[oldName] = ex;
                var unaccentedOld = RemoveDiacritics(oldName);
                if (!resultDict.ContainsKey(unaccentedOld))
                {
                    resultDict[unaccentedOld] = ex;
                }
            }
        }

        return resultDict;
    }

    private static string RemoveDiacritics(string text)
    {
        return text.Replace("á", "a").Replace("é", "e").Replace("í", "i").Replace("ó", "o").Replace("ú", "u")
                   .Replace("Á", "A").Replace("É", "E").Replace("Í", "I").Replace("Ó", "O").Replace("Ú", "U");
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
                    {
                        var unaccented = RemoveDiacritics(exerciseDefinition.Name);
                        if (!exercises.TryGetValue(unaccented, out exercise))
                        {
                            throw new KeyNotFoundException($"The exercise '{exerciseDefinition.Name}' was not found in catalog.");
                        }
                    }
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
        // ==================== PECHO ====================
        yield return E("Press plano con barra", "Pecho", EquipmentType.Barbell, LevelType.Intermediate,
            "Espalda con retracción escapular y pies firmes en el piso. Desciende la barra controlada al esternón medio y empuja en línea vertical sin desarmar las escápulas.",
            new[] { "Wrist" }, "Mantén las muñecas completamente neutras y firmes. Si persiste molestia, usa mancuernas con agarre semi-neutro.");
        yield return E("Press plano con mancuernas", "Pecho", EquipmentType.Dumbbell, LevelType.Beginner,
            "En banco plano, desciende las mancuernas con codos a 45°-60° respecto al torso. Empuja convergiendo en la parte alta sin golpear las pesas.",
            modificationTip: "Excelente alternativa articular al press con barra para muñecas u hombros.");
        yield return E("Press inclinado con mancuernas", "Pecho", EquipmentType.Dumbbell, LevelType.Beginner,
            "Banco a 30°-45°. Empuja las mancuernas enfocando el haz clavicular superior del pectoral, con hombros apoyados en el respaldo.",
            modificationTip: "Evita inclinar el banco más de 45° para no transferir la carga al deltoides anterior.");
        yield return E("Press inclinado con mancuernas agarre neutro", "Pecho", EquipmentType.Dumbbell, LevelType.Beginner,
            "Banco a 30° con palmas enfrentadas. Reduce el estrés sobre el manguito rotador y concentra el trabajo en el pectoral superior.",
            modificationTip: "Ideal si tienes antecedentes de pinzamiento en el hombro.");
        yield return E("Press de pecho en máquina", "Pecho", EquipmentType.Machine, LevelType.Beginner,
            "Ajusta el asiento para que las empuñaduras queden al centro del pecho. Empuja con trayectoria guiada concentrándote en la contracción.",
            modificationTip: "Ajusta el recorrido para no hiper-extender el hombro hacia atrás al inicio.");
        yield return E("Cruces en poleas para pecho", "Pecho", EquipmentType.Cable, LevelType.Intermediate,
            "Torso ligeramente inclinado al frente y codos semi-flexionados. Junta las manos al frente sintiendo la contracción máxima del pectoral.",
            modificationTip: "Excelente estímulo de aislamiento sin impacto sobre las articulaciones.");
        yield return E("Flexiones de pecho (lagartijas)", "Pecho", EquipmentType.Bodyweight, LevelType.Beginner,
            "Cuerpo en línea recta de talones a cabeza y abdomen tenso. Baja hasta que el pecho roce el suelo y empuja con potencia.",
            new[] { "Wrist" }, "Usa apoyos para flexiones o mancuernas hexagonales si te molestan las muñecas.");
        yield return E("Aperturas con mancuernas", "Pecho", EquipmentType.Dumbbell, LevelType.Beginner,
            "En banco plano con ligera flexión de codos fija. Abre los brazos sintiendo el estiramiento en el pectoral sin bajar de la línea de los hombros.",
            new[] { "Shoulder" }, "No bajes los codos más allá de la línea del banco para proteger la cápsula anterior del hombro.");
        yield return E("Press declinado con barra", "Pecho", EquipmentType.Barbell, LevelType.Intermediate,
            "Banco con declinación de 15°-30°. Desciende la barra a la base del esternón enfatizando la porción inferior del pectoral.",
            new[] { "Wrist" });
        yield return E("Aperturas en máquina (Pec Deck)", "Pecho", EquipmentType.Machine, LevelType.Beginner,
            "Espalda pegada al respaldo y antebrazos o manos en los manillares. Cierra los brazos apretando el pecho sin encoger los hombros.");
        yield return E("Fondos en paralelas (pecho)", "Pecho", EquipmentType.Bodyweight, LevelType.Intermediate,
            "Inclina el torso 30° hacia adelante con codos apuntando hacia afuera para concentrar la carga en las fibras inferiores del pectoral.",
            new[] { "Shoulder" }, "Inclina el torso hacia adelante; si notas molestia en hombros, reduce la profundidad a 90°.");
        yield return E("Pullover con mancuerna", "Pecho", EquipmentType.Dumbbell, LevelType.Intermediate,
            "Apoyado transversalmente sobre el banco con codos semi-flexionados. Desciende la mancuerna por detrás de la cabeza expandiendo la caja torácica.",
            new[] { "Shoulder" }, "Mantén los codos ligeramente flexionados para proteger los hombros.");
        yield return E("Press inclinado en máquina Smith", "Pecho", EquipmentType.Machine, LevelType.Beginner,
            "Banco a 30° guiado por la máquina Smith. Permite mover carga pesada con máxima estabilidad en el haz superior del pectoral.",
            new[] { "Wrist" });
        yield return E("Flexiones con deficit", "Pecho", EquipmentType.Bodyweight, LevelType.Intermediate,
            "Manos sobre bloques o discos para permitir un mayor rango de estiramiento en la porción inferior del movimiento.",
            new[] { "Wrist", "Shoulder" });

        // ==================== ESPALDA ====================
        yield return E("Peso muerto convencional", "Espalda", EquipmentType.Barbell, LevelType.Advanced,
            "Pies al ancho de caderas y barra pegada a las espinillas. Empuja el piso con las piernas manteniendo la columna neutra y traba la cadera arriba.",
            new[] { "Lumbar" }, "Usa remo con apoyo de pecho o peso muerto rumano como alternativa si tienes fatiga lumbar.");
        yield return E("Dominadas libres (peso corporal)", "Espalda", EquipmentType.Bodyweight, LevelType.Advanced,
            "Agarre prono ligeramente más ancho que los hombros. Tracciona llevando el pecho hacia la barra contrayendo dorsales y baja controlado.",
            new[] { "Shoulder" }, "Si no completas las repeticiones, usa banda elástica o la máquina de dominadas asistidas.");
        yield return E("Dominadas asistidas", "Espalda", EquipmentType.Machine, LevelType.Intermediate,
            "Con apoyo de rodillas en plataforma compensada. Ideal para progresar en fuerza de tracción vertical sin desarmar la técnica.",
            new[] { "Shoulder" });
        yield return E("Jalón al pecho en polea", "Espalda", EquipmentType.Cable, LevelType.Beginner,
            "Sentado en la dorsalera con muslos fijados. Tracciona la barra hacia la clavícula sacando pecho y apretando los dorsales sin balancear el torso.");
        yield return E("Remo sentado en cable", "Espalda", EquipmentType.Cable, LevelType.Beginner,
            "Piernas semi-flexionadas y torso erguido. Tracciona el manillar al abdomen bajo juntando las escápulas en la contracción máxima.");
        yield return E("Remo en polea baja con agarre estrecho (Remo Gironda)", "Espalda", EquipmentType.Cable, LevelType.Beginner,
            "Con manillar triangular o neutro estrecho, lleva la polea a la parte baja del abdomen con codos pegados al cuerpo para densificar la espalda media.");
        yield return E("Remo con barra", "Espalda", EquipmentType.Barbell, LevelType.Advanced,
            "Torso inclinado a 45° con columna lumbar neutra. Tracciona la barra al ombligo pegando los codos al cuerpo.",
            new[] { "Lumbar" }, "Usa remo con apoyo de pecho si tienes molestias en la zona baja de la espalda.");
        yield return E("Remo con mancuerna a una mano (serrucho)", "Espalda", EquipmentType.Dumbbell, LevelType.Intermediate,
            "Rodilla y mano apoyadas en banco. Tracciona la mancuerna hacia la cadera en arco llevando el codo hacia atrás sin rotar el torso.");
        yield return E("Remo con apoyo de pecho", "Espalda", EquipmentType.Machine, LevelType.Beginner,
            "Pecho apoyado en el acolchado para descargar por completo la zona lumbar. Tira de los manillares juntando escápulas.");
        yield return E("Jalón con brazos rectos", "Espalda", EquipmentType.Cable, LevelType.Intermediate,
            "Brazos casi extendidos en polea alta. Desciende la barra en semicírculo hacia los muslos aislando los dorsales sin fatiga de bíceps.");
        yield return E("Hiperextensión lumbar", "Espalda", EquipmentType.Bodyweight, LevelType.Intermediate,
            "En banco inclinado a 45°, flexiona la cadera manteniendo la espalda recta y sube alineando el tronco sin hiperextender en exceso.",
            new[] { "Lumbar" });
        yield return E("Face pull en polea alta", "Espalda", EquipmentType.Cable, LevelType.Beginner,
            "Con cuerda a la altura de la cara, tracciona hacia la frente separando las manos y rotando los hombros hacia afuera.",
            new[] { "Shoulder" }, "Salud fundamental para el manguito rotador y deltoides posterior.");
        yield return E("Remo en barra T", "Espalda", EquipmentType.Barbell, LevelType.Intermediate,
            "Pies firmes a los lados de la barra. Tracciona hacia el pecho bajo manteniendo la espalda firme y el abdomen activado.",
            new[] { "Lumbar" }, "Usa apoyo de pecho si tienes molestias en la zona baja.");
        yield return E("Jalón al pecho agarre supino", "Espalda", EquipmentType.Cable, LevelType.Beginner,
            "Palmas mirando hacia ti al ancho de hombros. Mayor énfasis en las fibras inferiores del dorsal y participación del bíceps.");
        yield return E("Remo en polea baja con agarre neutro", "Espalda", EquipmentType.Cable, LevelType.Beginner,
            "Agarre neutro para un recorrido cómodo de muñecas, traccionando directo hacia la cadera.");
        yield return E("Pullover en polea alta", "Espalda", EquipmentType.Cable, LevelType.Beginner,
            "Con barra recta o soga, lleva la carga hacia los muslos sintiendo el estiramiento dorsal en la parte superior.",
            new[] { "Shoulder" });

        // ==================== CUADRICEPS ====================
        yield return E("Sentadilla trasera", "Cuadriceps", EquipmentType.Barbell, LevelType.Advanced,
            "Barra sobre los trapecios y pies al ancho de hombros. Desciende flexionando rodillas y cadera manteniendo el pecho erguido y talones apoyados.",
            new[] { "Knee", "Lumbar" }, "Prueba prensa de piernas o sentadilla con cinturón para descargar la espalda.");
        yield return E("Sentadilla en máquina Smith", "Cuadriceps", EquipmentType.Machine, LevelType.Intermediate,
            "Pies ligeramente adelantados para enfatizar los cuádriceps y reducir la carga sobre la zona lumbar gracias a la guía vertical.",
            new[] { "Knee" }, "Asegura que las rodillas no colapsen hacia adentro al empujar.");
        yield return E("Prensa de piernas", "Cuadriceps", EquipmentType.Machine, LevelType.Beginner,
            "Espalda baja pegada al respaldo. Desciende la plataforma hasta 90° de flexión y empuja desde los talones sin bloquear las rodillas.",
            new[] { "Knee" }, "Reduce el rango y la carga si aparece molestia articular en la rótula.");
        yield return E("Prensa a 45°", "Cuadriceps", EquipmentType.Machine, LevelType.Intermediate,
            "En prensa inclinada, desciende con control manteniendo la pelvis bien apoyada en el respaldo durante todo el recorrido.",
            new[] { "Knee" }, "Coloca los pies al ancho de cadera sin despegar la pelvis.");
        yield return E("Prensa horizontal", "Cuadriceps", EquipmentType.Machine, LevelType.Beginner,
            "Sentado con empuje horizontal directo. Excelente para atletas que necesitan minimizar presión en la espalda baja.",
            modificationTip: "Muy segura para rehabilitación o iniciación en fuerza de piernas.");
        yield return E("Sillón de cuadríceps (extensiones)", "Cuadriceps", EquipmentType.Machine, LevelType.Beginner,
            "Espalda apoyada y rodillas alineadas con el eje de la máquina. Extiende las piernas y pausa 1 segundo en la contracción máxima.",
            new[] { "Knee" }, "Evita bloquear bruscamente la articulación arriba si tienes antecedentes de rótula.");
        yield return E("Sentadilla búlgara", "Cuadriceps", EquipmentType.Dumbbell, LevelType.Intermediate,
            "Un pie elevado en banco trasero y el otro adelantado. Baja en vertical sintiendo la carga en el muslo y glúteo de la pierna delantera.",
            new[] { "Knee" });
        yield return E("Hack squat", "Cuadriceps", EquipmentType.Machine, LevelType.Intermediate,
            "Espalda y hombros apoyados en el carro móvil. Desciende profundo con soporte dorsal total para aislar la musculatura del muslo.",
            new[] { "Knee" });
        yield return E("Sentadilla frontal", "Cuadriceps", EquipmentType.Barbell, LevelType.Advanced,
            "Barra en los hombros anteriores con codos altos. Exige torso completamente vertical y reclutamiento masivo de cuádriceps.",
            new[] { "Knee", "Lumbar" });
        yield return E("Sentadilla goblet", "Cuadriceps", EquipmentType.Dumbbell, LevelType.Beginner,
            "Mancuerna o kettlebell pegada al pecho. Ideal para aprender el patrón de sentadilla con buena profundidad y torso erguido.",
            new[] { "Knee", "Lumbar" });
        yield return E("Subidas al cajón", "Cuadriceps", EquipmentType.Bodyweight, LevelType.Beginner,
            "Apoya el pie por completo en el cajón y empuja con la pierna delantera sin impulsarte con el pie del suelo.",
            new[] { "Knee" });
        yield return E("Estocadas hacia atrás con mancuernas", "Cuadriceps", EquipmentType.Dumbbell, LevelType.Beginner,
            "Paso hacia atrás flexionando ambas rodillas a 90° con torso erguido. Mucho más amable con las rodillas que las estocadas frontales.",
            new[] { "Knee" });
        yield return E("Estocadas caminando con mancuernas", "Cuadriceps", EquipmentType.Dumbbell, LevelType.Intermediate,
            "Avanza dando pasos continuos y controlados, manteniendo el equilibrio del core y el empuje de la pierna delantera.",
            new[] { "Knee" });
        yield return E("Sentadilla sissy", "Cuadriceps", EquipmentType.Bodyweight, LevelType.Advanced,
            "Flexiona las rodillas desplazándolas hacia adelante con el torso inclinado hacia atrás para sobrecargar el recto femoral.",
            new[] { "Knee" });
        yield return E("Contracción de cuadríceps", "Cuadriceps", EquipmentType.Bodyweight, LevelType.Beginner,
            "Isometría sentado o acostado apretando el cuádriceps para activación neuromuscular y rehabilitación.");
        yield return E("Sentadilla con cinturón (Belt Squat)", "Cuadriceps", EquipmentType.Machine, LevelType.Beginner,
            "Carga anclada a la cadera mediante cinturón. Elimina al 100% la carga axial sobre la columna vertebral.",
            modificationTip: "Descarga completamente la columna vertebral.");
        yield return E("Sentadilla cosaca", "Cuadriceps", EquipmentType.Bodyweight, LevelType.Intermediate,
            "Desplazamiento lateral profundo flexionando una pierna y extendiendo la otra para movilidad y fuerza unilateral.",
            new[] { "Knee" });

        // ==================== GLUTEOS ====================
        yield return E("Hip thrust con barra", "Gluteos", EquipmentType.Barbell, LevelType.Intermediate,
            "Espalda alta apoyada en banco y barra sobre la pelvis con almohadilla. Empuja la cadera hacia arriba apretando los glúteos en el bloqueo.",
            new[] { "Lumbar" }, "Usa almohadilla gruesa sobre la pelvis y mantén la barbilla pegada al pecho.");
        yield return E("Hip thrust en máquina", "Gluteos", EquipmentType.Machine, LevelType.Beginner,
            "Variante guiada con respaldo y ajuste rápido. Facilita la sobrecarga progresiva sin la incomodidad de armar la barra en el piso.",
            modificationTip: "Muy recomendada para iniciación o cargas elevadas con seguridad.");
        yield return E("Puente de glúteos", "Gluteos", EquipmentType.Bodyweight, LevelType.Beginner,
            "Acostado en colchoneta con rodillas flexionadas. Eleva la pelvis empujando desde los talones y aprieta los glúteos arriba.");
        yield return E("Patada de glúteos en polea", "Gluteos", EquipmentType.Cable, LevelType.Beginner,
            "Tobillera en polea baja, torso ligeramente inclinado. Extiende la pierna hacia atrás en línea recta apretando el glúteo mayor.");
        yield return E("Abducción de cadera en máquina", "Gluteos", EquipmentType.Machine, LevelType.Beginner,
            "Sentado con almohadillas en la parte exterior de las rodillas. Abre las piernas contra la resistencia aislando el glúteo medio.");
        yield return E("Swing con kettlebell", "Gluteos", EquipmentType.Dumbbell, LevelType.Advanced,
            "Movimiento balístico de bisagra de cadera. Empuja con fuerza explosiva de glúteos e isquios proyectando la pesa al frente.",
            new[] { "Lumbar" });
        yield return E("Puente de glúteo a una pierna", "Gluteos", EquipmentType.Bodyweight, LevelType.Intermediate,
            "Puente unilateral para corregir desbalances de fuerza entre ambos glúteos sin necesidad de carga externa.");
        yield return E("Hiperextensiones a 45° para glúteo", "Gluteos", EquipmentType.Bodyweight, LevelType.Beginner,
            "Pies abiertos a 45° y espalda alta ligeramente encorvada para focalizar el esfuerzo exclusivamente en glúteos.",
            new[] { "Lumbar" }, "Redondea ligeramente la parte alta de la espalda.");
        yield return E("Peso muerto sumo con mancuerna", "Gluteos", EquipmentType.Dumbbell, LevelType.Intermediate,
            "Pies anchos apuntando hacia afuera. Desciende la mancuerna verticalmente sintiendo la carga en glúteos y aductores.",
            new[] { "Knee" });
        yield return E("Step up cruzado", "Gluteos", EquipmentType.Dumbbell, LevelType.Intermediate,
            "Subida al banco con paso cruzado para reclutar las fibras oblicuas y estabilizadoras del glúteo medio.",
            new[] { "Knee" });

        // ==================== ISQUIOTIBIALES ====================
        yield return E("Peso muerto rumano", "Isquiotibiales", EquipmentType.Barbell, LevelType.Intermediate,
            "Rodillas semi-flexionadas y empuje de cadera hacia atrás en bisagra. Desciende rozando las piernas hasta notar tensión en isquiotibiales.",
            new[] { "Lumbar" }, "Usa puente de glúteos o máquina de femoral sentado si buscas menor exigencia lumbar.");
        yield return E("Peso muerto rumano con mancuernas", "Isquiotibiales", EquipmentType.Dumbbell, LevelType.Beginner,
            "Misma mecánica de bisagra que con barra pero permitiendo un ángulo de agarre más libre y natural para hombros y muñecas.",
            new[] { "Lumbar" });
        yield return E("Camilla femoral acostado", "Isquiotibiales", EquipmentType.Machine, LevelType.Beginner,
            "Boca abajo con rodillo tras los tobillos. Flexiona las rodillas llevando los talones a los glúteos sin despegar la pelvis de la camilla.");
        yield return E("Sillón de isquiotibiales (femoral sentado)", "Isquiotibiales", EquipmentType.Machine, LevelType.Beginner,
            "Sentado con muslos fijados por la almohadilla. Flexiona hacia abajo logrando un mayor estiramiento gracias a la flexión de cadera.");
        yield return E("Curl nórdico", "Isquiotibiales", EquipmentType.Bodyweight, LevelType.Advanced,
            "Tobillos anclados y torso rígido. Desciende hacia adelante resistiendo la gravedad con fuerza excéntrica pura de isquios.");
        yield return E("Buenos días", "Isquiotibiales", EquipmentType.Barbell, LevelType.Advanced,
            "Barra en espalda alta. Flexiona la cadera hacia atrás con columna neutra sintiendo el estiramiento profundo en isquiotibiales.",
            new[] { "Lumbar" });
        yield return E("Curl femoral con pelota", "Isquiotibiales", EquipmentType.Bodyweight, LevelType.Intermediate,
            "Puente de cadera sobre pelota suiza, flexionando las rodillas para rodar el balón hacia los glúteos.");
        yield return E("Peso muerto rumano a una pierna", "Isquiotibiales", EquipmentType.Dumbbell, LevelType.Advanced,
            "Bisagra unilateral manteniendo la pelvis nivelada. Desarrolla fuerza excéntrica y estabilidad de tobillo y rodilla.",
            new[] { "Lumbar" });
        yield return E("Deslizamiento de isquiotibiales", "Isquiotibiales", EquipmentType.Bodyweight, LevelType.Intermediate,
            "En suelo resbaladizo, flexiona los talones hacia los glúteos manteniendo la pelvis elevada en puente.");
        yield return E("Curl femoral de pie en máquina", "Isquiotibiales", EquipmentType.Machine, LevelType.Beginner,
            "Aislamiento unilateral de pie para equilibrar la fuerza entre ambas piernas.");

        // ==================== PANTORRILLAS ====================
        yield return E("Gemelos de pie en máquina", "Pantorrillas", EquipmentType.Machine, LevelType.Beginner,
            "Apoyo en metatarsos con rodillas extendidas. Desciende los talones para estiramiento completo y elévate sobre las puntas de pie.",
            new[] { "Knee" });
        yield return E("Gemelos sentado en máquina (sóleo)", "Pantorrillas", EquipmentType.Machine, LevelType.Beginner,
            "Rodillas a 90° bajo la almohadilla. Al tener la rodilla flexionada, aísla el músculo sóleo de la parte inferior de la pantorrilla.");
        yield return E("Elevacion de talones en prensa", "Pantorrillas", EquipmentType.Machine, LevelType.Beginner,
            "En la plataforma de la prensa, empuja con los metatarsos manteniendo las rodillas casi bloqueadas.");
        yield return E("Elevacion de talones a una pierna", "Pantorrillas", EquipmentType.Bodyweight, LevelType.Beginner,
            "En un escalón o disco, sube con una sola pierna controlando 2 segundos de estiramiento en la parte baja.");

        // ==================== HOMBROS ====================
        yield return E("Press militar con barra", "Hombros", EquipmentType.Barbell, LevelType.Advanced,
            "De pie con agarre al ancho de hombros. Empuja la barra sobre la cabeza hasta bloquear los brazos con abdomen y glúteos activos.",
            new[] { "Shoulder" });
        yield return E("Press de hombros con mancuernas sentado", "Hombros", EquipmentType.Dumbbell, LevelType.Beginner,
            "Banco a 75°-80°. Empuja las mancuernas hacia arriba en trayectoria convergente sin chocar las pesas en la cima.",
            new[] { "Shoulder" });
        yield return E("Press militar sentado con mancuernas", "Hombros", EquipmentType.Dumbbell, LevelType.Beginner,
            "Variante sentada estricta con mancuernas. Ofrece máxima estabilidad lumbar para empujar verticalmente con sobrecarga progresiva.",
            new[] { "Shoulder" });
        yield return E("Vuelos laterales con mancuernas", "Hombros", EquipmentType.Dumbbell, LevelType.Beginner,
            "Codos semi-flexionados y torso neutro. Eleva los brazos hacia los lados hasta la altura de los hombros guiando con los codos.",
            modificationTip: "Inclina el torso 5° hacia adelante para alinear el deltoides lateral con la gravedad.");
        yield return E("Vuelos laterales en polea", "Hombros", EquipmentType.Cable, LevelType.Intermediate,
            "Polea baja a la altura de la rodilla. Otorga tensión continua desde el primer centímetro del movimiento.");
        yield return E("Vuelos posteriores (pájaros)", "Hombros", EquipmentType.Dumbbell, LevelType.Beginner,
            "Torso inclinado a 45°-90° con mancuernas. Abre los brazos hacia los lados apretando la parte trasera del hombro.",
            new[] { "Shoulder" });
        yield return E("Remo al mentón", "Hombros", EquipmentType.Barbell, LevelType.Advanced,
            "Agarre al ancho de hombros. Tracciona hacia el pecho medio guiando con los codos sin forzar las muñecas.",
            new[] { "Shoulder" });
        yield return E("Press Arnold", "Hombros", EquipmentType.Dumbbell, LevelType.Intermediate,
            "Inicia con palmas hacia el rostro y rota las muñecas al empujar hacia arriba terminando con palmas al frente.",
            new[] { "Shoulder" });
        yield return E("Elevacion frontal", "Hombros", EquipmentType.Dumbbell, LevelType.Beginner,
            "Eleva las mancuernas al frente hasta la altura de la vista controlando la bajada sin balanceo corporal.",
            new[] { "Shoulder" });
        yield return E("Press militar en máquina Smith", "Hombros", EquipmentType.Machine, LevelType.Intermediate,
            "Sentado con la barra guiada bajando por delante de la cara hasta la altura del mentón.",
            new[] { "Shoulder" });
        yield return E("Elevaciones laterales en banco inclinado", "Hombros", EquipmentType.Dumbbell, LevelType.Intermediate,
            "Acostado de lado en banco a 30° para aislar el deltoides lateral en su ángulo de mayor estiramiento.");
        yield return E("Y-Raises en banco inclinado", "Hombros", EquipmentType.Dumbbell, LevelType.Beginner,
            "Pecho apoyado en banco inclinado, eleva las mancuernas en forma de Y para trapecio inferior y salud escapular.",
            modificationTip: "Excelente para trapecio inferior y salud articular.");
        yield return E("Face pull con rotación externa", "Hombros", EquipmentType.Cable, LevelType.Beginner,
            "Polea alta con soga hacia la frente rotando las muñecas hacia atrás para manguito rotador y deltoides posterior.",
            new[] { "Shoulder" });

        // ==================== BICEPS ====================
        yield return E("Curl inclinado con mancuernas", "Biceps", EquipmentType.Dumbbell, LevelType.Intermediate,
            "Banco inclinado a 45°-60° con brazos en hiperextensión de hombro. Flexiona los codos manteniendo los brazos fijos hacia atrás para aislar la cabeza larga del bíceps sin balanceo del torso.",
            new[] { "Shoulder" }, "Si sientes molestia en la cara anterior del hombro, sube el banco a 70° o realiza curl martillo de pie.");
        yield return E("Curl Scott en banco (predicador)", "Biceps", EquipmentType.Machine, LevelType.Intermediate,
            "Brazos apoyados en la almohadilla del banco Scott. Elimina el impulso del cuerpo y enfoca la contracción en el braquial y cabeza corta.",
            new[] { "Wrist" }, "Usa barra W o agarre neutro para evitar sobrecarga en la articulación de la muñeca.");
        yield return E("Curl de bíceps con barra", "Biceps", EquipmentType.Barbell, LevelType.Beginner,
            "De pie con agarre supino al ancho de hombros. Flexiona los codos pegados al cuerpo sin balancear la espalda baja.",
            new[] { "Wrist" }, "Usa barra W si la barra recta te genera tensión en las muñecas.");
        yield return E("Curl de bíceps con mancuernas", "Biceps", EquipmentType.Dumbbell, LevelType.Beginner,
            "Alterna o realiza al unísono con supinación de muñeca al subir, llevando el meñique ligeramente hacia arriba para contracción máxima.",
            new[] { "Wrist" });
        yield return E("Curl martillo", "Biceps", EquipmentType.Dumbbell, LevelType.Beginner,
            "Palmas mirándose entre sí (agarre neutro) durante todo el recorrido. Desarrolla el braquiorradial del antebrazo y el músculo braquial.");
        yield return E("Curl martillo en polea con soga", "Biceps", EquipmentType.Cable, LevelType.Beginner,
            "Agarre de soga en polea baja con palmas enfrentadas. Proporciona tensión constante para braquial y antebrazos sin puntos muertos.");
        yield return E("Curl de bíceps en cable", "Biceps", EquipmentType.Cable, LevelType.Beginner,
            "Polea baja con barra recta o soga con tensión uniforme durante todo el rango de movimiento.");
        yield return E("Curl de concentración", "Biceps", EquipmentType.Dumbbell, LevelType.Beginner,
            "Sentado con codo apoyado en el interior del muslo. Permite una contracción estricta y control milimétrico de la fase excéntrica.");
        yield return E("Curl araña en banco inclinado", "Biceps", EquipmentType.Dumbbell, LevelType.Intermediate,
            "Pecho apoyado en banco inclinado a 45° con brazos colgando en vertical. Aísla el bíceps en el punto de máxima flexión sin trampas.");
        yield return E("Curl zottman", "Biceps", EquipmentType.Dumbbell, LevelType.Beginner,
            "Sube con palmas hacia arriba (supino) y gira las muñecas arriba para bajar con palmas hacia abajo (prono) trabajando bíceps y antebrazos.",
            new[] { "Wrist" });
        yield return E("Curl 21 con barra", "Biceps", EquipmentType.Barbell, LevelType.Intermediate,
            "Serie avanzada de bombeo: 7 repeticiones en la mitad inferior, 7 en la mitad superior y 7 con recorrido completo.",
            new[] { "Wrist" });

        // ==================== TRICEPS ====================
        yield return E("Press francés con barra (rompecráneos)", "Triceps", EquipmentType.Barbell, LevelType.Advanced,
            "Acostado en banco con barra recta o W. Flexiona los codos llevando la barra hacia la frente o coronilla manteniendo los codos cerrados.",
            new[] { "Wrist" }, "Usa barra W para reducir el estrés articular en las muñecas y codos.");
        yield return E("Press francés en banco plano con barra W", "Triceps", EquipmentType.Barbell, LevelType.Intermediate,
            "El agarre angulado de la barra W descarga la tensión articular de las muñecas permitiendo trabajar la cabeza larga del tríceps con comodidad.",
            new[] { "Wrist" });
        yield return E("Extensiones de tríceps en polea alta", "Triceps", EquipmentType.Cable, LevelType.Beginner,
            "De pie frente a la polea alta con barra recta o V. Empuja hacia abajo bloqueando los codos a los costados del cuerpo.");
        yield return E("Extensiones de tríceps en polea con soga", "Triceps", EquipmentType.Cable, LevelType.Beginner,
            "Tracciona la soga hacia abajo y separa los extremos al final del movimiento para activar con intensidad la cabeza lateral del tríceps.",
            new[] { "Wrist" });
        yield return E("Extensiones tras nuca en polea con soga", "Triceps", EquipmentType.Cable, LevelType.Intermediate,
            "De espaldas a la polea en posición de estocada. Extiende los brazos hacia adelante colocando la cabeza larga del tríceps en estiramiento.",
            new[] { "Shoulder" });
        yield return E("Press cerrado", "Triceps", EquipmentType.Barbell, LevelType.Intermediate,
            "En banco plano con manos a un ancho de hombros. Desciende con codos pegados al torso transfiriendo el empuje al tríceps.",
            new[] { "Wrist", "Shoulder" });
        yield return E("Extension de triceps sobre la cabeza", "Triceps", EquipmentType.Cable, LevelType.Intermediate,
            "Con polea o mancuerna por encima de la cabeza para máximo estiramiento de la porción larga del tríceps.",
            new[] { "Shoulder" });
        yield return E("Fondos asistidos", "Triceps", EquipmentType.Machine, LevelType.Intermediate,
            "Con plataforma de compensación. Mantén el torso vertical y codos hacia atrás para aislar tríceps.",
            new[] { "Shoulder" });
        yield return E("Patada de triceps", "Triceps", EquipmentType.Dumbbell, LevelType.Beginner,
            "Torso inclinado y brazo paralelo al piso. Extiende el antebrazo hacia atrás apretando el tríceps en el bloqueo.",
            new[] { "Wrist" });
        yield return E("Extension francesa con mancuerna sentado", "Triceps", EquipmentType.Dumbbell, LevelType.Intermediate,
            "Mancuerna tomada con ambas manos por detrás de la cabeza en banco con respaldo corto.",
            new[] { "Shoulder", "Wrist" });
        yield return E("Fondos en paralelas para triceps", "Triceps", EquipmentType.Bodyweight, LevelType.Intermediate,
            "Torso erguido y codos pegados al cuerpo descendiendo a 90°.",
            new[] { "Shoulder", "Wrist" }, "Torso erguido y codos pegados al cuerpo.");

        // ==================== CORE ====================
        yield return E("Plancha frontal", "Core", EquipmentType.Bodyweight, LevelType.Beginner,
            "Apoyo en antebrazos y puntas de pies. Mantén una línea recta desde hombros a talones con glúteos y abdomen en tensión máxima.");
        yield return E("Plancha lateral", "Core", EquipmentType.Bodyweight, LevelType.Beginner,
            "De costado sobre un antebrazo. Eleva la cadera manteniendo el cuerpo alineado para trabajar oblicuos y cuadrado lumbar.");
        yield return E("Abdominales crunch en colchoneta", "Core", EquipmentType.Bodyweight, LevelType.Beginner,
            "Rodillas flexionadas y lumbares apoyadas. Eleva los omóplatos flexionando la columna torácica sin forzar el cuello.");
        yield return E("Crunch en cable", "Core", EquipmentType.Cable, LevelType.Intermediate,
            "De rodillas frente a la polea con soga tras la cabeza. Flexiona el torso hacia las rodillas apretando los abdominales.");
        yield return E("Rueda abdominal (Ab wheel)", "Core", EquipmentType.Bodyweight, LevelType.Advanced,
            "De rodillas rodando la rueda al frente. Mantén la pelvis en retroversión sin arquear la zona lumbar y regresa con el core.",
            new[] { "Lumbar", "Shoulder" }, "Evita hiperextender la zona lumbar.");
        yield return E("Elevación de rodillas colgado en barra", "Core", EquipmentType.Bodyweight, LevelType.Advanced,
            "Colgado de la barra con agarre firme. Eleva las rodillas hacia el pecho flexionando la pelvis para activar los abdominales inferiores.",
            new[] { "Shoulder" });
        yield return E("Elevacion de piernas en paralelas", "Core", EquipmentType.Bodyweight, LevelType.Intermediate,
            "En la estación de fondos apoyando antebrazos. Eleva las piernas flexionando la cadera con control sin balanceos.",
            new[] { "Shoulder" });
        yield return E("Dead bug", "Core", EquipmentType.Bodyweight, LevelType.Beginner,
            "Boca arriba extendiendo brazo y pierna opuesta mientras mantienes la zona lumbar completamente aplastada contra el suelo.");
        yield return E("Bird dog", "Core", EquipmentType.Bodyweight, LevelType.Beginner,
            "En cuadrupedia, extiende brazo y pierna contraria en línea con el torso para estabilidad de core y espalda baja.",
            new[] { "Lumbar" });
        yield return E("Pallof press", "Core", EquipmentType.Cable, LevelType.Beginner,
            "De pie perpendicular a la polea a nivel del esternón. Empuja las manos al frente resistiendo la rotación del torso.");
        yield return E("Russian twist con peso", "Core", EquipmentType.Dumbbell, LevelType.Intermediate,
            "Sentado en V con pies elevados o apoyados, gira el torso llevando el disco o mancuerna a ambos lados del cuerpo.",
            new[] { "Lumbar" });
        yield return E("Hollow body hold", "Core", EquipmentType.Bodyweight, LevelType.Intermediate,
            "Postura gimnástica boca arriba con lumbares pegadas al suelo y extremidades extendidas a pocos centímetros del piso.",
            new[] { "Lumbar" });

        // ==================== CARDIO ====================
        yield return E("Caminata en cinta", "Cardio", EquipmentType.Machine, LevelType.Beginner,
            "Caminata continua a paso ligero con inclinación moderada (4%-10%) para trabajo aeróbico seguro de bajo impacto articular.",
            new[] { "Knee" });
        yield return E("Bicicleta fija", "Cardio", EquipmentType.Machine, LevelType.Beginner,
            "Pedaleo continuo o por intervalos con resistencia graduada. Cero impacto sobre las articulaciones de rodilla y cadera.");
        yield return E("Eliptico", "Cardio", EquipmentType.Machine, LevelType.Beginner,
            "Movimiento fluido sincronizado de brazos y piernas sin fase de impacto contra el suelo, ideal para atletas con limitaciones.",
            new[] { "Knee" });
        yield return E("Bicicleta de aire (Air Bike / Assault Bike)", "Cardio", EquipmentType.Machine, LevelType.Intermediate,
            "Cardio de alta intensidad de cuerpo entero donde la resistencia por viento aumenta exponencialmente con el esfuerzo del atleta.");
        yield return E("Remo ergometro", "Cardio", EquipmentType.Machine, LevelType.Intermediate,
            "Tracción fluida de piernas, cadera y brazos. Desarrolla capacidad aeróbica y resistencia en toda la cadena posterior.",
            new[] { "Lumbar" });
        yield return E("Escaladora", "Cardio", EquipmentType.Machine, LevelType.Intermediate,
            "Subida continua de escalones demandando trabajo cardiovascular intenso y activación de glúteos y pantorrillas.",
            new[] { "Knee" });
        yield return E("Cuerda de saltar", "Cardio", EquipmentType.Bodyweight, LevelType.Intermediate,
            "Saltos rítmicos sobre metatarsos para coordinación, agilidad y quema calórica con impacto pliométrico ligero.",
            new[] { "Knee" });
        yield return E("Burpees", "Cardio", EquipmentType.Bodyweight, LevelType.Intermediate,
            "Secuencia de flexión de pecho, recogida de piernas y salto vertical explosivo para acondicionamiento metabólico total.",
            new[] { "Knee", "Wrist" });
        yield return E("Mountain climbers", "Cardio", EquipmentType.Bodyweight, LevelType.Beginner,
            "En posición de plancha alta, lleva las rodillas alternadas al pecho a ritmo rápido manteniendo el core firme.",
            new[] { "Wrist" });
        yield return E("Empuje de trineo (Sled push)", "Cardio", EquipmentType.Machine, LevelType.Intermediate,
            "Empuje de carga pesada sobre pista con torso inclinado. Fuerza de empuje de piernas sin sobrecarga excéntrica.",
            new[] { "Knee" });
    }

    private static IEnumerable<RoutineSeed> RoutineDefinitions()
    {
        yield return R("Hipertrofia inicial", GoalType.GainMuscle, LevelType.Beginner, 3,
            D("Tren superior", X("Press de pecho en maquina"), X("Jalon al pecho"), X("Elevaciones laterales"), X("Plancha frontal")),
            D("Piernas y gluteos", X("Prensa de piernas"), X("Puente de gluteos"), X("Curl femoral acostado"), X("Pallof press")),
            D("Fuerza general", X("Press inclinado con mancuernas"), X("Remo sentado en cable"), X("Zancada hacia atras"), X("Jalon de triceps en polea")));

        yield return R("Hipertrofia intermedia", GoalType.GainMuscle, LevelType.Intermediate, 4,
            D("Pecho y triceps", X("Press plano con barra"), X("Press inclinado con mancuernas"), X("Cruces en poleas para pecho"), X("Extensiones de tríceps en polea alta")),
            D("Espalda y biceps", X("Jalon al pecho"), X("Remo sentado en cable"), X("Remo con mancuerna a una mano (serrucho)"), X("Curl martillo")),
            D("Piernas", X("Hack squat"), X("Hip thrust con barra"), X("Curl femoral sentado"), X("Elevacion de pantorrillas")),
            D("Hombros y core", X("Press de hombros con mancuernas"), X("Elevaciones laterales"), X("Vuelo posterior"), X("Crunch en cable")));

        yield return R("Hipertrofia avanzada", GoalType.GainMuscle, LevelType.Advanced, 5,
            D("Pecho", X("Press plano con barra", 4, 6, 10), X("Press inclinado con mancuernas"), X("Aperturas con mancuernas")),
            D("Espalda", X("Remo con barra", 4, 6, 10), X("Dominadas asistidas"), X("Jalon con brazos rectos")),
            D("Piernas anterior", X("Sentadilla trasera", 4, 6, 10), X("Prensa de piernas"), X("Extension de piernas")),
            D("Piernas posterior", X("Peso muerto rumano", 4, 6, 10), X("Hip thrust con barra"), X("Curl femoral acostado")),
            D("Brazos y hombros", X("Press militar con barra"), X("Curl de bíceps con barra"), X("Press francés con barra (rompecráneos)"), X("Pallof press")));

        yield return R("Definicion inicial", GoalType.LoseWeight, LevelType.Beginner, 3,
            D("Circuito superior", X("Press de pecho en maquina", 3, 10, 15, 45), X("Remo sentado en cable", 3, 10, 15, 45), X("Elevaciones laterales", 3, 12, 15, 45), X("Bicicleta fija", 3, 10, 15, 30)),
            D("Circuito inferior", X("Prensa de piernas", 3, 10, 15, 45), X("Puente de gluteos", 3, 12, 15, 45), X("Curl femoral acostado", 3, 10, 15, 45), X("Caminata en cinta", 3, 15, 20, 30)),
            D("Cuerpo completo", X("Flexiones de brazos", 3, 8, 15, 45), X("Jalon al pecho", 3, 10, 15, 45), X("Zancada hacia atras", 3, 8, 12, 45), X("Plancha frontal", 3, 20, 40, 30)));

        yield return R("Definicion intermedia", GoalType.LoseWeight, LevelType.Intermediate, 4,
            D("Empuje", X("Press plano con barra"), X("Press de hombros con mancuernas"), X("Extensiones de tríceps en polea alta"), X("Eliptico", 3, 12, 18, 30)),
            D("Traccion", X("Jalon al pecho"), X("Remo sentado en cable"), X("Curl martillo"), X("Caminata en cinta", 3, 15, 20, 30)),
            D("Piernas", X("Hack squat"), X("Hip thrust con barra"), X("Curl femoral sentado"), X("Bicicleta fija", 3, 12, 18, 30)),
            D("Metabolico", X("Flexiones de brazos", 3, 10, 15, 30), X("Remo con mancuerna a una mano (serrucho)", 3, 10, 12, 30), X("Pallof press", 3, 10, 15, 30), X("Escaladora", 3, 10, 15, 30)));

        yield return R("Definicion avanzada", GoalType.LoseWeight, LevelType.Advanced, 5,
            D("Pecho y core", X("Press plano con barra", 4, 6, 10), X("Cruces en poleas para pecho"), X("Crunch en cable"), X("Cuerda de saltar", 3, 20, 30, 30)),
            D("Espalda", X("Remo con barra", 4, 6, 10), X("Dominadas asistidas"), X("Jalon con brazos rectos"), X("Remo ergometro", 3, 10, 15, 30)),
            D("Cuadriceps", X("Sentadilla frontal", 4, 6, 10), X("Prensa de piernas"), X("Subida al cajon"), X("Bicicleta fija", 3, 12, 18, 30)),
            D("Gluteos e isquios", X("Peso muerto rumano", 4, 6, 10), X("Hip thrust con barra"), X("Curl femoral sentado"), X("Eliptico", 3, 12, 18, 30)),
            D("Acondicionamiento", X("Press de hombros con mancuernas"), X("Curl martillo"), X("Extensiones de tríceps en polea alta"), X("Escaladora", 4, 10, 15, 30)));

        yield return R("Resistencia inicial", GoalType.Endurance, LevelType.Beginner, 2,
            D("Cardio base", X("Bicicleta fija", 3, 15, 25, 45), X("Caminata en cinta", 3, 15, 25, 45), X("Plancha frontal", 3, 20, 30, 30)),
            D("Circuito general", X("Press de pecho en maquina", 3, 12, 15, 45), X("Prensa de piernas", 3, 12, 15, 45), X("Jalon al pecho", 3, 12, 15, 45), X("Eliptico", 3, 15, 25, 45)));

        yield return R("Resistencia intermedia", GoalType.Endurance, LevelType.Intermediate, 3,
            D("Aerobico", X("Eliptico", 4, 12, 20, 30), X("Caminata en cinta", 4, 15, 25, 30), X("Pallof press", 3, 12, 15, 30)),
            D("Fuerza resistente", X("Press inclinado con mancuernas", 3, 12, 15, 45), X("Remo sentado en cable", 3, 12, 15, 45), X("Zancada hacia atras", 3, 10, 14, 45), X("Bicicleta fija", 3, 15, 25, 30)),
            D("Intervalos", X("Remo ergometro", 5, 8, 12, 30), X("Subida al cajon", 3, 10, 14, 30), X("Flexiones de brazos", 3, 10, 15, 30), X("Plancha lateral", 3, 20, 35, 30)));

        yield return R("Resistencia avanzada", GoalType.Endurance, LevelType.Advanced, 4,
            D("Cardio continuo", X("Remo ergometro", 5, 10, 15, 30), X("Eliptico", 4, 15, 25, 30), X("Plancha frontal", 4, 30, 45, 30)),
            D("Circuito superior", X("Press plano con barra", 4, 10, 15, 30), X("Jalon al pecho", 4, 10, 15, 30), X("Press de hombros con mancuernas", 3, 12, 15, 30), X("Cuerda de saltar", 4, 20, 30, 30)),
            D("Circuito inferior", X("Prensa de piernas", 4, 12, 15, 30), X("Hip thrust con barra", 4, 10, 15, 30), X("Curl femoral sentado", 3, 12, 15, 30), X("Escaladora", 4, 10, 15, 30)),
            D("Potencia y core", X("Swing con kettlebell", 4, 12, 20, 30), X("Subida al cajon", 4, 10, 15, 30), X("Pallof press", 4, 12, 15, 30), X("Bicicleta fija", 4, 15, 25, 30)));

        yield return R("Mantenimiento inicial", GoalType.Maintain, LevelType.Beginner, 2,
            D("Cuerpo completo A", X("Press de pecho en maquina"), X("Jalon al pecho"), X("Prensa de piernas"), X("Plancha frontal")),
            D("Cuerpo completo B", X("Press inclinado con mancuernas"), X("Remo sentado en cable"), X("Puente de gluteos"), X("Bicicleta fija", 3, 12, 20, 45)));

        yield return R("Mantenimiento intermedio", GoalType.Maintain, LevelType.Intermediate, 3,
            D("Superior", X("Press plano con barra"), X("Remo sentado en cable"), X("Press de hombros con mancuernas"), X("Curl martillo")),
            D("Inferior", X("Hack squat"), X("Hip thrust con barra"), X("Curl femoral sentado"), X("Pallof press")),
            D("Mixto", X("Press inclinado con mancuernas"), X("Jalon al pecho"), X("Zancada hacia atras"), X("Extensiones de tríceps en polea alta")));

        yield return R("Mantenimiento avanzado", GoalType.Maintain, LevelType.Advanced, 4,
            D("Pecho y hombros", X("Press plano con barra", 4, 6, 10), X("Press inclinado con mancuernas"), X("Elevaciones laterales"), X("Extensiones de tríceps en polea alta")),
            D("Espalda y brazos", X("Remo con barra", 4, 6, 10), X("Dominadas asistidas"), X("Curl de bíceps con barra"), X("Curl martillo")),
            D("Piernas", X("Sentadilla trasera", 4, 6, 10), X("Peso muerto rumano", 4, 6, 10), X("Hip thrust con barra"), X("Curl femoral acostado")),
            D("Core y cardio", X("Crunch en cable"), X("Pallof press"), X("Eliptico", 4, 15, 25, 45), X("Plancha lateral")));
    }

    private static ExerciseSeed E(
        string name,
        string muscleGroup,
        EquipmentType equipment,
        LevelType level,
        string description,
        string[]? contraindications = null,
        string? modificationTip = null) =>
        new(name, muscleGroup, equipment, level, description, contraindications ?? Array.Empty<string>(), modificationTip);

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
        string Description,
        string[] Contraindications,
        string? ModificationTip);

    private sealed record TipSeed(LimitationType Type, string Title, string Content, TipType TipType);

    private sealed record RoutineSeed(string Name, GoalType Goal, LevelType Level, int DaysPerWeek, DaySeed[] Days);

    private sealed record DaySeed(string Name, RoutineExerciseSeed[] Exercises);

    private sealed record RoutineExerciseSeed(string Name, int Sets, int RepsMin, int RepsMax, int RestSeconds);
}
