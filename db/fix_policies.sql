-- Corregir políticas para que solo admin y subdirector puedan crear reservas
-- Los funcionarios solo pueden ver

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Solo admin y subdirector pueden crear reservas" ON reservas;
DROP POLICY IF EXISTS "Solo admin y subdirector pueden editar reservas" ON reservas;

-- Recrear política de INSERT: Solo admin y subdirector
CREATE POLICY "Solo admin y subdirector pueden crear reservas" ON reservas
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.rol IN ('admin', 'subdirector', 'super_admin')
            AND usuarios.activo = true
        )
    );

-- Recrear política de UPDATE: Solo admin y subdirector
CREATE POLICY "Solo admin y subdirector pueden editar reservas" ON reservas
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.rol IN ('admin', 'subdirector', 'super_admin')
            AND usuarios.activo = true
        )
    );

-- Verificar políticas activas
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reservas';