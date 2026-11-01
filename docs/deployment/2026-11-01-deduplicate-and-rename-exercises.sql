/* ============================================================================== */
/* Migración Segura en Supabase: Desduplicación y Limpieza Integral del Catálogo */
/* Fecha: 2026-11-01 */
/* Objetivo: */
/* 1. Reasignar series históricas (workout_sets) al ejercicio canónico. */
/* 2. Reasignar rutinas (routine_exercises) evitando duplicados por día. */
/* 3. Eliminar ejercicios duplicados y obsoletos de public.exercises. */
/* 4. Renombrar a nombres definitivos solicitados por el usuario. */
/* 5. Sincronizar alias multilingües para búsqueda Fuse.js. */
/* ============================================================================== */

BEGIN;

/* 1. Función auxiliar temporal para fusionar de forma segura */
CREATE OR REPLACE FUNCTION pg_temp.merge_and_cleanup_exercise(
    p_canonical_name text,
    p_duplicate_names text[]
) RETURNS void AS $func$
DECLARE
    v_canonical_id uuid;
    v_dup_id uuid;
    v_dup_name text;
    v_routine_day_id uuid;
BEGIN
/* 1.1 Buscar ID canónico */
    SELECT id INTO v_canonical_id
    FROM public.exercises
    WHERE name = p_canonical_name
    LIMIT 1;

/* Si no existe con nombre canónico pero existe uno de los duplicados/legacy, renombramos el primero a canónico */
    IF v_canonical_id IS NULL THEN
        SELECT id INTO v_canonical_id
        FROM public.exercises
        WHERE name = ANY(p_duplicate_names)
        ORDER BY id
        LIMIT 1;

        IF v_canonical_id IS NOT NULL THEN
            UPDATE public.exercises
            SET name = p_canonical_name
            WHERE id = v_canonical_id;
        END IF;
    END IF;

/* Si no existe ninguno de los registros, salir */
    IF v_canonical_id IS NULL THEN
        RETURN;
    END IF;

/* 1.2 Fusionar cualquier otra fila idéntica que ya se llame igual a p_canonical_name */
    FOR v_dup_id IN
        SELECT id FROM public.exercises
        WHERE name = p_canonical_name AND id != v_canonical_id
    LOOP
/* Reasignar workout_sets evitando colisiones en (session_id, exercise_id, set_number) */
        WITH session_max AS (
            SELECT session_id, COALESCE(MAX(set_number), 0) AS max_set
            FROM public.workout_sets
            WHERE exercise_id = v_canonical_id
            GROUP BY session_id
        ),
        numbered_dup_sets AS (
            SELECT ws.id,
                   COALESCE(sm.max_set, 0) + ROW_NUMBER() OVER (
                       PARTITION BY ws.session_id 
                       ORDER BY ws.set_number, ws.created_at
                   ) AS new_set_number
            FROM public.workout_sets ws
            LEFT JOIN session_max sm ON sm.session_id = ws.session_id
            WHERE ws.exercise_id = v_dup_id
        )
        UPDATE public.workout_sets ws
        SET exercise_id = v_canonical_id,
            set_number = nds.new_set_number
        FROM numbered_dup_sets nds
        WHERE ws.id = nds.id;

        FOR v_routine_day_id IN
            SELECT routine_day_id FROM public.routine_exercises WHERE exercise_id = v_dup_id
        LOOP
            IF EXISTS (
                SELECT 1 FROM public.routine_exercises
                WHERE routine_day_id = v_routine_day_id AND exercise_id = v_canonical_id
            ) THEN
                DELETE FROM public.routine_exercises
                WHERE routine_day_id = v_routine_day_id AND exercise_id = v_dup_id;
            ELSE
                UPDATE public.routine_exercises
                SET exercise_id = v_canonical_id
                WHERE routine_day_id = v_routine_day_id AND exercise_id = v_dup_id;
            END IF;
        END LOOP;

        DELETE FROM public.exercises WHERE id = v_dup_id;
    END LOOP;

/* 1.3 Fusionar cada nombre duplicado */
    FOREACH v_dup_name IN ARRAY p_duplicate_names
    LOOP
        FOR v_dup_id IN
            SELECT id FROM public.exercises
            WHERE name = v_dup_name AND id != v_canonical_id
        LOOP
/* Reasignar workout_sets evitando colisiones en (session_id, exercise_id, set_number) */
        WITH session_max AS (
            SELECT session_id, COALESCE(MAX(set_number), 0) AS max_set
            FROM public.workout_sets
            WHERE exercise_id = v_canonical_id
            GROUP BY session_id
        ),
        numbered_dup_sets AS (
            SELECT ws.id,
                   COALESCE(sm.max_set, 0) + ROW_NUMBER() OVER (
                       PARTITION BY ws.session_id 
                       ORDER BY ws.set_number, ws.created_at
                   ) AS new_set_number
            FROM public.workout_sets ws
            LEFT JOIN session_max sm ON sm.session_id = ws.session_id
            WHERE ws.exercise_id = v_dup_id
        )
        UPDATE public.workout_sets ws
        SET exercise_id = v_canonical_id,
            set_number = nds.new_set_number
        FROM numbered_dup_sets nds
        WHERE ws.id = nds.id;

            FOR v_routine_day_id IN
                SELECT routine_day_id FROM public.routine_exercises WHERE exercise_id = v_dup_id
            LOOP
                IF EXISTS (
                    SELECT 1 FROM public.routine_exercises
                    WHERE routine_day_id = v_routine_day_id AND exercise_id = v_canonical_id
                ) THEN
                    DELETE FROM public.routine_exercises
                    WHERE routine_day_id = v_routine_day_id AND exercise_id = v_dup_id;
                ELSE
                    UPDATE public.routine_exercises
                    SET exercise_id = v_canonical_id
                    WHERE routine_day_id = v_routine_day_id AND exercise_id = v_dup_id;
                END IF;
            END LOOP;

            DELETE FROM public.exercises WHERE id = v_dup_id;
        END LOOP;
    END LOOP;
END;
$func$ LANGUAGE plpgsql;

/* 2. Ejecutar fusiones y depuraciones */
SELECT pg_temp.merge_and_cleanup_exercise('Press plano con barra', ARRAY['Press banca con barra', 'Press banca plano', 'Press declinado con barra']);
SELECT pg_temp.merge_and_cleanup_exercise('Press plano con mancuernas', ARRAY['Press banca con mancuernas', 'Press plano mancuernas']);
SELECT pg_temp.merge_and_cleanup_exercise('Press inclinado con mancuernas', ARRAY['Press inclinado con mancuernas agarre neutro']);
SELECT pg_temp.merge_and_cleanup_exercise('Cruces en polea para pecho', ARRAY['Cruces en poleas para pecho', 'Cruce de cables']);
SELECT pg_temp.merge_and_cleanup_exercise('Peck Deck', ARRAY['Aperturas en máquina (Pec Deck)', 'Aperturas en maquina (Pec Deck)', 'Pec Deck']);
SELECT pg_temp.merge_and_cleanup_exercise('Flexiones de brazos', ARRAY['Flexiones de pecho (lagartijas)', 'Flexiones con deficit', 'Flexiones con déficit']);
SELECT pg_temp.merge_and_cleanup_exercise('Jalón al pecho en polea', ARRAY['Jalon al pecho', 'Jalón al pecho']);
SELECT pg_temp.merge_and_cleanup_exercise('Remo en polea baja', ARRAY['Remo en polea baja (Remo Gironda)', 'Remo sentado en cable', 'Remo en polea baja con agarre estrecho (Remo Gironda)', 'Remo en polea baja agarre neutro', 'Remo en polea baja con agarre neutro', 'Remo Gironda']);
SELECT pg_temp.merge_and_cleanup_exercise('Pullover en polea alta con soga', ARRAY['Jalón con brazos rectos', 'Jalon con brazos rectos', 'Pullover en polea alta']);
SELECT pg_temp.merge_and_cleanup_exercise('Face pull en polea alta', ARRAY['Face pull', 'Face pull con rotacion externa', 'Face pull con rotación externa']);
SELECT pg_temp.merge_and_cleanup_exercise('Remo con mancuerna a una mano', ARRAY['Remo con mancuerna a una mano (serrucho)', 'Remo a una mano']);
SELECT pg_temp.merge_and_cleanup_exercise('Dominadas libres', ARRAY['Dominadas libres (peso corporal)', 'Dominadas']);
SELECT pg_temp.merge_and_cleanup_exercise('Sillón de cuadríceps', ARRAY['Contracción de cuadríceps', 'Contraccion de cuadriceps', 'Extension de piernas', 'Extensión de piernas', 'Sillón de cuadríceps (extensiones)', 'Sillon de cuadriceps (extensiones)', 'Sillon de cuadriceps']);
SELECT pg_temp.merge_and_cleanup_exercise('Sentadilla Hack', ARRAY['Hack squat']);
SELECT pg_temp.merge_and_cleanup_exercise('Prensa a 45°', ARRAY['Prensa de piernas', 'Prensa 45 grados']);
SELECT pg_temp.merge_and_cleanup_exercise('Sentadilla con cinturón', ARRAY['Sentadilla con cinturón (Belt Squat)', 'Sentadilla con cinturon (Belt squat)']);
SELECT pg_temp.merge_and_cleanup_exercise('Subidas al cajón', ARRAY['Subida al cajon', 'Subida al cajón']);
SELECT pg_temp.merge_and_cleanup_exercise('Estocadas hacia atrás con mancuernas', ARRAY['Zancada hacia atras', 'Zancadas hacia atras']);
SELECT pg_temp.merge_and_cleanup_exercise('Estocadas caminando con mancuernas', ARRAY['Zancadas caminando']);
SELECT pg_temp.merge_and_cleanup_exercise('Puente de glúteos en colchoneta', ARRAY['Puente de gluteos', 'Puente de glúteos', 'Puente de glúteo a una pierna', 'Puente de gluteo a una pierna']);
SELECT pg_temp.merge_and_cleanup_exercise('Hiperextensiones a 45° para glúteo', ARRAY['Hiperextensiones a 45 grados para gluteo']);
SELECT pg_temp.merge_and_cleanup_exercise('Step up cruzado en banco', ARRAY['Step up cruzado']);
SELECT pg_temp.merge_and_cleanup_exercise('Camilla femoral', ARRAY['Camilla femoral acostado', 'Curl femoral acostado', 'Curl femoral con pelota', 'Deslizamiento de isquiotibiales']);
SELECT pg_temp.merge_and_cleanup_exercise('Sillón femoral', ARRAY['Sillón de isquiotibiales (femoral sentado)', 'Sillon de isquiotibiales (femoral sentado)', 'Curl femoral sentado', 'Curl femoral de pie en máquina', 'Curl femoral de pie en maquina', 'Curl femoral parado']);
SELECT pg_temp.merge_and_cleanup_exercise('Peso muerto rumano con barra', ARRAY['Peso muerto rumano']);
SELECT pg_temp.merge_and_cleanup_exercise('Buenos días con barra', ARRAY['Buenos días', 'Buenos dias']);
SELECT pg_temp.merge_and_cleanup_exercise('Gemelos de pie en máquina', ARRAY['Elevacion de pantorrillas', 'Elevación de pantorrillas']);
SELECT pg_temp.merge_and_cleanup_exercise('Gemelos sentado en máquina', ARRAY['Gemelos sentado en máquina (sóleo)', 'Elevacion de pantorrillas sentado', 'Elevación de pantorrillas sentado']);
SELECT pg_temp.merge_and_cleanup_exercise('Gemelos en prensa', ARRAY['Elevacion de talones en prensa', 'Elevación de talones en prensa']);
SELECT pg_temp.merge_and_cleanup_exercise('Gemelos a una pierna con peso corporal', ARRAY['Elevacion de talones a una pierna', 'Elevación de talones a una pierna']);
SELECT pg_temp.merge_and_cleanup_exercise('Press de hombros con mancuernas sentado', ARRAY['Press de hombros con mancuernas', 'Press militar sentado con mancuernas']);
SELECT pg_temp.merge_and_cleanup_exercise('Press militar en máquina Smith', ARRAY['Press militar en maquina Smith']);
SELECT pg_temp.merge_and_cleanup_exercise('Vuelos laterales con mancuernas', ARRAY['Elevaciones laterales']);
SELECT pg_temp.merge_and_cleanup_exercise('Vuelos laterales en polea', ARRAY['Elevacion lateral en cable']);
SELECT pg_temp.merge_and_cleanup_exercise('Vuelos posteriores', ARRAY['Vuelos posteriores (pájaros)', 'Vuelo posterior']);
SELECT pg_temp.merge_and_cleanup_exercise('Vuelos frontales con mancuernas', ARRAY['Elevacion frontal', 'Elevación frontal']);
SELECT pg_temp.merge_and_cleanup_exercise('Remo al mentón con barra', ARRAY['Remo al mentón', 'Remo al menton']);
SELECT pg_temp.merge_and_cleanup_exercise('Curl con mancuernas', ARRAY['Curl de concentración', 'Curl de concentracion', 'Curl de bíceps con mancuernas', 'Curl de biceps con mancuernas']);
SELECT pg_temp.merge_and_cleanup_exercise('Curl Scott con barra', ARRAY['Curl Scott en banco (predicador)', 'Curl predicador']);
SELECT pg_temp.merge_and_cleanup_exercise('Curl Scott con mancuernas', ARRAY['Curl Predicadora', 'Curl predicadora']);
SELECT pg_temp.merge_and_cleanup_exercise('Curl de bíceps en polea', ARRAY['Curl de bíceps en cable', 'Curl de biceps en cable', 'Curl en polea baja']);
SELECT pg_temp.merge_and_cleanup_exercise('Press francés con barra W', ARRAY['Press francés con barra W (rompecráneos)', 'Rompecraneos', 'Rompecráneos', 'Press francés con barra (rompecráneos)', 'Press frances con barra (rompecraneos)', 'Press francés en banco plano con barra W']);
SELECT pg_temp.merge_and_cleanup_exercise('Extensiones de tríceps en polea alta', ARRAY['Extensiones de tríceps en polea alta (barra)', 'Extensiones de tríceps en polea alta', 'Extensiones de triceps en polea alta', 'Jalon de triceps en polea']);
SELECT pg_temp.merge_and_cleanup_exercise('Extensiones de tríceps en polea con soga', ARRAY['Extension de triceps en polea con cuerda']);
SELECT pg_temp.merge_and_cleanup_exercise('Extensiones tras nuca en polea con soga', ARRAY['Extension de triceps sobre la cabeza']);
SELECT pg_temp.merge_and_cleanup_exercise('Extensiones tras nuca con mancuerna', ARRAY['Extensiones tras nuca con mancuerna (copa)', 'Extension francesa con mancuerna sentado']);
SELECT pg_temp.merge_and_cleanup_exercise('Press cerrado con barra', ARRAY['Press cerrado']);
SELECT pg_temp.merge_and_cleanup_exercise('Fondos en paralelas para tríceps', ARRAY['Fondos en paralelas para triceps']);
SELECT pg_temp.merge_and_cleanup_exercise('Fondos asistidos en máquina', ARRAY['Fondos asistidos']);
SELECT pg_temp.merge_and_cleanup_exercise('Patada de tríceps con mancuerna', ARRAY['Patada de triceps']);
SELECT pg_temp.merge_and_cleanup_exercise('Crunch en polea con soga', ARRAY['Crunch en cable', 'Crunch abdominal en polea alta']);
SELECT pg_temp.merge_and_cleanup_exercise('Press Pallof en polea', ARRAY['Pallof press']);
SELECT pg_temp.merge_and_cleanup_exercise('Rueda abdominal', ARRAY['Rueda abdominal (Ab Roller)', 'Rueda abdominal (Ab wheel)']);
SELECT pg_temp.merge_and_cleanup_exercise('Elevación de rodillas colgado en barra', ARRAY['Elevacion de rodillas colgado']);
SELECT pg_temp.merge_and_cleanup_exercise('Elevación de piernas en paralelas', ARRAY['Elevacion de piernas en paralelas']);
SELECT pg_temp.merge_and_cleanup_exercise('Caminata inclinada en cinta', ARRAY['Caminata en cinta']);
SELECT pg_temp.merge_and_cleanup_exercise('Remoergómetro', ARRAY['Remoergómetro (Concept 2)', 'Remo ergometro', 'Remo ergómetro']);
SELECT pg_temp.merge_and_cleanup_exercise('Escaladora', ARRAY['Escaladora (StairMaster)', 'Escaladora']);
SELECT pg_temp.merge_and_cleanup_exercise('Bicicleta de aire', ARRAY['Bicicleta de aire (Air Bike / Assault Bike)']);
SELECT pg_temp.merge_and_cleanup_exercise('Empuje de trineo', ARRAY['Empuje de trineo (Sled push)']);

/* 3. Actualizar alias multilingües enriquecidos para búsqueda */
UPDATE public.exercises SET aliases = ARRAY['bench press', 'barbell bench press', 'press banca', 'banca plana', 'pecho plano', 'pecho']::text[] WHERE name = 'Press plano con barra';
UPDATE public.exercises SET aliases = ARRAY['dumbbell bench press', 'db bench press', 'press banca con mancuernas', 'pecho plano mancuernas']::text[] WHERE name = 'Press plano con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['incline dumbbell press', 'incline db press', 'press inclinado', 'pecho alto']::text[] WHERE name = 'Press inclinado con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['smith machine incline press', 'incline smith press', 'press inclinado smith']::text[] WHERE name = 'Press inclinado en máquina Smith';
UPDATE public.exercises SET aliases = ARRAY['chest press machine', 'machine chest press', 'press maquina pecho', 'maquina pecho']::text[] WHERE name = 'Press de pecho en máquina';
UPDATE public.exercises SET aliases = ARRAY['cable crossover', 'cable flyes', 'cruce de cables', 'cruces en poleas para pecho', 'cruces polea']::text[] WHERE name = 'Cruces en polea para pecho';
UPDATE public.exercises SET aliases = ARRAY['dumbbell flyes', 'db flyes', 'aperturas', 'aperturas de pecho']::text[] WHERE name = 'Aperturas con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['pec deck', 'peck deck', 'machine fly', 'contractora de pecho', 'mariposa', 'aperturas en maquina']::text[] WHERE name = 'Peck Deck';
UPDATE public.exercises SET aliases = ARRAY['push ups', 'pushups', 'lagartijas', 'flexiones de pecho', 'flexiones']::text[] WHERE name = 'Flexiones de brazos';
UPDATE public.exercises SET aliases = ARRAY['chest dips', 'dips', 'fondos en paralelas', 'paralelas']::text[] WHERE name = 'Fondos en paralelas';
UPDATE public.exercises SET aliases = ARRAY['dumbbell pullover', 'pullover', 'db pullover']::text[] WHERE name = 'Pullover con mancuerna';
UPDATE public.exercises SET aliases = ARRAY['deadlift', 'conventional deadlift', 'peso muerto', 'pmo']::text[] WHERE name = 'Peso muerto convencional';
UPDATE public.exercises SET aliases = ARRAY['pull ups', 'pullups', 'chin ups', 'dominadas', 'traccion vertical']::text[] WHERE name = 'Dominadas libres';
UPDATE public.exercises SET aliases = ARRAY['assisted pull ups', 'assisted chin ups', 'dominadas en maquina']::text[] WHERE name = 'Dominadas asistidas';
UPDATE public.exercises SET aliases = ARRAY['lat pulldown', 'pulldown', 'jalon al pecho', 'dorsalera', 'jalon']::text[] WHERE name = 'Jalón al pecho en polea';
UPDATE public.exercises SET aliases = ARRAY['reverse grip lat pulldown', 'underhand pulldown', 'jalon supino']::text[] WHERE name = 'Jalón al pecho agarre supino';
UPDATE public.exercises SET aliases = ARRAY['gironda row', 'close grip cable row', 'remo gironda', 'remo sentado en cable', 'remo polea baja']::text[] WHERE name = 'Remo en polea baja';
UPDATE public.exercises SET aliases = ARRAY['barbell row', 'bent over row', 'remo barra']::text[] WHERE name = 'Remo con barra';
UPDATE public.exercises SET aliases = ARRAY['serrucho', 'one arm dumbbell row', 'single arm db row', 'remo mancuerna']::text[] WHERE name = 'Remo con mancuerna a una mano';
UPDATE public.exercises SET aliases = ARRAY['chest supported row', 'machine row', 'remo con apoyo']::text[] WHERE name = 'Remo con apoyo de pecho';
UPDATE public.exercises SET aliases = ARRAY['t bar row', 't-bar row', 'remo t']::text[] WHERE name = 'Remo en barra T';
UPDATE public.exercises SET aliases = ARRAY['cable pullover', 'straight arm pulldown', 'overhead cable pullover', 'pullover polea', 'jalon con brazos rectos']::text[] WHERE name = 'Pullover en polea alta con soga';
UPDATE public.exercises SET aliases = ARRAY['face pull', 'cable face pull', 'face pulls', 'face pull con rotacion externa']::text[] WHERE name = 'Face pull en polea alta';
UPDATE public.exercises SET aliases = ARRAY['back extension', 'hyperextensions', 'hiperextensiones', 'lumbares']::text[] WHERE name = 'Hiperextensión lumbar';
UPDATE public.exercises SET aliases = ARRAY['back squat', 'barbell squat', 'sentadilla con barra', 'sentadillas']::text[] WHERE name = 'Sentadilla trasera';
UPDATE public.exercises SET aliases = ARRAY['smith machine squat', 'smith squat', 'sentadilla smith']::text[] WHERE name = 'Sentadilla en máquina Smith';
UPDATE public.exercises SET aliases = ARRAY['front squat', 'barbell front squat', 'sentadilla delantera']::text[] WHERE name = 'Sentadilla frontal';
UPDATE public.exercises SET aliases = ARRAY['hack squat', 'sentadilla hack']::text[] WHERE name = 'Sentadilla Hack';
UPDATE public.exercises SET aliases = ARRAY['45 degree leg press', 'incline leg press', 'prensa a 45 grados', 'prensa de piernas', 'prensa']::text[] WHERE name = 'Prensa a 45°';
UPDATE public.exercises SET aliases = ARRAY['horizontal leg press', 'seated leg press', 'prensa horizontal']::text[] WHERE name = 'Prensa horizontal';
UPDATE public.exercises SET aliases = ARRAY['leg extension', 'leg extensions', 'extension de piernas', 'sillon de cuadriceps', 'contraccion de cuadriceps']::text[] WHERE name = 'Sillón de cuadríceps';
UPDATE public.exercises SET aliases = ARRAY['bulgarian split squat', 'bulgaras', 'sentadilla bulgara']::text[] WHERE name = 'Sentadilla búlgara';
UPDATE public.exercises SET aliases = ARRAY['goblet squat', 'dumbbell goblet squat', 'sentadilla copa']::text[] WHERE name = 'Sentadilla goblet';
UPDATE public.exercises SET aliases = ARRAY['step ups', 'box step ups', 'subidas al cajon', 'subida al cajon']::text[] WHERE name = 'Subidas al cajón';
UPDATE public.exercises SET aliases = ARRAY['reverse lunges', 'dumbbell reverse lunge', 'estocadas atras', 'zancada hacia atras', 'zancadas']::text[] WHERE name = 'Estocadas hacia atrás con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['walking lunges', 'dumbbell walking lunges', 'estocadas caminando', 'zancadas caminando']::text[] WHERE name = 'Estocadas caminando con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['sissy squat', 'sentadilla sissy']::text[] WHERE name = 'Sentadilla sissy';
UPDATE public.exercises SET aliases = ARRAY['belt squat', 'sentadilla con cinturon']::text[] WHERE name = 'Sentadilla con cinturón';
UPDATE public.exercises SET aliases = ARRAY['cossack squat', 'sentadilla cosaca']::text[] WHERE name = 'Sentadilla cosaca';
UPDATE public.exercises SET aliases = ARRAY['hip thrust', 'barbell hip thrust', 'puente de gluteo con barra', 'empuje de cadera']::text[] WHERE name = 'Hip thrust con barra';
UPDATE public.exercises SET aliases = ARRAY['machine hip thrust', 'hip thrust machine', 'hip thrust en maquina']::text[] WHERE name = 'Hip thrust en máquina';
UPDATE public.exercises SET aliases = ARRAY['glute bridge', 'puente de gluteos', 'puente de gluteo', 'puente a una pierna']::text[] WHERE name = 'Puente de glúteos en colchoneta';
UPDATE public.exercises SET aliases = ARRAY['cable glute kickback', 'glute kickback', 'patada de burro', 'patada de gluteo']::text[] WHERE name = 'Patada de glúteos en polea';
UPDATE public.exercises SET aliases = ARRAY['seated hip abduction', 'hip abductor machine', 'abductores']::text[] WHERE name = 'Abducción de cadera en máquina';
UPDATE public.exercises SET aliases = ARRAY['45 degree glute hyperextension', 'hiperextension gluteo']::text[] WHERE name = 'Hiperextensiones a 45° para glúteo';
UPDATE public.exercises SET aliases = ARRAY['kettlebell swing', 'kb swing', 'swing']::text[] WHERE name = 'Swing con kettlebell';
UPDATE public.exercises SET aliases = ARRAY['dumbbell sumo deadlift', 'sumo deadlift db']::text[] WHERE name = 'Peso muerto sumo con mancuerna';
UPDATE public.exercises SET aliases = ARRAY['crossover step up', 'step up cruzado']::text[] WHERE name = 'Step up cruzado en banco';
UPDATE public.exercises SET aliases = ARRAY['lying leg curl', 'lying hamstring curl', 'camilla femoral', 'curl femoral acostado', 'camilla femoral acostado']::text[] WHERE name = 'Camilla femoral';
UPDATE public.exercises SET aliases = ARRAY['seated leg curl', 'seated hamstring curl', 'sillon de isquiotibiales', 'curl femoral sentado', 'sillon femoral', 'curl femoral de pie']::text[] WHERE name = 'Sillón femoral';
UPDATE public.exercises SET aliases = ARRAY['romanian deadlift', 'rdl', 'barbell rdl', 'peso muerto rumano']::text[] WHERE name = 'Peso muerto rumano con barra';
UPDATE public.exercises SET aliases = ARRAY['dumbbell rdl', 'rdl', 'db romanian deadlift', 'rdl mancuernas']::text[] WHERE name = 'Peso muerto rumano con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['single leg rdl', 'rdl', 'peso muerto a una pierna', 'rdl unilateral']::text[] WHERE name = 'Peso muerto rumano a una pierna';
UPDATE public.exercises SET aliases = ARRAY['nordic curl', 'nordic hamstring curl', 'curl nordico']::text[] WHERE name = 'Curl nórdico';
UPDATE public.exercises SET aliases = ARRAY['good mornings', 'good morning', 'buenos dias']::text[] WHERE name = 'Buenos días con barra';
UPDATE public.exercises SET aliases = ARRAY['standing calf raise', 'calf raises', 'gemelos de pie', 'pantorrillas de pie', 'elevacion de pantorrillas']::text[] WHERE name = 'Gemelos de pie en máquina';
UPDATE public.exercises SET aliases = ARRAY['seated calf raise', 'soleus raise', 'soleo', 'gemelos sentado']::text[] WHERE name = 'Gemelos sentado en máquina';
UPDATE public.exercises SET aliases = ARRAY['leg press calf raise', 'talones en prensa', 'elevacion de talones en prensa']::text[] WHERE name = 'Gemelos en prensa';
UPDATE public.exercises SET aliases = ARRAY['single leg calf raise', 'talones a una pierna']::text[] WHERE name = 'Gemelos a una pierna con peso corporal';
UPDATE public.exercises SET aliases = ARRAY['overhead press', 'ohp', 'barbell military press', 'press militar']::text[] WHERE name = 'Press militar con barra';
UPDATE public.exercises SET aliases = ARRAY['seated dumbbell shoulder press', 'db shoulder press', 'press de hombros', 'press militar sentado con mancuernas']::text[] WHERE name = 'Press de hombros con mancuernas sentado';
UPDATE public.exercises SET aliases = ARRAY['smith machine shoulder press', 'smith ohp', 'press hombros smith']::text[] WHERE name = 'Press militar en máquina Smith';
UPDATE public.exercises SET aliases = ARRAY['arnold press', 'dumbbell arnold press', 'press arnold']::text[] WHERE name = 'Press Arnold';
UPDATE public.exercises SET aliases = ARRAY['dumbbell lateral raise', 'lateral raises', 'vuelos laterales', 'elevaciones laterales']::text[] WHERE name = 'Vuelos laterales con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['cable lateral raise', 'side lateral cable', 'vuelos en polea', 'elevacion lateral en cable']::text[] WHERE name = 'Vuelos laterales en polea';
UPDATE public.exercises SET aliases = ARRAY['rear delt fly', 'rear delt flyes', 'pajaros', 'vuelos posteriores', 'vuelo posterior']::text[] WHERE name = 'Vuelos posteriores';
UPDATE public.exercises SET aliases = ARRAY['front raise', 'dumbbell front raise', 'elevacion frontal', 'vuelos frontales']::text[] WHERE name = 'Vuelos frontales con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['upright row', 'barbell upright row', 'remo al menton']::text[] WHERE name = 'Remo al mentón con barra';
UPDATE public.exercises SET aliases = ARRAY['incline lateral raise', 'vuelos en banco inclinado']::text[] WHERE name = 'Vuelos laterales en banco inclinado';
UPDATE public.exercises SET aliases = ARRAY['y raises', 'y-raises', 'elevaciones en y']::text[] WHERE name = 'Y-Raises en banco inclinado';
UPDATE public.exercises SET aliases = ARRAY['dumbbell curl', 'db bicep curl', 'curl de biceps con mancuernas', 'curl mancuernas', 'curl de concentracion', 'curl de concentración', 'curl concentrado']::text[] WHERE name = 'Curl con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['preacher curl', 'scott curl', 'banco scott', 'curl predicador', 'curl scott en banco']::text[] WHERE name = 'Curl Scott con barra';
UPDATE public.exercises SET aliases = ARRAY['dumbbell preacher curl', 'curl predicadora', 'curl scott mancuernas']::text[] WHERE name = 'Curl Scott con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['cable bicep curl', 'cable curl', 'curl en polea', 'curl de bíceps en cable', 'curl de biceps en cable']::text[] WHERE name = 'Curl de bíceps en polea';
UPDATE public.exercises SET aliases = ARRAY['barbell curl', 'barbell bicep curl', 'curl de biceps con barra', 'curl barra']::text[] WHERE name = 'Curl de bíceps con barra';
UPDATE public.exercises SET aliases = ARRAY['hammer curl', 'dumbbell hammer curl', 'curl martillo']::text[] WHERE name = 'Curl martillo';
UPDATE public.exercises SET aliases = ARRAY['cable hammer curl', 'rope hammer curl', 'curl martillo polea con soga']::text[] WHERE name = 'Curl martillo en polea con soga';
UPDATE public.exercises SET aliases = ARRAY['incline dumbbell curl', 'incline curl', 'curl inclinado', 'biceps cabeza larga']::text[] WHERE name = 'Curl inclinado con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['spider curl', 'spider bicep curl', 'curl arana']::text[] WHERE name = 'Curl araña en banco inclinado';
UPDATE public.exercises SET aliases = ARRAY['zottman curl', 'curl zottman']::text[] WHERE name = 'Curl zottman';
UPDATE public.exercises SET aliases = ARRAY['21s curl', 'barbell 21 curl', 'curl 21']::text[] WHERE name = 'Curl 21 con barra';
UPDATE public.exercises SET aliases = ARRAY['skull crusher', 'skullcrusher', 'lying triceps extension', 'french press', 'rompecraneos', 'press frances barra w']::text[] WHERE name = 'Press francés con barra W';
UPDATE public.exercises SET aliases = ARRAY['tricep pushdown', 'cable tricep extension', 'extension triceps polea', 'jalon de triceps en polea']::text[] WHERE name = 'Extensiones de tríceps en polea alta';
UPDATE public.exercises SET aliases = ARRAY['rope pushdown', 'tricep rope pushdown', 'extension triceps soga']::text[] WHERE name = 'Extensiones de tríceps en polea con soga';
UPDATE public.exercises SET aliases = ARRAY['overhead cable tricep extension', 'overhead rope extension', 'triceps tras nuca', 'extension de triceps sobre la cabeza']::text[] WHERE name = 'Extensiones tras nuca en polea con soga';
UPDATE public.exercises SET aliases = ARRAY['seated overhead dumbbell extension', 'extension francesa sentado', 'copa triceps']::text[] WHERE name = 'Extensiones tras nuca con mancuerna';
UPDATE public.exercises SET aliases = ARRAY['close grip bench press', 'close grip press', 'press cerrado']::text[] WHERE name = 'Press cerrado con barra';
UPDATE public.exercises SET aliases = ARRAY['parallel bar tricep dips', 'fondos en paralelas triceps']::text[] WHERE name = 'Fondos en paralelas para tríceps';
UPDATE public.exercises SET aliases = ARRAY['assisted dips', 'fondos asistidos']::text[] WHERE name = 'Fondos asistidos en máquina';
UPDATE public.exercises SET aliases = ARRAY['tricep kickbacks', 'patada de triceps']::text[] WHERE name = 'Patada de tríceps con mancuerna';
UPDATE public.exercises SET aliases = ARRAY['plank', 'abdominal plank', 'plancha frontal', 'plancha']::text[] WHERE name = 'Plancha frontal';
UPDATE public.exercises SET aliases = ARRAY['side plank', 'plancha lateral']::text[] WHERE name = 'Plancha lateral';
UPDATE public.exercises SET aliases = ARRAY['crunches', 'ab crunch', 'abdominales crunch']::text[] WHERE name = 'Abdominales crunch en colchoneta';
UPDATE public.exercises SET aliases = ARRAY['cable crunch', 'kneeling cable crunch', 'crunch polea', 'crunch en cable']::text[] WHERE name = 'Crunch en polea con soga';
UPDATE public.exercises SET aliases = ARRAY['ab wheel', 'ab roller', 'rueda abdominal']::text[] WHERE name = 'Rueda abdominal';
UPDATE public.exercises SET aliases = ARRAY['hanging knee raise', 'elevacion de rodillas colgado']::text[] WHERE name = 'Elevación de rodillas colgado en barra';
UPDATE public.exercises SET aliases = ARRAY['captain chair leg raise', 'elevacion piernas paralelas']::text[] WHERE name = 'Elevación de piernas en paralelas';
UPDATE public.exercises SET aliases = ARRAY['dead bug', 'bicho muerto']::text[] WHERE name = 'Dead bug';
UPDATE public.exercises SET aliases = ARRAY['bird dog', 'perro pajaro']::text[] WHERE name = 'Bird dog';
UPDATE public.exercises SET aliases = ARRAY['pallof press', 'press pallof']::text[] WHERE name = 'Press Pallof en polea';
UPDATE public.exercises SET aliases = ARRAY['russian twist', 'giros rusos']::text[] WHERE name = 'Russian twist con peso';
UPDATE public.exercises SET aliases = ARRAY['hollow body', 'hollow body hold']::text[] WHERE name = 'Hollow body hold';
UPDATE public.exercises SET aliases = ARRAY['treadmill walking', 'incline treadmill', 'cinta caminadora', 'caminata en cinta']::text[] WHERE name = 'Caminata inclinada en cinta';
UPDATE public.exercises SET aliases = ARRAY['stationary bike', 'cycling', 'bici fija']::text[] WHERE name = 'Bicicleta fija';
UPDATE public.exercises SET aliases = ARRAY['elliptical', 'eliptico', 'eliptica']::text[] WHERE name = 'Eliptico';
UPDATE public.exercises SET aliases = ARRAY['air bike', 'assault bike', 'echo bike', 'bici de aire']::text[] WHERE name = 'Bicicleta de aire';
UPDATE public.exercises SET aliases = ARRAY['rower', 'rowing machine', 'concept 2', 'remo ergometro']::text[] WHERE name = 'Remoergómetro';
UPDATE public.exercises SET aliases = ARRAY['stairmaster', 'stair climber', 'escaladora']::text[] WHERE name = 'Escaladora';
UPDATE public.exercises SET aliases = ARRAY['jump rope', 'skipping rope', 'cuerda de saltar', 'soga saltar']::text[] WHERE name = 'Cuerda de saltar';
UPDATE public.exercises SET aliases = ARRAY['burpees', 'burpee']::text[] WHERE name = 'Burpees';
UPDATE public.exercises SET aliases = ARRAY['mountain climbers', 'escaladores']::text[] WHERE name = 'Mountain climbers';
UPDATE public.exercises SET aliases = ARRAY['sled push', 'empuje de trineo']::text[] WHERE name = 'Empuje de trineo';

/* 4. Verificación de integridad: comprobar que no existan nombres duplicados por grupo muscular */
DO $check$
DECLARE
    v_dup_count int;
BEGIN
    SELECT COUNT(*) INTO v_dup_count
    FROM (
        SELECT muscle_group_id, name, COUNT(*)
        FROM public.exercises
        GROUP BY muscle_group_id, name
        HAVING COUNT(*) > 1
    ) sub;

    IF v_dup_count > 0 THEN
        RAISE EXCEPTION 'Aún existen % nombres duplicados en public.exercises!', v_dup_count;
    END IF;
END $check$;

COMMIT;

/* Resumen de ejercicios canónicos en producción */
SELECT mg.name AS grupo, COUNT(e.id) AS total_ejercicios
FROM public.exercises e
JOIN public.muscle_groups mg ON mg.id = e.muscle_group_id
GROUP BY mg.name
ORDER BY mg.name;
