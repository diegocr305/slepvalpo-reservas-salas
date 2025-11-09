-- Corregir política SELECT para permitir ver disponibilidad pero restringir creación

-- Eliminar política SELECT actual
DROP POLICY IF EXISTS "select_reservas" ON reservas;

-- Crear nueva política SELECT: Todos pueden ver reservas (para disponibilidad)
-- Pero en "Mis Reservas" se filtra por usuario_id en el frontend
CREATE POLICY "select_reservas" ON reservas
    FOR SELECT
    USING (true);

-- Verificar políticas
SELECT policyname, cmd, permissive, qual, with_check 
FROM pg_policies 
WHERE tablename = 'reservas';