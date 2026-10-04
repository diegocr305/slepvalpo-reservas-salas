-- =============================================================================
-- Correcciones de seguridad detectadas por el linter de Supabase (04/10/2026)
-- Alcance: SOLO objetos del sistema de Reservas.
-- NO incluir las vistas v_oirs_* (pertenecen al sistema OIRS, otro proyecto que
-- comparte la misma base; que las corrija su responsable).
-- Ejecutar en el SQL Editor de Supabase (producción).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) RLS en historial_reservas (error: rls_disabled_in_public)
--    La tabla la llenan triggers/funciones SECURITY DEFINER (no el frontend),
--    por lo que basta con permitir LECTURA a usuarios autenticados. Al no crear
--    políticas de INSERT/UPDATE/DELETE, RLS las bloquea: el historial queda
--    inmutable para los usuarios, pero la auditoría automática sigue operando.
-- -----------------------------------------------------------------------------
ALTER TABLE historial_reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver el historial" ON historial_reservas
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Verificación RLS
SELECT relrowsecurity AS rls_activo
FROM pg_class WHERE relname = 'historial_reservas';

-- -----------------------------------------------------------------------------
-- 2) Vistas SECURITY DEFINER del sistema de Reservas (error: security_definer_view)
--    Se cambian a security_invoker SIN tocar su consulta interna, para que
--    respeten el RLS y los permisos del usuario que consulta.
-- -----------------------------------------------------------------------------
ALTER VIEW public.vista_reservas_completa SET (security_invoker = on);
ALTER VIEW public.vista_historial_completo SET (security_invoker = on);

-- Verificación vistas
SELECT c.relname AS vista,
       (SELECT option_value
        FROM pg_options_to_table(c.reloptions)
        WHERE option_name = 'security_invoker') AS security_invoker
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('vista_reservas_completa', 'vista_historial_completo');

-- -----------------------------------------------------------------------------
-- ROLLBACK (si algo dejara de verse en la app tras el punto 2):
--   ALTER VIEW public.vista_reservas_completa  SET (security_invoker = off);
--   ALTER VIEW public.vista_historial_completo SET (security_invoker = off);
-- -----------------------------------------------------------------------------
