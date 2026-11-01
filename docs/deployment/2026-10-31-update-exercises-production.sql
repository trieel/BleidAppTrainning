-- =========================================================================================
-- Script de Actualización en Caliente: Nombres Argentinos, Guías Biomecánicas y Nuevos Ejercicios
-- Destino: PostgreSQL en Producción (Supabase)
-- Fecha: 2026-10-31
-- Descripción:
--   1. Renombra ejercicios existentes a la terminología estándar y rioplatense (ej. serrucho,
--      banco Scott, estocadas, press plano, vuelos laterales).
--   2. Actualiza descripciones con la guía técnica biomecánica rápida (setup, ROM, estiramiento).
--   3. Carga tips de modificación articular.
--   4. Inserta nuevos ejercicios clave si no existen aún en la base de datos.
-- =========================================================================================

BEGIN;
-- 0. Asegurar existencia de la columna aliases (text[]) para búsqueda inteligente (Fuse.js) y taxonomía multilingüe
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS aliases text[] DEFAULT ARRAY[]::text[];


-- 1. Renombrar ejercicios existentes manteniendo claves foráneas e historiales
UPDATE public.exercises SET name = 'Press plano con barra' WHERE name ILIKE 'Press banca con barra';
UPDATE public.exercises SET name = 'Curl araña en banco inclinado' WHERE name ILIKE 'Curl arana en banco inclinado';
UPDATE public.exercises SET name = 'Remo con mancuerna a una mano (serrucho)' WHERE name ILIKE 'Remo a una mano';
UPDATE public.exercises SET name = 'Curl Scott en banco (predicador)' WHERE name ILIKE 'Curl predicador';
UPDATE public.exercises SET name = 'Press francés con barra (rompecráneos)' WHERE name ILIKE 'Rompecraneos';
UPDATE public.exercises SET name = 'Vuelos laterales con mancuernas' WHERE name ILIKE 'Elevaciones laterales';
UPDATE public.exercises SET name = 'Vuelos laterales en polea' WHERE name ILIKE 'Elevacion lateral en cable';
UPDATE public.exercises SET name = 'Vuelos posteriores (pájaros)' WHERE name ILIKE 'Vuelo posterior';
UPDATE public.exercises SET name = 'Estocadas hacia atrás con mancuernas' WHERE name ILIKE 'Zancada hacia atras';
UPDATE public.exercises SET name = 'Estocadas caminando con mancuernas' WHERE name ILIKE 'Zancadas caminando';
UPDATE public.exercises SET name = 'Jalón al pecho en polea' WHERE name ILIKE 'Jalon al pecho';
UPDATE public.exercises SET name = 'Sillón de cuadríceps (extensiones)' WHERE name ILIKE 'Extension de piernas';
UPDATE public.exercises SET name = 'Camilla femoral acostado' WHERE name ILIKE 'Curl femoral acostado';
UPDATE public.exercises SET name = 'Sillón de isquiotibiales (femoral sentado)' WHERE name ILIKE 'Curl femoral sentado';
UPDATE public.exercises SET name = 'Gemelos de pie en máquina' WHERE name ILIKE 'Elevacion de pantorrillas';
UPDATE public.exercises SET name = 'Gemelos sentado en máquina (sóleo)' WHERE name ILIKE 'Elevacion de pantorrillas sentado';
UPDATE public.exercises SET name = 'Extensiones de tríceps en polea con soga' WHERE name ILIKE 'Extension de triceps en polea con cuerda';
UPDATE public.exercises SET name = 'Extensiones de tríceps en polea alta' WHERE name ILIKE 'Jalon de triceps en polea';
UPDATE public.exercises SET name = 'Flexiones de pecho (lagartijas)' WHERE name ILIKE 'Flexiones de brazos';
UPDATE public.exercises SET name = 'Cruces en poleas para pecho' WHERE name ILIKE 'Cruce de cables';
UPDATE public.exercises SET name = 'Prensa a 45°' WHERE name ILIKE 'Prensa 45 grados';
UPDATE public.exercises SET name = 'Rueda abdominal (Ab Roller)' WHERE name ILIKE 'Rueda abdominal (Ab wheel)';
UPDATE public.exercises SET name = 'Elevación de rodillas colgado en barra' WHERE name ILIKE 'Elevacion de rodillas colgado';
UPDATE public.exercises SET name = 'Subidas al cajón' WHERE name ILIKE 'Subida al cajon';
UPDATE public.exercises SET name = 'Puente de glúteos' WHERE name ILIKE 'Puente de gluteos';
UPDATE public.exercises SET name = 'Press de pecho en máquina' WHERE name ILIKE 'Press de pecho en maquina';
UPDATE public.exercises SET name = 'Press inclinado en máquina Smith' WHERE name ILIKE 'Press inclinado en maquina Smith';
UPDATE public.exercises SET name = 'Press militar en máquina Smith' WHERE name ILIKE 'Press militar en maquina Smith';
UPDATE public.exercises SET name = 'Press de hombros con mancuernas sentado' WHERE name ILIKE 'Press de hombros con mancuernas';
UPDATE public.exercises SET name = 'Face pull en polea alta' WHERE name ILIKE 'Face pull';
UPDATE public.exercises SET name = 'Face pull con rotación externa' WHERE name ILIKE 'Face pull con rotacion externa';
UPDATE public.exercises SET name = 'Hiperextensiones a 45° para glúteo' WHERE name ILIKE 'Hiperextensiones a 45 grados para gluteo';

-- 2. Actualizar guía rápida técnica del Curl Inclinado con Mancuernas
UPDATE public.exercises
SET description = 'Banco inclinado a 45°-60° con brazos en hiperextensión de hombro. Flexiona los codos manteniendo los brazos fijos hacia atrás para aislar la cabeza larga del bíceps sin balanceo del torso.',
    modification_tip = 'Si sientes molestia en la cara anterior del hombro, sube el banco a 70° o realiza curl martillo de pie.'
WHERE name ILIKE 'Curl inclinado con mancuernas';

-- 3. Actualizar descripciones biomecánicas de los ejercicios de Pecho
UPDATE public.exercises
SET description = 'Espalda con retracción escapular y pies firmes en el piso. Desciende la barra controlada al esternón medio y empuja en línea vertical sin desarmar las escápulas.',
    modification_tip = 'Mantén las muñecas completamente neutras y firmes. Si persiste molestia, usa mancuernas con agarre semi-neutro.'
WHERE name ILIKE 'Press plano con barra';

UPDATE public.exercises
SET description = 'Banco a 30°-45°. Empuja las mancuernas enfocando el haz clavicular superior del pectoral, con hombros apoyados en el respaldo.',
    modification_tip = 'Evita inclinar el banco más de 45° para no transferir la carga al deltoides anterior.'
WHERE name ILIKE 'Press inclinado con mancuernas';

UPDATE public.exercises
SET description = 'Ajusta el asiento para que las empuñaduras queden al centro del pecho. Empuja con trayectoria guiada concentrándote en la contracción.',
    modification_tip = 'Ajusta el recorrido para no hiper-extender el hombro hacia atrás al inicio.'
WHERE name ILIKE 'Press de pecho en máquina';

UPDATE public.exercises
SET description = 'Torso ligeramente inclinado al frente y codos semi-flexionados. Junta las manos al frente sintiendo la contracción máxima del pectoral.',
    modification_tip = 'Excelente estímulo de aislamiento sin impacto sobre las articulaciones.'
WHERE name ILIKE 'Cruces en poleas para pecho';

UPDATE public.exercises
SET description = 'Cuerpo en línea recta de talones a cabeza y abdomen tenso. Baja hasta que el pecho roce el suelo y empuja con potencia.',
    modification_tip = 'Usa apoyos para flexiones o mancuernas hexagonales si te molestan las muñecas.'
WHERE name ILIKE 'Flexiones de pecho (lagartijas)';

UPDATE public.exercises
SET description = 'En banco plano con ligera flexión de codos fija. Abre los brazos sintiendo el estiramiento en el pectoral sin bajar de la línea de los hombros.',
    modification_tip = 'No bajes los codos más allá de la línea del banco para proteger la cápsula anterior del hombro.'
WHERE name ILIKE 'Aperturas con mancuernas';

UPDATE public.exercises
SET description = 'Inclina el torso 30° hacia adelante con codos apuntando hacia afuera para concentrar la carga en las fibras inferiores del pectoral.',
    modification_tip = 'Inclina el torso hacia adelante; si notas molestia en hombros, reduce la profundidad a 90°.'
WHERE name ILIKE 'Fondos en paralelas (pecho)';

-- 4. Actualizar descripciones biomecánicas de Espalda
UPDATE public.exercises
SET description = 'Pies al ancho de caderas y barra pegada a las espinillas. Empuja el piso con las piernas manteniendo la columna neutra y traba la cadera arriba.',
    modification_tip = 'Usa remo con apoyo de pecho o peso muerto rumano como alternativa si tienes fatiga lumbar.'
WHERE name ILIKE 'Peso muerto convencional';

UPDATE public.exercises
SET description = 'Sentado en la dorsalera con muslos fijados. Tracciona la barra hacia la clavícula sacando pecho y apretando los dorsales sin balancear el torso.'
WHERE name ILIKE 'Jalón al pecho en polea';

UPDATE public.exercises
SET description = 'Rodilla y mano apoyadas en banco. Tracciona la mancuerna hacia la cadera en arco llevando el codo hacia atrás sin rotar el torso.'
WHERE name ILIKE 'Remo con mancuerna a una mano (serrucho)';

UPDATE public.exercises
SET description = 'Torso inclinado a 45° con columna lumbar neutra. Tracciona la barra al ombligo pegando los codos al cuerpo.',
    modification_tip = 'Usa remo con apoyo de pecho si tienes molestias en la zona baja de la espalda.'
WHERE name ILIKE 'Remo con barra';

-- 5. Actualizar descripciones biomecánicas de Piernas, Glúteos y Brazos
UPDATE public.exercises
SET description = 'Barra sobre los trapecios y pies al ancho de hombros. Desciende flexionando rodillas y cadera manteniendo el pecho erguido y talones apoyados.',
    modification_tip = 'Prueba prensa de piernas o sentadilla con cinturón para descargar la espalda.'
WHERE name ILIKE 'Sentadilla trasera';

UPDATE public.exercises
SET description = 'Espalda baja pegada al respaldo. Desciende la plataforma hasta 90° de flexión y empuja desde los talones sin bloquear las rodillas.',
    modification_tip = 'Reduce el rango y la carga si aparece molestia articular en la rótula.'
WHERE name ILIKE 'Prensa de piernas';

UPDATE public.exercises
SET description = 'Paso hacia atrás flexionando ambas rodillas a 90° con torso erguido. Mucho más amable con las rodillas que las estocadas frontales.'
WHERE name ILIKE 'Estocadas hacia atrás con mancuernas';

UPDATE public.exercises
SET description = 'Espalda apoyada y rodillas alineadas con el eje de la máquina. Extiende las piernas y pausa 1 segundo en la contracción máxima.',
    modification_tip = 'Evita bloquear bruscamente la articulación arriba si tienes antecedentes de rótula.'
WHERE name ILIKE 'Sillón de cuadríceps (extensiones)';

UPDATE public.exercises
SET description = 'Boca abajo con rodillo tras los tobillos. Flexiona las rodillas llevando los talones a los glúteos sin despegar la pelvis de la camilla.'
WHERE name ILIKE 'Camilla femoral acostado';

UPDATE public.exercises
SET description = 'Sentado con muslos fijados por la almohadilla. Flexiona hacia abajo logrando un mayor estiramiento gracias a la flexión de cadera.'
WHERE name ILIKE 'Sillón de isquiotibiales (femoral sentado)';

UPDATE public.exercises
SET description = 'Brazos apoyados en la almohadilla del banco Scott. Elimina el impulso del cuerpo y enfoca la contracción en el braquial y cabeza corta.',
    modification_tip = 'Usa barra W o agarre neutro para evitar sobrecarga en la articulación de la muñeca.'
WHERE name ILIKE 'Curl Scott en banco (predicador)';

UPDATE public.exercises
SET description = 'Acostado en banco con barra recta o W. Flexiona los codos llevando la barra hacia la frente o coronilla manteniendo los codos cerrados.',
    modification_tip = 'Usa barra W para reducir el estrés articular en las muñecas y codos.'
WHERE name ILIKE 'Press francés con barra (rompecráneos)';

UPDATE public.exercises
SET description = 'Tracciona la soga hacia abajo y separa los extremos al final del movimiento para activar con intensidad la cabeza lateral del tríceps.'
WHERE name ILIKE 'Extensiones de tríceps en polea con soga';

UPDATE public.exercises
SET description = 'De pie frente a la polea alta con barra recta o V. Empuja hacia abajo bloqueando los codos a los costados del cuerpo.'
WHERE name ILIKE 'Extensiones de tríceps en polea alta';

UPDATE public.exercises
SET description = 'Codos semi-flexionados y torso neutro. Eleva los brazos hacia los lados hasta la altura de los hombros guiando con los codos.',
    modification_tip = 'Inclina el torso 5° hacia adelante para alinear el deltoides lateral con la gravedad.'
WHERE name ILIKE 'Vuelos laterales con mancuernas';

-- 6. Insertar nuevos ejercicios clave (si no existen aún)

-- 5. Poblar taxonomía de alias multilingüe e inglesa para los ejercicios estándar
UPDATE public.exercises SET aliases = ARRAY['bench press', 'barbell bench press', 'press banca', 'banca plana', 'pecho plano', 'pecho'] WHERE name ILIKE 'Press plano con barra';
UPDATE public.exercises SET aliases = ARRAY['dumbbell bench press', 'db bench press', 'press banca con mancuernas', 'pecho con mancuernas'] WHERE name ILIKE 'Press plano con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['incline dumbbell press', 'incline db press', 'press inclinado', 'pecho alto'] WHERE name ILIKE 'Press inclinado con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['chest press machine', 'machine chest press', 'press maquina pecho'] WHERE name ILIKE 'Press de pecho en máquina';
UPDATE public.exercises SET aliases = ARRAY['cable crossover', 'cable flyes', 'cruce de cables', 'cruces polea'] WHERE name ILIKE 'Cruces en poleas para pecho';
UPDATE public.exercises SET aliases = ARRAY['push ups', 'pushups', 'lagartijas', 'flexiones de brazos'] WHERE name ILIKE 'Flexiones de pecho (lagartijas)';
UPDATE public.exercises SET aliases = ARRAY['pec deck', 'peck deck', 'machine fly', 'contractora de pecho', 'mariposa'] WHERE name ILIKE 'Aperturas en máquina (Pec Deck)';
UPDATE public.exercises SET aliases = ARRAY['chest dips', 'dips', 'fondos en paralelas', 'paralelas'] WHERE name ILIKE 'Fondos en paralelas (pecho)';
UPDATE public.exercises SET aliases = ARRAY['deadlift', 'conventional deadlift', 'peso muerto', 'pmo'] WHERE name ILIKE 'Peso muerto convencional';
UPDATE public.exercises SET aliases = ARRAY['lat pulldown', 'pulldown', 'jalon al pecho', 'dorsalera', 'jalon'] WHERE name ILIKE 'Jalón al pecho en polea';
UPDATE public.exercises SET aliases = ARRAY['seated cable row', 'cable row', 'remo sentado', 'remo polea'] WHERE name ILIKE 'Remo sentado en cable';
UPDATE public.exercises SET aliases = ARRAY['barbell row', 'bent over row', 'remo barra'] WHERE name ILIKE 'Remo con barra';
UPDATE public.exercises SET aliases = ARRAY['serrucho', 'one arm dumbbell row', 'single arm db row', 'remo mancuerna'] WHERE name ILIKE 'Remo con mancuerna a una mano (serrucho)';
UPDATE public.exercises SET aliases = ARRAY['back squat', 'barbell squat', 'sentadilla con barra', 'sentadillas'] WHERE name ILIKE 'Sentadilla trasera';
UPDATE public.exercises SET aliases = ARRAY['leg press', 'prensa de piernas', 'prensa'] WHERE name ILIKE 'Prensa de piernas';
UPDATE public.exercises SET aliases = ARRAY['45 degree leg press', 'incline leg press', 'prensa a 45 grados'] WHERE name ILIKE 'Prensa a 45°';
UPDATE public.exercises SET aliases = ARRAY['leg extension', 'leg extensions', 'extension de piernas', 'sillon de cuadriceps'] WHERE name ILIKE 'Sillón de cuadríceps (extensiones)';
UPDATE public.exercises SET aliases = ARRAY['bulgarian split squat', 'bulgaras', 'sentadilla bulgara'] WHERE name ILIKE 'Sentadilla búlgara';
UPDATE public.exercises SET aliases = ARRAY['hip thrust', 'barbell hip thrust', 'puente de gluteo con barra', 'empuje de cadera'] WHERE name ILIKE 'Hip thrust con barra';
UPDATE public.exercises SET aliases = ARRAY['glute bridge', 'puente de gluteos', 'puente de gluteo'] WHERE name ILIKE 'Puente de glúteos';
UPDATE public.exercises SET aliases = ARRAY['romanian deadlift', 'rdl', 'barbell rdl', 'peso muerto rumano'] WHERE name ILIKE 'Peso muerto rumano';
UPDATE public.exercises SET aliases = ARRAY['dumbbell rdl', 'db romanian deadlift', 'rdl mancuernas'] WHERE name ILIKE 'Peso muerto rumano con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['lying leg curl', 'lying hamstring curl', 'camilla femoral', 'curl femoral acostado'] WHERE name ILIKE 'Camilla femoral acostado';
UPDATE public.exercises SET aliases = ARRAY['seated leg curl', 'seated hamstring curl', 'sillon de isquiotibiales', 'curl femoral sentado'] WHERE name ILIKE 'Sillón de isquiotibiales (femoral sentado)';
UPDATE public.exercises SET aliases = ARRAY['standing calf raise', 'calf raises', 'gemelos de pie', 'pantorrillas de pie'] WHERE name ILIKE 'Gemelos de pie en máquina';
UPDATE public.exercises SET aliases = ARRAY['seated calf raise', 'soleus raise', 'soleo', 'gemelos sentado'] WHERE name ILIKE 'Gemelos sentado en máquina (sóleo)';
UPDATE public.exercises SET aliases = ARRAY['overhead press', 'ohp', 'barbell military press', 'press militar'] WHERE name ILIKE 'Press militar con barra';
UPDATE public.exercises SET aliases = ARRAY['dumbbell lateral raise', 'lateral raises', 'vuelos laterales', 'elevaciones laterales'] WHERE name ILIKE 'Vuelos laterales con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['cable lateral raise', 'side lateral cable', 'vuelos en polea'] WHERE name ILIKE 'Vuelos laterales en polea';
UPDATE public.exercises SET aliases = ARRAY['rear delt fly', 'rear delt flyes', 'pajaros', 'vuelos posteriores'] WHERE name ILIKE 'Vuelos posteriores (pájaros)';
UPDATE public.exercises SET aliases = ARRAY['incline dumbbell curl', 'incline curl', 'curl inclinado', 'biceps cabeza larga'] WHERE name ILIKE 'Curl inclinado con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['preacher curl', 'scott curl', 'banco scott', 'curl predicador'] WHERE name ILIKE 'Curl Scott en banco (predicador)';
UPDATE public.exercises SET aliases = ARRAY['barbell curl', 'barbell bicep curl', 'curl barra', 'biceps'] WHERE name ILIKE 'Curl de bíceps con barra';
UPDATE public.exercises SET aliases = ARRAY['dumbbell curl', 'db bicep curl', 'curl mancuernas'] WHERE name ILIKE 'Curl de bíceps con mancuernas';
UPDATE public.exercises SET aliases = ARRAY['hammer curl', 'dumbbell hammer curl', 'curl martillo'] WHERE name ILIKE 'Curl martillo';
UPDATE public.exercises SET aliases = ARRAY['skull crusher', 'skullcrusher', 'lying triceps extension', 'french press', 'rompecraneos'] WHERE name ILIKE 'Press francés con barra (rompecráneos)';
UPDATE public.exercises SET aliases = ARRAY['tricep pushdown', 'cable tricep extension', 'extension triceps polea'] WHERE name ILIKE 'Extensiones de tríceps en polea alta';
UPDATE public.exercises SET aliases = ARRAY['rope pushdown', 'tricep rope pushdown', 'extension triceps soga'] WHERE name ILIKE 'Extensiones de tríceps en polea con soga';
UPDATE public.exercises SET aliases = ARRAY['plank', 'abdominal plank', 'plancha frontal', 'plancha'] WHERE name ILIKE 'Plancha frontal';
UPDATE public.exercises SET aliases = ARRAY['ab wheel', 'ab roller', 'rueda abdominal'] WHERE name ILIKE 'Rueda abdominal (Ab Roller)';

DO $
DECLARE
    chest_id uuid;
    back_id uuid;
    quad_id uuid;
    glute_id uuid;
    shoulder_id uuid;
    biceps_id uuid;
    triceps_id uuid;
    core_id uuid;
    cardio_id uuid;
BEGIN
    SELECT id INTO chest_id FROM public.muscle_groups WHERE name ILIKE 'Pecho' LIMIT 1;
    SELECT id INTO back_id FROM public.muscle_groups WHERE name ILIKE 'Espalda' LIMIT 1;
    SELECT id INTO quad_id FROM public.muscle_groups WHERE name ILIKE 'Cuadriceps' LIMIT 1;
    SELECT id INTO glute_id FROM public.muscle_groups WHERE name ILIKE 'Gluteos' LIMIT 1;
    SELECT id INTO shoulder_id FROM public.muscle_groups WHERE name ILIKE 'Hombros' LIMIT 1;
    SELECT id INTO biceps_id FROM public.muscle_groups WHERE name ILIKE 'Biceps' LIMIT 1;
    SELECT id INTO triceps_id FROM public.muscle_groups WHERE name ILIKE 'Triceps' LIMIT 1;
    SELECT id INTO core_id FROM public.muscle_groups WHERE name ILIKE 'Core' LIMIT 1;
    SELECT id INTO cardio_id FROM public.muscle_groups WHERE name ILIKE 'Cardio' LIMIT 1;

    -- Press plano con mancuernas
    IF chest_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Press plano con mancuernas' AND muscle_group_id = chest_id) THEN
        INSERT INTO public.exercises (id, muscle_group_id, name, description, equipment, level, contraindications, modification_tip, aliases)
        VALUES (gen_random_uuid(), chest_id, 'Press plano con mancuernas',
                'En banco plano, desciende las mancuernas con codos a 45°-60° respecto al torso. Empuja convergiendo en la parte alta sin golpear las pesas.',
                'Dumbbell', 'Beginner', ARRAY[]::text[], 'Excelente alternativa articular al press con barra para muñecas u hombros.');
    END IF;

    -- Dominadas libres (peso corporal)
    IF back_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Dominadas libres (peso corporal)' AND muscle_group_id = back_id) THEN
        INSERT INTO public.exercises (id, muscle_group_id, name, description, equipment, level, contraindications, modification_tip, aliases)
        VALUES (gen_random_uuid(), back_id, 'Dominadas libres (peso corporal)',
                'Agarre prono ligeramente más ancho que los hombros. Tracciona llevando el pecho hacia la barra contrayendo dorsales y baja controlado.',
                'Bodyweight', 'Advanced', ARRAY['Shoulder']::text[], 'Si no completas las repeticiones, usa banda elástica o la máquina de dominadas asistidas.', ARRAY['pull ups', 'pullups', 'chin ups', 'dominadas', 'traccion vertical']::text[]);
    END IF;

    -- Sentadilla en máquina Smith
    IF quad_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Sentadilla en máquina Smith' AND muscle_group_id = quad_id) THEN
        INSERT INTO public.exercises (id, muscle_group_id, name, description, equipment, level, contraindications, modification_tip, aliases)
        VALUES (gen_random_uuid(), quad_id, 'Sentadilla en máquina Smith',
                'Pies ligeramente adelantados para enfatizar los cuádriceps y reducir la carga sobre la zona lumbar gracias a la guía vertical.',
                'Machine', 'Intermediate', ARRAY['Knee']::text[], 'Asegura que las rodillas no colapsen hacia adentro al empujar.', ARRAY['smith machine squat', 'smith squat', 'sentadilla smith']::text[]);
    END IF;

    -- Hip thrust en máquina
    IF glute_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Hip thrust en máquina' AND muscle_group_id = glute_id) THEN
        INSERT INTO public.exercises (id, muscle_group_id, name, description, equipment, level, contraindications, modification_tip, aliases)
        VALUES (gen_random_uuid(), glute_id, 'Hip thrust en máquina',
                'Variante guiada con respaldo y ajuste rápido. Facilita la sobrecarga progresiva sin la incomodidad de armar la barra en el piso.',
                'Machine', 'Beginner', ARRAY[]::text[], 'Muy recomendada para iniciación o cargas elevadas con seguridad.', ARRAY['machine hip thrust', 'hip thrust machine', 'hip thrust en maquina']::text[]);
    END IF;

    -- Press militar sentado con mancuernas
    IF shoulder_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Press militar sentado con mancuernas' AND muscle_group_id = shoulder_id) THEN
        INSERT INTO public.exercises (id, muscle_group_id, name, description, equipment, level, contraindications, modification_tip, aliases)
        VALUES (gen_random_uuid(), shoulder_id, 'Press militar sentado con mancuernas',
                'Variante sentada estricta con mancuernas. Ofrece máxima estabilidad lumbar para empujar verticalmente con sobrecarga progresiva.',
                'Dumbbell', 'Beginner', ARRAY['Shoulder']::text[], 'Mantén el respaldo a 75°-80° para no arquear la zona lumbar.', ARRAY['seated dumbbell overhead press', 'seated db ohp', 'press militar sentado']::text[]);
    END IF;

    -- Curl martillo en polea con soga
    IF biceps_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Curl martillo en polea con soga' AND muscle_group_id = biceps_id) THEN
        INSERT INTO public.exercises (id, muscle_group_id, name, description, equipment, level, contraindications, modification_tip, aliases)
        VALUES (gen_random_uuid(), biceps_id, 'Curl martillo en polea con soga',
                'Agarre de soga en polea baja con palmas enfrentadas. Proporciona tensión constante para braquial y antebrazos sin puntos muertos.',
                'Cable', 'Beginner', ARRAY[]::text[], 'Mantén los codos pegados a los costados del cuerpo.', ARRAY['cable hammer curl', 'rope hammer curl', 'curl martillo polea con soga']::text[]);
    END IF;

    -- Extensiones tras nuca en polea con soga
    IF triceps_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Extensiones tras nuca en polea con soga' AND muscle_group_id = triceps_id) THEN
        INSERT INTO public.exercises (id, muscle_group_id, name, description, equipment, level, contraindications, modification_tip, aliases)
        VALUES (gen_random_uuid(), triceps_id, 'Extensiones tras nuca en polea con soga',
                'De espaldas a la polea en posición de estocada. Extiende los brazos hacia adelante colocando la cabeza larga del tríceps en estiramiento.',
                'Cable', 'Intermediate', ARRAY['Shoulder']::text[], 'Abre la soga al final del recorrido para mayor activación lateral.', ARRAY['overhead cable tricep extension', 'overhead rope extension', 'triceps tras nuca']::text[]);
    END IF;

    -- Abdominales crunch en colchoneta
    IF core_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Abdominales crunch en colchoneta' AND muscle_group_id = core_id) THEN
        INSERT INTO public.exercises (id, muscle_group_id, name, description, equipment, level, contraindications, modification_tip, aliases)
        VALUES (gen_random_uuid(), core_id, 'Abdominales crunch en colchoneta',
                'Rodillas flexionadas y lumbares apoyadas. Eleva los omóplatos flexionando la columna torácica sin forzar el cuello.',
                'Bodyweight', 'Beginner', ARRAY[]::text[], 'Cruza los brazos en el pecho o coloca las manos en las sienes sin tirar de la nuca.', ARRAY['crunches', 'ab crunch', 'abdominales crunch']::text[]);
    END IF;

    -- Bicicleta de aire (Air Bike / Assault Bike)
    IF cardio_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Bicicleta de aire (Air Bike / Assault Bike)' AND muscle_group_id = cardio_id) THEN
        INSERT INTO public.exercises (id, muscle_group_id, name, description, equipment, level, contraindications, modification_tip, aliases)
        VALUES (gen_random_uuid(), cardio_id, 'Bicicleta de aire (Air Bike / Assault Bike)',
                'Cardio de alta intensidad de cuerpo entero donde la resistencia por viento aumenta exponencialmente con el esfuerzo del atleta.',
                'Machine', 'Intermediate', ARRAY[]::text[], 'Ideal para protocolos HIIT o tabatas cortos de máxima exigencia.', ARRAY['air bike', 'assault bike', 'echo bike', 'bici de aire']::text[]);
    END IF;
END $$;

COMMIT;
