-- Arreglar política DELETE para permitir que subdirectores eliminen sus propias reservas

-- Eliminar política actual
DROP POLICY IF EXISTS "Solo admin y super_admin pueden eliminar reservas" ON reservas;

-- Crear nueva política que permite:
-- 1. Admin y super_admin: eliminar cualquier reserva
-- 2. Subdirector: eliminar solo sus propias reservas
CREATE POLICY "Permisos de eliminación por rol" ON reservas
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.activo = true
            AND (
                -- Admin y super_admin pueden eliminar cualquier reserva
                usuarios.rol IN ('admin', 'super_admin')
                OR 
                -- Subdirector puede eliminar solo sus propias reservas
                (usuarios.rol = 'subdirector' AND reservas.usuario_id = auth.uid())
            )
        )
    );

-- Verificar que la política se aplicó correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reservas' AND cmd = 'DELETE';