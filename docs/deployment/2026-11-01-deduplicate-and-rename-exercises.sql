-- ==============================================================================
-- Migración Segura en Supabase: Desduplicación y Limpieza Integral del Catálogo
-- Fecha: 2026-11-01
-- Objetivo:
--   1. Reasignar series históricas (workout_sets) al ejercicio canónico.
--   2. Reasignar rutinas (routine_exercises) evitando duplicados por día.
--   3. Eliminar ejercicios duplicados y obsoletos de public.exercises.
--   4. Renombrar a nombres definitivos solicitados por el usuario.
--   5. Sincronizar alias multilingües para búsqueda Fuse.js.
-- ==============================================================================

BEGIN;

-- 1. Función auxiliar temporal para fusionar de forma segura
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
    -- 1.1 Buscar ID canónico
    SELECT id INTO v_canonical_id
    FROM public.exercises
    WHERE name = p_canonical_name
    LIMIT 1;

    -- Si no existe con nombre canónico pero existe uno de los duplicados/legacy, renombramos el primero a canónico
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

    -- Si no existe ninguno de los registros, salir
    IF v_canonical_id IS NULL THEN
        RETURN;
    END IF;

    -- 1.2 Fusionar cualquier otra fila idéntica que ya se llame igual a p_canonical_name
    FOR v_dup_id IN
        SELECT id FROM public.exercises
        WHERE name = p_canonical_name AND id != v_canonical_id
    LOOP
        UPDATE public.workout_sets
        SET exercise_id = v_canonical_id
        WHERE exercise_id = v_dup_id;

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

    -- 1.3 Fusionar cada nombre duplicado
    FOREACH v_dup_name IN ARRAY p_duplicate_names
    LOOP
        FOR v_dup_id IN
            SELECT id FROM public.exercises
            WHERE name = v_dup_name AND id != v_canonical_id
        LOOP
            UPDATE public.workout_sets
            SET exercise_id = v_canonical_id
            WHERE exercise_id = v_dup_id;

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

-- 2. Ejecutar fusiones y depuraciones
SELECT pg_temp.merge_and_cleanup_exercise('Press plano con barra', ARRAY['Press banca con barra', 'Press banca plano', 'Press declinado con barra']);
SELECT pg_temp.merge_and_cleanup_exercise('Press plano con mancuernas', ARRAY['Press banca con mancuernas', 'Press plano mancuernas']);
SELECT pg_temp.merge_and_cleanup_exercise('Press inclinado con mancuernas', ARRAY['Press inclinado con mancuernas agarre neutro']);
SELECT pg_temp.merge_and_cleanup_exercise('Cruces en polea para pecho', ARRAY['Cruces en poleas para pecho', 'Cruce de cables']);
SELECT pg_temp.merge_and_cleanup_exercise('Peck Deck', ARRAY['Aperturas en máquina (Pec Deck)', 'Aperturas en maquina (Pec Deck)', 'Pec Deck']);
SELECT pg_temp.merge_and_cleanup_exercise('Flexiones de brazos', ARRAY['Flexiones de pecho (lagartijas)', 'Flexiones con deficit', 'Flexiones con déficit']);
SELECT pg_temp.merge_and_cleanup_exercise('Jalón al pecho en polea', ARRAY['Jalon al pecho', 'Jalón al pecho']);
SELECT pg_temp.merge_and_cleanup_exercise('Remo en polea baja (Remo Gironda)', ARRAY['Remo sentado en cable', 'Remo en polea baja con agarre estrecho (Remo Gironda)', 'Remo en polea baja agarre neutro', 'Remo en polea baja con agarre neutro', 'Remo Gironda']);
SELECT pg_temp.merge_and_cleanup_exercise('Pullover en polea alta con soga', ARRAY['Jalón con brazos rectos', 'Jalon con brazos rectos', 'Pullover en polea alta']);
SELECT pg_temp.merge_and_cleanup_exercise('Face pull en polea alta', ARRAY['Face pull', 'Face pull con rotacion externa', 'Face pull con rotación externa']);
SELECT pg_temp.merge_and_cleanup_exercise('Remo con mancuerna a una mano (serrucho)', ARRAY['Remo a una mano']);
SELECT pg_temp.merge_and_cleanup_exercise('Dominadas libres (peso corporal)', ARRAY['Dominadas']);
SELECT pg_temp.merge_and_cleanup_exercise('Sillón de cuadríceps', ARRAY['Contracción de cuadríceps', 'Contraccion de cuadriceps', 'Extension de piernas', 'Extensión de piernas', 'Sillón de cuadríceps (extensiones)', 'Sillon de cuadriceps (extensiones)', 'Sillon de cuadriceps']);
SELECT pg_temp.merge_and_cleanup_exercise('Sentadilla Hack', ARRAY['Hack squat']);
SELECT pg_temp.merge_and_cleanup_exercise('Prensa a 45°', ARRAY['Prensa de piernas', 'Prensa 45 grados']);
SELECT pg_temp.merge_and_cleanup_exercise('Sentadilla con cinturón (Belt Squat)', ARRAY['Sentadilla con cinturon (Belt squat)']);
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
SELECT pg_temp.merge_and_cleanup_exercise('Gemelos sentado en máquina (sóleo)', ARRAY['Elevacion de pantorrillas sentado', 'Elevación de pantorrillas sentado']);
SELECT pg_temp.merge_and_cleanup_exercise('Gemelos en prensa', ARRAY['Elevacion de talones en prensa', 'Elevación de talones en prensa']);
SELECT pg_temp.merge_and_cleanup_exercise('Gemelos a una pierna con peso corporal', ARRAY['Elevacion de talones a una pierna', 'Elevación de talones a una pierna']);
SELECT pg_temp.merge_and_cleanup_exercise('Press de hombros con mancuernas sentado', ARRAY['Press de hombros con mancuernas', 'Press militar sentado con mancuernas']);
SELECT pg_temp.merge_and_cleanup_exercise('Press militar en máquina Smith', ARRAY['Press militar en maquina Smith']);
SELECT pg_temp.merge_and_cleanup_exercise('Vuelos laterales con mancuernas', ARRAY['Elevaciones laterales']);
SELECT pg_temp.merge_and_cleanup_exercise('Vuelos laterales en polea', ARRAY['Elevacion lateral en cable']);
SELECT pg_temp.merge_and_cleanup_exercise('Vuelos posteriores (pájaros)', ARRAY['Vuelo posterior']);
SELECT pg_temp.merge_and_cleanup_exercise('Vuelos frontales con mancuernas', ARRAY['Elevacion frontal', 'Elevación frontal']);
SELECT pg_temp.merge_and_cleanup_exercise('Remo al mentón con barra', ARRAY['Remo al mentón', 'Remo al menton']);
SELECT pg_temp.merge_and_cleanup_exercise('Curl con mancuernas', ARRAY['Curl de concentración', 'Curl de concentracion', 'Curl de bíceps con mancuernas', 'Curl de biceps con mancuernas']);
SELECT pg_temp.merge_and_cleanup_exercise('Curl Scott con barra', ARRAY['Curl Scott en banco (predicador)', 'Curl predicador']);
SELECT pg_temp.merge_and_cleanup_exercise('Curl Scott con mancuernas', ARRAY['Curl Predicadora', 'Curl predicadora']);
SELECT pg_temp.merge_and_cleanup_exercise('Curl de bíceps en polea', ARRAY['Curl de bíceps en cable', 'Curl de biceps en cable', 'Curl en polea baja']);
SELECT pg_temp.merge_and_cleanup_exercise('Press francés con barra W (rompecráneos)', ARRAY['Rompecraneos', 'Rompecráneos', 'Press francés con barra (rompecráneos)', 'Press frances con barra (rompecraneos)', 'Press francés en banco plano con barra W']);
SELECT pg_temp.merge_and_cleanup_exercise('Extensiones de tríceps en polea alta (barra)', ARRAY['Extensiones de tríceps en polea alta', 'Extensiones de triceps en polea alta', 'Jalon de triceps en polea']);
SELECT pg_temp.merge_and_cleanup_exercise('Extensiones de tríceps en polea con soga', ARRAY['Extension de triceps en polea con cuerda']);
SELECT pg_temp.merge_and_cleanup_exercise('Extensiones tras nuca en polea con soga', ARRAY['Extension de triceps sobre la cabeza']);
SELECT pg_temp.merge_and_cleanup_exercise('Extensiones tras nuca con mancuerna (copa)', ARRAY['Extension francesa con mancuerna sentado']);
SELECT pg_temp.merge_and_cleanup_exercise('Press cerrado con barra', ARRAY['Press cerrado']);
SELECT pg_temp.merge_and_cleanup_exercise('Fondos en paralelas para tríceps', ARRAY['Fondos en paralelas para triceps']);
SELECT pg_temp.merge_and_cleanup_exercise('Fondos asistidos en máquina', ARRAY['Fondos asistidos']);
SELECT pg_temp.merge_and_cleanup_exercise('Patada de tríceps con mancuerna', ARRAY['Patada de triceps']);
SELECT pg_temp.merge_and_cleanup_exercise('Crunch en polea con soga', ARRAY['Crunch en cable', 'Crunch abdominal en polea alta']);
SELECT pg_temp.merge_and_cleanup_exercise('Press Pallof en polea', ARRAY['Pallof press']);
SELECT pg_temp.merge_and_cleanup_exercise('Rueda abdominal (Ab Roller)', ARRAY['Rueda abdominal (Ab wheel)']);
SELECT pg_temp.merge_and_cleanup_exercise('Elevación de rodillas colgado en barra', ARRAY['Elevacion de rodillas colgado']);
SELECT pg_temp.merge_and_cleanup_exercise('Elevación de piernas en paralelas', ARRAY['Elevacion de piernas en paralelas']);
SELECT pg_temp.merge_and_cleanup_exercise('Caminata inclinada en cinta', ARRAY['Caminata en cinta']);
SELECT pg_temp.merge_and_cleanup_exercise('Remoergómetro (Concept 2)', ARRAY['Remo ergometro', 'Remo ergómetro']);
SELECT pg_temp.merge_and_cleanup_exercise('Escaladora (StairMaster)', ARRAY['Escaladora']);

-- 3. Actualizar alias multilingües enriquecidos para búsqueda
UPDATE public.exercises SET aliases = '["bench press","barbell bench press","press banca","banca plana","pecho plano","pecho"]'::jsonb WHERE name = 'Press plano con barra';
UPDATE public.exercises SET aliases = '["dumbbell bench press","db bench press","press banca con mancuernas","pecho plano mancuernas"]'::jsonb WHERE name = 'Press plano con mancuernas';
UPDATE public.exercises SET aliases = '["incline dumbbell press","incline db press","press inclinado","pecho alto"]'::jsonb WHERE name = 'Press inclinado con mancuernas';
UPDATE public.exercises SET aliases = '["smith machine incline press","incline smith press","press inclinado smith"]'::jsonb WHERE name = 'Press inclinado en máquina Smith';
UPDATE public.exercises SET aliases = '["chest press machine","machine chest press","press maquina pecho","maquina pecho"]'::jsonb WHERE name = 'Press de pecho en máquina';
UPDATE public.exercises SET aliases = '["cable crossover","cable flyes","cruce de cables","cruces en poleas para pecho","cruces polea"]'::jsonb WHERE name = 'Cruces en polea para pecho';
UPDATE public.exercises SET aliases = '["dumbbell flyes","db flyes","aperturas","aperturas de pecho"]'::jsonb WHERE name = 'Aperturas con mancuernas';
UPDATE public.exercises SET aliases = '["pec deck","peck deck","machine fly","contractora de pecho","mariposa","aperturas en maquina"]'::jsonb WHERE name = 'Peck Deck';
UPDATE public.exercises SET aliases = '["push ups","pushups","lagartijas","flexiones de pecho","flexiones"]'::jsonb WHERE name = 'Flexiones de brazos';
UPDATE public.exercises SET aliases = '["chest dips","dips","fondos en paralelas","paralelas"]'::jsonb WHERE name = 'Fondos en paralelas (pecho)';
UPDATE public.exercises SET aliases = '["dumbbell pullover","pullover","db pullover"]'::jsonb WHERE name = 'Pullover con mancuerna';
UPDATE public.exercises SET aliases = '["deadlift","conventional deadlift","peso muerto","pmo"]'::jsonb WHERE name = 'Peso muerto convencional';
UPDATE public.exercises SET aliases = '["pull ups","pullups","chin ups","dominadas","traccion vertical"]'::jsonb WHERE name = 'Dominadas libres (peso corporal)';
UPDATE public.exercises SET aliases = '["assisted pull ups","assisted chin ups","dominadas en maquina"]'::jsonb WHERE name = 'Dominadas asistidas';
UPDATE public.exercises SET aliases = '["lat pulldown","pulldown","jalon al pecho","dorsalera","jalon"]'::jsonb WHERE name = 'Jalón al pecho en polea';
UPDATE public.exercises SET aliases = '["reverse grip lat pulldown","underhand pulldown","jalon supino"]'::jsonb WHERE name = 'Jalón al pecho agarre supino';
UPDATE public.exercises SET aliases = '["gironda row","close grip cable row","remo gironda","remo sentado en cable","remo polea baja"]'::jsonb WHERE name = 'Remo en polea baja (Remo Gironda)';
UPDATE public.exercises SET aliases = '["barbell row","bent over row","remo barra"]'::jsonb WHERE name = 'Remo con barra';
UPDATE public.exercises SET aliases = '["serrucho","one arm dumbbell row","single arm db row","remo mancuerna"]'::jsonb WHERE name = 'Remo con mancuerna a una mano (serrucho)';
UPDATE public.exercises SET aliases = '["chest supported row","machine row","remo con apoyo"]'::jsonb WHERE name = 'Remo con apoyo de pecho';
UPDATE public.exercises SET aliases = '["t bar row","t-bar row","remo t"]'::jsonb WHERE name = 'Remo en barra T';
UPDATE public.exercises SET aliases = '["cable pullover","straight arm pulldown","overhead cable pullover","pullover polea","jalon con brazos rectos"]'::jsonb WHERE name = 'Pullover en polea alta con soga';
UPDATE public.exercises SET aliases = '["face pull","cable face pull","face pulls","face pull con rotacion externa"]'::jsonb WHERE name = 'Face pull en polea alta';
UPDATE public.exercises SET aliases = '["back extension","hyperextensions","hiperextensiones","lumbares"]'::jsonb WHERE name = 'Hiperextensión lumbar';
UPDATE public.exercises SET aliases = '["back squat","barbell squat","sentadilla con barra","sentadillas"]'::jsonb WHERE name = 'Sentadilla trasera';
UPDATE public.exercises SET aliases = '["smith machine squat","smith squat","sentadilla smith"]'::jsonb WHERE name = 'Sentadilla en máquina Smith';
UPDATE public.exercises SET aliases = '["front squat","barbell front squat","sentadilla delantera"]'::jsonb WHERE name = 'Sentadilla frontal';
UPDATE public.exercises SET aliases = '["hack squat","sentadilla hack"]'::jsonb WHERE name = 'Sentadilla Hack';
UPDATE public.exercises SET aliases = '["45 degree leg press","incline leg press","prensa a 45 grados","prensa de piernas","prensa"]'::jsonb WHERE name = 'Prensa a 45°';
UPDATE public.exercises SET aliases = '["horizontal leg press","seated leg press","prensa horizontal"]'::jsonb WHERE name = 'Prensa horizontal';
UPDATE public.exercises SET aliases = '["leg extension","leg extensions","extension de piernas","sillon de cuadriceps","contraccion de cuadriceps"]'::jsonb WHERE name = 'Sillón de cuadríceps';
UPDATE public.exercises SET aliases = '["bulgarian split squat","bulgaras","sentadilla bulgara"]'::jsonb WHERE name = 'Sentadilla búlgara';
UPDATE public.exercises SET aliases = '["goblet squat","dumbbell goblet squat","sentadilla copa"]'::jsonb WHERE name = 'Sentadilla goblet';
UPDATE public.exercises SET aliases = '["step ups","box step ups","subidas al cajon","subida al cajon"]'::jsonb WHERE name = 'Subidas al cajón';
UPDATE public.exercises SET aliases = '["reverse lunges","dumbbell reverse lunge","estocadas atras","zancada hacia atras","zancadas"]'::jsonb WHERE name = 'Estocadas hacia atrás con mancuernas';
UPDATE public.exercises SET aliases = '["walking lunges","dumbbell walking lunges","estocadas caminando","zancadas caminando"]'::jsonb WHERE name = 'Estocadas caminando con mancuernas';
UPDATE public.exercises SET aliases = '["sissy squat","sentadilla sissy"]'::jsonb WHERE name = 'Sentadilla sissy';
UPDATE public.exercises SET aliases = '["belt squat","sentadilla con cinturon"]'::jsonb WHERE name = 'Sentadilla con cinturón (Belt Squat)';
UPDATE public.exercises SET aliases = '["cossack squat","sentadilla cosaca"]'::jsonb WHERE name = 'Sentadilla cosaca';
UPDATE public.exercises SET aliases = '["hip thrust","barbell hip thrust","puente de gluteo con barra","empuje de cadera"]'::jsonb WHERE name = 'Hip thrust con barra';
UPDATE public.exercises SET aliases = '["machine hip thrust","hip thrust machine","hip thrust en maquina"]'::jsonb WHERE name = 'Hip thrust en máquina';
UPDATE public.exercises SET aliases = '["glute bridge","puente de gluteos","puente de gluteo","puente a una pierna"]'::jsonb WHERE name = 'Puente de glúteos en colchoneta';
UPDATE public.exercises SET aliases = '["cable glute kickback","glute kickback","patada de burro","patada de gluteo"]'::jsonb WHERE name = 'Patada de glúteos en polea';
UPDATE public.exercises SET aliases = '["seated hip abduction","hip abductor machine","abductores"]'::jsonb WHERE name = 'Abducción de cadera en máquina';
UPDATE public.exercises SET aliases = '["45 degree glute hyperextension","hiperextension gluteo"]'::jsonb WHERE name = 'Hiperextensiones a 45° para glúteo';
UPDATE public.exercises SET aliases = '["kettlebell swing","kb swing","swing"]'::jsonb WHERE name = 'Swing con kettlebell';
UPDATE public.exercises SET aliases = '["dumbbell sumo deadlift","sumo deadlift db"]'::jsonb WHERE name = 'Peso muerto sumo con mancuerna';
UPDATE public.exercises SET aliases = '["crossover step up","step up cruzado"]'::jsonb WHERE name = 'Step up cruzado en banco';
UPDATE public.exercises SET aliases = '["lying leg curl","lying hamstring curl","camilla femoral","curl femoral acostado","camilla femoral acostado"]'::jsonb WHERE name = 'Camilla femoral';
UPDATE public.exercises SET aliases = '["seated leg curl","seated hamstring curl","sillon de isquiotibiales","curl femoral sentado","sillon femoral","curl femoral de pie"]'::jsonb WHERE name = 'Sillón femoral';
UPDATE public.exercises SET aliases = '["romanian deadlift","rdl","barbell rdl","peso muerto rumano"]'::jsonb WHERE name = 'Peso muerto rumano con barra';
UPDATE public.exercises SET aliases = '["dumbbell rdl","rdl","db romanian deadlift","rdl mancuernas"]'::jsonb WHERE name = 'Peso muerto rumano con mancuernas';
UPDATE public.exercises SET aliases = '["single leg rdl","rdl","peso muerto a una pierna","rdl unilateral"]'::jsonb WHERE name = 'Peso muerto rumano a una pierna';
UPDATE public.exercises SET aliases = '["nordic curl","nordic hamstring curl","curl nordico"]'::jsonb WHERE name = 'Curl nórdico';
UPDATE public.exercises SET aliases = '["good mornings","good morning","buenos dias"]'::jsonb WHERE name = 'Buenos días con barra';
UPDATE public.exercises SET aliases = '["standing calf raise","calf raises","gemelos de pie","pantorrillas de pie","elevacion de pantorrillas"]'::jsonb WHERE name = 'Gemelos de pie en máquina';
UPDATE public.exercises SET aliases = '["seated calf raise","soleus raise","soleo","gemelos sentado"]'::jsonb WHERE name = 'Gemelos sentado en máquina (sóleo)';
UPDATE public.exercises SET aliases = '["leg press calf raise","talones en prensa","elevacion de talones en prensa"]'::jsonb WHERE name = 'Gemelos en prensa';
UPDATE public.exercises SET aliases = '["single leg calf raise","talones a una pierna"]'::jsonb WHERE name = 'Gemelos a una pierna con peso corporal';
UPDATE public.exercises SET aliases = '["overhead press","ohp","barbell military press","press militar"]'::jsonb WHERE name = 'Press militar con barra';
UPDATE public.exercises SET aliases = '["seated dumbbell shoulder press","db shoulder press","press de hombros","press militar sentado con mancuernas"]'::jsonb WHERE name = 'Press de hombros con mancuernas sentado';
UPDATE public.exercises SET aliases = '["smith machine shoulder press","smith ohp","press hombros smith"]'::jsonb WHERE name = 'Press militar en máquina Smith';
UPDATE public.exercises SET aliases = '["arnold press","dumbbell arnold press","press arnold"]'::jsonb WHERE name = 'Press Arnold';
UPDATE public.exercises SET aliases = '["dumbbell lateral raise","lateral raises","vuelos laterales","elevaciones laterales"]'::jsonb WHERE name = 'Vuelos laterales con mancuernas';
UPDATE public.exercises SET aliases = '["cable lateral raise","side lateral cable","vuelos en polea","elevacion lateral en cable"]'::jsonb WHERE name = 'Vuelos laterales en polea';
UPDATE public.exercises SET aliases = '["rear delt fly","rear delt flyes","pajaros","vuelos posteriores","vuelo posterior"]'::jsonb WHERE name = 'Vuelos posteriores (pájaros)';
UPDATE public.exercises SET aliases = '["front raise","dumbbell front raise","elevacion frontal","vuelos frontales"]'::jsonb WHERE name = 'Vuelos frontales con mancuernas';
UPDATE public.exercises SET aliases = '["upright row","barbell upright row","remo al menton"]'::jsonb WHERE name = 'Remo al mentón con barra';
UPDATE public.exercises SET aliases = '["incline lateral raise","vuelos en banco inclinado"]'::jsonb WHERE name = 'Vuelos laterales en banco inclinado';
UPDATE public.exercises SET aliases = '["y raises","y-raises","elevaciones en y"]'::jsonb WHERE name = 'Y-Raises en banco inclinado';
UPDATE public.exercises SET aliases = '["dumbbell curl","db bicep curl","curl de biceps con mancuernas","curl mancuernas","curl de concentracion","curl de concentración","curl concentrado"]'::jsonb WHERE name = 'Curl con mancuernas';
UPDATE public.exercises SET aliases = '["preacher curl","scott curl","banco scott","curl predicador","curl scott en banco"]'::jsonb WHERE name = 'Curl Scott con barra';
UPDATE public.exercises SET aliases = '["dumbbell preacher curl","curl predicadora","curl scott mancuernas"]'::jsonb WHERE name = 'Curl Scott con mancuernas';
UPDATE public.exercises SET aliases = '["cable bicep curl","cable curl","curl en polea","curl de bíceps en cable","curl de biceps en cable"]'::jsonb WHERE name = 'Curl de bíceps en polea';
UPDATE public.exercises SET aliases = '["barbell curl","barbell bicep curl","curl de biceps con barra","curl barra"]'::jsonb WHERE name = 'Curl de bíceps con barra';
UPDATE public.exercises SET aliases = '["hammer curl","dumbbell hammer curl","curl martillo"]'::jsonb WHERE name = 'Curl martillo';
UPDATE public.exercises SET aliases = '["cable hammer curl","rope hammer curl","curl martillo polea con soga"]'::jsonb WHERE name = 'Curl martillo en polea con soga';
UPDATE public.exercises SET aliases = '["incline dumbbell curl","incline curl","curl inclinado","biceps cabeza larga"]'::jsonb WHERE name = 'Curl inclinado con mancuernas';
UPDATE public.exercises SET aliases = '["spider curl","spider bicep curl","curl arana"]'::jsonb WHERE name = 'Curl araña en banco inclinado';
UPDATE public.exercises SET aliases = '["zottman curl","curl zottman"]'::jsonb WHERE name = 'Curl zottman';
UPDATE public.exercises SET aliases = '["21s curl","barbell 21 curl","curl 21"]'::jsonb WHERE name = 'Curl 21 con barra';
UPDATE public.exercises SET aliases = '["skull crusher","skullcrusher","lying triceps extension","french press","rompecraneos","press frances barra w"]'::jsonb WHERE name = 'Press francés con barra W (rompecráneos)';
UPDATE public.exercises SET aliases = '["tricep pushdown","cable tricep extension","extension triceps polea","jalon de triceps en polea"]'::jsonb WHERE name = 'Extensiones de tríceps en polea alta (barra)';
UPDATE public.exercises SET aliases = '["rope pushdown","tricep rope pushdown","extension triceps soga"]'::jsonb WHERE name = 'Extensiones de tríceps en polea con soga';
UPDATE public.exercises SET aliases = '["overhead cable tricep extension","overhead rope extension","triceps tras nuca","extension de triceps sobre la cabeza"]'::jsonb WHERE name = 'Extensiones tras nuca en polea con soga';
UPDATE public.exercises SET aliases = '["seated overhead dumbbell extension","extension francesa sentado","copa triceps"]'::jsonb WHERE name = 'Extensiones tras nuca con mancuerna (copa)';
UPDATE public.exercises SET aliases = '["close grip bench press","close grip press","press cerrado"]'::jsonb WHERE name = 'Press cerrado con barra';
UPDATE public.exercises SET aliases = '["parallel bar tricep dips","fondos en paralelas triceps"]'::jsonb WHERE name = 'Fondos en paralelas para tríceps';
UPDATE public.exercises SET aliases = '["assisted dips","fondos asistidos"]'::jsonb WHERE name = 'Fondos asistidos en máquina';
UPDATE public.exercises SET aliases = '["tricep kickbacks","patada de triceps"]'::jsonb WHERE name = 'Patada de tríceps con mancuerna';
UPDATE public.exercises SET aliases = '["plank","abdominal plank","plancha frontal","plancha"]'::jsonb WHERE name = 'Plancha frontal';
UPDATE public.exercises SET aliases = '["side plank","plancha lateral"]'::jsonb WHERE name = 'Plancha lateral';
UPDATE public.exercises SET aliases = '["crunches","ab crunch","abdominales crunch"]'::jsonb WHERE name = 'Abdominales crunch en colchoneta';
UPDATE public.exercises SET aliases = '["cable crunch","kneeling cable crunch","crunch polea","crunch en cable"]'::jsonb WHERE name = 'Crunch en polea con soga';
UPDATE public.exercises SET aliases = '["ab wheel","ab roller","rueda abdominal"]'::jsonb WHERE name = 'Rueda abdominal (Ab Roller)';
UPDATE public.exercises SET aliases = '["hanging knee raise","elevacion de rodillas colgado"]'::jsonb WHERE name = 'Elevación de rodillas colgado en barra';
UPDATE public.exercises SET aliases = '["captain chair leg raise","elevacion piernas paralelas"]'::jsonb WHERE name = 'Elevación de piernas en paralelas';
UPDATE public.exercises SET aliases = '["dead bug","bicho muerto"]'::jsonb WHERE name = 'Dead bug';
UPDATE public.exercises SET aliases = '["bird dog","perro pajaro"]'::jsonb WHERE name = 'Bird dog';
UPDATE public.exercises SET aliases = '["pallof press","press pallof"]'::jsonb WHERE name = 'Press Pallof en polea';
UPDATE public.exercises SET aliases = '["russian twist","giros rusos"]'::jsonb WHERE name = 'Russian twist con peso';
UPDATE public.exercises SET aliases = '["hollow body","hollow body hold"]'::jsonb WHERE name = 'Hollow body hold';
UPDATE public.exercises SET aliases = '["treadmill walking","incline treadmill","cinta caminadora","caminata en cinta"]'::jsonb WHERE name = 'Caminata inclinada en cinta';
UPDATE public.exercises SET aliases = '["stationary bike","cycling","bici fija"]'::jsonb WHERE name = 'Bicicleta fija';
UPDATE public.exercises SET aliases = '["elliptical","eliptico","eliptica"]'::jsonb WHERE name = 'Eliptico';
UPDATE public.exercises SET aliases = '["air bike","assault bike","echo bike","bici de aire"]'::jsonb WHERE name = 'Bicicleta de aire (Air Bike / Assault Bike)';
UPDATE public.exercises SET aliases = '["rower","rowing machine","concept 2","remo ergometro"]'::jsonb WHERE name = 'Remoergómetro (Concept 2)';
UPDATE public.exercises SET aliases = '["stairmaster","stair climber","escaladora"]'::jsonb WHERE name = 'Escaladora (StairMaster)';
UPDATE public.exercises SET aliases = '["jump rope","skipping rope","cuerda de saltar","soga saltar"]'::jsonb WHERE name = 'Cuerda de saltar';
UPDATE public.exercises SET aliases = '["burpees","burpee"]'::jsonb WHERE name = 'Burpees';
UPDATE public.exercises SET aliases = '["mountain climbers","escaladores"]'::jsonb WHERE name = 'Mountain climbers';
UPDATE public.exercises SET aliases = '["sled push","empuje de trineo"]'::jsonb WHERE name = 'Empuje de trineo (Sled push)';

-- 4. Verificación de integridad: comprobar que no existan nombres duplicados por grupo muscular
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

-- Resumen de ejercicios canónicos en producción
SELECT mg.name AS grupo, COUNT(e.id) AS total_ejercicios
FROM public.exercises e
JOIN public.muscle_groups mg ON mg.id = e.muscle_group_id
GROUP BY mg.name
ORDER BY mg.name;
