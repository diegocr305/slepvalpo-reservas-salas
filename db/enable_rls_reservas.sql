-- Habilitar RLS y crear políticas correctas para reservas

-- 1. Habilitar RLS en la tabla reservas
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Todos pueden ver reservas" ON reservas;
DROP POLICY IF EXISTS "Solo admin y subdirector pueden crear reservas" ON reservas;
DROP POLICY IF EXISTS "Solo admin y subdirector pueden editar reservas" ON reservas;
DROP POLICY IF EXISTS "Solo admin y super_admin pueden eliminar reservas" ON reservas;

-- 3. Crear políticas nuevas

-- SELECT: Usuarios solo pueden ver sus propias reservas
CREATE POLICY "select_reservas" ON reservas
    FOR SELECT
    USING (
        usuario_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.rol IN ('admin', 'super_admin')
            AND usuarios.activo = true
        )
    );

-- INSERT: Solo admin, subdirector y super_admin pueden crear
CREATE POLICY "insert_reservas" ON reservas
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.rol IN ('admin', 'subdirector', 'super_admin')
            AND usuarios.activo = true
        )
    );

-- UPDATE: Solo admin, subdirector y super_admin pueden editar
CREATE POLICY "update_reservas" ON reservas
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.rol IN ('admin', 'subdirector', 'super_admin')
            AND usuarios.activo = true
        )
    );

-- DELETE: Solo admin y super_admin pueden eliminar
CREATE POLICY "delete_reservas" ON reservas
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.rol IN ('admin', 'super_admin')
            AND usuarios.activo = true
        )
    );

-- 4. Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reservas';

-- 5. Habilitar RLS en vista_reservas_completa si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vista_reservas_completa') THEN
        ALTER TABLE vista_reservas_completa ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "select_vista_reservas" ON vista_reservas_completa;
        
        CREATE POLICY "select_vista_reservas" ON vista_reservas_completa
            FOR SELECT
            USING (
                usuario_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM usuarios 
                    WHERE usuarios.id = auth.uid() 
                    AND usuarios.rol IN ('admin', 'super_admin')
                    AND usuarios.activo = true
                )
            );
    END IF;
END $$;

-- 6. Verificar políticas creadas
SELECT policyname, cmd, permissive, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('reservas', 'vista_reservas_completa');