-- Debug: Verificar estado de RLS y políticas (versión corregida)

-- 1. Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'reservas';

-- 2. Verificar políticas activas
SELECT schemaname, tablename, policyname, permissive, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'reservas';

-- 3. Verificar usuario específico
SELECT id, email, rol, activo 
FROM usuarios 
WHERE email = 'gcp@slepvalparaiso.cl';

-- 4. Forzar RLS
ALTER TABLE reservas FORCE ROW LEVEL SECURITY;

-- 5. Verificar RLS después del FORCE
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'reservas';