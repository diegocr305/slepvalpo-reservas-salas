-- Políticas RLS para sistema de roles
-- Controla permisos según rol del usuario

-- Habilitar RLS en tabla reservas
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Todos pueden ver reservas
CREATE POLICY "Todos pueden ver reservas" ON reservas
    FOR SELECT
    USING (true);

-- Política para INSERT: Solo admin y subdirector pueden crear
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

-- Política para UPDATE: Solo admin y subdirector pueden editar
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

-- Política para DELETE: Solo admin y super_admin pueden eliminar
CREATE POLICY "Solo admin y super_admin pueden eliminar reservas" ON reservas
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.rol IN ('admin', 'super_admin')
            AND usuarios.activo = true
        )
    );

-- Función helper para obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT rol 
        FROM usuarios 
        WHERE id = auth.uid() 
        AND activo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;