-- Configurar zona horaria de Chile en Supabase
-- Ejecutar estos comandos en el SQL Editor de Supabase

-- 1. Verificar zona horaria actual
SELECT current_setting('timezone');

-- 2. Configurar zona horaria de Chile
SET timezone = 'America/Santiago';

-- 3. Verificar que se aplicó correctamente
SELECT current_setting('timezone');
SELECT now() AT TIME ZONE 'America/Santiago' as hora_chile;

-- 4. Hacer el cambio permanente para la sesión
ALTER DATABASE postgres SET timezone = 'America/Santiago';

-- 5. Verificar fechas actuales
SELECT 
  now() as utc_time,
  now() AT TIME ZONE 'America/Santiago' as chile_time,
  CURRENT_DATE as current_date_utc,
  (now() AT TIME ZONE 'America/Santiago')::date as current_date_chile;