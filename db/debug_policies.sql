-- Debug: Verificar estado de RLS y políticas

-- 1. Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'reservas';

-- 2. Verificar políticas activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'reservas';

-- 3. Verificar usuario específico
SELECT id, email, rol, activo 
FROM usuarios 
WHERE email = 'gcp@slepvalparaiso.cl';

-- 4. Test de política INSERT (esto debería fallar para funcionario)
-- NO EJECUTAR, solo para referencia:
-- INSERT INTO reservas (fecha, hora_inicio, hora_fin, sala_id, usuario_id, proposito)
-- VALUES ('2025-11-10', '10:00', '11:00', 1, '45c87585-f4d3-4ff8-9bd2-dcb1181a0da2', 'Test');

-- 5. Forzar RLS si no está habilitado
ALTER TABLE reservas FORCE ROW LEVEL SECURITY;