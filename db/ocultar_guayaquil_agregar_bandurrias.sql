-- Ocultar sala "Guayaquil" y agregar sala "Bandurrias" (Edificio Blanco)
-- Solicitud de Lionel Claro / Guillermo Pérez (02/10/2026)
--
-- IMPORTANTE: NO se borra la sala Guayaquil ni su historial de reservas.
-- Solo se marca como inactiva (activa = false) para que deje de aparecer
-- en el formulario. Si en el futuro se necesita, se puede reactivar con:
--     UPDATE salas SET activa = true WHERE nombre = 'Guayaquil';
--
-- Ejecutar en Supabase (SQL Editor) sobre la base de datos de PRODUCCION.

-- 1) Ocultar la sala Guayaquil (conserva id, reservas e historial)
UPDATE salas
SET activa = false
WHERE nombre = 'Guayaquil';

-- 2) Agregar la nueva sala Bandurrias en el Edificio Blanco (id = 1)
--    Sin capacidad por ahora: se deja el valor por defecto del esquema.
INSERT INTO salas (nombre, edificio_id)
VALUES ('Bandurrias', 1);

-- Verificacion: Guayaquil debe quedar activa = false y Bandurrias activa = true
SELECT id, nombre, edificio_id, capacidad, activa
FROM salas
WHERE nombre IN ('Guayaquil', 'Bandurrias')
ORDER BY nombre;
