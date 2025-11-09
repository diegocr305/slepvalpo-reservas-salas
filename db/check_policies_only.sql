-- Ver políticas activas y usuario específico

-- 1. Políticas activas en reservas
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'reservas';

-- 2. Usuario específico
SELECT id, email, rol, activo 
FROM usuarios 
WHERE email = 'gcp@slepvalparaiso.cl';